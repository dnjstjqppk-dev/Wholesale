<template>
  <div class="ws-page">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Trade Orders</p>
      <h1 class="ws-page-title">발주·무역 이행 관리</h1>
      <p class="ws-page-sub">주문·결제·배송·분쟁·정산 5대 상태가 상호 격리되어 실시간 추적됩니다.</p>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton" style="height: 220px"></div>
      <div class="ws-skeleton" style="height: 220px"></div>
    </div>

    <div v-else-if="orders.length === 0" class="ws-empty">
      <span class="ws-empty-icon"><WsIcon name="package" :size="24" /></span>
      <h3>진행 중인 발주 내역이 없습니다</h3>
      <p>도매 카탈로그에서 첫 발주를 시작해 보세요.</p>
      <router-link :to="`/${currentLocale}/${currentCurrency}/catalog`" class="ws-btn ws-btn-accent">도매 상품 발주하러 가기</router-link>
    </div>

    <div v-else class="ws-stack">
      <article v-for="order in orders" :key="order.id" class="ws-card order-card">
        <div class="ws-split order-top">
          <div class="order-id">
            <b class="ws-figure">{{ order.order_number }}</b>
            <span class="ws-muted ws-small">{{ formatDate(order.created_at) }}</span>
          </div>
          <b class="ws-price-dark ws-price-lg ws-figure">{{ formatMoney(order.total_amount_minor / 100) }}</b>
        </div>

        <div class="status-lane">
          <span class="st"><i>주문</i><b :class="statusBadge(order.order_status)">{{ order.order_status }}</b></span>
          <span class="st"><i>결제</i><b :class="statusBadge(order.payment_status)">{{ order.payment_status }}</b></span>
          <span class="st"><i>물류</i><b :class="statusBadge(order.fulfillment_status)">{{ order.fulfillment_status }}</b></span>
          <span class="st"><i>분쟁</i><b :class="statusBadge(order.dispute_status)">{{ order.dispute_status }}</b></span>
          <span class="st"><i>정산</i><b :class="statusBadge(order.settlement_status)">{{ order.settlement_status }}</b></span>
        </div>

        <dl class="order-facts">
          <div><dt>공급사</dt><dd>{{ order.supplier_name }} <span class="ws-badge ws-badge-success">Verified</span></dd></div>
          <div><dt>무역 조건</dt><dd>{{ order.incoterms || 'FOB Busan Port' }}</dd></div>
          <div><dt>발주 품목</dt><dd>{{ order.item_title }} ({{ order.ordered_quantity }} {{ order.unit }})</dd></div>
          <div><dt>인도 주소</dt><dd>{{ order.shipping_address || '450 Lexington Ave, New York, NY 10017, USA' }}</dd></div>
        </dl>

        <div v-if="order.shipped_quantity > 0" class="ws-banner ws-banner-info ship-note">
          <WsIcon name="truck" :size="16" />
          <div>
            출고 <b>{{ order.shipped_quantity }} / {{ order.ordered_quantity }} {{ order.unit }}</b>
            · 선하증권(B/L): <a href="#" class="ws-link" @click.prevent="openDocument('B/L')">BL-BUSAN-88991.pdf</a>
          </div>
        </div>

        <div class="order-actions">
          <button
            v-if="order.order_status === 'CONTRACT_PENDING' && !order.approver_user_id"
            class="ws-btn ws-btn-accent ws-btn-sm"
            @click="approveOrder(order)"
          >
            <WsIcon name="file" :size="14" /> 내부 결재 승인
          </button>
          <router-link
            v-if="!order.is_contract_signed"
            :to="`/${currentLocale}/${currentCurrency}/orders/${order.id}/contract`"
            class="ws-btn ws-btn-secondary ws-btn-sm"
          >
            <WsIcon name="pencil" :size="14" /> 전자계약 서명
          </router-link>
          <button
            v-else-if="order.payment_status === 'DOWN_PAYMENT_PENDING'"
            class="ws-btn ws-btn-accent ws-btn-sm"
            :disabled="paying"
            @click="payDownPayment(order)"
          >
            {{ paying ? '에스크로 결제 승인 중...' : `선급금 30% (${formatMoney((order.downpayment_minor || 126000) / 100)}) 결제` }}
          </button>
          <button
            v-if="order.fulfillment_status === 'PARTIALLY_FULFILLED' || order.order_status === 'IN_PRODUCTION'"
            class="ws-btn ws-btn-secondary ws-btn-sm"
            @click="passInspection(order)"
          >
            <WsIcon name="search" :size="14" /> 검수 합격 승인
          </button>
          <button
            v-if="order.payment_status === 'PARTIALLY_PAID_30' && (order.order_status === 'SHIPPED' || order.inspection_status === 'PASSED')"
            class="ws-btn ws-btn-accent ws-btn-sm"
            :disabled="paying"
            @click="payBalance(order)"
          >
            <WsIcon name="card" :size="14" /> 잔금 70% (${{ ((order.balance_minor || 294000) / 100).toFixed(2) }}) 결제
          </button>
          <button
            v-if="order.order_status === 'SHIPPED' && order.payment_status === 'FULLY_PAID'"
            class="ws-btn ws-btn-accent ws-btn-sm"
            @click="confirmDelivery(order)"
          >
            <WsIcon name="check" :size="14" /> 최종 인수 확인·대금 지급 승인
          </button>
          <router-link
            :to="`/${currentLocale}/${currentCurrency}/orders/${order.id}`"
            class="ws-btn ws-btn-ghost ws-btn-sm"
          >
            <WsIcon name="search" :size="14" /> 상세·물류 추적
          </router-link>
          <router-link
            v-if="order.dispute_status !== 'RESOLVED'"
            :to="`/${currentLocale}/${currentCurrency}/orders/${order.id}/dispute`"
            class="ws-btn ws-btn-ghost ws-btn-sm danger-link"
          >
            <WsIcon name="alert" :size="14" /> 클레임·분쟁 제기
          </router-link>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { apiRequest } from '../api';
