package inventory

import (
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

func TestConcurrentReservationOversellPrevention(t *testing.T) {
	mgr := NewManager()
	skuID := uuid.New()
	initialStock := decimal.NewFromInt(100)

	mgr.SetInitialStock(skuID, initialStock)

	var wg sync.WaitGroup
	results := make(chan error, 2)

	// Launch two concurrent 60-unit reservation attempts
	for i := 0; i < 2; i++ {
		wg.Add(1)
		go func(orderIndex int) {
			defer wg.Done()
			orderID := uuid.New()
			_, err := mgr.Reserve(skuID, orderID, decimal.NewFromInt(60), 10*time.Minute)
			results <- err
		}(i)
	}

	wg.Wait()
	close(results)

	var successCount int
	var failureCount int

	for err := range results {
		if err == nil {
			successCount++
		} else if errors.Is(err, ErrInsufficientInventory) {
			failureCount++
		} else {
			t.Errorf("Unexpected error received: %v", err)
		}
	}

	if successCount != 1 || failureCount != 1 {
		t.Fatalf("Expected exactly 1 success and 1 failure for concurrent 60/60 on 100 stock. Got success=%d, failure=%d", successCount, failureCount)
	}

	bal, ok := mgr.GetBalance(skuID)
	if !ok {
		t.Fatal("Balance lookup failed")
	}

	// Stock check: on_hand=100, reserved=60, available=40
	if !bal.OnHand.Equal(decimal.NewFromInt(100)) ||
		!bal.Reserved.Equal(decimal.NewFromInt(60)) ||
		!bal.Available.Equal(decimal.NewFromInt(40)) {
		t.Errorf("Final balance mismatch: on_hand=%s, reserved=%s, available=%s", bal.OnHand, bal.Reserved, bal.Available)
	}
}

func TestReservationLifecycleReleaseAndFulfill(t *testing.T) {
	mgr := NewManager()
	skuID := uuid.New()
	mgr.SetInitialStock(skuID, decimal.NewFromInt(50))

	// Reserve 20
	res1, err := mgr.Reserve(skuID, uuid.New(), decimal.NewFromInt(20), 5*time.Minute)
	if err != nil {
		t.Fatalf("Reservation failed: %v", err)
	}

	bal, _ := mgr.GetBalance(skuID)
	if !bal.Available.Equal(decimal.NewFromInt(30)) {
		t.Errorf("Expected 30 available, got %s", bal.Available)
	}

	// Release (Cancel)
	if err := mgr.Release(res1.ID); err != nil {
		t.Fatalf("Release failed: %v", err)
	}

	bal, _ = mgr.GetBalance(skuID)
	if !bal.Available.Equal(decimal.NewFromInt(50)) || !bal.Reserved.Equal(decimal.Zero) {
		t.Errorf("Stock was not restored properly after release: %+v", bal)
	}

	// Reserve again and Fulfill (Dispatch)
	res2, _ := mgr.Reserve(skuID, uuid.New(), decimal.NewFromInt(15), 5*time.Minute)
	if err := mgr.Fulfill(res2.ID); err != nil {
		t.Fatalf("Fulfill failed: %v", err)
	}

	bal, _ = mgr.GetBalance(skuID)
	if !bal.OnHand.Equal(decimal.NewFromInt(35)) || !bal.Reserved.Equal(decimal.Zero) || !bal.Available.Equal(decimal.NewFromInt(35)) {
		t.Errorf("Balance mismatch after fulfill: %+v", bal)
	}
}

