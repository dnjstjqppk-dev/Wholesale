<template>
  <div class="rfq-list-page">
    <div class="page-head">
      <div class="head-text">
        <h2>구매 요청서(RFQ) 및 복수 공급사 견적 비교 (RFQ Marketplace)</h2>
        <p class="subtitle">
          발행된 소싱 요청서에 대해 글로벌 공급사들이 제출한 1:N 복수 견적을 비교하고 수락하여 정식 무역 계약으로 전환합니다.
        </p>
      </div>
      <router-link :to="`/${currentLocale}/${currentCurrency}/sourcing/rfq/new`" class="btn-post-rfq">
        + 신규 견적 요청서(RFQ) 작성
      </router-link>
    </div>

    <!-- Alert / Toast -->
    <div v-if="toastMessage" class="toast-banner" :class="toastType">
      {{ toastMessage }}
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-left">
        <label>산업 카테고리:</label>
        <select v-model="selectedCategory" @change="fetchRFQs">
          <option value="ALL">전체 카테고리</option>
          <option value="CAT-IND">기계 & 장비 (Industrial Machinery)</option>
          <option value="CAT-ELE">전자 & 전기 부품 (Electronics)</option>
          <option value="CAT-PKG">패키징 & 인쇄 (Packaging)</option>
          <option value="CAT-HOM">홈 & 주방용품 (Home & Living)</option>
          <option value="CAT-CHM">화학 & 원자재 (Chemicals)</option>
        </select>
      </div>
      <div class="refresh-box">
        <button class="btn-refresh" :disabled="loading" @click="fetchRFQs">
          ↻ 새로고침
        </button>
      </div>
    </div>

    <div v-if="loading" class="state-box">
      <p>견적 요청서 및 제출된 견적을 불러오는 중입니다...</p>
    </div>

    <div v-else-if="rfqs.length === 0" class="empty-box">
      <p>등록된 구매 요청서(RFQ)가 없습니다.</p>
      <router-link :to="`/${currentLocale}/${currentCurrency}/sourcing/rfq/new`" class="btn-primary">
        첫 번째 RFQ 발행하기
      </router-link>
    </div>

    <!-- RFQ Cards with 1:N Quotes Comparison -->
    <div v-else class="rfq-list">
      <div v-for="rfq in rfqs" :key="rfq.id" class="rfq-card">
        <div class="rfq-card-header">
          <div class="rfq-title-group">
            <span class="category-badge">{{ formatCategory(rfq.category) }}</span>
            <h3 class="rfq-title">{{ rfq.title }}</h3>
            <span class="rfq-id">#{{ rfq.id }}</span>
          </div>
          <div class="rfq-status-group">
            <span class="status-badge" :class="rfq.status.toLowerCase()">
              {{ rfq.status }}
            </span>
          </div>
        </div>

        <div class="rfq-specs-grid">
          <div class="spec-cell">
            <span class="k">요청 수량:</span>
            <span class="v font-bold">{{ Number(rfq.requested_qty).toLocaleString() }} {{ rfq.unit }}</span>
          </div>
          <div class="spec-cell">
            <span class="k">희망 목표 단가:</span>
            <span class="v text-orange-600 font-bold">${{ rfq.target_price }} / {{ rfq.unit }}</span>
          </div>
          <div class="spec-cell">
            <span class="k">요구 납기:</span>
            <span class="v">{{ rfq.lead_time_days }}일 이내</span>
          </div>
          <div class="spec-cell">
            <span class="k">인도 조건:</span>
            <span class="v">{{ rfq.incoterms }}</span>
          </div>
          <div class="spec-cell">
            <span class="k">목적국:</span>
            <span class="v">{{ rfq.destination_country }}</span>
          </div>
          <div class="spec-cell">
            <span class="k">등록일:</span>
            <span class="v text-gray-500">{{ formatDate(rfq.created_at) }}</span>
          </div>
        </div>

        <!-- 1:N Quotes Comparison Section -->
        <div class="quotes-section">
          <div class="quotes-head">
            <h4>제출된 공급사 견적 (1:N Quotes Comparison Matrix)</h4>
            <span class="quote-count">총 {{ getQuotesForRfq(rfq.id).length }}건 접수</span>
          </div>

          <div v-if="getQuotesForRfq(rfq.id).length === 0" class="no-quotes">
            <span>현재 검증된 공급사들의 견적 산정이 진행 중입니다. 잠시 후 확인해 주세요.</span>
          </div>

          <div v-else class="quotes-table-wrap">
            <table class="quotes-table">
              <thead>
                <tr>
                  <th>공급사명</th>
                  <th>제안 단가 (Unit Price)</th>
                  <th>총 견적 금액 (Total)</th>
                  <th>예상 납기 (Lead Time)</th>
                  <th>인도 조건 (Incoterms)</th>
                  <th>개정 차수 (Revision)</th>
                  <th>상태</th>
                  <th>견적 승낙 / 발주 조치</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="q in getQuotesForRfq(rfq.id)" :key="q.id">
                  <td>
                    <div class="supplier-info">
                      <span class="supp-name">{{ q.supplier_name || 'Precision Korea Co., Ltd.' }}</span>
                      <span class="supp-badge">✓ Verified</span>
                    </div>
                  </td>
                  <td>
                    <span class="quote-price font-bold">${{ q.unit_price }}</span>
                    <span class="unit-sub">/ {{ q.unit || 'pcs' }}</span>
                  </td>
                  <td>
                    <strong class="total-price">${{ calculateTotal(q.unit_price, rfq.requested_qty) }}</strong>
                  </td>
                  <td>{{ q.lead_time_days }}일 (D+{{ q.lead_time_days }})</td>
                  <td>{{ q.incoterms }}</td>
                  <td>
                    <span class="rev-badge">Rev #{{ q.revision_number || 1 }}</span>
                  </td>
                  <td>
                    <span class="quote-status" :class="q.status.toLowerCase()">{{ q.status }}</span>
                  </td>
                  <td>
                    <button
                      v-if="q.status === 'ISSUED'"
                      class="btn-accept"
                      :disabled="acceptingQuoteId === q.id"
                      @click="acceptQuote(q, rfq)"
                    >
                      {{ acceptingQuoteId === q.id ? '발주 생성 중...' : '✓ 견적 수락 및 발주' }}
                    </button>
                    <span v-else-if="q.status === 'ACCEPTED'" class="accepted-tag">
                      ✓ 수락 완료 (발주 생성됨)
                    </span>
                    <span v-else class="superseded-tag">
                      {{ q.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiRequest } from '../api';

const route = useRoute();
const router = useRouter();
const currentLocale = ref<string>((route.params.locale as string) || 'ko');
const currentCurrency = ref<string>((route.params.currency as string) || 'KRW');

const loading = ref(true);
const rfqs = ref<any[]>([]);
const quotesMap = ref<Record<string, any[]>>({});
const selectedCategory = ref('ALL');
const acceptingQuoteId = ref<string | null>(null);

const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = '';
  }, 4000);
}

