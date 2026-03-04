// server.js
require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const mariadb = require('mariadb');
const fs = require('fs');

const app = express();
app.use(express.json());

const PORT = 3000;
const STORES = ['Aldi', 'Key Food', 'Stop & Shop', "Trader Joe's"];

// --- DB SETUP ---
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  ssl: {
    ca: fs.readFileSync('/etc/ssl/certs/ca-certificates.crt')
  }
});

// --- GOOGLE SHEETS ---
async function getSheetData(sheetName) {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A:H`
  });

  return res.data.values;
}

// --- HELPERS ---
async function getOrCreateStore(conn, storeName) {
  let rows = await conn.query(
    'SELECT store_id FROM stores WHERE store_name = ?', [storeName]
  );
  if (rows.length > 0) return rows[0].store_id;
  const result = await conn.query(
    'INSERT INTO stores (store_name) VALUES (?)', [storeName]
  );
  return Number(result.insertId);
}

async function getOrCreateItem(conn, itemName, category) {
  let rows = await conn.query(
    'SELECT item_id FROM items WHERE item_name = ?', [itemName]
  );
  if (rows.length > 0) return rows[0].item_id;
  const result = await conn.query(
    'INSERT INTO items (item_name, category, brand, unit_size) VALUES (?, ?, ?, ?)',
    [itemName, category, '', '']
  );
  return Number(result.insertId);
}

async function upsertPrice(conn, storeId, itemId, weekNumber, today, price) {
  const existing = await conn.query(
    'SELECT price_id FROM prices WHERE item_id = ? AND store_id = ? AND week_number = ?',
    [itemId, storeId, weekNumber]
  );
  if (existing.length > 0) {
    await conn.query(
      'UPDATE prices SET price = ?, date_recorded = ? WHERE price_id = ?',
      [price, today, existing[0].price_id]
    );
    return 'updated';
  } else {
    await conn.query(
      `INSERT INTO prices (store_id, item_id, week_number, date_recorded, price)
       VALUES (?, ?, ?, ?, ?)`,
      [storeId, itemId, weekNumber, today, price]
    );
    return 'inserted';
  }
}

// --- VALIDATION ---
function validateRows(rows) {
  const errors = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // account for header row
    const itemName = row[0]?.trim();
    const category = row[1]?.trim();

    // Check item name and category exist
    if (!itemName) errors.push(`Row ${rowNum}: missing item name`);
    if (!category) errors.push(`Row ${rowNum}: missing category`);

    // Check each store price is a valid number
    for (let i = 0; i < STORES.length; i++) {
      const rawPrice = row[i + 2];
      const price = parseFloat(rawPrice?.replace(/[$,]/g, ''));
      if (rawPrice && isNaN(price)) {
        errors.push(`Row ${rowNum} (${itemName}): invalid price "${rawPrice}" for ${STORES[i]}`);
      }
    }
  });

  return errors;
}

// --- ROUTES ---

// GET /status/:weekNumber - check if a week has already been imported
app.get('/status/:weekNumber', async (req, res) => {
  const weekNumber = parseInt(req.params.weekNumber);

  if (isNaN(weekNumber) || weekNumber < 1) {
    return res.status(400).json({ error: 'Invalid week number' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT COUNT(*) as count FROM prices WHERE week_number = ?',
      [weekNumber]
    );
    const count = Number(rows[0].count);
    res.json({
      week: weekNumber,
      imported: count > 0,
      records: count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// POST /import/:sheetName - trigger import for a given sheet
app.post('/import/:sheetName', async (req, res) => {
  const sheetName = req.params.sheetName;
  const weekNumber = parseInt(sheetName.replace(/\D/g, ''));

  if (isNaN(weekNumber) || weekNumber < 1) {
    return res.status(400).json({ error: 'Invalid sheet name. Use format: week1, week2 etc.' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // --- DUPLICATE CHECK ---
    const existing = await conn.query(
      'SELECT COUNT(*) as count FROM prices WHERE week_number = ?',
      [weekNumber]
    );
    const alreadyImported = Number(existing[0].count) > 0;

    // If already imported and force flag not set, reject
    if (alreadyImported && !req.query.force) {
      return res.status(409).json({
        error: `Week ${weekNumber} has already been imported with ${Number(existing[0].count)} records.`,
        tip: 'Add ?force=true to the URL to update existing records instead.'
      });
    }

    // --- FETCH SHEET DATA ---
    let rows;
    try {
      rows = await getSheetData(sheetName);
    } catch (err) {
      return res.status(400).json({ error: `Could not find sheet "${sheetName}" in your Google Sheet.` });
    }

    if (!rows || rows.length < 2) {
      return res.status(400).json({ error: 'Sheet is empty or has no data rows.' });
    }

    const dataRows = rows.slice(1); // skip header

    // --- VALIDATION ---
    const validationErrors = validateRows(dataRows);
    if (validationErrors.length > 0) {
      return res.status(422).json({
        error: 'Validation failed. Fix the following issues in your sheet:',
        issues: validationErrors
      });
    }

    // --- IMPORT ---
    const today = new Date().toISOString().split('T')[0];
    let inserted = 0;
    let updated = 0;

    for (const row of dataRows) {
      const itemName = row[0]?.trim();
      const category = row[1]?.trim();
      if (!itemName || !category) continue;

      const itemId = await getOrCreateItem(conn, itemName, category);

      for (let i = 0; i < STORES.length; i++) {
        const storeName = STORES[i];
        const rawPrice = row[i + 2];
        const price = parseFloat(rawPrice?.replace(/[$,]/g, '')) || 0;

        const storeId = await getOrCreateStore(conn, storeName);
        const result = await upsertPrice(conn, storeId, itemId, weekNumber, today, price);

        if (result === 'inserted') inserted++;
        if (result === 'updated') updated++;
      }
    }

    res.json({
      success: true,
      sheet: sheetName,
      week: weekNumber,
      inserted,
      updated,
      total: inserted + updated
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Grocery importer API running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET  http://localhost:${PORT}/status/:weekNumber`);
  console.log(`  POST http://localhost:${PORT}/import/:sheetName`);
});
