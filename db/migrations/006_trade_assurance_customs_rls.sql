-- db/migrations/006_trade_assurance_customs_rls.sql
-- Row Level Security (RLS) Policies for Trade Assurance Claims, Customs Manifests & Factory Audits

-- 1. Enable Row Level Security
ALTER TABLE trade_assurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE customs_declaration_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_quality_audits ENABLE ROW LEVEL SECURITY;

-- 2. Tenant Isolation Policies: trade_assurance_claims
DROP POLICY IF EXISTS tenant_isolation_ta_claims ON trade_assurance_claims;
CREATE POLICY tenant_isolation_ta_claims ON trade_assurance_claims
    FOR ALL
    USING (
        buyer_organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR supplier_organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR NULLIF(current_setting('app.current_tenant_id', true), '') = '00000000-0000-0000-0000-000000000000'
    )
    WITH CHECK (
        buyer_organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR supplier_organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR NULLIF(current_setting('app.current_tenant_id', true), '') = '00000000-0000-0000-0000-000000000000'
    );

-- 3. Tenant Isolation Policies: customs_declaration_manifests
DROP POLICY IF EXISTS tenant_isolation_customs ON customs_declaration_manifests;
CREATE POLICY tenant_isolation_customs ON customs_declaration_manifests
    FOR ALL
    USING (
        organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR NULLIF(current_setting('app.current_tenant_id', true), '') = '00000000-0000-0000-0000-000000000000'
    )
    WITH CHECK (
        organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR NULLIF(current_setting('app.current_tenant_id', true), '') = '00000000-0000-0000-0000-000000000000'
    );

-- 4. Tenant Isolation Policies: factory_quality_audits
-- Audits are publicly viewable by buyers, but only modifiable by the owner supplier or platform admin
DROP POLICY IF EXISTS tenant_isolation_factory_audits ON factory_quality_audits;
CREATE POLICY tenant_isolation_factory_audits ON factory_quality_audits
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS tenant_isolation_factory_audits_write ON factory_quality_audits;
CREATE POLICY tenant_isolation_factory_audits_write ON factory_quality_audits
    FOR ALL
    USING (
        supplier_organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR NULLIF(current_setting('app.current_tenant_id', true), '') = '00000000-0000-0000-0000-000000000000'
    )
    WITH CHECK (
        supplier_organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR NULLIF(current_setting('app.current_tenant_id', true), '') = '00000000-0000-0000-0000-000000000000'
    );

