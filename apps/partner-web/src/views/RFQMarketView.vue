<template>
  <div class="ws-page">
    <div class="ws-page-head">
      <p class="ws-eyebrow">RFQ Marketplace</p>
      <h1 class="ws-page-title">공개 RFQ 입찰 시장</h1>
      <p class="ws-page-sub">검증 바이어 기업이 발행한 조달 프로젝트에 공식 입찰합니다.</p>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton" style="height: 220px"></div>
      <div class="ws-skeleton" style="height: 220px"></div>
    </div>

    <div v-else-if="error" class="ws-banner ws-banner-danger">
      <WsIcon name="alert" :size="16" />
      <span>{{ error }}</span>
    </div>

    <div v-else class="ws-stack">
      <article v-for="rfq in rfqs" :key="rfq.id" class="ws-card rfq-card">
        <div class="ws-split rfq-head">
          <span class="ws-cluster" style="gap: 10px">
            <span class="ws-badge ws-badge-navy">{{ rfq.destination_country }}</span>
            <h3>{{ rfq.title }}</h3>
          </span>
          <span class="ws-small ws-muted">마감: {{ rfq.expires_at }}</span>
        </div>
        <div class="spec-strip">
          <div><i>요청 수량</i><b class="ws-figure">{{ rfq.requested_qty }} {{ rfq.unit }}</b></div>
          <div><i>목표 단가</i><b class="ws-price ws-figure">${{ rfq.target_price }}</b></div>
          <div><i>바이어</i><b><span class="ws-badge ws-badge-outline">보호된 검증 구매사</span></b></div>
        </div>
        <div class="bid-box">
          <p class="ws-small ws-strong" style="margin: 0 0 10px">공식 견적서 발행·수정 (Revision)</p>
          <div class="bid-grid">
            <div class="ws-field" style="margin-bottom: 0"><label>제안 단가 (USD)</label><input v-model="rfq.bidPrice" type="text" placeholder="예: 4.80" /></div>
            <div class="ws-field" style="margin-bottom: 0"><label>납기일수</label><input v-model.number="rfq.bidLeadTime" type="number" placeholder="14" /></div>
            <div class="ws-field" style="margin-bottom: 0"><label>Incoterms 2020</label><input v-model="rfq.bidIncoterm" type="text" placeholder="FOB Busan" /></div>
            <button class="ws-btn ws-btn-primary" :disabled="submitting" @click="submitBid(rfq)">
              {{ submitting ? '제출 중...' : (rfq.hasBid ? '견적 수정본(Rev 2) 발행' : '신규 견적 제출 (Rev 1)') }}
            </button>
          </div>
          <p v-if="rfq.hasBid" class="ws-hint">신규 견적 발행 시 이전 제출본은 자동으로 <code>SUPERSEDED</code> 처리되어 동결됩니다.</p>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const loading = ref(true);
const submitting = ref(false);
const error = ref('');
const rfqs = ref<any[]>([]);

async function loadRFQs() {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiRequest('/sourcing/rfqs');
    rfqs.value = (res.items || []).map((item: any) => ({
      ...item,
      hasBid: false,
      bidPrice: item.target_price || '4.50',
      bidLeadTime: item.lead_time_days || 14,
      bidIncoterm: 'FOB Busan Port',
    }));
  } catch (err: any) {
    error.value = err.message || 'RFQ 목록 로드 실패';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadRFQs();
});

async function submitBid(rfq: any) {
  submitting.value = true;
  try {
    const res = await apiRequest(`/sourcing/rfqs/${rfq.id}/quotes`, {
      method: 'POST',
      body: JSON.stringify({
        unit_price: rfq.bidPrice,
        lead_time_days: rfq.bidLeadTime,
        incoterms: rfq.bidIncoterm,
      }),
    });
    rfq.hasBid = true;
    alert(`[공식 견적서(Quote) 발행 성공]\n견적 ID: ${res.id}\nRFQ: ${rfq.title}\n제안단가: $${res.unit_price} USD\n납기: ${res.lead_time_days}일\n바이어에게 공식 견적서가 안전하게 전송되었습니다.`);
  } catch (err: any) {
    alert(`견적 제출 실패: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.rfq-head { margin-bottom: 12px; }
.rfq-head h3 { margin: 0; font-size: 17px; font-weight: 800; letter-spacing: var(--ws-tracking-tight); }
.spec-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; background: var(--ws-surface-muted); border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; }
.spec-strip div { display: flex; flex-direction: column; gap: 2px; }
.spec-strip i { font-style: normal; font-size: 11px; font-weight: 700; color: var(--ws-text-muted); }
.spec-strip b { font-size: 14px; }
.bid-box { background: var(--ws-brand-faint); border: 1px solid var(--ws-brand-light); border-radius: 10px; padding: 16px; }
.bid-grid { display: grid; grid-template-columns: 1fr 1fr 1.2fr auto; gap: 10px; align-items: end; }
@media (max-width: 768px) {
  .spec-strip { grid-template-columns: minmax(0, 1fr); }
  .bid-grid { grid-template-columns: minmax(0, 1fr); }
  .bid-grid .ws-btn { width: 100%; }
}
</style>
