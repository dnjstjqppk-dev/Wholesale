<template>
  <div class="dispute-admin-page">
    <h2>무역 분쟁 중재 콘솔 (Dispute Arbitration)</h2>
    <p class="subtitle">구매사와 공급사 간 클레임을 독립 감사관 권한으로 조사하고 정산 에스크로 대금을 분할 결론짓습니다.</p>

    <div v-if="loading" class="loading-state">
      분쟁 목록을 API 게이트웨이에서 로드 중입니다...
    </div>

    <div v-else-if="error" class="error-banner">
      ⚠️ {{ error }}
    </div>

    <div v-else-if="disputes.length === 0" class="empty-state">
      현재 접수된 분쟁 사건이 없습니다.
    </div>

    <div v-else class="dispute-list">
      <div v-for="d in disputes" :key="d.id" class="disp-card">
        <div class="card-head">
          <div>
            <span class="disp-id">분쟁 #{{ d.id }}</span>
            <span class="ord-ref">주문: {{ d.order_number }}</span>
          </div>
          <span class="status-tag" :class="d.status.toLowerCase()">{{ d.status }}</span>
        </div>

        <div class="parties">
          <div><span>구매 기업:</span> <strong>{{ d.buyer_name }}</strong></div>
          <div><span>공급 기업:</span> <strong>{{ d.supplier_name }}</strong></div>
          <div><span>클레임 청구액:</span> <strong class="claim-val">${{ (d.requested_amount_minor / 100).toFixed(2) }}</strong></div>
        </div>

        <div class="reason-box">
          <p><strong>사유:</strong> {{ d.reason }}</p>
          <p><strong>에스크로 동결액:</strong> ${{ ((d.escrow_frozen_minor || 420000) / 100).toFixed(2) }} (출금 완전 차단)</p>
        </div>

        <div v-if="d.status === 'UNDER_ARBITRATION'" class="arbitration-box">
          <h4>공식 중재 결론 집행 (Arbitrate Escrow)</h4>
          <div class="split-inputs">
            <div>
              <label>바이어 환불 금액 (USD)</label>
              <input v-model.number="d.refundAmount" type="number" />
            </div>
            <div>
              <label>공급사 지급 금액 (USD)</label>
              <input v-model.number="d.payoutAmount" type="number" />
            </div>
            <button class="btn-arbitrate" :disabled="submitting" @click="executeArbitration(d)">
              {{ submitting ? '전표 발행 중...' : '중재 확정 및 복식부기 전표 발행' }}
            </button>
          </div>
          <p class="limit-note">※ 합계는 클레임 청구액(${{ (d.requested_amount_minor / 100).toFixed(2) }})을 초과할 수 없습니다.</p>
        </div>
        <div v-else class="resolved-note">
          ✓ 중재 종결: 합의 분개가 완료되어 에스크로 동결이 해제되었습니다.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';

const loading = ref(true);
const submitting = ref(false);
const error = ref('');
const disputes = ref<any[]>([]);

async function loadDisputes() {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiRequest('/disputes');
    disputes.value = (res.disputes || []).map((d: any) => ({
      ...d,
      refundAmount: Math.round(d.requested_amount_minor / 200),
      payoutAmount: Math.round(d.requested_amount_minor / 200),
    }));
  } catch (err: any) {
    error.value = err.message || '분쟁 목록 로드 실패';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDisputes();
});

async function executeArbitration(d: any) {
  const totalMinor = (d.refundAmount + d.payoutAmount) * 100;
  if (totalMinor > d.requested_amount_minor) {
    alert('오류: 환불액과 지급액의 합계가 총 청구액을 초과할 수 없습니다.');
    return;
  }

  submitting.value = true;
  try {
    const res = await apiRequest(`/disputes/${d.id}/arbitrate`, {
      method: 'POST',
      body: JSON.stringify({
        resolution: 'PARTIAL_REFUND',
        buyer_refund_minor: d.refundAmount * 100,
        supplier_release_minor: d.payoutAmount * 100,
      }),
    });
    d.status = 'RESOLVED';
    alert(`[서버 중재 완료]\n바이어 환불: $${d.refundAmount}\n공급사 정산: $${d.payoutAmount}\n에스크로 동결이 해제되고 회계 역분개가 기록되었습니다.`);
  } catch (err: any) {
    alert(`중재 실패: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.dispute-admin-page { max-width: 1000px; margin: 0 auto; }
h2 { margin: 0 0 6px 0; font-size: 20px; color: #F8FAFC; }
.subtitle { color: #94A3B8; font-size: 13px; margin-bottom: 24px; }
.loading-state, .empty-state { padding: 40px; text-align: center; color: #94A3B8; }
.error-banner { background: #7F1D1D; color: #FECACA; padding: 12px; border-radius: 6px; margin-bottom: 20px; }
.dispute-list { display: flex; flex-direction: column; gap: 20px; }
.disp-card { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 24px; }
.card-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #3A506B; padding-bottom: 12px; margin-bottom: 16px; }
.disp-id { font-weight: 700; color: #38BDF8; font-size: 16px; margin-right: 12px; }
.ord-ref { font-size: 13px; color: #94A3B8; }
.status-tag { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
.status-tag.under_arbitration { background: #854D0E; color: #FEF08A; }
.status-tag.resolved { background: #065F46; color: #A7F3D0; }
.parties { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 13px; margin-bottom: 16px; color: #CBD5E1; }
.claim-val { color: #EF4444; font-variant-numeric: tabular-nums; }
.reason-box { background: #0B132B; border: 1px solid #3A506B; border-radius: 6px; padding: 14px; font-size: 13px; color: #CBD5E1; margin-bottom: 20px; }
.reason-box p { margin: 4px 0; }
.arbitration-box { background: #1E293B; border: 1px solid #475569; border-radius: 6px; padding: 16px; }
.arbitration-box h4 { margin: 0 0 12px 0; font-size: 14px; color: #FFF; }
.split-inputs { display: grid; grid-template-columns: 1fr 1fr auto; gap: 14px; align-items: flex-end; }
.split-inputs label { display: block; font-size: 12px; font-weight: 600; color: #94A3B8; margin-bottom: 4px; }
.split-inputs input { width: 100%; padding: 8px 10px; background: #0F172A; border: 1px solid #3A506B; color: #FFF; border-radius: 4px; box-sizing: border-box; }
.btn-arbitrate { background: #C2410C; color: #FFF; border: none; padding: 10px 18px; border-radius: 4px; font-weight: 700; cursor: pointer; white-space: nowrap; }
.limit-note { font-size: 11px; color: #94A3B8; margin-top: 8px; }
.resolved-note { color: #34D399; font-weight: 600; font-size: 13px; padding-top: 10px; }
</style>
