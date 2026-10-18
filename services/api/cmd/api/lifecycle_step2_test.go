package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestStep2SourcingRFQAndMultiRoundBidding(t *testing.T) {
	srv := NewServer()
	ts := httptest.NewServer(srv.routes())
	defer ts.Close()
	client := ts.Client()

	// 1. Create RFQ
	rfqBody, _ := json.Marshal(map[string]interface{}{
		"buyer_organization_id": "22222222-2222-2222-2222-222222222222",
		"buyer_contact_email":   "confidential_buyer@corp.com",
		"title":                 "CNC 항공부품 가공 조달",
		"destination_country":   "KR",
		"items": []map[string]interface{}{
			{"title": "AL6061 가공품", "requested_quantity": "500", "unit": "pcs"},
		},
	})
	res, err := client.Post(ts.URL+"/v1/sourcing/rfqs", "application/json", bytes.NewReader(rfqBody))
	if err != nil || res.StatusCode != http.StatusCreated {
		t.Fatalf("Create RFQ failed: code=%d err=%v", res.StatusCode, err)
	}

	// 2. Query Public RFQ Market: Verify contact masking
	res, err = client.Get(ts.URL + "/v1/sourcing/rfqs")
	if err != nil || res.StatusCode != http.StatusOK {
		t.Fatalf("Query RFQ failed: code=%d err=%v", res.StatusCode, err)
	}
	var rfqListResp struct {
		RFQs []map[string]interface{} `json:"rfqs"`
	}
	_ = json.NewDecoder(res.Body).Decode(&rfqListResp)
	for _, item := range rfqListResp.RFQs {
		if item["is_contact_masked"] != true {
			t.Fatalf("Public RFQ market must mask sensitive buyer contact")
		}
	}

	// 3. Supplier Submits Quote
	quoteBody, _ := json.Marshal(map[string]interface{}{
		"supplier_organization_id": "11111111-1111-1111-1111-111111111111",
		"unit_price":               "18.500000",
		"lead_time_days":           21,
		"incoterms":                "FOB",
		"currency":                 "USD",
	})
	res, err = client.Post(ts.URL+"/v1/sourcing/rfqs/55555555-5555-5555-5555-555555555555/quotes", "application/json", bytes.NewReader(quoteBody))
	if err != nil || res.StatusCode != http.StatusCreated {
		t.Fatalf("Submit quote failed: code=%d err=%v", res.StatusCode, err)
	}

	// 4. Accept Quote with Idempotency Key
	req, _ := http.NewRequest("POST", ts.URL+"/v1/sourcing/quotes/66666666-6666-6666-6666-666666666666/accept", nil)
	req.Header.Set("Idempotency-Key", "idemp-key-step2-001")
	res, err = client.Do(req)
	if err != nil || res.StatusCode != http.StatusOK {
		t.Fatalf("Quote accept failed: code=%d err=%v", res.StatusCode, err)
	}

	// 5. Duplicate acceptance must be rejected with 409 Conflict
	reqDup, _ := http.NewRequest("POST", ts.URL+"/v1/sourcing/quotes/66666666-6666-6666-6666-666666666666/accept", nil)
	reqDup.Header.Set("Idempotency-Key", "idemp-key-step2-001")
	resDup, err := client.Do(reqDup)
	if err != nil || resDup.StatusCode != http.StatusConflict {
		t.Fatalf("Duplicate accept should return 409 Conflict, got %d", resDup.StatusCode)
	}
}

