/**
 * import.js
 * Purpose:
 * Imports grocery pricing data into the project workflow.
 *
 * Why it exists:
 * The project collects grocery prices in spreadsheets and CSV-like formats.
 * This file exists to help move that data into a format the backend or database can use.
 *
 * Expected inputs:
 * - A CSV file exported from the Google Sheet (File → Download → Comma Separated Values)
 * - A month in YYYY-MM-DD format (always use the actual Wednesday date)
 * - Optional --finalize flag to calculate and store monthly_avg after all weeks are imported
 *
 * Expected outputs:
 * - Parsed grocery item records inserted into the database
 *
 * Usage:
 *   node import.js week1.csv 2026-02-04
 *   node import.js week2.csv 2026-02-04
 *   node import.js week3.csv 2026-02-04
 *   node import.js week4.csv 2026-02-04 --finalize    (4 week month)
 *   node import.js week5.csv 2026-02-04 --finalize    (5 week month)
 *
 * Note:
 *   If Fresh Direct is missing from the CSV (e.g. week1, week2),
 *   the script will automatically insert 0 for Fresh Direct.
 *   The "2026-02-04" stands for the first week recorded for the whole month since we cannot put "February"
 *   Use --finalize on the last week of the month to store monthly_avg.
*/

require('dotenv').config();

const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { Pool } = require('pg');   // PostgreSQL driver

const CSV_FILE = process.argv[2];
const MONTH    = process.argv[3];
const FINALIZE = process.argv.includes('--finalize');

if (!CSV_FILE) {
  console.error('Please provide a CSV file: node import.js week1.csv 2026-02-04');
  process.exit(1);
}

if (!MONTH || !/^\d{4}-\d{2}-\d{2}$/.test(MONTH)) {
  console.error('Please provide a valid date in YYYY-MM-DD format: node import.js week1.csv 2026-02-04');
  process.exit(1);
}

if (!fs.existsSync(CSV_FILE)) {
  console.error(`File not found: ${CSV_FILE}`);
  process.exit(1);
}

// Extract week number from filename (e.g. week1.csv -> 1)
const WEEK_NUMBER = parseInt(path.basename(CSV_FILE).replace(/\D/g, ''));
if (isNaN(WEEK_NUMBER) || WEEK_NUMBER < 1 || WEEK_NUMBER > 5) {
  console.error('Week number must be between 1 and 5. Example: node import.js week1.csv 2026-02-04');
  process.exit(1);
}

// Maps the filename to the correct column in price_records (e.g. week1.csv -> week1)
const WEEK_COLUMN = `week${WEEK_NUMBER}`;

// All stores that should always have a record, even if missing from the CSV
const ALL_STORES = ['Aldi', 'Fresh Direct', 'Key Food', 'Stop & Shop', "Trader Joe's"];

// --- DB SETUP (Supabase / PostgreSQL) ---
// Supabase requires SSL - rejectUnauthorized: false allows connection without a cert file
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT) || 5432,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl:      { rejectUnauthorized: false }
});

