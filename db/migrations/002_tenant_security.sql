-- 002_tenant_security.sql
-- WHOLESALE Enterprise Row-Level Security (RLS) & Multi-Tenant Isolation
-- Applied to PostgreSQL 17+

-- Enable RLS on core tenant-scoped tables
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- 1. Listings Policy:
-- Public can read PUBLISHED listings.
-- Organization members can manage their own listings in any status.
CREATE POLICY listings_read_policy ON listings
    FOR SELECT
    USING (
        status = 'PUBLISHED'
        OR organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
    );

CREATE POLICY listings_modify_policy ON listings
    FOR ALL
    USING (
        organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
    );

-- 2. RFQ Policy:
-- Public / suppliers can view PUBLISHED RFQs.
-- The buyer organization can view all its own RFQs (DRAFT, SUBMITTED, etc.).
CREATE POLICY rfqs_read_policy ON rfqs
    FOR SELECT
    USING (
        status = 'PUBLISHED'
        OR buyer_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
    );

CREATE POLICY rfqs_modify_policy ON rfqs
    FOR ALL
    USING (
        buyer_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
    );

-- 3. Quotes Policy:
-- Strictly isolated between buyer and issuing supplier.
-- Supplier B cannot see Supplier A's quote!
CREATE POLICY quotes_isolation_policy ON quotes
    FOR ALL
    USING (
        supplier_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
        OR rfq_id IN (
            SELECT id FROM rfqs WHERE buyer_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
        )
    );

-- 4. Trade Orders Policy:
-- Accessible only by the buyer organization or the supplier organization involved.
CREATE POLICY trade_orders_isolation_policy ON trade_orders
    FOR ALL
    USING (
        buyer_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
        OR supplier_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
    );

-- 5. Settlements Policy:
-- Strictly accessible only by the beneficiary supplier organization.
CREATE POLICY settlements_isolation_policy ON settlements
    FOR ALL
    USING (
        supplier_organization_id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
    );