func TestStep2TradeGovernanceAndLedgerAudit(t *testing.T) {
	srv := NewServer()
	ts := httptest.NewServer(srv.routes())
	defer ts.Close()
	client := ts.Client()
	orderID := "77777777-7777-7777-7777-777777777777"

	// 1. View Trade Contract & Hash
	res, err := client.Get(ts.URL + "/v1/trade/orders/" + orderID + "/contract")
	if err != nil || res.StatusCode != http.StatusOK {
		t.Fatalf("Get contract failed: code=%d", res.StatusCode)
	}
	var ctrResp map[string]interface{}
	_ = json.NewDecoder(res.Body).Decode(&ctrResp)
	docHash := ctrResp["document_hash"].(string)

	// 2. SoD Corporate Approval: Self-approval must be blocked (403)
	selfApproveBody, _ := json.Marshal(map[string]interface{}{
		"requester_user_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
		"approver_user_id":  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
	})
	res, _ = client.Post(ts.URL+"/v1/trade/orders/"+orderID+"/approve", "application/json", bytes.NewReader(selfApproveBody))
	if res.StatusCode != http.StatusForbidden {
		t.Fatalf("Self-approval should return 403 Forbidden, got %d", res.StatusCode)
	}

	// Distinct manager approval must succeed (200)
	validApproveBody, _ := json.Marshal(map[string]interface{}{
		"requester_user_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
		"approver_user_id":  "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
	})
	res, _ = client.Post(ts.URL+"/v1/trade/orders/"+orderID+"/approve", "application/json", bytes.NewReader(validApproveBody))
	if res.StatusCode != http.StatusOK {
		t.Fatalf("Valid manager approval failed: code=%d", res.StatusCode)
	}

	// 3. Sign Contract with Document Hash
	signBody, _ := json.Marshal(map[string]interface{}{
		"document_hash":  docHash,
		"signer_user_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
		"signer_org_id":  "22222222-2222-2222-2222-222222222222",
	})
	res, _ = client.Post(ts.URL+"/v1/trade/orders/"+orderID+"/contract/sign", "application/json", bytes.NewReader(signBody))
	if res.StatusCode != http.StatusOK {
		t.Fatalf("Sign contract failed: code=%d", res.StatusCode)
	}

	// 4. Ledger Audit (Debit == Credit)
	res, _ = client.Get(ts.URL + "/v1/admin/ledger/audit")
	var auditResp map[string]interface{}
	_ = json.NewDecoder(res.Body).Decode(&auditResp)
	if auditResp["is_balanced"] != true || auditResp["variance_minor"].(float64) != 0 {
		t.Fatalf("Ledger audit unbalanced: %+v", auditResp)
	}

	// 5. Post Reversal
	res, _ = client.Post(ts.URL+"/v1/admin/ledger/reversal", "application/json", nil)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("Post reversal failed: code=%d", res.StatusCode)
	}
}

