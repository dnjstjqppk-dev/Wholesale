package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"wholesale/services/api/internal/sourcing"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

func (s *Server) registerSourcingRoutes(mux *http.ServeMux) {
	// Sourcing: Create RFQ
	mux.HandleFunc("POST /v1/sourcing/rfqs", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			BuyerOrgID         string `json:"buyer_organization_id"`
			BuyerContactEmail  string `json:"buyer_contact_email"`
			Title              string `json:"title"`
			DestinationCountry string `json:"destination_country"`
			Items              []struct {
				Title        string `json:"title"`
				RequestedQty string `json:"requested_quantity"`
				Unit         string `json:"unit"`
			} `json:"items"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeProblem(w, http.StatusBadRequest, "INVALID_BODY", "Invalid JSON", err.Error())
			return
		}

		s.mu.Lock()
		defer s.mu.Unlock()

		rfqID := uuid.New()
		buyerOrgID, _ := uuid.Parse(req.BuyerOrgID)
		if buyerOrgID == uuid.Nil {
			buyerOrgID = uuid.MustParse("22222222-2222-2222-2222-222222222222")
		}

		rfqItems := make([]sourcing.RFQItem, 0, len(req.Items))
		for _, it := range req.Items {
			qty, _ := decimal.NewFromString(it.RequestedQty)
			rfqItems = append(rfqItems, sourcing.RFQItem{
				ID:           uuid.New(),
				RFQID:        rfqID,
				Title:        it.Title,
				RequestedQty: qty,
				AwardedQty:   decimal.Zero,
				Unit:         it.Unit,
			})
		}

		rfq := &sourcing.RFQ{
			ID:                 rfqID,
			BuyerOrgID:         buyerOrgID,
			BuyerContactEmail:  req.BuyerContactEmail,
			Title:              req.Title,
			DestinationCountry: req.DestinationCountry,
			Status:             "PUBLISHED",
			Items:              rfqItems,
			CreatedAt:          time.Now().UTC(),
		}
		s.rfqs[rfqID] = rfq

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(rfq)
	})

	// Sourcing: List RFQs (Public Masked)
	mux.HandleFunc("GET /v1/sourcing/rfqs", func(w http.ResponseWriter, r *http.Request) {
		s.mu.RLock()
		defer s.mu.RUnlock()

		items := make([]map[string]interface{}, 0, len(s.rfqs))
		for _, rfq := range s.rfqs {
			items = append(items, rfq.MaskedRFQ())
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"rfqs":        items,
			"total_count": len(items),
		})
	})

	// Sourcing: Submit / Revise Quote
	mux.HandleFunc("POST /v1/sourcing/rfqs/{id}/quotes", func(w http.ResponseWriter, r *http.Request) {
		rfqID, err := uuid.Parse(r.PathValue("id"))
		if err != nil {
			writeProblem(w, http.StatusBadRequest, "INVALID_ID", "Invalid RFQ ID", err.Error())
			return
		}

		var req struct {
			SupplierOrgID string `json:"supplier_organization_id"`
			UnitPrice     string `json:"unit_price"`
			LeadTimeDays  int    `json:"lead_time_days"`
			Incoterms     string `json:"incoterms"`
			Currency      string `json:"currency"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeProblem(w, http.StatusBadRequest, "INVALID_BODY", "Invalid JSON", err.Error())
			return
		}

		price, err := decimal.NewFromString(req.UnitPrice)
		if err != nil {
			writeProblem(w, http.StatusBadRequest, "INVALID_PRICE", "Invalid unit price", err.Error())
			return
		}

		s.mu.Lock()
		defer s.mu.Unlock()

		rfq, exists := s.rfqs[rfqID]
		if !exists {
			writeProblem(w, http.StatusNotFound, "RFQ_NOT_FOUND", "RFQ Not Found", "Specified RFQ does not exist")
			return
		}
		_ = rfq

		supID, _ := uuid.Parse(req.SupplierOrgID)
		quoteID := uuid.New()
		quote := &sourcing.Quote{
			ID:            quoteID,
			RFQID:         rfqID,
			SupplierOrgID: supID,
		}
		rev := quote.IssueNewRevision(price, req.LeadTimeDays, req.Incoterms, req.Currency)
		s.quotes[quoteID] = quote

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"quote_id": quoteID.String(),
			"rfq_id":   rfqID.String(),
			"revision": rev,
		})
	})

	// Sourcing: Accept Quote & Create Order (Idempotent)
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

		quoteID, _ := uuid.Parse(r.PathValue("id"))
		quote, exists := s.quotes[quoteID]
		if exists && quote.CurrentRevision != nil {
			quote.CurrentRevision.Status = sourcing.RevisionStatusAccepted
		}

		orderID := uuid.New()
		orderNumber := fmt.Sprintf("ORD-%s", time.Now().Format("20060102-150405"))

		order := map[string]interface{}{
			"id":                 orderID.String(),
			"order_number":       orderNumber,
			"quote_id":           quoteID.String(),
			"order_status":       "CONTRACT_PENDING",
			"payment_status":     "PENDING",
			"total_amount_minor": 480000,
			"currency":           "USD",
			"created_at":         time.Now().UTC().Format(time.RFC3339),
		}
		s.orders[orderID] = order

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(order)
	})
}
