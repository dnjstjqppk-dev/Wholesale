package catalog

import (
	"errors"
	"fmt"

	"github.com/shopspring/decimal"
)

var (
	ErrBelowMOQ       = errors.New("quantity is below minimum order quantity (MOQ)")
	ErrInvalidStep    = errors.New("quantity violates quantity step increment")
	ErrNoMatchingTier = errors.New("no matching pricing tier found for specified quantity")
	ErrInvalidTiers   = errors.New("invalid or overlapping price tier configuration")
)

// PriceTier defines a quantity bracket [MinQty, MaxQty) with an associated UnitPrice.
// If MaxQty is nil, the tier extends to infinity.
type PriceTier struct {
	MinQty    decimal.Decimal `json:"min_quantity"`
	MaxQty    *decimal.Decimal `json:"max_quantity,omitempty"`
	UnitPrice decimal.Decimal `json:"unit_price"`
}

// CurrencyConfig specifies minor unit exponent (e.g., USD=2, KRW=0, JPY=0).
type CurrencyConfig struct {
	Code          string
	MinorExponent int32
}

var SupportedCurrencies = map[string]CurrencyConfig{
	"USD": {Code: "USD", MinorExponent: 2},
	"EUR": {Code: "EUR", MinorExponent: 2},
	"KRW": {Code: "KRW", MinorExponent: 0},
	"JPY": {Code: "JPY", MinorExponent: 0},
	"CNY": {Code: "CNY", MinorExponent: 2},
}

// ValidateTiers ensures tiers do not overlap and are strictly ordered.
func ValidateTiers(tiers []PriceTier) error {
	if len(tiers) == 0 {
		return ErrInvalidTiers
	}
	for i := 0; i < len(tiers); i++ {
		t := tiers[i]
		if t.MinQty.LessThanOrEqual(decimal.Zero) || t.UnitPrice.LessThan(decimal.Zero) {
			return ErrInvalidTiers
		}
		if t.MaxQty != nil {
			if t.MaxQty.LessThanOrEqual(t.MinQty) {
				return ErrInvalidTiers
			}
			if i < len(tiers)-1 {
				next := tiers[i+1]
				if !next.MinQty.Equal(*t.MaxQty) {
					return ErrInvalidTiers
				}
			}
		} else {
			// If MaxQty is nil, it must be the last tier
			if i != len(tiers)-1 {
				return ErrInvalidTiers
			}
		}
	}
	return nil
}

// CalculatePrice finds the appropriate tier and calculates line item total in minor units.
// Formula: line_minor = quantize(unit_price * quantity, currency.minor_exponent, ROUND_HALF_UP)
func CalculatePrice(
	quantity decimal.Decimal,
	moq decimal.Decimal,
	step decimal.Decimal,
	tiers []PriceTier,
	currencyCode string,
) (unitPrice decimal.Decimal, lineMinor int64, err error) {
	if quantity.LessThan(moq) {
		return decimal.Zero, 0, fmt.Errorf("%w: req=%s, moq=%s", ErrBelowMOQ, quantity.String(), moq.String())
	}

	if step.GreaterThan(decimal.Zero) {
		// (quantity - moq) % step == 0
		diff := quantity.Sub(moq)
		rem := diff.Mod(step)
		if !rem.Equal(decimal.Zero) {
			return decimal.Zero, 0, fmt.Errorf("%w: diff=%s, step=%s", ErrInvalidStep, diff.String(), step.String())
		}
	}

	curr, ok := SupportedCurrencies[currencyCode]
	if !ok {
		return decimal.Zero, 0, fmt.Errorf("unsupported currency: %s", currencyCode)
	}

	// Match tier [MinQty, MaxQty)
	var matchedTier *PriceTier
	for i := range tiers {
		t := &tiers[i]
		if quantity.GreaterThanOrEqual(t.MinQty) {
			if t.MaxQty == nil || quantity.LessThan(*t.MaxQty) {
				matchedTier = t
				break
			}
		}
	}

	if matchedTier == nil {
		return decimal.Zero, 0, ErrNoMatchingTier
	}

	unitPrice = matchedTier.UnitPrice
	// Compute exact raw total = unitPrice * quantity
	rawTotal := unitPrice.Mul(quantity)

	// Scale to minor units: minorValue = rawTotal * 10^(MinorExponent)
	factor := decimal.New(1, curr.MinorExponent)
	minorDecimal := rawTotal.Mul(factor)

	// Round half-up to integer
	roundedMinor := minorDecimal.Round(0)
	lineMinor = roundedMinor.IntPart()

	return unitPrice, lineMinor, nil
}
