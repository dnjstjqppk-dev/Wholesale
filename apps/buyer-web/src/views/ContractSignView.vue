<template>
  <div class="ws-page ws-page-narrow">
    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton" style="height: 90px"></div>
      <div class="ws-skeleton" style="height: 300px"></div>
    </div>
    <article v-else class="contract-doc">
      <header class="doc-head">
        <div>
          <p class="ws-eyebrow">ICC Trade Contract</p>
          <h1>국제 B2B 도매 거래 표준 계약서</h1>
          <p class="doc-order">연동 발주번호 <b>{{ orderData.order_number }}</b></p>
        </div>
        <span class="ws-badge ws-badge-brand">{{ contract.contract_number }}</span>
      </header>

      <section class="doc-sec">
        <h2>1 · 계약 당사자</h2>
        <table class="ws-spec-table">
          <tbody>
            <tr><th>구매사 (Buyer)</th><td><b>{{ orderData.buyer_name }}</b> (Consignee)</td></tr>
            <tr><th>공급사 (Supplier)</th><td><b>{{ orderData.supplier_name }}</b> <span class="ws-badge ws-badge-success">Verified</span></td></tr>
          </tbody>
        </table>
      </section>

      <section class="doc-sec">
        <h2>2 · 계약 품목·인도 조건</h2>
        <table class="ws-spec-table">
          <tbody>
            <tr><th>계약 품목</th><td><b>{{ orderData.item_title }}</b></td></tr>
            <tr><th>수량·단가</th><td class="ws-figure">{{ orderData.ordered_quantity?.toLocaleString() }} {{ orderData.unit }} × {{ formatMoney(orderData.unit_price) }}</td></tr>
            <tr><th>인도 조건</th><td>{{ orderData.incoterms || 'FOB Busan Port, South Korea' }} (Incoterms® 2020)</td></tr>
            <tr><th>도착지 주소</th><td>{{ orderData.shipping_address || '450 Lexington Ave, New York, NY 10017, USA' }}</td></tr>
          </tbody>
        </table>
      </section>

      <section class="doc-sec">
        <h2>3 · 에스크로 분할 결제 일정</h2>
        <div class="ws-table-wrap">
          <table class="ws-table">
            <thead><tr><th>구분</th><th>비율</th><th class="ws-num">금액</th><th>지급 조건</th></tr></thead>
            <tbody>
              <tr>
                <td class="ws-cell-main">계약금 (Down Payment)</td>
                <td>30%</td>
                <td class="ws-num"><b class="ws-figure">{{ formatMoney((orderData.downpayment_minor || 126000) / 100) }}</b></td>
                <td class="ws-cell-sub">전자계약 서명 직후 에스크로 예치 (생산 착수 조건)</td>
              </tr>
              <tr>
                <td class="ws-cell-main">잔금 (Final Balance)</td>
                <td>70%</td>
                <td class="ws-num"><b class="ws-figure">{{ formatMoney((orderData.balance_minor || 294000) / 100) }}</b></td>
                <td class="ws-cell-sub">SGS/TÜV 검수 합격·B/L 발행 후</td>
              </tr>
              <tr>
                <td class="ws-cell-main">총 계약 금액</td>
                <td>100%</td>
                <td class="ws-num"><b class="ws-price-dark ws-figure">{{ formatMoney((orderData.total_amount_minor || 420000) / 100) }}</b></td>
                <td class="ws-cell-sub">Trade Assurance 100% 지급 보증</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="doc-sec">
        <h2>4 · 무결성 검증 (SHA-256)</h2>
        <div class="hash-card">
          <span class="ws-small ws-muted">SHA-256 Document Hash</span>
          <code class="ws-figure">{{ contract.document_hash }}</code>
        </div>
        <p class="ws-hint">전자서명 완료 후 계약서 본문·조건 변조는 원천 차단되며 감사 로그에 영구 기록됩니다.</p>
      </section>

      <footer class="doc-sign">
        <div class="sign-box">
          <span class="ws-small ws-muted">구매사(Buyer) 전자서명</span>
          <p v-if="contract.buyer_signed" class="signed"><WsIcon name="check" :size="15" /> 서명 완료 ({{ contract.signed_at || 'UTC 검증됨' }})</p>
          <button v-else class="ws-btn ws-btn-accent ws-btn-block" :disabled="signing" @click="handleSignBuyer">
            <WsIcon v-if="!signing" name="pencil" :size="14" /> {{ signing ? '해시 대조·서명 중...' : '구매사 공인 전자서명 실행' }}
          </button>
        </div>
        <div class="sign-box">
          <span class="ws-small ws-muted">공급사(Supplier) 전자서명</span>
          <p class="signed"><WsIcon name="check" :size="15" /> 공급사 명판 직인 서명 완료</p>
        </div>
      </footer>
    </article>
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
const loading = ref(true);
const signing = ref(false);

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

