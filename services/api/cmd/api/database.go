package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

// DBManager manages the PostgreSQL live database connection and tenant RLS isolation.
type DBManager struct {
	db *sql.DB
}

// NewDBManager initializes database connection if DATABASE_URL is provided in environment.
func NewDBManager() *DBManager {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Println("[WHOLESALE DB] DATABASE_URL not set. Running in resilient in-memory domain engine mode.")
		return &DBManager{db: nil}
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Printf("[WHOLESALE DB] Failed to open PostgreSQL connection: %v. Fallback to in-memory mode.", err)
		return &DBManager{db: nil}
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Printf("[WHOLESALE DB] PostgreSQL ping failed: %v. Fallback to in-memory mode.", err)
		return &DBManager{db: nil}
	}

	log.Println("[WHOLESALE DB] Successfully connected to PostgreSQL 17+ with multi-tenant RLS active.")
	return &DBManager{db: db}
}

// IsConnected returns whether live PostgreSQL connection is active.
func (m *DBManager) IsConnected() bool {
	return m.db != nil
}

// ExecuteWithTenant executes a callback within a transaction where the tenant context is set for RLS.
func (m *DBManager) ExecuteWithTenant(ctx context.Context, tenantID uuid.UUID, fn func(tx *sql.Tx) error) error {
	if m.db == nil {
		return fmt.Errorf("database not connected")
	}

	tx, err := m.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelReadCommitted})
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Enforce 002_tenant_security.sql RLS session parameter
	_, err = tx.ExecContext(ctx, "SELECT set_config('app.current_tenant_id', $1, true)", tenantID.String())
	if err != nil {
		return fmt.Errorf("failed to set RLS tenant context: %w", err)
	}

	if err := fn(tx); err != nil {
		return err
	}

	return tx.Commit()
}

// Close gracefully closes the live database pool.
func (m *DBManager) Close() error {
	if m.db != nil {
		return m.db.Close()
	}
	return nil
}
