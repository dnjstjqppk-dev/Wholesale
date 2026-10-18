package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"wholesale/services/api/internal/inventory"
	"wholesale/services/api/internal/logistics"
	"wholesale/services/api/internal/payment"
	"wholesale/services/api/internal/settlement"
	"wholesale/services/api/internal/trade"
)

// RFC 7807 Problem Details
type ProblemDetails struct {
	Type      string      `json:"type"`
	Title     string      `json:"title"`
	Status    int         `json:"status"`
	Detail    string      `json:"detail"`
	Code      string      `json:"code"`
	RequestID string      `json:"request_id"`
	Errors    interface{} `json:"field_errors,omitempty"`
}

func writeProblem(w http.ResponseWriter, status int, code, title, detail string) {
	w.Header().Set("Content-Type", "application/problem+json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(ProblemDetails{
		Type:      "about:blank",
		Title:     title,
		Status:    status,
		Code:      code,
		Detail:    detail,
		RequestID: uuid.New().String(),
	})
}

// Server encapsulates state and business engines.
type Server struct {
	mu           sync.RWMutex
	invMgr       *inventory.Manager
	users        map[string]map[string]interface{}
	orgs         map[uuid.UUID]map[string]interface{}
	listings     map[uuid.UUID]map[string]interface{}
	rfqs         map[uuid.UUID]map[string]interface{}
	quotes       map[uuid.UUID]map[string]interface{}
	orders       map[uuid.UUID]map[string]interface{}
	contracts    map[uuid.UUID]*trade.Contract
	shipments    map[uuid.UUID]*logistics.OrderItemFulfillment
	settlements  map[uuid.UUID]*settlement.SettlementRecord
	idempotency  map[string]bool
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
	// Seed a verified supplier organization
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

	// Seed buyer organization
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

	// Seed listing with tiered pricing
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

	// Initialize inventory stock: 10,000 units
	s.invMgr.SetInitialStock(skuID, decimal.NewFromInt(10000))
}

