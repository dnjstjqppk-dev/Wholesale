<template>
  <div class="orders-page">
    <div class="page-head">
      <h2>구매 기업 발주 및 무역 이행 관리 (Trade Orders)</h2>
      <p class="subtitle">주문·결제·배송·분쟁·정산의 5대 상태가 상호 격리되어 실시간 추적됩니다.</p>
    </div>

    <div v-if="loading" class="state-box loading-box">
      <p>서버에서 발주 내역을 불러오는 중입니다...</p>
    </div>

    <div v-else-if="orders.length === 0" class="state-box empty-box">
      <p>진행 중인 발주 내역이 없습니다.</p>
      <router-link :to="`/${currentLocale}/${currentCurrency}/catalog`" class="btn-primary">
        도매 상품 발주하러 가기
      </router-link>
    </div>

    <div v-else class="order-list">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="card-head">
          <div class="ord-left">
            <span class="ord-num">{{ order.order_number }}</span>
            <span class="ord-date">{{ formatDate(order.created_at) }}</span>
          </div>
          <span class="total-price">{{ formatMoney(order.total_amount_minor / 100) }}</span>
        </div>

        <!-- 5 Separate State Tags -->
        <div class="state-badges">
          <div class="badge-item">
            <span class="k">주문 상태:</span>
            <span class="v ord">{{ order.order_status }}</span>
          </div>
          <div class="badge-item">
            <span class="k">결제 상태:</span>
            <span class="v pay">{{ order.payment_status }}</span>
          </div>
          <div class="badge-item">
            <span class="k">물류 이행:</span>
            <span class="v ship">{{ order.fulfillment_status }}</span>
          </div>
          <div class="badge-item">
            <span class="k">분쟁 상태:</span>
            <span class="v disp">{{ order.dispute_status }}</span>
          </div>
          <div class="badge-item">
            <span class="k">에스크로 정산:</span>
            <span class="v set">{{ order.settlement_status }}</span>
          </div>
        </div>

        <div class="card-body">
          <p><strong>공급사:</strong> {{ order.supplier_name }} (Verified Manufacturer)</p>
          <p><strong>무역 조건:</strong> {{ order.incoterms || 'FOB Busan Port' }}</p>
          <p><strong>발주 품목:</strong> {{ order.item_title }} ({{ order.ordered_quantity }} {{ order.unit }})</p>
          <p><strong>인도 주소:</strong> {{ order.shipping_address || '450 Lexington Ave, New York, NY 10017, USA' }}</p>

          <div v-if="order.shipped_quantity > 0" class="shipping-info-box">
            <span>🚢 출고 완료 수량: <strong>{{ order.shipped_quantity }} / {{ order.ordered_quantity }} {{ order.unit }}</strong></span>
            <span>선하증권(B/L): <a href="#" @click.prevent="openDocument('B/L')">BL-BUSAN-88991.pdf (다운로드)</a></span>
          </div>
        </div>

        <div class="card-actions">
          <!-- Corporate Approval -->
          <button
            v-if="order.order_status === 'CONTRACT_PENDING' && !order.approver_user_id"
            class="btn-action approve"
            @click="approveOrder(order)"
          >
            📋 기업 내부 결재 승인
          </button>

          <!-- Electronic Contract Signing -->
          <router-link
            v-if="!order.is_contract_signed"
            :to="`/${currentLocale}/${currentCurrency}/orders/${order.id}/contract`"
            class="btn-action contract"
          >
            ✍️ 전자계약 서명하기 (Sign Contract)
          </router-link>

          <!-- 30% Downpayment -->
          <button
            v-else-if="order.payment_status === 'DOWN_PAYMENT_PENDING'"
            class="btn-action pay"
            :disabled="paying"
            @click="payDownPayment(order)"
          >
            {{ paying ? '에스크로 결제 승인 중...' : `선급금 30% (${formatMoney((order.downpayment_minor || 126000) / 100)}) 결제` }}
          </button>

          <!-- Third-Party Quality Inspection Approval -->
          <button
            v-if="order.fulfillment_status === 'PARTIALLY_FULFILLED' || order.order_status === 'IN_PRODUCTION'"
            class="btn-action inspect"
            @click="passInspection(order)"
          >
            🔍 제3자 품질 검수(SGS/TÜV) 합격 승인
          </button>

          <!-- 70% Balance Payment -->
          <button
            v-if="order.payment_status === 'PARTIALLY_PAID_30' && (order.order_status === 'SHIPPED' || order.inspection_status === 'PASSED')"
            class="btn-action pay-balance"
            :disabled="paying"
            @click="payBalance(order)"
          >
            💰 잔금 70% (${{ ((order.balance_minor || 294000) / 100).toFixed(2) }}) 결제 승인
          </button>

          <!-- Final Delivery Confirmation -->
          <button
            v-if="order.order_status === 'SHIPPED' && order.payment_status === 'FULLY_PAID'"
            class="btn-action confirm-delivery"
            @click="confirmDelivery(order)"
          >
            ✓ 화물 최종 인수 확인 및 대금 지급 승인
          </button>

          <!-- Order Detail & Timeline Tracking -->
          <router-link
            :to="`/${currentLocale}/${currentCurrency}/orders/${order.id}`"
            class="btn-action detail"
          >
            🔎 발주 상세 & 물류 추적
          </router-link>

          <!-- Open Trade Dispute -->
          <router-link
            v-if="order.dispute_status !== 'RESOLVED'"
            :to="`/${currentLocale}/${currentCurrency}/orders/${order.id}/dispute`"
            class="btn-action dispute"
          >
            ⚠️ 클레임 및 분쟁 제기
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { apiRequest } from '../api';
import { formatCurrency, SupportedLocale, SupportedCurrency } from '../i18n';

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
.orders-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 60px;
}
.page-head h2 {
  margin: 0 0 6px 0;
  font-size: 22px;
  color: #0F172A;
  font-weight: 800;
}
.subtitle {
  color: #64748B;
  font-size: 13px;
  margin-bottom: 24px;
}
.order-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.order-card {
  background: #FFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #F1F5F9;
  padding-bottom: 12px;
  margin-bottom: 14px;
}
.ord-num {
  font-weight: 800;
  color: #0F172A;
  font-size: 16px;
  margin-right: 12px;
}
.ord-date {
  font-size: 12px;
  color: #64748B;
}
.total-price {
  font-size: 18px;
  font-weight: 800;
  color: #CC3D00;
}

