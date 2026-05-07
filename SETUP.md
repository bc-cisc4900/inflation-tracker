# Grocery Inflation Tracker — Setup & Handoff Guide

## Project Overview

This project tracks grocery prices over time and displays them on a public website/dashboard.

Current tools:

* **GitHub Repo** — stores the project code
* **GitHub Pages** — hosts the website
* **Supabase** — stores grocery price data
* **Google Sheets** — used for price entry/review

---

## Important Links

| Resource         | Link                  |
| ---------------- | --------------------- |
| GitHub Repo      | `https://github.com/bc-cisc4900/inflation-tracker`     |
| Live Website     | `https://bc-cisc4900.github.io/inflation-tracker/`  |
| Supabase Project | `https://jwxxjeovkkmabwyrfgvh.supabase.co` |
| Google Sheet     | `https://docs.google.com/spreadsheets/d/1-U6Gy8KI-ajH7He4ksQ9dPo6TluAoBy75tu9D4PhJR4/edit?usp=sharing`    |

---

## Local Setup

```bash
git clone https://github.com/bc-cisc4900/inflation-tracker
cd inflation-tracker-main
npm install
npm run dev
```

Create a `.env` file if needed:

```env
VITE_SUPABASE_URL=https://jwxxjeovkkmabwyrfgvh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3eHhqZW92a2ttYWJ3eXJmZ3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4Mjc3NTUsImV4cCI6MjA5MzQwMzc1NX0.0l4Zf0XpD7hsO9hiMWp5W0HD931hL-AiqVS7OIjKvCs
```

Do **not** upload `.env` files to GitHub.

---

## Data Workflow

Google Sheets is used to enter/review grocery prices. Supabase stores the structured database records.

Recommended columns:

| Item | Category | Aldi | Key Food | Stop & Shop | Trader Joe's | Store Avg. | National Avg. |

Guidelines:

* Collect prices on the same day each week when possible.
* Use the same item names, units, and package sizes.
* Record sale prices if they're present.
* Add notes for substitutions or out-of-stock items.

---

## Deployment

The website is hosted with **GitHub Pages**.

To update the website:

1. Push updated code to GitHub.
2. Check the GitHub Pages branch/settings.
3. Check GitHub Actions if deployment fails.

Useful places to check:

* GitHub repo → **Settings → Pages**
* GitHub repo → **Actions**
* `.github/workflows` folder, if the project uses a deployment workflow

---

## Final Note

The most important part of the project is consistency. Future cohorts should continue using the same grocery items, units, and pricing methods so the inflation data stays reliable.
