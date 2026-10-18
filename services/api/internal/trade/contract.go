package trade

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

var (
	ErrContractAlreadySigned = errors.New("contract is already fully signed and immutable")
	ErrInvalidDocumentHash   = errors.New("document hash mismatch; cannot sign altered contract")
	ErrSelfApprovalBlocked   = errors.New("self-approval is strictly forbidden in purchase governance")
	ErrUnauthorizedSigner    = errors.New("signer is not authorized for this contract")
)

type IncotermsRule struct {
	Code       string `json:"code"`        // e.g. "FOB", "CIF", "DDP"
	Version    string `json:"version"`     // "Incoterms 2020"
	NamedPlace string `json:"named_place"` // e.g. "Busan Port, Korea"
}

type ContractBody struct {
	ContractNumber     string        `json:"contract_number"`
	OrderID            uuid.UUID     `json:"order_id"`
	BuyerOrgID         uuid.UUID     `json:"buyer_org_id"`
	SupplierOrgID      uuid.UUID     `json:"supplier_org_id"`
	TotalAmountMinor   int64         `json:"total_amount_minor"`
	Currency           string        `json:"currency"`
	Incoterms          IncotermsRule `json:"incoterms"`
	LeadTimeDays       int           `json:"lead_time_days"`
	DownPaymentPercent int           `json:"down_payment_percent"`
	ItemsHash          string        `json:"items_hash"`
	TermsAndConditions string        `json:"terms_and_conditions"`
}

type Contract struct {
	ID                 uuid.UUID
	Body               ContractBody
	DocumentHash       string // SHA-256
	BuyerSignedAt      *time.Time
	BuyerSignerID      *uuid.UUID
	SupplierSignedAt   *time.Time
	SupplierSignerID   *uuid.UUID
	IsFullySigned      bool
}

// ComputeHash calculates canonical SHA-256 hash of contract body.
func ComputeHash(body ContractBody) (string, error) {
	bytes, err := json.Marshal(body)
	if err != nil {
		return "", err
	}
	hash := sha256.Sum256(bytes)
	return hex.EncodeToString(hash[:]), nil
}

// NewContract initializes a trade contract with computed SHA-256 hash.
func NewContract(body ContractBody) (*Contract, error) {
	hash, err := ComputeHash(body)
	if err != nil {
		return nil, err
	}
	return &Contract{
		ID:           uuid.New(),
		Body:         body,
		DocumentHash: hash,
	}, nil
}

// Sign verifies that the submitted document hash matches the canonical contract hash before applying signature.
func (c *Contract) Sign(signerUserID uuid.UUID, signerOrgID uuid.UUID, submittedHash string) error {
	if c.IsFullySigned {
		return ErrContractAlreadySigned
	}

	if submittedHash != c.DocumentHash {
		return fmt.Errorf("%w: submitted=%s, actual=%s", ErrInvalidDocumentHash, submittedHash, c.DocumentHash)
	}

	now := time.Now().UTC()

	if signerOrgID == c.Body.BuyerOrgID {
		c.BuyerSignerID = &signerUserID
		c.BuyerSignedAt = &now
	} else if signerOrgID == c.Body.SupplierOrgID {
		c.SupplierSignerID = &signerUserID
		c.SupplierSignedAt = &now
	} else {
		return ErrUnauthorizedSigner
	}

	if c.BuyerSignedAt != nil && c.SupplierSignedAt != nil {
		c.IsFullySigned = true
	}

	return nil
}

// ValidateApproval prevents requester from approving their own purchase order.
func ValidateApproval(requesterUserID uuid.UUID, approverUserID uuid.UUID) error {
	if requesterUserID == approverUserID {
		return ErrSelfApprovalBlocked
	}
	return nil
}

