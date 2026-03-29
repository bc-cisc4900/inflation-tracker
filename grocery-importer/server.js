/**
 * server.js
 * Purpose:
 * Express API server for the inflation tracker project.
 *
 * Why it exists:
 * Provides a REST API that the frontend can query for price data,
 * and allows CSV files to be uploaded to trigger imports into the database.
 *
 * Usage:
 *   node server.js
 *
 * Endpoints:
 *   GET  /api/status/:month/:week         - Check if a week/month has been imported
 *   POST /api/import/:month/:week         - Upload a CSV file to trigger an import
 *   GET  /api/prices                      - Get all prices
 *   GET  /api/prices/:itemId              - Get prices for a specific item
 *   GET  /api/prices/store/:storeId       - Get prices for a specific store
 *   GET  /api/items                       - Get all items
 *   GET  /api/stores                      - Get all stores
 *
 * Note:
 *   Always use the 1st of the month as the date (e.g. 2026-02-01 for February 2026)
*/

require('dotenv').config();

const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const fs      = require('fs');
const os      = require('os');
const path    = require('path');
const mariadb = require('mariadb');

const app  = express();
const PORT = process.env.PORT || 3000;

// All stores that should always have a record, even if missing from the CSV
const ALL_STORES = ['Aldi', 'Fresh Direct', 'Key Food', 'Stop & Shop', "Trader Joe's"];

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors());  // Allow requests from the frontend on a different machine

// Multer handles CSV file uploads, storing them temporarily in /tmp
const upload = multer({ dest: os.tmpdir() });

// --- SSL CERTIFICATE (cross-platform) ---
function getSSLConfig() {
  const platform = os.platform();
  if (platform === 'win32') return true;

  const certPaths = [
    '/etc/ssl/certs/ca-certificates.crt', // Ubuntu/Linux
    '/etc/ssl/cert.pem',                  // Mac
    '/etc/pki/tls/certs/ca-bundle.crt',   // CentOS/RHEL
  ];

  for (const certPath of certPaths) {
    if (fs.existsSync(certPath)) {
      return { ca: fs.readFileSync(certPath) };
    }
  }

  console.warn('Warning: Could not find SSL certificate file, using built-in certificates.');
  return true;
}

// --- DB SETUP ---
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  ssl: getSSLConfig()
});

// --- CSV PARSER ---
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() !== '');

  return lines.map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });
}

// --- VALIDATION ---
function validateRows(dataRows, stores) {
  const errors = [];

  dataRows.forEach((row, index) => {
    const rowNum   = index + 2;
    const itemName = row[0]?.trim();
    const category = row[1]?.trim();

    if (!itemName) errors.push(`Row ${rowNum}: missing item name`);
    if (!category) errors.push(`Row ${rowNum}: missing category`);

    for (let i = 0; i < stores.length; i++) {
      const rawPrice = row[i + 2];
      const price    = parseFloat(rawPrice?.replace(/[$,]/g, ''));
      if (rawPrice && rawPrice.trim() !== '' && isNaN(price)) {
        errors.push(`Row ${rowNum} (${itemName}): invalid price "${rawPrice}" for ${stores[i]}`);
      }
    }
  });

  return errors;
}

// --- HELPERS ---
async function getStore(conn, storeName) {
  const rows = await conn.query(
    'SELECT store_id FROM stores WHERE store_name = ?', [storeName]
  );
  if (rows.length > 0) return rows[0].store_id;
  throw new Error(`Store "${storeName}" not found in database.`);
}

async function getItem(conn, itemName) {
  const rows = await conn.query(
    'SELECT item_id FROM items WHERE item_name = ?', [itemName]
  );
  if (rows.length > 0) return rows[0].item_id;
  throw new Error(`Item "${itemName}" not found in database.`);
}

async function getOrCreatePriceLink(conn, itemId, storeId) {
  const rows = await conn.query(
    'SELECT price_id FROM prices WHERE item_id = ? AND store_id = ?',
    [itemId, storeId]
  );
  if (rows.length > 0) return rows[0].price_id;

  const result = await conn.query(
    'INSERT INTO prices (item_id, store_id) VALUES (?, ?)',
    [itemId, storeId]
  );
  return Number(result.insertId);
}

async function upsertPriceRecord(conn, priceId, month, weekColumn, price) {
  const existing = await conn.query(
    'SELECT record_id FROM price_records WHERE price_id = ? AND month = ?',
    [priceId, month]
  );

  if (existing.length > 0) {
    // Update only the specific week column
    await conn.query(
      `UPDATE price_records SET ${weekColumn} = ? WHERE record_id = ?`,
      [price, existing[0].record_id]
    );
    return 'updated';
  } else {
    // Insert a new row with just this week's price
    await conn.query(
      `INSERT INTO price_records (price_id, month, ${weekColumn}) VALUES (?, ?, ?)`,
      [priceId, month, price]
    );
    return 'inserted';
  }
}

