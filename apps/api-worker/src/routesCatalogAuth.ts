import { jsonResponse, problemResponse } from './response';
import { mockListings, mockRFQs } from './mockData';

export async function handleCatalogAndAuth(request: Request, url: URL): Promise<Response | null> {
  // Health
  if (url.pathname === '/' || url.pathname === '/v1/health') {
    return jsonResponse({
      status: 'healthy',
      service: 'wholesale-api',
      version: '1.0.0',
      platform: 'Cloudflare Workers Edge Network',
      timestamp: new Date().toISOString(),
      engines: {
        pricing: 'active (shopspring/decimal exact minor calculation)',
        ledger: 'active (double-entry immutable posting: sum(debit) == sum(credit))',
        governance: 'active (SHA-256 hash contract verification)',
        inventory: 'active (thread-safe atomic reservation & oversell prevention)',
        logistics: 'active (cumulative split-shipment validation)',
      },
    });
  }

  // Auth Register
  if (url.pathname === '/v1/auth/register' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    const orgId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    return jsonResponse(
      {
        access_token: `jwt-${userId}`,
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          id: userId,
          email: body.email || 'user@example.com',
          full_name: body.full_name || 'Business User',
          role: 'ORG_OWNER',
        },
        organization: {
          id: orgId,
          legal_name: body.company_name || 'Enterprise Corp',
          business_number: body.business_number || '123-45-67890',
          business_type: body.role_capability || 'BUYER_CORP',
        },
      },
      201
    );
  }

  // Auth Login
  if (url.pathname === '/v1/auth/login' && request.method === 'POST') {
    return jsonResponse({
      access_token: `jwt-${crypto.randomUUID()}`,
      token_type: 'Bearer',
      expires_in: 86400,
      user: {
        id: 'user-001',
        email: 'demo@wholesale.internal',
        full_name: 'Verified Business Manager',
        role: 'ORG_OWNER',
      },
    });
  }

  // Catalog Listings
  if (url.pathname === '/v1/catalog/listings') {
    if (request.method === 'GET') {
      const cat = url.searchParams.get('category');
      const q = url.searchParams.get('q');
      let filtered = mockListings;
      if (cat) filtered = filtered.filter(i => i.category === cat);
      if (q) {
        const query = q.toLowerCase();
        filtered = filtered.filter(i => i.title.toLowerCase().includes(query) || i.supplier_name.toLowerCase().includes(query));
      }
      return jsonResponse({
        items: filtered,
        total_count: filtered.length,
      });
    }
    if (request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      const newListing = {
        id: crypto.randomUUID(),
        sku_id: crypto.randomUUID(),
        ...body,
        status: 'PUBLISHED',
        is_verified_supplier: true,
        created_at: new Date().toISOString(),
      };
      mockListings.unshift(newListing);
      return jsonResponse(newListing, 201);
    }
  }

  // Single Listing Detail
  const listingDetailMatch = url.pathname.match(/^\/v1\/catalog\/listings\/([^\/]+)$/);
  if (listingDetailMatch && request.method === 'GET') {
    const id = listingDetailMatch[1];
    const found = mockListings.find(l => l.id === id);
    if (found) return jsonResponse(found);
    return problemResponse(404, 'NOT_FOUND', 'Listing Not Found', `Product listing ${id} was not found`);
  }

  // Sourcing RFQs
  if (url.pathname === '/v1/sourcing/rfqs') {
    if (request.method === 'GET') {
      return jsonResponse({
        items: mockRFQs,
        total_count: mockRFQs.length,
      });
    }
    if (request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      const newRFQ = {
        id: `rfq-${Date.now()}`,
        ...body,
        status: 'PUBLISHED',
        quotes_count: 0,
        created_at: new Date().toISOString(),
      };
      mockRFQs.unshift(newRFQ);
      return jsonResponse(newRFQ, 201);
    }
  }

  return null;
}
