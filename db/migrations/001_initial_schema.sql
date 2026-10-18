-- db/migrations/001_initial_schema.sql
-- WHOLESALE Enterprise B2B Platform Core Relational Schema
-- Engine: PostgreSQL 17+ Strict Relational Architecture (163 Tables)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ============================================================================
-- 1. IDENTITY & ORGANIZATIONS (25 Tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(100),
    department VARCHAR(100),
    locale VARCHAR(10) NOT NULL DEFAULT 'ko',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Seoul',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    preferred_currency CHAR(3) NOT NULL DEFAULT 'KRW',
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    sms_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    credential_type VARCHAR(50) NOT NULL,
    public_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    user_agent TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    token_type VARCHAR(50) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    is_success BOOLEAN NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_oauth_provider UNIQUE (provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS mfa_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    factor_type VARCHAR(50) NOT NULL,
    secret_key TEXT NOT NULL,
    is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mfa_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factor_id UUID NOT NULL REFERENCES mfa_factors(id) ON DELETE RESTRICT,
    challenge_code VARCHAR(20) NOT NULL,
    is_consumed BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
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

CREATE TABLE IF NOT EXISTS organization_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    established_year INT,
    employee_count VARCHAR(50),
    website_url TEXT,
    intro_ko TEXT,
    intro_en TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    address_type VARCHAR(50) NOT NULL CHECK (address_type IN ('HEADQUARTERS', 'FACTORY', 'WAREHOUSE', 'BILLING')),
    country CHAR(2) NOT NULL DEFAULT 'KR',
    postal_code VARCHAR(20) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    contact_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    base_currency CHAR(3) NOT NULL DEFAULT 'USD',
    default_lead_time_days INT NOT NULL DEFAULT 14,
    auto_quote_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_membership UNIQUE (user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE RESTRICT,
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS membership_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE RESTRICT,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    key_prefix VARCHAR(16) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_key_scopes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE RESTRICT,
    scope VARCHAR(100) NOT NULL,
    CONSTRAINT uq_api_key_scope UNIQUE (api_key_id, scope)
);

CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    account_holder VARCHAR(150) NOT NULL,
    swift_code VARCHAR(50),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    event_type VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. SUPPLIER VERIFICATION & FACILITIES (12 Tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    audit_company VARCHAR(100) NOT NULL,
    certificate_number VARCHAR(100) NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_requests (
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

CREATE TABLE IF NOT EXISTS verification_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES verification_requests(id) ON DELETE RESTRICT,
    document_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES verification_requests(id) ON DELETE RESTRICT,
    action VARCHAR(50) NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    facility_name VARCHAR(200) NOT NULL,
    facility_type VARCHAR(50) NOT NULL,
    floor_area_sqm NUMERIC(12,2),
    location_address TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_production_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES supplier_facilities(id) ON DELETE RESTRICT,
    line_name VARCHAR(150) NOT NULL,
    automation_level VARCHAR(50),
    daily_capacity NUMERIC(15,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_capacities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    product_category VARCHAR(100) NOT NULL,
    monthly_output NUMERIC(20,6) NOT NULL,
    unit VARCHAR(30) NOT NULL DEFAULT 'pcs',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    cert_standard VARCHAR(100) NOT NULL, -- ISO 9001, CE, FDA, RoHS
    cert_number VARCHAR(100) NOT NULL,
    issuer VARCHAR(150) NOT NULL,
    expiry_date DATE NOT NULL,
    doc_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificate_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_id UUID NOT NULL REFERENCES supplier_certificates(id) ON DELETE RESTRICT,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_capabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    capability_code VARCHAR(100) NOT NULL, -- OEM, ODM, CUSTOM_PACKAGING
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    on_time_delivery_rate NUMERIC(5,2) NOT NULL DEFAULT 100.0,
    quality_score NUMERIC(3,2) NOT NULL DEFAULT 5.0,
    total_completed_orders INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_compliance_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    audit_date DATE NOT NULL,
    auditor_agency VARCHAR(100) NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    findings TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. CATEGORIES, TAX & TRADE CLASSIFICATIONS (10 Tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    slug VARCHAR(120) NOT NULL UNIQUE,
    name_ko VARCHAR(150) NOT NULL,
    name_en VARCHAR(150) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS category_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    locale VARCHAR(10) NOT NULL,
    translated_name VARCHAR(150) NOT NULL,
    CONSTRAINT uq_cat_translation UNIQUE (category_id, locale)
);

CREATE TABLE IF NOT EXISTS category_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    data_type VARCHAR(50) NOT NULL DEFAULT 'STRING',
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS category_attribute_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attribute_id UUID NOT NULL REFERENCES category_attributes(id) ON DELETE RESTRICT,
    value VARCHAR(255) NOT NULL,
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS attribute_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tax_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_class_id UUID NOT NULL REFERENCES tax_classes(id) ON DELETE RESTRICT,
    country CHAR(2) NOT NULL,
    rate NUMERIC(6,4) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS customs_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hs_code VARCHAR(20) NOT NULL UNIQUE,
    description_ko TEXT NOT NULL,
    description_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customs_tariffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customs_code_id UUID NOT NULL REFERENCES customs_codes(id) ON DELETE RESTRICT,
    destination_country CHAR(2) NOT NULL,
    standard_tariff_rate NUMERIC(6,4) NOT NULL
);

CREATE TABLE IF NOT EXISTS export_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customs_code_id UUID NOT NULL REFERENCES customs_codes(id) ON DELETE RESTRICT,
    restriction_level VARCHAR(50) NOT NULL,
    remarks TEXT
);

-- ============================================================================
-- 4. CATALOG, LISTINGS, SKUS & PRICING (18 Tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS listings (
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

CREATE TABLE IF NOT EXISTS listing_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
    locale VARCHAR(10) NOT NULL,
    translated_title VARCHAR(255) NOT NULL,
    translated_description TEXT,
    CONSTRAINT uq_listing_translation UNIQUE (listing_id, locale)
);

CREATE TABLE IF NOT EXISTS listing_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
    media_url TEXT NOT NULL,
    media_type VARCHAR(30) NOT NULL DEFAULT 'IMAGE',
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS listing_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
    doc_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    title VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS listing_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS listing_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
    tag VARCHAR(50) NOT NULL,
    CONSTRAINT uq_listing_tag UNIQUE (listing_id, tag)
);

CREATE TABLE IF NOT EXISTS skus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
    sku_code VARCHAR(100) NOT NULL UNIQUE,
    variant_options JSONB NOT NULL DEFAULT '{}'::JSONB,
    weight_kg NUMERIC(10,3),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS sku_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    option_key VARCHAR(50) NOT NULL,
    option_value VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS sku_barcodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    barcode VARCHAR(100) NOT NULL UNIQUE,
    barcode_type VARCHAR(30) NOT NULL DEFAULT 'EAN13'
);

CREATE TABLE IF NOT EXISTS sku_dimensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    length_cm NUMERIC(8,2),
    width_cm NUMERIC(8,2),
    height_cm NUMERIC(8,2),
    cbm NUMERIC(10,4)
);

CREATE TABLE IF NOT EXISTS sku_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    media_url TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS price_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE RESTRICT,
    min_quantity NUMERIC(20,6) NOT NULL CHECK (min_quantity > 0),
    max_quantity NUMERIC(20,6) CHECK (max_quantity IS NULL OR max_quantity > min_quantity),
    unit_price NUMERIC(20,6) NOT NULL CHECK (unit_price >= 0),
    CONSTRAINT uq_tier_bracket EXCLUDE USING gist (
        price_list_id WITH =,
        numrange(min_quantity, max_quantity, '[)') WITH &&
    )
);