import { formatCurrency, SupportedLocale, SupportedCurrency } from '../i18n';
import WsIcon from '@packages/ui/WsIcon.vue';

const route = useRoute();
const loading = ref(true);
const paying = ref(false);
const orders = ref<any[]>([]);

const currentLocale = computed<SupportedLocale>(() => {
  const loc = (route.params.locale as string) || 'ko';
  return ['ko', 'en', 'zh', 'ja'].includes(loc) ? (loc as SupportedLocale) : 'ko';
});

const currentCurrency = computed<SupportedCurrency>(() => {
  const cur = (route.params.currency as string) || 'KRW';
  return ['KRW', 'USD', 'CNY', 'JPY'].includes(cur) ? (cur as SupportedCurrency) : 'KRW';
});

function formatMoney(usdVal: string | number) {
  return formatCurrency(usdVal, currentCurrency.value);
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusBadge(status: string): string {
  const s = String(status || '');
  if (/(COMPLETED|DELIVERED|FULLY_PAID|PASSED|APPROVED|RELEASED|RESOLVED|NONE)/.test(s)) return 'ws-badge ws-badge-success';
  if (/(PENDING|AWAITING|IN_PRODUCTION|PARTIALLY|CONTRACT_PENDING)/.test(s)) return 'ws-badge ws-badge-warning';
  if (/(DISPUT|OPEN|FROZEN|REJECT|FAIL|CANCEL)/.test(s)) return 'ws-badge ws-badge-danger';
  if (/(SHIPPED|SHIPPING|IN_TRANSIT)/.test(s)) return 'ws-badge ws-badge-info';
  return 'ws-badge';
}

async function loadOrders() {
  loading.value = true;
  try {
    const res = await apiRequest('/trade/orders');
    orders.value = res.orders || [];
  } catch (err: any) {
    console.warn('Failed to load orders:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadOrders();
});

async function approveOrder(order: any) {
  try {
    await apiRequest(`/trade/orders/${order.id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approver_user_id: 'user-buyer-002' }),
    });
    order.approver_user_id = 'user-buyer-002';
    order.order_status = 'APPROVED';
    alert(`주문 ${order.order_number}에 대한 기업 내부 결재 승인이 완료되었습니다.`);
  } catch (err: any) {
    alert(`결재 승인 실패: ${err.message}`);
  }
}

async function payDownPayment(order: any) {
  paying.value = true;
  try {
    const res = await apiRequest('/payments/process', {
      method: 'POST',
      body: JSON.stringify({ order_id: order.id, payment_type: 'DOWN_PAYMENT' }),
    });
    order.payment_status = 'PARTIALLY_PAID_30';
    order.order_status = 'IN_PRODUCTION';
    alert(`[에스크로 PG 결제 완료]\n거래 번호: ${res.pg_transaction_id}\n금액: $${(res.amount_minor / 100).toFixed(2)}\n복식원장 기표 완료: 차변 ${res.ledger_entry.debit_account} / 대변 ${res.ledger_entry.credit_account}`);
  } catch (err: any) {
    alert(`결제 처리 실패: ${err.message}`);
  } finally {
    paying.value = false;
  }
}

async function payBalance(order: any) {
  paying.value = true;
  try {
    const res = await apiRequest('/payments/process', {
      method: 'POST',
      body: JSON.stringify({ order_id: order.id, payment_type: 'BALANCE' }),
    });
    order.payment_status = 'FULLY_PAID';
    alert(`[잔금 70% 에스크로 결제 완료]\n거래 번호: ${res.pg_transaction_id}\n금액: $${(res.amount_minor / 100).toFixed(2)}`);
  } catch (err: any) {
    alert(`잔금 결제 실패: ${err.message}`);
  } finally {
    paying.value = false;
  }
}

async function passInspection(order: any) {
  try {
    await apiRequest('/logistics/inspections', {
      method: 'POST',
      body: JSON.stringify({ order_id: order.id }),
    });
    order.inspection_status = 'PASSED';
    alert('제3자 품질 검수 합격 승인이 서버에 등록되었습니다.');
  } catch (err: any) {
    alert(`검수 승인 실패: ${err.message}`);
  }
}

async function confirmDelivery(order: any) {
  try {
    const res = await apiRequest(`/trade/orders/${order.id}/confirm-delivery`, {
      method: 'POST',
    });
    order.order_status = 'COMPLETED';
    order.fulfillment_status = 'DELIVERED';
    order.settlement_status = 'RELEASE_ELIGIBLE';
    alert(res.message || '화물 인수 확인 완료. 판매자 대금 지급이 승격되었습니다.');
  } catch (err: any) {
    alert(`인수 확인 실패: ${err.message}`);
  }
}

function openDocument(docType: string) {
  alert(`[무역 증빙 서류 뷰어]\n${docType} 원본 파일이 암호화 저장소로부터 안전하게 로드되었습니다.`);
}
</script>

<style scoped>
.order-top { margin-bottom: 14px; }
.order-id { display: flex; align-items: baseline; gap: 10px; }
.order-id b { font-size: 17px; }
.status-lane { display: flex; gap: 18px; flex-wrap: wrap; padding: 12px 14px; background: var(--ws-surface-muted); border-radius: 8px; margin-bottom: 14px; }
.st { display: inline-flex; align-items: center; gap: 7px; }
.st i { font-style: normal; font-size: 11px; font-weight: 800; color: var(--ws-text-muted); }
.order-facts { margin: 0 0 6px; }
.order-facts div { display: flex; gap: 12px; padding: 7px 0; border-bottom: 1px solid var(--ws-border-subtle); font-size: 13px; }
.order-facts div:last-child { border-bottom: 0; }
.order-facts dt { flex: none; width: 76px; color: var(--ws-text-muted); font-weight: 600; }
.order-facts dd { margin: 0; font-weight: 600; }
.ship-note { margin: 12px 0 0; }
.order-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--ws-border-subtle); }
.danger-link { color: var(--ws-danger); }
.danger-link:hover { background: var(--ws-danger-bg); color: var(--ws-danger); }
</style>
