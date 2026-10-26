/// <reference lib="dom" />
// apps/api-worker/src/routesTrade.ts
// Trade Orders, Cart Management, Multi-tier Pricing, Sample Orders, Logistics & Payments

import { jsonResponse, problemResponse } from './response';
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
} from './store';
import { getAuthContext } from './jwt';

export async function handleTrade(request: Request, url: URL): Promise<Response | null> {
  const ctx = await getAuthContext(request, users, organizations);
  const buyerOrgId = ctx?.org?.id || BUYER_ORG_ID;

  // ================= CART ENDPOINTS =================
  // GET /v1/cart
  if (url.pathname === '/v1/cart' && request.method === 'GET') {
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

    const moq = parseInt(listing.moq, 10);
    if (qty < moq) {
      return problemResponse(422, 'BELOW_MOQ', 'Below Minimum Order Quantity', `Quantity (${qty}) cannot be less than MOQ (${moq})`);
    }

    // Determine unit price from price_tiers
    let unitPrice = parseFloat(listing.price_tiers[0]?.unit_price || '5.00');
    for (const tier of listing.price_tiers) {
      const minQ = parseInt(tier.min_quantity, 10);
      const maxQ = tier.max_quantity ? parseInt(tier.max_quantity, 10) : Infinity;
      if (qty >= minQ && qty <= maxQ) {
        unitPrice = parseFloat(tier.unit_price);
        break;
      }
    }

    const items = carts.get(buyerOrgId) || [];
    const existingIndex = items.findIndex(i => i.listing_id === listingId);
    const totalPrice = (unitPrice * qty).toFixed(2);

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
      const moq = parseInt(listing.moq, 10);
      if (qty < moq) {
        return problemResponse(422, 'BELOW_MOQ', 'Below Minimum Order Quantity', `Quantity (${qty}) cannot be less than MOQ (${moq})`);
      }
      for (const tier of listing.price_tiers) {
        const minQ = parseInt(tier.min_quantity, 10);
        const maxQ = tier.max_quantity ? parseInt(tier.max_quantity, 10) : Infinity;
        if (qty >= minQ && qty <= maxQ) {
          item.unit_price = parseFloat(tier.unit_price).toFixed(2);
          break;
        }
      }
    }

    item.quantity = qty;
    item.total_price = (parseFloat(item.unit_price) * qty).toFixed(2);
    carts.set(buyerOrgId, items);

    return jsonResponse({ success: true, item, items });
  }

  // DELETE /v1/cart/items/:id
  const cartDelMatch = url.pathname.match(/^\/v1\/cart\/items\/([^\/]+)$/);
  if (cartDelMatch && request.method === 'DELETE') {
    const cartItemId = cartDelMatch[1];
    let items = carts.get(buyerOrgId) || [];
    items = items.filter(i => i.id !== cartItemId);
    carts.set(buyerOrgId, items);
    return jsonResponse({ success: true, cart_items_count: items.length, items });
  }

  // ================= TRADE ORDERS ENDPOINTS =================
  // GET /v1/trade/orders
  if (url.pathname === '/v1/trade/orders' && request.method === 'GET') {
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
    return jsonResponse({ orders: orderList, total_count: orderList.length });
  }

  // POST /v1/trade/orders (Create Order from Checkout / PDP)
  if (url.pathname === '/v1/trade/orders' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    const listingId = body.listing_id || '33333333-3333-3333-3333-333333333333';
    const listing = listings.get(listingId);

    const qty = parseInt(body.quantity || 1000, 10);
    const unitPrice = parseFloat(body.unit_price || listing?.price_tiers[0]?.unit_price || '4.20');
    const totalAmountMinor = Math.round(unitPrice * qty * 100);
    const downpaymentMinor = Math.round(totalAmountMinor * 0.30);
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
      currency: body.currency || 'USD',
      order_status: 'CONTRACT_PENDING',
      payment_status: 'DOWN_PAYMENT_PENDING',
      fulfillment_status: 'UNFULFILLED',
      dispute_status: 'NONE',
      settlement_status: 'HELD_ESCROW',
      shipped_quantity: 0,
      is_contract_signed: false,
      contract_hash: 'c67469723725e6e026620593dd2a466a9d184ffbe6cf2ab82a725e1a3d02b557',
      incoterms: body.incoterms || 'FOB Busan Port',
      shipping_address: body.shipping_address || '450 Lexington Ave, New York, NY 10017, USA',
      created_at: new Date().toISOString(),
    };

    orders.set(orderId, newOrder);

    // Create settlement record
    const setFeeMinor = Math.round(totalAmountMinor * 0.05);
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
    const order = orders.get(orderDetailMatch[1]);
    if (!order) {
      return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderDetailMatch[1]} was not found`);
    }
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
    const approverUserId = body.approver_user_id || ctx?.user?.id || 'user-buyer-002';

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
    const orderId = contractGetMatch[1];
    const order = orders.get(orderId);
    if (!order) {
      return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
    }
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
    const orderId = contractSignMatch[1];
    const order = orders.get(orderId);
    if (!order) {
      return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
    }

    const body = (await request.json().catch(() => ({}))) as any;
    if (!body.document_hash || body.document_hash.length !== 64) {
      return problemResponse(400, 'INVALID_DOCUMENT_HASH', 'Invalid SHA-256 Hash', 'document_hash must be a valid 64-character SHA-256 hex string');
    }

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

  // POST /v1/logistics/quote (Freight & Landed Cost Calculation)
  if (url.pathname === '/v1/logistics/quote' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    const destCountry = body.destination_country || 'US';
    const method = body.shipping_method || 'SEA_FCL'; // SEA_FCL, SEA_LCL, AIR, EXPRESS
    const qty = parseInt(body.quantity || 1000, 10);
    const unitPrice = parseFloat(body.unit_price || 4.20);
    const goodsValue = qty * unitPrice;

    let freightUsd = 0;
    let days = 14;
    if (method === 'SEA_FCL') {
      freightUsd = 1850.0;
      days = 21;
    } else if (method === 'SEA_LCL') {
      freightUsd = Math.max(350, qty * 0.45);
      days = 25;
    } else if (method === 'AIR') {
      freightUsd = Math.max(450, qty * 1.80);
      days = 5;
    } else {
      freightUsd = Math.max(120, qty * 2.50);
      days = 3;
    }

    const insuranceUsd = Number((goodsValue * 0.003).toFixed(2));
    const dutyRate = destCountry === 'US' ? 0.035 : 0.045;
    const customsDutyUsd = Number(((goodsValue + freightUsd) * dutyRate).toFixed(2));
    const totalLandedCost = Number((goodsValue + freightUsd + insuranceUsd + customsDutyUsd).toFixed(2));

    return jsonResponse({
      destination_country: destCountry,
      shipping_method: method,
      transit_days: days,
      cost_breakdown: {
        goods_subtotal: goodsValue.toFixed(2),
        freight_estimate: freightUsd.toFixed(2),
        marine_insurance: insuranceUsd.toFixed(2),
        customs_duty: customsDutyUsd.toFixed(2),
        duty_rate: `${(dutyRate * 100).toFixed(1)}%`,
        total_landed_cost: totalLandedCost.toFixed(2),
        unit_landed_cost: (totalLandedCost / qty).toFixed(2),
        currency: 'USD',
      },
    });
  }

  // POST /v1/payments/process (Captures Down Payment 30% or Balance 70%)
  if (url.pathname === '/v1/payments/process' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    const orderId = body.order_id || 'ord-20261018-001';
    const order = orders.get(orderId);
    if (!order) {
      return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
    }
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
    const list = Array.from(tradeAssuranceClaims.values());
    return jsonResponse({
      claims: list,
      total_count: list.length,
    });
  }

  if (url.pathname === '/v1/trade/assurance/claims' && request.method === 'POST') {
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
    const list = Array.from(customsDeclarations.values());
    return jsonResponse({
      manifests: list,
      total_count: list.length,
    });
  }

  if (url.pathname === '/v1/logistics/customs' && request.method === 'POST') {
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