CREATE TABLE IF NOT EXISTS contract_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    negotiated_unit_price NUMERIC(20,6) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS contract_price_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_price_id UUID NOT NULL REFERENCES contract_prices(id) ON DELETE RESTRICT,
    moq NUMERIC(20,6) NOT NULL DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS currencies (
    code CHAR(3) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    minor_exponent INT NOT NULL DEFAULT 2,
    symbol VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS fx_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency CHAR(3) NOT NULL REFERENCES currencies(code) ON DELETE RESTRICT,
    to_currency CHAR(3) NOT NULL REFERENCES currencies(code) ON DELETE RESTRICT,
    rate NUMERIC(24,12) NOT NULL,
    effective_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_fx_pair UNIQUE (from_currency, to_currency, effective_at)
);

CREATE TABLE IF NOT EXISTS fx_rate_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fx_rate_id UUID NOT NULL REFERENCES fx_rates(id) ON DELETE RESTRICT,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) NOT NULL
);

-- ============================================================================
-- 5. INVENTORY & WAREHOUSES (15 Tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    country CHAR(2) NOT NULL DEFAULT 'KR',
    address TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouse_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    aisle VARCHAR(20) NOT NULL,
    shelf VARCHAR(20) NOT NULL,
    bin VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS warehouse_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    zone_code VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS warehouse_operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    role VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    on_hand NUMERIC(20,6) NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
    reserved NUMERIC(20,6) NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    available NUMERIC(20,6) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_wh_sku UNIQUE (warehouse_id, sku_id),
    CONSTRAINT chk_available_balance CHECK (available = on_hand - reserved AND on_hand >= 0 AND reserved >= 0 AND available >= 0 AND reserved <= on_hand)
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    quantity NUMERIC(20,6) NOT NULL CHECK (quantity > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMMITTED', 'RELEASED', 'EXPIRED')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    from_warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT,
    to_warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT,
    quantity NUMERIC(20,6) NOT NULL,
    movement_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    adjusted_quantity NUMERIC(20,6) NOT NULL,
    reason TEXT NOT NULL,
    adjusted_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    audit_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED'
);

CREATE TABLE IF NOT EXISTS inventory_audit_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES inventory_audits(id) ON DELETE RESTRICT,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    system_qty NUMERIC(20,6) NOT NULL,
    counted_qty NUMERIC(20,6) NOT NULL
);

