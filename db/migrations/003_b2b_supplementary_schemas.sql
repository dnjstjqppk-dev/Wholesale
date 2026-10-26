-- db/migrations/003_b2b_supplementary_schemas.sql
-- WHOLESALE Enterprise B2B Platform Supplementary Extensions
-- Applied to PostgreSQL 17+ Strict Relational Architecture

-- ============================================================================
-- 1. BUYER CORPORATE TAX & EXEMPTION CREDENTIALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS buyer_corporate_tax_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    ein_vat VARCHAR(100) NOT NULL,
    business_registration_number VARCHAR(100) NOT NULL,
    tax_exemption_status VARCHAR(50) NOT NULL DEFAULT 'PENDING'
        CONSTRAINT chk_tax_status CHECK (tax_exemption_status IN ('VERIFIED', 'PENDING', 'NOT_SUBMITTED', 'REJECTED')),
    tax_exemption_cert_url TEXT,
    annual_purchasing_volume VARCHAR(100),
    primary_industry VARCHAR(100),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_buyer_tax_org ON buyer_corporate_tax_credentials(organization_id);
CREATE INDEX IF NOT EXISTS idx_buyer_tax_status ON buyer_corporate_tax_credentials(tax_exemption_status);

-- ============================================================================
-- 2. SUB-ACCOUNT GOVERNANCE & SEGREGATION OF DUTIES (SoD) LIMITS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sub_account_spending_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL
        CONSTRAINT chk_sub_role CHECK (role IN ('BUYER_PURCHASER', 'BUYER_APPROVER', 'BUYER_FINANCE')),
    spending_limit_minor BIGINT NOT NULL DEFAULT 1000000, -- e.g. $10,000.00
    can_approve BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT chk_sub_status CHECK (status IN ('ACTIVE', 'INVITED', 'SUSPENDED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sub_account_user_org UNIQUE (user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_sub_account_org ON sub_account_spending_limits(organization_id);

-- ============================================================================
-- 3. KEYWORD ADVERTISING (KWA) BID ENGINE & PERFORMANCE AUDIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS kwa_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    match_type VARCHAR(20) NOT NULL DEFAULT 'BROAD'
        CONSTRAINT chk_kwa_match CHECK (match_type IN ('EXACT', 'BROAD')),
    max_cpc_minor BIGINT NOT NULL, -- e.g. 150 = $1.50
    daily_budget_minor BIGINT NOT NULL, -- e.g. 5000 = $50.00
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT chk_kwa_status CHECK (status IN ('ACTIVE', 'PAUSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kwa_supplier ON kwa_campaigns(supplier_organization_id);
CREATE INDEX IF NOT EXISTS idx_kwa_keyword_active ON kwa_campaigns(keyword) WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS kwa_click_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES kwa_campaigns(id) ON DELETE CASCADE,
    buyer_ip_hash VARCHAR(64) NOT NULL,
    user_agent TEXT,
    cpc_charge_minor BIGINT NOT NULL,
    converted_order_id UUID REFERENCES trade_orders(id) ON DELETE SET NULL,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kwa_clicks_campaign ON kwa_click_events(campaign_id, clicked_at);

-- ============================================================================
-- 4. SUPPLIER STOREFRONT & MINI-SITE CUSTOMIZATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS supplier_storefront_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    banner_image_url TEXT NOT NULL,
    slogan TEXT,
    year_established INT,
    export_percentage VARCHAR(20),
    total_revenue_usd VARCHAR(50),
    video_tour_url TEXT,
    equipment_manifest JSONB NOT NULL DEFAULT '[]'::JSONB,
    showcase_listing_ids UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_storefront_org ON supplier_storefront_configs(organization_id);

-- ============================================================================
-- 5. EXTENDED EXPORT CONTROLS & STRATEGIC TARIFF RATINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS customs_tariffs_export_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customs_code_id UUID NOT NULL REFERENCES customs_codes(id) ON DELETE CASCADE,
    export_restriction_type VARCHAR(50) NOT NULL DEFAULT 'NONE'
        CONSTRAINT chk_export_restriction CHECK (export_restriction_type IN ('NONE', 'STRATEGIC_GOODS_PERMIT', 'RESTRICTED_CHEMICAL', 'DUAL_USE_SANCTIONED')),
    dual_use_license_required BOOLEAN NOT NULL DEFAULT FALSE,
    regulatory_authority VARCHAR(100) NOT NULL DEFAULT 'Ministry of Trade & Industry',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_export_controls_code ON customs_tariffs_export_controls(customs_code_id);

