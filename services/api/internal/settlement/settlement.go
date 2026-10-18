package settlement

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
)

var (
	ErrDisputeActiveHold = errors.New("cannot release settlement while active dispute exists on trade order")
	ErrInspectionFailed  = errors.New("cannot release settlement before required inspection passes")
	ErrInvalidPayout     = errors.New("net payout calculation must be strictly non-negative")
)

type SettlementStatus string

const (
	StatusHeld            SettlementStatus = "HELD"
	StatusReleaseEligible SettlementStatus = "RELEASE_ELIGIBLE"
	StatusProcessing      SettlementStatus = "PROCESSING"
	StatusPaidOut         SettlementStatus = "PAID_OUT"
)

type SettlementRecord struct {
	ID                     uuid.UUID
	TradeOrderID           uuid.UUID
	SupplierOrgID          uuid.UUID
	GrossAmountMinor       int64
	FeeRateBps             int64 // Basis points: 500 = 5.00%
	FeeAmountMinor         int64
	RefundedAmountMinor    int64
	NetPayoutMinor         int64
	Currency               string
	Status                 SettlementStatus
	HasActiveDispute       bool
	InspectionPassed       bool
	InspectionRequired     bool
}

// CalculateSettlement computes net payout:
// FeeAmount = (GrossAmount * FeeRateBps) / 10000
// NetPayout = GrossAmount - FeeAmount - RefundedAmount
func CalculateSettlement(
	tradeOrderID uuid.UUID,
	supplierOrgID uuid.UUID,
	grossMinor int64,
	feeRateBps int64,
	refundedMinor int64,
	currency string,
	inspectionRequired bool,
) (*SettlementRecord, error) {
	feeMinor := (grossMinor * feeRateBps) / 10000
	netMinor := grossMinor - feeMinor - refundedMinor

	if netMinor < 0 {
		return nil, fmt.Errorf("%w: gross=%d, fee=%d, refund=%d, net=%d", ErrInvalidPayout, grossMinor, feeMinor, refundedMinor, netMinor)
	}

	return &SettlementRecord{
		ID:                  uuid.New(),
		TradeOrderID:        tradeOrderID,
		SupplierOrgID:       supplierOrgID,
		GrossAmountMinor:    grossMinor,
		FeeRateBps:          feeRateBps,
		FeeAmountMinor:      feeMinor,
		RefundedAmountMinor: refundedMinor,
		NetPayoutMinor:      netMinor,
		Currency:            currency,
		Status:              StatusHeld,
		HasActiveDispute:    false,
		InspectionPassed:    false,
		InspectionRequired:  inspectionRequired,
	}, nil
}

// RequestRelease attempts to promote settlement from HELD to RELEASE_ELIGIBLE.
func (s *SettlementRecord) RequestRelease() error {
	if s.HasActiveDispute {
		return ErrDisputeActiveHold
	}

	if s.InspectionRequired && !s.InspectionPassed {
		return ErrInspectionFailed
	}

	s.Status = StatusReleaseEligible
	return nil
}

// FreezeOnDispute transitions status back to HELD when dispute is opened.
func (s *SettlementRecord) FreezeOnDispute() {
	s.HasActiveDispute = true
	s.Status = StatusHeld
}
