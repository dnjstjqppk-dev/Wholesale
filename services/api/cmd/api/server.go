package main

import (
	"sync"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"wholesale/services/api/internal/inventory"
	"wholesale/services/api/internal/logistics"
	"wholesale/services/api/internal/settlement"
	"wholesale/services/api/internal/trade"
)

// Server encapsulates state and business engines.
type Server struct {
	mu          sync.RWMutex
	invMgr      *inventory.Manager
	users       map[string]map[string]interface{}
	orgs        map[uuid.UUID]map[string]interface{}
	listings    map[uuid.UUID]map[string]interface{}
	rfqs        map[uuid.UUID]map[string]interface{}
	quotes      map[uuid.UUID]map[string]interface{}
	orders      map[uuid.UUID]map[string]interface{}
	contracts   map[uuid.UUID]*trade.Contract
	shipments   map[uuid.UUID]*logistics.OrderItemFulfillment
	settlements map[uuid.UUID]*settlement.SettlementRecord
	idempotency map[string]bool
}

func NewServer() *Server {
	s := &Server{
		invMgr:      inventory.NewManager(),
		users:       make(map[string]map[string]interface{}),
		orgs:        make(map[uuid.UUID]map[string]interface{}),
		listings:    make(map[uuid.UUID]map[string]interface{}),
		rfqs:        make(map[uuid.UUID]map[string]interface{}),
		quotes:      make(map[uuid.UUID]map[string]interface{}),
		orders:      make(map[uuid.UUID]map[string]interface{}),
		contracts:   make(map[uuid.UUID]*trade.Contract),
		shipments:   make(map[uuid.UUID]*logistics.OrderItemFulfillment),
		settlements: make(map[uuid.UUID]*settlement.SettlementRecord),
		idempotency: make(map[string]bool),
	}
	s.seedInitialData()
	return s
}

func (s *Server) seedInitialData() {
	supOrgID := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	s.orgs[supOrgID] = map[string]interface{}{
		"id":                   supOrgID.String(),
		"legal_name":           "Global Precision Industrial Co., Ltd.",
		"trade_name":           "Precision Korea",
		"business_number":      "123-45-67890",
		"country":              "KR",
		"business_type":        "MANUFACTURER",
		"is_verified_supplier": true,
	}

	buyOrgID := uuid.MustParse("22222222-2222-2222-2222-222222222222")
	s.orgs[buyOrgID] = map[string]interface{}{
		"id":                   buyOrgID.String(),
		"legal_name":           "Metro Wholesale Imports LLC",
		"trade_name":           "Metro Wholesale",
		"business_number":      "987-65-43210",
		"country":              "US",
		"business_type":        "BUYER_CORP",
		"is_verified_supplier": false,
	}

	listingID := uuid.MustParse("33333333-3333-3333-3333-333333333333")
	skuID := uuid.MustParse("44444444-4444-4444-4444-444444444444")
	s.listings[listingID] = map[string]interface{}{
		"id":                   listingID.String(),
		"organization_id":      supOrgID.String(),
		"supplier_name":        "Precision Korea",
		"is_verified_supplier": true,
		"sku_id":               skuID.String(),
		"title":                "산업용 초경량 스테인리스 진공 텀블러 벌크팩",
		"category":             "주방용품/산업용기",
		"moq":                  "100",
		"quantity_step":        "10",
		"unit":                 "pcs",
		"lead_time_days":       14,
		"status":               "PUBLISHED",
		"price_tiers": []map[string]interface{}{
			{"min_quantity": "100", "max_quantity": "499", "unit_price": "5.500000", "currency": "USD"},
			{"min_quantity": "500", "max_quantity": "999", "unit_price": "4.800000", "currency": "USD"},
			{"min_quantity": "1000", "max_quantity": nil, "unit_price": "4.200000", "currency": "USD"},
		},
	}

	s.invMgr.SetInitialStock(skuID, decimal.NewFromInt(10000))
}
