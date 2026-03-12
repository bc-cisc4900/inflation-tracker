Link to Group Meeting Notes: https://docs.google.com/document/d/12wIxHZITvYMX94EEUfoCmIPFZYnbcl7tQ3wrw0Mazxk/edit?tab=t.2u7vyan4i8yi

# Grocery Store Inflation Tracker

## Project Description
The Grocery Store Inflation Tracker is a Brooklyn College group project that tracks the weekly prices of essential grocery items across multiple stores and compares local grocery price trends over time. The goal of the project is to organize, store, and display grocery price data so users can observe weekly changes, monthly averages, and inflation-related trends.

The project currently focuses on essential grocery items across stores such as Aldi, Key Food, Stop & Shop, Trader Joe’s, NetCost, and FreshDirect. Data is collected weekly, standardized using substitution rules, stored in a MariaDB database, and displayed through a website.

## Features
- Weekly grocery price tracking
- Monthly average price calculation
- Website display of grocery pricing data
- MariaDB database support
- Grocery data import support through the `grocery-importer/` folder
- Standardized substitution rules for comparable products
- Future support for 12-month sliding display logic
- Documentation of methodology and workflow

## Technologies Used
- HTML
- CSS
- JavaScript
- Node.js
- MariaDB
- SQL
- Git / GitHub
- Google Sheets
- Brooklyn College UNIX / web server environment

## Repository Structure
- `website/` - project website files
- `grocery-importer/` - importer/backend-related files
- `database/` - SQL schema, setup files, and queries
- `docs/` - project documentation, methodology, notes, and test cases
- `tests/` - sample inputs and expected outputs
- `samples/` - example CSV/sample data files
- `database_schema.jpg` - visual database schema image

## Installation Instructions
See:
- `docs/installation.md`
- `database/db_setup_instructions.md`

## Execution Instructions
See:
- `docs/execution.md`

## Team Members
- Gabriel Krishtul — Project Manager, Database Architect
- Andrew Castillo-Fajardo — Backend Developer
- Yuan Ruan — Frontend Developer
- Nicholas Cai — Data Collection, QA
- Mohamed Massoud — Data Collection, QA

## Current Project Status
The project currently includes:
- grocery item planning and standardization
- weekly spreadsheet tracking
- live website hosting
- database schema planning
- grocery importer/backend files
- initial GitHub repo and project workflow documentation

## Documentation
Additional project details are available in the `docs/` folder, including:
- project description
- meeting notes
- methodology
- substitution rules
- team roles
- test cases
- manual fallback procedures