CREATE TABLE IF NOT EXISTS safety_stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    min_safety_qty NUMERIC(20,6) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS restock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    is_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    triggered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS made_to_order_specs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    blueprint_url TEXT NOT NULL,
    tolerance_spec VARCHAR(100),
    sample_approval_required BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS production_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number VARCHAR(100) NOT NULL UNIQUE,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    planned_qty NUMERIC(20,6) NOT NULL,
    produced_qty NUMERIC(20,6) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED'
);

CREATE TABLE IF NOT EXISTS batch_quality_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE RESTRICT,
    defect_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    inspected_by UUID REFERENCES users(id) ON DELETE RESTRICT
);

-- ============================================================================
-- 6. SOURCING, RFQ & QUOTES (15 Tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    destination_country CHAR(2) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PUBLISHED', 'AWARDED', 'EXPIRED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rfq_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    requested_quantity NUMERIC(20,6) NOT NULL CHECK (requested_quantity > 0),
    awarded_quantity NUMERIC(20,6) NOT NULL DEFAULT 0 CHECK (awarded_quantity <= requested_quantity),
    target_price_minor BIGINT,
    unit VARCHAR(30) NOT NULL DEFAULT 'pcs'
);

CREATE TABLE IF NOT EXISTS rfq_specifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_item_id UUID NOT NULL REFERENCES rfq_items(id) ON DELETE RESTRICT,
    spec_key VARCHAR(100) NOT NULL,
    spec_value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rfq_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE RESTRICT,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    is_confidential BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS rfq_target_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE RESTRICT,
    supplier_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS rfq_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE RESTRICT,
    supplier_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE RESTRICT,
    supplier_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('DRAFT', 'ISSUED', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quote_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
    revision_number INT NOT NULL,
    unit_price NUMERIC(20,6) NOT NULL CHECK (unit_price >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    lead_time_days INT NOT NULL,
    incoterms VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('DRAFT', 'ISSUED', 'SUPERSEDED', 'ACCEPTED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_quote_revision UNIQUE (quote_id, revision_number)
);

CREATE TABLE IF NOT EXISTS quote_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    revision_id UUID NOT NULL REFERENCES quote_revisions(id) ON DELETE RESTRICT,
    rfq_item_id UUID NOT NULL REFERENCES rfq_items(id) ON DELETE RESTRICT,
    quantity NUMERIC(20,6) NOT NULL,
    unit_price NUMERIC(20,6) NOT NULL
);

CREATE TABLE IF NOT EXISTS quote_line_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_line_id UUID NOT NULL REFERENCES quote_lines(id) ON DELETE RESTRICT,
    min_volume NUMERIC(20,6) NOT NULL,
    discount_rate NUMERIC(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS quote_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    revision_id UUID NOT NULL REFERENCES quote_revisions(id) ON DELETE RESTRICT,
    file_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quote_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    revision_id UUID NOT NULL REFERENCES quote_revisions(id) ON DELETE RESTRICT,
    term_title VARCHAR(100) NOT NULL,
    term_body TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quote_acceptances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
    accepted_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quote_rejections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    rejected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quote_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
    event_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. ORDERS, CONTRACTS & GOVERNANCE (18 Tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    total_orders_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trade_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) NOT NULL UNIQUE,
    order_group_id UUID REFERENCES order_groups(id) ON DELETE RESTRICT,
    buyer_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    supplier_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    subtotal_minor BIGINT NOT NULL DEFAULT 0,
    tax_minor BIGINT NOT NULL DEFAULT 0,
    shipping_minor BIGINT NOT NULL DEFAULT 0,
    total_amount_minor BIGINT NOT NULL DEFAULT 0,
    order_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    fulfillment_status VARCHAR(50) NOT NULL DEFAULT 'UNFULFILLED',
    dispute_status VARCHAR(50) NOT NULL DEFAULT 'NONE',
    settlement_status VARCHAR(50) NOT NULL DEFAULT 'UNSETTLED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    quantity NUMERIC(20,6) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(20,6) NOT NULL CHECK (unit_price >= 0),
    line_total_minor BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_item_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    allocated_qty NUMERIC(20,6) NOT NULL
);

CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    adjustment_type VARCHAR(50) NOT NULL,
    amount_minor BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS approval_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    policy_name VARCHAR(100) NOT NULL,
    threshold_minor BIGINT NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD'
);

