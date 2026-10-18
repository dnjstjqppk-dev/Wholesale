-- 001_initial_schema.sql
-- WHOLESALE Enterprise B2B E-Commerce Platform Core Schema
-- PostgreSQL 17+ Strict Relational Architecture

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================================
-- 1. IDENTITY & ORGANIZATIONS
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    business_number VARCHAR(100) NOT NULL UNIQUE,
    tax_id VARCHAR(100),
    country CHAR(2) NOT NULL DEFAULT 'KR',
    business_type VARCHAR(50) NOT NULL CHECK (business_type IN ('MANUFACTURER', 'TRADING_COMPANY', 'OEM_ODM', 'BUYER_CORP')),
    capabilities TEXT[] NOT NULL DEFAULT ARRAY['BUYER']::TEXT[],
    is_verified_supplier BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ORG_OWNER', 'BUYER_PURCHASER', 'BUYER_APPROVER', 'BUYER_FINANCE', 'SUPPLIER_SALES', 'SUPPLIER_FULFILLMENT', 'SUPPLIER_FINANCE', 'VIEWER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_membership UNIQUE (user_id, organization_id)
);

CREATE TABLE verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    business_license_url TEXT NOT NULL,
    factory_audit_report_url TEXT,
    representative_name VARCHAR(120) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. CATALOG & PRICING
-- ============================================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    slug VARCHAR(120) NOT NULL UNIQUE,
    name_ko VARCHAR(150) NOT NULL,
    name_en VARCHAR(150) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    description TEXT,
    moq NUMERIC(20,6) NOT NULL CHECK (moq > 0),
    quantity_step NUMERIC(20,6) NOT NULL DEFAULT 1.0 CHECK (quantity_step > 0),
    unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
    lead_time_days INT NOT NULL DEFAULT 14 CHECK (lead_time_days >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'ARCHIVED')),
    has_sample BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE skus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
    sku_code VARCHAR(100) NOT NULL UNIQUE,
    variant_options JSONB NOT NULL DEFAULT '{}'::JSONB,
    weight_kg NUMERIC(10,3),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE price_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE price_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE RESTRICT,
    min_quantity NUMERIC(20,6) NOT NULL CHECK (min_quantity > 0),
    max_quantity NUMERIC(20,6), -- NULL means infinity
    unit_price NUMERIC(20,6) NOT NULL CHECK (unit_price >= 0),
    CONSTRAINT ck_tier_range CHECK (max_quantity IS NULL OR max_quantity > min_quantity)
);

-- ============================================================================
-- 3. INVENTORY MANAGEMENT
-- ============================================================================

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    country CHAR(2) NOT NULL,
    address TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE inventory_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    on_hand NUMERIC(20,6) NOT NULL DEFAULT 0.0 CHECK (on_hand >= 0),
    reserved NUMERIC(20,6) NOT NULL DEFAULT 0.0 CHECK (reserved >= 0),
    available NUMERIC(20,6) GENERATED ALWAYS AS (on_hand - reserved) STORED,
    CONSTRAINT uq_wh_sku UNIQUE (warehouse_id, sku_id),
    CONSTRAINT ck_available_non_negative CHECK (on_hand >= reserved)
);

CREATE TABLE inventory_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    order_id UUID,
    quantity NUMERIC(20,6) NOT NULL CHECK (quantity > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FULFILLED', 'EXPIRED', 'CANCELLED')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. SOURCING, RFQ & QUOTES
-- ============================================================================

CREATE TABLE rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    destination_country CHAR(2) NOT NULL,
    desired_lead_time_days INT,
    status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PUBLISHED', 'PARTIALLY_AWARDED', 'FULLY_AWARDED', 'EXPIRED', 'CANCELLED')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rfq_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    specifications TEXT,
    quantity NUMERIC(20,6) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
    target_price_minor BIGINT
);

CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE RESTRICT,
    supplier_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('DRAFT', 'ISSUED', 'SUPERSEDED', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
    incoterms VARCHAR(50) NOT NULL,
    lead_time_days INT NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quote_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
    revision_number INT NOT NULL DEFAULT 1,
    total_amount_minor BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    terms_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_quote_rev UNIQUE (quote_id, revision_number)
);

CREATE TABLE quote_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_revision_id UUID NOT NULL REFERENCES quote_revisions(id) ON DELETE RESTRICT,
    rfq_item_id UUID NOT NULL REFERENCES rfq_items(id) ON DELETE RESTRICT,
    unit_price NUMERIC(20,6) NOT NULL CHECK (unit_price >= 0),
    quantity NUMERIC(20,6) NOT NULL CHECK (quantity > 0),
    line_total_minor BIGINT NOT NULL
);

