package payment

import (
	"errors"
	"testing"

	"github.com/google/uuid"
)

func TestDoubleEntryLedger(t *testing.T) {
	pgClearingAcct := uuid.New()
	escrowLiabilityAcct := uuid.New()
	feeRevenueAcct := uuid.New()
	supplierPayableAcct := uuid.New()

	orderID := uuid.New()

	// Scenario 1: Customer payment received via PG
	// Debit: PG Clearing (Asset) $1,000 (100,000 minor)
	// Credit: Escrow Liability (Liability) $1,000 (100,000 minor)
	paymentEntries := []Entry{
		{AccountID: pgClearingAcct, DebitMinor: 100000, CreditMinor: 0, Memo: "PG Capture"},
		{AccountID: escrowLiabilityAcct, DebitMinor: 0, CreditMinor: 100000, Memo: "Escrow Hold"},
	}

	j1, err := CreateJournal(orderID, "PAYMENT_CAPTURE", "USD", paymentEntries)
	if err != nil {
		t.Fatalf("Failed to create balanced journal: %v", err)
	}
	if j1.Currency != "USD" {
		t.Errorf("Expected currency USD, got %s", j1.Currency)
	}

	// Scenario 2: Unbalanced journal attempt
	// Debit $1,000, Credit $950 -> Must fail!
	unbalancedEntries := []Entry{
		{AccountID: pgClearingAcct, DebitMinor: 100000, CreditMinor: 0},
		{AccountID: escrowLiabilityAcct, DebitMinor: 0, CreditMinor: 95000},
	}
	_, err = CreateJournal(orderID, "PAYMENT_CAPTURE", "USD", unbalancedEntries)
	if !errors.Is(err, ErrUnbalancedJournal) {
		t.Errorf("Expected ErrUnbalancedJournal, got %v", err)
	}

	// Scenario 3: Settlement Distribution
	// Escrow released:
	// Debit: Escrow Liability 100,000
	// Credit: Fee Revenue 5,000 (5% platform commission)
	// Credit: Supplier Payable 95,000
	settlementEntries := []Entry{
		{AccountID: escrowLiabilityAcct, DebitMinor: 100000, CreditMinor: 0, Memo: "Release Escrow"},
		{AccountID: feeRevenueAcct, DebitMinor: 0, CreditMinor: 5000, Memo: "Platform 5% Fee"},
		{AccountID: supplierPayableAcct, DebitMinor: 0, CreditMinor: 95000, Memo: "Supplier Net Payout"},
	}
	j2, err := CreateJournal(orderID, "SETTLEMENT_RELEASE", "USD", settlementEntries)
	if err != nil {
		t.Fatalf("Settlement distribution journal failed: %v", err)
	}

	// Scenario 4: Reversal of Journal 2
	revJ, err := CreateReversal(j2, "Dispute Arbitration Adjust")
	if err != nil {
		t.Fatalf("Reversal creation failed: %v", err)
	}
	if len(revJ.Entries) != 3 {
		t.Errorf("Expected 3 reversed entries, got %d", len(revJ.Entries))
	}
	// In reversal, Escrow should now be Credit 100,000, Fee should be Debit 5,000, Supplier Debit 95,000
	if revJ.Entries[0].CreditMinor != 100000 || revJ.Entries[0].DebitMinor != 0 {
		t.Errorf("Reversal entry 0 mismatch: %+v", revJ.Entries[0])
	}
}

