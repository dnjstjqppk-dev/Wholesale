package payment

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

var (
	ErrUnbalancedJournal = errors.New("journal debit sum does not match credit sum")
	ErrEmptyJournal      = errors.New("journal must have at least one debit and one credit entry")
	ErrNegativeAmount    = errors.New("entry debit and credit must be non-negative")
	ErrZeroEntry         = errors.New("entry cannot have both zero debit and zero credit")
	ErrDualEntry         = errors.New("entry cannot have both debit and credit non-zero")
	ErrJournalImmutable  = errors.New("posted journals cannot be modified or deleted")
)

type AccountType string

const (
	AccountAsset     AccountType = "ASSET"
	AccountLiability AccountType = "LIABILITY"
	AccountEquity    AccountType = "EQUITY"
	AccountRevenue   AccountType = "REVENUE"
	AccountExpense   AccountType = "EXPENSE"
)

type Account struct {
	ID   uuid.UUID
	Code string
	Name string
	Type AccountType
}

type Entry struct {
	AccountID   uuid.UUID
	DebitMinor  int64
	CreditMinor int64
	Memo        string
}

type Journal struct {
	ID            uuid.UUID
	ReferenceID   uuid.UUID
	ReferenceType string
	Currency      string
	PostedAt      time.Time
	Entries       []Entry
}

// CreateJournal validates double-entry rules and generates an immutable Journal.
func CreateJournal(referenceID uuid.UUID, referenceType string, currency string, entries []Entry) (*Journal, error) {
	if len(entries) < 2 {
		return nil, ErrEmptyJournal
	}

	var totalDebit int64
	var totalCredit int64

	for _, e := range entries {
		if e.DebitMinor < 0 || e.CreditMinor < 0 {
			return nil, ErrNegativeAmount
		}
		if e.DebitMinor == 0 && e.CreditMinor == 0 {
			return nil, ErrZeroEntry
		}
		if e.DebitMinor > 0 && e.CreditMinor > 0 {
			return nil, ErrDualEntry
		}
		totalDebit += e.DebitMinor
		totalCredit += e.CreditMinor
	}

	if totalDebit != totalCredit {
		return nil, fmt.Errorf("%w: debit=%d, credit=%d", ErrUnbalancedJournal, totalDebit, totalCredit)
	}

	return &Journal{
		ID:            uuid.New(),
		ReferenceID:   referenceID,
		ReferenceType: referenceType,
		Currency:      currency,
		PostedAt:      time.Now().UTC(),
		Entries:       entries,
	}, nil
}

// CreateReversal creates an opposite journal (debits become credits, credits become debits) to correct errors.
func CreateReversal(original *Journal, reason string) (*Journal, error) {
	if original == nil {
		return nil, errors.New("cannot reverse nil journal")
	}

	reversedEntries := make([]Entry, len(original.Entries))
	for i, e := range original.Entries {
		reversedEntries[i] = Entry{
			AccountID:   e.AccountID,
			DebitMinor:  e.CreditMinor,
			CreditMinor: e.DebitMinor,
			Memo:        fmt.Sprintf("REVERSAL [%s]: %s", reason, e.Memo),
		}
	}

	return CreateJournal(original.ID, "JOURNAL_REVERSAL", original.Currency, reversedEntries)
}