// --- CSV PARSER ---
// Reads the CSV file and returns an array of rows
// Each row is an array of values matching the column order in the sheet
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines   = content.split('\n').filter(line => line.trim() !== '');

  return lines.map(line => {
    // Handle values wrapped in quotes (e.g. "Trader Joe's")
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

// --- HELPERS ---

// Looks up a store by name and returns its ID. Throws an error if not found.
async function getStore(client, storeName) {
  const res = await client.query(
    'SELECT store_id FROM stores WHERE store_name = $1', [storeName]
  );
  if (res.rows.length > 0) return res.rows[0].store_id;
  throw new Error(`Store "${storeName}" not found in database.`);
}

// Looks up an item by name and returns its ID. Throws an error if not found.
async function getItem(client, itemName) {
  const res = await client.query(
    'SELECT item_id FROM items WHERE item_name = $1', [itemName]
  );
  if (res.rows.length > 0) return res.rows[0].item_id;
  throw new Error(`Item "${itemName}" not found in database.`);
}

// Gets or creates a row in the prices table for a given item/store combo
// The prices table acts as a link between items and stores
async function getOrCreatePriceLink(client, itemId, storeId) {
  const res = await client.query(
    'SELECT price_id FROM prices WHERE item_id = $1 AND store_id = $2',
    [itemId, storeId]
  );
  if (res.rows.length > 0) return res.rows[0].price_id;

  // PostgreSQL uses RETURNING to get the inserted ID
  const result = await client.query(
    'INSERT INTO prices (item_id, store_id) VALUES ($1, $2) RETURNING price_id',
    [itemId, storeId]
  );
  return result.rows[0].price_id;
}

// Inserts or updates the specific week column in price_records for a given month
// If a record already exists for this price_id and month, only the specific week column is updated
// so that importing week2 does not overwrite week1 data
async function upsertPriceRecord(client, priceId, month, weekColumn, price) {
  const existing = await client.query(
    'SELECT record_id FROM price_records WHERE price_id = $1 AND month = $2',
    [priceId, month]
  );

  if (existing.rows.length > 0) {
    // Update only the specific week column
    // PostgreSQL does not allow dynamic column names with $1 placeholders
    // so we use a template literal for the column name (safe since weekColumn is validated above)
    await client.query(
      `UPDATE price_records SET ${weekColumn} = $1 WHERE record_id = $2`,
      [price, existing.rows[0].record_id]
    );
    return 'updated';
  } else {
    // Insert a new row with just this week's price
    await client.query(
      `INSERT INTO price_records (price_id, month, ${weekColumn}) VALUES ($1, $2, $3)`,
      [priceId, month, price]
    );
    return 'inserted';
  }
}

// --- INFLATION CALCULATION LOGIC ---
// Calculates and stores monthly_avg for all price_records for the given month
// monthly_avg = average of all non-null week columns for that record
// Only runs when --finalize flag is passed
async function finalizeMonthlyAvg(client, month) {
  console.log(`Calculating monthly_avg for all records in month: ${month}...`);

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
  console.log(`monthly_avg stored for ${res.rows[0].count} records.`);
}

// --- MAIN ---
async function main() {
  console.log(`Importing file: ${CSV_FILE} → column: ${WEEK_COLUMN} for month: ${MONTH}`);
  if (FINALIZE) console.log('--finalize flag detected: monthly_avg will be calculated after import.');

  const rows = parseCSV(CSV_FILE);

  if (!rows || rows.length < 2) {
    console.error('No data found in CSV file.');
    process.exit(1);
  }

  // Read store names from header row, skipping Store Avg. and National Avg. columns
  const header     = rows[0];
  const CSV_STORES = header.slice(2).filter(s =>
    s !== '' && s !== 'Store Avg.' && s !== 'National Avg.'
  );
  console.log(`Stores found in CSV: ${CSV_STORES.join(', ')}`);

  // Detect which stores are missing from the CSV and will get a 0 price
  const missingStores = ALL_STORES.filter(s => !CSV_STORES.includes(s));
  if (missingStores.length > 0) {
    console.log(`Missing stores (will insert 0): ${missingStores.join(', ')}`);
  }

  const dataRows = rows.slice(1); // skip header row

  let client;
  let inserted = 0;
  let updated  = 0;
  let skipped  = 0;

  try {
    client = await pool.connect(); // get a connection from the pool

    for (const row of dataRows) {
      const itemName = row[0]?.trim();
      const category = row[1]?.trim();
      if (!itemName || !category) continue;

      // Get the item from the database. Skip row if item is not found.
      let itemId;
      try {
        itemId = await getItem(client, itemName);
      } catch (err) {
        console.warn(`Skipping: ${err.message}`);
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
          storeId = await getStore(client, storeName);
        } catch (err) {
          console.warn(`Skipping: ${err.message}`);
          skipped++;
          continue;
        }

        const priceId = await getOrCreatePriceLink(client, itemId, storeId);
        const result  = await upsertPriceRecord(client, priceId, MONTH, WEEK_COLUMN, price);

        if (result === 'inserted') inserted++;
        if (result === 'updated')  updated++;
      }
    }

    console.log(`Done! Inserted ${inserted} new records, updated ${updated} existing records, skipped ${skipped}.`);

    // Run inflation calculation logic if --finalize flag was passed
    if (FINALIZE) {
      await finalizeMonthlyAvg(client, MONTH);
    }

  } catch (err) {
    console.error('Error during import:', err.message);
  } finally {
    if (client) client.release(); // release connection back to pool
    await pool.end();
  }
}

main();
