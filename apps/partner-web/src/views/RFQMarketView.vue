<template>
  <div class="rfq-market-page">
    <h2>공개 RFQ 입찰 시장 (RFQ Marketplace)</h2>
    <p class="subtitle">국내외 검증된 바이어 기업들이 발행한 조달 프로젝트에 공식 입찰합니다.</p>

    <div v-if="loading" class="loading-state">
      RFQ 시장 목록을 API 서버에서 조회 중입니다...
    </div>

    <div v-else-if="error" class="error-banner">
      ⚠️ {{ error }}
    </div>

    <div v-else class="rfq-list">
      <div v-for="rfq in rfqs" :key="rfq.id" class="rfq-card">
        <div class="card-head">
          <span class="dest-badge">{{ rfq.destination_country }}</span>
          <h3 class="rfq-title">{{ rfq.title }}</h3>
          <span class="expires">마감: {{ rfq.expires_at }}</span>
        </div>

        <div class="card-info">
          <div><span class="k">요청 수량:</span> <strong>{{ rfq.requested_qty }} {{ rfq.unit }}</strong></div>
          <div><span class="k">목표 단가:</span> <strong>${{ rfq.target_price }}</strong></div>
          <div><span class="k">바이어:</span> <span class="mask">[보호된 검증 구매사]</span></div>
        </div>

        <!-- Bidding section -->
        <div class="bid-section">
          <h4>공식 견적서(Quote) 발행 / 수정 (Revision)</h4>
          <div class="bid-inputs">
            <div>
              <label>제안 단가 (USD)</label>
              <input v-model="rfq.bidPrice" type="text" placeholder="예: 4.80" />
            </div>
            <div>
              <label>납기일수</label>
              <input v-model.number="rfq.bidLeadTime" type="number" placeholder="14" />
            </div>
            <div>
              <label>Incoterms 2020</label>
              <input v-model="rfq.bidIncoterm" type="text" placeholder="FOB Busan" />
            </div>
            <button class="btn-bid" :disabled="submitting" @click="submitBid(rfq)">
              {{ submitting ? '제출 중...' : (rfq.hasBid ? '견적 수정본(Rev 2) 발행' : '신규 견적 제출 (Rev 1)') }}
            </button>
          </div>
          <p v-if="rfq.hasBid" class="history-note">
            ※ 신규 견적 발행 시 이전 제출본은 자동으로 <code>SUPERSEDED</code> 처리되어 동결됩니다.
          </p>
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
.rfq-market-page { max-width: 1000px; margin: 0 auto; }
h2 { margin: 0 0 6px 0; font-size: 20px; color: #172B4D; }
.subtitle { color: #64748B; font-size: 13px; margin-bottom: 24px; }
.loading-state { padding: 40px; text-align: center; color: #64748B; }
.error-banner { background: #FEF2F2; color: #B91C1C; padding: 12px; border-radius: 6px; margin-bottom: 20px; }
.rfq-list { display: flex; flex-direction: column; gap: 20px; }
.rfq-card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 24px; }
.card-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; }
.dest-badge { background: #173A5E; color: #FFF; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
.rfq-title { margin: 0; font-size: 16px; color: #172B4D; flex: 1; }
.expires { font-size: 12px; color: #64748B; }
.card-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 13px; margin-bottom: 20px; }
.card-info .k { color: #64748B; margin-right: 4px; }
.mask { background: #F1F5F9; color: #475569; font-size: 11px; padding: 2px 6px; border-radius: 4px; }
.bid-section { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; }
.bid-section h4 { margin: 0 0 12px 0; font-size: 14px; color: #172B4D; }
.bid-inputs { display: grid; grid-template-columns: 1fr 1fr 1.5fr auto; gap: 12px; align-items: flex-end; }
.bid-inputs label { display: block; font-size: 12px; font-weight: 600; color: #42526E; margin-bottom: 4px; }
.bid-inputs input { width: 100%; padding: 8px 10px; border: 1px solid #D8E0EB; border-radius: 4px; box-sizing: border-box; }
.btn-bid { background: #C2410C; color: #FFF; border: none; padding: 9px 16px; border-radius: 4px; font-weight: 700; cursor: pointer; white-space: nowrap; }
.history-note { font-size: 11px; color: #64748B; margin-top: 10px; }
</style>
