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
 * - Grocery data files such as CSV or spreadsheet-exported data
 * - File paths or request data depending on implementation
 *
 * Expected outputs:
 * - Parsed grocery item records
 * - Imported or transformed data ready for storage or display
 * - This is the sauce that will parse through the google sheet and import the data into mariaDB
*/

require('dotenv').config();               //loads the env file so the script can access the db and sheet ID

// Import libraries
const { google } = require('googleapis');
const mariadb = require('mariadb');

const SHEET_NAME = process.argv[2];       //Reads the sheet name you type in the terminal (i.e week1)
if (!SHEET_NAME) {
  console.error('Please provide a sheet name: node import.js week1');
  process.exit(1);
}

// Extract the number from the sheet name
const WEEK_NUMBER = parseInt(SHEET_NAME.replace(/\D/g, ''));

// Define the stores 
const STORES = ['Aldi', 'Key Food', 'Stop & Shop', "Trader Joe's"];

// DB Connection setup 
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,SHEET_NAME
  database: process.env.DB_NAME,
  connectionLimit: 5,
  ssl: {
    ca: require('fs').readFileSync('/etc/ssl/certs/ca-certificates.crt')  //Encrypts the connection to the remote SkySQL database using machine's trusted certificates.
  }
});

//GOOGLE SHEETS SETUP
async function getSheetData(sheetName) {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',                                        //Authenticates with Google using your credentials.json file.
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']   //The scopes line limits access to read-only so the script can never accidentally edit your sheet.
  });

  //Connect to the Google Sheet and read all data from columns A to H on the inputed week
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!A:H`
  });

  return res.data.values;
}

// Necessary functions
async function getStore(conn, storeName) {
  let rows = await conn.query(
    'SELECT store_id FROM stores WHERE store_name = ?', [storeName]
  );
  if (rows.length > 0) return rows[0].store_id;
  throw new Error(`Store "${storeName}" not found in database.`);
}

async function getItem(conn, itemName) {
  let rows = await conn.query(
    'SELECT item_id FROM items WHERE item_name = ?', [itemName]
  );
  if (rows.length > 0) return rows[0].item_id;
  throw new Error(`Item "${itemName}" not found in database.`);
}

async function upsertPrice(conn, storeId, itemId, weekNumber, today, price) {
  // Check if a record already exists for this item, store, and week
  const existing = await conn.query(
    'SELECT price_id FROM prices WHERE item_id = ? AND store_id = ? AND week_number = ?',
    [itemId, storeId, weekNumber]
  );

  if (existing.length > 0) {
    // Update the existing record
    await conn.query(
      'UPDATE prices SET price = ?, date_recorded = ? WHERE price_id = ?',
      [price, today, existing[0].price_id]
    );
    return 'updated';
  } else {
    // Insert a new record
    await conn.query(
      `INSERT INTO prices (store_id, item_id, week_number, date_recorded, price)
       VALUES (?, ?, ?, ?, ?)`,
      [storeId, itemId, weekNumber, today, price]
    );
    return 'inserted';
  }
}

//Main function
async function main() {
  //Fetch rows from Google Sheet.
  console.log(`Importing sheet: ${SHEET_NAME} (week ${WEEK_NUMBER})`);
  const rows = await getSheetData(SHEET_NAME);

  //If the sheet is empty or only has a print out an error 
  if (!rows || rows.length < 2) {
    console.error('No data found in sheet.');
    process.exit(1);
  }

  const dataRows = rows.slice(1);                         //Removes the first row (the header row with column names) so we only process actual data.
  const today = new Date().toISOString().split('T')[0];   //Gets today's date in YYYY-MM-DD format to store as the date_recorded.

  let conn;

  // Initialize counters
  let inserted = 0;
  let updated = 0;

  try {
    //Attempt to open a connection to the database
    conn = await pool.getConnection();    

    //Read the item name and category from columns A and B.
    for (const row of dataRows) {
      const itemName  = row[0]?.trim();
      const category  = row[1]?.trim();
      //Skip any blank rows.
      if (!itemName || !category) continue;

      //Get the item in the database. 
      const itemId = await getItem(conn, itemName);

      //Loop through all 4 stores and read the price from the corresponding column.
      for (let i = 0; i < STORES.length; i++) {
        const storeName = STORES[i];
        const rawPrice  = row[i + 2];
        //Strips the $ sign before converting to a number.
        const price = parseFloat(rawPrice?.replace(/[$,]/g, '')) || 0;

        //Get store, then insert or update the price record.
        const storeId = await getStore(conn, storeName);
        const result  = await upsertPrice(conn, storeId, itemId, WEEK_NUMBER, today, price);

        //Increment appropriate counters.
        if (result === 'inserted') inserted++;
        if (result === 'updated') updated++;
      }
    }

    console.log(`Done! Inserted ${inserted} new records, updated ${updated} existing records.`);  //Prints a summary when the import is complete.
  } catch (err) {
    console.error('Error during import:', err);
  } finally {
    if (conn) conn.release();
    await pool.end();   //Releases the database connection back to the pool when done, and closes the pool.
  }   
}

//Call the main function to start everything.
main();
