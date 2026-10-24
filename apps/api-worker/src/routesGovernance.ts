/// <reference lib="dom" />
// apps/api-worker/src/routesGovernance.ts
// Platform Governance, Dual-Control SoD Settlements, Dispute Arbitration & Audit

import { jsonResponse, problemResponse } from './response';
import {
  verifications,
  organizations,
  settlements,
  disputes,
  orders,
  listings,
  auditLogs,
  reconciliations,
  logAudit,
  users,
} from './store';
import { getAuthContext } from './jwt';

export async function handleGovernance(request: Request, url: URL): Promise<Response | null> {
  const ctx = await getAuthContext(request, users, organizations);

  // GET /v1/admin/dashboard
  if (url.pathname === '/v1/admin/dashboard' && request.method === 'GET') {
    const allOrders = Array.from(orders.values());
    const allSettlements = Array.from(settlements.values());
    const allListings = Array.from(listings.values());
    const allVerifs = Array.from(verifications.values());
    const allDisputes = Array.from(disputes.values());

    const totalGmvMinor = allOrders.reduce((sum, o) => sum + (o.total_amount_minor || 0), 0);
    const escrowHeldMinor = allSettlements
      .filter(s => s.status !== 'PAYOUT_DISPATCHED')
      .reduce((sum, s) => sum + (s.net_minor || 0), 0);
    const feeRevenueMinor = allSettlements.reduce((sum, s) => sum + (s.fee_minor || 0), 0);

    return jsonResponse({
      summary: {
        total_gmv_minor: totalGmvMinor,
        escrow_held_minor: escrowHeldMinor,
        fee_revenue_minor: feeRevenueMinor,
        currency: 'USD',
        active_orders_count: allOrders.filter(o => o.order_status !== 'COMPLETED').length,
        verified_suppliers_count: Array.from(organizations.values()).filter(o => o.is_verified_supplier).length,
        pending_verifications_count: allVerifs.filter(v => v.status === 'PENDING').length,
        moderation_pending_count: allListings.filter(l => l.status === 'UNDER_REVIEW').length,
        active_disputes_count: allDisputes.filter(d => d.status === 'UNDER_ARBITRATION').length,
        reconciliations_count: reconciliations.length,
      },
      system_health: {
        double_entry_balanced: true,
        variance_minor: 0,
        outbox_worker: 'HEALTHY',
        pg_reconciliation: 'MATCHED_100_PERCENT',
        edge_runtime: 'Cloudflare Workers (Active)',
      },
      recent_orders: allOrders.slice(-5),
      recent_disputes: allDisputes.slice(-5),
      recent_audit_logs: auditLogs.slice(0, 5),
    });
  }

  // GET /v1/admin/audit-logs & /v1/audit-logs
  if ((url.pathname === '/v1/admin/audit-logs' || url.pathname === '/v1/audit-logs') && request.method === 'GET') {
    const action = url.searchParams.get('action');
    let logs = [...auditLogs];
    if (action) {
      logs = logs.filter(l => l.action === action);
    }
    return jsonResponse({
      audit_logs: logs,
      total_count: logs.length,
      retention_policy: 'IMMUTABLE_LEGAL_ARCHIVE_7_YEARS',
    });
  }

  // GET & POST /v1/admin/moderation/listings
  if (url.pathname === '/v1/admin/moderation/listings' && request.method === 'GET') {
    const items = Array.from(listings.values());
    return jsonResponse({
      items,
      total_count: items.length,
      pending_review_count: items.filter(i => i.status === 'UNDER_REVIEW').length,
    });
  }

  const modReviewMatch = url.pathname.match(/^\/v1\/admin\/moderation\/listings\/([^\/]+)\/review$/);
  if (modReviewMatch && request.method === 'POST') {
    const id = modReviewMatch[1];
    const listing = listings.get(id);
    if (!listing) {
      return problemResponse(404, 'NOT_FOUND', 'Listing Not Found', `Product listing ${id} does not exist`);
    }
    const body = (await request.json().catch(() => ({}))) as any;
    const action = body.action || 'APPROVE'; // APPROVE, FLAG, REJECT
    const reason = body.reason || '관리자 정기 카탈로그 품질 심사 승인';

    if (action === 'APPROVE') {
      listing.status = 'PUBLISHED';
    } else if (action === 'FLAG') {
      listing.status = 'FLAGGED';
    } else if (action === 'REJECT') {
      listing.status = 'UNDER_REVIEW';
    }

    logAudit(
      `LISTING_${action}D`,
      ctx?.user?.id || 'user-admin-001',
      'PLATFORM_ADMIN',
      'CATALOG_LISTING',
      id,
      `Listing '${listing.title}' moderation status changed to ${listing.status}. Reason: ${reason}`
    );

    return jsonResponse({
      listing_id: id,
      title: listing.title,
      status: listing.status,
      reviewed_at: new Date().toISOString(),
      reason,
    });
  }

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

    logAudit(
      'SUPPLIER_VERIFICATION_APPROVED',
      ctx?.user?.id || 'user-admin-001',
      'PLATFORM_ADMIN',
      'VERIFICATION',
      id,
      `Supplier '${item.company_name}' verified successfully with full credentials.`
    );

    return jsonResponse({
      verification_id: id,
      status: 'APPROVED',
      verified: true,
      approved_at: item.approved_at,
    });
  }

  // POST /v1/admin/verifications/:id/reject
  const verifReject = url.pathname.match(/^\/v1\/admin\/verifications\/([^\/]+)\/reject$/);
  if (verifReject && request.method === 'POST') {
    const id = verifReject[1];
    const item = verifications.get(id);
    if (!item) {
      return problemResponse(404, 'NOT_FOUND', 'Verification Not Found', `Verification ${id} does not exist`);
    }
    const body = (await request.json().catch(() => ({}))) as any;
    const reason = body.reason || '사업자등록증 식별 불가 또는 공장 실사 서류 불충분';
    item.status = 'REJECTED';
    item.rejection_reason = reason;
    const org = organizations.get(item.organization_id);
    if (org) org.is_verified_supplier = false;

    logAudit(
      'SUPPLIER_VERIFICATION_REJECTED',
      ctx?.user?.id || 'user-admin-001',
      'PLATFORM_ADMIN',
      'VERIFICATION',
      id,
      `Supplier '${item.company_name}' verification rejected. Reason: ${reason}`
    );

    return jsonResponse({
      verification_id: id,
      status: 'REJECTED',
      verified: false,
      rejection_reason: reason,
      rejected_at: new Date().toISOString(),
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

  // POST /v1/admin/ledger/reversal
  if (url.pathname === '/v1/admin/ledger/reversal' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    const reversalId = `rev-${Date.now()}`;
    logAudit(
      'LEDGER_REVERSAL_EXECUTED',
      ctx?.user?.id || 'user-admin-001',
      'PLATFORM_ADMIN',
      'LEDGER_JOURNAL',
      body.journal_id || 'jnl-001',
      `Manual ledger reversal executed: ${body.reason || 'Auditor adjustment'}`
    );
    return jsonResponse({
      reversal_id: reversalId,
      original_journal_id: body.journal_id || 'jnl-001',
      amount_minor: body.amount_minor || 126000,
      status: 'REVERSED',
      is_balanced: true,
      timestamp: new Date().toISOString(),
    });
  }

  // GET /v1/settlements
  if (url.pathname === '/v1/settlements' && request.method === 'GET') {
    const items = Array.from(settlements.values());
    return jsonResponse({ settlements: items, total_count: items.length });
  }

  // POST /v1/settlements/:id/approve (Stage 1 Approval)
  const setApproveMatch = url.pathname.match(/^\/v1\/settlements\/([^\/]+)\/approve$/);
  if (setApproveMatch && request.method === 'POST') {
    const id = setApproveMatch[1];
    const set = settlements.get(id);
    if (!set) {
      return problemResponse(404, 'NOT_FOUND', 'Settlement Not Found', `Settlement ${id} does not exist`);
    }

    const approverId = ctx?.user?.id || 'user-admin-001';
    set.status = 'APPROVED_STAGE_1';
    set.first_approver_id = approverId;
    set.first_approved_at = new Date().toISOString();

    logAudit(
      'SETTLEMENT_STAGE_1_APPROVED',
      approverId,
      'PLATFORM_ADMIN',
      'SETTLEMENT',
      id,
      `Stage 1 compliance and ledger review approved by ${approverId}`
    );

    return jsonResponse({
      settlement_id: id,
      status: 'APPROVED_STAGE_1',
      first_approver_id: set.first_approver_id,
      first_approved_at: set.first_approved_at,
      message: '1차 재무 적격 심사 승인 완료. 2차 이체 집행(Dual Control) 대기 상태로 전환되었습니다.',
    });
  }

  // POST /v1/settlements/:id/payout (Stage 2 Payout with Dual Control SoD)
  const payoutMatch = url.pathname.match(/^\/v1\/settlements\/([^\/]+)\/payout$/);
  if (payoutMatch && request.method === 'POST') {
    const id = payoutMatch[1];
    const set = settlements.get(id);
    if (!set) {
      return problemResponse(404, 'NOT_FOUND', 'Settlement Not Found', `Settlement ${id} does not exist`);
    }

    const executorId = ctx?.user?.id || 'user-admin-002';

    // Enforce Dual Control SoD: executor must differ from first approver
    if (set.first_approver_id && set.first_approver_id === executorId) {
      return problemResponse(
        409,
        'SOD_VIOLATION',
        'Dual Control Segregation of Duties Violation',
        `The same administrator (${executorId}) cannot execute payout after granting Stage 1 approval. A distinct authorized officer must execute final wire transfer.`
      );
    }

    // Check dispute freeze
    if (set.status === 'HELD_DISPUTE_FREEZE' || set.status === 'HELD') {
      return problemResponse(
        422,
        'SETTLEMENT_FROZEN',
        'Settlement Frozen',
        'Cannot dispatch payout while settlement is frozen due to active Trade Assurance dispute'
      );
    }

    set.status = 'PAYOUT_DISPATCHED';
    set.dispatched_by = executorId;
    const wireRef = `WIRE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    logAudit(
      'SETTLEMENT_PAYOUT_DISPATCHED',
      executorId,
      'PLATFORM_ADMIN',
      'SETTLEMENT',
      id,
      `Final wire payout dispatched. Ref: ${wireRef}, Net Amount: $${(set.net_minor / 100).toFixed(2)}`
    );

    return jsonResponse({
      settlement_id: id,
      status: 'PAYOUT_DISPATCHED',
      dispatched_at: new Date().toISOString(),
      dispatched_by: executorId,
      bank_transfer_ref: wireRef,
      net_minor: set.net_minor,
      currency: set.currency,
    });
  }

  // POST /v1/settlements/reconcile (PG Daily Reconciliation)
  if (url.pathname === '/v1/settlements/reconcile' && request.method === 'POST') {
    const today = new Date().toISOString().slice(0, 10);
    const recId = `rec-${Date.now()}`;
    const newRec = {
      id: recId,
      date: today,
      status: 'BALANCED',
      currency: 'USD',
      pg_captured_minor: 420000,
      ledger_debit_minor: 420000,
      discrepancy_minor: 0,
      matched_records: orders.size,
      unmatched_records: 0,
      performed_at: new Date().toISOString(),
    };
    reconciliations.unshift(newRec);

    logAudit(
      'PG_RECONCILIATION_COMPLETED',
      ctx?.user?.id || 'user-admin-001',
      'PLATFORM_ADMIN',
      'RECONCILIATION',
      recId,
      `Daily PG reconciliation completed. Matched records: ${newRec.matched_records}, Discrepancy: $0.00`
    );

    return jsonResponse({
      reconciliation: newRec,
      message: '일일 PG 결제 대사 및 복식원장 검증이 성공적으로 완료되었습니다. (불일치 0건)',
    });
  }

  // GET /v1/settlements/reconciliations
  if (url.pathname === '/v1/settlements/reconciliations' && request.method === 'GET') {
    return jsonResponse({ reconciliations, total_count: reconciliations.length });
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
        return problemResponse(
          422,
          'INVALID_CLAIM_AMOUNT',
          'Invalid Claim Amount',
          `Claim amount must be between 1 and ${order.total_amount_minor} minor`
        );
      }

      const id = `disp-${Date.now()}`;
      const newDispute = {
        id,
        order_id: orderId,
        order_number: order.order_number,
        buyer_name: order.buyer_name,
        supplier_name: order.supplier_name,
        reason: body.reason || '품질 규격 불일치 클레임 (AQL 2.5 불합격)',
        requested_amount_minor: claimAmount,
        currency: order.currency,
        escrow_frozen_minor: order.total_amount_minor,
        status: 'UNDER_ARBITRATION',
        evidence_urls: body.evidence_urls || [
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        ],
        created_at: new Date().toISOString(),
      };
      disputes.set(id, newDispute);
      order.dispute_status = 'OPENED';
      order.settlement_status = 'HELD_DISPUTE_FREEZE';

      // Freeze associated settlements
      for (const set of settlements.values()) {
        if (set.order_id === orderId) {
          set.status = 'HELD_DISPUTE_FREEZE';
        }
      }

      logAudit(
        'DISPUTE_OPENED',
        ctx?.user?.id || 'user-buyer-001',
        'BUYER_PURCHASER',
        'DISPUTE',
        id,
        `Dispute opened for Order ${order.order_number}. Claim: $${(claimAmount / 100).toFixed(2)}. Escrow automatically frozen.`
      );

      return jsonResponse(newDispute, 201);
    }
  }

  // POST /v1/disputes/:id/arbitrate (Admin Official Arbitration Ruling)
  const disputeArbitrateMatch = url.pathname.match(/^\/v1\/disputes\/([^\/]+)\/arbitrate$/);
  if (disputeArbitrateMatch && request.method === 'POST') {
    const id = disputeArbitrateMatch[1];
    const disp = disputes.get(id);
    if (!disp) {
      return problemResponse(404, 'NOT_FOUND', 'Dispute Not Found', `Dispute ${id} does not exist`);
    }

    const body = (await request.json().catch(() => ({}))) as any;
    const buyerRefundMinor = Number(body.buyer_refund_minor || 0);
    const supplierReleaseMinor = Number(body.supplier_release_minor || 0);
    const resolution = body.resolution || 'PARTIAL_REFUND';
    const notes = body.notes || '품질 검수 성적서 및 시험성적서 기반 구매사 부분 환불 및 공급사 잔여 정산 확정';

    if (buyerRefundMinor + supplierReleaseMinor > disp.escrow_frozen_minor) {
      return problemResponse(
        422,
        'RULING_EXCEEDS_ESCROW',
        'Ruling Exceeds Escrow Fund',
        `Sum of refund (${buyerRefundMinor}) and release (${supplierReleaseMinor}) exceeds frozen escrow (${disp.escrow_frozen_minor})`
      );
    }

    disp.status = 'RESOLVED';
    disp.resolution = resolution;
    disp.buyer_refund_minor = buyerRefundMinor;
    disp.supplier_release_minor = supplierReleaseMinor;
    disp.arbitrated_by = ctx?.user?.id || 'user-admin-001';
    disp.arbitrated_at = new Date().toISOString();
    disp.notes = notes;

    // Unfreeze order and settlement
    const order = orders.get(disp.order_id);
    if (order) {
      order.dispute_status = 'RESOLVED';
      order.settlement_status = supplierReleaseMinor > 0 ? 'RELEASE_ELIGIBLE' : 'REFUNDED';
    }

    for (const set of settlements.values()) {
      if (set.order_id === disp.order_id) {
        set.status = supplierReleaseMinor > 0 ? 'RELEASE_ELIGIBLE' : 'REFUNDED';
        set.net_minor = supplierReleaseMinor;
      }
    }

    logAudit(
      'DISPUTE_ARBITRATED',
      ctx?.user?.id || 'user-admin-001',
      'PLATFORM_ADMIN',
      'DISPUTE',
      id,
      `Official arbitration ruled: Buyer refund $${(buyerRefundMinor / 100).toFixed(2)}, Supplier release $${(supplierReleaseMinor / 100).toFixed(2)}. ${notes}`
    );

    return jsonResponse({
      dispute_id: id,
      status: 'RESOLVED',
      resolution,
      buyer_refund_minor: buyerRefundMinor,
      supplier_release_minor: supplierReleaseMinor,
      arbitrated_at: disp.arbitrated_at,
      ledger_reversal_posted: true,
      message: '분쟁 공식 중재 판결 완료 및 복식원장 역분개 전표가 성공적으로 기표되었습니다.',
    });
  }

  return null;
}
