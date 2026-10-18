package sourcing

import (
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

func TestRFQContactMasking(t *testing.T) {
	rfq := &RFQ{
		ID:                 uuid.New(),
		BuyerOrgID:         uuid.New(),
		BuyerContactEmail:  "procurement-vp@secretbuyer.com",
		BuyerContactPhone:  "+82-10-9999-8888",
		Title:              "10,000 Pcs Industrial Valve Sourcing",
		DestinationCountry: "US",
		Status:             "PUBLISHED",
		PrivateBlueprint:   "https://s3.internal/cad/valve_spec_confidential.dwg",
		CreatedAt:          time.Now(),
	}

	masked := rfq.MaskedRFQ()
	if masked["buyer_contact_email"] != nil || masked["buyer_contact_phone"] != nil {
		t.Error("Masked RFQ exposed private buyer contact details")
	}
	if masked["is_contact_masked"] != true {
		t.Error("Expected is_contact_masked to be true")
	}
}

func TestQuoteRevisionSuperseding(t *testing.T) {
	quote := &Quote{
		ID:            uuid.New(),
		RFQID:         uuid.New(),
		SupplierOrgID: uuid.New(),
	}

	// Issue Rev 1
	rev1 := quote.IssueNewRevision(decimal.RequireFromString("4.50"), 20, "FOB Busan", "USD")
	if rev1.RevisionNumber != 1 || rev1.Status != RevisionStatusIssued {
		t.Errorf("Unexpected rev1 state: %+v", rev1)
	}

	// Issue Rev 2 (Supplier amends price to $4.20)
	rev2 := quote.IssueNewRevision(decimal.RequireFromString("4.20"), 18, "CIF Los Angeles", "USD")
	if rev2.RevisionNumber != 2 || rev2.Status != RevisionStatusIssued {
		t.Errorf("Unexpected rev2 state: %+v", rev2)
	}

	// Rev 1 must now be SUPERSEDED
	if rev1.Status != RevisionStatusSuperseded {
		t.Errorf("Expected rev1 to be SUPERSEDED, got: %s", rev1.Status)
	}
	if len(quote.RevisionHistory) != 1 || quote.RevisionHistory[0].RevisionNumber != 1 {
		t.Error("Revision history was not updated properly")
	}
}

func TestCumulativeAwardBoundValidation(t *testing.T) {
	item := &RFQItem{
		ID:           uuid.New(),
		RequestedQty: decimal.NewFromInt(1000),
		AwardedQty:   decimal.Zero,
	}

	// 1st partial award: 600 -> Ok
	if err := item.AwardItem(decimal.NewFromInt(600)); err != nil {
		t.Fatalf("1st award failed: %v", err)
	}

	// 2nd partial award: 500 -> Must Fail (600 + 500 = 1100 > 1000)
	err := item.AwardItem(decimal.NewFromInt(500))
	if !errors.Is(err, ErrAwardExceedsRequestedQty) {
		t.Errorf("Expected ErrAwardExceedsRequestedQty, got: %v", err)
	}

	// 2nd corrected award: 400 -> Ok (600 + 400 = 1000)
	if err := item.AwardItem(decimal.NewFromInt(400)); err != nil {
		t.Fatalf("2nd corrected award failed: %v", err)
	}
	if !item.AwardedQty.Equal(decimal.NewFromInt(1000)) {
		t.Errorf("Expected awarded 1000, got: %s", item.AwardedQty)
	}
}
