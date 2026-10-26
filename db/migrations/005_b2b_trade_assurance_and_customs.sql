-- db/migrations/005_b2b_trade_assurance_and_customs.sql
-- WHOLESALE Enterprise B2B Platform Supplementary Extensions (Part 2)
-- Applied to PostgreSQL 17+ Strict Relational Architecture

-- ============================================================================
-- 1. TRADE ASSURANCE CLAIMS & COMPENSATION ADJUDICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS trade_assurance_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE CASCADE,
    buyer_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    supplier_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    claim_amount_minor BIGINT NOT NULL,
    guarantee_coverage_minor BIGINT NOT NULL,
    claim_category VARCHAR(50) NOT NULL
        CONSTRAINT chk_claim_category CHECK (claim_category IN ('QUALITY_DISPUTE', 'DELIVERY_DEFAULT', 'SPEC_MISMATCH', 'DAMAGE_IN_TRANSIT')),
    arbitration_status VARCHAR(50) NOT NULL DEFAULT 'FILED'
        CONSTRAINT chk_claim_status CHECK (arbitration_status IN ('FILED', 'UNDER_REVIEW', 'PAYOUT_APPROVED', 'CLAIM_REJECTED')),
    adjudicated_payout_minor BIGINT DEFAULT 0,
    payout_ledger_tx_id UUID,
    adjudicated_by UUID REFERENCES users(id),
    adjudicated_at TIMESTAMPTZ,
    evidence_urls JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ta_claims_order ON trade_assurance_claims(order_id);
CREATE INDEX IF NOT EXISTS idx_ta_claims_buyer ON trade_assurance_claims(buyer_organization_id);
CREATE INDEX IF NOT EXISTS idx_ta_claims_supplier ON trade_assurance_claims(supplier_organization_id);
CREATE INDEX IF NOT EXISTS idx_ta_claims_status ON trade_assurance_claims(arbitration_status);

-- ============================================================================
-- 2. CUSTOMS DECLARATION & IMPORT/EXPORT CLEARANCE MANIFESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS customs_declaration_manifests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES order_shipments(id) ON DELETE SET NULL,
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    declaration_number VARCHAR(100) NOT NULL UNIQUE,
    port_of_loading VARCHAR(100) NOT NULL,
    port_of_discharge VARCHAR(100) NOT NULL,
    hs_code VARCHAR(20) NOT NULL,
    customs_status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED'
        CONSTRAINT chk_customs_status CHECK (customs_status IN ('SUBMITTED', 'INSPECTION_HOLD', 'CLEARED', 'REJECTED')),
    duty_tax_amount_minor BIGINT NOT NULL DEFAULT 0,
    customs_broker_name VARCHAR(100),
    export_license_number VARCHAR(100),
    declaration_doc_url TEXT,
    cleared_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customs_order ON customs_declaration_manifests(order_id);
CREATE INDEX IF NOT EXISTS idx_customs_org ON customs_declaration_manifests(organization_id);
CREATE INDEX IF NOT EXISTS idx_customs_status ON customs_declaration_manifests(customs_status);

-- ============================================================================
-- 3. FACTORY QUALITY AUDITS & CERTIFIED LAB PERFORMANCE REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS factory_quality_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    auditor_agency VARCHAR(50) NOT NULL
        CONSTRAINT chk_audit_agency CHECK (auditor_agency IN ('SGS', 'TUV_RHEINLAND', 'INTERTEK', 'BUREAU_VERITAS')),
    audit_standard VARCHAR(50) NOT NULL
        CONSTRAINT chk_audit_std CHECK (audit_standard IN ('ISO9001', 'ISO14001', 'SA8000', 'BSCI', 'AQL_2_5')),
    overall_rating_score NUMERIC(3,2) NOT NULL DEFAULT 4.90,
    qc_status VARCHAR(50) NOT NULL DEFAULT 'PASSED'
        CONSTRAINT chk_qc_status CHECK (qc_status IN ('PASSED', 'CONDITIONAL', 'FAILED')),
    report_pdf_url TEXT,
    audit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_at DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_factory_audits_supplier ON factory_quality_audits(supplier_organization_id);
CREATE INDEX IF NOT EXISTS idx_factory_audits_agency ON factory_quality_audits(auditor_agency);

