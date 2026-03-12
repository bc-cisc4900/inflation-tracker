-- sliding_window_query.sql
-- Purpose:
-- Returns the most recent 12 records for each tracked item/store view.
--
-- Why it exists:
-- The project requires a sliding 12-month style display so older records
-- eventually rotate out of the visible reporting window.
--
-- Inputs:
-- - Existing price records with valid dates.
--
-- Outputs:
-- - A result set ordered by newest records first, limited to the latest 12 rows.

SELECT
    s.store_name,
    i.item_name,
    i.category,
    p.date_recorded,
    p.price_monthly,
    p.notes
FROM Prices p
JOIN Stores s ON p.store_id = s.store_id
JOIN Items i ON p.item_id = i.item_id
ORDER BY p.date_recorded DESC
LIMIT 12;
