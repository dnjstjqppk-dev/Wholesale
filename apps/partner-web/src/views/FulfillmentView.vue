<template>
  <div class="fulfillment-page">
    <div class="head-row">
      <div>
        <h2>수주 생산 및 분할 출고 관리 (Multi-Order Fulfillment & Shipments)</h2>
        <p class="subtitle">수주한 전체 도매 주문을 선택하여 분할 선적을 등록하고 선하증권(B/L)·상업송장(C/I)·포장명세서(P/L)를 첨부합니다.</p>
      </div>
      <div class="order-selector">
        <label>수주 주문 선택 ({{ allOrders.length }}건):</label>
        <select v-model="selectedOrderId" @change="onSelectOrder">
          <option v-for="o in allOrders" :key="o.id" :value="o.id">
            {{ o.order_number }} — {{ o.item_title?.slice(0, 22) }} ({{ o.shipped_quantity }}/{{ o.ordered_quantity }} {{ o.unit }})
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      주문 데이터를 API 게이트웨이에서 로드 중입니다...
    </div>

    <div v-else-if="error" class="error-banner">
      ⚠️ {{ error }}
    </div>

    <div v-else-if="activeOrder" class="order-box">
      <div class="box-head">
        <div>
          <span class="ord-no">주문번호: {{ activeOrder.order_number }}</span>
          <span class="buyer">구매사: {{ activeOrder.buyer_name }} | 인도조건: {{ activeOrder.incoterms }}</span>
        </div>
        <div class="badges">
          <span class="status-tag">{{ activeOrder.order_status }}</span>
          <span class="status-tag ship">{{ activeOrder.fulfillment_status }}</span>
        </div>
      </div>

      <div class="item-summary">
        <h4>수주 품목 선적 진행 현황 (Cumulative Shipment Guard)</h4>
        <div class="progress-info">
          <span><strong>{{ activeOrder.item_title }}</strong></span>
          <strong>
            총 계약 수량: {{ activeOrder.ordered_quantity }} {{ activeOrder.unit }} |
            누적 출고: {{ activeOrder.shipped_quantity }} {{ activeOrder.unit }}
            (출고 가능 잔여: {{ remaining }} {{ activeOrder.unit }})
          </strong>
        </div>
        <div class="progress-bar">
          <div class="fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
      </div>

      <!-- New Split Shipment Form -->
      <div class="shipment-form">
        <h4>🚢 신규 분할 출고 및 무역 서류 등록 (Split Shipment & Trade Docs)</h4>
        <div class="form-grid-3">
          <div>
            <label>출고 수량 (최대 {{ remaining }} {{ activeOrder.unit }})</label>
            <input v-model.number="dispatchQty" type="number" :min="1" />
          </div>
          <div>
            <label>해운/항공 운송사 (Carrier)</label>
            <select v-model="carrierName">
              <option value="HMM Marine Logistics">HMM Marine Logistics (현대상선)</option>
              <option value="Maersk Line">Maersk Line</option>
              <option value="MSC Mediterranean">MSC Mediterranean</option>
              <option value="DHL Global Forwarding">DHL Global Forwarding (Air)</option>
            </select>
          </div>
          <div>
            <label>선하증권 (B/L) 또는 AWB 번호</label>
            <input v-model="blNumber" type="text" placeholder="예: MAEU-PUS-99002" />
          </div>
          <div>
            <label>상업송장 (Commercial Invoice URL)</label>
            <input v-model="ciUrl" type="text" />
          </div>
          <div>
            <label>포장명세서 (Packing List URL)</label>
            <input v-model="plUrl" type="text" />
          </div>
          <div>
            <label>원산지증명서 (Certificate of Origin)</label>
            <input v-model="coNumber" type="text" />
          </div>
        </div>

        <div class="dispatch-bar">
          <p v-if="dispatchQty > remaining" class="err-txt">
            ⚠️ 누적 출고 한도 초과 경고: 요청 수량({{ dispatchQty }})이 잔여 계약 수량({{ remaining }})을 초과합니다. 강제 호출 시 백엔드가 `422 CUMULATIVE_OVERFLOW`로 차단합니다.
          </p>
          <button class="btn-dispatch" :disabled="submitting || dispatchQty <= 0" @click="handleDispatch">
            {{ submitting ? '선적 및 B/L 등록 중...' : '🚢 분할 선적 출고 확정 (POST /v1/logistics/shipments)' }}
          </button>
        </div>
      </div>

      <!-- Shipped History -->
      <div class="history-section">
        <h4>📜 누적 선적 및 무역 서류 원장 ({{ orderShipments.length }}건)</h4>
        <div v-if="orderShipments.length === 0" class="empty-ship">아직 등록된 선적 내역이 없습니다.</div>
        <div v-for="(s, idx) in orderShipments" :key="s.id || idx" class="history-row">
          <span><strong>{{ s.id || `SHP-#${idx + 1}` }}</strong></span>
          <span>수량: <strong>{{ s.dispatched_quantity || s.qty }} {{ activeOrder.unit }}</strong></span>
          <span>B/L: <code>{{ s.tracking_number || s.bl }}</code></span>
          <span class="carrier">{{ s.carrier }}</span>
          <span class="date">{{ formatDate(s.shipped_at || s.date) }}</span>
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
const allOrders = ref<any[]>([]);
const selectedOrderId = ref('');
const activeOrder = ref<any>(null);
const allShipments = ref<any[]>([]);

const dispatchQty = ref(300);
const carrierName = ref('HMM Marine Logistics');
const blNumber = ref('MAEU-PUS-99002');
const ciUrl = ref('https://docs.wholesale.internal/CI-2026-001.pdf');
const plUrl = ref('https://docs.wholesale.internal/PL-2026-001.pdf');
const coNumber = ref('KOR-FTA-CO-2026-8891');

