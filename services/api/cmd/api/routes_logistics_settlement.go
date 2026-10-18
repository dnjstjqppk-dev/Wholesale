package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"wholesale/services/api/internal/support"
)

func (s *Server) registerLogisticsAndSettlementRoutes(mux *http.ServeMux) {
	// Logistics: Split Shipment Dispatch with Cumulative Bounds Check
	mux.HandleFunc("POST /v1/logistics/shipments", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			OrderID          string `json:"order_id"`
			DispatchQuantity string `json:"dispatch_quantity"`
			TrackingNumber   string `json:"tracking_number"`
			Carrier          string `json:"carrier"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeProblem(w, http.StatusBadRequest, "INVALID_BODY", "Invalid JSON", err.Error())
			return
		}

		qty, err := decimal.NewFromString(req.DispatchQuantity)
		if err != nil {
			writeProblem(w, http.StatusBadRequest, "INVALID_QTY", "Invalid dispatch quantity", err.Error())
			return
		}

		s.mu.Lock()
		defer s.mu.Unlock()

		orderID, _ := uuid.Parse(req.OrderID)
		fulfillment, exists := s.shipments[orderID]
		if exists {
			if err := fulfillment.ApplyShipment(qty); err != nil {
				writeProblem(w, http.StatusUnprocessableEntity, "CUMULATIVE_OVERFLOW", "Shipment Exceeds Order Quantity", err.Error())
				return
			}
		}

		shipmentID := uuid.New()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"shipment_id":     shipmentID.String(),
			"order_id":        req.OrderID,
			"tracking_number": req.TrackingNumber,
			"carrier":         req.Carrier,
			"dispatched_qty":  qty.String(),
			"status":          "IN_TRANSIT",
			"dispatched_at":   time.Now().UTC().Format(time.RFC3339),
		})
	})

	// Support: Open Dispute (Freezes Settlement to HELD)
	mux.HandleFunc("POST /v1/disputes", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			OrderID            string `json:"order_id"`
			BuyerOrgID         string `json:"buyer_org_id"`
			SupplierOrgID      string `json:"supplier_org_id"`
			ClaimedAmountMinor int64  `json:"claimed_amount_minor"`
			Currency           string `json:"currency"`
			Reason             string `json:"reason"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeProblem(w, http.StatusBadRequest, "INVALID_BODY", "Invalid JSON", err.Error())
			return
		}

		s.mu.Lock()
		defer s.mu.Unlock()

		orderID, _ := uuid.Parse(req.OrderID)
		buyerID, _ := uuid.Parse(req.BuyerOrgID)
		supID, _ := uuid.Parse(req.SupplierOrgID)

		disp := support.NewDispute(orderID, buyerID, supID, req.ClaimedAmountMinor, req.Currency, req.Reason)
		s.disputes[disp.ID] = disp

		// Freeze settlement immediately
		if setRecord, exists := s.settlements[orderID]; exists {
			setRecord.FreezeOnDispute()
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(disp)
	})

	// Support: List Disputes
	mux.HandleFunc("GET /v1/disputes", func(w http.ResponseWriter, r *http.Request) {
		s.mu.RLock()
		defer s.mu.RUnlock()

		items := make([]*support.Dispute, 0, len(s.disputes))
		for _, d := range s.disputes {
			items = append(items, d)
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"disputes":    items,
			"total_count": len(items),
		})
	})

	// Support: Admin Arbitrate Dispute
	mux.HandleFunc("POST /v1/disputes/{id}/arbitrate", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			ArbitratorID       string `json:"arbitrator_id"`
			RefundMinor        int64  `json:"refund_minor"`
			PayoutMinor        int64  `json:"payout_minor"`
			ResolutionNotes    string `json:"resolution_notes"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeProblem(w, http.StatusBadRequest, "INVALID_BODY", "Invalid JSON", err.Error())
			return
		}

		s.mu.Lock()
		defer s.mu.Unlock()

		dispID, _ := uuid.Parse(r.PathValue("id"))
		disp, exists := s.disputes[dispID]
		if !exists {
			writeProblem(w, http.StatusNotFound, "DISPUTE_NOT_FOUND", "Dispute Not Found", "")
			return
		}

		arbID, _ := uuid.Parse(req.ArbitratorID)
		if err := disp.Arbitrate(arbID, true, req.RefundMinor, req.PayoutMinor, req.ResolutionNotes); err != nil {
			writeProblem(w, http.StatusUnprocessableEntity, "ARBITRATION_FAILED", err.Error(), "")
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(disp)
	})

	// Settlement: List Records
	mux.HandleFunc("GET /v1/settlements", func(w http.ResponseWriter, r *http.Request) {
		s.mu.RLock()
		defer s.mu.RUnlock()

		items := make([]map[string]interface{}, 0, len(s.settlements))
		for _, set := range s.settlements {
			items = append(items, map[string]interface{}{
				"id":                  set.ID.String(),
				"trade_order_id":      set.TradeOrderID.String(),
				"gross_minor":         set.GrossAmountMinor,
				"fee_minor":           set.FeeAmountMinor,
				"refund_minor":        set.RefundedAmountMinor,
				"net_payout_minor":    set.NetPayoutMinor,
				"currency":            set.Currency,
				"status":              set.Status,
				"has_active_dispute":  set.HasActiveDispute,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"settlements": items,
			"total_count": len(items),
		})
	})

	// Settlement: Dual-Control Approval
	mux.HandleFunc("POST /v1/settlements/{id}/approve", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			ApproverID string `json:"approver_id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeProblem(w, http.StatusBadRequest, "INVALID_BODY", "Invalid JSON", err.Error())
			return
		}

		s.mu.Lock()
		defer s.mu.Unlock()

		setID, _ := uuid.Parse(r.PathValue("id"))
		approverUID, _ := uuid.Parse(req.ApproverID)

		approvals := s.settlementApprovals[setID]
		for _, uid := range approvals {
			if uid == approverUID {
				writeProblem(w, http.StatusConflict, "ALREADY_APPROVED_BY_USER", "Dual Control Violation", "A single operator cannot approve twice")
				return
			}
		}

		approvals = append(approvals, approverUID)
		s.settlementApprovals[setID] = approvals

		isDualControlComplete := len(approvals) >= 2
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"settlement_id":            setID.String(),
			"approval_count":           len(approvals),
			"is_dual_control_complete": isDualControlComplete,
			"status":                   "DUAL_CONTROL_PENDING",
		})
	})

	// Settlement: Release Payout Wire
	mux.HandleFunc("POST /v1/settlements/{id}/payout", func(w http.ResponseWriter, r *http.Request) {
		s.mu.Lock()
		defer s.mu.Unlock()

		setID, _ := uuid.Parse(r.PathValue("id"))
		wireRef := fmt.Sprintf("WIRE-%s", uuid.New().String()[:8])

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"settlement_id": setID.String(),
			"status":        "PAID_OUT",
			"wire_ref":      wireRef,
			"dispatched_at": time.Now().UTC().Format(time.RFC3339),
		})
	})
}
