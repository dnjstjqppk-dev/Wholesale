<template>
  <div class="rfq-create-page">
    <div class="rfq-card">
      <h2>글로벌 도매 RFQ 견적의뢰서 작성</h2>
      <p class="desc">
        국내외 적격 검증 공급사(Verified Suppliers)로부터 경쟁 입찰 견적을 수신합니다.
        <br /><strong>※ 구매기업 보안 원칙에 따라 연락처 및 도면은 익명화(Masking)되어 보호됩니다.</strong>
      </p>

      <div class="form-section">
        <label>조달 프로젝트명 (Title)</label>
        <input v-model="form.title" type="text" placeholder="예: 2026 하반기 산업용 스테인리스 텀블러 5,000개 조달" />
      </div>

      <div class="form-row">
        <div class="form-section flex-1">
          <label>도착지 국가 (Destination Country)</label>
          <select v-model="form.destinationCountry">
            <option value="KR">대한민국 (KR)</option>
            <option value="US">미국 (US)</option>
            <option value="JP">일본 (JP)</option>
            <option value="EU">유럽연합 (EU)</option>
          </select>
        </div>
        <div class="form-section flex-1">
          <label>견적 마감 희망일</label>
          <input v-model="form.expiresAt" type="date" />
        </div>
      </div>

      <div class="items-section">
        <h3>의뢰 품목 상세</h3>
        <div class="item-box">
          <div class="form-row">
            <div class="form-section flex-2">
              <label>품목명 규격</label>
              <input v-model="item.title" type="text" placeholder="예: SUS304 500ml 진공 이중 구조" />
            </div>
            <div class="form-section flex-1">
              <label>요청 수량</label>
              <input v-model.number="item.requestedQty" type="number" placeholder="5000" />
            </div>
            <div class="form-section flex-1">
              <label>단위</label>
              <input v-model="item.unit" type="text" placeholder="pcs" />
            </div>
          </div>
        </div>
      </div>

      <div class="security-banner">
        <span class="icon">🔒</span>
        <div>
          <strong>테넌트 격리 및 무단 우회 방지 공지:</strong>
          <p>공급사 간 견적 금액 및 채팅은 완벽히 격리되며, 정식 계약 체결 전까지 개인 연락처는 비공개 처리됩니다.</p>
        </div>
      </div>

      <div class="btn-group">
        <button class="btn-submit" @click="handleSubmit">RFQ 정식 발행 (Publish RFQ)</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiRequest } from '../api';

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
.rfq-create-page { max-width: 800px; margin: 0 auto; }
.rfq-card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 32px; }
h2 { margin: 0 0 8px 0; font-size: 20px; color: #172B4D; }
.desc { color: #42526E; font-size: 13px; line-height: 1.5; margin-bottom: 24px; }
.form-section { margin-bottom: 16px; }
.form-section label { display: block; font-size: 13px; font-weight: 600; color: #172B4D; margin-bottom: 6px; }
.form-section input, .form-section select { width: 100%; padding: 10px 12px; border: 1px solid #D8E0EB; border-radius: 4px; box-sizing: border-box; font-size: 14px; }
.form-row { display: flex; gap: 16px; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.items-section { margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 20px; }
.items-section h3 { font-size: 15px; color: #172B4D; margin: 0 0 12px 0; }
.item-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; }
.security-banner { display: flex; gap: 12px; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; padding: 12px; margin: 24px 0; font-size: 12px; color: #1E40AF; }
.security-banner .icon { font-size: 18px; }
.security-banner p { margin: 4px 0 0 0; }
.btn-submit { background: #C2410C; color: #FFF; border: none; padding: 14px 28px; font-size: 15px; font-weight: 700; border-radius: 6px; cursor: pointer; width: 100%; }
</style>