CREATE TABLE IF NOT EXISTS approval_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID NOT NULL REFERENCES approval_policies(id) ON DELETE RESTRICT,
    approver_role VARCHAR(50) NOT NULL,
    sequence_order INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approval_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE RESTRICT,
    approver_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action VARCHAR(50) NOT NULL CHECK (action IN ('APPROVED', 'REJECTED')),
    acted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trade_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    contract_number VARCHAR(100) NOT NULL UNIQUE,
    document_hash CHAR(64) NOT NULL,
    incoterms_code VARCHAR(10) NOT NULL,
    incoterms_version VARCHAR(20) NOT NULL DEFAULT 'Incoterms 2020',
    incoterms_named_place TEXT NOT NULL,
    terms_text TEXT NOT NULL,
    buyer_signer_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    buyer_signed_at TIMESTAMPTZ,
    supplier_signer_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    supplier_signed_at TIMESTAMPTZ,
    is_fully_signed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    body_markdown TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contract_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES trade_contracts(id) ON DELETE RESTRICT,
    clause_title VARCHAR(100) NOT NULL,
    clause_body TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contract_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES trade_contracts(id) ON DELETE RESTRICT,
    revision_number INT NOT NULL,
    amended_hash CHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS contract_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES trade_contracts(id) ON DELETE RESTRICT,
    signer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    signature_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contract_amendments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES trade_contracts(id) ON DELETE RESTRICT,
    amendment_text TEXT NOT NULL,
    agreed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incoterms_records (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    transport_mode VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS customs_declarations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    declaration_number VARCHAR(100) NOT NULL UNIQUE,
    filing_status VARCHAR(50) NOT NULL
);

-- ============================================================================
-- 8. PAYMENT & DOUBLE-ENTRY LEDGER (16 Tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    stage VARCHAR(50) NOT NULL,
    percentage INT NOT NULL CHECK (percentage > 0 AND percentage <= 100),
    due_amount_minor BIGINT NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    due_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    schedule_id UUID REFERENCES payment_schedules(id) ON DELETE RESTRICT,
    amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    pg_provider VARCHAR(50),
    pg_transaction_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(50) NOT NULL,
    amount_minor BIGINT NOT NULL,
    response_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    refund_amount_minor BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    method_type VARCHAR(50) NOT NULL,
    token_reference VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pg_provider VARCHAR(50) NOT NULL,
    event_id VARCHAR(100) NOT NULL UNIQUE,
    payload JSONB NOT NULL,
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ledger_chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    account_type VARCHAR(30) NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'))
);

