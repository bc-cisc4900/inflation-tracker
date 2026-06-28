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
 *   POST /api/finalize/:month             - Calculate and store monthly_avg for a month
 *   GET  /api/items                       - Get all items
 *   GET  /api/stores                      - Get all stores
 *   GET  /api/prices                      - Get all price records
 *   GET  /api/prices/:itemId              - Get prices for a specific item
 *   GET  /api/prices/store/:storeId       - Get prices for a specific store
<<<<<<< HEAD
 *   GET  /api/prices/compare/:itemId      - Compare an item's avg price across all stores
=======
>>>>>>> b6305463086f4b2c4674ddf508373c80b8cc5350
 *   GET  /api/monthly-avg                 - Get stored monthly averages
 *   GET  /api/monthly-avg/pivot           - Get monthly averages in pivot table format
 *
 * Note:
 *   Always use the actual Wednesday date for the month parameter (e.g. 2026-02-04)
*/

require('dotenv').config();

const express    = require('express');
const multer     = require('multer');
const cors       = require('cors');
const fs         = require('fs');
const os         = require('os');
const { Pool }   = require('pg');  // PostgreSQL driver

const app  = express();
const PORT = process.env.PORT || 3000;

// All stores that should always have a record, even if missing from the CSV
const ALL_STORES = ['Aldi', 'Fresh Direct', 'Key Food', 'Stop & Shop', "Trader Joe's"];

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors()); // Allow requests from the frontend on a different machine

// Multer handles CSV file uploads, storing them temporarily in /tmp
const upload = multer({ dest: os.tmpdir() });

// --- DB SETUP (Supabase / PostgreSQL) ---
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT) || 5432,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl:      { rejectUnauthorized: false }
});

