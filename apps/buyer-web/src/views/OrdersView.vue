<template>
  <div class="orders-page">
    <h2>구매 기업 발주 및 무역 이행 관리 (Trade Orders)</h2>
    <p class="subtitle">주문·결제·배송·분쟁·정산의 5대 상태가 상호 격리되어 추적됩니다.</p>

    <div class="order-list">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="card-head">
          <div>
            <span class="ord-num">{{ order.order_number }}</span>
            <span class="ord-date">{{ order.created_at }}</span>
          </div>
          <span class="total-price">{{ order.currency }} ${{ (order.total_amount_minor / 100).toFixed(2) }}</span>
        </div>

        <!-- 5 Separate State Tags -->
        <div class="state-badges">
          <div class="badge-item"><span class="k">주문:</span><span class="v ord">{{ order.order_status }}</span></div>
          <div class="badge-item"><span class="k">결제:</span><span class="v pay">{{ order.payment_status }}</span></div>
          <div class="badge-item"><span class="k">물류:</span><span class="v ship">{{ order.fulfillment_status }}</span></div>
          <div class="badge-item"><span class="k">분쟁:</span><span class="v disp">{{ order.dispute_status }}</span></div>
          <div class="badge-item"><span class="k">정산:</span><span class="v set">{{ order.settlement_status }}</span></div>
        </div>

        <div class="card-body">
          <p><strong>공급사:</strong> {{ order.supplier_name }} (Verified)</p>
          <p><strong>인도 조건:</strong> FOB Busan Port, Korea (Incoterms 2020)</p>
          <p><strong>품목:</strong> 산업용 초경량 스테인리스 진공 텀블러 벌크팩 1,000 pcs</p>
        </div>

        <div class="card-actions">
          <router-link
            v-if="!order.is_contract_signed"
            :to="`/${$route.params.locale || 'ko'}/${$route.params.currency || 'KRW'}/orders/${order.id}/contract`"
            class="btn-action contract"
          >
            ✍️ 전자계약 서명하기 (Sign Contract)
          </router-link>
          <button
            v-else-if="order.payment_status === 'DOWN_PAYMENT_PENDING'"
            class="btn-action pay"
            :disabled="paying"
            @click="payDownPayment(order)"
          >
            {{ paying ? '에스크로 결제 승인 중...' : `계약금 30% ($${((order.downpayment_minor || 126000) / 100).toFixed(2)}) 결제` }}
          </button>
          <button v-if="order.order_status === 'INSPECTION_PENDING'" class="btn-action inspect" @click="passInspection(order)">
            제3자 품질 검수 합격 승인
          </button>
          <router-link :to="`/${$route.params.locale || 'ko'}/${$route.params.currency || 'KRW'}/orders/${order.id}/dispute`" class="btn-action dispute">
            클레임 및 분쟁 제기
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';

const loading = ref(true);
const paying = ref(false);
const error = ref('');

const orders = ref<any[]>([
  {
    id: 'ord-20261018-001',
    order_number: 'ORD-20261018-001',
    created_at: '2026-10-18 15:30',
    supplier_name: 'Precision Korea Co., Ltd.',
    currency: 'USD',
    total_amount_minor: 420000,
    downpayment_minor: 126000,
    balance_minor: 294000,
    order_status: 'IN_PRODUCTION',
    payment_status: 'PARTIALLY_PAID_30',
    fulfillment_status: 'READY_TO_DISPATCH',
    dispute_status: 'NONE',
    settlement_status: 'HELD_ESCROW',
    is_contract_signed: true,
  },
]);

async function loadOrders() {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiRequest('/trade/orders');
    if (res && res.orders && res.orders.length > 0) {
      orders.value = res.orders;
    }
  } catch (err: any) {
    // Keep baseline list
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadOrders();
});

async function payDownPayment(order: any) {
  paying.value = true;
  try {
    const res = await apiRequest('/payments/process', {
      method: 'POST',
      body: JSON.stringify({ order_id: order.id }),
    });
    order.payment_status = 'PARTIALLY_PAID_30';
    order.order_status = 'IN_PRODUCTION';
    alert(`[에스크로 PG 결제 및 원장 분개 완료]\n거래 ID: ${res.pg_transaction_id}\n결제 금액: $${(res.amount_minor / 100).toFixed(2)} USD\n차변: ${res.ledger_entry.debit_account}\n대변: ${res.ledger_entry.credit_account}\n무결성 원장 분개가 완료되었습니다.`);
  } catch (err: any) {
    alert(`결제 처리 실패: ${err.message}`);
  } finally {
    paying.value = false;
  }
}

function passInspection(order: any) {
  order.order_status = 'SHIPPED';
  order.settlement_status = 'RELEASE_ELIGIBLE';
  alert('품질 검수가 합격 처리되어 정산 지급 보류가 해제 가능 상태로 전환되었습니다.');
}
</script>

<style scoped>
.orders-page { max-width: 1000px; margin: 0 auto; }
h2 { margin: 0 0 6px 0; font-size: 20px; color: #172B4D; }
.subtitle { color: #64748B; font-size: 13px; margin-bottom: 24px; }
.order-list { display: flex; flex-direction: column; gap: 20px; }
.order-card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.card-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; margin-bottom: 14px; }
.ord-num { font-weight: 700; color: #172B4D; font-size: 16px; margin-right: 8px; }
.ord-date { font-size: 12px; color: #64748B; }
.total-price { font-size: 18px; font-weight: 800; color: #C2410C; font-variant-numeric: tabular-nums; }
.state-badges { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
.badge-item { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 4px; padding: 4px 8px; font-size: 11px; }
.badge-item .k { color: #64748B; margin-right: 4px; }
.badge-item .v { font-weight: 700; }
.v.ord { color: #1D4ED8; }
.v.pay { color: #D97706; }
.v.ship { color: #0E7490; }
.v.disp { color: #15803D; }
.v.set { color: #7C3AED; }
.card-body p { margin: 4px 0; font-size: 13px; color: #42526E; }
.card-actions { border-top: 1px solid #F1F5F9; padding-top: 14px; margin-top: 14px; display: flex; gap: 10px; }
.btn-action { padding: 8px 16px; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; text-decoration: none; }
.btn-action.pay { background: #C2410C; color: #FFF; border: none; }
.btn-action.inspect { background: #15803D; color: #FFF; border: none; }
.btn-action.dispute { background: #FFF; border: 1px solid #EF4444; color: #DC2626; }
</style>

