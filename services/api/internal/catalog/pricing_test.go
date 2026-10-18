package catalog

import (
	"errors"
	"testing"

	"github.com/shopspring/decimal"
)

func ptrDecimal(d decimal.Decimal) *decimal.Decimal {
	return &d
}

func TestPricingCalculations(t *testing.T) {
	tiers := []PriceTier{
		{
			MinQty:    decimal.NewFromInt(100),
			MaxQty:    ptrDecimal(decimal.NewFromInt(500)),
			UnitPrice: decimal.NewFromFloat(2.50),
		},
		{
			MinQty:    decimal.NewFromInt(500),
			MaxQty:    ptrDecimal(decimal.NewFromInt(1000)),
			UnitPrice: decimal.NewFromFloat(2.20),
		},
		{
			MinQty:    decimal.NewFromInt(1000),
			MaxQty:    nil, // infinite
			UnitPrice: decimal.NewFromFloat(1.90),
		},
	}

	if err := ValidateTiers(tiers); err != nil {
		t.Fatalf("ValidateTiers failed: %v", err)
	}

	moq := decimal.NewFromInt(100)
	step := decimal.NewFromInt(10)

	// Test Case 1: 90 is below MOQ
	_, _, err := CalculatePrice(decimal.NewFromInt(90), moq, step, tiers, "USD")
	if !errors.Is(err, ErrBelowMOQ) {
		t.Errorf("Expected ErrBelowMOQ for 90, got: %v", err)
	}

	// Test Case 2: 100 -> 2.50, total 250.00 -> 25000 minor
	uPrice, minor, err := CalculatePrice(decimal.NewFromInt(100), moq, step, tiers, "USD")
	if err != nil {
		t.Fatalf("Unexpected error for 100: %v", err)
	}
	if !uPrice.Equal(decimal.NewFromFloat(2.50)) || minor != 25000 {
		t.Errorf("Expected unit=2.50, minor=25000, got unit=%s, minor=%d", uPrice, minor)
	}

	// Test Case 3: 490 -> 2.50, total 1225.00 -> 122500 minor
	uPrice, minor, err = CalculatePrice(decimal.NewFromInt(490), moq, step, tiers, "USD")
	if err != nil {
		t.Fatalf("Unexpected error for 490: %v", err)
	}
	if !uPrice.Equal(decimal.NewFromFloat(2.50)) || minor != 122500 {
		t.Errorf("Expected unit=2.50, minor=122500, got unit=%s, minor=%d", uPrice, minor)
	}

	// Test Case 4: 500 -> 2.20, total 1100.00 -> 110000 minor
	uPrice, minor, err = CalculatePrice(decimal.NewFromInt(500), moq, step, tiers, "USD")
	if err != nil {
		t.Fatalf("Unexpected error for 500: %v", err)
	}
	if !uPrice.Equal(decimal.NewFromFloat(2.20)) || minor != 110000 {
		t.Errorf("Expected unit=2.20, minor=110000, got unit=%s, minor=%d", uPrice, minor)
	}

	// Test Case 5: 1000 -> 1.90, total 1900.00 -> 190000 minor
	uPrice, minor, err = CalculatePrice(decimal.NewFromInt(1000), moq, step, tiers, "USD")
	if err != nil {
		t.Fatalf("Unexpected error for 1000: %v", err)
	}
	if !uPrice.Equal(decimal.NewFromFloat(1.90)) || minor != 190000 {
		t.Errorf("Expected unit=1.90, minor=190000, got unit=%s, minor=%d", uPrice, minor)
	}

	// Test Case 6: 505 -> Step error (step is 10, moq 100, (505-100)%10 = 5 != 0)
	_, _, err = CalculatePrice(decimal.NewFromInt(505), moq, step, tiers, "USD")
	if !errors.Is(err, ErrInvalidStep) {
		t.Errorf("Expected ErrInvalidStep for 505, got: %v", err)
	}
}

func TestSection9RoundingExamples(t *testing.T) {
	// Example A: USD 2.345678 * 12.5 = 29.320975 -> 2932 minor
	singleTierA := []PriceTier{
		{
			MinQty:    decimal.NewFromFloat(1.0),
			MaxQty:    nil,
			UnitPrice: decimal.RequireFromString("2.345678"),
		},
	}
	_, minorA, err := CalculatePrice(decimal.RequireFromString("12.5"), decimal.NewFromFloat(1.0), decimal.Zero, singleTierA, "USD")
	if err != nil {
		t.Fatalf("Example A failed: %v", err)
	}
	if minorA != 2932 {
		t.Errorf("Example A: expected 2932, got %d", minorA)
	}

	// Example B: USD 0.333333 * 3 = 0.999999 -> 100 minor
	singleTierB := []PriceTier{
		{
			MinQty:    decimal.NewFromFloat(1.0),
			MaxQty:    nil,
			UnitPrice: decimal.RequireFromString("0.333333"),
		},
	}
	_, minorB, err := CalculatePrice(decimal.NewFromInt(3), decimal.NewFromFloat(1.0), decimal.Zero, singleTierB, "USD")
	if err != nil {
		t.Fatalf("Example B failed: %v", err)
	}
	if minorB != 100 {
		t.Errorf("Example B: expected 100, got %d", minorB)
	}

	// Example C: KRW 0.5 * 1 -> 1 minor (KRW has 0 minor exponent, 0.5 rounds half up to 1)
	singleTierC := []PriceTier{
		{
			MinQty:    decimal.NewFromFloat(1.0),
			MaxQty:    nil,
			UnitPrice: decimal.RequireFromString("0.5"),
		},
	}
	_, minorC, err := CalculatePrice(decimal.NewFromInt(1), decimal.NewFromFloat(1.0), decimal.Zero, singleTierC, "KRW")
	if err != nil {
		t.Fatalf("Example C failed: %v", err)
	}
	if minorC != 1 {
		t.Errorf("Example C: expected 1, got %d", minorC)
	}
}