// --- ROUTES ---

// GET /api/status/:month/:week - check if a week/month has already been imported
// Example: GET /api/status/2026-02-01/1
app.get('/api/status/:month/:week', async (req, res) => {
  const { month, week } = req.params;
  const weekColumn = `week${week}`;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM-DD (e.g. 2026-02-01).' });
  }
  if (isNaN(week) || week < 1 || week > 5) {
    return res.status(400).json({ error: 'Invalid week number. Must be between 1 and 5.' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      `SELECT COUNT(*) as count FROM price_records 
       WHERE month = ? AND ${weekColumn} IS NOT NULL`,
      [month]
    );
    const count = Number(rows[0].count);
    res.json({
      month,
      week: parseInt(week),
      imported: count > 0,
      records: count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/import/:month/:week - upload a CSV and trigger an import
// Example: POST /api/import/2026-02-01/1
app.post('/api/import/:month/:week', upload.single('file'), async (req, res) => {
  const { month, week } = req.params;
  const weekColumn = `week${week}`;
  const weekNumber = parseInt(week);

  // Validate month format YYYY-MM-DD and week number
  if (!/^\d{4}-\d{2}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM-DD (e.g. 2026-02-01).' });
  }
  if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 5) {
    return res.status(400).json({ error: 'Invalid week number. Must be between 1 and 5.' });
  }

  // Check a file was uploaded
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded. Use form-data with key "file".' });
  }

  let conn;
  try {
    // Parse the uploaded CSV
    const rows = parseCSV(req.file.path);

    if (!rows || rows.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or has no data rows.' });
    }

    // Read store names from header row, skipping Store Avg. and National Avg. columns
    const header     = rows[0];
    const CSV_STORES = header.slice(2).filter(s =>
      s !== '' && s !== 'Store Avg.' && s !== 'National Avg.'
    );
    const dataRows = rows.slice(1);

    // Detect missing stores that will get a 0 price (e.g. Fresh Direct in week1/week2)
    const missingStores = ALL_STORES.filter(s => !CSV_STORES.includes(s));

    // Validate data before importing
    const validationErrors = validateRows(dataRows, CSV_STORES);
    if (validationErrors.length > 0) {
      return res.status(422).json({
        error: 'Validation failed. Fix the following issues in your CSV:',
        issues: validationErrors
      });
    }

    // Check for duplicate import
    conn = await pool.getConnection();
    const existing = await conn.query(
      `SELECT COUNT(*) as count FROM price_records 
       WHERE month = ? AND ${weekColumn} IS NOT NULL`,
      [month]
    );
    const alreadyImported = Number(existing[0].count) > 0;

    if (alreadyImported && !req.query.force) {
      return res.status(409).json({
        error: `Week ${weekNumber} for ${month} has already been imported with ${Number(existing[0].count)} records.`,
        tip: 'Add ?force=true to the URL to update existing records instead.'
      });
    }

    // Import the data
    let inserted = 0;
    let updated  = 0;
    let skipped  = 0;

    for (const row of dataRows) {
      const itemName = row[0]?.trim();
      const category = row[1]?.trim();
      if (!itemName || !category) continue;

      let itemId;
      try {
        itemId = await getItem(conn, itemName);
      } catch (err) {
        skipped++;
        continue;
      }

      // Build a price map from the CSV for this row
      const priceMap = {};
      for (let i = 0; i < CSV_STORES.length; i++) {
        const rawPrice = row[i + 2];
        priceMap[CSV_STORES[i]] = parseFloat(rawPrice?.replace(/[$,]/g, '')) || 0;
      }

      // Fill in 0 for any stores missing from the CSV (e.g. Fresh Direct in week1/week2)
      for (const storeName of missingStores) {
        priceMap[storeName] = 0;
      }

      // Loop through ALL stores and insert/update the price record
      for (const storeName of ALL_STORES) {
        const price = priceMap[storeName] ?? 0;

        let storeId;
        try {
          storeId = await getStore(conn, storeName);
        } catch (err) {
          skipped++;
          continue;
        }

        const priceId = await getOrCreatePriceLink(conn, itemId, storeId);
        const result  = await upsertPriceRecord(conn, priceId, month, weekColumn, price);

        if (result === 'inserted') inserted++;
        if (result === 'updated')  updated++;
      }
    }

    res.json({
      success: true,
      month,
      week: weekNumber,
      inserted,
      updated,
      skipped,
      total: inserted + updated
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    // Clean up the temporary uploaded file
    if (req.file) fs.unlinkSync(req.file.path);
    if (conn) conn.release();
  }
});

// GET /api/items - get all items
app.get('/api/items', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM items ORDER BY category, item_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/stores - get all stores
app.get('/api/stores', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM stores ORDER BY store_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/prices - get all price records with item and store info
// Optional query params: ?month=2026-02-01
app.get('/api/prices', async (req, res) => {
  const { month } = req.query;
  let conn;
  try {
    conn = await pool.getConnection();
    let sql = `
      SELECT 
        i.item_name, i.category,
        s.store_name,
        pr.month,
        pr.week1, pr.week2, pr.week3, pr.week4, pr.week5,
        ROUND(
          (COALESCE(pr.week1,0) + COALESCE(pr.week2,0) + COALESCE(pr.week3,0) + 
           COALESCE(pr.week4,0) + COALESCE(pr.week5,0)) /
          NULLIF(
            (pr.week1 IS NOT NULL) + (pr.week2 IS NOT NULL) + (pr.week3 IS NOT NULL) +
            (pr.week4 IS NOT NULL) + (pr.week5 IS NOT NULL), 0
          ), 2
        ) AS monthly_avg
      FROM price_records pr
      JOIN prices p ON pr.price_id = p.price_id
      JOIN items i  ON p.item_id   = i.item_id
      JOIN stores s ON p.store_id  = s.store_id
    `;
    const params = [];
    if (month) {
      sql += ' WHERE pr.month = ?';
      params.push(month);
    }
    sql += ' ORDER BY i.category, i.item_name, s.store_name';
    const rows = await conn.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/prices/:itemId - get prices for a specific item across all stores
// Optional query params: ?month=2026-02-01
app.get('/api/prices/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const { month }  = req.query;
  let conn;
  try {
    conn = await pool.getConnection();
    let sql = `
      SELECT
        i.item_name, i.category,
        s.store_name,
        pr.month,
        pr.week1, pr.week2, pr.week3, pr.week4, pr.week5,
        ROUND(
          (COALESCE(pr.week1,0) + COALESCE(pr.week2,0) + COALESCE(pr.week3,0) +
           COALESCE(pr.week4,0) + COALESCE(pr.week5,0)) /
          NULLIF(
            (pr.week1 IS NOT NULL) + (pr.week2 IS NOT NULL) + (pr.week3 IS NOT NULL) +
            (pr.week4 IS NOT NULL) + (pr.week5 IS NOT NULL), 0
          ), 2
        ) AS monthly_avg
      FROM price_records pr
      JOIN prices p ON pr.price_id = p.price_id
      JOIN items i  ON p.item_id   = i.item_id
      JOIN stores s ON p.store_id  = s.store_id
      WHERE i.item_id = ?
    `;
    const params = [itemId];
    if (month) {
      sql += ' AND pr.month = ?';
      params.push(month);
    }
    sql += ' ORDER BY s.store_name, pr.month';
    const rows = await conn.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/prices/store/:storeId - get prices for a specific store across all items
// Optional query params: ?month=2026-02-01
app.get('/api/prices/store/:storeId', async (req, res) => {
  const { storeId } = req.params;
  const { month }   = req.query;
  let conn;
  try {
    conn = await pool.getConnection();
    let sql = `
      SELECT
        i.item_name, i.category,
        s.store_name,
        pr.month,
        pr.week1, pr.week2, pr.week3, pr.week4, pr.week5,
        ROUND(
          (COALESCE(pr.week1,0) + COALESCE(pr.week2,0) + COALESCE(pr.week3,0) +
           COALESCE(pr.week4,0) + COALESCE(pr.week5,0)) /
          NULLIF(
            (pr.week1 IS NOT NULL) + (pr.week2 IS NOT NULL) + (pr.week3 IS NOT NULL) +
            (pr.week4 IS NOT NULL) + (pr.week5 IS NOT NULL), 0
          ), 2
        ) AS monthly_avg
      FROM price_records pr
      JOIN prices p ON pr.price_id = p.price_id
      JOIN items i  ON p.item_id   = i.item_id
      JOIN stores s ON p.store_id  = s.store_id
      WHERE s.store_id = ?
    `;
    const params = [storeId];
    if (month) {
      sql += ' AND pr.month = ?';
      params.push(month);
    }
    sql += ' ORDER BY i.category, i.item_name, pr.month';
    const rows = await conn.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Inflation Tracker API running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET  /api/status/:month/:week       e.g. /api/status/2026-02-01/1`);
  console.log(`  POST /api/import/:month/:week       e.g. /api/import/2026-02-01/1`);
  console.log(`  GET  /api/items`);
  console.log(`  GET  /api/stores`);
  console.log(`  GET  /api/prices`);
  console.log(`  GET  /api/prices/:itemId`);
  console.log(`  GET  /api/prices/store/:storeId`);
});