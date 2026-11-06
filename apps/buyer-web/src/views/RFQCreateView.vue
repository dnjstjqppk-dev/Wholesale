<template>
  <div class="ws-page ws-page-narrow">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Request for Quotation</p>
      <h1 class="ws-page-title">RFQ 견적의뢰서 작성</h1>
      <p class="ws-page-sub">검증 공급사 네트워크로부터 경쟁 입찰 견적을 수신합니다. 연락처·도면은 익명화(Masking)되어 보호됩니다.</p>
    </div>

    <section class="ws-card">
      <div class="ws-field">
        <label>조달 프로젝트명 <span class="ws-field-req">*</span></label>
        <input v-model="form.title" type="text" placeholder="예: 2026 하반기 산업용 스테인리스 텀블러 5,000개 조달" />
      </div>
      <div class="ws-grid-2">
        <div class="ws-field">
          <label>도착지 국가</label>
          <select v-model="form.destinationCountry">
            <option value="KR">대한민국 (KR)</option>
            <option value="US">미국 (US)</option>
            <option value="JP">일본 (JP)</option>
            <option value="EU">유럽연합 (EU)</option>
          </select>
        </div>
        <div class="ws-field">
          <label>견적 마감 희망일</label>
          <input v-model="form.expiresAt" type="date" />
        </div>
      </div>

      <hr class="ws-divider" />
      <div class="ws-card-head"><h3>의뢰 품목 상세</h3></div>
      <div class="item-grid">
        <div class="ws-field item-name">
          <label>품목명 규격</label>
          <input v-model="item.title" type="text" placeholder="예: SUS304 500ml 진공 이중 구조" />
        </div>
        <div class="ws-field">
          <label>요청 수량</label>
          <input v-model.number="item.requestedQty" type="number" placeholder="5000" />
        </div>
        <div class="ws-field">
          <label>단위</label>
          <input v-model="item.unit" type="text" placeholder="pcs" />
        </div>
      </div>

      <div class="ws-banner ws-banner-info">
        <WsIcon name="lock" :size="16" />
        <div><b>테넌트 격리·무단 우회 방지:</b> 공급사 간 견적·채팅은 격리되며, 계약 체결 전까지 개인 연락처는 비공개 처리됩니다.</div>
      </div>

      <button class="ws-btn ws-btn-accent ws-btn-block ws-btn-lg" :disabled="submitting" @click="handleSubmit">
        <span v-if="submitting" class="ws-spinner"></span>
        {{ submitting ? '발행 처리 중...' : 'RFQ 정식 발행' }}
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const router = useRouter();
const submitting = ref(false);

const form = ref({
  title: '',
  destinationCountry: 'KR',
  expiresAt: '2026-11-30',
});

const item = ref({
  title: '',
  requestedQty: 1000,
  unit: 'pcs',
});

async function handleSubmit() {
  submitting.value = true;
  try {
    const res = await apiRequest('/sourcing/rfqs', {
      method: 'POST',
      body: JSON.stringify({
        title: form.value.title || item.value.title || '산업용 도매 조달 프로젝트',
        quantity: item.value.requestedQty || 1000,
        unit: item.value.unit || 'pcs',
        destination_country: form.value.destinationCountry || 'KR',
        expires_at: form.value.expiresAt || '2026-12-31',
      }),
    });
    alert(`[RFQ 공식 발행 성공]\nRFQ 번호: ${res.id}\n프로젝트명: ${res.title}\n요청수량: ${res.requested_qty} ${res.unit}\n적격 검증 공급사 네트워크로 입찰 요청이 전송되었습니다.`);
    router.push('/ko/KRW/orders');
  } catch (err: any) {
    alert(`RFQ 발행 실패: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.item-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; }
@media (max-width: 640px) {
  .item-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
