<template>
  <div class="ws-page ws-page-narrow">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Trade Dispute</p>
      <h1 class="ws-page-title">분쟁·정산 동결 신청</h1>
      <p class="ws-page-sub">규격 불일치·파손·미선적 발생 시 플랫폼 공인 중재를 신청합니다.</p>
    </div>

    <div class="ws-banner ws-banner-danger">
      <WsIcon name="alert" :size="16" />
      <span>분쟁 접수 시 공급사 정산 지급(Settlement Payout)은 <b>즉시 자동 보류(HELD)</b>됩니다.</span>
    </div>

    <section class="ws-card">
      <div class="ws-field">
        <label>클레임 청구 금액 (USD)</label>
        <input v-model.number="claimAmount" type="number" placeholder="최대 주문 총액 이내" />
      </div>
      <div class="ws-field">
        <label>분쟁 사유</label>
        <select v-model="reason">
          <option value="DEFECTIVE_BATCH">규격 불일치 및 불량률 기준치 초과</option>
          <option value="SHIPPING_DELAY">계약 납기일 초과 및 미선적</option>
          <option value="INCOMPLETE_DOCUMENT">B/L 및 원산지 증명서 위변조/누락</option>
          <option value="QUANTITY_SHORTAGE">수량 부족 입고</option>
        </select>
      </div>
      <div class="ws-field">
        <label>상세 소명·검수 리포트 내용</label>
        <textarea v-model="details" rows="5" class="ws-textarea" placeholder="검수 결과 및 발견된 하자 내역을 상세히 기술하세요..."></textarea>
      </div>
      <button class="ws-btn ws-btn-danger ws-btn-block ws-btn-lg" :disabled="submitting" @click="handleSubmit">
        <span v-if="submitting" class="ws-spinner"></span>
        {{ submitting ? '접수 처리 중...' : '분쟁 공식 접수·정산 동결' }}
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const router = useRouter();
const route = useRoute();
const submitting = ref(false);
const claimAmount = ref(1500);
const reason = ref('DEFECTIVE_BATCH');
const details = ref('');

async function handleSubmit() {
  submitting.value = true;
  const orderId = (route.params.id as string) || 'ord-20261018-001';
  try {
    const res = await apiRequest('/disputes', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        requested_amount_minor: Math.round(claimAmount.value * 100),
        reason: `${reason.value}: ${details.value || '규격 불일치 및 클레임 제기'}`,
      }),
    });
    alert(`[분쟁 접수 및 공급사 에스크로 동결 완료]\n분쟁 ID: ${res.id}\n주문 ID: ${res.order_id}\n청구액: $${(res.requested_amount_minor / 100).toFixed(2)} USD\n에스크로 동결액: $${(res.escrow_frozen_minor / 100).toFixed(2)} USD\n상태: ${res.status}\n관리자 중재 심사로 이관되었습니다.`);
    router.push('/ko/KRW/orders');
  } catch (err: any) {
    alert(`분쟁 접수 처리 실패: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.ws-banner { margin-top: 0; }
</style>
