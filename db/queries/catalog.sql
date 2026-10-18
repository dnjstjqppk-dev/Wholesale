-- db/queries/catalog.sql
-- Name: GetListingByID :one
SELECT l.id, l.organization_id, l.category_id, l.title, l.summary, l.description,
       l.moq, l.quantity_step, l.unit, l.lead_time_days, l.status, l.has_sample, l.created_at,
       o.legal_name as supplier_name, o.is_verified_supplier
FROM listings l
JOIN organizations o ON o.id = l.organization_id
WHERE l.id = $1 LIMIT 1;

-- Name: ListPublishedListings :many
SELECT l.id, l.organization_id, l.title, l.moq, l.quantity_step, l.unit, l.lead_time_days,
       o.legal_name as supplier_name, o.is_verified_supplier
FROM listings l
JOIN organizations o ON o.id = l.organization_id
WHERE l.status = 'PUBLISHED'
ORDER BY l.created_at DESC
LIMIT $1 OFFSET $2;

-- Name: ListPriceTiersForListing :many
SELECT pt.id, pt.price_list_id, pt.min_quantity, pt.max_quantity, pt.unit_price, pl.currency
FROM price_tiers pt
JOIN price_lists pl ON pl.id = pt.price_list_id
WHERE pl.listing_id = $1 AND pl.is_active = TRUE
ORDER BY pt.min_quantity ASC;

-- Name: ListSKUsForListing :many
SELECT id, listing_id, sku_code, variant_options, weight_kg, is_active
FROM skus
WHERE listing_id = $1 AND is_active = TRUE;
