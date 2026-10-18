package support

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

var (
	ErrDisputeAlreadyResolved = errors.New("dispute is already resolved")
	ErrInvalidResolution     = errors.New("resolution amount exceeds disputed claim amount")
	ErrUnauthorizedArbitrator = errors.New("only platform administrators can arbitrate disputes")
)

type DisputeStatus string

const (
	DisputeStatusOpened         DisputeStatus = "OPENED"
	DisputeStatusUnderReview    DisputeStatus = "UNDER_REVIEW"
	DisputeStatusResolvedRefund DisputeStatus = "RESOLVED_REFUND"
	DisputeStatusResolvedPayout DisputeStatus = "RESOLVED_PAYOUT"
	DisputeStatusDismissed      DisputeStatus = "DISMISSED"
)

type AuditLog struct {
	ID        uuid.UUID `json:"id"`
	Action    string    `json:"action"`
	ActorID   uuid.UUID `json:"actor_id"`
	ActorRole string    `json:"actor_role"`
	Timestamp time.Time `json:"timestamp"`
	Details   string    `json:"details"`
}

type Dispute struct {
	ID                 uuid.UUID     `json:"id"`
	OrderID            uuid.UUID     `json:"order_id"`
	BuyerOrgID         uuid.UUID     `json:"buyer_org_id"`
	SupplierOrgID      uuid.UUID     `json:"supplier_org_id"`
	ClaimedAmountMinor int64         `json:"claimed_amount_minor"`
	Currency           string        `json:"currency"`
	Reason             string        `json:"reason"`
	Status             DisputeStatus `json:"status"`
	AuditTrail         []AuditLog    `json:"audit_trail"`
	RefundAmountMinor  int64         `json:"refund_amount_minor"`
	PayoutAmountMinor  int64         `json:"payout_amount_minor"`
	ResolvedAt         *time.Time    `json:"resolved_at,omitempty"`
}

func NewDispute(orderID, buyerOrgID, supplierOrgID uuid.UUID, claimedMinor int64, currency, reason string) *Dispute {
	dispID := uuid.New()
	d := &Dispute{
		ID:                 dispID,
		OrderID:            orderID,
		BuyerOrgID:         buyerOrgID,
		SupplierOrgID:      supplierOrgID,
		ClaimedAmountMinor: claimedMinor,
		Currency:           currency,
		Reason:             reason,
		Status:             DisputeStatusOpened,
		AuditTrail:         make([]AuditLog, 0),
	}
	d.AppendAudit("DISPUTE_OPENED", buyerOrgID, "BUYER_CORP", fmt.Sprintf("Opened dispute for %d minor %s: %s", claimedMinor, currency, reason))
	return d
}

func (d *Dispute) AppendAudit(action string, actorID uuid.UUID, role, details string) {
	d.AuditTrail = append(d.AuditTrail, AuditLog{
		ID:        uuid.New(),
		Action:    action,
		ActorID:   actorID,
		ActorRole: role,
		Timestamp: time.Now().UTC(),
		Details:   details,
	})
}

// Arbitrate settles the dispute by dividing the escrow between refund to buyer and payout to supplier.
func (d *Dispute) Arbitrate(arbitratorID uuid.UUID, isPlatformAdmin bool, refundMinor, payoutMinor int64, resolutionNotes string) error {
	if !isPlatformAdmin {
		return ErrUnauthorizedArbitrator
	}
	if d.Status != DisputeStatusOpened && d.Status != DisputeStatusUnderReview {
		return ErrDisputeAlreadyResolved
	}
	if refundMinor+payoutMinor > d.ClaimedAmountMinor {
		return fmt.Errorf("%w: total=%d, claimed=%d", ErrInvalidResolution, refundMinor+payoutMinor, d.ClaimedAmountMinor)
	}

	d.RefundAmountMinor = refundMinor
	d.PayoutAmountMinor = payoutMinor
	now := time.Now().UTC()
	d.ResolvedAt = &now

	if refundMinor > 0 && payoutMinor == 0 {
		d.Status = DisputeStatusResolvedRefund
	} else if payoutMinor > 0 && refundMinor == 0 {
		d.Status = DisputeStatusResolvedPayout
	} else {
		d.Status = DisputeStatusResolvedRefund
	}

	d.AppendAudit("ARBITRATION_RESOLVED", arbitratorID, "PLATFORM_ADMIN",
		fmt.Sprintf("Arbitrated: refund=%d, payout=%d. Notes: %s", refundMinor, payoutMinor, resolutionNotes))
	return nil
}
