-- schema.sql
-- Purpose:
-- This file creates the main database structure for the Grocery Store Inflation Tracker project.
--
-- Why it exists:
-- The project needs a normalized relational schema to store grocery stores,
-- tracked items, and weekly/monthly price records in a consistent format.
--
-- Inputs:
-- - Executed inside the MariaDB client after selecting the grocery_inflation database.
--
-- Outputs:
-- - Creates Stores, Items, and Prices tables used by the project.

-- Stores table
-- Stores each grocery source being tracked.
CREATE TABLE IF NOT EXISTS Stores (
    store_id INT PRIMARY KEY AUTO_INCREMENT,
    store_name VARCHAR(100) NOT NULL UNIQUE
);

-- Items table
-- Stores each grocery item, category, and item-matching rule.
CREATE TABLE IF NOT EXISTS Items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    unit_size VARCHAR(100),
    substitution_rule TEXT
);

-- Prices table
-- Stores one price record per store/item/date combination.
-- This supports weekly collection and future monthly averaging logic.
CREATE TABLE IF NOT EXISTS Prices (
    price_id INT PRIMARY KEY AUTO_INCREMENT,
    store_id INT NOT NULL,
    item_id INT NOT NULL,
    date_recorded DATE NOT NULL,
    price_week1 DECIMAL(10,2),
    price_week2 DECIMAL(10,2),
    price_week3 DECIMAL(10,2),
    price_week4 DECIMAL(10,2),
    price_monthly DECIMAL(10,2),
    notes TEXT,
    FOREIGN KEY (store_id) REFERENCES Stores(store_id),
    FOREIGN KEY (item_id) REFERENCES Items(item_id)
);
