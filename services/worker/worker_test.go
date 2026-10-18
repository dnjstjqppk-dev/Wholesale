package main

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestWorkerOutboxAndReconciliation(t *testing.T) {
	w := NewWorker()

	// Enqueue 2 outbox events
	w.OutboxQueue = append(w.OutboxQueue, &OutboxEvent{
		ID:            uuid.New(),
		AggregateType: "TRADE_ORDER",
		AggregateID:   uuid.New(),
		EventType:     "ORDER_PLACED",
		PayloadJSON:   `{"order_id":"123"}`,
		CreatedAt:     time.Now(),
	}, &OutboxEvent{
		ID:            uuid.New(),
		AggregateType: "INVENTORY",
		AggregateID:   uuid.New(),
		EventType:     "RESERVATION_CREATED",
		PayloadJSON:   `{"sku_id":"456"}`,
		CreatedAt:     time.Now(),
	})

	ctx := context.Background()
	processed, err := w.ProcessOutbox(ctx)
	if err != nil {
		t.Fatalf("ProcessOutbox failed: %v", err)
	}
	if processed != 2 {
		t.Errorf("Expected 2 processed events, got %d", processed)
	}

	// Subsequent sweep: 0 should be processed as they are already marked processed
	processedSecond, _ := w.ProcessOutbox(ctx)
	if processedSecond != 0 {
		t.Errorf("Expected 0 processed on second sweep, got %d", processedSecond)
	}

	// Reconcile and expiry
	expired := w.ExpireReservations(time.Now())
	if expired <= 0 {
		t.Errorf("Expected positive expired count, got %d", expired)
	}

	reconciled := w.ReconcilePGTransactions()
	if reconciled <= 0 {
		t.Errorf("Expected positive reconciled count, got %d", reconciled)
	}
}
