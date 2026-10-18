-- db/queries/identity.sql
-- Name: GetUserByEmail :one
SELECT id, email, password_hash, full_name, phone_number, is_active, created_at, updated_at
FROM users
WHERE email = $1 LIMIT 1;

-- Name: CreateUser :one
INSERT INTO users (email, password_hash, full_name, phone_number)
VALUES ($1, $2, $3, $4)
RETURNING id, email, full_name, phone_number, is_active, created_at;

-- Name: GetOrganization :one
SELECT id, legal_name, trade_name, business_number, tax_id, country, business_type, capabilities, is_verified_supplier, created_at
FROM organizations
WHERE id = $1 LIMIT 1;

-- Name: CreateOrganization :one
INSERT INTO organizations (legal_name, trade_name, business_number, tax_id, country, business_type, capabilities)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, legal_name, trade_name, business_number, country, business_type, capabilities, is_verified_supplier;

-- Name: CreateMembership :one
INSERT INTO memberships (user_id, organization_id, role)
VALUES ($1, $2, $3)
RETURNING id, user_id, organization_id, role, is_active, joined_at;

-- Name: ListUserOrganizations :many
SELECT o.id, o.legal_name, o.trade_name, o.business_type, o.capabilities, o.is_verified_supplier, m.role
FROM organizations o
JOIN memberships m ON m.organization_id = o.id
WHERE m.user_id = $1 AND m.is_active = TRUE;
