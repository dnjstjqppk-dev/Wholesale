package support

import (
	"errors"
	"testing"

	"github.com/google/uuid"
)

func TestDisputeLifecycleAndArbitration(t *testing.T) {
	orderID := uuid.New()
	buyerOrgID := uuid.New()
	supplierOrgID := uuid.New()
	adminID := uuid.New()

	// Claim $5,000 (500,000 minor)
	disp := NewDispute(orderID, buyerOrgID, supplierOrgID, 500000, "USD", "Severe cosmetic defects on 20% of batch")

	if disp.Status != DisputeStatusOpened {
		t.Errorf("Expected OPENED, got %s", disp.Status)
	}
	if len(disp.AuditTrail) != 1 {
		t.Errorf("Expected 1 audit entry, got %d", len(disp.AuditTrail))
	}

	// Non-admin attempt to arbitrate: Must Fail
	err := disp.Arbitrate(buyerOrgID, false, 500000, 0, "Self decision")
	if !errors.Is(err, ErrUnauthorizedArbitrator) {
		t.Errorf("Expected ErrUnauthorizedArbitrator, got %v", err)
	}

	// Arbitrate with excessive amount: 300,000 + 300,000 = 600,000 > 500,000 -> Must Fail
	err = disp.Arbitrate(adminID, true, 300000, 300000, "Excessive award")
	if !errors.Is(err, ErrInvalidResolution) {
		t.Errorf("Expected ErrInvalidResolution, got %v", err)
	}

	// Valid 50-50 arbitration: Refund 250,000, Payout 250,000
	err = disp.Arbitrate(adminID, true, 250000, 250000, "Split defect liability 50/50")
	if err != nil {
		t.Fatalf("Valid arbitration failed: %v", err)
	}

	if disp.ResolvedAt == nil {
		t.Error("ResolvedAt was not recorded")
	}
	if len(disp.AuditTrail) != 2 {
		t.Errorf("Expected 2 audit trail entries, got %d", len(disp.AuditTrail))
	}

	// Attempting second arbitration must fail
	err = disp.Arbitrate(adminID, true, 250000, 250000, "Duplicate attempt")
	if !errors.Is(err, ErrDisputeAlreadyResolved) {
		t.Errorf("Expected ErrDisputeAlreadyResolved, got %v", err)
	}
}
