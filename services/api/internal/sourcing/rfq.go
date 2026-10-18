package sourcing

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

var (
	ErrAwardExceedsRequestedQty = errors.New("awarded quantity exceeds requested RFQ quantity")
	ErrQuoteRevisionNotActive   = errors.New("cannot accept quote revision that is superseded, expired, or rejected")
	ErrQuoteAlreadyFinalized    = errors.New("quote is already finalized")
)

type RFQItem struct {
	ID               uuid.UUID       `json:"id"`
	RFQID            uuid.UUID       `json:"rfq_id"`
	Title            string          `json:"title"`
	RequestedQty     decimal.Decimal `json:"requested_quantity"`
	AwardedQty       decimal.Decimal `json:"awarded_quantity"`
	TargetPriceMinor int64           `json:"target_price_minor"`
	Unit             string          `json:"unit"`
}

type RFQ struct {
	ID                 uuid.UUID `json:"id"`
	BuyerOrgID         uuid.UUID `json:"buyer_organization_id"`
	BuyerContactEmail  string    `json:"buyer_contact_email,omitempty"`
	BuyerContactPhone  string    `json:"buyer_contact_phone,omitempty"`
	Title              string    `json:"title"`
	DestinationCountry string    `json:"destination_country"`
	Status             string    `json:"status"`
	Items              []RFQItem `json:"items"`
	PrivateBlueprint   string    `json:"private_blueprint,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
}

// MaskedRFQ returns a public-safe view of an RFQ with sensitive buyer contact & private blueprints masked.
func (r *RFQ) MaskedRFQ() map[string]interface{} {
	masked := map[string]interface{}{
		"id":                  r.ID.String(),
		"title":               r.Title,
		"destination_country": r.DestinationCountry,
		"status":              r.Status,
		"items":               r.Items,
		"created_at":          r.CreatedAt.Format(time.RFC3339),
		"buyer_organization":  "[VERIFIED_BUYER_CORP]",
		"buyer_contact":       "[PROTECTED_COMMUNICATION_CHANNEL]",
		"is_contact_masked":   true,
	}
	return masked
}

type QuoteRevisionStatus string

const (
	RevisionStatusDraft      QuoteRevisionStatus = "DRAFT"
	RevisionStatusIssued     QuoteRevisionStatus = "ISSUED"
	RevisionStatusSuperseded QuoteRevisionStatus = "SUPERSEDED"
	RevisionStatusAccepted   QuoteRevisionStatus = "ACCEPTED"
	RevisionStatusRejected   QuoteRevisionStatus = "REJECTED"
)

type QuoteRevision struct {
	ID             uuid.UUID           `json:"id"`
	QuoteID        uuid.UUID           `json:"quote_id"`
	RevisionNumber int                 `json:"revision_number"`
	Status         QuoteRevisionStatus `json:"status"`
	UnitPrice      decimal.Decimal     `json:"unit_price"`
	Currency       string              `json:"currency"`
	LeadTimeDays   int                 `json:"lead_time_days"`
	Incoterms      string              `json:"incoterms"`
	CreatedAt      time.Time           `json:"created_at"`
}

type Quote struct {
	ID               uuid.UUID        `json:"id"`
	RFQID            uuid.UUID        `json:"rfq_id"`
	SupplierOrgID    uuid.UUID        `json:"supplier_organization_id"`
	CurrentRevision  *QuoteRevision   `json:"current_revision"`
	RevisionHistory  []*QuoteRevision `json:"revision_history"`
	FinalizedOrderID *uuid.UUID       `json:"finalized_order_id,omitempty"`
}

// IssueNewRevision supersedes any previously issued revision and sets the new revision as active.
func (q *Quote) IssueNewRevision(unitPrice decimal.Decimal, leadTimeDays int, incoterms, currency string) *QuoteRevision {
	revNum := 1
	if q.CurrentRevision != nil {
		q.CurrentRevision.Status = RevisionStatusSuperseded
		q.RevisionHistory = append(q.RevisionHistory, q.CurrentRevision)
		revNum = q.CurrentRevision.RevisionNumber + 1
	}

	newRev := &QuoteRevision{
		ID:             uuid.New(),
		QuoteID:        q.ID,
		RevisionNumber: revNum,
		Status:         RevisionStatusIssued,
		UnitPrice:      unitPrice,
		Currency:       currency,
		LeadTimeDays:   leadTimeDays,
		Incoterms:      incoterms,
		CreatedAt:      time.Now().UTC(),
	}
	q.CurrentRevision = newRev
	return newRev
}

// AwardItem awards a specific quantity from this RFQ item and verifies cumulative bounds.
func (item *RFQItem) AwardItem(qty decimal.Decimal) error {
	newAwarded := item.AwardedQty.Add(qty)
	if newAwarded.GreaterThan(item.RequestedQty) {
		return fmt.Errorf("%w: requested=%s, current_awarded=%s, additional=%s",
			ErrAwardExceedsRequestedQty, item.RequestedQty, item.AwardedQty, qty)
	}
	item.AwardedQty = newAwarded
	return nil
}

