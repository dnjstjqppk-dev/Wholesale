-- db/migrations/002_tenant_security.sql
-- WHOLESALE Enterprise Row-Level Security (RLS) & Multi-Tenant Isolation
-- Applied to PostgreSQL 17+

-- ============================================================================
-- 1. DATABASE ROLE SEPARATION (Principle of Least Privilege)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'migration_role') THEN
        CREATE ROLE migration_role WITH NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'auth_role') THEN
        CREATE ROLE auth_role WITH NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'public_catalog_role') THEN
        CREATE ROLE public_catalog_role WITH NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'runtime_role') THEN
        CREATE ROLE runtime_role WITH NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ops_role') THEN
        CREATE ROLE ops_role WITH NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'worker_role') THEN
        CREATE ROLE worker_role WITH NOLOGIN;
    END IF;
END
$$;

-- ============================================================================
-- 2. ENABLE ROW-LEVEL SECURITY ON CORE TENANT TABLES
-- ============================================================================

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. TENANT ISOLATION POLICIES (Current Setting: app.current_org_id)
-- ============================================================================

-- 1. Listings: Public can read PUBLISHED listings; Supplier org can manage all their own.
DROP POLICY IF EXISTS listings_read_policy ON listings;
CREATE POLICY listings_read_policy ON listings
    FOR SELECT
    USING (
        status = 'PUBLISHED'
        OR organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
    );

DROP POLICY IF EXISTS listings_modify_policy ON listings;
CREATE POLICY listings_modify_policy ON listings
    FOR ALL
    USING (
        organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
    );

-- 2. RFQs: Public can read PUBLISHED RFQs; Buyer org can manage all their own.
DROP POLICY IF EXISTS rfqs_read_policy ON rfqs;
CREATE POLICY rfqs_read_policy ON rfqs
    FOR SELECT
    USING (
        status = 'PUBLISHED'
        OR buyer_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
    );

DROP POLICY IF EXISTS rfqs_modify_policy ON rfqs;
CREATE POLICY rfqs_modify_policy ON rfqs
    FOR ALL
    USING (
        buyer_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
    );

-- 3. Quotes & Revisions: Strictly isolated between buyer and issuing supplier.
DROP POLICY IF EXISTS quotes_isolation_policy ON quotes;
CREATE POLICY quotes_isolation_policy ON quotes
    FOR ALL
    USING (
        supplier_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
        OR rfq_id IN (
            SELECT id FROM rfqs WHERE buyer_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
        )
    );

-- 4. Trade Orders: Accessible only by involved buyer or supplier organization.
DROP POLICY IF EXISTS trade_orders_isolation_policy ON trade_orders;
CREATE POLICY trade_orders_isolation_policy ON trade_orders
    FOR ALL
    USING (
        buyer_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
        OR supplier_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
    );

-- 5. Settlements: Strictly accessible only by beneficiary supplier organization.
DROP POLICY IF EXISTS settlements_isolation_policy ON settlements;
CREATE POLICY settlements_isolation_policy ON settlements
    FOR ALL
    USING (
        supplier_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
    );

-- 6. Disputes: Accessible only by involved parties.
DROP POLICY IF EXISTS disputes_isolation_policy ON disputes;
CREATE POLICY disputes_isolation_policy ON disputes
    FOR ALL
    USING (
        buyer_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
        OR supplier_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
    );

-- 7. Bank Accounts: Accessible only by account-holding organization.
DROP POLICY IF EXISTS bank_accounts_isolation_policy ON bank_accounts;
CREATE POLICY bank_accounts_isolation_policy ON bank_accounts
    FOR ALL
    USING (
        organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
    );