const remaining = computed(() => {
  if (!activeOrder.value) return 0;
  return Math.max(0, activeOrder.value.ordered_quantity - activeOrder.value.shipped_quantity);
});

const progressPercent = computed(() => {
  if (!activeOrder.value || !activeOrder.value.ordered_quantity) return 0;
  return Math.min(100, (activeOrder.value.shipped_quantity / activeOrder.value.ordered_quantity) * 100);
});

const orderShipments = computed(() => {
  if (!activeOrder.value) return [];
  return allShipments.value.filter(s => s.order_id === activeOrder.value.id);
});

function formatDate(d: string) {
  if (!d) return '';
  return d.slice(0, 10);
}

function onSelectOrder() {
  const found = allOrders.value.find(o => o.id === selectedOrderId.value);
  if (found) {
    activeOrder.value = found;
    dispatchQty.value = Math.min(500, Math.max(0, found.ordered_quantity - found.shipped_quantity));
  }
}

async function loadOrdersAndShipments() {
  loading.value = true;
  error.value = '';
  try {
    const [ordRes, shpRes] = await Promise.all([
      apiRequest('/trade/orders'),
      apiRequest('/logistics/shipments').catch(() => ({ shipments: [] })),
    ]);
    allOrders.value = ordRes.orders || [];
    allShipments.value = shpRes.shipments || [];
    if (allOrders.value.length > 0) {
      activeOrder.value = allOrders.value[0];
      selectedOrderId.value = activeOrder.value.id;
      dispatchQty.value = Math.min(400, remaining.value || 400);
    }
  } catch (err: any) {
    error.value = err.message || '주문 데이터 로드 실패';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadOrdersAndShipments();
});

async function handleDispatch() {
  if (!activeOrder.value || dispatchQty.value <= 0) return;

  submitting.value = true;
  try {
    const res = await apiRequest('/logistics/shipments', {
      method: 'POST',
      body: JSON.stringify({
        order_id: activeOrder.value.id,
        dispatch_quantity: dispatchQty.value,
        tracking_number: blNumber.value,
        carrier: carrierName.value,
        documents: {
          commercial_invoice: ciUrl.value,
          packing_list: plUrl.value,
          certificate_of_origin: coNumber.value,
        },
      }),
    });

    activeOrder.value.shipped_quantity = res.cumulative_shipped;
    activeOrder.value.fulfillment_status = res.fulfillment_status;
    activeOrder.value.order_status = res.order_status;

    allShipments.value.push({
      id: res.shipment_id,
      order_id: activeOrder.value.id,
      dispatched_quantity: res.dispatched_quantity,
      tracking_number: res.tracking_number,
      carrier: res.carrier,
      shipped_at: new Date().toISOString(),
    });

    alert(`[서버 선적 확정 완료]\n선적 ID: ${res.shipment_id}\nB/L: ${res.tracking_number}\n누적 선적 수량: ${res.cumulative_shipped} / ${activeOrder.value.ordered_quantity} ${activeOrder.value.unit}`);
    dispatchQty.value = remaining.value;
  } catch (err: any) {
    alert(`선적 등록 차단: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.fulfillment-page { max-width: 1040px; margin: 0 auto; }
.head-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
h2 { margin: 0 0 4px 0; font-size: 20px; color: #172B4D; }
.subtitle { color: #64748B; font-size: 13px; margin: 0; }
.order-selector { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; }
.order-selector select { padding: 8px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; }
.loading-state { padding: 40px; text-align: center; color: #64748B; }
.error-banner { background: #FEF2F2; color: #B91C1C; padding: 12px; border-radius: 6px; margin-bottom: 20px; }
.order-box { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 24px; }
.box-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; margin-bottom: 16px; }
.ord-no { font-weight: 700; color: #172B4D; font-size: 16px; margin-right: 12px; }
.buyer { font-size: 13px; color: #64748B; }
.badges { display: flex; gap: 8px; }
.status-tag { background: #EDE9FE; color: #6D28D9; font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 9999px; }
.status-tag.ship { background: #DCFCE7; color: #15803D; }
.item-summary { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; margin-bottom: 20px; }
.item-summary h4 { margin: 0 0 8px 0; font-size: 14px; color: #172B4D; }
.progress-info { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
.progress-bar { height: 8px; background: #E2E8F0; border-radius: 4px; overflow: hidden; }
.progress-bar .fill { height: 100%; background: #C2410C; transition: width 0.3s ease; }
.shipment-form { background: #FFF; border: 1px solid #E2E8F0; border-radius: 6px; padding: 18px; margin-bottom: 20px; }
.shipment-form h4 { margin: 0 0 14px 0; font-size: 14px; color: #172B4D; }
.form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px; }
.form-grid-3 label { display: block; font-size: 12px; font-weight: 600; color: #42526E; margin-bottom: 4px; }
.form-grid-3 input, .form-grid-3 select { width: 100%; padding: 8px 10px; border: 1px solid #D8E0EB; border-radius: 4px; box-sizing: border-box; font-size: 13px; }
.dispatch-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.btn-dispatch { background: #15803D; color: #FFF; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; margin-left: auto; }
.err-txt { color: #DC2626; font-size: 12px; font-weight: 700; margin: 0; }
.history-section h4 { margin: 0 0 8px 0; font-size: 13px; color: #172B4D; }
.empty-ship { color: #64748B; font-size: 12px; padding: 8px 0; }
.history-row { display: flex; justify-content: space-between; padding: 10px 12px; background: #F8FAFC; border-radius: 6px; margin-bottom: 6px; font-size: 13px; border: 1px solid #E2E8F0; }
.carrier, .date { color: #64748B; }
</style>
