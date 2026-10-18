// apps/api-worker/src/routesAuth.ts
import { jsonResponse, problemResponse } from './response';
import { users, organizations, BUYER_ORG_ID, SUPPLIER_ORG_ID, ADMIN_ORG_ID } from './store';
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

  return null;
}