// --- CSV PARSER ---
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines   = content.split('\n').filter(line => line.trim() !== '');

  return lines.map(line => {
    const values = [];
    let current  = '';
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
async function getStore(client, storeName) {
  const res = await client.query(
    'SELECT store_id FROM stores WHERE store_name = $1', [storeName]
  );
  if (res.rows.length > 0) return res.rows[0].store_id;
  throw new Error(`Store "${storeName}" not found in database.`);
}

async function getItem(client, itemName) {
  const res = await client.query(
    'SELECT item_id FROM items WHERE item_name = $1', [itemName]
  );
  if (res.rows.length > 0) return res.rows[0].item_id;
  throw new Error(`Item "${itemName}" not found in database.`);
}

async function getOrCreatePriceLink(client, itemId, storeId) {
  const res = await client.query(
    'SELECT price_id FROM prices WHERE item_id = $1 AND store_id = $2',
    [itemId, storeId]
  );
  if (res.rows.length > 0) return res.rows[0].price_id;

  const result = await client.query(
    'INSERT INTO prices (item_id, store_id) VALUES ($1, $2) RETURNING price_id',
    [itemId, storeId]
  );
  return result.rows[0].price_id;
}

async function upsertPriceRecord(client, priceId, month, weekColumn, price) {
  const existing = await client.query(
    'SELECT record_id FROM price_records WHERE price_id = $1 AND month = $2',
    [priceId, month]
  );

  if (existing.rows.length > 0) {
    await client.query(
      `UPDATE price_records SET ${weekColumn} = $1 WHERE record_id = $2`,
      [price, existing.rows[0].record_id]
    );
    return 'updated';
  } else {
    await client.query(
      `INSERT INTO price_records (price_id, month, ${weekColumn}) VALUES ($1, $2, $3)`,
      [priceId, month, price]
    );
    return 'inserted';
  }
}

// --- INFLATION CALCULATION LOGIC ---
async function finalizeMonthlyAvg(client, month) {
  await client.query(`
    UPDATE price_records
    SET monthly_avg = ROUND(
      (COALESCE(week1, 0) + COALESCE(week2, 0) + COALESCE(week3, 0) +
       COALESCE(week4, 0) + COALESCE(week5, 0)) /
      NULLIF(
        (CASE WHEN week1 IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN week2 IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN week3 IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN week4 IS NOT NULL THEN 1 ELSE 0 END) +
        (CASE WHEN week5 IS NOT NULL THEN 1 ELSE 0 END), 0
      )::numeric, 2
    )
    WHERE month = $1
  `, [month]);

  const res = await client.query(
    'SELECT COUNT(*) as count FROM price_records WHERE month = $1 AND monthly_avg IS NOT NULL',
    [month]
  );
  return Number(res.rows[0].count);
}

// --- ROUTES ---

// GET /api/status/:month/:week - check if a week/month has already been imported
// Example: GET /api/status/2026-02-04/1
app.get('/api/status/:month/:week', async (req, res) => {
  const { month, week } = req.params;
  const weekColumn = `week${week}`;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM-DD (e.g. 2026-02-04).' });
  }
  if (isNaN(week) || week < 1 || week > 5) {
    return res.status(400).json({ error: 'Invalid week number. Must be between 1 and 5.' });
  }

  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      `SELECT COUNT(*) as count FROM price_records WHERE month = $1 AND ${weekColumn} IS NOT NULL`,
      [month]
    );
    const count = Number(result.rows[0].count);
    res.json({ month, week: parseInt(week), imported: count > 0, records: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
});

// POST /api/import/:month/:week - upload a CSV and trigger an import
// Example: POST /api/import/2026-02-04/1
app.post('/api/import/:month/:week', upload.single('file'), async (req, res) => {
  const { month, week } = req.params;
  const weekColumn = `week${week}`;
  const weekNumber = parseInt(week);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM-DD (e.g. 2026-02-04).' });
  }
  if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 5) {
    return res.status(400).json({ error: 'Invalid week number. Must be between 1 and 5.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded. Use form-data with key "file".' });
  }

  let client;
  try {
    const rows = parseCSV(req.file.path);

    if (!rows || rows.length < 2) {
      return res.status(400).json({ error: 'CSV file is empty or has no data rows.' });
    }

    // Read store names from header row, skipping Store Avg. and National Avg. columns
    const header     = rows[0];
    const CSV_STORES = header.slice(2).filter(s =>
      s !== '' && s !== 'Store Avg.' && s !== 'National Avg.'
    );
    const dataRows    = rows.slice(1);
    const missingStores = ALL_STORES.filter(s => !CSV_STORES.includes(s));

    // Validate data before importing
    const validationErrors = validateRows(dataRows, CSV_STORES);
    if (validationErrors.length > 0) {
      return res.status(422).json({
        error: 'Validation failed. Fix the following issues in your CSV:',
        issues: validationErrors
      });
    }

    client = await pool.connect();

    // Check for duplicate import
    const existing = await client.query(
      `SELECT COUNT(*) as count FROM price_records WHERE month = $1 AND ${weekColumn} IS NOT NULL`,
      [month]
    );
    const alreadyImported = Number(existing.rows[0].count) > 0;

    if (alreadyImported && !req.query.force) {
      return res.status(409).json({
        error: `Week ${weekNumber} for ${month} has already been imported with ${Number(existing.rows[0].count)} records.`,
        tip: 'Add ?force=true to the URL to update existing records instead.'
      });
    }

    let inserted = 0;
    let updated  = 0;
    let skipped  = 0;

    for (const row of dataRows) {
      const itemName = row[0]?.trim();
      const category = row[1]?.trim();
      if (!itemName || !category) continue;

      let itemId;
      try {
        itemId = await getItem(client, itemName);
      } catch (err) {
        skipped++;
        continue;
      }

      // Build price map from CSV
      const priceMap = {};
      for (let i = 0; i < CSV_STORES.length; i++) {
        const rawPrice = row[i + 2];
        priceMap[CSV_STORES[i]] = parseFloat(rawPrice?.replace(/[$,]/g, '')) || 0;
      }

      // Fill in 0 for missing stores
      for (const storeName of missingStores) {
        priceMap[storeName] = 0;
      }

      for (const storeName of ALL_STORES) {
        const price = priceMap[storeName] ?? 0;

        let storeId;
        try {
          storeId = await getStore(client, storeName);
        } catch (err) {
          skipped++;
          continue;
        }

        const priceId = await getOrCreatePriceLink(client, itemId, storeId);
        const result  = await upsertPriceRecord(client, priceId, month, weekColumn, price);

        if (result === 'inserted') inserted++;
        if (result === 'updated')  updated++;
      }
    }

    res.json({ success: true, month, week: weekNumber, inserted, updated, skipped, total: inserted + updated });

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (req.file) fs.unlinkSync(req.file.path);
    if (client) client.release();
  }
});

