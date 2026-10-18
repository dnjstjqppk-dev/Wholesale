-- db/queries/settlement.sql
-- Name: CreateSettlement :one
INSERT INTO settlements (
    order_id, supplier_organization_id, gross_amount_minor, fee_amount_minor,
    net_payout_minor, currency, status, inspection_passed
) VALUES ($1, $2, $3, $4, $5, $6, 'HELD', $7)
RETURNING *;

-- Name: HoldSettlementOnDispute :exec
UPDATE settlements
SET status = 'HELD',
    has_active_dispute = TRUE
WHERE order_id = $1;

-- Name: ReleaseSettlementPayout :one
UPDATE settlements
SET status = 'PAID_OUT',
    disbursed_at = CURRENT_TIMESTAMP
WHERE id = $1 AND status = 'RELEASE_ELIGIBLE' AND has_active_dispute = FALSE
RETURNING *;
