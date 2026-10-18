package inventory

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

var (
	ErrInsufficientInventory = errors.New("insufficient available inventory to reserve")
	ErrReservationNotFound   = errors.New("reservation not found")
	ErrReservationExpired    = errors.New("reservation has expired or was already fulfilled")
)

type ReservationStatus string

const (
	StatusActive    ReservationStatus = "ACTIVE"
	StatusFulfilled ReservationStatus = "FULFILLED"
	StatusCancelled ReservationStatus = "CANCELLED"
	StatusExpired   ReservationStatus = "EXPIRED"
)

type Balance struct {
	SKUID     uuid.UUID
	OnHand    decimal.Decimal
	Reserved  decimal.Decimal
	Available decimal.Decimal
}

type Reservation struct {
	ID        uuid.UUID
	SKUID     uuid.UUID
	OrderID   uuid.UUID
	Quantity  decimal.Decimal
	Status    ReservationStatus
	ExpiresAt time.Time
}

// Manager manages atomic stock reservation and concurrency safeguards.
type Manager struct {
	mu           sync.Mutex
	balances     map[uuid.UUID]*Balance
	reservations map[uuid.UUID]*Reservation
}

func NewManager() *Manager {
	return &Manager{
		balances:     make(map[uuid.UUID]*Balance),
		reservations: make(map[uuid.UUID]*Reservation),
	}
}

func (m *Manager) SetInitialStock(skuID uuid.UUID, onHand decimal.Decimal) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.balances[skuID] = &Balance{
		SKUID:     skuID,
		OnHand:    onHand,
		Reserved:  decimal.Zero,
		Available: onHand,
	}
}

func (m *Manager) GetBalance(skuID uuid.UUID) (Balance, bool) {
	m.mu.Lock()
	defer m.mu.Unlock()

	b, ok := m.balances[skuID]
	if !ok {
		return Balance{}, false
	}
	return *b, true
}

// Reserve atomically checks available inventory and holds reservation.
func (m *Manager) Reserve(skuID uuid.UUID, orderID uuid.UUID, quantity decimal.Decimal, ttl time.Duration) (*Reservation, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	bal, ok := m.balances[skuID]
	if !ok {
		return nil, fmt.Errorf("SKU %s not initialized in inventory", skuID)
	}

	if quantity.GreaterThan(bal.Available) {
		return nil, fmt.Errorf("%w: requested=%s, available=%s", ErrInsufficientInventory, quantity.String(), bal.Available.String())
	}

	// Apply reservation
	bal.Reserved = bal.Reserved.Add(quantity)
	bal.Available = bal.OnHand.Sub(bal.Reserved)

	res := &Reservation{
		ID:        uuid.New(),
		SKUID:     skuID,
		OrderID:   orderID,
		Quantity:  quantity,
		Status:    StatusActive,
		ExpiresAt: time.Now().UTC().Add(ttl),
	}

	m.reservations[res.ID] = res
	return res, nil
}

// Release cancels an active reservation and restores available stock.
func (m *Manager) Release(reservationID uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	res, ok := m.reservations[reservationID]
	if !ok {
		return ErrReservationNotFound
	}
	if res.Status != StatusActive {
		return ErrReservationExpired
	}

	bal, ok := m.balances[res.SKUID]
	if !ok {
		return errors.New("balance not found")
	}

	bal.Reserved = bal.Reserved.Sub(res.Quantity)
	bal.Available = bal.OnHand.Sub(bal.Reserved)
	res.Status = StatusCancelled

	return nil
}

// Fulfill transitions reservation to actual deduction on dispatch.
func (m *Manager) Fulfill(reservationID uuid.UUID) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	res, ok := m.reservations[reservationID]
	if !ok {
		return ErrReservationNotFound
	}
	if res.Status != StatusActive {
		return ErrReservationExpired
	}

	bal, ok := m.balances[res.SKUID]
	if !ok {
		return errors.New("balance not found")
	}

	bal.OnHand = bal.OnHand.Sub(res.Quantity)
	bal.Reserved = bal.Reserved.Sub(res.Quantity)
	bal.Available = bal.OnHand.Sub(bal.Reserved)
	res.Status = StatusFulfilled

	return nil
}

