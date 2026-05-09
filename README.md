![Grocery Store Inflation Tracker Banner](website/assets/grocery-banner.png)

# BC-Basket (Formerly Grocery Store Inflation Tracker)

Link to Group Meeting Notes: https://docs.google.com/document/d/12wIxHZITvYMX94EEUfoCmIPFZYnbcl7tQ3wrw0Mazxk/edit?tab=t.2u7vyan4i8yi
Link to Hand-Off Document For Future Groups: https://docs.google.com/document/d/1IPaZB4fUfsX4hqmfqDeX0cIzWxPe7qWQyINxg5CpEE0/edit?usp=sharing
Link to Live Website: https://bc-cisc4900.github.io/inflation-tracker

## Project Description
BC-Basket is a Brooklyn College group project that tracks the weekly prices of essential grocery items across multiple stores and compares local grocery price trends over time. The goal of the project is to organize, store, and display grocery price data so users can observe weekly changes, monthly averages, and inflation-related trends.

### Team Members
- Gabriel Krishtul — Project Manager, Database Architect
- Andrew Castillo-Fajardo — Backend Developer
- Yuan Ruan — Frontend Developer
- Mohamed Massoud — Database Architect, Web Developer
- Nicholas Cai — Data Collection, QA

## Repository Structure
- `website/` - project website files
- `grocery-importer/` - importer/backend-related files
- `database/` - SQL schema, setup files, and queries
- `docs/` - project documentation, methodology, notes, and test cases
- `tests/` - sample inputs and expected outputs
- `samples/` - backup copy of our 14 weeks of recorded prices and 12-Month Breakdown
- `database_schema.jpg` - visual database schema image

### Features
- Weekly grocery price tracking
- Monthly average price calculation
- Website display of grocery pricing data
- Supabase database support
- Grocery data import support through the `grocery-importer/` folder
- Standardized substitution rules for comparable products
- 12-month breakdown display showing the most recent monthly grocery price trends
- Future improvement: reverse-sort the pivot table so the newest months appear first automatically
- Documentation of methodology and workflow

### Installation Instructions
See:
- `docs/installation.md`
- `database/db_setup_instructions.md`

### Execution Instructions
See:
- `docs/execution.md`

### Technologies Used
- HTML
- CSS
- JavaScript
- Node.js
- Supabase
- SQL
- Git / GitHub
- Google Sheets
- Brooklyn College UNIX / web server environment

### Database Note
Earlier versions of this project used MariaDB/SkySQL. The final handoff version moved toward Supabase/PostgreSQL and Google Sheets as the main data workflow. Some older importer files may still reference MariaDB. Future groups should either update those scripts for Supabase/PostgreSQL or use the final spreadsheet/CSV workflow as the source of truth.

### Security Note
Do not commit private database passwords, service role keys, `.env` files, or editable Google Sheet links to the repository. Public links should only provide view access unless the professor or project owner approves otherwise.

### Final Handoff Completed
- Completed 14 weeks of grocery price collection.
- Created final 12-Month Breakdown table.
- Simplified website to focus on readable grocery price data.
- Added hand-off document for future semester groups.
- Updated setup and continuation instructions.
- Prepared final presentation and demo video materials.

### Current Project Status
The project currently includes:
- Final website hosted through GitHub Pages
- 14 weeks of collected grocery price data
- Final 12-Month Breakdown table
- Google Sheets workflow for data entry and review
- Supabase/PostgreSQL database setup
- SQL schema and sample queries
- Documentation for setup, execution, methodology, testing, and future continuation
- Hand-off document for the next semester group

### Documentation
Additional project details are available in the `docs/` folder, including:
- project description
- meeting notes
- methodology
- substitution rules
- team roles
- test cases
- manual fallback procedures

### Future Cohort Documentation
See SETUP.md for setup, deployment, and continuation instructions.
