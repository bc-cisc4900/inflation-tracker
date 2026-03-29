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
 * - A month in YYYY-MM-01 format (always use the 1st of the month)
 *
 * Expected outputs:
 * - Parsed grocery item records inserted into the database
 * - This is the sauce that will parse through the CSV and import the data into mariaDB
 *
 * Usage:
 *   node import.js week1.csv 2026-02-01        (import week1 for February 2026)
 *   node import.js week2.csv 2026-02-01
 *   node import.js week3.csv 2026-02-01
 *   node import.js week4.csv 2026-02-01
 *   node import.js week5.csv 2026-02-01        (only for months with 5 Wednesdays)
 *
 * Note:
 *   Always use the 1st of the month as the date (e.g. 2026-02-01 for February 2026)
 *   If Fresh Direct is missing from the CSV (e.g. week1, week2),
 *   the script will automatically insert 0 for Fresh Direct.
*/

require('dotenv').config();               //loads the env file so the script can access the db credentials

// Import libraries
const fs      = require('fs');
const os      = require('os');
const path    = require('path');
const mariadb = require('mariadb');

const CSV_FILE = process.argv[2];         //Reads the CSV file path you type in the terminal (i.e week1.csv)
const MONTH    = process.argv[3];         //Reads the month you type in the terminal (i.e 2026-02-01)

if (!CSV_FILE) {
  console.error('Please provide a CSV file: node import.js week1.csv 2026-02-01');
  process.exit(1);
}

if (!MONTH || !/^\d{4}-\d{2}-\d{2}$/.test(MONTH)) {
  console.error('Please provide a valid date in YYYY-MM-DD format: node import.js week1.csv 2026-02-01');
  process.exit(1);
}

if (!fs.existsSync(CSV_FILE)) {
  console.error(`File not found: ${CSV_FILE}`);
  process.exit(1);
}

// Extract the week number from the filename (e.g. week1.csv -> 1)
const WEEK_NUMBER = parseInt(path.basename(CSV_FILE).replace(/\D/g, ''));
if (isNaN(WEEK_NUMBER) || WEEK_NUMBER < 1 || WEEK_NUMBER > 5) {
  console.error('Week number must be between 1 and 5. Example: node import.js week1.csv 2026-02-01');
  process.exit(1);
}

// Maps the filename to the correct column in price_records (e.g. week1.csv -> week1)
const WEEK_COLUMN = `week${WEEK_NUMBER}`;

// All stores that should always have a record, even if missing from the CSV
const ALL_STORES = ['Aldi', 'Fresh Direct', 'Key Food', 'Stop & Shop', "Trader Joe's"];

// --- SSL CERTIFICATE (cross-platform) ---
// Automatically detects the operating system and uses the correct SSL certificate path
function getSSLConfig() {
  const platform = os.platform();

  if (platform === 'win32') {
    // Windows uses Node.js built-in certificates
    return true;
  }

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

  // Fallback to Node.js built-in certificates
  console.warn('Warning: Could not find SSL certificate file, using built-in certificates.');
  return true;
}

// DB Connection setup
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  ssl: getSSLConfig()   //Encrypts the connection to the remote SkySQL database using machine's trusted certificates.
});

// --- CSV PARSER ---
// Reads the CSV file and returns an array of rows
// Each row is an array of values matching the column order in the sheet
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines   = content.split('\n').filter(line => line.trim() !== '');

  return lines.map(line => {
    // Handle values that are wrapped in quotes (e.g. "Trader Joe's")
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
async function getStore(conn, storeName) {
  const rows = await conn.query(
    'SELECT store_id FROM stores WHERE store_name = ?', [storeName]
  );
  if (rows.length > 0) return rows[0].store_id;
  throw new Error(`Store "${storeName}" not found in database.`);
}

// Looks up an item by name and returns its ID. Throws an error if not found.
async function getItem(conn, itemName) {
  const rows = await conn.query(
    'SELECT item_id FROM items WHERE item_name = ?', [itemName]
  );
  if (rows.length > 0) return rows[0].item_id;
  throw new Error(`Item "${itemName}" not found in database.`);
}

// Gets or creates a row in the prices table for a given item/store combo
// The prices table acts as a link between items and stores
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

// Inserts or updates the specific week column in price_records for a given month
// If a record already exists for this price_id and month, only the specific week column is updated
// so that importing week2 does not overwrite week1 data
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

// --- MAIN ---
async function main() {
  console.log(`Importing file: ${CSV_FILE} → column: ${WEEK_COLUMN} for month: ${MONTH}`);

  // Parse the CSV file
  const rows = parseCSV(CSV_FILE);

  // If the file is empty or only has a header row, print out an error
  if (!rows || rows.length < 2) {
    console.error('No data found in CSV file.');
    process.exit(1);
  }

  // Read store names from the header row (columns C onwards)
  // Skip Store Avg. and National Avg. columns
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

  const dataRows = rows.slice(1); //Removes the first row (the header row with column names) so we only process actual data.

  let conn;

  // Initialize counters
  let inserted = 0;
  let updated  = 0;
  let skipped  = 0;

  try {
    // Attempt to open a connection to the database
    conn = await pool.getConnection();

    // Read the item name and category from columns A and B.
    for (const row of dataRows) {
      const itemName = row[0]?.trim();
      const category = row[1]?.trim();

      // Skip any blank rows.
      if (!itemName || !category) continue;

      // Get the item from the database. Skip row if item is not found.
      let itemId;
      try {
        itemId = await getItem(conn, itemName);
      } catch (err) {
        console.warn(`Skipping: ${err.message}`);
        skipped++;
        continue;
      }

      // Build a price map from the CSV for this row
      // Only includes stores that are in the CSV (skips Store Avg. and National Avg.)
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

        // Get store. Skip if store is not found in the database.
        let storeId;
        try {
          storeId = await getStore(conn, storeName);
        } catch (err) {
          console.warn(`Skipping: ${err.message}`);
          skipped++;
          continue;
        }

        // Get or create the prices link row for this item/store combo
        const priceId = await getOrCreatePriceLink(conn, itemId, storeId);

        // Insert or update the price record for this week and month
        const result = await upsertPriceRecord(conn, priceId, MONTH, WEEK_COLUMN, price);

        // Increment appropriate counters.
        if (result === 'inserted') inserted++;
        if (result === 'updated')  updated++;
      }
    }

    console.log(`Done! Inserted ${inserted} new records, updated ${updated} existing records, skipped ${skipped}.`);
  } catch (err) {
    console.error('Error during import:', err.message);
  } finally {
    if (conn) conn.release();
    await pool.end();   //Releases the database connection back to the pool when done, and closes the pool.
  }
}

// Call the main function to start everything.
main();