// POST /api/finalize/:month - calculate and store monthly_avg for all records in a month
// Example: POST /api/finalize/2026-02-04
app.post('/api/finalize/:month', async (req, res) => {
  const { month } = req.params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM-DD (e.g. 2026-02-04).' });
  }

  let client;
  try {
    client = await pool.connect();
    const count = await finalizeMonthlyAvg(client, month);
    res.json({ success: true, month, records_updated: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
});

// GET /api/items - get all items
app.get('/api/items', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT * FROM items ORDER BY category, item_name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
});

// GET /api/stores - get all stores
app.get('/api/stores', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT * FROM stores ORDER BY store_name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
});

// GET /api/prices - get all price records with item and store info
// Optional query params: ?month=2026-02-04
app.get('/api/prices', async (req, res) => {
  const { month } = req.query;
  let client;
  try {
    client = await pool.connect();
    let sql = `
      SELECT
        i.item_name, i.category,
        s.store_name,
        pr.month,
        pr.week1, pr.week2, pr.week3, pr.week4, pr.week5,
        pr.monthly_avg
      FROM price_records pr
      JOIN prices p ON pr.price_id = p.price_id
      JOIN items i  ON p.item_id   = i.item_id
      JOIN stores s ON p.store_id  = s.store_id
    `;
    const params = [];
    if (month) {
      sql += ' WHERE pr.month = $1';
      params.push(month);
    }
    sql += ' ORDER BY i.category, i.item_name, s.store_name';
    const result = await client.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/prices failed:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
});

// GET /api/prices/:itemId - get prices for a specific item across all stores
// Optional query params: ?month=2026-02-04
app.get('/api/prices/:itemId', async (req, res) => {
  const { itemId } = req.params;
  const { month }  = req.query;
  let client;
  try {
    client = await pool.connect();
    let sql = `
      SELECT
        i.item_name, i.category,
        s.store_name,
        pr.month,
        pr.week1, pr.week2, pr.week3, pr.week4, pr.week5,
        pr.monthly_avg
      FROM price_records pr
      JOIN prices p ON pr.price_id = p.price_id
      JOIN items i  ON p.item_id   = i.item_id
      JOIN stores s ON p.store_id  = s.store_id
      WHERE i.item_id = $1
    `;
    const params = [itemId];
    if (month) {
      sql += ' AND pr.month = $2';
      params.push(month);
    }
    sql += ' ORDER BY s.store_name, pr.month';
    const result = await client.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
});

// GET /api/prices/store/:storeId - get prices for a specific store across all items
// Optional query params: ?month=2026-02-04
app.get('/api/prices/store/:storeId', async (req, res) => {
  const { storeId } = req.params;
  const { month }   = req.query;
  let client;
  try {
    client = await pool.connect();
    let sql = `
      SELECT
        i.item_name, i.category,
        s.store_name,
        pr.month,
        pr.week1, pr.week2, pr.week3, pr.week4, pr.week5,
        pr.monthly_avg
      FROM price_records pr
      JOIN prices p ON pr.price_id = p.price_id
      JOIN items i  ON p.item_id   = i.item_id
      JOIN stores s ON p.store_id  = s.store_id
      WHERE s.store_id = $1
    `;
    const params = [storeId];
    if (month) {
      sql += ' AND pr.month = $2';
      params.push(month);
    }
    sql += ' ORDER BY i.category, i.item_name, pr.month';
    const result = await client.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
});

<<<<<<< HEAD
// GET /api/prices/compare/:itemId - compare one item's average price across all stores
// Returns each store's average (across all weeks/months, excluding 0/NULL), cheapest first.
// Used by the website's store-comparison view.
app.get('/api/prices/compare/:itemId', async (req, res) => {
  const { itemId } = req.params;
  let client;
  try {
    client = await pool.connect();
    // Average each non-null, non-zero weekly price per store for this item.
    // NULLIF guards against dividing by zero when a store has no usable prices.
    const sql = `
      SELECT
        s.store_id,
        s.store_name,
        ROUND(
          SUM(
            COALESCE(NULLIF(pr.week1, 0), 0) + COALESCE(NULLIF(pr.week2, 0), 0) +
            COALESCE(NULLIF(pr.week3, 0), 0) + COALESCE(NULLIF(pr.week4, 0), 0) +
            COALESCE(NULLIF(pr.week5, 0), 0)
          ) / NULLIF(
            SUM(
              (CASE WHEN NULLIF(pr.week1, 0) IS NOT NULL THEN 1 ELSE 0 END) +
              (CASE WHEN NULLIF(pr.week2, 0) IS NOT NULL THEN 1 ELSE 0 END) +
              (CASE WHEN NULLIF(pr.week3, 0) IS NOT NULL THEN 1 ELSE 0 END) +
              (CASE WHEN NULLIF(pr.week4, 0) IS NOT NULL THEN 1 ELSE 0 END) +
              (CASE WHEN NULLIF(pr.week5, 0) IS NOT NULL THEN 1 ELSE 0 END)
            ), 0)
        , 2) AS avg_price
      FROM price_records pr
      JOIN prices p ON pr.price_id = p.price_id
      JOIN items  i ON p.item_id   = i.item_id
      JOIN stores s ON p.store_id  = s.store_id
      WHERE i.item_id = $1
      GROUP BY s.store_id, s.store_name
      ORDER BY avg_price ASC NULLS LAST
    `;
    const result = await client.query(sql, [itemId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
});

=======
>>>>>>> b6305463086f4b2c4674ddf508373c80b8cc5350
// GET /api/monthly-avg - get stored monthly averages per item/store
// Optional query params: ?month=2026-02-04
app.get('/api/monthly-avg', async (req, res) => {
  const { month } = req.query;
  let client;
  try {
    client = await pool.connect();
    let sql = `
      SELECT
        i.item_name, i.category,
        s.store_name,
        pr.month,
        pr.monthly_avg
      FROM price_records pr
      JOIN prices p ON pr.price_id = p.price_id
      JOIN items i  ON p.item_id   = i.item_id
      JOIN stores s ON p.store_id  = s.store_id
      WHERE pr.monthly_avg IS NOT NULL
    `;
    const params = [];
    if (month) {
      sql += ' AND pr.month = $1';
      params.push(month);
    }
    sql += ' ORDER BY i.category, i.item_name, s.store_name, pr.month DESC';
    const result = await client.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
});

// GET /api/monthly-avg/pivot - get monthly averages in pivot table format
// Returns { months: [...], items: [{ item_name, monthly_avgs: [...] }] }
// Months sorted newest first, missing months filled with 0
app.get('/api/monthly-avg/pivot', async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const result = await client.query(`
      SELECT
        i.item_name,
        i.category,
        pr.month,
        pr.monthly_avg
      FROM price_records pr
      JOIN prices p ON pr.price_id = p.price_id
      JOIN items i  ON p.item_id   = i.item_id
      WHERE pr.monthly_avg IS NOT NULL
      ORDER BY pr.month DESC
    `);

    const rows = result.rows;

    if (rows.length === 0) {
      return res.json({ months: [], items: [] });
    }

    // Get unique months sorted newest first
    const months = [...new Set(rows.map(r => r.month))].sort((a, b) => new Date(b) - new Date(a));

    // Get unique items sorted alphabetically
    const itemNames = [...new Set(rows.map(r => r.item_name))].sort();

    // Build pivot lookup: { itemName: { month: [monthly_avg values] } }
    const pivot = {};
    rows.forEach(r => {
      if (!pivot[r.item_name]) pivot[r.item_name] = {};
      if (!pivot[r.item_name][r.month]) pivot[r.item_name][r.month] = [];
      if (r.monthly_avg !== null) {
        pivot[r.item_name][r.month].push(parseFloat(r.monthly_avg));
      }
    });

    // Build final items array
    const items = itemNames.map(itemName => {
      const monthly_avgs = months.map(month => {
        const values = pivot[itemName]?.[month] || [];
        if (values.length === 0) return 0;
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        return parseFloat(avg.toFixed(2));
      });

      return { item_name: itemName, monthly_avgs };
    });

    res.json({ months, items });

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Inflation Tracker API running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET  /api/status/:month/:week       e.g. /api/status/2026-02-04/1`);
  console.log(`  POST /api/import/:month/:week       e.g. /api/import/2026-02-04/1`);
  console.log(`  POST /api/finalize/:month           e.g. /api/finalize/2026-02-04`);
  console.log(`  GET  /api/items`);
  console.log(`  GET  /api/stores`);
  console.log(`  GET  /api/prices`);
  console.log(`  GET  /api/prices/:itemId`);
  console.log(`  GET  /api/prices/store/:storeId`);
<<<<<<< HEAD
  console.log(`  GET  /api/prices/compare/:itemId`);
=======
>>>>>>> b6305463086f4b2c4674ddf508373c80b8cc5350
  console.log(`  GET  /api/monthly-avg`);
  console.log(`  GET  /api/monthly-avg/pivot`);
});
