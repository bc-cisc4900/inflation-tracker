-- seed.sql
-- Starter seed data based on sample grocery pricing sheet
--
-- Purpose:
-- Inserts starter data for stores, items, and sample grocery prices.
--
-- Why it exists:
-- This file allows the team to test the schema with realistic project data.
--
-- Inputs:
-- - Run after schema.sql has been executed successfully.
--
-- Outputs:
-- - Populates the database with sample records for development and testing.

INSERT INTO Stores (store_name) VALUES
('Aldi'),
('Key Food'),
('Stop & Shop'),
('Trader Joe''s');

INSERT INTO Items (item_name, category, brand, unit_size, substitution_rule) VALUES
('20 oz Organic White Bread', 'Bakery / Grains', NULL, '20 oz', 'Closest organic white bread of same size'),
('Gold Medal All-Purpose Flour', 'Baking & Cooking Essentials', 'Gold Medal', '2 lb', 'Closest all-purpose flour, same size'),
('Morton''s Salt', 'Baking & Cooking Essentials', 'Morton''s', '24 oz', 'Closest table salt, same size'),
('Granulated White Sugar', 'Baking & Cooking Essentials', NULL, '4 lb', 'Closest granulated white sugar, same size'),
('Folgers Classic Roast Coffee', 'Beverages', 'Folgers', '12 oz', 'Closest medium roast ground coffee'),
('Coca-Cola', 'Beverages', 'Coca-Cola', '1 can', 'Equivalent single can cola only if exact unavailable'),
('Tropicana Orange Juice No Pulp', 'Beverages', 'Tropicana', '46 oz', 'Closest no-pulp orange juice, same size'),
('Campbell''s Chicken Soup', 'Canned & Shelf Stable Foods', 'Campbell''s', '10.5 oz', 'Closest chicken soup can, same size'),
('Ragu Tomato Pasta Sauce', 'Canned & Shelf Stable Foods', 'Ragu', '24 oz', 'Closest tomato pasta sauce, same size'),
('Canola Oil', 'Canned & Shelf Stable Foods', NULL, '24 oz', 'Closest canola oil, same size'),
('Bush''s Baked Beans', 'Canned & Shelf Stable Foods', 'Bush''s', '15 oz', 'Closest baked beans, same size'),
('Organic Whole Milk', 'Dairy', NULL, '1 gallon', 'Closest organic whole milk'),
('Grade A Organic White Eggs', 'Dairy', NULL, '1 dozen', 'Closest grade A organic white eggs'),
('Land O'' Lakes Unsalted Butter', 'Dairy', 'Land O'' Lakes', '1 lb', 'Closest unsalted butter, same size'),
('Kraft Cheddar Cheese', 'Dairy', 'Kraft', '8 oz', 'Any cheddar, same size'),
('Chobani Original Yogurt', 'Dairy', 'Chobani', '6.7 oz', 'Closest original yogurt, same size'),
('Eggo Waffles', 'Frozen Foods', 'Eggo', '12 ct', 'Closest waffle pack, same count'),
('Gala Apples', 'Fruits', NULL, '1 lb', 'Closest gala apples by weight'),
('Regular Yellow Bananas', 'Fruits', NULL, '1 lb', 'Standard yellow bananas by weight'),
('Navel Oranges', 'Fruits', NULL, '1 lb', 'Closest navel oranges by weight'),
('Store-Brand White Rice', 'Grains & Dried Goods', 'Store Brand', '2 lb', 'Closest white rice, same size'),
('Barilla Spaghetti Pasta', 'Grains & Dried Goods', 'Barilla', '16 oz', 'Closest spaghetti, same size'),
('Kellogg''s Frosted Flakes', 'Grains & Dried Goods', 'Kellogg''s', NULL, 'Closest frosted cereal'),
('Ground Chicken', 'Meat & Protein', NULL, '1 lb', 'Closest ground chicken, same size'),
('Ground Beef', 'Meat & Protein', NULL, '1 lb', 'Closest 80% lean ground beef'),
('Bumble Bee Canned Tuna', 'Seafood', 'Bumble Bee', '5 oz', 'Closest canned tuna, same size'),
('Big Beef Tomatoes', 'Vegetables', NULL, '1 lb', 'Closest beef tomatoes by weight'),
('Russet Potatoes', 'Vegetables', NULL, '1 lb', 'Closest russet potatoes by weight'),
('Yellow Onions', 'Vegetables', NULL, '1 lb', 'Closest yellow onions by weight'),
('Fresh Garlic', 'Vegetables', NULL, '8 oz', 'Closest fresh garlic, same size'),
('Whole Carrots', 'Vegetables', NULL, '1 lb', 'Closest whole carrots by weight'),
('Organic Chicken Breast', 'Meat & Protein', NULL, '1 lb', 'Closest organic chicken breast'),
('Distilled White Vinegar', 'Baking & Cooking Essentials', NULL, '32 oz', 'Closest distilled white vinegar, same size');

