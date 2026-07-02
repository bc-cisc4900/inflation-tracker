# Changelog

All notable changes and milestones for the Grocery Store Inflation Tracker (BC-Basket) project are documented in this file.

> **Summer 2026 (Session 1)** — the project is being continued by Andrew Castillo-Fajardo as the sole developer, building on the Spring 2026 team's handoff. Entries below are newest-first.

---

## [Ongoing]


### Planned
- **Host the backend** (e.g. Render, Railway, or Fly.io) so the deployed site can serve live data — GitHub Pages is static-only, so the API currently runs locally.
- Add trend-line charts/visualizations on top of the existing monthly pivot data.
- Continue weekly grocery data collection to build multi-semester history.
- Optional: automated Google Sheets → Supabase import (kept manual for reliability so far).
- Expand coverage with additional stores and items (schema already supports it).

---

## 2026-07-02
### Completed
- Submitted the **Final Draft + Presentation + Time Log** deliverable.
- Final commit and push of all Week 5 work; verified GitHub Pages deployment reflects the latest site.
- Corrected pivot table column labels from "Week" to "Month" to accurately describe the monthly-average data.

## 2026-07-01
### Completed
- Diagnosed and fixed the live-site 500 error: added server-side error logging, which revealed `connect ENETUNREACH` on an IPv6 address.
- Root cause: Supabase's direct connection host is IPv6-only; switched `.env` to the IPv4 **connection pooler** (`postgres.<project-ref>` username) — site now loads live data end-to-end.
- Documented the IPv6/pooler pitfall in the `.env` template, the README (new troubleshooting section), and the Summer 2026 handoff document.

## 2026-06-30
### Completed
- Built the **store-comparison view**: item dropdown, per-store average cards, cheapest store highlighted and tagged.
- Accessibility pass: ARIA labels on all controls, visible keyboard focus states, table header `scope` attributes; verified dark-mode rendering.

## 2026-06-29
### Completed
- Added a **percent-change indicator** to each price cell (color-coded: red = rose, green = fell, grey = no change) with a legend.
- Added the **Annual Average** column, averaging every month that has data per item.

## 2026-06-26
### Completed
- Submitted the **Full Draft + Time Log** deliverable.
- Added the `/api/prices/compare/:itemId` backend endpoint (averages each store's non-zero prices, cheapest first).
- Implemented the **date-range (From/To month) filter** on the frontend.
- Merged the separate index/method/credits pages into a single scrolling `index.html`; code cleanup and JSDoc comments.

## 2026-06-22
### Completed
- Began the single-page site merge and the annual-average column work.

## 2026-06-15
### Completed
- Added the store, item-search, and date-range filters to the live pivot table.
- Began the store-comparison feature and the percent-change column.
- First mobile-responsiveness pass (sticky item column, touch-friendly controls, `-webkit-sticky` fix for Safari).

## 2026-06-12
### Completed
- Submitted the **First Draft + Time Log** deliverable.
- Connected the website to the live API for the first time — the **Weekly Price Summary** pivot table now renders real data from Supabase.
- Added store filter, item search, and CSV export (exports from the filtered data model, not the DOM).
- Resolved a CORS "Failed to fetch" issue by enabling the `cors` middleware and serving the page over HTTP.

## 2026-06-08
### Completed
- Added the `/api/monthly-avg/pivot` endpoint and began frontend integration via `fetch()`.
- Updated the README to reflect the PostgreSQL/Supabase migration.

## 2026-06-01
### Continuation (Summer Session 1)
- Reviewed the Spring 2026 handoff document, meeting notes, and codebase; audited what worked and what needed rebuilding.
- Completed the **MariaDB → Supabase/PostgreSQL** migration of `import.js` and `server.js` (placeholder syntax, `RETURNING`, SSL, `CASE WHEN` monthly-average logic).
- Configured `.env` for Supabase and re-imported existing weekly data (165 records per month verified).

---

## 2026-03-02
### Completed
- Recorded project demonstration video for submission.
- Completed required group peer evaluation documentation.
- Connected the group management board to the main GitHub repository for project tracking.

---

## 2026-02-28
### Completed
- Conducted and presented the live project demonstration on Zoom.
- Finalized demo materials and project explanation for presentation.

---

## 2026-02-26
### Completed
- Completed Week 3 grocery price data collection.
- Continued preparation of grocery price dataset for analysis.

---

## 2026-02-19
### Completed
- Continued weekly grocery price collection and spreadsheet tracking.
- Verified consistency of item sizes and categories across stores.

---

## 2026-02-10
### Completed
- Began preparation for project demo presentation.
- Organized repository infrastructure and development workflow.

---

## 2026-01-26
### Project Initialization
- Created project development board for task tracking.
- Began development of frontend website interface.
- Began development of backend API using Node.js and Express.
- Planned sliding 12-month database logic for long-term data display.
- Started weekly grocery price data collection process.
