/// <reference lib="dom" />
// apps/api-worker/src/routesAuth.ts
import { jsonResponse, problemResponse } from './response';
import { users, organizations, BUYER_ORG_ID, SUPPLIER_ORG_ID, ADMIN_ORG_ID, buyerProfiles, logAudit } from './store';
import { signJwt, getAuthContext } from './jwt';

export async function handleAuth(request: Request, url: URL): Promise<Response | null> {
  // POST /v1/auth/register
  if (url.pathname === '/v1/auth/register' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    if (!body.email || !body.password) {
      return problemResponse(400, 'INVALID_BODY', 'Missing Required Registration Fields', 'email and password are required');
    }
    if (body.password.length < 6) {
      return problemResponse(400, 'WEAK_PASSWORD', 'Password Too Short', 'Password must be at least 6 characters long');
    }

    const orgId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const role = body.role_capability === 'SUPPLIER' ? 'SUPPLIER_SALES' : 'BUYER_PURCHASER';

    const newOrg = {
      id: orgId,
      legal_name: body.company_name || `${body.email.split('@')[0]} Enterprise`,
      business_number: body.business_number || '123-45-67890',
      country: body.country || 'KR',
      business_type: body.role_capability || 'BUYER_CORP',
      is_verified_supplier: false,
    };
    organizations.set(orgId, newOrg);

    const newUser = {
      id: userId,
      email: body.email,
      password: body.password,
      full_name: body.full_name || body.email.split('@')[0],
      active_organization_id: orgId,
      role,
    };
    users.set(body.email, newUser);

    const token = await signJwt({
      sub: userId,
      email: body.email,
      full_name: newUser.full_name,
      company_name: newOrg.legal_name,
      org_id: orgId,
      role,
    });

    return jsonResponse({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400 * 30,
      user: {
        id: userId,
        email: body.email,
        full_name: newUser.full_name,
        role,
      },
      organization: newOrg,
    }, 201);
  }

  // POST /v1/auth/login
  if (url.pathname === '/v1/auth/login' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    if (!body.email || !body.password) {
      return problemResponse(400, 'INVALID_BODY', 'Missing Credentials', 'email and password are required');
    }

    let user = users.get(body.email);
    if (!user) {
      let role = 'BUYER_PURCHASER';
      let orgId = BUYER_ORG_ID;
      if (body.email.includes('admin')) {
        role = 'PLATFORM_ADMIN';
        orgId = ADMIN_ORG_ID;
      } else if (body.email.includes('supplier') || body.email.includes('partner') || body.email.includes('seller')) {
        role = 'SUPPLIER_SALES';
        orgId = SUPPLIER_ORG_ID;
      }
      user = {
        id: `user-${crypto.randomUUID().slice(0, 8)}`,
        email: body.email,
        password: body.password,
        full_name: body.email.split('@')[0],
        active_organization_id: orgId,
        role,
      };
      users.set(body.email, user);
    } else if (user.password && user.password !== body.password) {
      return problemResponse(401, 'INVALID_CREDENTIALS', 'Authentication Failed', 'Invalid email or password');
    }

    const org = organizations.get(user.active_organization_id) || {
      id: user.active_organization_id,
      legal_name: 'Metro Wholesale Imports LLC',
      business_number: '987-65-43210',
      country: 'KR',
      business_type: user.role === 'SUPPLIER_SALES' ? 'MANUFACTURER' : 'BUYER_CORP',
      is_verified_supplier: user.role === 'SUPPLIER_SALES',
    };

    const token = await signJwt({
      sub: user.id,
      email: user.email,
      full_name: user.full_name,
      company_name: org.legal_name,
      org_id: user.active_organization_id,
      role: user.role,
    });

    return jsonResponse({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400 * 30,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      organization: org,
    });
  }

  // GET /v1/auth/me
  if (url.pathname === '/v1/auth/me' && request.method === 'GET') {
    const ctx = await getAuthContext(request, users, organizations);
    if (!ctx) {
      return problemResponse(401, 'UNAUTHORIZED', 'Unauthorized', 'Valid Bearer token is required');
    }
    return jsonResponse({
      user: {
        id: ctx.user.id,
        email: ctx.user.email,
        full_name: ctx.user.full_name,
        role: ctx.user.role,
      },
      organization: ctx.org,
    });
  }

  // GET & PUT /v1/auth/profile (Corporate Profile, EIN/VAT, Sub-accounts, Addresses)
  if (url.pathname === '/v1/auth/profile') {
    const ctx = await getAuthContext(request, users, organizations);
    const orgId = ctx?.org?.id || BUYER_ORG_ID;

    if (request.method === 'GET') {
      let profile = buyerProfiles.get(orgId);
      if (!profile) {
        profile = buyerProfiles.get(BUYER_ORG_ID)!;
      }
      return jsonResponse(profile);
    }

    if (request.method === 'PUT') {
      const body = (await request.json().catch(() => ({}))) as any;
      let profile = buyerProfiles.get(orgId) || buyerProfiles.get(BUYER_ORG_ID)!;

      if (body.legal_name) profile.legal_name = body.legal_name;
      if (body.business_number) profile.business_number = body.business_number;
      if (body.ein_vat) profile.ein_vat = body.ein_vat;
      if (body.contact_person) profile.contact_person = body.contact_person;
      if (body.contact_email) profile.contact_email = body.contact_email;
      if (body.contact_phone) profile.contact_phone = body.contact_phone;
      if (body.annual_purchasing_volume_usd) profile.annual_purchasing_volume_usd = body.annual_purchasing_volume_usd;
      if (body.primary_industry) profile.primary_industry = body.primary_industry;
      if (body.tax_exemption_status) profile.tax_exemption_status = body.tax_exemption_status;

      buyerProfiles.set(orgId, profile);

      logAudit(
        'BUYER_PROFILE_UPDATED',
        ctx?.user?.id || 'user-buyer-001',
        ctx?.user?.role || 'BUYER_PURCHASER',
        'ORGANIZATION',
        orgId,
        `Updated corporate profile and tax status: ${profile.tax_exemption_status}`
      );

      return jsonResponse(profile);
    }
  }

  // POST /v1/auth/profile/addresses
  if (url.pathname === '/v1/auth/profile/addresses' && request.method === 'POST') {
    const ctx = await getAuthContext(request, users, organizations);
    const orgId = ctx?.org?.id || BUYER_ORG_ID;
    const body = (await request.json().catch(() => ({}))) as any;

    let profile = buyerProfiles.get(orgId) || buyerProfiles.get(BUYER_ORG_ID)!;
    const newAddr = {
      id: `addr-${Date.now()}`,
      type: body.type || 'SHIPPING',
      is_default: Boolean(body.is_default),
      recipient_name: body.recipient_name || profile.contact_person,
      phone: body.phone || profile.contact_phone,
      country: body.country || 'US',
      address_line1: body.address_line1 || '',
      address_line2: body.address_line2 || '',
      city: body.city || '',
      state_province: body.state_province || '',
      postal_code: body.postal_code || '',
    };

    if (newAddr.is_default) {
      profile.addresses.forEach(a => {
        if (a.type === newAddr.type) a.is_default = false;
      });
    }

    profile.addresses.push(newAddr);
    buyerProfiles.set(orgId, profile);

    return jsonResponse(newAddr, 201);
  }

  // DELETE /v1/auth/profile/addresses/:id
  const addrDelMatch = url.pathname.match(/^\/v1\/auth\/profile\/addresses\/([^\/]+)$/);
  if (addrDelMatch && request.method === 'DELETE') {
    const addrId = addrDelMatch[1];
    const ctx = await getAuthContext(request, users, organizations);
    const orgId = ctx?.org?.id || BUYER_ORG_ID;
    let profile = buyerProfiles.get(orgId) || buyerProfiles.get(BUYER_ORG_ID)!;

    profile.addresses = profile.addresses.filter(a => a.id !== addrId);
    buyerProfiles.set(orgId, profile);
    return jsonResponse({ success: true, deleted_id: addrId });
  }

  // POST /v1/auth/profile/sub-accounts
  if (url.pathname === '/v1/auth/profile/sub-accounts' && request.method === 'POST') {
    const ctx = await getAuthContext(request, users, organizations);
    const orgId = ctx?.org?.id || BUYER_ORG_ID;
    const body = (await request.json().catch(() => ({}))) as any;

    let profile = buyerProfiles.get(orgId) || buyerProfiles.get(BUYER_ORG_ID)!;
    const newSub = {
      id: `user-sub-${Date.now()}`,
      email: body.email || 'purchaser2@wholesale.internal',
      full_name: body.full_name || 'Associate Purchaser',
      role: body.role || 'BUYER_PURCHASER',
      status: 'ACTIVE' as const,
      spending_limit_usd: Number(body.spending_limit_usd || 5000),
      can_approve: Boolean(body.can_approve),
      created_at: new Date().toISOString(),
    };

    profile.sub_accounts.push(newSub);
    buyerProfiles.set(orgId, profile);

    return jsonResponse(newSub, 201);
  }

  // POST /v1/auth/switch-role (Convenience Testing / Demo Switcher)
  if (url.pathname === '/v1/auth/switch-role' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    const targetRole = body.role || 'BUYER_APPROVER';

    let targetEmail = 'buyer@wholesale.internal';
    if (targetRole === 'BUYER_APPROVER') targetEmail = 'approver@wholesale.internal';
    if (targetRole === 'BUYER_FINANCE') targetEmail = 'finance@wholesale.internal';

    const user = users.get(targetEmail);
    if (!user) {
      return problemResponse(404, 'USER_NOT_FOUND', 'User Not Found', `Role user for ${targetRole} not found`);
    }

    const org = organizations.get(user.active_organization_id);
    const token = await signJwt({
      sub: user.id,
      email: user.email,
      full_name: user.full_name,
      company_name: org?.legal_name || 'Metro Wholesale Imports LLC',
      org_id: user.active_organization_id,
      role: user.role,
    });

    return jsonResponse({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 86400 * 30,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      organization: org,
    });
  }

  return null;
}
