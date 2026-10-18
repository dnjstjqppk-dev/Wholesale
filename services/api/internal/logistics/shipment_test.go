package logistics

import (
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

func TestSplitShipmentCumulativeValidation(t *testing.T) {
	fulfillment := &OrderItemFulfillment{
		OrderItemID:     uuid.New(),
		OrderedQuantity: decimal.NewFromInt(1000),
		ShippedQuantity: decimal.Zero,
	}

	// 1st partial shipment: 400 pcs -> Success
	err := fulfillment.ApplyShipment(decimal.NewFromInt(400))
	if err != nil {
		t.Fatalf("1st partial shipment failed: %v", err)
	}

	// 2nd partial shipment: 400 pcs -> Success (Total = 800)
	err = fulfillment.ApplyShipment(decimal.NewFromInt(400))
	if err != nil {
		t.Fatalf("2nd partial shipment failed: %v", err)
	}

	// 3rd partial shipment: 300 pcs -> Must Fail (800 + 300 = 1100 > 1000)
	err = fulfillment.ApplyShipment(decimal.NewFromInt(300))
	if !errors.Is(err, ErrShipmentExceedsOrderQuantity) {
		t.Errorf("Expected ErrShipmentExceedsOrderQuantity on 1100 cumulative, got: %v", err)
	}

	// 3rd partial shipment corrected: 200 pcs -> Success (Total = 1000)
	err = fulfillment.ApplyShipment(decimal.NewFromInt(200))
	if err != nil {
		t.Fatalf("3rd corrected shipment failed: %v", err)
	}

	// 4th shipment attempt: 1 pc -> Must Fail (Fully shipped)
	err = fulfillment.ApplyShipment(decimal.NewFromInt(1))
	if !errors.Is(err, ErrShipmentExceedsOrderQuantity) {
		t.Errorf("Expected ErrShipmentExceedsOrderQuantity on 1001 cumulative, got: %v", err)
	}
}