function formatDate(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatCategory(cat: string): string {
  switch (cat) {
    case 'CAT-IND': return '산업 기계 & 장비';
    case 'CAT-ELE': return '전자 & 전기 부품';
    case 'CAT-PKG': return '패키징 & 인쇄';
    case 'CAT-HOM': return '홈 & 주방용품';
    case 'CAT-CHM': return '화학 & 원자재';
    default: return cat;
  }
}

function calculateTotal(unitPrice: string, qty: string): string {
  const p = parseFloat(unitPrice) || 0;
  const q = parseFloat(qty) || 0;
  return (p * q).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getQuotesForRfq(rfqId: string): any[] {
  return quotesMap.value[rfqId] || [];
}

async function fetchRFQs() {
  loading.value = true;
  try {
    const url = selectedCategory.value !== 'ALL'
      ? `/sourcing/rfqs?category=${selectedCategory.value}`
      : '/sourcing/rfqs';
    const res = await apiRequest(url);
    rfqs.value = res.items || [];

    // Fetch quotes for each RFQ
    for (const rfq of rfqs.value) {
      try {
        const qRes = await apiRequest(`/sourcing/rfqs/${rfq.id}/quotes`);
        quotesMap.value[rfq.id] = qRes.items || [];
      } catch {
        quotesMap.value[rfq.id] = [];
      }
    }
  } catch (err: any) {
    showToast(`RFQ 목록 조회 실패: ${err.message}`, 'error');
  } finally {
    loading.value = false;
  }
}

async function acceptQuote(quote: any, rfq: any) {
  acceptingQuoteId.value = quote.id;
  try {
    const res = await apiRequest(`/sourcing/quotes/${quote.id}/accept`, {
      method: 'POST',
      body: JSON.stringify({ rfq_id: rfq.id }),
    });

    quote.status = 'ACCEPTED';
    showToast('공급사 견적을 수락했습니다! 정식 무역 발주 및 전자계약서가 생성되었습니다.');

    if (res.order_id) {
      setTimeout(() => {
        router.push(`/${currentLocale.value}/${currentCurrency.value}/orders/${res.order_id}/contract`);
      }, 1500);
    }
  } catch (err: any) {
    showToast(`견적 수락 실패: ${err.message}`, 'error');
  } finally {
    acceptingQuoteId.value = null;
  }
}

onMounted(() => {
  fetchRFQs();
});
</script>

<style scoped>
.rfq-list-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px 80px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 20px;
}

.head-text h2 {
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 6px 0;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.btn-post-rfq {
  background: #d64000;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.btn-post-rfq:hover {
  background: #e65c00;
}

.toast-banner {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 600;
}

.toast-banner.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.toast-banner.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.filter-left select {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 13px;
}

.btn-refresh {
  background: white;
  border: 1px solid #d1d5db;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.rfq-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.rfq-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.rfq-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 12px;
}

.rfq-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-badge {
  background: #f1f5f9;
  color: #334155;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.rfq-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.rfq-id {
  font-size: 12px;
  color: #9ca3af;
  font-family: monospace;
}

.status-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 9999px;
  background: #dbeafe;
  color: #1e40af;
}

.rfq-specs-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  background: #fafafa;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 20px;
}

