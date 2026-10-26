-- db/migrations/004_supplementary_rls.sql
-- WHOLESALE Enterprise Row-Level Security (RLS) for Supplementary Extensions
-- Applied to PostgreSQL 17+

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON SUPPLEMENTARY TABLES
-- ============================================================================

ALTER TABLE buyer_corporate_tax_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_account_spending_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kwa_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kwa_click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_storefront_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customs_tariffs_export_controls ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. TENANT ISOLATION POLICIES (Strict Separation)
-- ============================================================================

-- Buyer Tax Credentials Policy: Org Tenant isolation
CREATE POLICY tenant_isolation_buyer_tax ON buyer_corporate_tax_credentials
    FOR ALL
    USING (
        organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR current_user IN ('migration_role', 'ops_role')
    );

-- Sub-account limits: Org Tenant isolation
CREATE POLICY tenant_isolation_sub_accounts ON sub_account_spending_limits
    FOR ALL
    USING (
        organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR current_user IN ('migration_role', 'ops_role')
    );

-- KWA Campaigns: Supplier Tenant isolation
CREATE POLICY tenant_isolation_kwa_campaigns ON kwa_campaigns
    FOR ALL
    USING (
        supplier_organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR current_user IN ('migration_role', 'ops_role')
    );

-- KWA Click Events: via Parent Campaign
CREATE POLICY tenant_isolation_kwa_clicks ON kwa_click_events
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM kwa_campaigns kc
            WHERE kc.id = kwa_click_events.campaign_id
              AND (kc.supplier_organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
                   OR current_user IN ('migration_role', 'ops_role'))
        )
    );

-- Supplier Storefront Configs: Public Read, Tenant Write
CREATE POLICY storefront_public_read ON supplier_storefront_configs
    FOR SELECT
    USING (TRUE);

CREATE POLICY storefront_tenant_write ON supplier_storefront_configs
    FOR ALL
    USING (
        organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
        OR current_user IN ('migration_role', 'ops_role')
    );

-- Customs Tariffs Export Controls: Public Read, Ops Write
CREATE POLICY customs_controls_public_read ON customs_tariffs_export_controls
    FOR SELECT
    USING (TRUE);

CREATE POLICY customs_controls_ops_write ON customs_tariffs_export_controls
    FOR ALL
    USING (current_user IN ('migration_role', 'ops_role'));

