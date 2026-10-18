-- db/queries/sourcing.sql
-- Name: CreateRFQ :one
INSERT INTO rfqs (buyer_organization_id, title, destination_country, expires_at, status)
VALUES ($1, $2, $3, $4, 'PUBLISHED')
RETURNING *;

-- Name: CreateQuote :one
INSERT INTO quotes (rfq_id, supplier_organization_id, status)
VALUES ($1, $2, 'ISSUED')
RETURNING *;

-- Name: CreateQuoteRevision :one
INSERT INTO quote_revisions (
    quote_id, revision_number, unit_price, currency, lead_time_days, incoterms, status
) VALUES ($1, $2, $3, $4, $5, $6, 'ISSUED')
RETURNING *;

-- Name: SupersedeQuoteRevision :exec
UPDATE quote_revisions
SET status = 'SUPERSEDED'
WHERE quote_id = $1 AND id = $2;

