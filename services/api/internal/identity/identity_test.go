package identity

import (
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestTenantAuthorization(t *testing.T) {
	orgA := uuid.New()
	orgB := uuid.New()
	user1 := uuid.New()

	sessionA := &UserSession{
		UserID:         user1,
		OrganizationID: orgA,
		Role:           RoleBuyerPurchaser,
		IsBuyer:        true,
		IssuedAt:       time.Now(),
		ExpiresAt:      time.Now().Add(time.Hour),
	}

	// Access to Org A: Allowed
	if err := AuthorizeTenant(sessionA, orgA); err != nil {
		t.Errorf("Expected access allowed to own org, got %v", err)
	}

	// Access to Org B: Must fail with ErrCrossTenantAccess
	err := AuthorizeTenant(sessionA, orgB)
	if !errors.Is(err, ErrCrossTenantAccess) {
		t.Errorf("Expected ErrCrossTenantAccess on cross-tenant access, got %v", err)
	}

	// Platform admin can inspect any org
	adminSession := &UserSession{
		UserID:         uuid.New(),
		OrganizationID: uuid.Nil,
		Role:           RolePlatformAdmin,
	}
	if err := AuthorizeTenant(adminSession, orgB); err != nil {
		t.Errorf("Platform admin should access any org, got %v", err)
	}
}

func TestSegregationOfDutiesApproval(t *testing.T) {
	purchaser := uuid.New()
	differentApprover := uuid.New()

	// Self-approval must fail
	err := ValidatePurchaserApproval(purchaser, purchaser)
	if !errors.Is(err, ErrSelfApproval) {
		t.Errorf("Expected ErrSelfApproval on identical user ID, got %v", err)
	}

	// Different approver must succeed
	if err := ValidatePurchaserApproval(purchaser, differentApprover); err != nil {
		t.Errorf("Valid approval with different user failed: %v", err)
	}
}

func TestRoleCapabilities(t *testing.T) {
	purchaser := &UserSession{
		Role:    RoleBuyerPurchaser,
		IsBuyer: true,
	}
	if !purchaser.HasCapability("BUYER_PURCHASE") {
		t.Error("Buyer purchaser should have BUYER_PURCHASE capability")
	}
	if purchaser.HasCapability("BUYER_APPROVE") {
		t.Error("Buyer purchaser must NOT have BUYER_APPROVE capability")
	}

	approver := &UserSession{
		Role:    RoleBuyerApprover,
		IsBuyer: true,
	}
	if !approver.HasCapability("BUYER_APPROVE") {
		t.Error("Buyer approver should have BUYER_APPROVE capability")
	}
}

