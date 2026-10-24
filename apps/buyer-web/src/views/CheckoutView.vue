<template>
  <div class="checkout-page">
    <div class="checkout-header">
      <h2>B2B 도매 수주 계약서 작성 및 체크아웃 (Trade Checkout)</h2>
      <p class="subtitle">국제 무역 표준 규정에 따라 전자 계약서가 생성되고 에스크로 결제 계좌가 발급됩니다.</p>
    </div>

    <div v-if="loading" class="loading-state">
      도매 계약 및 에스크로 정산 조건을 API 서버에서 확인 중입니다...
    </div>

    <div v-else class="checkout-layout">
      <!-- Left: Form Sections -->
      <div class="checkout-forms">
        <!-- 1. Buyer & Consignee -->
        <div class="form-card">
          <div class="card-head">
            <span class="step-num">1</span>
            <h3>수하인 및 구매 기업 정보 (Consignee)</h3>
          </div>
          <div class="form-grid">
            <div>
              <label>수하인 기업명</label>
              <input v-model="consignee.companyName" type="text" />
            </div>
            <div>
              <label>사업자/수입자 등록번호 (EIN/VAT)</label>
              <input v-model="consignee.taxId" type="text" />
            </div>
            <div class="span-2">
              <label>도착지 항구 및 인도 주소 (Destination Port)</label>
              <input v-model="consignee.destinationAddress" type="text" />
            </div>
          </div>
        </div>

        <!-- 2. Incoterms & Trade Terms -->
        <div class="form-card">
          <div class="card-head">
            <span class="step-num">2</span>
            <h3>무역 조건 및 운송 협약 (Incoterms® 2020)</h3>
          </div>
          <div class="form-grid">
            <div>
              <label>인도 조건 (Incoterms)</label>
              <select v-model="tradeTerms.incoterms">
                <option value="FOB Busan Port">FOB Busan Port (본선인도가산)</option>
                <option value="CIF Incheon">CIF (운임보험료포함인도)</option>
                <option value="EXW Factory">EXW (공장인도)</option>
                <option value="DDP Destination">DDP (관세지급인도)</option>
              </select>
            </div>
            <div>
              <label>예상 생산 완료 납기</label>
              <input :value="`${checkoutItems[0]?.lead_time_days || 14} 영업일 이내 선적항 출고`" type="text" disabled />
            </div>
            <div class="span-2">
              <label>품질 검수 조건</label>
              <div class="spec-note">
                ✓ 선적 전 제3자 공인 검수(SGS/TÜV AQL 2.5) 통과 필수 · 불합격 시 재생산 또는 에스크로 전액 환불
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Escrow Payment Schedule -->
        <div class="form-card">
          <div class="card-head">
            <span class="step-num">3</span>
            <h3>에스크로 분할 결제 일정 (Payment Schedule)</h3>
          </div>
          <div class="schedule-table-wrap">
            <table class="schedule-table">
              <thead>
                <tr>
                  <th>회차</th>
                  <th>결제 항목</th>
                  <th>비율</th>
                  <th>금액</th>
                  <th>정산 지급 조건</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1차</td>
                  <td><strong>선급금 (Down Payment)</strong></td>
                  <td>30%</td>
                  <td class="amount orange">{{ formatMoney(downPaymentAmount) }}</td>
                  <td>계약 체결 후 에스크로 가상계좌 입금 즉시 생산 착수</td>
                </tr>
                <tr>
                  <td>2차</td>
                  <td><strong>잔금 (Final Balance)</strong></td>
                  <td>70%</td>
                  <td class="amount">{{ formatMoney(balanceAmount) }}</td>
                  <td>선적 B/L 발행 및 제3자 검수 합격 후 공급사에 최종 정산 지급</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right: Order Confirmation Sticky Card -->
      <div class="checkout-sidebar">
        <div class="confirm-card">
          <h3>도매 발주 품목 및 금액 확인</h3>

          <div v-for="item in checkoutItems" :key="item.id" class="item-summary-box">
            <span class="badge-sup">🏢 {{ item.supplier_name }}</span>
            <h4>{{ item.title }}</h4>
            <div class="meta-line">
              <span>수량: {{ item.quantity }} {{ item.unit }}</span>
              <span>단가: {{ formatMoney(item.unit_price) }}</span>
            </div>
            <div class="meta-line subtotal-line">
              <span>품목 소계:</span>
              <strong>{{ formatMoney(item.total_price || (item.quantity * parseFloat(item.unit_price))) }}</strong>
            </div>
          </div>

          <div class="price-breakdown">
            <div class="row">
              <span>물품 총 공급가액 (FOB)</span>
              <span>{{ formatMoney(totalAmount) }}</span>
            </div>
            <div class="row">
              <span>무역보증(Trade Assurance) 수수료</span>
              <span class="free">무료 (플랫폼 부담)</span>
            </div>
            <div class="row total">
              <span>최종 계약 총액</span>
              <span>{{ formatMoney(totalAmount) }}</span>
            </div>
            <div class="row downpayment-row">
              <span>1차 선급금 (30%)</span>
              <span class="val-dp">{{ formatMoney(downPaymentAmount) }}</span>
            </div>
          </div>

          <div class="legal-notice">
            ※ [계약서 발급] 클릭 시 ICC 표준 국제매매계약서가 생성되며 SHA-256 해시가 부여됩니다. 전자서명 후 생산이 개시됩니다.
          </div>

          <p v-if="error" class="error-msg">{{ error }}</p>

          <button
            class="btn-generate-contract"
            :disabled="submitting || checkoutItems.length === 0"
            @click="generateContract"
          >
            {{ submitting ? '계약서 생성 및 주문 접수 중...' : '📝 최종 도매 계약서 발급 및 주문 체결 →' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiRequest } from '../api';
import { formatCurrency, SupportedLocale, SupportedCurrency } from '../i18n';

const router = useRouter();
const route = useRoute();

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

const loading = ref(true);
const submitting = ref(false);
const error = ref('');
const checkoutItems = ref<any[]>([]);

const consignee = ref({
  companyName: 'Metro Wholesale Imports LLC',
  taxId: 'US-EIN-98-7654321',
  destinationAddress: 'Port of Los Angeles / 1000 Waterfront Way, San Pedro, CA 90731, USA',
});

const tradeTerms = ref({
  incoterms: 'FOB Busan Port',
});

async function loadCheckoutData() {
  loading.value = true;
  try {
    const listingId = route.query.listing_id as string;
    const qty = parseInt(route.query.quantity as string, 10);
    const unitPrice = route.query.unit_price as string;

    if (listingId && qty) {
      // Immediate Checkout from PDP
      const listing = await apiRequest(`/catalog/listings/${listingId}`);
      checkoutItems.value = [
        {
          id: `item-${Date.now()}`,
          listing_id: listingId,
          title: listing.title,
          supplier_name: listing.supplier_name,
          supplier_organization_id: listing.organization_id,
          unit: listing.unit || 'pcs',
          quantity: qty,
          unit_price: unitPrice || listing.price_tiers[0]?.unit_price || '4.20',
          total_price: (qty * parseFloat(unitPrice || listing.price_tiers[0]?.unit_price || '4.20')).toFixed(2),
          lead_time_days: listing.lead_time_days || 14,
          incoterms: listing.incoterms || 'FOB Busan Port',
        },
      ];
    } else {
      // Checkout from Cart
      const cartRes = await apiRequest('/cart');
      checkoutItems.value = cartRes?.items || [];
    }
  } catch (err) {
    console.warn('Failed to load checkout data:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadCheckoutData();
});

const totalAmount = computed(() => {
  return checkoutItems.value.reduce((sum, item) => {
    const p = parseFloat(item.total_price || (item.quantity * parseFloat(item.unit_price)));
    return sum + (isNaN(p) ? 0 : p);
  }, 0);
});

const downPaymentAmount = computed(() => totalAmount.value * 0.3);
const balanceAmount = computed(() => totalAmount.value * 0.7);

async function generateContract() {
  if (checkoutItems.value.length === 0) return;
  submitting.value = true;
  error.value = '';

  try {
    const firstItem = checkoutItems.value[0];
    const res = await apiRequest('/trade/orders', {
      method: 'POST',
      body: JSON.stringify({
        listing_id: firstItem.listing_id,
        title: firstItem.title,
        supplier_name: firstItem.supplier_name,
        supplier_organization_id: firstItem.supplier_organization_id,
        quantity: firstItem.quantity,
        unit: firstItem.unit,
        unit_price: firstItem.unit_price,
        incoterms: tradeTerms.value.incoterms,
        shipping_address: consignee.value.destinationAddress,
        buyer_name: consignee.value.companyName,
        clear_cart: !route.query.listing_id, // Clear cart if from cart
      }),
    });

    const orderId = res.id;
    alert(`[도매 수주 계약서 발급 완료]\n주문번호: ${res.order_number}\n계약금(30%): $${(res.downpayment_minor / 100).toFixed(2)}\n전자서명 및 계약 체결 페이지로 이동합니다.`);
    router.push(`/${currentLocale.value}/${currentCurrency.value}/orders/${orderId}/contract`);
  } catch (err: any) {
    error.value = err.message || '계약서 생성 중 오류가 발생했습니다.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.checkout-page {
  max-width: 1320px;
  margin: 0 auto;
  padding: 24px 16px 60px;
}
.checkout-header h2 {
  font-size: 22px;
  color: #0F172A;
  margin: 0 0 6px;
  font-weight: 800;
}
.subtitle {
  color: #64748B;
  font-size: 13px;
  margin-bottom: 24px;
}
.loading-state {
  padding: 40px;
  text-align: center;
  color: #64748B;
}

.checkout-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 28px;
  align-items: start;
}
.checkout-forms {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.form-card {
  background: #FFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 22px;
}
.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  border-bottom: 1px solid #F1F5F9;
  padding-bottom: 12px;
}
.step-num {
  width: 24px;
  height: 24px;
  background: #EA580C;
  color: #FFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
}
.card-head h3 {
  margin: 0;
  font-size: 16px;
  color: #0F172A;
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.form-grid .span-2 {
  grid-column: span 2;
}
.form-grid label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
}
.form-grid input, .form-grid select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #CBD5E1;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 13px;
}
.form-grid input:disabled {
  background: #F8FAFC;
  color: #64748B;
}
.spec-note {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 12px;
  color: #334155;
}

.schedule-table-wrap {
  overflow-x: auto;
}
.schedule-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.schedule-table th, .schedule-table td {
  border: 1px solid #E2E8F0;
  padding: 8px 10px;
  text-align: left;
}
.schedule-table th {
  background: #F8FAFC;
  font-weight: 700;
  color: #334155;
}
.schedule-table .amount {
  font-weight: 700;
  color: #1E293B;
}
.schedule-table .amount.orange {
  color: #EA580C;
}

/* Sidebar Confirmation Card */
.confirm-card {
  background: #FFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
}
.confirm-card h3 {
  font-size: 15px;
  color: #0F172A;
  margin: 0 0 16px;
  font-weight: 800;
  border-bottom: 1px solid #F1F5F9;
  padding-bottom: 10px;
}
.item-summary-box {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 14px;
}
.badge-sup {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
}
.item-summary-box h4 {
  margin: 6px 0;
  font-size: 13px;
  color: #1E293B;
  font-weight: 700;
}
.meta-line {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #64748B;
  margin-bottom: 2px;
}
.subtotal-line {
  border-top: 1px solid #E2E8F0;
  padding-top: 4px;
  margin-top: 4px;
  color: #0F172A;
}

.price-breakdown {
  border-top: 1px solid #F1F5F9;
  padding-top: 12px;
  margin-bottom: 16px;
}
.row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
  color: #475569;
}
.row.total {
  font-weight: 800;
  font-size: 15px;
  color: #0F172A;
  border-top: 1px solid #E2E8F0;
  margin-top: 8px;
  padding-top: 10px;
}
.row .free {
  color: #16A34A;
  font-weight: 700;
}
.row.downpayment-row {
  background: #FFF7ED;
  border-radius: 4px;
  padding: 8px;
  margin-top: 8px;
  font-weight: 700;
}
.val-dp {
  color: #EA580C;
  font-size: 15px;
  font-weight: 800;
}

.legal-notice {
  font-size: 11px;
  color: #64748B;
  line-height: 1.4;
  margin-bottom: 16px;
  background: #F8FAFC;
  padding: 10px;
  border-radius: 4px;
}
.error-msg {
  background: #FEF2F2;
  color: #B91C1C;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 14px;
}

.btn-generate-contract {
  width: 100%;
  background: #FF6A00;
  color: #FFF;
  border: none;
  padding: 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}
.btn-generate-contract:hover {
  background: #E55E00;
}
.btn-generate-contract:disabled {
  background: #CBD5E1;
  cursor: not-allowed;
}
</style>
