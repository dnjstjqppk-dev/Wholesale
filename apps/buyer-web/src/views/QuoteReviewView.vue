<template>
  <div class="ws-page ws-page-narrow">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Quote #{{ quote.id.slice(0, 8) }}</p>
      <div class="ws-page-head-row">
        <h1 class="ws-page-title">견적서 검토·결재</h1>
        <span class="ws-badge ws-badge-info">{{ quote.status }}</span>
      </div>
    </div>

    <div class="qr-grid">
      <div class="ws-stack">
        <section class="ws-card">
          <div class="ws-card-head"><h3>공급사 제출 최신 견적 · Rev {{ quote.current_revision.revision_number }}</h3></div>
          <table class="ws-spec-table">
            <tbody>
              <tr><th>공급사명</th><td><b>{{ quote.supplier_name }}</b> <span class="ws-badge ws-badge-success">Verified</span></td></tr>
              <tr><th>제안 단가</th><td><b class="ws-price ws-price-lg ws-figure">${{ quote.current_revision.unit_price }}</b> / pcs</td></tr>
              <tr><th>납기</th><td>발주일로부터 <b>{{ quote.current_revision.lead_time_days }}일</b></td></tr>
              <tr><th>무역 조건</th><td>{{ quote.current_revision.incoterms }}</td></tr>
            </tbody>
          </table>
        </section>

        <section class="ws-card">
          <div class="ws-card-head"><h3>리비전 변경 이력</h3></div>
          <div class="ws-table-wrap">
            <table class="ws-table">
              <thead><tr><th>Rev</th><th>상태</th><th class="ws-num">단가</th><th>일시</th></tr></thead>
              <tbody>
                <tr v-for="rev in quote.revisions" :key="rev.revision_number">
                  <td class="ws-cell-main">Rev {{ rev.revision_number }}</td>
                  <td><span class="ws-badge ws-badge-success">{{ rev.status }}</span></td>
                  <td class="ws-num ws-figure">${{ rev.unit_price }}</td>
                  <td class="ws-cell-sub">{{ rev.created_at }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside class="ws-card approval">
        <div class="ws-card-head"><h3>내부 결재</h3></div>
        <p class="ws-small"><b>발주 기안자</b><br />김구매 선임 (BUYER_PURCHASER)</p>
        <p class="ws-small"><b>승인 결재자</b><br />박팀장 수석 (BUYER_APPROVER)</p>
        <div class="ws-banner ws-banner-warning">
          <WsIcon name="alert" :size="16" />
          <span><b>직무 분리(SoD):</b> 기안자 본인은 승인할 수 없으며 승인권자 결재 후 발주 전환됩니다.</span>
        </div>
        <button class="ws-btn ws-btn-primary ws-btn-block" :disabled="quote.status !== 'ISSUED' || accepting" @click="handleAccept">
          <span v-if="accepting" class="ws-spinner"></span>
          {{ accepting ? '결재 처리 중...' : '결재 승인·계약 생성' }}
        </button>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const accepting = ref(false);

const quote = ref({
  id: 'quote-001',
  supplier_name: 'Precision Korea Co., Ltd.',
  status: 'ISSUED',
  current_revision: {
    revision_number: 1,
    unit_price: '4.20',
    lead_time_days: 14,
    incoterms: 'FOB Busan Port',
    status: 'ISSUED',
  },
  revisions: [
    { revision_number: 1, unit_price: '4.20', status: 'ISSUED', created_at: '2026-10-18 14:00' },
  ],
});

async function loadQuote() {
  const quoteId = (route.params.id as string) || 'quote-001';
  try {
    const res = await apiRequest(`/sourcing/quotes/${quoteId}`);
    if (res && res.id) {
      quote.value = {
        id: res.id,
        supplier_name: res.supplier_name || quote.value.supplier_name,
        status: res.status || 'ISSUED',
        current_revision: {
          revision_number: res.revision_number || 1,
          unit_price: res.unit_price || '4.20',
          lead_time_days: res.lead_time_days || 14,
          incoterms: res.incoterms || 'FOB Busan Port',
          status: res.status || 'ISSUED',
        },
        revisions: res.revisions || [
          { revision_number: 1, unit_price: res.unit_price || '4.20', status: 'ISSUED', created_at: res.created_at || '2026-10-18' }
        ],
      };
    }
  } catch (e) {
    // Keep fallback
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadQuote();
});

async function handleAccept() {
  accepting.value = true;
  try {
    const idempKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const quoteId = quote.value.id || 'quote-001';
    const res = await apiRequest(`/sourcing/quotes/${quoteId}/accept`, {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempKey,
      },
    });

    const orderId = res.id || 'ord-20261018-001';
    alert(`[견적 승인 및 도매 계약서 발급 완료]\n주문번호: ${res.order_number || orderId}\n총 금액: $${(res.total_amount_minor / 100).toFixed(2)} USD (계약금 30%: $${(res.downpayment_minor / 100).toFixed(2)})\n전자계약 체결 페이지로 이동합니다.`);
    router.push(`/ko/KRW/orders/${orderId}/contract`);
  } catch (err: any) {
    if (err.message && err.message.includes('409')) {
      alert('이미 승인 처리된 견적입니다. 발주 관리 목록으로 이동합니다.');
      router.push('/ko/KRW/orders');
    } else {
      alert(`견적 승인 실패: ${err.message}`);
    }
  } finally {
    accepting.value = false;
  }
}
</script>

<style scoped>
.qr-grid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 16px; align-items: start; }
.approval { position: sticky; top: 84px; }
.approval .ws-small { margin: 0 0 10px; }
@media (max-width: 900px) {
  .qr-grid { grid-template-columns: minmax(0, 1fr); }
  .approval { position: static; }
}
</style>