.spec-cell .k {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 2px;
}

.spec-cell .v {
  font-size: 13px;
  color: #1f2937;
}

.quotes-section {
  border-top: 1px solid #f3f4f6;
  padding-top: 16px;
}

.quotes-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.quotes-head h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #374151;
}

.quote-count {
  font-size: 12px;
  color: #d64000;
  font-weight: 600;
}

.no-quotes {
  background: #f9fafb;
  border: 1px dashed #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}

.quotes-table-wrap {
  overflow-x: auto;
}

.quotes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.quotes-table th {
  background: #f9fafb;
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
}

.quotes-table td {
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.supplier-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.supp-name {
  font-weight: 600;
  color: #111827;
}

.supp-badge {
  font-size: 10px;
  color: #0284c7;
  font-weight: 700;
}

.rev-badge {
  background: #f3f4f6;
  color: #4b5563;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.quote-status.issued {
  color: #2563eb;
  font-weight: 600;
}

.quote-status.accepted {
  color: #16a34a;
  font-weight: 700;
}

.btn-accept {
  background: #16a34a;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 700;
  cursor: pointer;
}

.btn-accept:hover {
  background: #15803d;
}

.accepted-tag {
  color: #16a34a;
  font-weight: 700;
  font-size: 12px;
}

.superseded-tag {
  color: #9ca3af;
  font-size: 12px;
}

.state-box, .empty-box {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 40px;
  text-align: center;
  color: #6b7280;
}

/* Mobile & Tablet Responsive Layout */
@media (max-width: 992px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .rfq-specs-grid {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

@media (max-width: 640px) {
  .rfq-specs-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .btn-post-rfq {
    width: 100%;
    text-align: center;
    box-sizing: border-box;
  }
}
</style>

