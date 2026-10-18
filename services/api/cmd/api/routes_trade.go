package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"wholesale/services/api/internal/payment"
)

func (s *Server) registerTradeRoutes(mux *http.ServeMux) {
	// Sourcing: Create RFQ
	mux.HandleFunc("POST /v1/sourcing/rfqs", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Title              string                   `json:"title"`
			DestinationCountry string                   `json:"destination_country"`
			ExpiresAt          string                   `json:"expires_at"`
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
			DocumentHash string `json:"document_hash"`
			SignerUserID string `json:"signer_user_id"`
			SignerOrgID  string `json:"signer_org_id"`
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
}

func (s *Server) routes() http.Handler {
	mux := http.NewServeMux()
	s.registerCatalogRoutes(mux)
	s.registerTradeRoutes(mux)

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
