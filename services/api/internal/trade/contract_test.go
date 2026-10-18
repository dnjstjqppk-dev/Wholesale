package trade

import (
	"errors"
	"testing"

	"github.com/google/uuid"
)

func TestContractSigningAndIntegrity(t *testing.T) {
	buyerOrgID := uuid.New()
	supplierOrgID := uuid.New()
	orderID := uuid.New()

	buyerUserID := uuid.New()
	supplierUserID := uuid.New()

	body := ContractBody{
		ContractNumber:   "CTR-2026-0001",
		OrderID:          orderID,
		BuyerOrgID:       buyerOrgID,
		SupplierOrgID:    supplierOrgID,
		TotalAmountMinor: 5000000,
		Currency:         "USD",
		Incoterms: IncotermsRule{
			Code:       "FOB",
			Version:    "Incoterms 2020",
			NamedPlace: "Busan Port, Korea",
		},
		LeadTimeDays:       30,
		DownPaymentPercent: 30,
		ItemsHash:          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		TermsAndConditions: "Standard B2B Global Trade Terms",
	}

	contract, err := NewContract(body)
	if err != nil {
		t.Fatalf("Failed to create contract: %v", err)
	}

	// Test 1: Tampered Hash Rejected
	tamperedHash := "0000000000000000000000000000000000000000000000000000000000000000"
	err = contract.Sign(buyerUserID, buyerOrgID, tamperedHash)
	if !errors.Is(err, ErrInvalidDocumentHash) {
		t.Errorf("Expected ErrInvalidDocumentHash on tampered hash, got: %v", err)
	}

	// Test 2: Valid Buyer Signature
	err = contract.Sign(buyerUserID, buyerOrgID, contract.DocumentHash)
	if err != nil {
		t.Fatalf("Valid buyer signature failed: %v", err)
	}
	if contract.IsFullySigned {
		t.Error("Contract should not be fully signed after only buyer signature")
	}

	// Test 3: Valid Supplier Signature
	err = contract.Sign(supplierUserID, supplierOrgID, contract.DocumentHash)
	if err != nil {
		t.Fatalf("Valid supplier signature failed: %v", err)
	}
	if !contract.IsFullySigned {
		t.Error("Contract should be fully signed after both parties sign")
	}

	// Test 4: Attempt to re-sign or modify fully signed contract
	err = contract.Sign(buyerUserID, buyerOrgID, contract.DocumentHash)
	if !errors.Is(err, ErrContractAlreadySigned) {
		t.Errorf("Expected ErrContractAlreadySigned, got: %v", err)
	}

	// Test 5: Self-approval check in corporate governance
	sameUser := uuid.New()
	err = ValidateApproval(sameUser, sameUser)
	if !errors.Is(err, ErrSelfApprovalBlocked) {
		t.Errorf("Expected ErrSelfApprovalBlocked on same requester and approver, got: %v", err)
	}

	diffApprover := uuid.New()
	if err := ValidateApproval(sameUser, diffApprover); err != nil {
		t.Errorf("Unexpected error for valid approval: %v", err)
	}
}

