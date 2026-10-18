<template>
  <div class="fulfillment-page">
    <h2>수주 생산 및 분할 출고 관리 (Fulfillment & Shipments)</h2>
    <p class="subtitle">계약된 주문 품목에 대해 분할 선적을 등록하고 무역 서류(B/L, Invoice)를 첨부합니다.</p>

    <div v-if="loading" class="loading-state">
      주문 데이터를 API 게이트웨이에서 로드 중입니다...
    </div>

    <div v-else-if="error" class="error-banner">
      ⚠️ {{ error }}
    </div>

    <div v-else class="order-box">
      <div class="box-head">
        <div>
          <span class="ord-no">주문번호: {{ activeOrder?.order_number }}</span>
          <span class="buyer">바이어: {{ activeOrder?.buyer_name }}</span>
        </div>
        <span class="status-tag">{{ activeOrder?.order_status }}</span>
      </div>

      <div class="item-summary">
        <h4>수주 품목 선적 진행 현황</h4>
        <div class="progress-info">
          <span>{{ activeOrder?.item_title }}</span>
          <strong>
            총 계약 수량: {{ activeOrder?.ordered_quantity }} {{ activeOrder?.unit }} |
            누적 출고: {{ activeOrder?.shipped_quantity }} {{ activeOrder?.unit }}
            (잔여: {{ remaining }} {{ activeOrder?.unit }})
          </strong>
        </div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
      </div>

      <!-- New Split Shipment Form -->
      <div class="shipment-form">
        <h4>신규 분할 출고 등록 (Split Shipment)</h4>
        <div class="form-grid">
          <div>
            <label>출고 수량 (최대 {{ remaining }} pcs)</label>
            <input v-model.number="dispatchQty" type="number" :min="1" :max="remaining" />
          </div>
          <div>
            <label>운송사 / B/L 선하증권 번호</label>
            <input v-model="blNumber" type="text" placeholder="예: MAEU123456789" />
          </div>
          <div>
            <label>선적일자 (Vessel Departure)</label>
            <input v-model="departureDate" type="date" />
          </div>
          <button class="btn-dispatch" :disabled="submitting || dispatchQty <= 0 || dispatchQty > remaining" @click="handleDispatch">
            {{ submitting ? '선적 등록 중...' : '선적 출고 확정 (Dispatch)' }}
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
          <span>선적 #{{ idx + 1 }}</span>
          <span>수량: {{ s.qty }} pcs</span>
          <span>B/L: {{ s.bl }}</span>
          <span class="carrier">운송사: {{ s.carrier }}</span>
          <span class="date">{{ s.date }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { apiRequest } from '../api';

const loading = ref(true);
const submitting = ref(false);
const error = ref('');
const activeOrder = ref<any>(null);

const shipments = ref<any[]>([
  { qty: 400, bl: 'HMM-PUS-88991', carrier: 'HMM Logistics', date: '2026-10-15' },
]);

const dispatchQty = ref(300);
const blNumber = ref('MAEU-PUS-99002');
const departureDate = ref('2026-10-18');

const remaining = computed(() => {
  if (!activeOrder.value) return 0;
  return Math.max(0, activeOrder.value.ordered_quantity - activeOrder.value.shipped_quantity);
});

const progressPercent = computed(() => {
  if (!activeOrder.value || !activeOrder.value.ordered_quantity) return 0;
  return Math.min(100, (activeOrder.value.shipped_quantity / activeOrder.value.ordered_quantity) * 100);
});

async function loadOrder() {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiRequest('/trade/orders');
    if (res.orders && res.orders.length > 0) {
      activeOrder.value = res.orders[0];
      if (activeOrder.value.shipped_quantity > 0 && shipments.value.length === 1) {
        shipments.value[0].qty = activeOrder.value.shipped_quantity;
      }
      dispatchQty.value = remaining.value;
    }
  } catch (err: any) {
    error.value = err.message || '주문 데이터 로드 실패';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadOrder();
});

async function handleDispatch() {
  if (dispatchQty.value <= 0 || dispatchQty.value > remaining.value) return;

  submitting.value = true;
  try {
    const res = await apiRequest('/logistics/shipments', {
      method: 'POST',
      body: JSON.stringify({
        order_id: activeOrder.value.id,
        dispatch_quantity: dispatchQty.value,
        tracking_number: blNumber.value,
        carrier: 'HMM Marine Logistics',
      }),
    });

    activeOrder.value.shipped_quantity = res.cumulative_shipped;
    activeOrder.value.fulfillment_status = res.cumulative_shipped >= activeOrder.value.ordered_quantity ? 'COMPLETED' : 'PARTIALLY_FULFILLED';

    shipments.value.push({
      qty: res.dispatched_quantity,
      bl: res.tracking_number,
      carrier: res.carrier,
      date: new Date().toISOString().slice(0, 10),
    });

    alert(`[서버 선적 확정 완료]\n선적 ID: ${res.shipment_id}\nB/L: ${res.tracking_number}\n누적 선적 수량: ${res.cumulative_shipped} / ${activeOrder.value.ordered_quantity} pcs`);
    dispatchQty.value = remaining.value;
  } catch (err: any) {
    alert(`선적 등록 실패: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.fulfillment-page { max-width: 1000px; margin: 0 auto; }
h2 { margin: 0 0 6px 0; font-size: 20px; color: #172B4D; }
.subtitle { color: #64748B; font-size: 13px; margin-bottom: 24px; }
.loading-state { padding: 40px; text-align: center; color: #64748B; }
.error-banner { background: #FEF2F2; color: #B91C1C; padding: 12px; border-radius: 6px; margin-bottom: 20px; }
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
.history-row { display: flex; justify-content: space-between; padding: 8px 12px; background: #F8FAFC; border-radius: 4px; margin-bottom: 6px; font-size: 13px; }
.carrier, .date { color: #64748B; }
</style>
