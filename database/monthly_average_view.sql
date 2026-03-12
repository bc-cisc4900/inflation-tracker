-- monthly_average_view.sql
-- A view that joins price data with stores and items for easier reporting

CREATE OR REPLACE VIEW vw_monthly_prices AS
SELECT
    p.price_id,
    s.store_name,
    i.item_name,
    i.category,
    i.brand,
    i.unit_size,
    p.date_recorded,
    p.price_week1,
    p.price_week2,
    p.price_week3,
    p.price_week4,
    p.price_monthly,
    p.notes
FROM Prices p
JOIN Stores s ON p.store_id = s.store_id
JOIN Items i ON p.item_id = i.item_id;
