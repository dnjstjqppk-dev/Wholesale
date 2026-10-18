package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestFullE2EDataConsistencyLifecycle(t *testing.T) {
	srv := NewServer()
	ts := httptest.NewServer(srv.routes())
	defer ts.Close()

	client := ts.Client()

	// 1. Supplier X Registration
	regPayload := map[string]interface{}{
		"email":           "supplier_x@precision-corp.com",
		"password":        "SecurePassword2026!",
		"full_name":       "김대표",
		"company_name":    "Precision Korea Co., Ltd.",
		"business_number": "123-45-67890",
		"role_capability": "MANUFACTURER",
	}
	body, _ := json.Marshal(regPayload)
	res, err := client.Post(ts.URL+"/v1/auth/register", "application/json", bytes.NewReader(body))
	if err != nil || res.StatusCode != http.StatusCreated {
		t.Fatalf("Supplier registration failed: code=%d err=%v", res.StatusCode, err)
	}

	// 2. Admin Approves Supplier Verification
	res, err = client.Post(ts.URL+"/v1/admin/verifications/verif-001/approve", "application/json", nil)
	if err != nil || res.StatusCode != http.StatusOK {
		t.Fatalf("Admin verification approval failed: code=%d err=%v", res.StatusCode, err)
	}

	// 3. Supplier X Registers Product Listing with Tiered Pricing & MOQ
	listingPayload := map[string]interface{}{
		"organization_id": "11111111-1111-1111-1111-111111111111",
		"title":           "산업용 초경량 스테인리스 진공 텀블러 벌크팩",
		"category":        "주방용품/산업용기",
		"moq":             "100",
		"quantity_step":   "10",
		"unit":            "pcs",
		"lead_time_days":  14,
		"price_tiers": []map[string]interface{}{
			{"min_quantity": "100", "max_quantity": "499", "unit_price": "5.500000", "currency": "USD"},
			{"min_quantity": "500", "max_quantity": "999", "unit_price": "4.800000", "currency": "USD"},
			{"min_quantity": "1000", "max_quantity": nil, "unit_price": "4.200000", "currency": "USD"},
		},
	}
	body, _ = json.Marshal(listingPayload)
	res, err = client.Post(ts.URL+"/v1/catalog/listings", "application/json", bytes.NewReader(body))
	if err != nil || res.StatusCode != http.StatusCreated {
		t.Fatalf("Listing creation failed: code=%d err=%v", res.StatusCode, err)
	}

	// 4. Buyer Queries Catalog Listings
	res, err = client.Get(ts.URL + "/v1/catalog/listings")
	if err != nil || res.StatusCode != http.StatusOK {
		t.Fatalf("Catalog listing query failed: code=%d err=%v", res.StatusCode, err)
	}
	var catalogResp struct {
		Items []map[string]interface{} `json:"items"`
	}
	_ = json.NewDecoder(res.Body).Decode(&catalogResp)
	if len(catalogResp.Items) < 1 {
		t.Fatalf("Expected at least 1 listing in catalog, got %d", len(catalogResp.Items))
	}

	// 5. Buyer Submits RFQ
	rfqPayload := map[string]interface{}{
		"title":               "2026 하반기 스테인리스 텀블러 5,000개 조달",
		"destination_country": "US",
		"expires_at":          "2026-11-30",
		"items": []map[string]interface{}{
			{"title": "SUS304 500ml", "requested_quantity": "5000", "unit": "pcs"},
		},
	}
	body, _ = json.Marshal(rfqPayload)
	res, err = client.Post(ts.URL+"/v1/sourcing/rfqs", "application/json", bytes.NewReader(body))
	if err != nil || res.StatusCode != http.StatusCreated {
		t.Fatalf("RFQ submission failed: code=%d err=%v", res.StatusCode, err)
	}

	// 6. Buyer Accepts Quote with Idempotency-Key
	req, _ := http.NewRequest("POST", ts.URL+"/v1/sourcing/quotes/quote-001/accept", nil)
	req.Header.Set("Idempotency-Key", "idemp-key-test-999")
	res, err = client.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		t.Fatalf("Quote acceptance failed: code=%d err=%v", res.StatusCode, err)
	}

	// Duplicate Quote Acceptance with Same Idempotency-Key Must Be Rejected
	reqDup, _ := http.NewRequest("POST", ts.URL+"/v1/sourcing/quotes/quote-001/accept", nil)
	reqDup.Header.Set("Idempotency-Key", "idemp-key-test-999")
	resDup, err := client.Do(reqDup)
	if err != nil || resDup.StatusCode != http.StatusConflict {
		t.Fatalf("Duplicate quote acceptance should return 409 Conflict, got: code=%d", resDup.StatusCode)
	}

	// 7. Trade Contract Sign
	signPayload := map[string]interface{}{
		"document_hash":  "c67469723725e6e026620593dd2a466a9d184ffbe6cf2ab82a725e1a3d02b557",
		"signer_user_id": "user-buyer-001",
		"signer_org_id":  "org-buyer-001",
	}
	body, _ = json.Marshal(signPayload)
	res, err = client.Post(ts.URL+"/v1/trade/orders/order-001/contract/sign", "application/json", bytes.NewReader(body))
	if err != nil || res.StatusCode != http.StatusOK {
		t.Fatalf("Contract signing failed: code=%d err=%v", res.StatusCode, err)
	}

	// 8. Payment Process & Ledger Posting
	res, err = client.Post(ts.URL+"/v1/payments/process", "application/json", nil)
	if err != nil || res.StatusCode != http.StatusOK {
		t.Fatalf("Payment process failed: code=%d err=%v", res.StatusCode, err)
	}
	var payResp map[string]interface{}
	_ = json.NewDecoder(res.Body).Decode(&payResp)
	if payResp["ledger_posted"] != true || payResp["status"] != "PAID" {
		t.Fatalf("Unexpected payment ledger response: %+v", payResp)
	}
}
