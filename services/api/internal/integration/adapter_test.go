package integration

import (
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

func TestPriceScannerWholesaleFeedIntegrity(t *testing.T) {
	listingID := uuid.New()
	orgID := uuid.New()

	consent := &ChannelConsent{
		OrganizationID: orgID,
		ChannelName:    "PriceScanner",
		IsActive:       true,
		UpdatedAt:      time.Now(),
	}

	tiers := []map[string]interface{}{
		{"min_quantity": "100", "unit_price": "2.500000"},
		{"min_quantity": "500", "unit_price": "2.200000"},
	}

	feed, err := BuildPriceScannerFeed(
		listingID, orgID, "Hansung Precision", "Precision CNC Aluminum Heatsink",
		decimal.NewFromInt(100), decimal.NewFromInt(10), "pcs",
		"FOB Incheon (Incoterms 2020)", "USD", tiers, consent,
	)
	if err != nil {
		t.Fatalf("BuildPriceScannerFeed failed: %v", err)
	}

	if feed.OfferType != "wholesale" {
		t.Errorf("Expected offer_type=wholesale, got: %s", feed.OfferType)
	}
	if !feed.MOQ.Equal(decimal.NewFromInt(100)) {
		t.Errorf("Expected MOQ 100, got: %s", feed.MOQ)
	}
	if feed.Disclaimer == "" {
		t.Error("Wholesale price comparison disclaimer must be non-empty")
	}

	// Test 2: Revocation of consent generates tombstone
	actorID := uuid.New()
	tombstone, err := RevokeConsent(consent, listingID, actorID, "Supplier opt-out of price aggregator")
	if err != nil {
		t.Fatalf("RevokeConsent failed: %v", err)
	}
	if tombstone.EventType != "FEED_ITEM_TOMBSTONE" {
		t.Errorf("Expected FEED_ITEM_TOMBSTONE event, got: %s", tombstone.EventType)
	}

	// Feed generation after revocation must fail
	_, err = BuildPriceScannerFeed(
		listingID, orgID, "Hansung Precision", "Precision CNC Aluminum Heatsink",
		decimal.NewFromInt(100), decimal.NewFromInt(10), "pcs",
		"FOB Incheon (Incoterms 2020)", "USD", tiers, consent,
	)
	if !errors.Is(err, ErrConsentRevoked) {
		t.Errorf("Expected ErrConsentRevoked on inactive consent, got: %v", err)
	}
}
