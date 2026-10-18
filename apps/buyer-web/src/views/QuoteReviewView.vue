<template>
  <div class="quote-review-page">
    <div class="header-bar">
      <h2>견적서 검토 및 기업 결재 (Quote #{{ quote.id.slice(0, 8) }})</h2>
      <span class="status-tag" :class="quote.status.toLowerCase()">{{ quote.status }}</span>
    </div>

    <div class="grid-layout">
      <div class="main-col">
        <div class="card">
          <h3>공급사 제출 최신 견적 (Revision #{{ quote.current_revision.revision_number }})</h3>
          <div class="info-grid">
            <div><span class="lbl">공급사명:</span> <strong>{{ quote.supplier_name }} (Verified)</strong></div>
            <div><span class="lbl">제안 단가:</span> <strong class="price">${{ quote.current_revision.unit_price }} / pcs</strong></div>
            <div><span class="lbl">납기:</span> <strong>발주일로부터 {{ quote.current_revision.lead_time_days }}일</strong></div>
            <div><span class="lbl">무역 조건:</span> <strong>{{ quote.current_revision.incoterms }}</strong></div>
          </div>
        </div>

        <div class="card">
          <h3>견적 리비전 변경 이력 (Revision History)</h3>
          <div v-for="rev in quote.revisions" :key="rev.revision_number" class="rev-row">
            <span class="rev-num">Rev {{ rev.revision_number }}</span>
            <span class="rev-status" :class="rev.status.toLowerCase()">{{ rev.status }}</span>
            <span class="rev-price">${{ rev.unit_price }}</span>
            <span class="rev-date">{{ rev.created_at }}</span>
          </div>
        </div>
      </div>

      <div class="side-col">
        <div class="card approval-card">
          <h3>구매 기업 내부 결재 (Approval)</h3>
          <div class="user-info">
            <p><strong>발주 기안자:</strong> 김구매 선임 (BUYER_PURCHASER)</p>
            <p><strong>승인 결재자:</strong> 박팀장 수석 (BUYER_APPROVER)</p>
          </div>
          <div class="alert-sod">
            ⚠️ <strong>직무 분리(SoD) 원칙:</strong> 기안자 본인은 본 견적을 승인할 수 없으며 승인 권한자 결재 후 발주 전환됩니다.
          </div>
          <button class="btn-accept" :disabled="quote.status !== 'ISSUED'" @click="handleAccept">
            결재 승인 및 무역계약 생성 (Accept)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const quote = ref({
  id: '55555555-5555-5555-5555-555555555555',
  supplier_name: 'Precision Korea Co., Ltd.',
  status: 'ISSUED',
  current_revision: {
    revision_number: 2,
    unit_price: '4.80',
    lead_time_days: 14,
    incoterms: 'FOB Busan (Incoterms 2020)',
    status: 'ISSUED',
  },
  revisions: [
    { revision_number: 2, unit_price: '4.80', status: 'ISSUED', created_at: '2026-10-18 14:00' },
    { revision_number: 1, unit_price: '5.20', status: 'SUPERSEDED', created_at: '2026-10-17 11:30' },
  ],
});

function handleAccept() {
  alert('견적이 승인되어 정식 도매 거래 계약(Trade Contract)이 생성되었습니다.');
  router.push('/ko/KRW/orders/ORD-2026-0001/contract');
}
</script>

<style scoped>
.quote-review-page { max-width: 1000px; margin: 0 auto; }
.header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.header-bar h2 { margin: 0; font-size: 20px; color: #172B4D; }
.status-tag { padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; background: #DBEAFE; color: #1D4ED8; }
.grid-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
.card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
.card h3 { font-size: 15px; margin: 0 0 16px 0; color: #172B4D; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
.lbl { color: #64748B; margin-right: 4px; }
.price { color: #C2410C; font-size: 16px; font-variant-numeric: tabular-nums; }
.rev-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; }
.rev-num { font-weight: 700; color: #172B4D; }
.rev-status.issued { color: #15803D; font-weight: 600; }
.rev-status.superseded { color: #94A3B8; }
.approval-card { background: #F8FAFC; }
.user-info p { font-size: 13px; margin: 6px 0; color: #42526E; }
.alert-sod { background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 6px; padding: 10px; font-size: 11px; color: #92400E; margin: 16px 0; }
.btn-accept { width: 100%; background: #C2410C; color: #FFF; border: none; padding: 12px; border-radius: 6px; font-weight: 700; cursor: pointer; }
</style>

