/// <reference lib="dom" />
// apps/api-worker/src/routesTrade.ts
// Trade Orders, Cart Management, Multi-tier Pricing, Sample Orders, Logistics & Payments

import { jsonResponse, problemResponse } from './response.ts';
import { parsePagination, paginate, matchesQuery } from './pagination.ts';
import { priceListing, moneyMinor, major } from './pricing.ts';
import {
  orders,
  users,
  organizations,
  listings,
  carts,
  settlements,
  tradeAssuranceClaims,
  customsDeclarations,
  factoryQualityAudits,
  logAudit,
  BUYER_ORG_ID,
  SUPPLIER_ORG_ID,
} from './store.ts';
import { getAuthContext, check, requireRole, digest, contractCanonicalBody } from './security.ts';

export async function handleTrade(request: Request, url: URL): Promise<Response | null> {
  const ctx = await getAuthContext(request, users, organizations);
  const buyerOrgId = ctx?.org?.id || BUYER_ORG_ID;

  // ================= CART ENDPOINTS =================
  // GET /v1/cart
  if (url.pathname === '/v1/cart' && request.method === 'GET') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const items = carts.get(buyerOrgId) || [];
    const totalMinor = items.reduce((sum, item) => sum + Math.round(parseFloat(item.total_price) * 100), 0);
    return jsonResponse({
      items,
      item_count: items.length,
      currency: 'USD',
      total_amount_minor: totalMinor,
      total_amount: (totalMinor / 100).toFixed(2),
    });
  }

  // POST /v1/cart/items
  if (url.pathname === '/v1/cart/items' && request.method === 'POST') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const body = (await request.json().catch(() => ({}))) as any;
    const listingId = body.listing_id;
    const qty = parseInt(body.quantity, 10);

    if (!listingId || isNaN(qty) || qty <= 0) {
      return problemResponse(400, 'INVALID_CART_ITEM', 'Invalid Cart Item', 'listing_id and positive quantity are required');
    }

    const listing = listings.get(listingId);
    if (!listing) {
      return problemResponse(404, 'NOT_FOUND', 'Listing Not Found', `Product listing ${listingId} does not exist`);
    }

    const priced = priceListing(listing, qty);
    const unitPrice = Number(priced.unit_price);

    const items = carts.get(buyerOrgId) || [];
    const existingIndex = items.findIndex(i => i.listing_id === listingId);
    const totalPrice = major(priced.total_amount_minor, priced.currency);

    if (existingIndex >= 0) {
      items[existingIndex].quantity = qty;
      items[existingIndex].unit_price = unitPrice.toFixed(2);
      items[existingIndex].total_price = totalPrice;
    } else {
      items.push({
        id: `cart-${Date.now()}`,
        listing_id: listingId,
        sku_id: listing.sku_id || crypto.randomUUID(),
        title: listing.title,
        category: listing.category,
        image: listing.thumbnail || (listing.images && listing.images[0]) || '',
        unit: listing.unit || 'pcs',
        quantity: qty,
        unit_price: unitPrice.toFixed(2),
        currency: listing.price_tiers[0]?.currency || 'USD',
        total_price: totalPrice,
        supplier_name: listing.supplier_name,
        supplier_organization_id: listing.organization_id || SUPPLIER_ORG_ID,
        lead_time_days: listing.lead_time_days || 14,
        incoterms: listing.incoterms || 'FOB Busan Port',
        selected_options: body.selected_options || {},
      });
    }

    carts.set(buyerOrgId, items);

    return jsonResponse({
      success: true,
      cart_items_count: items.length,
      items,
      message: `'${listing.title}' 품목이 도매 장바구니에 담겼습니다.`,
    }, 201);
  }

  // PUT /v1/cart/items/:id
  const cartPutMatch = url.pathname.match(/^\/v1\/cart\/items\/([^\/]+)$/);
  if (cartPutMatch && request.method === 'PUT') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const cartItemId = cartPutMatch[1];
    const body = (await request.json().catch(() => ({}))) as any;
    const qty = parseInt(body.quantity, 10);

    const items = carts.get(buyerOrgId) || [];
    const item = items.find(i => i.id === cartItemId);
    if (!item) {
      return problemResponse(404, 'NOT_FOUND', 'Cart Item Not Found', `Cart item ${cartItemId} does not exist`);
    }

    const listing = listings.get(item.listing_id);
    if (listing) {
      const repriced = priceListing(listing, qty);
      item.unit_price = Number(repriced.unit_price).toFixed(2);
    }

    item.quantity = qty;
    item.total_price = major(moneyMinor(item.unit_price, qty, item.currency || 'USD'), item.currency || 'USD');
    carts.set(buyerOrgId, items);

    return jsonResponse({ success: true, item, items });
  }

  // DELETE /v1/cart/items/:id
  const cartDelMatch = url.pathname.match(/^\/v1\/cart\/items\/([^\/]+)$/);
  if (cartDelMatch && request.method === 'DELETE') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const cartItemId = cartDelMatch[1];
    let items = carts.get(buyerOrgId) || [];
    items = items.filter(i => i.id !== cartItemId);
    carts.set(buyerOrgId, items);
    return jsonResponse({ success: true, cart_items_count: items.length, items });
  }

  // ================= TRADE ORDERS ENDPOINTS =================
  // GET /v1/trade/orders
  if (url.pathname === '/v1/trade/orders' && request.method === 'GET') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    let orderList = Array.from(orders.values());
    if (ctx) {
      if (ctx.user.role === 'PLATFORM_ADMIN') {
        // Admin sees all
      } else {
        orderList = orderList.filter(
          o => o.buyer_organization_id === ctx.org.id || o.supplier_organization_id === ctx.org.id
        );
      }
    }
    const orderQuery = url.searchParams.get('q');
    if (orderQuery) {
      orderList = orderList.filter(o => matchesQuery([o.order_number, o.id], orderQuery));
    }
    const orderPage = paginate(orderList, parsePagination(url));
    return jsonResponse({ orders: orderPage.items, total_count: orderPage.total_count, page: orderPage.page, page_size: orderPage.page_size, total_pages: orderPage.total_pages, has_next: orderPage.has_next });
  }

  // POST /v1/trade/orders (Create Order from Checkout / PDP)
  if (url.pathname === '/v1/trade/orders' && request.method === 'POST') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const body = (await request.json().catch(() => ({}))) as any;
    const listingId = body.listing_id || '33333333-3333-3333-3333-333333333333';
    const listing = listings.get(listingId);

    check(listing, 404, 'LISTING_NOT_FOUND', '주문 대상 상품을 찾을 수 없습니다.');
    const priced = priceListing(listing, parseInt(body.quantity || 1000, 10));
    const qty = priced.quantity;
    const unitPrice = Number(priced.unit_price);
    const totalAmountMinor = priced.total_amount_minor;
    const downpaymentMinor = Math.floor((totalAmountMinor * 30 + 50) / 100);
    const balanceMinor = totalAmountMinor - downpaymentMinor;

    const orderId = `ord-${Date.now()}`;
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder = {
      id: orderId,
      order_number: orderNumber,
      buyer_organization_id: ctx?.org?.id || BUYER_ORG_ID,
      supplier_organization_id: body.supplier_organization_id || listing?.organization_id || SUPPLIER_ORG_ID,
      requester_user_id: ctx?.user?.id || 'user-buyer-001',
      approver_user_id: null,
      buyer_name: ctx?.org?.legal_name || 'Metro Wholesale Imports LLC',
      supplier_name: body.supplier_name || listing?.supplier_name || 'Precision Korea Co., Ltd. (글로벌정밀산업)',
      item_title: body.title || listing?.title || '산업용 초경량 스테인리스 진공 텀블러 벌크팩',
      listing_id: listingId,
      unit_price: unitPrice.toFixed(2),
      ordered_quantity: qty,
      unit: body.unit || listing?.unit || 'pcs',
      total_amount_minor: totalAmountMinor,
      downpayment_minor: downpaymentMinor,
      balance_minor: balanceMinor,
      currency: priced.currency,
      order_status: 'CONTRACT_PENDING',
      payment_status: 'DOWN_PAYMENT_PENDING',
      fulfillment_status: 'UNFULFILLED',
      dispute_status: 'NONE',
      settlement_status: 'HELD_ESCROW',
      shipped_quantity: 0,
      is_contract_signed: false,
      contract_hash: '', // computed below from canonical terms
      incoterms: body.incoterms || 'FOB Busan Port',
      shipping_address: body.shipping_address || '450 Lexington Ave, New York, NY 10017, USA',
      created_at: new Date().toISOString(),
    };

    newOrder.contract_hash = await digest(contractCanonicalBody({
      order_number: newOrder.order_number,
      buyer_organization_id: newOrder.buyer_organization_id,
      supplier_organization_id: newOrder.supplier_organization_id,
      ordered_quantity: newOrder.ordered_quantity,
      unit_price: newOrder.unit_price,
      total_amount_minor: newOrder.total_amount_minor,
      currency: newOrder.currency,
      incoterms: newOrder.incoterms,
    }));
    orders.set(orderId, newOrder);

    // Create settlement record
    const setFeeMinor = Math.floor((totalAmountMinor * 5 + 50) / 100);
    const setNetMinor = totalAmountMinor - setFeeMinor;
    settlements.set(`set-${orderId}`, {
      id: `set-${orderId}`,
      order_id: orderId,
      order_number: orderNumber,
      supplier_organization_id: newOrder.supplier_organization_id,
      supplier_name: newOrder.supplier_name,
      gross_minor: totalAmountMinor,
      fee_minor: setFeeMinor,
      net_minor: setNetMinor,
      currency: newOrder.currency,
      status: 'HELD_ESCROW',
      first_approver_id: null,
      first_approved_at: null,
      dispatched_by: null,
      bank_account: '신한은행 110-***-123456 (예금주: 글로벌정밀산업)',
      created_at: new Date().toISOString(),
    });

    // Clear cart if ordered from cart
    if (body.clear_cart) {
      carts.set(buyerOrgId, []);
    }

    logAudit(
      'TRADE_ORDER_PLACED',
      newOrder.requester_user_id,
      'BUYER_PURCHASER',
      'TRADE_ORDER',
      orderId,
      `New wholesale trade order created: ${orderNumber}, Total: $${(totalAmountMinor / 100).toFixed(2)}`
    );

    return jsonResponse(newOrder, 201);
  }

  // GET /v1/trade/orders/:id
  const orderDetailMatch = url.pathname.match(/^\/v1\/trade\/orders\/([^\/]+)$/);
  if (orderDetailMatch && request.method === 'GET') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const order = orders.get(orderDetailMatch[1]);
    if (!order) {
      return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderDetailMatch[1]} was not found`);
    }
    check(ctx.org.id === order.buyer_organization_id || ctx.org.id === order.supplier_organization_id || ctx.user.role === 'PLATFORM_ADMIN', 403, 'FORBIDDEN', '거래 당사자만 주문을 조회할 수 있습니다.');
    return jsonResponse(order);
  }

  // POST /v1/trade/orders/:id/approve (Internal Corporate Approval & SoD)
  const orderApproveMatch = url.pathname.match(/^\/v1\/trade\/orders\/([^\/]+)\/approve$/);
  if (orderApproveMatch && request.method === 'POST') {
    const orderId = orderApproveMatch[1];
    const order = orders.get(orderId);
    if (!order) {
      return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
    }

    const body = (await request.json().catch(() => ({}))) as any;
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    requireRole(ctx, 'BUYER_APPROVER', 'PLATFORM_ADMIN');
    const approverUserId = ctx.user.id;

    // SoD Check: purchaser cannot approve own order
    if (order.requester_user_id && order.requester_user_id === approverUserId) {
      return problemResponse(
        403,
        'SELF_APPROVAL_BLOCKED',
        'Self-Approval Prohibited',
        `Purchaser (${order.requester_user_id}) cannot approve their own purchase order. Segregation of Duties requires distinct authorized approval.`
      );
    }

    order.approver_user_id = approverUserId;
    order.order_status = 'APPROVED';

    logAudit(
      'ORDER_CORPORATE_APPROVED',
      approverUserId,
      'BUYER_APPROVER',
      'TRADE_ORDER',
      orderId,
      `Order ${order.order_number} approved by procurement director ${approverUserId}`
    );

    return jsonResponse({
      order_id: orderId,
      approved: true,
      approver_user_id: approverUserId,
      status: 'APPROVED',
      approved_at: new Date().toISOString(),
    });
  }

  // GET /v1/trade/orders/:id/contract
  const contractGetMatch = url.pathname.match(/^\/v1\/trade\/orders\/([^\/]+)\/contract$/);
  if (contractGetMatch && request.method === 'GET') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const orderId = contractGetMatch[1];
    const order = orders.get(orderId);
    if (!order) {
      return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
    }
    check(ctx.org.id === order.buyer_organization_id || ctx.org.id === order.supplier_organization_id || ctx.user.role === 'PLATFORM_ADMIN', 403, 'FORBIDDEN', '계약 당사자만 조회할 수 있습니다.');
    return jsonResponse({
      contract_id: `ct-${orderId}`,
      order_id: orderId,
      order_number: order.order_number,
      parties: {
        buyer: order.buyer_name,
        supplier: order.supplier_name,
      },
      item_title: order.item_title,
      ordered_quantity: order.ordered_quantity,
      unit_price: order.unit_price,
      total_amount_minor: order.total_amount_minor,
      currency: order.currency,
      incoterms: order.incoterms,
      document_hash: order.contract_hash,
      is_signed: order.is_contract_signed,
      signed_at: order.is_contract_signed ? order.signed_at : null,
      jurisdiction: 'ICC International Court of Arbitration (Geneva/Seoul)',
    });
  }

  // POST /v1/trade/orders/:id/contract/sign
  const contractSignMatch = url.pathname.match(/^\/v1\/trade\/orders\/([^\/]+)\/contract\/sign$/);
  if (contractSignMatch && request.method === 'POST') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const orderId = contractSignMatch[1];
    const order = orders.get(orderId);
    if (!order) {
      return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
    }
    check(ctx.org.id === order.buyer_organization_id || ctx.user.role === 'PLATFORM_ADMIN', 403, 'FORBIDDEN', '구매기업만 계약에 서명할 수 있습니다.');

    const body = (await request.json().catch(() => ({}))) as any;
    if (!body.document_hash || !/^[a-f0-9]{64}$/i.test(body.document_hash)) {
      return problemResponse(400, 'INVALID_DOCUMENT_HASH', 'Invalid SHA-256 Hash', 'document_hash must be a valid 64-character SHA-256 hex string');
    }
    const expectedHash = await digest(contractCanonicalBody({
      order_number: order.order_number,
      buyer_organization_id: order.buyer_organization_id,
      supplier_organization_id: order.supplier_organization_id,
      ordered_quantity: order.ordered_quantity,
      unit_price: order.unit_price,
      total_amount_minor: order.total_amount_minor,
      currency: order.currency,
      incoterms: order.incoterms,
    }));
    check(String(body.document_hash).toLowerCase() === expectedHash, 422, 'CONTRACT_HASH_MISMATCH', '계약서 해시가 주문 조건과 일치하지 않습니다.');

    order.is_contract_signed = true;
    order.contract_hash = body.document_hash;
    order.order_status = 'IN_PRODUCTION';
    order.signed_at = new Date().toISOString();

    logAudit(
      'TRADE_CONTRACT_SIGNED',
      ctx?.user?.id || 'user-buyer-001',
      'BUYER_PURCHASER',
      'TRADE_ORDER',
      orderId,
      `Contract electronically signed with SHA-256 digest ${body.document_hash.slice(0, 16)}...`
    );

    return jsonResponse({
      contract_id: `ct-${orderId}`,
      order_id: orderId,
      document_hash: body.document_hash,
      signed: true,
      signed_at: order.signed_at,
      status: 'CONTRACT_SIGNED',
    });
  }

  // POST /v1/trade/orders/:id/confirm-delivery
  const confirmDeliveryMatch = url.pathname.match(/^\/v1\/trade\/orders\/([^\/]+)\/confirm-delivery$/);
  if (confirmDeliveryMatch && request.method === 'POST') {
    const orderId = confirmDeliveryMatch[1];
    const order = orders.get(orderId);
    if (!order) {
      return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
    }

    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    check(ctx.org.id === order.buyer_organization_id || ctx.user.role === 'PLATFORM_ADMIN', 403, 'FORBIDDEN', '구매기업만 수령을 확정할 수 있습니다.');
    order.order_status = 'COMPLETED';
    order.fulfillment_status = 'DELIVERED';
    order.settlement_status = 'RELEASE_ELIGIBLE';

    for (const set of settlements.values()) {
      if (set.order_id === orderId) {
        set.status = 'RELEASE_ELIGIBLE';
      }
    }

    logAudit(
      'TRADE_DELIVERY_CONFIRMED',
      ctx?.user?.id || 'user-buyer-001',
      'BUYER_PURCHASER',
      'TRADE_ORDER',
      orderId,
      `Buyer confirmed receipt of goods for Order ${order.order_number}. Escrow released to eligible status.`
    );

    return jsonResponse({
      order_id: orderId,
      status: 'COMPLETED',
      fulfillment_status: 'DELIVERED',
      settlement_status: 'RELEASE_ELIGIBLE',
      confirmed_at: new Date().toISOString(),
      message: '화물 인수 확인 완료. 판매자 정산 대금이 지급 가능 상태로 승격되었습니다.',
    });
  }

  // POST /v1/trade/samples (Real Sample Order Dispatch)
  if (url.pathname === '/v1/trade/samples' && request.method === 'POST') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const body = (await request.json().catch(() => ({}))) as any;
    const listingId = body.listing_id || '33333333-3333-3333-3333-333333333333';
    const listing = listings.get(listingId);

    const sampleQty = parseInt(body.quantity || 1, 10);
    const samplePrice = parseFloat(body.sample_price || listing?.sample_price || '25.00');
    const totalMinor = Math.round(samplePrice * sampleQty * 100);

    const sampleOrderId = `sample-${Date.now()}`;
    const newSample = {
      id: sampleOrderId,
      order_number: `SMP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      buyer_organization_id: ctx?.org?.id || BUYER_ORG_ID,
      supplier_organization_id: listing?.organization_id || SUPPLIER_ORG_ID,
      buyer_name: ctx?.org?.legal_name || 'Metro Wholesale Imports LLC',
      supplier_name: listing?.supplier_name || 'Precision Korea Co., Ltd. (글로벌정밀산업)',
      item_title: `[유료 샘플] ${listing?.title || 'SUS304 텀블러'}`,
      listing_id: listingId,
      unit_price: samplePrice.toFixed(2),
      ordered_quantity: sampleQty,
      unit: listing?.unit || 'pcs',
      total_amount_minor: totalMinor,
      downpayment_minor: totalMinor,
      balance_minor: 0,
      currency: 'USD',
      order_status: 'IN_PRODUCTION',
      payment_status: 'PAID',
      fulfillment_status: 'PROCESSING',
      dispute_status: 'NONE',
      settlement_status: 'RELEASE_ELIGIBLE',
      shipped_quantity: 0,
      is_contract_signed: true,
      incoterms: 'DDP Express Air',
      lead_time_days: listing?.sample_lead_time_days || 3,
      created_at: new Date().toISOString(),
    };

    orders.set(sampleOrderId, newSample);

    logAudit(
      'SAMPLE_ORDER_CREATED',
      ctx?.user?.id || 'user-buyer-001',
      'BUYER_PURCHASER',
      'SAMPLE_ORDER',
      sampleOrderId,
      `Paid sample order created for ${newSample.item_title}, Total: $${(totalMinor / 100).toFixed(2)}`
    );

    return jsonResponse(newSample, 201);
  }

  // POST /v1/logistics/quote (Incoterms & CBM / Weight Freight & Landed Cost Engine)
  if (url.pathname === '/v1/logistics/quote' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    const destCountry = body.destination_country || 'US';
    const incoterms = (body.incoterms || 'FOB').toUpperCase(); // EXW, FOB, CIF, CFR, DDP, DAP
    const method = body.shipping_method || 'SEA_FCL'; // SEA_FCL, SEA_LCL, AIR, EXPRESS
    const qty = Math.max(1, parseInt(body.quantity || 1000, 10));
    const unitPrice = parseFloat(body.unit_price || 4.20);
    const goodsValue = Number((qty * unitPrice).toFixed(2));

    // Volume & Weight Calculation
    const unitCbm = parseFloat(body.unit_cbm || 0.005); // default 0.005 CBM/pc
    const unitWeightKg = parseFloat(body.unit_weight_kg || 0.45); // default 0.45 kg/pc
    const totalCbm = Number((body.cbm ? parseFloat(body.cbm) : (qty * unitCbm)).toFixed(3));
    const totalGrossWeightKg = Number((body.gross_weight_kg ? parseFloat(body.gross_weight_kg) : (qty * unitWeightKg)).toFixed(1));

    // Volumetric Chargeable Weight (Air: 1 CBM = 167 kg, Sea LCL: 1 CBM = 1000 kg W/M)
    const airChargeableWeightKg = Math.max(totalGrossWeightKg, totalCbm * 167);
    const seaChargeableCbm = Math.max(totalCbm, totalGrossWeightKg / 1000);

    let baseFreightUsd = 0;
    let days = 14;
    let originInlandUsd = 0;
    let destinationInlandUsd = 0;
    let portThcUsd = 0;

    // 1. Inland & Handling based on Incoterms
    if (incoterms === 'EXW') {
      originInlandUsd = Math.max(120, totalCbm * 35);
      portThcUsd = 95.0;
      destinationInlandUsd = Math.max(150, totalCbm * 45);
    } else if (incoterms === 'FOB' || incoterms === 'CFR' || incoterms === 'CIF') {
      originInlandUsd = 0; // Seller responsibility under FOB/CFR/CIF
      portThcUsd = method.startsWith('SEA') ? 95.0 : 45.0;
      destinationInlandUsd = Math.max(150, totalCbm * 45);
    } else if (incoterms === 'DDP') {
      originInlandUsd = 0;
      portThcUsd = 0;
      destinationInlandUsd = 0;
    } else if (incoterms === 'DAP') {
      originInlandUsd = 0;
      portThcUsd = 0;
      destinationInlandUsd = 0;
    }

    // 2. International Freight
    if (method === 'SEA_FCL') {
      const containerCount = Math.max(1, Math.ceil(totalCbm / 28));
      baseFreightUsd = containerCount * (destCountry === 'US' ? 1850.0 : 1650.0);
      days = destCountry === 'US' ? 18 : 24;
    } else if (method === 'SEA_LCL') {
      baseFreightUsd = Math.max(250, Number((seaChargeableCbm * (destCountry === 'US' ? 68.0 : 62.0)).toFixed(2)));
      days = destCountry === 'US' ? 22 : 28;
    } else if (method === 'AIR') {
      baseFreightUsd = Math.max(350, Number((airChargeableWeightKg * 4.80).toFixed(2)));
      days = 5;
    } else {
      baseFreightUsd = Math.max(95, Number((airChargeableWeightKg * 8.50).toFixed(2)));
      days = 3;
    }

    // 3. Insurance (ICC Clause A Marine Cargo All Risks)
    const insuranceUsd = Number((goodsValue * 0.003).toFixed(2));

    // 4. Customs Duty & VAT based on Destination
    const dutyRates: Record<string, number> = { US: 0.035, KR: 0.080, JP: 0.040, DE: 0.055, CN: 0.075 };
    const vatRates: Record<string, number> = { US: 0.0, KR: 0.10, JP: 0.10, DE: 0.19, CN: 0.13 };
    const dutyRate = dutyRates[destCountry] ?? 0.045;
    const vatRate = vatRates[destCountry] ?? 0.0;

    let customsDutyUsd = 0;
    let vatTaxUsd = 0;
    let freightBuyerBears = baseFreightUsd;

    if (incoterms === 'DDP') {
      freightBuyerBears = 0;
      customsDutyUsd = 0;
      vatTaxUsd = 0;
    } else {
      const cifValue = goodsValue + baseFreightUsd + insuranceUsd;
      customsDutyUsd = Number((cifValue * dutyRate).toFixed(2));
      vatTaxUsd = Number(((cifValue + customsDutyUsd) * vatRate).toFixed(2));
    }

    const totalLandedCost = Number((
      goodsValue +
      freightBuyerBears +
      originInlandUsd +
      portThcUsd +
      insuranceUsd +
      customsDutyUsd +
      vatTaxUsd +
      destinationInlandUsd
    ).toFixed(2));

    return jsonResponse({
      destination_country: destCountry,
      incoterms: incoterms,
      shipping_method: method,
      transit_days: days,
      cargo_spec: {
        total_cbm: totalCbm,
        gross_weight_kg: totalGrossWeightKg,
        chargeable_weight_kg: Number(airChargeableWeightKg.toFixed(1)),
        is_fcl_recommended: totalCbm >= 15.0,
      },
      cost_breakdown: {
        goods_subtotal: goodsValue.toFixed(2),
        incoterms_rule: incoterms,
        origin_inland_freight: originInlandUsd.toFixed(2),
        port_terminal_thc: portThcUsd.toFixed(2),
        freight_estimate: freightBuyerBears.toFixed(2),
        marine_insurance: insuranceUsd.toFixed(2),
        customs_duty: customsDutyUsd.toFixed(2),
        duty_rate: `${(dutyRate * 100).toFixed(1)}%`,
        import_vat: vatTaxUsd.toFixed(2),
        vat_rate: `${(vatRate * 100).toFixed(1)}%`,
        destination_inland_delivery: destinationInlandUsd.toFixed(2),
        total_landed_cost: totalLandedCost.toFixed(2),
        unit_landed_cost: (totalLandedCost / qty).toFixed(2),
        currency: 'USD',
      },
    });
  }

  // GET /v1/logistics/tracking/:tracking_no (Milestone Container Tracking)
  const trackingMatch = url.pathname.match(/^\/v1\/logistics\/tracking\/([^\/]+)$/);
  if (trackingMatch && request.method === 'GET') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const trackingNo = trackingMatch[1];
    return jsonResponse({
      tracking_no: trackingNo,
      carrier: 'HMM Global Marine Logistics',
      vessel_name: 'HMM NURI V.004E',
      container_no: `HMMU${trackingNo.slice(0, 7).toUpperCase()}`,
      bill_of_lading: `B/L-KRBUS-${trackingNo.slice(-6).toUpperCase()}`,
      incoterms: 'FOB Busan',
      status: 'AT_SEA',
      origin_port: { name: 'Port of Busan, KR', code: 'KRPUS', departure_at: '2026-10-25T08:00:00Z' },
      destination_port: { name: 'Port of Los Angeles, US', code: 'USLAX', estimated_arrival: '2026-11-12T14:00:00Z' },
      gps_coordinates: { latitude: 33.7490, longitude: -140.2350, speed_knots: 19.4 },
      milestones: [
        { code: 'BOOKED', title: '선복 예약 확정 (Booking Confirmed)', time: '2026-10-22T04:30:00Z', completed: true },
        { code: 'GATE_IN', title: '부산신항 터미널 컨테이너 반입 (Gate In)', time: '2026-10-24T11:15:00Z', completed: true },
        { code: 'DEPARTED', title: '부산항 본선 선적 및 출항 (Vessel Departure)', time: '2026-10-25T08:00:00Z', completed: true },
        { code: 'AT_SEA', title: '태평양 횡단 운항 중 (Trans-Pacific Transit)', time: new Date().toISOString(), completed: true },
        { code: 'ARRIVED', title: 'LA 항만 도착 예정 (Estimated Discharge)', time: '2026-11-12T14:00:00Z', completed: false },
        { code: 'CUSTOMS', title: '미국 세관 수입 통관 심사 (Customs Clearance)', time: '2026-11-13T10:00:00Z', completed: false },
        { code: 'DELIVERED', title: '바이어 지정 보세창고 배송 완료 (Final Delivery)', time: '2026-11-15T16:00:00Z', completed: false },
      ],
    });
  }

  // POST /v1/payments/process (Captures Down Payment 30% or Balance 70%)
  if (url.pathname === '/v1/payments/process' && request.method === 'POST') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const body = (await request.json().catch(() => ({}))) as any;
    const orderId = body.order_id || 'ord-20261018-001';
    const order = orders.get(orderId);
    if (!order) {
      return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
    }
    check(ctx.org.id === order.buyer_organization_id || ctx.user.role === 'PLATFORM_ADMIN', 403, 'FORBIDDEN', '해당 주문의 구매기업만 결제할 수 있습니다.');
    if (!order.is_contract_signed) {
      return problemResponse(422, 'CONTRACT_NOT_SIGNED', 'Contract Not Signed', 'Cannot capture payment: trade contract must be cryptographically signed first');
    }

    const paymentType = body.payment_type || 'DOWN_PAYMENT';
    let amountMinor = order.downpayment_minor;
    if (paymentType === 'BALANCE') {
      amountMinor = order.balance_minor;
      order.payment_status = 'FULLY_PAID';
    } else {
      order.payment_status = 'PARTIALLY_PAID_30';
    }

    logAudit(
      'PAYMENT_CAPTURED',
      ctx?.user?.id || 'user-buyer-001',
      'BUYER_PURCHASER',
      'TRADE_ORDER',
      orderId,
      `Payment captured: ${paymentType}, Amount: $${(amountMinor / 100).toFixed(2)}, PG: PG-CAPTURE`
    );

    return jsonResponse({
      payment_id: crypto.randomUUID(),
      order_id: orderId,
      payment_type: paymentType,
      pg_transaction_id: `PG-CAPTURE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      status: 'PAID',
      amount_minor: amountMinor,
      currency: order.currency,
      ledger_posted: true,
      ledger_entry: {
        debit_account: 'ASSET_CASH_ESCROW_PG',
        credit_account: 'LIABILITY_ESCROW_DEPOSIT',
        amount_minor: amountMinor,
        is_balanced: true,
      },
    });
  }

  // POST /v1/logistics/shipments (Split Shipment Dispatch)
  if (url.pathname === '/v1/logistics/shipments' && request.method === 'POST') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    requireRole(ctx, 'SUPPLIER_SALES', 'PLATFORM_ADMIN');
    const body = (await request.json().catch(() => ({}))) as any;
    const orderId = body.order_id || 'ord-20261018-001';
    const order = orders.get(orderId);
    if (!order) {
      return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
    }

    const dispatchQty = parseInt(body.dispatch_quantity, 10);
    if (isNaN(dispatchQty) || dispatchQty <= 0) {
      return problemResponse(422, 'INVALID_QUANTITY', 'Invalid Dispatch Quantity', 'dispatch_quantity must be a positive integer greater than 0');
    }

    if ((order.shipped_quantity + dispatchQty) > order.ordered_quantity) {
      return problemResponse(
        422,
        'CUMULATIVE_OVERFLOW',
        'Shipment Exceeds Order Limit',
        `Cannot ship ${dispatchQty} pcs; cumulative total (${order.shipped_quantity + dispatchQty}) exceeds contract quantity (${order.ordered_quantity})`
      );
    }

    order.shipped_quantity += dispatchQty;
    order.fulfillment_status = order.shipped_quantity >= order.ordered_quantity ? 'COMPLETED' : 'PARTIALLY_FULFILLED';
    order.order_status = 'SHIPPED';

    const shipmentRecord = {
      shipment_id: crypto.randomUUID(),
      order_id: orderId,
      tracking_number: body.tracking_number || `BL-BUSAN-${Math.floor(100000 + Math.random() * 900000)}`,
      carrier: body.carrier || 'HMM Marine Logistics',
      dispatched_quantity: dispatchQty,
      cumulative_shipped: order.shipped_quantity,
      remaining_quantity: order.ordered_quantity - order.shipped_quantity,
      status: 'IN_TRANSIT',
      documents: {
        bill_of_lading_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
        commercial_invoice_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
        packing_list_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      },
      created_at: new Date().toISOString(),
    };

    logAudit(
      'SHIPMENT_DISPATCHED',
      ctx?.user?.id || 'user-supplier-001',
      'SUPPLIER_SALES',
      'SHIPMENT',
      shipmentRecord.shipment_id,
      `Dispatched ${dispatchQty} pcs for Order ${order.order_number}. Tracking: ${shipmentRecord.tracking_number}`
    );

    return jsonResponse(shipmentRecord, 201);
  }

  // POST /v1/logistics/inspections (Third-Party Quality Inspection)
  const inspectionApproveMatch = url.pathname.match(/^\/v1\/logistics\/inspections\/([^\/]+)\/approve$/);
  if (inspectionApproveMatch && request.method === 'POST') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const orderId = inspectionApproveMatch[1];
    const order = orders.get(orderId);
    if (!order) {
      return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
    }

    order.inspection_status = 'PASSED';
    logAudit(
      'INSPECTION_APPROVED',
      ctx?.user?.id || 'user-buyer-001',
      'BUYER_PURCHASER',
      'TRADE_ORDER',
      orderId,
      `Pre-shipment inspection approved by buyer for Order ${order.order_number}`
    );

    return jsonResponse({
      order_id: orderId,
      inspection_agency: 'SGS Global Testing Services',
      result: 'PASSED',
      aql_standard: 'MIL-STD-105E AQL 2.5 Major / 4.0 Minor',
      approved_at: new Date().toISOString(),
    });
  }

  if (url.pathname === '/v1/logistics/inspections' && request.method === 'POST') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const body = (await request.json().catch(() => ({}))) as any;
    const orderId = body.order_id || 'ord-20261018-001';
    const order = orders.get(orderId);
    if (!order) {
      return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
    }

    order.inspection_status = 'PASSED';
    logAudit(
      'INSPECTION_APPROVED',
      ctx?.user?.id || 'user-buyer-001',
      'BUYER_PURCHASER',
      'TRADE_ORDER',
      orderId,
      `Pre-shipment inspection approved by buyer for Order ${order.order_number}`
    );

    return jsonResponse({
      order_id: orderId,
      inspection_agency: 'SGS Global Testing Services',
      result: 'PASSED',
      aql_standard: 'MIL-STD-105E AQL 2.5 Major / 4.0 Minor',
      approved_at: new Date().toISOString(),
    });
  }

  // ================= TRADE ASSURANCE CLAIMS =================
  if (url.pathname === '/v1/trade/assurance/claims' && request.method === 'GET') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const allClaims = Array.from(tradeAssuranceClaims.values());
    const list = ctx.user.role === 'PLATFORM_ADMIN' ? allClaims : allClaims.filter(c => c.buyer_organization_id === ctx.org.id || c.supplier_organization_id === ctx.org.id);
    return jsonResponse({
      claims: list,
      total_count: list.length,
    });
  }

  if (url.pathname === '/v1/trade/assurance/claims' && request.method === 'POST') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const body = (await request.json().catch(() => ({}))) as any;
    const orderId = body.order_id || 'ord-20261018-001';
    const order = orders.get(orderId);
    const claimAmountMinor = parseInt(body.claim_amount_minor, 10) || 150000;
    const category = body.claim_category || 'QUALITY_DISPUTE';

    const claimId = `claim-${Date.now()}`;
    const claim = {
      id: claimId,
      order_id: orderId,
      buyer_organization_id: buyerOrgId,
      supplier_organization_id: order?.supplier_organization_id || SUPPLIER_ORG_ID,
      claim_amount_minor: claimAmountMinor,
      guarantee_coverage_minor: order?.total_amount_minor || 420000,
      claim_category: category,
      arbitration_status: 'UNDER_REVIEW',
      adjudicated_payout_minor: 0,
      evidence_urls: body.evidence_urls || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    tradeAssuranceClaims.set(claimId, claim);

    logAudit(
      'TRADE_ASSURANCE_CLAIM_FILED',
      ctx?.user?.id || 'user-buyer-001',
      'BUYER_PURCHASER',
      'TRADE_ASSURANCE',
      claimId,
      `Trade Assurance guarantee claim filed for Order ${order?.order_number || orderId}: $${(claimAmountMinor / 100).toFixed(2)}`
    );

    return jsonResponse(claim, 201);
  }

  // ================= CUSTOMS MANIFESTS =================
  if (url.pathname === '/v1/logistics/customs' && request.method === 'GET') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    const list = Array.from(customsDeclarations.values());
    return jsonResponse({
      manifests: list,
      total_count: list.length,
    });
  }

  if (url.pathname === '/v1/logistics/customs' && request.method === 'POST') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    requireRole(ctx, 'SUPPLIER_SALES', 'PLATFORM_ADMIN');
    const body = (await request.json().catch(() => ({}))) as any;
    const orderId = body.order_id || 'ord-20261018-001';
    const declId = `customs-${Date.now()}`;
    const manifest = {
      id: declId,
      shipment_id: body.shipment_id || crypto.randomUUID(),
      order_id: orderId,
      organization_id: ctx?.org?.id || SUPPLIER_ORG_ID,
      declaration_number: body.declaration_number || `EXP-KR-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      port_of_loading: body.port_of_loading || 'Busan Port (KRPUS)',
      port_of_discharge: body.port_of_discharge || 'Los Angeles (USLAX)',
      hs_code: body.hs_code || '7323.93.0000',
      customs_status: 'CLEARED',
      duty_tax_amount_minor: parseInt(body.duty_tax_amount_minor, 10) || 27300,
      customs_broker_name: body.customs_broker_name || 'Pantos Logistics Global',
      export_license_number: body.export_license_number || 'EL-2026-KR-7711',
      cleared_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    customsDeclarations.set(declId, manifest);

    return jsonResponse(manifest, 201);
  }

  // ================= FACTORY QUALITY AUDITS =================
  if (url.pathname === '/v1/catalog/audits' && request.method === 'GET') {
    const list = Array.from(factoryQualityAudits.values());
    return jsonResponse({
      audits: list,
      total_count: list.length,
    });
  }

  if (url.pathname === '/v1/catalog/audits' && request.method === 'POST') {
    check(ctx, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    requireRole(ctx, 'SUPPLIER_SALES', 'PLATFORM_ADMIN');
    const body = (await request.json().catch(() => ({}))) as any;
    const auditId = `audit-${Date.now()}`;
    const audit = {
      id: auditId,
      supplier_organization_id: body.supplier_organization_id || SUPPLIER_ORG_ID,
      auditor_agency: body.auditor_agency || 'SGS',
      audit_standard: body.audit_standard || 'ISO9001',
      overall_rating_score: parseFloat(body.overall_rating_score) || 4.90,
      qc_status: body.qc_status || 'PASSED',
      report_pdf_url: body.report_pdf_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
      audit_date: new Date().toISOString().slice(0, 10),
      expires_at: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
    };
    factoryQualityAudits.set(auditId, audit);

    return jsonResponse(audit, 201);
  }

  return null;
}
