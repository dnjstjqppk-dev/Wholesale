<template>
  <div class="contract-sign-page">
    <div v-if="loading" class="card">
      <p>서버에서 무역 계약서 및 SHA-256 해시 원문을 불러오는 중입니다...</p>
    </div>
    <div v-else class="card">
      <div class="contract-header">
        <div>
          <h2>국제 B2B 도매 거래 표준 계약서 (ICC Trade Contract)</h2>
          <span class="sub-order">연동 발주번호: {{ orderData.order_number }}</span>
        </div>
        <span class="contract-no">계약번호: {{ contract.contract_number }}</span>
      </div>

      <div class="contract-body">
        <div class="section">
          <h4>1. 계약 당사자 (Contracting Parties)</h4>
          <p><strong>구매사 (Buyer):</strong> {{ orderData.buyer_name }} (Consignee)</p>
          <p><strong>공급사 (Supplier):</strong> {{ orderData.supplier_name }} (Verified Manufacturer)</p>
        </div>

        <div class="section">
          <h4>2. 계약 품목 및 무역 인도 조건 (Commodity & Incoterms® 2020)</h4>
          <p><strong>계약 품목:</strong> {{ orderData.item_title }}</p>
          <p><strong>발주 수량 및 단가:</strong> {{ orderData.ordered_quantity?.toLocaleString() }} {{ orderData.unit }} × {{ formatMoney(orderData.unit_price) }}</p>
          <p><strong>인도 조건:</strong> {{ orderData.incoterms || 'FOB Busan Port, South Korea' }} (Incoterms® 2020)</p>
          <p><strong>도착지 주소:</strong> {{ orderData.shipping_address || '450 Lexington Ave, New York, NY 10017, USA' }}</p>
        </div>

        <div class="section">
          <h4>3. 거래 대금 및 에스크로 분할 결제 일정 (Escrow Payment Schedule)</h4>
          <table class="schedule-table">
            <thead>
              <tr><th>구분</th><th>비율</th><th>금액</th><th>지급 조건</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>계약금 (Down Payment)</td>
                <td>30%</td>
                <td><strong>{{ formatMoney((orderData.downpayment_minor || 126000) / 100) }}</strong></td>
                <td>전자계약 서명 직후 에스크로 예치 (생산 착수 조건)</td>
              </tr>
              <tr>
                <td>잔금 (Final Balance)</td>
                <td>70%</td>
                <td><strong>{{ formatMoney((orderData.balance_minor || 294000) / 100) }}</strong></td>
                <td>SGS/TÜV 검수 합격 및 선하증권(B/L) 발행 후</td>
              </tr>
              <tr class="total-row">
                <td><strong>총 계약 금액 (Total)</strong></td>
                <td>100%</td>
                <td><strong>{{ formatMoney((orderData.total_amount_minor || 420000) / 100) }}</strong></td>
                <td>Trade Assurance 100% 지급 보증 적용</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section integrity-section">
          <h4>4. 무역 계약서 데이터 무결성 검증 (Cryptographic SHA-256 Integrity)</h4>
          <div class="hash-box">
            <span class="lbl">SHA-256 Document Hash:</span>
            <code>{{ contract.document_hash }}</code>
          </div>
          <p class="hash-note">※ 전자서명 완료 후 계약서 본문 및 조건 변조는 원천 차단되며 감사 로그에 영구 기록됩니다.</p>
        </div>
      </div>

      <div class="signatures">
        <div class="sig-box">
          <span>구매사(Buyer) 전자서명:</span>
          <strong v-if="contract.buyer_signed" class="signed-ok">✓ 전자서명 완료 ({{ contract.signed_at || 'UTC 검증됨' }})</strong>
          <button v-else class="btn-sign" :disabled="signing" @click="handleSignBuyer">
            {{ signing ? 'SHA-256 해시 대조 및 서명 중...' : '✍️ 구매사 공인 전자서명 실행' }}
          </button>
        </div>
        <div class="sig-box">
          <span>공급사(Supplier) 전자서명:</span>
          <strong class="signed-ok">✓ 공급사 명판 직인 서명 완료</strong>
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
.contract-sign-page { max-width: 920px; margin: 0 auto; }
.card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 10px; padding: 32px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
.contract-header { border-bottom: 2px solid #172B4D; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
.contract-header h2 { margin: 0 0 4px 0; font-size: 20px; color: #172B4D; }
.sub-order { font-size: 12px; color: #EA580C; font-weight: 700; }
.contract-no { font-size: 13px; color: #334155; font-weight: 700; background: #F1F5F9; padding: 6px 12px; border-radius: 6px; }
.section { margin-bottom: 24px; font-size: 14px; }
.section h4 { margin: 0 0 8px 0; font-size: 14px; color: #172B4D; }
.section p { margin: 4px 0; color: #42526E; }
.schedule-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
.schedule-table th, .schedule-table td { border: 1px solid #D8E0EB; padding: 10px 12px; text-align: left; }
.schedule-table th { background: #F8FAFC; color: #172B4D; }
.total-row { background: #FFF7ED; }
.integrity-section { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; }
.hash-box { display: flex; flex-direction: column; gap: 4px; }
.hash-box .lbl { font-size: 12px; font-weight: 700; color: #42526E; }
.hash-box code { font-family: monospace; font-size: 12px; background: #FFF; padding: 8px; border: 1px solid #D8E0EB; border-radius: 4px; word-break: break-all; color: #0F172A; }
.hash-note { font-size: 11px; color: #64748B; margin-top: 6px; }
.signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-top: 1px solid #E2E8F0; padding-top: 24px; margin-top: 24px; }
.sig-box { background: #F8FAFC; border: 1px solid #D8E0EB; border-radius: 6px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.signed-ok { color: #15803D; font-size: 13px; }
.btn-sign { background: #EA580C; color: #FFF; border: none; padding: 12px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 14px; }
</style>