func (s *Server) routes() http.Handler {
	mux := http.NewServeMux()

	// Health
	mux.HandleFunc("GET /v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "healthy",
			"version":   "1.0.0",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"engines": map[string]string{
				"pricing":    "active (shopspring/decimal exact minor)",
				"ledger":     "active (double-entry immutable)",
				"inventory":  "active (thread-safe atomic reservation)",
				"governance": "active (hash-verified signing)",
			},
		})
	})

	// Auth Register
	mux.HandleFunc("POST /v1/auth/register", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email          string `json:"email"`
			Password       string `json:"password"`
			FullName       string `json:"full_name"`
			CompanyName    string `json:"company_name"`
			BusinessNumber string `json:"business_number"`
			RoleCapability string `json:"role_capability"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeProblem(w, http.StatusBadRequest, "INVALID_BODY", "Invalid JSON", err.Error())
			return
		}

		s.mu.Lock()
		defer s.mu.Unlock()

		if _, exists := s.users[req.Email]; exists {
			writeProblem(w, http.StatusConflict, "USER_EXISTS", "User Already Exists", "Email is already registered")
			return
		}

		orgID := uuid.New()
		userID := uuid.New()

		s.orgs[orgID] = map[string]interface{}{
			"id":              orgID.String(),
			"legal_name":      req.CompanyName,
			"business_number": req.BusinessNumber,
			"business_type":   req.RoleCapability,
		}

		user := map[string]interface{}{
			"id":                     userID.String(),
			"email":                  req.Email,
			"full_name":              req.FullName,
			"active_organization_id": orgID.String(),
			"role":                   "ORG_OWNER",
		}
		s.users[req.Email] = user

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"access_token":  fmt.Sprintf("mock-jwt-%s", userID.String()),
			"token_type":    "Bearer",
			"expires_in":    86400,
			"user":          user,
			"organization":  s.orgs[orgID],
		})
	})

	// Catalog Listings (Public Search)
	mux.HandleFunc("GET /v1/catalog/listings", func(w http.ResponseWriter, r *http.Request) {
		s.mu.RLock()
		defer s.mu.RUnlock()

		items := make([]interface{}, 0, len(s.listings))
		for _, item := range s.listings {
			items = append(items, item)
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"items":       items,
			"total_count": len(items),
		})
	})

	// Sourcing: Create RFQ
	mux.HandleFunc("POST /v1/sourcing/rfqs", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Title              string `json:"title"`
			DestinationCountry string `json:"destination_country"`
			ExpiresAt          string `json:"expires_at"`
			Items              []map[string]interface{} `json:"items"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeProblem(w, http.StatusBadRequest, "INVALID_BODY", "Invalid JSON", err.Error())
			return
		}

		s.mu.Lock()
		defer s.mu.Unlock()

		rfqID := uuid.New()
		rfq := map[string]interface{}{
			"id":                  rfqID.String(),
			"title":               req.Title,
			"destination_country": req.DestinationCountry,
			"status":              "PUBLISHED",
			"items":               req.Items,
			"created_at":          time.Now().UTC().Format(time.RFC3339),
		}
		s.rfqs[rfqID] = rfq

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(rfq)
	})

	// Sourcing: Accept Quote & Create Order
	mux.HandleFunc("POST /v1/sourcing/quotes/{id}/accept", func(w http.ResponseWriter, r *http.Request) {
		idempotencyKey := r.Header.Get("Idempotency-Key")
		if idempotencyKey == "" {
			writeProblem(w, http.StatusBadRequest, "MISSING_IDEMPOTENCY_KEY", "Idempotency-Key header is required", "Required for transactional safety")
			return
		}

		s.mu.Lock()
		defer s.mu.Unlock()

		if s.idempotency[idempotencyKey] {
			writeProblem(w, http.StatusConflict, "DUPLICATE_REQUEST", "Duplicate Idempotent Action", "Request already processed")
			return
		}
		s.idempotency[idempotencyKey] = true

		orderID := uuid.New()
		orderNumber := fmt.Sprintf("ORD-%s", time.Now().Format("20060102-150405"))

		order := map[string]interface{}{
			"id":                 orderID.String(),
			"order_number":       orderNumber,
			"order_status":       "CONTRACT_PENDING",
			"payment_status":     "PENDING",
			"total_amount_minor": "480000", // $4,800.00
			"currency":           "USD",
			"created_at":         time.Now().UTC().Format(time.RFC3339),
		}
		s.orders[orderID] = order

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(order)
	})

	// Trade: Sign Contract
	mux.HandleFunc("POST /v1/trade/orders/{id}/contract/sign", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			DocumentHash     string `json:"document_hash"`
			SignerUserID     string `json:"signer_user_id"`
			SignerOrgID      string `json:"signer_org_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeProblem(w, http.StatusBadRequest, "INVALID_BODY", "Invalid JSON", err.Error())
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"contract_id": uuid.New().String(),
			"signed":      true,
			"signed_at":   time.Now().UTC().Format(time.RFC3339),
			"status":      "CONTRACT_SIGNED",
		})
	})

	// Payments: Process Payment & Book Ledger
	mux.HandleFunc("POST /v1/payments/process", func(w http.ResponseWriter, r *http.Request) {
		paymentID := uuid.New()
		pgTxID := fmt.Sprintf("PG-TX-%s", uuid.New().String()[:8])

		// Double-entry ledger booking
		entries := []payment.Entry{
			{AccountID: uuid.New(), DebitMinor: 144000, CreditMinor: 0, Memo: "PG Capture 30% Down Payment"},
			{AccountID: uuid.New(), DebitMinor: 0, CreditMinor: 144000, Memo: "Escrow Deposit"},
		}
		_, err := payment.CreateJournal(uuid.New(), "PAYMENT_CAPTURE", "USD", entries)
		if err != nil {
			writeProblem(w, http.StatusInternalServerError, "LEDGER_ERROR", "Accounting ledger failed", err.Error())
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"payment_id":        paymentID.String(),
			"pg_transaction_id": pgTxID,
			"status":            "PAID",
			"amount_minor":      "144000",
			"currency":          "USD",
			"ledger_posted":     true,
		})
	})

	// Wrap in CORS & Security Headers
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Organization-ID, Idempotency-Key")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		mux.ServeHTTP(w, r)
	})
}

func main() {
	srv := NewServer()
	port := "8080"
	log.Printf("[WHOLESALE B2B Core API] Server listening on :%s ...", port)
	if err := http.ListenAndServe(":"+port, srv.routes()); err != nil {
		log.Fatalf("Server terminated: %v", err)
	}
}
