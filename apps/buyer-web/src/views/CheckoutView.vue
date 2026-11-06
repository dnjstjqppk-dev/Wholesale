<template>
  <div class="ws-page ws-page-wide">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Trade Checkout</p>
      <h1 class="ws-page-title">수주 계약서 작성·체크아웃</h1>
      <p class="ws-page-sub">국제 무역 표준에 따라 전자 계약서가 생성되고 에스크로 결제 계좌가 발급됩니다.</p>
    </div>

    <div class="ws-steps">
      <div class="ws-step ws-step-done"><span class="ws-step-num">✓</span><span class="ws-step-label">장바구니</span></div>
      <div class="ws-step ws-step-active"><span class="ws-step-num">2</span><span class="ws-step-label">계약·체크아웃</span></div>
      <div class="ws-step"><span class="ws-step-num">3</span><span class="ws-step-label">에스크로 결제</span></div>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton" style="height: 180px"></div>
      <div class="ws-skeleton" style="height: 180px"></div>
    </div>

    <div v-else class="co-grid">
      <div class="ws-stack">
        <section class="ws-card">
          <div class="ws-card-head"><h3>1 · 수하인·구매 기업 정보</h3><span class="ws-badge ws-badge-outline">Consignee</span></div>
          <div class="ws-grid-2">
            <div class="ws-field">
              <label>수하인 기업명</label>
              <input v-model="consignee.companyName" type="text" />
            </div>
            <div class="ws-field">
              <label>사업자/수입자 등록번호 (EIN/VAT)</label>
              <input v-model="consignee.taxId" type="text" />
            </div>
          </div>
          <div class="ws-field" style="margin-bottom: 0">
            <label>도착지 항구·인도 주소</label>
            <input v-model="consignee.destinationAddress" type="text" />
          </div>
        </section>

        <section class="ws-card">
          <div class="ws-card-head"><h3>2 · 무역 조건·운송 협약</h3><span class="ws-badge ws-badge-outline">Incoterms® 2020</span></div>
          <div class="ws-grid-2">
            <div class="ws-field">
              <label>인도 조건</label>
              <select v-model="tradeTerms.incoterms">
                <option value="FOB Busan Port">FOB Busan Port (본선인도가산)</option>
                <option value="CIF Incheon">CIF (운임보험료포함인도)</option>
                <option value="EXW Factory">EXW (공장인도)</option>
                <option value="DDP Destination">DDP (관세지급인도)</option>
              </select>
            </div>
            <div class="ws-field">
              <label>예상 생산 완료 납기</label>
              <input :value="`${checkoutItems[0]?.lead_time_days || 14} 영업일 이내 선적항 출고`" type="text" disabled />
            </div>
          </div>
          <div class="ws-banner ws-banner-success" style="margin-bottom: 0">
            <WsIcon name="check" :size="16" />
            <span>선적 전 제3자 공인 검수(SGS/TÜV AQL 2.5) 통과 필수 · 불합격 시 재생산 또는 에스크로 전액 환불</span>
          </div>
        </section>

        <section class="ws-card">
          <div class="ws-card-head"><h3>3 · 에스크로 분할 결제 일정</h3></div>
          <div class="ws-table-wrap">
            <div class="ws-table-scroll">
              <table class="ws-table">
                <thead><tr><th>회차</th><th>결제 항목</th><th>비율</th><th class="ws-num">금액</th><th>정산 지급 조건</th></tr></thead>
                <tbody>
                  <tr>
                    <td>1차</td>
                    <td class="ws-cell-main">선급금 (Down Payment)</td>
                    <td>30%</td>
                    <td class="ws-num"><b class="ws-price-dark">{{ formatMoney(downPaymentAmount) }}</b></td>
                    <td class="ws-cell-sub">계약 체결 후 에스크로 가상계좌 입금 즉시 생산 착수</td>
                  </tr>
                  <tr>
                    <td>2차</td>
                    <td class="ws-cell-main">잔금 (Final Balance)</td>
                    <td>70%</td>
                    <td class="ws-num"><b class="ws-figure">{{ formatMoney(balanceAmount) }}</b></td>
                    <td class="ws-cell-sub">선적 B/L 발행·제3자 검수 합격 후 공급사에 최종 정산 지급</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <aside class="ws-card confirm">
        <h3 class="ws-card-title">발주 품목·금액 확인</h3>
        <div v-for="item in checkoutItems" :key="item.id" class="co-item">
          <p class="ws-list-sub"><WsIcon name="building" :size="13" /> {{ item.supplier_name }}</p>
          <p class="ws-list-title">{{ item.title }}</p>
          <p class="co-meta">수량 {{ item.quantity }}{{ item.unit }} · 단가 {{ formatMoney(item.unit_price) }}</p>
          <p class="co-sub">품목 소계 <b class="ws-figure">{{ formatMoney(item.total_price || (item.quantity * parseFloat(item.unit_price))) }}</b></p>
        </div>
        <dl class="sum-rows">
          <div><dt>물품 총 공급가액 (FOB)</dt><dd class="ws-figure">{{ formatMoney(totalAmount) }}</dd></div>
          <div><dt>Trade Assurance 수수료</dt><dd class="free">무료</dd></div>
          <div class="total"><dt>최종 계약 총액</dt><dd class="ws-figure">{{ formatMoney(totalAmount) }}</dd></div>
          <div class="em"><dt>1차 선급금 (30%)</dt><dd class="ws-price-dark ws-figure">{{ formatMoney(downPaymentAmount) }}</dd></div>
        </dl>
        <p class="legal-note">계약서 발급 시 ICC 표준 국제매매계약서가 생성되고 SHA-256 해시가 부여됩니다. 전자서명 후 생산이 개시됩니다.</p>
        <p v-if="error" class="ws-error-text">{{ error }}</p>
        <button class="ws-btn ws-btn-accent ws-btn-block ws-btn-lg" :disabled="submitting || checkoutItems.length === 0" @click="generateContract">
          <span v-if="submitting" class="ws-spinner"></span>
          <WsIcon v-else name="pencil" :size="14" />
          {{ submitting ? '계약서 생성·주문 접수 중...' : '최종 계약서 발급·주문 체결' }}
        </button>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiRequest } from '../api';
import { formatCurrency, SupportedLocale, SupportedCurrency } from '../i18n';
import WsIcon from '@packages/ui/WsIcon.vue';

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
.co-grid { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 16px; align-items: start; }
.confirm { position: sticky; top: 84px; }
.co-item { padding: 12px 0; border-bottom: 1px solid var(--ws-border-subtle); }
.co-item p { margin: 0 0 4px; }
.co-meta { font-size: 12px; color: var(--ws-text-muted); }
.co-sub { display: flex; justify-content: space-between; font-size: 13px; color: var(--ws-text-2); }
.sum-rows { margin: 12px 0; }
.sum-rows div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--ws-border-subtle); font-size: 13px; }
.sum-rows div:last-child { border-bottom: 0; }
.sum-rows dt { color: var(--ws-text-2); }
.sum-rows dd { margin: 0; font-weight: 800; }
.sum-rows .free { color: var(--ws-success); font-size: 12px; }
.sum-rows .total dd { font-size: 17px; }
.sum-rows .em dd { font-size: 16px; }
.legal-note { font-size: 11px; color: var(--ws-text-muted); line-height: 1.6; background: var(--ws-surface-muted); border-radius: 8px; padding: 10px 12px; }
@media (max-width: 1024px) {
  .co-grid { grid-template-columns: minmax(0, 1fr); }
  .confirm { position: static; }
}
</style>
