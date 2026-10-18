<template>
  <div class="dispute-admin-page">
    <h2>무역 분쟁 중재 콘솔 (Dispute Arbitration)</h2>
    <p class="subtitle">구매사와 공급사 간 클레임을 독립 감사관 권한으로 조사하고 정산 에스크로 대금을 분할 결론짓습니다.</p>

    <div class="dispute-list">
      <div v-for="d in disputes" :key="d.id" class="disp-card">
        <div class="card-head">
          <div>
            <span class="disp-id">분쟁 #{{ d.id }}</span>
            <span class="ord-ref">주문: {{ d.order_number }}</span>
          </div>
          <span class="status-tag" :class="d.status.toLowerCase()">{{ d.status }}</span>
        </div>

        <div class="parties">
          <div><span>구매 기업:</span> <strong>Metro Wholesale Imports</strong></div>
          <div><span>공급 기업:</span> <strong>Precision Korea</strong></div>
          <div><span>클레임 청구액:</span> <strong class="claim-val">${{ d.claim_amount }}</strong></div>
        </div>

        <div class="reason-box">
          <p><strong>사유:</strong> {{ d.reason }}</p>
          <p><strong>하자 내용:</strong> 2차 출고분 400개 중 80개에서 진공 밀폐 결함 발생 (SGS 시험성적서 첨부 확인)</p>
        </div>

        <div v-if="d.status === 'OPENED'" class="arbitration-box">
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
            <button class="btn-arbitrate" @click="executeArbitration(d)">
              중재 확정 및 복식부기 전표 발행
            </button>
          </div>
          <p class="limit-note">※ 합계는 클레임 청구액(${{ d.claim_amount }})을 초과할 수 없습니다.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const disputes = ref([
  {
    id: 'DISP-2026-001',
    order_number: 'ORD-2026-0001',
    status: 'OPENED',
    claim_amount: '1500.00',
    reason: '규격 불일치 및 불량률 기준치 초과 (DEFECTIVE_BATCH)',
    refundAmount: 750,
    payoutAmount: 750,
  },
]);

function executeArbitration(d: any) {
  if (d.refundAmount + d.payoutAmount > parseFloat(d.claim_amount)) {
    alert('오류: 환불액과 지급액의 합계가 총 청구액을 초과할 수 없습니다.');
    return;
  }
  d.status = 'RESOLVED';
  alert(`중재가 확정되었습니다.\n바이어 환불: $${d.refundAmount}\n공급사 정산: $${d.payoutAmount}\n원장에 정정 분개가 반영되었습니다.`);
}
</script>

<style scoped>
.dispute-admin-page { max-width: 1000px; margin: 0 auto; }
h2 { margin: 0 0 6px 0; font-size: 20px; color: #F8FAFC; }
.subtitle { color: #94A3B8; font-size: 13px; margin-bottom: 24px; }
.dispute-list { display: flex; flex-direction: column; gap: 20px; }
.disp-card { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 24px; }
.card-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #3A506B; padding-bottom: 12px; margin-bottom: 16px; }
.disp-id { font-weight: 700; color: #38BDF8; font-size: 16px; margin-right: 12px; }
.ord-ref { font-size: 13px; color: #94A3B8; }
.status-tag { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
.status-tag.opened { background: #7F1D1D; color: #FECACA; }
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
</style>