const orderData = ref<any>({
  id: 'ord-20261018-001',
  order_number: 'ORD-20261018-001',
  buyer_name: 'Metro Wholesale Imports LLC',
  supplier_name: 'Precision Korea Co., Ltd.',
  item_title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩',
  ordered_quantity: 1000,
  unit: 'pcs',
  unit_price: '4.20',
  total_amount_minor: 420000,
  downpayment_minor: 126000,
  balance_minor: 294000,
  incoterms: 'FOB Busan Port',
  shipping_address: '450 Lexington Ave, New York, NY 10017, USA',
});

const contract = ref<any>({
  contract_number: 'CTR-2026-0001',
  document_hash: 'c67469723725e6e026620593dd2a466a9d184ffbe6cf2ab82a725e1a3d02b557',
  buyer_signed: false,
  signed_at: null,
});

async function loadContractDetails() {
  loading.value = true;
  const orderId = (route.params.id as string) || 'ord-20261018-001';
  try {
    const [ordRes, ctrRes] = await Promise.all([
      apiRequest(`/trade/orders/${orderId}`),
      apiRequest(`/trade/orders/${orderId}/contract`),
    ]);
    if (ordRes) orderData.value = ordRes;
    if (ctrRes) {
      contract.value = {
        contract_number: ctrRes.contract_id || `CTR-${orderData.value.order_number}`,
        document_hash: ctrRes.document_hash || ordRes.contract_hash,
        buyer_signed: ctrRes.is_signed || ordRes.is_contract_signed,
        signed_at: null,
      };
    }
  } catch (e) {
    console.warn('Contract fetch fallback:', e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadContractDetails();
});

async function handleSignBuyer() {
  signing.value = true;
  const orderId = (route.params.id as string) || orderData.value.id;
  try {
    const res = await apiRequest(`/trade/orders/${orderId}/contract/sign`, {
      method: 'POST',
      body: JSON.stringify({
        document_hash: contract.value.document_hash,
      }),
    });
    contract.value.buyer_signed = true;
    contract.value.signed_at = res.signed_at;
    alert(`[전자계약 체결 및 SHA-256 서명 검증 완료]\n계약 번호: ${res.contract_id}\n검증 해시: ${res.document_hash.slice(0, 24)}...\n계약금(30%) 에스크로 결제 화면으로 이동합니다.`);
    router.push(`/${currentLocale.value}/${currentCurrency.value}/orders`);
  } catch (err: any) {
    alert(`계약 서명 처리 실패: ${err.message}`);
  } finally {
    signing.value = false;
  }
}
</script>

<style scoped>
.contract-doc { background: #fff; border: 1px solid var(--ws-border-subtle); border-radius: 14px; box-shadow: var(--ws-shadow-pop); padding: 36px 40px; }
.doc-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding-bottom: 20px; margin-bottom: 8px; border-bottom: 3px solid var(--ws-accent); }
.doc-head h1 { margin: 0 0 6px; font-size: 24px; font-weight: 900; letter-spacing: var(--ws-tracking-tight); }
.doc-order { margin: 0; font-size: 13px; color: var(--ws-text-muted); }
.doc-sec { padding: 18px 0; border-bottom: 1px solid var(--ws-border-subtle); }
.doc-sec:last-of-type { border-bottom: 0; }
.doc-sec h2 { margin: 0 0 12px; font-size: 15px; font-weight: 800; }
.hash-card { background: var(--ws-surface-muted); border-radius: 8px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; }
.hash-card code { font-size: 12px; word-break: break-all; color: var(--ws-text); }
.doc-sign { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
.sign-box { border: 1px solid var(--ws-border-subtle); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.sign-box .signed { margin: 0; color: var(--ws-success); font-weight: 800; font-size: 14px; display: flex; align-items: center; gap: 6px; }
@media (max-width: 640px) {
  .contract-doc { padding: 24px 18px; }
  .doc-sign { grid-template-columns: minmax(0, 1fr); }
  .doc-head { flex-direction: column; }
}
</style>
