import { jsonResponse, problemResponse } from './response';
import { mockOrders, mockVerifications, mockDisputes, mockSettlements } from './mockData';

const processedIdempotencyKeys = new Set<string>();

export async function handleTradeAndSettlement(request: Request, url: URL): Promise<Response | null> {
  // Accept Quote (Idempotent)
  const quoteAcceptMatch = url.pathname.match(/^\/v1\/sourcing\/quotes\/([^\/]+)\/accept$/);
  if (quoteAcceptMatch && request.method === 'POST') {
    const idempKey = request.headers.get('Idempotency-Key');
    if (idempKey && processedIdempotencyKeys.has(idempKey)) {
      return problemResponse(409, 'DUPLICATE_REQUEST', 'Duplicate Idempotency Key', 'This quote acceptance has already been processed');
    }
    if (idempKey) processedIdempotencyKeys.add(idempKey);
    const orderId = `ord-${Date.now()}`;
    const newOrder = {
      id: orderId,
      order_number: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      buyer_name: 'Metro Wholesale Imports LLC',
      supplier_name: 'Precision Korea Co., Ltd.',
      item_title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩',
      total_amount_minor: 480000,
      currency: 'USD',
      order_status: 'CONTRACT_PENDING',
      payment_status: 'DOWN_PAYMENT_PENDING',
      fulfillment_status: 'UNFULFILLED',
      dispute_status: 'NONE',
      settlement_status: 'HELD_ESCROW',
      ordered_quantity: 1000,
      shipped_quantity: 0,
      is_contract_signed: false,
      created_at: new Date().toISOString(),
    };
    mockOrders.unshift(newOrder);
    return jsonResponse(newOrder, 201);
  }

  // Trade Orders
  if (url.pathname === '/v1/trade/orders' && request.method === 'GET') {
    return jsonResponse({
      orders: mockOrders,
      total_count: mockOrders.length,
    });
  }

  // Contract Sign
  const contractSignMatch = url.pathname.match(/^\/v1\/trade\/orders\/([^\/]+)\/contract\/sign$/);
  if (contractSignMatch && request.method === 'POST') {
    const id = contractSignMatch[1];
    const order = mockOrders.find(o => o.id === id || o.order_number === id) || mockOrders[0];
    if (order) {
      order.is_contract_signed = true;
      order.order_status = 'IN_PRODUCTION';
    }
    return jsonResponse({
      contract_id: crypto.randomUUID(),
      document_hash: 'c67469723725e6e026620593dd2a466a9d184ffbe6cf2ab82a725e1a3d02b557',
      signed: true,
      signed_at: new Date().toISOString(),
      status: 'CONTRACT_SIGNED',
    });
  }

  // Payments Process
  if (url.pathname === '/v1/payments/process' && request.method === 'POST') {
    const order = mockOrders[0];
    if (order) order.payment_status = 'PARTIALLY_PAID_30';
    return jsonResponse({
      payment_id: crypto.randomUUID(),
      pg_transaction_id: `PG-TX-${crypto.randomUUID().slice(0, 8)}`,
      status: 'PAID',
      amount_minor: '144000',
      currency: 'USD',
      ledger_posted: true,
    });
  }

  // Logistics Split Shipment Dispatch
  if (url.pathname === '/v1/logistics/shipments' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    const order = mockOrders.find(o => o.order_number === body.order_number) || mockOrders[0];
    const dispatchQty = parseInt(body.dispatch_quantity || '0', 10);
    if (order && (order.shipped_quantity + dispatchQty) > order.ordered_quantity) {
      return problemResponse(422, 'CUMULATIVE_OVERFLOW', 'Shipment Exceeds Order Quantity', `Cannot ship ${dispatchQty} pcs; cumulative would exceed ${order.ordered_quantity}`);
    }
    if (order) {
      order.shipped_quantity += dispatchQty;
      order.fulfillment_status = order.shipped_quantity >= order.ordered_quantity ? 'COMPLETED' : 'PARTIALLY_FULFILLED';
    }
    return jsonResponse(
      {
        shipment_id: crypto.randomUUID(),
        tracking_number: body.tracking_number || `BL-BUSAN-${Math.floor(100000 + Math.random() * 900000)}`,
        carrier: body.carrier || 'HMM Marine Logistics',
        status: 'IN_TRANSIT',
        cumulative_shipped: order ? order.shipped_quantity : dispatchQty,
        created_at: new Date().toISOString(),
      },
      201
    );
  }

  // Admin Verifications
  if (url.pathname === '/v1/admin/verifications' && request.method === 'GET') {
    return jsonResponse({
      verifications: mockVerifications,
      total_count: mockVerifications.length,
    });
  }

  const verifApproveMatch = url.pathname.match(/^\/v1\/admin\/verifications\/([^\/]+)\/approve$/);
  if (verifApproveMatch && request.method === 'POST') {
    const id = verifApproveMatch[1];
    const item = mockVerifications.find(v => v.id === id);
    if (item) {
      item.status = 'APPROVED';
      item.approved_at = new Date().toISOString();
    }
    return jsonResponse({
      verification_id: id,
      status: 'APPROVED',
      verified: true,
      approved_at: new Date().toISOString(),
    });
  }

  // Admin Double-Entry Ledger Audit
  if (url.pathname === '/v1/admin/ledger/audit' && request.method === 'GET') {
    return jsonResponse({
      audit_timestamp: new Date().toISOString(),
      is_balanced: true,
      currency: 'USD',
      total_debit_minor: 420000,
      total_credit_minor: 420000,
      variance_minor: 0,
      journal_entries_count: 8,
    });
  }

  // Disputes
  if (url.pathname === '/v1/disputes') {
    if (request.method === 'GET') {
      return jsonResponse({
        disputes: mockDisputes,
        total_count: mockDisputes.length,
      });
    }
    if (request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      const newDispute = {
        id: `disp-${Date.now()}`,
        order_number: body.order_number || 'ORD-20261018-001',
        buyer_name: 'Metro Wholesale Imports LLC',
        supplier_name: 'Precision Korea Co., Ltd.',
        reason: body.reason || '품질 규격 불일치 클레임',
        requested_amount_minor: body.requested_amount_minor || 120000,
        currency: 'USD',
        escrow_frozen_minor: 420000,
        status: 'UNDER_ARBITRATION',
        created_at: new Date().toISOString(),
      };
      mockDisputes.unshift(newDispute);
      return jsonResponse(newDispute, 201);
    }
  }

  // Dispute Arbitration Decision
  const disputeArbitrateMatch = url.pathname.match(/^\/v1\/disputes\/([^\/]+)\/arbitrate$/);
  if (disputeArbitrateMatch && request.method === 'POST') {
    const id = disputeArbitrateMatch[1];
    const body = (await request.json().catch(() => ({}))) as any;
    const dispute = mockDisputes.find(d => d.id === id);
    if (dispute) dispute.status = 'RESOLVED';
    return jsonResponse({
      dispute_id: id,
      resolution: body.resolution || 'PARTIAL_REFUND',
      buyer_refund_minor: body.refund_minor || 36000,
      supplier_release_minor: body.payout_minor || 84000,
      arbitrated_at: new Date().toISOString(),
      escrow_unfrozen: true,
    });
  }

  // Settlements
  if (url.pathname === '/v1/settlements' && request.method === 'GET') {
    return jsonResponse({
      settlements: mockSettlements,
      total_count: mockSettlements.length,
    });
  }

  // Settlement Payout Wire Release
  const settlementPayoutMatch = url.pathname.match(/^\/v1\/settlements\/([^\/]+)\/payout$/);
  if (settlementPayoutMatch && request.method === 'POST') {
    const id = settlementPayoutMatch[1];
    const set = mockSettlements.find(s => s.id === id);
    if (set) set.status = 'PAID_OUT';
    return jsonResponse({
      settlement_id: id,
      status: 'PAID_OUT',
      dispatched_at: new Date().toISOString(),
      wire_ref: `WIRE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    });
  }

  return null;
}
