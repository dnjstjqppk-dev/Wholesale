-- db/queries/trade.sql
-- Name: GetOrderByID :one
SELECT o.id, o.order_number, o.order_group_id, o.buyer_organization_id, o.supplier_organization_id,
       o.currency, o.subtotal_minor, o.tax_minor, o.shipping_minor, o.total_amount_minor,
       o.order_status, o.payment_status, o.fulfillment_status, o.dispute_status, o.settlement_status,
       o.created_at, o.updated_at
FROM trade_orders o
WHERE o.id = $1 LIMIT 1;

-- Name: CreateTradeOrder :one
INSERT INTO trade_orders (
    order_number, order_group_id, buyer_organization_id, supplier_organization_id,
    currency, subtotal_minor, tax_minor, shipping_minor, total_amount_minor,
    order_status, payment_status, fulfillment_status, dispute_status, settlement_status
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
RETURNING *;

-- Name: GetContractByOrderID :one
SELECT id, order_id, contract_number, document_hash, incoterms_code, incoterms_version,
       incoterms_named_place, terms_text, buyer_signed_at, supplier_signed_at, is_fully_signed
FROM trade_contracts
WHERE order_id = $1 LIMIT 1;

-- Name: SignContractBuyer :one
UPDATE trade_contracts
SET buyer_signed_at = CURRENT_TIMESTAMP,
    buyer_signer_user_id = $2,
    is_fully_signed = (supplier_signed_at IS NOT NULL)
WHERE id = $1 AND buyer_signed_at IS NULL
RETURNING *;
