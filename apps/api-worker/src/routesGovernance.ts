// apps/api-worker/src/routesGovernance.ts
import { jsonResponse, problemResponse } from './response';
import { verifications, organizations, settlements, disputes, orders } from './store';

export async function handleGovernance(request: Request, url: URL): Promise<Response | null> {
  // GET /v1/admin/verifications
  if (url.pathname === '/v1/admin/verifications' && request.method === 'GET') {
    const items = Array.from(verifications.values());
    return jsonResponse({ verifications: items, total_count: items.length });
  }

  // POST /v1/admin/verifications/:id/approve
  const verifApprove = url.pathname.match(/^\/v1\/admin\/verifications\/([^\/]+)\/approve$/);
  if (verifApprove && request.method === 'POST') {
    const id = verifApprove[1];
    const item = verifications.get(id);
    if (!item) {
      return problemResponse(404, 'NOT_FOUND', 'Verification Not Found', `Verification ${id} does not exist`);
    }
    item.status = 'APPROVED';
    item.approved_at = new Date().toISOString();
    const org = organizations.get(item.organization_id);
    if (org) org.is_verified_supplier = true;

    return jsonResponse({
      verification_id: id,
      status: 'APPROVED',
      verified: true,
      approved_at: item.approved_at,
    });
  }

  // GET /v1/admin/ledger/audit
  if (url.pathname === '/v1/admin/ledger/audit' && request.method === 'GET') {
    return jsonResponse({
      audit_timestamp: new Date().toISOString(),
      is_balanced: true,
      currency: 'USD',
      total_debit_minor: 420000,
      total_credit_minor: 420000,
      variance_minor: 0,
      journals: [
        {
          id: 'jnl-001',
          type: 'PAYMENT_CAPTURE_ESCROW',
          amount_minor: 126000,
          debit_account: '1010 자산: PG 정산 대기금',
          credit_account: '2010 부채: 에스크로 보관 예수금',
          memo: '30% Advance Down Payment Capture',
          is_balanced: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'jnl-002',
          type: 'SETTLEMENT_ALLOCATION',
          amount_minor: 21000,
          debit_account: '2010 부채: 에스크로 보관 예수금',
          credit_account: '4010 수익: 플랫폼 중개 수수료',
          memo: '5% Platform Service Fee',
          is_balanced: true,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
    });
  }

  // GET /v1/settlements
  if (url.pathname === '/v1/settlements' && request.method === 'GET') {
    const items = Array.from(settlements.values());
    return jsonResponse({ settlements: items, total_count: items.length });
  }

  // POST /v1/settlements/:id/payout
  const payoutMatch = url.pathname.match(/^\/v1\/settlements\/([^\/]+)\/payout$/);
  if (payoutMatch && request.method === 'POST') {
    const id = payoutMatch[1];
    const set = settlements.get(id);
    if (!set) {
      return problemResponse(404, 'NOT_FOUND', 'Settlement Not Found', `Settlement ${id} does not exist`);
    }
    set.status = 'PAYOUT_DISPATCHED';
    return jsonResponse({
      settlement_id: id,
      status: 'PAYOUT_DISPATCHED',
      dispatched_at: new Date().toISOString(),
      bank_transfer_ref: `WIRE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    });
  }

  // GET & POST /v1/disputes
  if (url.pathname === '/v1/disputes') {
    if (request.method === 'GET') {
      const items = Array.from(disputes.values());
      return jsonResponse({ disputes: items, total_count: items.length });
    }
    if (request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      const orderId = body.order_id || 'ord-20261018-001';
      const order = orders.get(orderId);
      if (!order) {
        return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
      }

      const claimAmount = Number(body.requested_amount_minor || 120000);
      if (claimAmount <= 0 || claimAmount > order.total_amount_minor) {
        return problemResponse(422, 'INVALID_CLAIM_AMOUNT', 'Invalid Claim Amount', `Claim amount must be between 1 and ${order.total_amount_minor} minor`);
      }

      const id = `disp-${Date.now()}`;
      const newDispute = {
        id,
        order_id: orderId,
        order_number: order.order_number,
        buyer_name: order.buyer_name,
        supplier_name: order.supplier_name,
        reason: body.reason || '품질 규격 불일치 클레임',
        requested_amount_minor: claimAmount,
        currency: order.currency,
        escrow_frozen_minor: order.total_amount_minor,
        status: 'UNDER_ARBITRATION',
        created_at: new Date().toISOString(),
      };
      disputes.set(id, newDispute);
      order.dispute_status = 'OPENED';
      order.settlement_status = 'HELD_DISPUTE_FREEZE';

      return jsonResponse(newDispute, 201);
    }
  }

  return null;
}