-- Example seed records for one collection date
INSERT INTO Prices (store_id, item_id, date_recorded, price_week1, price_monthly, notes) VALUES
(1, 1, '2026-02-26', 2.78, 2.78, 'National avg: 1.83'),
(2, 1, '2026-02-26', 3.39, 3.39, 'National avg: 1.83'),
(3, 1, '2026-02-26', 2.50, 2.50, 'National avg: 1.83'),
(4, 1, '2026-02-26', 2.49, 2.49, 'National avg: 1.83'),

(1, 2, '2026-02-26', 1.99, 1.99, 'National avg: 1.10'),
(2, 2, '2026-02-26', 1.50, 1.50, 'National avg: 1.10'),
(3, 2, '2026-02-26', 3.79, 3.79, 'National avg: 1.10'),
(4, 2, '2026-02-26', 2.99, 2.99, 'National avg: 1.10'),

(1, 3, '2026-02-26', 0.85, 0.85, 'National avg: 0.75'),
(2, 3, '2026-02-26', 0.75, 0.75, 'National avg: 0.75'),
(3, 3, '2026-02-26', 0.99, 0.99, 'National avg: 0.75'),
(4, 3, '2026-02-26', 1.69, 1.69, 'National avg: 0.75'),

(1, 4, '2026-02-26', 2.89, 2.89, 'National avg: 3.96'),
(2, 4, '2026-02-26', 3.99, 3.99, 'National avg: 3.96'),
(3, 4, '2026-02-26', 4.99, 4.99, 'National avg: 3.96'),
(4, 4, '2026-02-26', 4.49, 4.49, 'National avg: 3.96'),

(1, 5, '2026-02-26', 5.71, 5.71, 'National avg: 9.05'),
(2, 5, '2026-02-26', 10.99, 10.99, 'National avg: 9.05'),
(3, 5, '2026-02-26', 1.99, 1.99, 'National avg: 9.05'),
(4, 5, '2026-02-26', 6.99, 6.99, 'National avg: 9.05'),

(1, 6, '2026-02-26', 2.09, 2.09, 'National avg: 1.31'),
(2, 6, '2026-02-26', 2.89, 2.89, 'National avg: 1.31'),
(3, 6, '2026-02-26', 3.69, 3.69, 'National avg: 1.31'),
(4, 6, '2026-02-26', 1.99, 1.99, 'National avg: 1.31'),

(1, 7, '2026-02-26', 3.29, 3.29, 'National avg: 4.87'),
(2, 7, '2026-02-26', 5.49, 5.49, 'National avg: 4.87'),
(3, 7, '2026-02-26', 5.59, 5.59, 'National avg: 4.87'),
(4, 7, '2026-02-26', 3.99, 3.99, 'National avg: 4.87'),

(1, 8, '2026-02-26', 1.19, 1.19, 'National avg: 1.30'),
(2, 8, '2026-02-26', 5.78, 5.78, 'National avg: 1.30'),
(3, 8, '2026-02-26', 2.49, 2.49, 'National avg: 1.30'),
(4, 8, '2026-02-26', 2.49, 2.49, 'National avg: 1.30'),

(1, 9, '2026-02-26', 1.10, 1.10, 'National avg: 2.29'),
(2, 9, '2026-02-26', 3.30, 3.30, 'National avg: 2.29'),
(3, 9, '2026-02-26', 2.49, 2.49, 'National avg: 2.29'),
(4, 9, '2026-02-26', 4.99, 4.99, 'National avg: 2.29'),

(1, 10, '2026-02-26', 10.64, 10.64, 'National avg: 5.08'),
(2, 10, '2026-02-26', 6.99, 6.99, 'National avg: 5.08'),
(3, 10, '2026-02-26', 17.55, 17.55, 'National avg: 5.08'),
(4, 10, '2026-02-26', 9.99, 9.99, 'National avg: 5.08');
