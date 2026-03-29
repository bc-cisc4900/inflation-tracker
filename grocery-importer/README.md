# grocery-importer

A Node.js tool that reads grocery price data from a CSV file and imports it into a MariaDB database. Includes an Express API for validation, duplicate prevention, and triggering imports.

---

## Requirements

- Node.js v20+
- Access to the `grocery_inflation` MariaDB database (SkySQL)
- CSV files exported from the Google Sheet

---

## Project Structure

```
grocery-importer/
├── import.js          # Standalone import script (run directly from terminal)
├── server.js          # Express API server
├── .env               # Environment variables (not committed to GitHub)
├── package.json       # Project dependencies
└── node_modules/      # Installed libraries (not committed to GitHub)
```

---

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/bc-cisc4900/inflation-tracker.git
cd inflation-tracker/grocery-importer
```

### 2. Install Node.js

**Ubuntu/Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Mac:**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
```

**Windows:**
- Go to [nodejs.org](https://nodejs.org) and download the LTS installer
- Run the installer and follow the prompts
- Restart your terminal after installation

Verify installation:
```bash
node --version
npm --version
```

### 3. Install dependencies
```bash
npm install
```

### 4. Create your `.env` file
Create a file called `.env` in the `grocery-importer` folder:
```
DB_HOST=serverless-us-west-2.sysp0000.db1.skysql.com
DB_PORT=4034
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=grocery_inflation
```

---

## Google Sheet Format

Each sheet tab should be named `week1`, `week2`, `week3` etc. and follow this column structure:

| Column | Content |
|--------|---------|
| A | Item name |
| B | Category |
| C | Aldi price |
| D | Fresh Direct price |
| E | Key Food price |
| F | Stop & Shop price |
| G | Trader Joe's price |
| H | Store Average (ignored by script) |
| I | National Average (ignored by script) |

Prices should be formatted as `$0.00`. Empty price cells will be stored as `0.00`.

> **Note:** Week 1 and Week 2 do not have Fresh Direct data. The script will automatically insert `0.00` for Fresh Direct in those weeks.

---

## Exporting from Google Sheets

1. Open the Google Sheet
2. Select the sheet tab you want to export (e.g. `week1`)
3. Click **File → Download → Comma Separated Values (.csv)**
4. Rename the file to match the week (e.g. `week1.csv`, `week2.csv`)

---

## Usage

### Option 1 — Standalone Script

Run directly from the terminal to import a specific week. Always use the **1st of the month** as the date:

```bash
node import.js week1.csv 2026-02-04
node import.js week2.csv 2026-02-04
node import.js week3.csv 2026-02-04
node import.js week4.csv 2026-02-04
node import.js week5.csv 2026-02-04   # only for months with 5 Wednesdays
```

### Option 2 — Express API Server

Start the server:
```bash
node server.js
```

The server runs on `http://localhost:3000`.

#### Check if a week has already been imported
```bash
curl http://localhost:3000/api/status/2026-02-04/1
```
Response:
```json
{
  "month": "2026-02-04",
  "week": 1,
  "imported": true,
  "records": 165
}
```

#### Trigger an import by uploading a CSV
```bash
curl -X POST http://localhost:3000/api/import/2026-02-04/1 \
  -F "file=@week1.csv"
```
Response:
```json
{
  "success": true,
  "month": "2026-02-04",
  "week": 1,
  "inserted": 165,
  "updated": 0,
  "skipped": 0,
  "total": 165
}
```

#### Force update an already imported week
```bash
curl -X POST "http://localhost:3000/api/import/2026-02-04/1?force=true" \
  -F "file=@week1.csv"
```

> **Note for Windows:** If `curl` is not available, use PowerShell:
> ```powershell
> Invoke-WebRequest -Uri http://localhost:3000/api/status/2026-02-04/1
> ```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status/:month/:week` | Check if a week has been imported |
| `POST` | `/api/import/:month/:week` | Upload a CSV to trigger an import |
| `GET` | `/api/items` | Get all items |
| `GET` | `/api/stores` | Get all stores |
| `GET` | `/api/prices` | Get all price records |
| `GET` | `/api/prices?month=2026-02-04` | Filter prices by month |
| `GET` | `/api/prices/:itemId` | Get prices for a specific item |
| `GET` | `/api/prices/store/:storeId` | Get prices for a specific store |

---

## Verifying Imports in MariaDB

Check all records for a month:
```sql
SELECT 
  i.item_name, s.store_name,
  pr.week1, pr.week2, pr.week3, pr.week4
FROM price_records pr
JOIN prices p ON pr.price_id = p.price_id
JOIN items i  ON p.item_id   = i.item_id
JOIN stores s ON p.store_id  = s.store_id
WHERE pr.month = '2026-02-04'
ORDER BY i.item_name, s.store_name;
```

Check record count per week:
```sql
SELECT
  COUNT(week1) as week1_count,
  COUNT(week2) as week2_count,
  COUNT(week3) as week3_count,
  COUNT(week4) as week4_count
FROM price_records
WHERE month = '2026-02-04';
```

> Each month should have **165 records** (33 items × 5 stores).

---

## Database Schema

| Table | Description |
|-------|-------------|
| `items` | Product names and categories |
| `stores` | Store names |
| `prices` | Link table between items and stores |
| `price_records` | Weekly price data per item/store/month |

The `monthly_avg` is computed at query time as the average of all non-null week columns — no need to store it.

---

## Notes

- Never commit `.env` to GitHub — it contains your database credentials
- `node_modules` is excluded from GitHub and can be restored anytime with `npm install`
- Always use the same date for all weeks in the same month (e.g. `2026-02-04` for all of February 2026)
- Store Avg. and National Avg. columns in the CSV are automatically ignored by the script
