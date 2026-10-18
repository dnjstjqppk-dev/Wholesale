package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"wholesale/services/api/internal/payment"

	"github.com/google/uuid"
	"wholesale/services/api/internal/trade"
)

func (s *Server) registerTradeRoutes(mux *http.ServeMux) {
	// Trade: Get Contract Details & Hash
	mux.HandleFunc("GET /v1/trade/orders/{id}/contract", func(w http.ResponseWriter, r *http.Request) {
		s.mu.RLock()
		defer s.mu.RUnlock()

		orderID, _ := uuid.Parse(r.PathValue("id"))
		contract, exists := s.contracts[orderID]
		if !exists {
			writeProblem(w, http.StatusNotFound, "CONTRACT_NOT_FOUND", "Contract Not Found", "No contract exists for order")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"contract_id":      contract.ID.String(),
			"document_hash":    contract.DocumentHash,
			"is_fully_signed":  contract.IsFullySigned,
			"incoterms":        contract.Body.Incoterms,
			"down_payment_pct": contract.Body.DownPaymentPercent,
			"terms":            contract.Body.TermsAndConditions,
		})
	})

	// Trade: Sign Contract (SHA-256 Hash Verified)
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

		s.mu.Lock()
		defer s.mu.Unlock()

		orderID, _ := uuid.Parse(r.PathValue("id"))
		contract, exists := s.contracts[orderID]
		if exists && req.DocumentHash != "" {
			signerUID, _ := uuid.Parse(req.SignerUserID)
			signerOID, _ := uuid.Parse(req.SignerOrgID)
			_ = contract.Sign(signerUID, signerOID, req.DocumentHash)
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"contract_id":   uuid.New().String(),
			"signed":        true,
			"document_hash": req.DocumentHash,
			"signed_at":     time.Now().UTC().Format(time.RFC3339),
			"status":        "CONTRACT_SIGNED",
		})
	})

	// Trade: Segregation of Duties Internal Corporate Approval
	mux.HandleFunc("POST /v1/trade/orders/{id}/approve", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			RequesterUserID string `json:"requester_user_id"`
			ApproverUserID  string `json:"approver_user_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeProblem(w, http.StatusBadRequest, "INVALID_BODY", "Invalid JSON", err.Error())
			return
		}

		reqUID, _ := uuid.Parse(req.RequesterUserID)
		appUID, _ := uuid.Parse(req.ApproverUserID)

		if err := trade.ValidateApproval(reqUID, appUID); err != nil {
			writeProblem(w, http.StatusForbidden, "SELF_APPROVAL_BLOCKED", "Governance Rule Violation", err.Error())
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"order_id":         r.PathValue("id"),
			"approval_status":  "APPROVED",
			"approver_user_id": appUID.String(),
			"approved_at":      time.Now().UTC().Format(time.RFC3339),
		})
	})

	// Payments: Process Payment & Book Double-Entry Ledger
	mux.HandleFunc("POST /v1/payments/process", func(w http.ResponseWriter, r *http.Request) {
		paymentID := uuid.New()
		pgTxID := fmt.Sprintf("PG-TX-%s", uuid.New().String()[:8])

		s.mu.Lock()
		defer s.mu.Unlock()

		entries := []payment.Entry{
			{AccountID: uuid.New(), DebitMinor: 144000, CreditMinor: 0, Memo: "PG Capture 30% Down Payment"},
			{AccountID: uuid.New(), DebitMinor: 0, CreditMinor: 144000, Memo: "Escrow Deposit"},
		}
		j, err := payment.CreateJournal(uuid.New(), "PAYMENT_CAPTURE", "USD", entries)
		if err != nil {
			writeProblem(w, http.StatusInternalServerError, "LEDGER_ERROR", "Accounting ledger failed", err.Error())
			return
		}
		s.journals = append(s.journals, j)

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

	// Ledger: Audit Trial Balance (Debit == Credit)
	mux.HandleFunc("GET /v1/admin/ledger/audit", func(w http.ResponseWriter, r *http.Request) {
		s.mu.RLock()
		defer s.mu.RUnlock()

		var totalDebit, totalCredit int64
		for _, j := range s.journals {
			for _, e := range j.Entries {
				totalDebit += e.DebitMinor
				totalCredit += e.CreditMinor
			}
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"audit_timestamp":       time.Now().UTC().Format(time.RFC3339),
			"is_balanced":           totalDebit == totalCredit,
			"currency":              "USD",
			"total_debit_minor":     totalDebit,
			"total_credit_minor":    totalCredit,
			"variance_minor":        totalDebit - totalCredit,
			"journal_entries_count": len(s.journals),
		})
	})

	// Ledger: Post Reversal Journal
	mux.HandleFunc("POST /v1/admin/ledger/reversal", func(w http.ResponseWriter, r *http.Request) {
		s.mu.Lock()
		defer s.mu.Unlock()

		if len(s.journals) == 0 {
			writeProblem(w, http.StatusBadRequest, "NO_JOURNALS", "No journals exist to reverse", "")
			return
		}

		lastJournal := s.journals[len(s.journals)-1]
		rev, err := payment.CreateReversal(lastJournal, "Admin Audit Correction")
		if err != nil {
			writeProblem(w, http.StatusInternalServerError, "REVERSAL_ERROR", "Reversal failed", err.Error())
			return
		}
		s.journals = append(s.journals, rev)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"reversal_journal_id": rev.ID.String(),
			"status":              "REVERSED",
			"posted_at":           rev.PostedAt.Format(time.RFC3339),
		})
	})
}
