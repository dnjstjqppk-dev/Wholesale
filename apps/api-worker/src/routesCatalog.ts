// apps/api-worker/src/routesCatalog.ts
import { jsonResponse, problemResponse } from './response';
import { listings, SUPPLIER_ORG_ID } from './store';

export async function handleCatalog(request: Request, url: URL): Promise<Response | null> {
  // GET & POST /v1/catalog/listings
  if (url.pathname === '/v1/catalog/listings') {
    if (request.method === 'GET') {
      const cat = url.searchParams.get('category');
      const q = url.searchParams.get('q');
      let items = Array.from(listings.values());
      if (cat && cat !== 'ALL') {
        items = items.filter(i => i.category === cat);
      }
      if (q) {
        const query = q.toLowerCase();
        items = items.filter(
          i => i.title.toLowerCase().includes(query) || i.supplier_name.toLowerCase().includes(query)
        );
      }
      return jsonResponse({ items, total_count: items.length });
    }

    if (request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      if (!body.title || !body.moq || !body.price_tiers || !body.price_tiers.length) {
        return problemResponse(400, 'INVALID_BODY', 'Missing Listing Data', 'title, moq, and price_tiers are required');
      }

      const id = crypto.randomUUID();
      const newListing = {
        id,
        sku_id: crypto.randomUUID(),
        organization_id: body.organization_id || SUPPLIER_ORG_ID,
        supplier_name: body.supplier_name || 'Precision Korea Co., Ltd.',
        title: body.title,
        category: body.category || 'CAT-IND',
        category_name: body.category_name || '산업기계 & 부품',
        country: 'KR',
        moq: String(body.moq),
        quantity_step: String(body.quantity_step || '10'),
        unit: body.unit || 'pcs',
        lead_time_days: Number(body.lead_time_days || 14),
        status: 'PUBLISHED',
        rating: 5.0,
        reviews_count: 0,
        response_rate: '100%',
        years_in_business: 10,
        trade_assurance: true,
        customization: true,
        incoterms: 'FOB Busan Port',
        price_tiers: body.price_tiers,
        created_at: new Date().toISOString(),
      };
      listings.set(id, newListing);
      return jsonResponse(newListing, 201);
    }
  }

  // GET /v1/catalog/listings/:id
  const listingMatch = url.pathname.match(/^\/v1\/catalog\/listings\/([^\/]+)$/);
  if (listingMatch && request.method === 'GET') {
    const item = listings.get(listingMatch[1]);
    if (!item) {
      return problemResponse(404, 'NOT_FOUND', 'Listing Not Found', `Product listing ${listingMatch[1]} does not exist`);
    }
    return jsonResponse(item);
  }

  return null;
}
