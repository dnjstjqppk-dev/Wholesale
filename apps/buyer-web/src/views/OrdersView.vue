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
          <button v-if="order.payment_status === 'DOWN_PAYMENT_PENDING'" class="btn-action pay" @click="payDownPayment(order)">
            계약금 30% ($1,440.00) 결제
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
import { ref } from 'vue';

const orders = ref([
  {
    id: 'ORD-2026-0001',
    order_number: 'ORD-2026-0001',
    created_at: '2026-10-18 15:30',
    supplier_name: 'Precision Korea Co., Ltd.',
    currency: 'USD',
    total_amount_minor: 480000,
    order_status: 'IN_PRODUCTION',
    payment_status: 'PARTIALLY_PAID_30',
    fulfillment_status: 'READY_TO_DISPATCH',
    dispute_status: 'NONE',
    settlement_status: 'HELD_ESCROW',
  },
]);

function payDownPayment(order: any) {
  order.payment_status = 'PARTIALLY_PAID_30';
  order.order_status = 'IN_PRODUCTION';
  alert('계약금 30%가 에스크로 가상계좌로 입금 확정되었습니다.');
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

