// apps/api-worker/src/routesSourcing.ts
import { jsonResponse, problemResponse } from './response';
import { rfqs, quotes, orders, BUYER_ORG_ID, SUPPLIER_ORG_ID, processedIdempotencyKeys } from './store';

export async function handleSourcing(request: Request, url: URL): Promise<Response | null> {
  // GET & POST /v1/sourcing/rfqs
  if (url.pathname === '/v1/sourcing/rfqs') {
    if (request.method === 'GET') {
      const items = Array.from(rfqs.values());
      return jsonResponse({ items, total_count: items.length });
    }
    if (request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      if (!body.title || !body.quantity) {
        return problemResponse(400, 'INVALID_BODY', 'Missing RFQ Fields', 'title and quantity are required');
      }
      const id = `rfq-${Date.now()}`;
      const newRFQ = {
        id,
        buyer_organization_id: body.buyer_organization_id || BUYER_ORG_ID,
        title: body.title,
        category: body.category || 'CAT-IND',
        destination_country: body.destination_country || 'KR',
        requested_qty: String(body.quantity),
        unit: body.unit || 'pcs',
        target_price: body.target_price || '0.00',
        lead_time_days: Number(body.lead_time_days || 30),
        incoterms: body.incoterms || 'FOB',
        status: 'PUBLISHED',
        expires_at: body.expires_at || '2026-12-31',
        created_at: new Date().toISOString(),
      };
      rfqs.set(id, newRFQ);
      return jsonResponse(newRFQ, 201);
    }
  }

  // POST /v1/sourcing/rfqs/:id/quotes
  const rfqQuoteMatch = url.pathname.match(/^\/v1\/sourcing\/rfqs\/([^\/]+)\/quotes$/);
  if (rfqQuoteMatch && request.method === 'POST') {
    const rfqId = rfqQuoteMatch[1];
    const rfq = rfqs.get(rfqId);
    if (!rfq) {
      return problemResponse(404, 'NOT_FOUND', 'RFQ Not Found', `RFQ ${rfqId} does not exist`);
    }
    const body = (await request.json().catch(() => ({}))) as any;
    const unitPrice = body.unit_price || '4.50';
    const leadTime = Number(body.lead_time_days || 14);
    const incoterms = body.incoterms || 'FOB Busan Port';
    const quoteId = `quote-${rfqId}-${Date.now()}`;
    const newQuote = {
      id: quoteId,
      rfq_id: rfqId,
      supplier_organization_id: SUPPLIER_ORG_ID,
      supplier_name: 'Precision Korea Co., Ltd.',
      item_title: rfq.title,
      quantity: Number(rfq.requested_qty) || 1000,
      unit: rfq.unit || 'pcs',
      unit_price: String(unitPrice),
      currency: 'USD',
      lead_time_days: leadTime,
      incoterms: incoterms,
      status: 'ISSUED',
      revision_number: 1,
      created_at: new Date().toISOString(),
      revisions: [
        {
          revision_number: 1,
          unit_price: String(unitPrice),
          lead_time_days: leadTime,
          incoterms: incoterms,
          status: 'ISSUED',
          created_at: new Date().toISOString(),
        },
      ],
    };
    quotes.set(quoteId, newQuote);
    return jsonResponse(newQuote, 201);
  }

  // GET /v1/sourcing/quotes/:id
  const quoteGetMatch = url.pathname.match(/^\/v1\/sourcing\/quotes\/([^\/]+)$/);
  if (quoteGetMatch && request.method === 'GET') {
    const quoteId = quoteGetMatch[1];
    const quote = quotes.get(quoteId);
    if (!quote) {
      return problemResponse(404, 'NOT_FOUND', 'Quote Not Found', `Quote ${quoteId} does not exist`);
    }
    return jsonResponse(quote);
  }

  // POST /v1/sourcing/quotes/:id/accept
  const quoteAcceptMatch = url.pathname.match(/^\/v1\/sourcing\/quotes\/([^\/]+)\/accept$/);
  if (quoteAcceptMatch && request.method === 'POST') {
    const quoteId = quoteAcceptMatch[1];
    const quote = quotes.get(quoteId);
    if (!quote) {
      return problemResponse(404, 'NOT_FOUND', 'Quote Not Found', `Quote ${quoteId} does not exist`);
    }

    const idempKey = request.headers.get('Idempotency-Key');
    if (!idempKey) {
      return problemResponse(400, 'MISSING_IDEMPOTENCY_KEY', 'Idempotency Key Required', 'Idempotency-Key header is required for quote acceptance');
    }
    if (processedIdempotencyKeys.has(idempKey)) {
      return problemResponse(409, 'DUPLICATE_REQUEST', 'Duplicate Request', 'This quote acceptance has already been processed with this Idempotency-Key');
    }
    processedIdempotencyKeys.add(idempKey);

    const unitPrice = parseFloat(quote.unit_price);
    const qty = quote.quantity;
    const totalAmountMinor = Math.round(unitPrice * qty * 100);
    const downpaymentMinor = Math.round(totalAmountMinor * 0.30); // 30%
    const balanceMinor = totalAmountMinor - downpaymentMinor;     // 70%

    const orderId = `ord-${Date.now()}`;
    const newOrder = {
      id: orderId,
      order_number: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      quote_id: quoteId,
      buyer_organization_id: BUYER_ORG_ID,
      supplier_organization_id: quote.supplier_organization_id,
      buyer_name: 'Metro Wholesale Imports LLC',
      supplier_name: quote.supplier_name,
      item_title: quote.item_title,
      unit_price: quote.unit_price,
      ordered_quantity: qty,
      unit: quote.unit,
      total_amount_minor: totalAmountMinor,
      downpayment_minor: downpaymentMinor,
      balance_minor: balanceMinor,
      currency: quote.currency,
      order_status: 'CONTRACT_PENDING',
      payment_status: 'DOWN_PAYMENT_PENDING',
      fulfillment_status: 'UNFULFILLED',
      dispute_status: 'NONE',
      settlement_status: 'HELD_ESCROW',
      shipped_quantity: 0,
      is_contract_signed: false,
      contract_hash: '9f833777d9498425d978a3c8e5473724c96576d4df43a3db18e27c1f8a8dc4e5',
      created_at: new Date().toISOString(),
    };
    orders.set(orderId, newOrder);
    quote.status = 'ACCEPTED';

    return jsonResponse(newOrder, 201);
  }

  return null;
}