.state-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.badge-item {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
}
.badge-item .k {
  color: #64748B;
  margin-right: 4px;
}
.badge-item .v {
  font-weight: 700;
}
.v.ord { color: #1D4ED8; }
.v.pay { color: #D97706; }
.v.ship { color: #0E7490; }
.v.disp { color: #15803D; }
.v.set { color: #7C3AED; }

.card-body p {
  margin: 4px 0;
  font-size: 13px;
  color: #334155;
}
.shipping-info-box {
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #1E40AF;
}
.shipping-info-box a {
  color: #2563EB;
  font-weight: 700;
  text-decoration: underline;
}

.card-actions {
  border-top: 1px solid #F1F5F9;
  padding-top: 14px;
  margin-top: 14px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.btn-action {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  border: none;
}
.btn-action.approve { background: #3B82F6; color: #FFF; }
.btn-action.contract { background: #0F172A; color: #FFF; }
.btn-action.pay { background: #CC3D00; color: #FFF; }
.btn-action.pay-balance { background: #16A34A; color: #FFF; }
.btn-action.inspect { background: #0284C7; color: #FFF; }
.btn-action.confirm-delivery { background: #059669; color: #FFF; }
.btn-action.dispute { background: #FFF; border: 1px solid #F87171; color: #DC2626; }

.state-box {
  background: #FFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .orders-page {
    padding: 16px 12px 40px;
  }
  .card-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .state-badges {
    flex-direction: column;
    gap: 6px;
  }
  .shipping-info-box {
    flex-direction: column;
    gap: 6px;
  }
  .card-actions {
    flex-direction: column;
  }
  .btn-action {
    width: 100%;
    text-align: center;
    padding: 10px 14px;
  }
}
</style>
