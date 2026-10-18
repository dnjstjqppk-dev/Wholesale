-- db/queries/payment.sql
-- Name: CreateLedgerJournal :one
INSERT INTO ledger_journals (journal_number, order_id, event_type, currency, description)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- Name: CreateLedgerEntry :one
INSERT INTO ledger_entries (journal_id, account_id, debit_minor, credit_minor, memo)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- Name: ListJournalEntries :many
SELECT e.id, e.journal_id, e.account_id, a.account_number, a.account_type,
       e.debit_minor, e.credit_minor, e.memo
FROM ledger_entries e
JOIN ledger_accounts a ON a.id = e.account_id
WHERE e.journal_id = $1;

-- Name: CreatePaymentSchedule :one
INSERT INTO payment_schedules (
    order_id, stage, percentage, due_amount_minor, currency, status, due_date
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