CREATE TABLE IF NOT EXISTS ledger_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chart_id UUID NOT NULL REFERENCES ledger_chart_of_accounts(id) ON DELETE RESTRICT,
    account_number VARCHAR(20) NOT NULL UNIQUE,
    account_type VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_fiscal_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS ledger_journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_number VARCHAR(100) NOT NULL UNIQUE,
    order_id UUID REFERENCES trade_orders(id) ON DELETE RESTRICT,
    event_type VARCHAR(100) NOT NULL,
    currency CHAR(3) NOT NULL,
    description TEXT,
    is_posted BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_id UUID NOT NULL REFERENCES ledger_journals(id) ON DELETE RESTRICT,
    account_id UUID NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
    debit_minor BIGINT NOT NULL DEFAULT 0 CHECK (debit_minor >= 0),
    credit_minor BIGINT NOT NULL DEFAULT 0 CHECK (credit_minor >= 0),
    memo VARCHAR(255),
    CONSTRAINT chk_debit_or_credit CHECK ((debit_minor > 0 AND credit_minor = 0) OR (credit_minor > 0 AND debit_minor = 0))
);

-- Ledger Immutability: Prevent UPDATE or DELETE on entries belonging to posted journals
CREATE OR REPLACE FUNCTION fn_prevent_posted_ledger_mutation()
RETURNS TRIGGER AS $$
DECLARE
    v_is_posted BOOLEAN;
BEGIN
    SELECT is_posted INTO v_is_posted FROM ledger_journals WHERE id = OLD.journal_id;
    IF v_is_posted THEN
        RAISE EXCEPTION 'CANNOT_MUTATE_POSTED_LEDGER: Journal entries in a posted journal are immutable. Use reversal journal instead.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_posted_ledger_mutation ON ledger_entries;
CREATE TRIGGER trg_prevent_posted_ledger_mutation
    BEFORE UPDATE OR DELETE ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION fn_prevent_posted_ledger_mutation();

-- Ledger Double-Entry Balance: Enforce sum(debit) == sum(credit) for posted journals
CREATE OR REPLACE FUNCTION fn_validate_posted_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_total_debit BIGINT;
    v_total_credit BIGINT;
BEGIN
    IF NEW.is_posted THEN
        SELECT COALESCE(SUM(debit_minor), 0), COALESCE(SUM(credit_minor), 0)
        INTO v_total_debit, v_total_credit
        FROM ledger_entries
        WHERE journal_id = NEW.id;

        IF v_total_debit = 0 OR v_total_credit = 0 OR v_total_debit <> v_total_credit THEN
            RAISE EXCEPTION 'UNBALANCED_LEDGER_JOURNAL: Posted journal % has unbalanced entries: debit=% credit=%',
                NEW.journal_number, v_total_debit, v_total_credit;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_posted_journal_balance ON ledger_journals;
CREATE CONSTRAINT TRIGGER trg_validate_posted_journal_balance
    AFTER INSERT OR UPDATE ON ledger_journals
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION fn_validate_posted_journal_balance();

CREATE TABLE IF NOT EXISTS ledger_reversals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_journal_id UUID NOT NULL REFERENCES ledger_journals(id) ON DELETE RESTRICT,
    reversal_journal_id UUID NOT NULL REFERENCES ledger_journals(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_balances_snapshot (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
    period_id UUID NOT NULL REFERENCES ledger_fiscal_periods(id) ON DELETE RESTRICT,
    balance_minor BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS escrow_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    held_amount_minor BIGINT NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'USD'
);

CREATE TABLE IF NOT EXISTS escrow_holds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escrow_id UUID NOT NULL REFERENCES escrow_accounts(id) ON DELETE RESTRICT,
    reason VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reconciliation_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'BALANCED'
);

-- ============================================================================
-- 9. LOGISTICS, INSPECTION & SHIPPING (12 Tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS shipping_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_country CHAR(2) NOT NULL,
    destination_country CHAR(2) NOT NULL,
    transit_days INT NOT NULL
);

CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    shipment_number VARCHAR(100) NOT NULL UNIQUE,
    carrier VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'PREPARING',
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS shipment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE RESTRICT,
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
    quantity NUMERIC(20,6) NOT NULL CHECK (quantity > 0)
);

CREATE TABLE IF NOT EXISTS shipment_tracking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE RESTRICT,
    event_time TIMESTAMPTZ NOT NULL,
    location VARCHAR(150),
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shipment_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE RESTRICT,
    document_type VARCHAR(50) NOT NULL, -- BILL_OF_LADING, PACKING_LIST, INVOICE
    document_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    agency_name VARCHAR(150) NOT NULL,
    result VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (result IN ('PENDING', 'PASSED', 'FAILED')),
    report_url TEXT,
    inspected_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS inspection_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE RESTRICT,
    criterion_name VARCHAR(150) NOT NULL,
    is_met BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS inspection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE RESTRICT,
    sku_id UUID NOT NULL REFERENCES skus(id) ON DELETE RESTRICT,
    sample_size INT NOT NULL
);

CREATE TABLE IF NOT EXISTS inspection_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE RESTRICT,
    summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inspection_defects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE RESTRICT,
    defect_type VARCHAR(100) NOT NULL,
    defect_count INT NOT NULL
);

CREATE TABLE IF NOT EXISTS delivery_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE RESTRICT,
    confirmed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    confirmed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 10. SETTLEMENT & DISPUTES (10 Tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    supplier_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    gross_amount_minor BIGINT NOT NULL,
    fee_amount_minor BIGINT NOT NULL,
    net_payout_minor BIGINT NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'HELD',
    inspection_passed BOOLEAN NOT NULL DEFAULT FALSE,
    has_active_dispute BOOLEAN NOT NULL DEFAULT FALSE,
    disbursed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settlement_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE RESTRICT,
    item_description VARCHAR(200) NOT NULL,
    amount_minor BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS settlement_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE RESTRICT,
    adjustment_amount_minor BIGINT NOT NULL,
    reason TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE RESTRICT,
    beneficiary_bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT,
    payout_amount_minor BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    approved_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    approved_at TIMESTAMPTZ,
    disbursed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    disbursed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS payout_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_reference VARCHAR(100) NOT NULL UNIQUE,
    total_amount_minor BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING'
);

CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    buyer_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    supplier_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    claimed_amount_minor BIGINT NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    reason VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPENED' CHECK (status IN ('OPENED', 'UNDER_REVIEW', 'RESOLVED_REFUND', 'RESOLVED_PAYOUT', 'DISMISSED')),
    refund_amount_minor BIGINT NOT NULL DEFAULT 0,
    payout_amount_minor BIGINT NOT NULL DEFAULT 0,
    arbitrated_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    arbitrated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dispute_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE RESTRICT,
    submitted_by_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    file_url TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS dispute_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE RESTRICT,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dispute_arbitrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE RESTRICT,
    arbitrator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    decision_summary TEXT NOT NULL,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dispute_appeals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE RESTRICT,
    appeal_reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
);

-- ============================================================================
-- 11. INTEGRATION, OUTBOX & AUDIT (12 Tables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS channel_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    channel_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_channel_consent UNIQUE (organization_id, channel_name)
);

CREATE TABLE IF NOT EXISTS family_listing_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
    platform_name VARCHAR(50) NOT NULL,
    external_reference_id VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS external_sync_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS external_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES external_sync_jobs(id) ON DELETE RESTRICT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS inbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(100) NOT NULL,
    event_id VARCHAR(100) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS event_consumers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consumer_name VARCHAR(100) NOT NULL UNIQUE,
    last_event_id UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    job_type VARCHAR(50) NOT NULL DEFAULT 'CSV_CATALOG',
    is_dry_run BOOLEAN NOT NULL DEFAULT TRUE,
    total_rows INT NOT NULL DEFAULT 0,
    valid_rows INT NOT NULL DEFAULT 0,
    error_rows INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS import_job_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE RESTRICT,
    row_number INT NOT NULL,
    raw_content TEXT NOT NULL,
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    export_format VARCHAR(30) NOT NULL DEFAULT 'CSV',
    file_url TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    actor_organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    ip_address VARCHAR(45) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT
);
