/// <reference lib="dom" />
// apps/api-worker/src/routesSourcing.ts
// RFQs, Supplier Quotes, Inquiries 1:1 Messenger, Partner Dashboard & Inventory

import { jsonResponse, problemResponse } from './response';
import {
  rfqs,
  quotes,
  orders,
  inquiries,
  inventoryBalances,
  supplierStorefronts,
  kwaCampaigns,
  verifications,
  listings,
  settlements,
  logAudit,
  BUYER_ORG_ID,
  SUPPLIER_ORG_ID,
  processedIdempotencyKeys,
  users,
  organizations,
} from './store';
import { getAuthContext } from './jwt';

export async function handleSourcing(request: Request, url: URL): Promise<Response | null> {
  const ctx = await getAuthContext(request, users, organizations);

  // ================= RFQ & QUOTES =================
  // GET & POST /v1/sourcing/rfqs
  if (url.pathname === '/v1/sourcing/rfqs') {
    if (request.method === 'GET') {
      const cat = url.searchParams.get('category');
      let items = Array.from(rfqs.values());
      if (cat && cat !== 'ALL') {
        items = items.filter(r => r.category === cat);
      }
      // Public RFQ Contact Masking Invariant (S5)
      const maskedItems = items.map(r => ({
        ...r,
        buyerEmail: undefined,
        buyer_contact: '[PROTECTED]',
        is_contact_masked: true,
      }));
      return jsonResponse({ items: maskedItems, total_count: maskedItems.length });
    }

    if (request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      if (!body.title || !body.quantity) {
        return problemResponse(400, 'INVALID_BODY', 'Missing RFQ Fields', 'title and quantity are required');
      }
      const id = `rfq-${Date.now()}`;
      const newRFQ = {
        id,
        buyer_organization_id: ctx?.org?.id || body.buyer_organization_id || BUYER_ORG_ID,
        buyer_name: ctx?.org?.legal_name || 'Metro Wholesale Imports LLC',
        title: body.title,
        category: body.category || 'CAT-IND',
        sub_category: body.sub_category || '산업 정밀 부품',
        destination_country: body.destination_country || 'US',
        requested_qty: String(body.quantity),
        unit: body.unit || 'pcs',
        target_price: body.target_price || '0.00',
        lead_time_days: Number(body.lead_time_days || 30),
        incoterms: body.incoterms || 'FOB',
        status: 'PUBLISHED',
        expires_at: body.expires_at || '2026-12-31',
        is_contact_masked: true,
        buyer_contact: '[PROTECTED]',
        created_at: new Date().toISOString(),
      };
      rfqs.set(id, newRFQ);

      logAudit(
        'RFQ_POSTED',
        ctx?.user?.id || 'user-buyer-001',
        'BUYER_PURCHASER',
        'RFQ',
        id,
        `New RFQ published: '${newRFQ.title}', Qty: ${newRFQ.requested_qty} ${newRFQ.unit}`
      );

      return jsonResponse(newRFQ, 201);
    }
  }

  // GET /v1/sourcing/rfqs/:id
  const rfqGetMatch = url.pathname.match(/^\/v1\/sourcing\/rfqs\/([^\/]+)$/);
  if (rfqGetMatch && request.method === 'GET') {
    const rfqId = rfqGetMatch[1];
    const rfq = rfqs.get(rfqId);
    if (!rfq) {
      return problemResponse(404, 'NOT_FOUND', 'RFQ Not Found', `RFQ ${rfqId} does not exist`);
    }
    const rfqQuotes = Array.from(quotes.values()).filter(q => q.rfq_id === rfqId);
    return jsonResponse({
      ...rfq,
      buyerEmail: undefined,
      buyer_contact: '[PROTECTED]',
      is_contact_masked: true,
      quotes: rfqQuotes,
      quotes_count: rfqQuotes.length,
    });
  }

  // GET & POST /v1/sourcing/rfqs/:id/quotes
  const rfqQuoteMatch = url.pathname.match(/^\/v1\/sourcing\/rfqs\/([^\/]+)\/quotes$/);
  if (rfqQuoteMatch && request.method === 'GET') {
    const rfqId = rfqQuoteMatch[1];
    const rfqQuotes = Array.from(quotes.values()).filter(q => q.rfq_id === rfqId);
    return jsonResponse({
      rfq_id: rfqId,
      items: rfqQuotes,
      total_count: rfqQuotes.length,
    });
  }
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
    const supplierOrgId = ctx?.org?.id || SUPPLIER_ORG_ID;

    // Check if supplier already submitted quote for this RFQ (Supercede revision)
    let existingQuote: any = null;
    for (const q of quotes.values()) {
      if (q.rfq_id === rfqId && q.supplier_organization_id === supplierOrgId) {
        existingQuote = q;
        break;
      }
    }

    if (existingQuote) {
      const nextRev = (existingQuote.revision_number || 1) + 1;
      existingQuote.revisions.forEach((r: any) => {
        r.status = 'SUPERSEDED';
      });
      existingQuote.revision_number = nextRev;
      existingQuote.unit_price = String(unitPrice);
      existingQuote.lead_time_days = leadTime;
      existingQuote.incoterms = incoterms;
      existingQuote.status = 'ISSUED';
      existingQuote.revisions.push({
        revision_number: nextRev,
        unit_price: String(unitPrice),
        lead_time_days: leadTime,
        incoterms: incoterms,
        status: 'ISSUED',
        created_at: new Date().toISOString(),
      });

      logAudit(
        'QUOTE_REVISION_SUPERSEDED',
        ctx?.user?.id || 'user-supplier-001',
        'SUPPLIER_SALES',
        'QUOTE',
        existingQuote.id,
        `Revision ${nextRev} submitted for RFQ ${rfqId}. Previous revision superseded.`
      );

      return jsonResponse(existingQuote, 201);
    }

    const quoteId = `quote-${rfqId}-${Date.now()}`;
    const newQuote = {
      id: quoteId,
      rfq_id: rfqId,
      supplier_organization_id: supplierOrgId,
      supplier_name: ctx?.org?.legal_name || 'Precision Korea Co., Ltd. (글로벌정밀산업)',
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

    logAudit(
      'QUOTE_SUBMITTED',
      ctx?.user?.id || 'user-supplier-001',
      'SUPPLIER_SALES',
      'QUOTE',
      quoteId,
      `Direct quote submitted for RFQ ${rfqId}: $${unitPrice}/${newQuote.unit}`
    );

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

  // POST /v1/sourcing/quotes/:id/accept (Idempotency Key Validated)
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
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder = {
      id: orderId,
      order_number: orderNumber,
      quote_id: quoteId,
      buyer_organization_id: ctx?.org?.id || BUYER_ORG_ID,
      supplier_organization_id: quote.supplier_organization_id,
      buyer_name: ctx?.org?.legal_name || 'Metro Wholesale Imports LLC',
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
      incoterms: quote.incoterms,
      created_at: new Date().toISOString(),
    };
    orders.set(orderId, newOrder);
    quote.status = 'ACCEPTED';

    // Create settlement record
    settlements.set(`set-${orderId}`, {
      id: `set-${orderId}`,
      order_id: orderId,
      order_number: orderNumber,
      supplier_organization_id: quote.supplier_organization_id,
      supplier_name: quote.supplier_name,
      gross_minor: totalAmountMinor,
      fee_minor: Math.round(totalAmountMinor * 0.05),
      net_minor: totalAmountMinor - Math.round(totalAmountMinor * 0.05),
      currency: quote.currency,
      status: 'HELD_ESCROW',
      created_at: new Date().toISOString(),
    });

    logAudit(
      'QUOTE_ACCEPTED',
      ctx?.user?.id || 'user-buyer-001',
      'BUYER_PURCHASER',
      'TRADE_ORDER',
      orderId,
      `Quote ${quoteId} accepted via Idempotency-Key ${idempKey}. Order ${orderNumber} created.`
    );

    return jsonResponse(newOrder, 201);
  }

  // ================= INQUIRIES & MESSENGER =================
  // GET & POST /v1/inquiries
  if (url.pathname === '/v1/inquiries') {
    if (request.method === 'GET') {
      const items = Array.from(inquiries.values());
      return jsonResponse({ inquiries: items, total_count: items.length });
    }
    if (request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      const inqId = `inq-${Date.now()}`;
      const newThread = {
        id: inqId,
        buyer_organization_id: ctx?.org?.id || BUYER_ORG_ID,
        buyer_name: ctx?.org?.legal_name || 'Metro Wholesale Imports LLC',
        supplier_organization_id: body.supplier_organization_id || SUPPLIER_ORG_ID,
        supplier_name: body.supplier_name || 'Precision Korea Co., Ltd.',
        listing_id: body.listing_id,
        listing_title: body.listing_title || '도매 상품 문의',
        subject: body.subject || body.message?.slice(0, 30) || '1:1 견적 및 맞춤제작 문의',
        status: 'OPEN' as const,
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender_id: ctx?.user?.id || 'user-buyer-001',
            sender_name: ctx?.user?.full_name || 'Metro Wholesale Purchaser',
            sender_role: ctx?.user?.role || 'BUYER_PURCHASER',
            content: body.message || '견적 및 납기 문의드립니다.',
            attachment_url: body.attachment_url,
            sent_at: new Date().toISOString(),
          },
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      inquiries.set(inqId, newThread);

      logAudit(
        'INQUIRY_CREATED',
        ctx?.user?.id || 'user-buyer-001',
        'BUYER_PURCHASER',
        'INQUIRY',
        inqId,
        `Direct 1:1 supplier inquiry started for '${newThread.listing_title}'`
      );

      return jsonResponse(newThread, 201);
    }
  }

  // GET & POST /v1/inquiries/:id/messages
  const inqMsgMatch = url.pathname.match(/^\/v1\/inquiries\/([^\/]+)\/messages$/);
  if (inqMsgMatch) {
    const inqId = inqMsgMatch[1];
    const thread = inquiries.get(inqId);
    if (!thread) {
      return problemResponse(404, 'NOT_FOUND', 'Inquiry Not Found', `Inquiry thread ${inqId} does not exist`);
    }

    if (request.method === 'GET') {
      return jsonResponse({ inquiry_id: inqId, messages: thread.messages });
    }

    if (request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      if (!body.content) {
        return problemResponse(400, 'INVALID_BODY', 'Missing Content', 'Message content is required');
      }

      const newMsg = {
        id: `msg-${Date.now()}`,
        sender_id: body.sender_id || ctx?.user?.id || 'user-supplier-001',
        sender_name: body.sender_name || ctx?.user?.full_name || 'Precision Korea Sales Manager',
        sender_role: body.sender_role || ctx?.user?.role || 'SUPPLIER_SALES',
        message_type: body.message_type || (body.quote_card ? 'QUOTE_OFFER' : body.contract_card ? 'CONTRACT_SIGN' : body.payment_card ? 'PAYMENT_REQUEST' : 'TEXT'),
        content: body.content,
        attachment_url: body.attachment_url,
        quote_card: body.quote_card,
        contract_card: body.contract_card,
        payment_card: body.payment_card,
        sent_at: new Date().toISOString(),
      };

      thread.messages.push(newMsg);
      thread.updated_at = new Date().toISOString();
      thread.status = 'REPLIED';

      return jsonResponse(newMsg, 201);
    }
  }

  // ================= PARTNER DASHBOARD & INVENTORY =================
  // GET /v1/partner/dashboard
  if (url.pathname === '/v1/partner/dashboard' && request.method === 'GET') {
    const partnerListings = Array.from(listings.values()).filter(l => l.organization_id === SUPPLIER_ORG_ID);
    const partnerOrders = Array.from(orders.values()).filter(o => o.supplier_organization_id === SUPPLIER_ORG_ID);
    const partnerRfqs = Array.from(rfqs.values());
    const partnerInquiries = Array.from(inquiries.values()).filter(i => i.supplier_organization_id === SUPPLIER_ORG_ID);
    const partnerSettlements = Array.from(settlements.values()).filter(s => s.supplier_organization_id === SUPPLIER_ORG_ID);

    const pendingEscrowMinor = partnerSettlements
      .filter(s => s.status !== 'PAYOUT_DISPATCHED')
      .reduce((sum, s) => sum + (s.net_minor || 0), 0);
    const releasedEscrowMinor = partnerSettlements
      .filter(s => s.status === 'RELEASE_ELIGIBLE' || s.status === 'APPROVED_STAGE_1')
      .reduce((sum, s) => sum + (s.net_minor || 0), 0);

    return jsonResponse({
      stats: {
        active_listings_count: partnerListings.length,
        open_rfqs_count: partnerRfqs.length,
        in_production_orders_count: partnerOrders.filter(o => o.order_status !== 'COMPLETED').length,
        pending_inquiries_count: partnerInquiries.filter(i => i.status === 'OPEN').length,
        escrow_pending_minor: pendingEscrowMinor,
        escrow_release_eligible_minor: releasedEscrowMinor,
        currency: 'USD',
        response_rate: '99.2%',
        supplier_rating: 4.9,
      },
      recent_orders: partnerOrders.slice(-5),
      recent_inquiries: partnerInquiries.slice(-5),
      available_inventory: Array.from(inventoryBalances.values()),
    });
  }

  // GET /v1/partner/inventory, /v1/inventory/balances & POST /v1/inventory/adjustments
  if ((url.pathname === '/v1/partner/inventory' || url.pathname === '/v1/inventory/balances') && request.method === 'GET') {
    const items = Array.from(inventoryBalances.values());
    return jsonResponse({ inventory: items, balances: items, total_count: items.length });
  }

  if (url.pathname === '/v1/inventory/adjustments' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    const skuId = body.sku_id;
    const item = inventoryBalances.get(skuId);
    if (!item) {
      return problemResponse(404, 'NOT_FOUND', 'SKU Not Found', `Inventory for SKU ${skuId} does not exist`);
    }

    const adjustment = parseInt(body.adjustment_quantity, 10) || 0;
    item.on_hand += adjustment;
    item.available = item.on_hand - item.reserved;
    item.updated_at = new Date().toISOString();

    logAudit(
      'INVENTORY_ADJUSTED',
      ctx?.user?.id || 'user-supplier-001',
      'SUPPLIER_SALES',
      'INVENTORY',
      skuId,
      `Stock adjusted by ${adjustment > 0 ? '+' : ''}${adjustment} units. New available: ${item.available}`
    );

    return jsonResponse({ success: true, item });
  }

  // POST /v1/organizations/:id/verifications (Submit Verification)
  const orgVerifMatch = url.pathname.match(/^\/v1\/organizations\/([^\/]+)\/verifications$/);
  if (orgVerifMatch && request.method === 'POST') {
    const orgId = orgVerifMatch[1];
    const body = (await request.json().catch(() => ({}))) as any;

    const verifId = `verif-${Date.now()}`;
    const newVerif = {
      id: verifId,
      organization_id: orgId,
      company_name: body.company_name || ctx?.org?.legal_name || 'Precision Korea Co., Ltd.',
      business_number: body.business_number || '123-45-67890',
      business_type: body.business_type || 'MANUFACTURER',
      country: body.country || 'KR',
      status: 'PENDING',
      submitted_at: new Date().toISOString(),
      license_url: body.license_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      audit_report_url: body.audit_report_url || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
      facilities_sqm: Number(body.facilities_sqm || 12000),
      production_lines: Number(body.production_lines || 6),
      qc_inspectors: Number(body.qc_inspectors || 10),
      certificates: body.certificates || ['ISO 9001:2015', 'CE Conformity'],
    };
    verifications.set(verifId, newVerif);

    logAudit(
      'SUPPLIER_VERIFICATION_SUBMITTED',
      ctx?.user?.id || 'user-supplier-001',
      'SUPPLIER_SALES',
      'VERIFICATION',
      verifId,
      `Verification application submitted for ${newVerif.company_name}`
    );

    return jsonResponse(newVerif, 201);
  }

  // GET & PUT /v1/suppliers/:id/storefront
  const storefrontMatch = url.pathname.match(/^\/v1\/suppliers\/([^\/]+)\/storefront$/);
  if (storefrontMatch) {
    const supplierOrgId = storefrontMatch[1];
    if (request.method === 'GET') {
      const data = supplierStorefronts.get(supplierOrgId) || {
        organization_id: supplierOrgId,
        company_name: 'Precision Korea Co., Ltd. (글로벌정밀산업)',
        slogan: 'Precision OEM/ODM Manufacturing Excellence',
        banner_image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=80',
        video_tour_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        certifications: [
          { name: 'ISO 9001:2015', issued_by: 'SGS Korea', valid_thru: '2027-12-31' },
          { name: 'CE Compliance', issued_by: 'TÜV Rheinland', valid_thru: '2028-06-30' },
        ],
        production_equipment: [
          { name: 'Heavy Forming Press', count: 4 },
          { name: 'VMC-850 CNC Center', count: 12 },
        ],
        showcase_product_ids: ['33333333-3333-3333-3333-333333333333', 'ind-prod-002'],
      };
      return jsonResponse(data);
    }
    if (request.method === 'PUT') {
      const body = (await request.json().catch(() => ({}))) as any;
      let data = supplierStorefronts.get(supplierOrgId);
      if (!data) {
        data = { organization_id: supplierOrgId, ...body };
      } else {
        Object.assign(data, body);
      }
      supplierStorefronts.set(supplierOrgId, data);
      return jsonResponse(data);
    }
  }

  // GET & POST /v1/partner/marketing (Keyword Advertising - KWA)
  if (url.pathname === '/v1/partner/marketing') {
    const supplierOrgId = ctx?.org?.id || SUPPLIER_ORG_ID;

    if (request.method === 'GET') {
      const campaigns = Array.from(kwaCampaigns.values()).filter(c => c.supplier_org_id === supplierOrgId);
      const totalSpend = campaigns.reduce((acc, c) => acc + c.total_spend_usd, 0);
      const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);
      const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
      const avgCpc = totalClicks > 0 ? (totalSpend / totalClicks) : 0;

      return jsonResponse({
        supplier_org_id: supplierOrgId,
        summary: {
          total_campaigns: campaigns.length,
          active_campaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
          total_spend_usd: Number(totalSpend.toFixed(2)),
          total_impressions: totalImpressions,
          total_clicks: totalClicks,
          average_cpc_usd: Number(avgCpc.toFixed(2)),
          daily_budget_total_usd: campaigns.reduce((acc, c) => acc + c.daily_budget_usd, 0),
        },
        campaigns,
      });
    }

    if (request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      if (!body.keyword) {
        return problemResponse(400, 'INVALID_BODY', 'Keyword is required', 'keyword must be provided');
      }

      const id = `kwa-${Date.now()}`;
      const newCampaign = {
        id,
        supplier_org_id: supplierOrgId,
        keyword: String(body.keyword).toLowerCase().trim(),
        match_type: (body.match_type || 'BROAD') as 'EXACT' | 'BROAD',
        max_cpc_usd: Number(body.max_cpc_usd || 1.50),
        daily_budget_usd: Number(body.daily_budget_usd || 50.00),
        status: (body.status || 'ACTIVE') as 'ACTIVE' | 'PAUSED',
        impressions: 0,
        clicks: 0,
        total_spend_usd: 0,
        created_at: new Date().toISOString(),
      };

      kwaCampaigns.set(id, newCampaign);

      logAudit(
        'KWA_CAMPAIGN_CREATED',
        ctx?.user?.id || 'user-supplier-001',
        'SUPPLIER_SALES',
        'MARKETING_CAMPAIGN',
        id,
        `Created KWA campaign for '${newCampaign.keyword}' with max CPC $${newCampaign.max_cpc_usd}`
      );

      return jsonResponse(newCampaign, 201);
    }
  }

  // PUT & DELETE /v1/partner/marketing/campaigns/:id
  const kwaMatch = url.pathname.match(/^\/v1\/partner\/marketing\/campaigns\/([^\/]+)$/);
  if (kwaMatch) {
    const campId = kwaMatch[1];
    const camp = kwaCampaigns.get(campId);
    if (!camp) {
      return problemResponse(404, 'NOT_FOUND', 'Campaign Not Found', `KWA campaign ${campId} does not exist`);
    }

    if (request.method === 'PUT') {
      const body = (await request.json().catch(() => ({}))) as any;
      if (body.status) camp.status = body.status;
      if (body.max_cpc_usd) camp.max_cpc_usd = Number(body.max_cpc_usd);
      if (body.daily_budget_usd) camp.daily_budget_usd = Number(body.daily_budget_usd);
      if (body.match_type) camp.match_type = body.match_type;
      kwaCampaigns.set(campId, camp);
      return jsonResponse(camp);
    }

    if (request.method === 'DELETE') {
      kwaCampaigns.delete(campId);
      return jsonResponse({ success: true, deleted_id: campId });
    }
  }

  // GET /v1/partner/analytics (Seller Performance & Traffic Intelligence)
  if (url.pathname === '/v1/partner/analytics' && request.method === 'GET') {
    const range = url.searchParams.get('range') || '30d';

    const supplierOrgId = ctx?.org?.id || SUPPLIER_ORG_ID;
    const supplierListings = Array.from(listings.values()).filter(l => l.organization_id === supplierOrgId);

    const analyticsData = {
      period: range,
      summary: {
        total_impressions: 48250,
        total_clicks: 2940,
        click_through_rate: '6.09%',
        inquiries_count: 73,
        inquiry_conversion_rate: '2.48%',
        orders_count: 14,
        gmv_usd: 84250.00,
        repeat_buyer_rate: '35.7%',
      },
      traffic_sources: [
        { channel: 'Global Organic Search', percentage: 46.5, visitors: 1367 },
        { channel: 'Keyword Advertising (KWA)', percentage: 28.2, visitors: 829 },
        { channel: 'Category Hierarchy Browsing', percentage: 15.3, visitors: 450 },
        { channel: 'Direct Mini-site / Storefront', percentage: 10.0, visitors: 294 },
      ],
      top_performing_products: supplierListings.slice(0, 5).map(l => ({
        id: l.id,
        title: l.title,
        impressions: Math.floor(8000 + Math.random() * 4000),
        clicks: Math.floor(400 + Math.random() * 300),
        inquiries: Math.floor(10 + Math.random() * 15),
        orders: Math.floor(2 + Math.random() * 5),
        conversion_rate: '3.1%',
      })),
      daily_metrics_timeline: [
        { date: '2026-10-18', impressions: 1520, clicks: 92, inquiries: 3, orders: 1 },
        { date: '2026-10-19', impressions: 1680, clicks: 105, inquiries: 4, orders: 0 },
        { date: '2026-10-20', impressions: 1490, clicks: 88, inquiries: 2, orders: 1 },
        { date: '2026-10-21', impressions: 1820, clicks: 114, inquiries: 5, orders: 2 },
        { date: '2026-10-22', impressions: 1950, clicks: 126, inquiries: 6, orders: 1 },
        { date: '2026-10-23', impressions: 2100, clicks: 138, inquiries: 7, orders: 2 },
        { date: '2026-10-24', impressions: 1740, clicks: 99, inquiries: 3, orders: 1 },
      ],
    };

    return jsonResponse(analyticsData);
  }

  return null;
}
