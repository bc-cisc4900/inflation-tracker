-- sample_queries.sql
-- Useful test and demo queries for the Grocery Store Inflation Tracker database
--
-- Purpose:
-- Contains example queries used to inspect and test project data.
--
-- Why it exists:
-- These queries help verify that the database was set up correctly and that
-- grocery price records can be selected, joined, and analyzed.
--
-- Inputs:
-- - Assumes schema.sql and seed.sql have already been run.
--
-- Outputs:
-- - Returns readable result sets for stores, items, and price records.

-- Query 1: Show all stores currently tracked by the project.
SELECT * FROM Stores;

-- Query 2: Show all grocery items currently tracked by the project.
SELECT * FROM Items;

-- Query 3: Show joined price data with store and item names.
SELECT
    p.price_id,
    s.store_name,
    i.item_name,
    p.date_recorded,
    p.price_week1,
    p.price_monthly,
    p.notes
FROM Prices p
JOIN Stores s ON p.store_id = s.store_id
JOIN Items i ON p.item_id = i.item_id
ORDER BY p.date_recorded DESC, s.store_name, i.item_name;

-- Show all stores
SELECT * FROM Stores;

-- Show all items
SELECT * FROM Items;

-- Show all price records
SELECT * FROM Prices;

-- Show joined data with readable names
SELECT
    p.price_id,
    s.store_name,
    i.item_name,
    i.category,
    p.date_recorded,
    p.price_week1,
    p.price_week2,
    p.price_week3,
    p.price_week4,
    p.price_monthly,
    p.notes
FROM Prices p
JOIN Stores s ON p.store_id = s.store_id
JOIN Items i ON p.item_id = i.item_id
ORDER BY i.item_name, s.store_name;

-- Show one item across all stores
SELECT
    i.item_name,
    s.store_name,
    p.date_recorded,
    p.price_week1,
    p.price_monthly
FROM Prices p
JOIN Stores s ON p.store_id = s.store_id
JOIN Items i ON p.item_id = i.item_id
WHERE i.item_name = '20 oz Organic White Bread'
ORDER BY s.store_name;

-- Show average monthly price by item across stores
SELECT
    i.item_name,
    ROUND(AVG(p.price_monthly), 2) AS avg_monthly_across_stores
FROM Prices p
JOIN Items i ON p.item_id = i.item_id
GROUP BY i.item_name
ORDER BY i.item_name;
