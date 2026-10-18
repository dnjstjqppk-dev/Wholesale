package settlement

import (
	"errors"
	"testing"

	"github.com/google/uuid"
)

func TestSettlementCalculationAndDisputeHold(t *testing.T) {
	orderID := uuid.New()
	supplierID := uuid.New()

	// Gross: $10,000 (1,000,000 minor), Fee: 500 bps (5.00%), Refund: 0, Inspection Required: true
	rec, err := CalculateSettlement(orderID, supplierID, 1000000, 500, 0, "USD", true)
	if err != nil {
		t.Fatalf("CalculateSettlement failed: %v", err)
	}

	if rec.FeeAmountMinor != 50000 || rec.NetPayoutMinor != 950000 {
		t.Errorf("Calculation mismatch: fee=%d, net=%d", rec.FeeAmountMinor, rec.NetPayoutMinor)
	}

	// Test 1: RequestRelease fails because inspection has not passed
	err = rec.RequestRelease()
	if !errors.Is(err, ErrInspectionFailed) {
		t.Errorf("Expected ErrInspectionFailed, got: %v", err)
	}

	// Pass inspection
	rec.InspectionPassed = true

	// Now release should succeed
	err = rec.RequestRelease()
	if err != nil {
		t.Fatalf("Release failed after passing inspection: %v", err)
	}
	if rec.Status != StatusReleaseEligible {
		t.Errorf("Expected RELEASE_ELIGIBLE, got %s", rec.Status)
	}

	// Test 2: Buyer opens dispute -> Settlement must be frozen back to HELD
	rec.FreezeOnDispute()
	if rec.Status != StatusHeld || !rec.HasActiveDispute {
		t.Errorf("Expected HELD status on dispute, got %s", rec.Status)
	}

	// Attempting to release while in dispute must fail
	err = rec.RequestRelease()
	if !errors.Is(err, ErrDisputeActiveHold) {
		t.Errorf("Expected ErrDisputeActiveHold during dispute, got: %v", err)
	}
}

