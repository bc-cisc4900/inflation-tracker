# Database Setup Instructions

## Purpose
This folder contains the SQL files used to create, seed, and test the Grocery Store Inflation Tracker database.

## Schema Design
The database follows a 3-table ER design:
- `Stores`
- `Items`
- `Prices`

Relationships:
- one store can have many price records
- one item can have many price records

## Recommended Setup Order
Run the files in this order:

1. `schema.sql`
2. `seed.sql`
3. `monthly_average_view.sql`
4. `sample_queries.sql`
5. `sliding_window_query.sql`

## Basic Workflow
1. Log into MariaDB.
2. Select the project database:
   `USE grocery_inflation;`
3. Run the schema file to create tables.
4. Run the seed file to insert sample starter data.
5. Run the view file.
6. Test the database with the sample queries.

## Notes
- The current seed data is starter/demo data based on one collection snapshot.
- Additional rows can be added later for more weeks and more months.
- Weekly fields can be filled as more data is collected over time.
- The sliding window query is a starter version of the 12-entry logic described in project notes.

## Important Reminder
Do not store real passwords or sensitive credentials in this repository.
