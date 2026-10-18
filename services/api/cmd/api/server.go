package main

import (
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"wholesale/services/api/internal/inventory"
	"wholesale/services/api/internal/logistics"
	"wholesale/services/api/internal/payment"
	"wholesale/services/api/internal/settlement"
	"wholesale/services/api/internal/sourcing"
	"wholesale/services/api/internal/support"
	"wholesale/services/api/internal/trade"
)

// Server encapsulates state and business engines.
type Server struct {
	mu                  sync.RWMutex
	invMgr              *inventory.Manager
	dbMgr               *DBManager
	users               map[string]map[string]interface{}
	orgs                map[uuid.UUID]map[string]interface{}
	listings            map[uuid.UUID]map[string]interface{}
	rfqs                map[uuid.UUID]*sourcing.RFQ
	quotes              map[uuid.UUID]*sourcing.Quote
	orders              map[uuid.UUID]map[string]interface{}
	contracts           map[uuid.UUID]*trade.Contract
	shipments           map[uuid.UUID]*logistics.OrderItemFulfillment
	settlements         map[uuid.UUID]*settlement.SettlementRecord
	disputes            map[uuid.UUID]*support.Dispute
	journals            []*payment.Journal
	settlementApprovals map[uuid.UUID][]uuid.UUID
	idempotency         map[string]bool
}

func NewServer() *Server {
	s := &Server{
		invMgr:              inventory.NewManager(),
		dbMgr:               NewDBManager(),
		users:               make(map[string]map[string]interface{}),
		orgs:                make(map[uuid.UUID]map[string]interface{}),
		listings:            make(map[uuid.UUID]map[string]interface{}),
		rfqs:                make(map[uuid.UUID]*sourcing.RFQ),
		quotes:              make(map[uuid.UUID]*sourcing.Quote),
		orders:              make(map[uuid.UUID]map[string]interface{}),
		contracts:           make(map[uuid.UUID]*trade.Contract),
		shipments:           make(map[uuid.UUID]*logistics.OrderItemFulfillment),
		settlements:         make(map[uuid.UUID]*settlement.SettlementRecord),
		disputes:            make(map[uuid.UUID]*support.Dispute),
		journals:            make([]*payment.Journal, 0),
		settlementApprovals: make(map[uuid.UUID][]uuid.UUID),
		idempotency:         make(map[string]bool),
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

	// Seed Initial RFQ & Quote
	rfqID := uuid.MustParse("55555555-5555-5555-5555-555555555555")
	rfqItem := sourcing.RFQItem{
		ID:               uuid.New(),
		RFQID:            rfqID,
		Title:            "SUS304 텀블러 1,000개 조달",
		RequestedQty:     decimal.NewFromInt(1000),
		AwardedQty:       decimal.Zero,
		TargetPriceMinor: 450,
		Unit:             "pcs",
	}
	s.rfqs[rfqID] = &sourcing.RFQ{
		ID:                 rfqID,
		BuyerOrgID:         buyOrgID,
		BuyerContactEmail:  "procurement@metrowholesale.com",
		BuyerContactPhone:  "+1-555-0199",
		Title:              "2026 하반기 산업용 스테인리스 텀블러 조달",
		DestinationCountry: "US",
		Status:             "PUBLISHED",
		Items:              []sourcing.RFQItem{rfqItem},
		CreatedAt:          time.Now().UTC(),
	}

	quoteID := uuid.MustParse("66666666-6666-6666-6666-666666666666")
	quote := &sourcing.Quote{
		ID:            quoteID,
		RFQID:         rfqID,
		SupplierOrgID: supOrgID,
	}
	quote.IssueNewRevision(decimal.NewFromFloat(4.20), 14, "FOB", "USD")
	s.quotes[quoteID] = quote

	// Seed Initial Order & Contract & Fulfillment
	orderID := uuid.MustParse("77777777-7777-7777-7777-777777777777")
	s.orders[orderID] = map[string]interface{}{
		"id":                 orderID.String(),
		"order_number":       "ORD-20261018-001",
		"buyer_org_id":       buyOrgID.String(),
		"supplier_org_id":    supOrgID.String(),
		"order_status":       "CONTRACT_PENDING",
		"payment_status":     "PENDING",
		"total_amount_minor": 420000,
		"ordered_quantity":   "1000",
		"unit":               "pcs",
		"currency":           "USD",
		"created_at":         time.Now().UTC().Format(time.RFC3339),
	}

	contractBody := trade.ContractBody{
		ContractNumber:     "CTR-20261018-001",
		OrderID:            orderID,
		BuyerOrgID:         buyOrgID,
		SupplierOrgID:      supOrgID,
		TotalAmountMinor:   420000,
		Currency:           "USD",
		Incoterms:          trade.IncotermsRule{Code: "FOB", Version: "Incoterms 2020", NamedPlace: "Busan Port"},
		LeadTimeDays:       14,
		DownPaymentPercent: 30,
		TermsAndConditions: "Standard B2B Wholesale Trade Agreement",
	}
	c, _ := trade.NewContract(contractBody)
	s.contracts[orderID] = c

	s.shipments[orderID] = &logistics.OrderItemFulfillment{
		OrderItemID:     orderID,
		OrderedQuantity: decimal.NewFromInt(1000),
		ShippedQuantity: decimal.Zero,
	}

	setRecord, _ := settlement.CalculateSettlement(orderID, supOrgID, 420000, 500, 0, "USD", false)
	s.settlements[orderID] = setRecord

	// Seed Initial Balanced Double-Entry Journal
	entries := []payment.Entry{
		{AccountID: uuid.New(), DebitMinor: 126000, CreditMinor: 0, Memo: "Initial Escrow Capture"},
		{AccountID: uuid.New(), DebitMinor: 0, CreditMinor: 126000, Memo: "Escrow Liability"},
	}
	j, _ := payment.CreateJournal(orderID, "ESCROW_SEED", "USD", entries)
	s.journals = append(s.journals, j)
}

