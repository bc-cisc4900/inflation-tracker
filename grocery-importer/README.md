# grocery-importer

A Node.js tool that reads grocery price data from a CSV file and imports it into a Supabase (PostgreSQL) database. Includes an Express REST API that serves price data to the BC-Basket website, with validation, duplicate prevention, and CSV upload support.

---

## Requirements

- Node.js v20+
- Access to the BC-Basket Supabase project
- CSV files exported from the Google Sheet

---

## Project Structure

```
grocery-importer/
├── import.js          # Standalone import script (run from terminal)
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
brew install node
```

**Windows:**
Download the LTS installer from [nodejs.org](https://nodejs.org), run it, and restart your terminal.

Verify:
```bash
node --version
npm --version
```

### 3. Install dependencies
```bash
npm install
```
Key packages: `pg` (PostgreSQL driver), `express`, `cors`, `multer`, `dotenv`.

### 4. Create your `.env` file
Create a file called `.env` in the `grocery-importer` folder:
```
DB_HOST=db.jwxxjeovkkmabwyrfgvh.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_supabase_password
DB_NAME=postgres
```
Find the password in Supabase → **Project Settings → Database**. Note the `db.` prefix on the host and that `DB_NAME` is `postgres` (the actual database name), not the project display name.

---

## Google Sheet / CSV Format

Each sheet tab is named `week1`, `week2`, etc. with this column structure:

| Column | Content |
|--------|---------|
| A | Item name |
| B | Category |
| C–G | Store prices (read dynamically from the header row) |
| H | Store Average (ignored by script) |
| I | National Average (ignored by script) |

Prices are formatted as `$0.00`. The script strips `$` automatically.

> **Note:** Weeks 1 and 2 do not include Fresh Direct. The script detects missing stores from the CSV header and inserts `0.00` for them automatically. Store column order does not matter — stores are matched by header name.

**Exporting:** open the sheet tab → **File → Download → Comma Separated Values (.csv)** → rename to `week1.csv`, `week2.csv`, etc.

---

## Usage

### Option 1 — Standalone Import Script

```bash
node import.js week1.csv 2026-02-04
node import.js week2.csv 2026-02-04
node import.js week3.csv 2026-02-04
node import.js week4.csv 2026-02-04 --finalize
```

- The date is the month identifier in `YYYY-MM-DD` format — use the **same date for every week in the same month**.
- The week number is read from the filename (`week3.csv` → `week3` column).
- `--finalize` calculates and stores `monthly_avg` for all records in that month. Run it with the **last week of the month** (week 4, or week 5 in five-Wednesday months).
- Re-running an import updates only that week's column — it never overwrites other weeks.

### Option 2 — Express API Server

```bash
node server.js
```
Runs on `http://localhost:3000`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status/:month/:week` | Check if a week has been imported |
| `POST` | `/api/import/:month/:week` | Upload a CSV to trigger an import (`?force=true` to overwrite) |
| `POST` | `/api/finalize/:month` | Calculate and store `monthly_avg` for a month |
| `GET` | `/api/items` | All items |
| `GET` | `/api/stores` | All stores |
| `GET` | `/api/prices` | All price records (`?month=` to filter) |
| `GET` | `/api/prices/:itemId` | Prices for one item across stores |
| `GET` | `/api/prices/store/:storeId` | Prices for one store across items |
| `GET` | `/api/prices/compare/:itemId` | One item's average price at each store, cheapest first |
| `GET` | `/api/monthly-avg` | Stored monthly averages per item/store |
| `GET` | `/api/monthly-avg/pivot` | Monthly averages in pivot-table format |

Examples:
```bash
curl http://localhost:3000/api/status/2026-02-04/1
curl -X POST http://localhost:3000/api/import/2026-02-04/1 -F "file=@week1.csv"
curl -X POST http://localhost:3000/api/finalize/2026-02-04
curl http://localhost:3000/api/monthly-avg/pivot
curl http://localhost:3000/api/prices/compare/12
```

> **Windows:** if `curl` is unavailable, use PowerShell's `Invoke-WebRequest`.

---

## Frontend Integration

The website (`website/index.html` — a single page combining the home, methodology, and credits content) connects to this API for two live sections:

**Weekly Price Summary** (`#summary`)
- Fetches `/api/prices` once on page load and caches it; all filtering happens client-side
- Pivot table: one row per item, one column per week (newest first), each cell averaged across stores
- **Store filter** and **item search** (real-time, debounced)
- **Date-range filter** — From/To week selectors narrow which week columns are shown
- **Percent-change indicator** under each price (red = rose, green = fell, grey = no change)
- **Annual Avg** column averaging every week that has data for the item
- **Export CSV** downloads the currently filtered view (from the data model, not the DOM)
- Zero values display dimmed; loading and error states are shown while fetching

**Compare Stores for an Item** (`#compare`)
- Fetches `/api/items` to populate the item dropdown
- On selection, calls `/api/prices/compare/:itemId` and shows each store's average price as a card
- The cheapest store is highlighted and tagged

Accessibility: filter controls have ARIA labels and visible keyboard focus states; the table uses `scope` on headers and row labels.

To test locally, run the API in one terminal and serve the website in another:
```bash
node server.js
# in another terminal, from the website folder:
python3 -m http.server 8080
# open http://localhost:8080/index.html
```
If the site is hosted elsewhere, update the `API_BASE` constant near the bottom of `index.html`.

CORS is enabled on the server (`app.use(cors())`) so the frontend can fetch from a different origin. (Note: GitHub Pages serves static files only, so `server.js` must run separately — locally or on a host.)

---

## Validation & Duplicate Prevention

The API checks before importing:
- Missing item names or categories
- Invalid price values (per row, per store)
- Duplicate weekly entries — rejected with HTTP 409 unless `?force=true` is passed

The standalone script skips unknown items/stores with a warning rather than creating them.

---

## Verifying Imports

In the Supabase SQL editor:

```sql
-- All records for a month
SELECT i.item_name, s.store_name, pr.week1, pr.week2, pr.week3, pr.week4, pr.monthly_avg
FROM price_records pr
JOIN prices p ON pr.price_id = p.price_id
JOIN items i  ON p.item_id   = i.item_id
JOIN stores s ON p.store_id  = s.store_id
WHERE pr.month = '2026-02-04'
ORDER BY i.item_name, s.store_name;

-- Record counts per week
SELECT COUNT(week1) AS week1, COUNT(week2) AS week2,
       COUNT(week3) AS week3, COUNT(week4) AS week4
FROM price_records
WHERE month = '2026-02-04';
```

Each month should have **165 records** (33 items × 5 stores).

---

## Database Schema (Supabase / PostgreSQL)

| Table | Description |
|-------|-------------|
| `items` | Product names, categories, brand, unit size, substitution rule |
| `stores` | Store names (Aldi, Fresh Direct, Key Food, Stop & Shop, Trader Joe's) |
| `prices` | Link table between items and stores |
| `price_records` | Weekly prices (`week1`–`week5`) + `monthly_avg` per item/store/month |

Relationships: `items (1)→(many) prices` · `stores (1)→(many) prices` · `prices (1)→(many) price_records`

`monthly_avg` is stored when `--finalize` (or `POST /api/finalize/:month`) runs; it averages only the weeks that have data, so 4- and 5-week months are both handled.

---

## Notes

- Never commit `.env` — it contains database credentials. It is in `.gitignore` along with `node_modules/`.
- Earlier versions of this project used MariaDB/SkySQL; the codebase is now fully on Supabase/PostgreSQL (`pg` driver, `$1` placeholders, `RETURNING` clauses).
- The frontend website is deployed via GitHub Pages, which serves static files only — `server.js` must run separately (locally or on a host).