-- ============================================================================
-- 5. TRADING, CONTRACTS & ORDERS
-- ============================================================================

CREATE TABLE order_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trade_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_group_id UUID NOT NULL REFERENCES order_groups(id) ON DELETE RESTRICT,
    order_number VARCHAR(64) NOT NULL UNIQUE,
    buyer_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    supplier_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    quote_id UUID REFERENCES quotes(id) ON DELETE RESTRICT,
    total_amount_minor BIGINT NOT NULL CHECK (total_amount_minor >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    order_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (order_status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'CONTRACT_PENDING', 'CONTRACT_SIGNED', 'PAYMENT_PENDING', 'IN_PRODUCTION', 'INSPECTION_PENDING', 'SHIPPED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DISPUTED')),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PARTIAL_PAID', 'PAID', 'REFUNDED')),
    incoterms VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    sku_id UUID REFERENCES skus(id) ON DELETE RESTRICT,
    item_description TEXT NOT NULL,
    quantity NUMERIC(20,6) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(20,6) NOT NULL CHECK (unit_price >= 0),
    subtotal_minor BIGINT NOT NULL,
    shipped_quantity NUMERIC(20,6) NOT NULL DEFAULT 0.0 CHECK (shipped_quantity >= 0)
);

CREATE TABLE trade_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    contract_number VARCHAR(100) NOT NULL UNIQUE,
    document_hash VARCHAR(64) NOT NULL, -- SHA-256
    contract_body_json JSONB NOT NULL,
    is_fully_signed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contract_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES trade_contracts(id) ON DELETE RESTRICT,
    signer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    signer_role VARCHAR(50) NOT NULL,
    signature_hash VARCHAR(64) NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_contract_signer UNIQUE (contract_id, signer_user_id)
);

-- ============================================================================
-- 6. PAYMENTS & DOUBLE-ENTRY LEDGER
-- ============================================================================

CREATE TABLE payment_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('DOWN_PAYMENT', 'MILESTONE', 'BALANCE')),
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency CHAR(3) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED')),
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_schedule_id UUID NOT NULL REFERENCES payment_schedules(id) ON DELETE RESTRICT,
    merchant_order_id VARCHAR(100) NOT NULL UNIQUE,
    amount_minor BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    pg_provider VARCHAR(50) NOT NULL,
    pg_transaction_id VARCHAR(120) NOT NULL UNIQUE,
    raw_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Double-Entry Ledger (복식부기 원장)
CREATE TABLE ledger_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'))
);

CREATE TABLE ledger_journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_id UUID NOT NULL, -- order_id or payment_id
    reference_type VARCHAR(50) NOT NULL,
    currency CHAR(3) NOT NULL,
    posted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_id UUID NOT NULL REFERENCES ledger_journals(id) ON DELETE RESTRICT,
    account_id UUID NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
    debit_minor BIGINT NOT NULL DEFAULT 0 CHECK (debit_minor >= 0),
    credit_minor BIGINT NOT NULL DEFAULT 0 CHECK (credit_minor >= 0),
    CONSTRAINT ck_debit_or_credit CHECK (debit_minor > 0 OR credit_minor > 0)
);

-- ============================================================================
-- 7. LOGISTICS, INSPECTION & SETTLEMENT
-- ============================================================================

CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    carrier VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(120) NOT NULL,
    shipped_date TIMESTAMPTZ,
    delivery_date TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'PACKED', 'CUSTOMS_CLEARED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shipment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE RESTRICT,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
    shipped_quantity NUMERIC(20,6) NOT NULL CHECK (shipped_quantity > 0)
);

CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    inspector_organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    inspection_type VARCHAR(50) NOT NULL CHECK (inspection_type IN ('PRE_PRODUCTION', 'DURING_PRODUCTION', 'PRE_SHIPMENT')),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PASSED', 'FAILED')),
    report_url TEXT,
    inspected_at TIMESTAMPTZ
);

CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    trade_order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    gross_amount_minor BIGINT NOT NULL,
    platform_fee_minor BIGINT NOT NULL,
    net_payout_minor BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'HELD' CHECK (status IN ('HELD', 'RELEASE_ELIGIBLE', 'SCHEDULED', 'PROCESSING', 'PAID_OUT')),
    release_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    raised_by_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    claimed_amount_minor BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPENED' CHECK (status IN ('OPENED', 'EVIDENCE_COLLECTING', 'UNDER_MEDIATION', 'RESOLVED_REFUND', 'RESOLVED_REJECTED', 'CLOSED')),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. OUTBOX & AUDIT
-- ============================================================================

CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id UUID NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID,
    payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
