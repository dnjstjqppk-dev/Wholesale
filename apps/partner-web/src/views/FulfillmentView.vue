<template>
  <div class="ws-page ws-page-wide">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Fulfillment</p>
      <div class="ws-page-head-row">
        <h1 class="ws-page-title">생산·분할출고 관리</h1>
        <label class="sort-box">
          <span>수주 주문 ({{ allOrders.length }}건)</span>
          <select v-model="selectedOrderId" class="ws-input" @change="onSelectOrder">
            <option v-for="o in allOrders" :key="o.id" :value="o.id">
              {{ o.order_number }} — {{ o.item_title?.slice(0, 22) }} ({{ o.shipped_quantity }}/{{ o.ordered_quantity }} {{ o.unit }})
            </option>
          </select>
        </label>
      </div>
      <p class="ws-page-sub">분할 선적 등록과 B/L·C/I·P/L 무역 서류 첨부.</p>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton" style="height: 160px"></div>
      <div class="ws-skeleton" style="height: 160px"></div>
    </div>

    <div v-else-if="error" class="ws-banner ws-banner-danger">
      <WsIcon name="alert" :size="16" />
      <span>{{ error }}</span>
    </div>

    <div v-else-if="activeOrder" class="ws-stack">
      <section class="ws-card">
        <div class="ws-split">
          <div>
            <p class="ws-small ws-muted" style="margin: 0">주문번호 <b class="ws-figure">{{ activeOrder.order_number }}</b></p>
            <p class="ws-small" style="margin: 4px 0 0">{{ activeOrder.buyer_name }} · {{ activeOrder.incoterms }}</p>
          </div>
          <span class="ws-cluster" style="gap: 6px">
            <span class="ws-badge ws-badge-info">{{ activeOrder.order_status }}</span>
            <span class="ws-badge ws-badge-success">{{ activeOrder.fulfillment_status }}</span>
          </span>
        </div>
        <hr class="ws-divider" />
        <div class="ws-split">
          <b>{{ activeOrder.item_title }}</b>
          <span class="ws-small ws-figure">계약 {{ activeOrder.ordered_quantity }}{{ activeOrder.unit }} · 누적 출고 {{ activeOrder.shipped_quantity }}{{ activeOrder.unit }} · 잔여 <b class="ws-price-dark">{{ remaining }}{{ activeOrder.unit }}</b></span>
        </div>
        <div class="ws-meter ws-meter-navy" style="margin-top: 10px"><span :style="{ width: `${progressPercent}%` }"></span></div>
      </section>

      <section class="ws-card">
        <div class="ws-card-head"><h3><WsIcon name="truck" :size="15" class="h-ico" /> 신규 분할 출고·무역 서류 등록</h3></div>
        <div class="ws-grid-3">
          <div class="ws-field">
            <label>출고 수량 (최대 {{ remaining }}{{ activeOrder.unit }})</label>
            <input v-model.number="dispatchQty" type="number" :min="1" />
          </div>
          <div class="ws-field">
            <label>운송사 (Carrier)</label>
            <select v-model="carrierName">
              <option value="HMM Marine Logistics">HMM Marine Logistics (현대상선)</option>
              <option value="Maersk Line">Maersk Line</option>
              <option value="MSC Mediterranean">MSC Mediterranean</option>
              <option value="DHL Global Forwarding">DHL Global Forwarding (Air)</option>
            </select>
          </div>
          <div class="ws-field">
            <label>선하증권 (B/L / AWB 번호)</label>
            <input v-model="blNumber" type="text" placeholder="예: MAEU-PUS-99002" />
          </div>
          <div class="ws-field">
            <label>상업송장 (C/I URL) <button type="button" class="ws-btn ws-btn-ghost ws-btn-sm xs-up" :disabled="uploadingCi" @click="uploadTradeDoc('COMMERCIAL_INVOICE')"><WsIcon v-if="!uploadingCi" name="upload" :size="13" /> {{ uploadingCi ? '업로드 중...' : 'R2 업로드' }}</button></label>
            <input v-model="ciUrl" type="text" />
          </div>
          <div class="ws-field">
            <label>포장명세서 (P/L URL) <button type="button" class="ws-btn ws-btn-ghost ws-btn-sm xs-up" :disabled="uploadingPl" @click="uploadTradeDoc('PACKING_LIST')"><WsIcon v-if="!uploadingPl" name="upload" :size="13" /> {{ uploadingPl ? '업로드 중...' : 'R2 업로드' }}</button></label>
            <input v-model="plUrl" type="text" />
          </div>
          <div class="ws-field">
            <label>원산지증명서 (C/O)</label>
            <input v-model="coNumber" type="text" />
          </div>
        </div>
        <div v-if="dispatchQty > remaining" class="ws-banner ws-banner-danger">
          <WsIcon name="alert" :size="16" />
          <span>누적 출고 한도 초과: 요청 {{ dispatchQty }}개가 잔여 {{ remaining }}개를 초과합니다. 강제 호출 시 백엔드가 <code>422 CUMULATIVE_OVERFLOW</code>로 차단합니다.</span>
        </div>
        <button class="ws-btn ws-btn-accent ws-btn-block" :disabled="submitting || dispatchQty <= 0" @click="handleDispatch">
          <WsIcon v-if="!submitting" name="truck" :size="14" /> {{ submitting ? '선적·B/L 등록 중...' : '분할 선적 출고 확정' }}
        </button>
      </section>

      <section class="ws-card ws-card-pad-sm">
        <div class="ws-card-head"><h3>누적 선적·서류 원장 ({{ orderShipments.length }}건)</h3></div>
        <div v-if="orderShipments.length === 0" class="ws-empty" style="padding: 24px">
          <h3>등록된 선적 내역이 없습니다</h3>
        </div>
        <div v-else class="ws-table-wrap">
          <table class="ws-table">
            <thead><tr><th>선적 ID</th><th class="ws-num">수량</th><th>B/L</th><th>운송사</th><th>선적일</th></tr></thead>
            <tbody>
              <tr v-for="(s, idx) in orderShipments" :key="s.id || idx">
                <td class="ws-cell-main ws-figure">{{ s.id || `SHP-#${idx + 1}` }}</td>
                <td class="ws-num ws-figure"><b>{{ s.dispatched_quantity || s.qty }} {{ activeOrder.unit }}</b></td>
                <td><code>{{ s.tracking_number || s.bl }}</code></td>
                <td>{{ s.carrier }}</td>
                <td class="ws-cell-sub">{{ formatDate(s.shipped_at || s.date) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="ws-card ws-card-pad-sm">
        <div class="ws-card-head">
          <h3><WsIcon name="building" :size="15" class="h-ico" /> 수출신고필증 등록·교부 내역</h3>
          <button class="ws-btn ws-btn-ghost ws-btn-sm" @click="showCustomsForm = !showCustomsForm">{{ showCustomsForm ? '▲ 접기' : '▼ 펼치기' }}</button>
        </div>
        <div v-if="showCustomsForm" class="ws-grid-3">
          <div class="ws-field"><label>수출신고번호</label><input v-model="customsDeclNo" type="text" placeholder="EXP-KR-2026-99120" /></div>
          <div class="ws-field"><label>적재항 (POL)</label><input v-model="pol" type="text" placeholder="Busan Port (KRPUS)" /></div>
          <div class="ws-field"><label>양하항 (POD)</label><input v-model="pod" type="text" placeholder="Los Angeles (USLAX)" /></div>
          <div class="ws-field"><label>HS Code</label><input v-model="hsCode" type="text" placeholder="7323.93.0000" /></div>
          <div class="ws-field"><label>관세·세액 (USD Minor)</label><input v-model.number="dutyTaxMinor" type="number" placeholder="27300" /></div>
          <div class="ws-field"><label>담당 관세사</label><input v-model="customsBroker" type="text" placeholder="Pantos Logistics Global" /></div>
        </div>
        <button v-if="showCustomsForm" class="ws-btn ws-btn-accent ws-btn-block" :disabled="submittingCustoms" @click="handleCustomsSubmit">
          <WsIcon v-if="!submittingCustoms" name="building" :size="14" /> {{ submittingCustoms ? '세관 신고 전송 중...' : '수출통관신고서 전송' }}
        </button>
        <div class="ws-table-wrap" style="margin-top: 14px">
          <div v-if="orderCustoms.length === 0" class="ws-empty" style="padding: 20px"><h3>등록된 수출통관필증이 없습니다</h3></div>
          <table v-else class="ws-table">
            <thead><tr><th>신고번호</th><th>HS</th><th>구간</th><th>관세사</th><th class="ws-num">관부가세</th><th>상태</th></tr></thead>
            <tbody>
              <tr v-for="(m, idx) in orderCustoms" :key="m.id || idx">
                <td class="ws-cell-main ws-figure">{{ m.declaration_number }}</td>
                <td><code>{{ m.hs_code }}</code></td>
                <td class="ws-small">{{ m.port_of_loading }} → {{ m.port_of_discharge }}</td>
                <td>{{ m.customs_broker_name }}</td>
                <td class="ws-num ws-figure"><b>${{ (m.duty_tax_amount_minor / 100).toFixed(2) }}</b></td>
                <td><span class="ws-badge ws-badge-success">{{ m.customs_status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const loading = ref(true);
const submitting = ref(false);
const error = ref('');
const allOrders = ref<any[]>([]);
const selectedOrderId = ref('');
const activeOrder = ref<any>(null);
const allShipments = ref<any[]>([]);
const allCustoms = ref<any[]>([]);

const dispatchQty = ref(300);
const carrierName = ref('HMM Marine Logistics');
const blNumber = ref('MAEU-PUS-99002');
const ciUrl = ref('https://docs.wholesale.internal/CI-2026-001.pdf');
const plUrl = ref('https://docs.wholesale.internal/PL-2026-001.pdf');
const coNumber = ref('KOR-FTA-CO-2026-8891');
const uploadingCi = ref(false);
const uploadingPl = ref(false);

async function uploadTradeDoc(category: 'COMMERCIAL_INVOICE' | 'PACKING_LIST') {
  if (!activeOrder.value) return;
  if (category === 'COMMERCIAL_INVOICE') uploadingCi.value = true;
  else uploadingPl.value = true;

  try {
    const fileName = category === 'COMMERCIAL_INVOICE'
      ? `CI-${activeOrder.value.order_number}.pdf`
      : `PL-${activeOrder.value.order_number}.pdf`;
    const res = await apiRequest('/storage/upload', {
      method: 'POST',
      body: JSON.stringify({
        order_id: activeOrder.value.id,
        file_name: fileName,
        category,
        mime_type: 'application/pdf',
        file_size_bytes: 524000,
      }),
    });
    if (category === 'COMMERCIAL_INVOICE') {
      ciUrl.value = res.storage_url;
    } else {
      plUrl.value = res.storage_url;
    }
    alert(`[클라우드 R2 스토리지 업로드 완료]\n파일명: ${res.file_name}\n저장소 URL: ${res.storage_url}\n무결성 해시: ${res.sha256_hash}`);
  } catch (err: any) {
    alert(`업로드 실패: ${err.message}`);
  } finally {
    if (category === 'COMMERCIAL_INVOICE') uploadingCi.value = false;
    else uploadingPl.value = false;
  }
}

const showCustomsForm = ref(true);
const customsDeclNo = ref('EXP-KR-2026-99120');
const pol = ref('Busan Port (KRPUS)');
const pod = ref('Los Angeles (USLAX)');
const hsCode = ref('7323.93.0000');
const dutyTaxMinor = ref(27300);
const customsBroker = ref('Pantos Logistics Global');
const submittingCustoms = ref(false);

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

const orderCustoms = computed(() => {
  if (!activeOrder.value) return [];
  return allCustoms.value.filter(m => m.order_id === activeOrder.value.id || !m.order_id);
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
    const [ordRes, shpRes, cstRes] = await Promise.all([
      apiRequest('/trade/orders'),
      apiRequest('/logistics/shipments').catch(() => ({ shipments: [] })),
      apiRequest('/logistics/customs').catch(() => ({ manifests: [] })),
    ]);
    allOrders.value = ordRes.orders || [];
    allShipments.value = shpRes.shipments || [];
    allCustoms.value = cstRes.manifests || [];
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

async function handleCustomsSubmit() {
  if (!activeOrder.value) return;
  submittingCustoms.value = true;
  try {
    const res = await apiRequest('/logistics/customs', {
      method: 'POST',
      body: JSON.stringify({
        order_id: activeOrder.value.id,
        declaration_number: customsDeclNo.value,
        port_of_loading: pol.value,
        port_of_discharge: pod.value,
        hs_code: hsCode.value,
        duty_tax_amount_minor: dutyTaxMinor.value,
        customs_broker_name: customsBroker.value,
      }),
    });
    allCustoms.value.push(res);
    alert(`[관세청 통관필증 등록 완료]\n수출신고번호: ${res.declaration_number}\n통관상태: ${res.customs_status}`);
  } catch (err: any) {
    alert(`통관 등록 실패: ${err.message}`);
  } finally {
    submittingCustoms.value = false;
  }
}

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
.sort-box { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: var(--ws-text-muted); }
.sort-box .ws-input { width: 340px; font-size: 13px; padding: 8px 10px; }
.h-ico { color: var(--ws-accent); vertical-align: -2px; }
.xs-up { padding: 2px 8px; margin-left: 6px; }
.ws-field { margin-bottom: 12px; }
</style>