func TestStep2FulfillmentDisputeAndSettlement(t *testing.T) {
	srv := NewServer()
	ts := httptest.NewServer(srv.routes())
	defer ts.Close()
	client := ts.Client()
	orderID := "77777777-7777-7777-7777-777777777777"

	// 1. Split Shipment 1: 400 pcs (Safe)
	ship1Body, _ := json.Marshal(map[string]interface{}{
		"order_id": orderID, "dispatch_quantity": "400", "tracking_number": "BL-001", "carrier": "HMM",
	})
	res, _ := client.Post(ts.URL+"/v1/logistics/shipments", "application/json", bytes.NewReader(ship1Body))
	if res.StatusCode != http.StatusCreated {
		t.Fatalf("Shipment 1 failed: code=%d", res.StatusCode)
	}

	// Split Shipment 2: 700 pcs (Cumulative 1100 > 1000, must fail 422)
	ship2Body, _ := json.Marshal(map[string]interface{}{
		"order_id": orderID, "dispatch_quantity": "700", "tracking_number": "BL-002", "carrier": "HMM",
	})
	res, _ = client.Post(ts.URL+"/v1/logistics/shipments", "application/json", bytes.NewReader(ship2Body))
	if res.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("Overflow shipment should fail with 422, got %d", res.StatusCode)
	}

	// Split Shipment 3: 600 pcs (Cumulative exact 1000, must succeed)
	ship3Body, _ := json.Marshal(map[string]interface{}{
		"order_id": orderID, "dispatch_quantity": "600", "tracking_number": "BL-003", "carrier": "HMM",
	})
	res, _ = client.Post(ts.URL+"/v1/logistics/shipments", "application/json", bytes.NewReader(ship3Body))
	if res.StatusCode != http.StatusCreated {
		t.Fatalf("Shipment 3 failed: code=%d", res.StatusCode)
	}

	// 2. Open Dispute: Must freeze settlement
	dispBody, _ := json.Marshal(map[string]interface{}{
		"order_id": orderID, "buyer_org_id": "22222222-2222-2222-2222-222222222222",
		"supplier_org_id": "11111111-1111-1111-1111-111111111111", "claimed_amount_minor": 120000,
		"currency": "USD", "reason": "포장 파손 클레임",
	})
	res, _ = client.Post(ts.URL+"/v1/disputes", "application/json", bytes.NewReader(dispBody))
	if res.StatusCode != http.StatusCreated {
		t.Fatalf("Open dispute failed: code=%d", res.StatusCode)
	}
	var dispResp map[string]interface{}
	_ = json.NewDecoder(res.Body).Decode(&dispResp)
	dispID := dispResp["id"].(string)

	// Verify settlement is frozen to HELD
	res, _ = client.Get(ts.URL + "/v1/settlements")
	var setListResp struct {
		Settlements []map[string]interface{} `json:"settlements"`
	}
	_ = json.NewDecoder(res.Body).Decode(&setListResp)
	if len(setListResp.Settlements) > 0 && setListResp.Settlements[0]["status"] != "HELD" {
		t.Fatalf("Settlement should be frozen to HELD when dispute is active")
	}

	// 3. Admin Arbitrates Dispute
	arbBody, _ := json.Marshal(map[string]interface{}{
		"arbitrator_id": "33333333-3333-3333-3333-333333333333",
		"refund_minor": 36000, "payout_minor": 84000, "resolution_notes": "합의 종결",
	})
	res, _ = client.Post(ts.URL+"/v1/disputes/"+dispID+"/arbitrate", "application/json", bytes.NewReader(arbBody))
	if res.StatusCode != http.StatusOK {
		t.Fatalf("Arbitrate dispute failed: code=%d", res.StatusCode)
	}

	// 4. Dual-Control Settlement Approval
	setID := setListResp.Settlements[0]["id"].(string)
	app1Body, _ := json.Marshal(map[string]interface{}{"approver_id": "44444444-4444-4444-4444-444444444444"})
	res, _ = client.Post(ts.URL+"/v1/settlements/"+setID+"/approve", "application/json", bytes.NewReader(app1Body))
	if res.StatusCode != http.StatusOK {
		t.Fatalf("Settlement approval 1 failed: code=%d", res.StatusCode)
	}

	// Same operator cannot approve twice (409 Conflict)
	res, _ = client.Post(ts.URL+"/v1/settlements/"+setID+"/approve", "application/json", bytes.NewReader(app1Body))
	if res.StatusCode != http.StatusConflict {
		t.Fatalf("Duplicate approval should return 409 Conflict, got %d", res.StatusCode)
	}

	// Second operator completes dual control
	app2Body, _ := json.Marshal(map[string]interface{}{"approver_id": "55555555-5555-5555-5555-555555555555"})
	res, _ = client.Post(ts.URL+"/v1/settlements/"+setID+"/approve", "application/json", bytes.NewReader(app2Body))
	if res.StatusCode != http.StatusOK {
		t.Fatalf("Settlement approval 2 failed: code=%d", res.StatusCode)
	}

	// 5. Final Payout Wire Release
	res, _ = client.Post(ts.URL+"/v1/settlements/"+setID+"/payout", "application/json", nil)
	if res.StatusCode != http.StatusOK {
		t.Fatalf("Payout wire release failed: code=%d", res.StatusCode)
	}
}

