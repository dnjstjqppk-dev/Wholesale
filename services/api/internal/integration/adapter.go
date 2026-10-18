package integration

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

var (
	ErrConsentRevoked = errors.New("channel consent revoked: listing must be removed via tombstone")
	ErrInvalidFeedItem = errors.New("invalid feed item missing mandatory wholesale metadata")
)

type PriceScannerFeedItem struct {
	OfferType      string            `json:"offer_type"` // Must be "wholesale"
	FeedSource     string            `json:"feed_source"` // "WHOLESALE_B2B_PLATFORM"
	ListingID      uuid.UUID         `json:"listing_id"`
	OrganizationID uuid.UUID         `json:"organization_id"`
	SupplierName   string            `json:"supplier_name"`
	Title          string            `json:"title"`
	MOQ            decimal.Decimal   `json:"moq"`
	QuantityStep   decimal.Decimal   `json:"quantity_step"`
	QuantityBasis  string            `json:"quantity_basis"` // e.g. "pcs", "cases"
	Incoterm       string            `json:"incoterm"`       // e.g. "FOB Busan (Incoterms 2020)"
	BaseTierPrice  decimal.Decimal   `json:"base_tier_price"` // Price at MOQ
	Currency       string            `json:"currency"`
	Tiers          []map[string]interface{} `json:"tiers"`
	Disclaimer     string            `json:"disclaimer"`
}

type TombstoneEvent struct {
	EventType string    `json:"event_type"` // "FEED_ITEM_TOMBSTONE"
	ListingID uuid.UUID `json:"listing_id"`
	Reason    string    `json:"reason"`
	RevokedAt time.Time `json:"revoked_at"`
}

type ChannelConsent struct {
	OrganizationID uuid.UUID `json:"organization_id"`
	ChannelName    string    `json:"channel_name"` // "PriceScanner", "OLMOA"
	IsActive       bool      `json:"is_active"`
	UpdatedBy      uuid.UUID `json:"updated_by"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// BuildPriceScannerFeed maps a wholesale listing into a PriceScanner feed item.
// It explicitly enforces wholesale comparison metadata to prevent 1000-unit bulk prices
// from being miscategorized as retail 1-unit lowest prices.
func BuildPriceScannerFeed(
	listingID, orgID uuid.UUID,
	supplierName, title string,
	moq, step decimal.Decimal,
	unit, incoterm, currency string,
	tiers []map[string]interface{},
	consent *ChannelConsent,
) (*PriceScannerFeedItem, error) {
	if consent == nil || !consent.IsActive {
		return nil, ErrConsentRevoked
	}
	if moq.LessThanOrEqual(decimal.Zero) || len(tiers) == 0 {
		return nil, ErrInvalidFeedItem
	}

	basePrice := decimal.RequireFromString(tiers[0]["unit_price"].(string))

	return &PriceScannerFeedItem{
		OfferType:     "wholesale",
		FeedSource:    "WHOLESALE_B2B_PLATFORM",
		ListingID:     listingID,
		OrganizationID: orgID,
		SupplierName:  supplierName,
		Title:         title,
		MOQ:           moq,
		QuantityStep:  step,
		QuantityBasis: unit,
		Incoterm:      incoterm,
		BaseTierPrice: basePrice,
		Currency:      currency,
		Tiers:         tiers,
		Disclaimer:    "B2B Wholesale bulk price valid only when purchasing MOQ or above. Commercial verification required.",
	}, nil
}

// RevokeConsent generates a tombstone event to instantly remove the listing from feeds.
func RevokeConsent(consent *ChannelConsent, listingID, actorID uuid.UUID, reason string) (*TombstoneEvent, error) {
	consent.IsActive = false
	consent.UpdatedBy = actorID
	consent.UpdatedAt = time.Now().UTC()

	return &TombstoneEvent{
		EventType: "FEED_ITEM_TOMBSTONE",
		ListingID: listingID,
		Reason:    reason,
		RevokedAt: consent.UpdatedAt,
	}, nil
}
