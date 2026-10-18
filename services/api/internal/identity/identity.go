package identity

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

var (
	ErrUnauthorized       = errors.New("unauthorized request")
	ErrForbidden          = errors.New("forbidden: insufficient organization role or capability")
	ErrCrossTenantAccess  = errors.New("cross-tenant access prohibited")
	ErrSelfApproval       = errors.New("self-approval violation: purchaser cannot approve own requisition")
	ErrInactiveMembership = errors.New("user membership in organization is inactive")
)

type Role string

const (
	RoleOrgOwner            Role = "ORG_OWNER"
	RoleBuyerPurchaser      Role = "BUYER_PURCHASER"
	RoleBuyerApprover       Role = "BUYER_APPROVER"
	RoleBuyerFinance        Role = "BUYER_FINANCE"
	RoleSupplierSales       Role = "SUPPLIER_SALES"
	RoleSupplierFulfillment Role = "SUPPLIER_FULFILLMENT"
	RoleSupplierFinance     Role = "SUPPLIER_FINANCE"
	RolePlatformAdmin       Role = "PLATFORM_ADMIN"
)

type UserSession struct {
	UserID         uuid.UUID `json:"user_id"`
	Email          string    `json:"email"`
	OrganizationID uuid.UUID `json:"organization_id"`
	Role           Role      `json:"role"`
	IsSupplier     bool      `json:"is_supplier"`
	IsBuyer        bool      `json:"is_buyer"`
	IssuedAt       time.Time `json:"issued_at"`
	ExpiresAt      time.Time `json:"expires_at"`
}

// AuthorizeTenant ensures the authenticated session belongs to the targeted organization.
func AuthorizeTenant(session *UserSession, targetOrgID uuid.UUID) error {
	if session == nil {
		return ErrUnauthorized
	}
	if session.Role == RolePlatformAdmin {
		return nil // Platform admins have global audit authority
	}
	if session.OrganizationID != targetOrgID {
		return fmt.Errorf("%w: session_org=%s target_org=%s", ErrCrossTenantAccess, session.OrganizationID, targetOrgID)
	}
	return nil
}

// ValidatePurchaserApproval enforces strict Segregation of Duties (SoD).
// A purchaser cannot approve their own purchase requisition.
func ValidatePurchaserApproval(purchaserUserID, approverUserID uuid.UUID) error {
	if purchaserUserID == approverUserID {
		return fmt.Errorf("%w: user %s attempted self-approval", ErrSelfApproval, purchaserUserID)
	}
	return nil
}

// HasCapability checks whether the session role satisfies the required enterprise action.
func (s *UserSession) HasCapability(requiredCapability string) bool {
	if s == nil {
		return false
	}
	if s.Role == RolePlatformAdmin || s.Role == RoleOrgOwner {
		return true
	}
	switch requiredCapability {
	case "BUYER_PURCHASE":
		return s.IsBuyer && (s.Role == RoleBuyerPurchaser || s.Role == RoleBuyerApprover)
	case "BUYER_APPROVE":
		return s.IsBuyer && s.Role == RoleBuyerApprover
	case "SUPPLIER_QUOTE":
		return s.IsSupplier && s.Role == RoleSupplierSales
	case "SUPPLIER_DISPATCH":
		return s.IsSupplier && s.Role == RoleSupplierFulfillment
	case "FINANCE_DISBURSE":
		return s.Role == RoleBuyerFinance || s.Role == RoleSupplierFinance
	default:
		return false
	}
}
