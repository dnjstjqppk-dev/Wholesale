package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
)

func (s *Server) registerCatalogRoutes(mux *http.ServeMux) {
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
			"access_token": fmt.Sprintf("mock-jwt-%s", userID.String()),
			"token_type":   "Bearer",
			"expires_in":   86400,
			"user":         user,
			"organization": s.orgs[orgID],
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

	// Catalog: Create Listing (Supplier)
	mux.HandleFunc("POST /v1/catalog/listings", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			OrganizationID string                   `json:"organization_id"`
			Title          string                   `json:"title"`
			Category       string                   `json:"category"`
			MOQ            string                   `json:"moq"`
			QuantityStep   string                   `json:"quantity_step"`
			Unit           string                   `json:"unit"`
			LeadTimeDays   int                      `json:"lead_time_days"`
			PriceTiers     []map[string]interface{} `json:"price_tiers"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeProblem(w, http.StatusBadRequest, "INVALID_BODY", "Invalid JSON", err.Error())
			return
		}

		s.mu.Lock()
		defer s.mu.Unlock()

		listingID := uuid.New()
		skuID := uuid.New()
		listing := map[string]interface{}{
			"id":                   listingID.String(),
			"organization_id":      req.OrganizationID,
			"sku_id":               skuID.String(),
			"title":                req.Title,
			"category":             req.Category,
			"moq":                  req.MOQ,
			"quantity_step":        req.QuantityStep,
			"unit":                 req.Unit,
			"lead_time_days":       req.LeadTimeDays,
			"status":               "PUBLISHED",
			"price_tiers":          req.PriceTiers,
			"is_verified_supplier": true,
		}
		s.listings[listingID] = listing

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(listing)
	})

	// Admin: Approve Verification
	mux.HandleFunc("POST /v1/admin/verifications/{id}/approve", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"verification_id": r.PathValue("id"),
			"status":          "APPROVED",
			"approved_at":     time.Now().UTC().Format(time.RFC3339),
			"verified":        true,
		})
	})
}

