-- schema.sql
-- Grocery Store Inflation Tracker database schema
-- This schema follows the ER design:
-- STORES (1) -> (many) PRICES
-- ITEMS  (1) -> (many) PRICES

DROP TABLE IF EXISTS Prices;
DROP TABLE IF EXISTS Items;
DROP TABLE IF EXISTS Stores;

CREATE TABLE Stores (
    store_id INT AUTO_INCREMENT PRIMARY KEY,
    store_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    unit_size VARCHAR(100),
    substitution_rule VARCHAR(255)
);

CREATE TABLE Prices (
    price_id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    item_id INT NOT NULL,
    date_recorded DATE NOT NULL,
    price_week1 DECIMAL(6,2),
    price_week2 DECIMAL(6,2),
    price_week3 DECIMAL(6,2),
    price_week4 DECIMAL(6,2),
    price_monthly DECIMAL(6,2),
    notes VARCHAR(255),
    CONSTRAINT fk_prices_store
        FOREIGN KEY (store_id) REFERENCES Stores(store_id),
    CONSTRAINT fk_prices_item
        FOREIGN KEY (item_id) REFERENCES Items(item_id)
);
