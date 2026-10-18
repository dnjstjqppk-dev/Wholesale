<template>
  <div class="fulfillment-page">
    <h2>수주 생산 및 분할 출고 관리 (Fulfillment & Shipments)</h2>
    <p class="subtitle">계약된 주문 품목에 대해 분할 선적을 등록하고 무역 서류(B/L, Invoice)를 첨부합니다.</p>

    <div class="order-box">
      <div class="box-head">
        <div>
          <span class="ord-no">주문번호: ORD-2026-0001</span>
          <span class="buyer">바이어: Metro Wholesale Imports LLC</span>
        </div>
        <span class="status-tag">IN_PRODUCTION</span>
      </div>

      <div class="item-summary">
        <h4>수주 품목 선적 진행 현황</h4>
        <div class="progress-info">
          <span>산업용 진공 텀블러 벌크팩</span>
          <strong>총 계약 수량: {{ totalOrdered }} pcs | 누적 출고: {{ totalShipped }} pcs (잔여: {{ remaining }} pcs)</strong>
        </div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: `${(totalShipped / totalOrdered) * 100}%` }"></div>
        </div>
      </div>

      <!-- New Split Shipment Form -->
      <div class="shipment-form">
        <h4>신규 분할 출고 등록 (Split Shipment)</h4>
        <div class="form-grid">
          <div>
            <label>출고 수량 (최대 {{ remaining }} pcs)</label>
            <input v-model.number="dispatchQty" type="number" :max="remaining" />
          </div>
          <div>
            <label>운송사 / B/L 선하증권 번호</label>
            <input v-model="blNumber" type="text" placeholder="예: MAEU123456789" />
          </div>
          <div>
            <label>선적일자 (Vessel Departure)</label>
            <input v-model="departureDate" type="date" />
          </div>
          <button class="btn-dispatch" :disabled="dispatchQty <= 0 || dispatchQty > remaining" @click="handleDispatch">
            선적 출고 확정 (Dispatch)
          </button>
        </div>
        <p v-if="dispatchQty > remaining" class="err-txt">
          ⚠️ 오류: 출고 수량이 계약 잔여 수량을 초과할 수 없습니다 (Cumulative limit violation).
        </p>
      </div>

      <!-- Shipped History -->
      <div class="history-section">
        <h4>선적 완료 내역</h4>
        <div v-for="(s, idx) in shipments" :key="idx" class="history-row">
          <span>선적 #{{ s.number }}</span>
          <span>수량: {{ s.qty }} pcs</span>
          <span>B/L: {{ s.bl }}</span>
          <span class="date">{{ s.date }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const totalOrdered = 1000;
const shipments = ref([
  { number: 1, qty: 400, bl: 'HMM-PUS-88991', date: '2026-10-15' },
]);

const dispatchQty = ref(400);
const blNumber = ref('MAEU-PUS-99002');
const departureDate = ref('2026-10-18');

const totalShipped = computed(() => shipments.value.reduce((sum, s) => sum + s.qty, 0));
const remaining = computed(() => totalOrdered - totalShipped.value);

function handleDispatch() {
  if (dispatchQty.value > remaining.value) return;
  shipments.value.push({
    number: shipments.value.length + 1,
    qty: dispatchQty.value,
    bl: blNumber.value,
    date: departureDate.value,
  });
  alert(`분할 선적 #${shipments.value.length} (${dispatchQty.value} pcs) 등록이 완료되었습니다.`);
  dispatchQty.value = remaining.value;
}
</script>

<style scoped>
.fulfillment-page { max-width: 1000px; margin: 0 auto; }
h2 { margin: 0 0 6px 0; font-size: 20px; color: #172B4D; }
.subtitle { color: #64748B; font-size: 13px; margin-bottom: 24px; }
.order-box { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 24px; }
.box-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; margin-bottom: 16px; }
.ord-no { font-weight: 700; color: #172B4D; font-size: 16px; margin-right: 12px; }
.buyer { font-size: 13px; color: #64748B; }
.status-tag { background: #EDE9FE; color: #6D28D9; font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 9999px; }
.item-summary { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; margin-bottom: 20px; }
.item-summary h4 { margin: 0 0 8px 0; font-size: 14px; color: #172B4D; }
.progress-info { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
.progress-bar { height: 8px; background: #E2E8F0; border-radius: 4px; overflow: hidden; }
.progress-bar .fill { height: 100%; background: #C2410C; transition: width 0.3s ease; }
.shipment-form { background: #FFF; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; margin-bottom: 20px; }
.shipment-form h4 { margin: 0 0 12px 0; font-size: 14px; color: #172B4D; }
.form-grid { display: grid; grid-template-columns: 1fr 1.5fr 1fr auto; gap: 12px; align-items: flex-end; }
.form-grid label { display: block; font-size: 12px; font-weight: 600; color: #42526E; margin-bottom: 4px; }
.form-grid input { width: 100%; padding: 8px 10px; border: 1px solid #D8E0EB; border-radius: 4px; box-sizing: border-box; }
.btn-dispatch { background: #15803D; color: #FFF; border: none; padding: 9px 18px; border-radius: 4px; font-weight: 700; cursor: pointer; white-space: nowrap; }
.btn-dispatch:disabled { background: #CBD5E1; cursor: not-allowed; }
.err-txt { color: #DC2626; font-size: 12px; margin-top: 8px; }
.history-section h4 { margin: 0 0 8px 0; font-size: 13px; color: #172B4D; }
.history-row { display: flex; justify-content: space-between; padding: 8px; background: #F8FAFC; border-radius: 4px; margin-bottom: 6px; font-size: 13px; }
.date { color: #64748B; }
</style>
