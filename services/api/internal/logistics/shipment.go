package logistics

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

var (
	ErrShipmentExceedsOrderQuantity = errors.New("cumulative shipped quantity exceeds ordered quantity")
	ErrInvalidQuantity              = errors.New("shipped quantity must be strictly positive")
)

type OrderItemFulfillment struct {
	OrderItemID     uuid.UUID
	OrderedQuantity decimal.Decimal
	ShippedQuantity decimal.Decimal
}

// ValidateSplitShipment checks that adding a new partial shipment does not exceed the ordered quantity.
func (f *OrderItemFulfillment) ValidateSplitShipment(newShipmentQty decimal.Decimal) error {
	if newShipmentQty.LessThanOrEqual(decimal.Zero) {
		return ErrInvalidQuantity
	}

	newTotal := f.ShippedQuantity.Add(newShipmentQty)
	if newTotal.GreaterThan(f.OrderedQuantity) {
		return fmt.Errorf("%w: ordered=%s, previously_shipped=%s, attempted=%s, projected_total=%s",
			ErrShipmentExceedsOrderQuantity,
			f.OrderedQuantity.String(),
			f.ShippedQuantity.String(),
			newShipmentQty.String(),
			newTotal.String(),
		)
	}

	return nil
}

// ApplyShipment commits the partial shipment increment.
func (f *OrderItemFulfillment) ApplyShipment(qty decimal.Decimal) error {
	if err := f.ValidateSplitShipment(qty); err != nil {
		return err
	}
	f.ShippedQuantity = f.ShippedQuantity.Add(qty)
	return nil
}

