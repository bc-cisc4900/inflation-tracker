-- sliding_window_query.sql
-- Starter query for showing the most recent 12 price records for one item

SELECT
    s.store_name,
    i.item_name,
    p.date_recorded,
    p.price_week1,
    p.price_week2,
    p.price_week3,
    p.price_week4,
    p.price_monthly
FROM Prices p
JOIN Stores s ON p.store_id = s.store_id
JOIN Items i ON p.item_id = i.item_id
WHERE i.item_name = '20 oz Organic White Bread'
ORDER BY p.date_recorded DESC
LIMIT 12;
