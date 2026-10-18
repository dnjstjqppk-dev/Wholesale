/// <reference lib="dom" />
// apps/api-worker/src/routesTrade.ts
import { jsonResponse, problemResponse } from './response';
import { orders, users, organizations } from './store';
import { getAuthContext } from './jwt';

export async function handleTrade(request: Request, url: URL): Promise<Response | null> {
  // GET /v1/trade/orders
  if (url.pathname === '/v1/trade/orders' && request.method === 'GET') {
    const ctx = await getAuthContext(request, users, organizations);
    let orderList = Array.from(orders.values());

    if (ctx) {
      if (ctx.user.role === 'PLATFORM_ADMIN') {
        // Admin sees all
      } else {
        // Tenant isolated
        orderList = orderList.filter(
          o => o.buyer_organization_id === ctx.org.id || o.supplier_organization_id === ctx.org.id
        );
      }
    }
    return jsonResponse({ orders: orderList, total_count: orderList.length });
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

    return jsonResponse({
      contract_id: crypto.randomUUID(),
      order_id: orderId,
      document_hash: body.document_hash,
      signed: true,
      signed_at: new Date().toISOString(),
      status: 'CONTRACT_SIGNED',
    });
  }

  // POST /v1/payments/process
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

    const downpaymentMinor = order.downpayment_minor || Math.round(order.total_amount_minor * 0.30);
    order.payment_status = 'PARTIALLY_PAID_30';

    return jsonResponse({
      payment_id: crypto.randomUUID(),
      order_id: orderId,
      pg_transaction_id: `PG-CAPTURE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      status: 'PAID',
      amount_minor: downpaymentMinor,
      currency: order.currency,
      ledger_posted: true,
      ledger_entry: {
        debit_account: 'ASSET_CASH_ESCROW_PG',
        credit_account: 'LIABILITY_ESCROW_DEPOSIT',
        amount_minor: downpaymentMinor,
        is_balanced: true,
      },
    });
  }

  // POST /v1/logistics/shipments
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
      return problemResponse(422, 'CUMULATIVE_OVERFLOW', 'Shipment Exceeds Order Limit', 
        `Cannot ship ${dispatchQty} pcs; cumulative total (${order.shipped_quantity + dispatchQty}) exceeds contract quantity (${order.ordered_quantity})`);
    }

    order.shipped_quantity += dispatchQty;
    order.fulfillment_status = order.shipped_quantity >= order.ordered_quantity ? 'COMPLETED' : 'PARTIALLY_FULFILLED';

    return jsonResponse({
      shipment_id: crypto.randomUUID(),
      order_id: orderId,
      tracking_number: body.tracking_number || `BL-BUSAN-${Math.floor(100000 + Math.random() * 900000)}`,
      carrier: body.carrier || 'HMM Marine Logistics',
      dispatched_quantity: dispatchQty,
      cumulative_shipped: order.shipped_quantity,
      status: 'IN_TRANSIT',
      created_at: new Date().toISOString(),
    }, 201);
  }

  return null;
}

