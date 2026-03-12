-- monthly_average_view.sql
-- Purpose:
-- Creates a view for monthly grocery price averages.
--
-- Why it exists:
-- The project's main output is monthly average pricing, so this view provides
-- a simple way to read those values in a consistent format.
--
-- Inputs:
-- - Uses data already stored in Prices, Items, and Stores.
--
-- Outputs:
-- - A view showing joined monthly averages for reporting and website use.

CREATE OR REPLACE VIEW monthly_average_view AS
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
JOIN Items i ON p.item_id = i.item_id;
