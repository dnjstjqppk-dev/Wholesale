<template>
  <div class="dispute-create-page">
    <div class="card">
      <h2>무역 거래 분쟁 및 정산 동결 신청 (Trade Dispute)</h2>
      <p class="desc">
        물품의 규격 불일치, 파손, 미선적 발생 시 플랫폼 공인 중재를 신청합니다.
        <br /><strong>※ 분쟁이 접수되면 공급사 정산 지급(Settlement Payout)은 즉시 자동 보류(HELD)됩니다.</strong>
      </p>

      <div class="form-group">
        <label>클레임 청구 금액 (USD)</label>
        <input v-model.number="claimAmount" type="number" placeholder="최대 주문 총액 이내" />
      </div>

      <div class="form-group">
        <label>분쟁 사유 (Reason)</label>
        <select v-model="reason">
          <option value="DEFECTIVE_BATCH">규격 불일치 및 불량률 기준치 초과</option>
          <option value="SHIPPING_DELAY">계약 납기일 초과 및 미선적</option>
          <option value="INCOMPLETE_DOCUMENT">B/L 및 원산지 증명서 위변조/누락</option>
          <option value="QUANTITY_SHORTAGE">수량 부족 입고</option>
        </select>
      </div>

      <div class="form-group">
        <label>상세 소명 및 제3자 검수 리포트 내용</label>
        <textarea v-model="details" rows="5" placeholder="검수 결과 및 발견된 하자 내역을 상세히 기술하세요..."></textarea>
      </div>

      <div class="actions">
        <button class="btn-submit" @click="handleSubmit">분쟁 공식 접수 및 정산 동결</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiRequest } from '../api';

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
.dispute-create-page { max-width: 700px; margin: 0 auto; }
.card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 32px; }
h2 { margin: 0 0 8px 0; font-size: 20px; color: #172B4D; }
.desc { color: #42526E; font-size: 13px; line-height: 1.5; margin-bottom: 24px; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; color: #172B4D; margin-bottom: 6px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px 12px; border: 1px solid #D8E0EB; border-radius: 4px; box-sizing: border-box; font-size: 14px; }
.actions { margin-top: 24px; }
.btn-submit { background: #DC2626; color: #FFF; border: none; padding: 12px 24px; font-weight: 700; border-radius: 6px; cursor: pointer; width: 100%; font-size: 15px; }
</style>

