<template>
  <div class="ws-page ws-page-wide">
    <div class="ws-page-head">
      <p class="ws-eyebrow">RFQ Marketplace</p>
      <div class="ws-page-head-row">
        <h1 class="ws-page-title">구매 요청서·견적 비교</h1>
        <div class="ws-page-actions">
          <router-link :to="`/${currentLocale}/${currentCurrency}/sourcing/rfq/new`" class="ws-btn ws-btn-primary"><WsIcon name="plus" :size="14" /> 신규 RFQ 작성</router-link>
        </div>
      </div>
      <p class="ws-page-sub">발행된 소싱 요청서에 제출된 1:N 복수 견적을 비교하고 수락하여 정식 무역 계약으로 전환합니다.</p>
    </div>

    <div v-if="toastMessage" class="ws-banner" :class="toastType === 'error' ? 'ws-banner-danger' : 'ws-banner-success'">
      <WsIcon :name="toastType === 'error' ? 'alert' : 'check'" :size="16" />
      <span>{{ toastMessage }}</span>
    </div>

    <div class="ws-split filter-strip">
      <label class="sort-box">
        <span>산업 카테고리</span>
        <select v-model="selectedCategory" class="ws-input" @change="fetchRFQs">
          <option value="ALL">전체 카테고리</option>
          <option value="CAT-IND">기계 & 장비 (Industrial Machinery)</option>
          <option value="CAT-ELE">전자 & 전기 부품 (Electronics)</option>
          <option value="CAT-PKG">패키징 & 인쇄 (Packaging)</option>
          <option value="CAT-HOM">홈 & 주방용품 (Home & Living)</option>
          <option value="CAT-CHM">화학 & 원자재 (Chemicals)</option>
        </select>
      </label>
      <button class="ws-btn ws-btn-secondary ws-btn-sm" :disabled="loading" @click="fetchRFQs">
        <WsIcon name="refresh" :size="14" /> 새로고침
      </button>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton" style="height: 220px"></div>
      <div class="ws-skeleton" style="height: 220px"></div>
    </div>

    <div v-else-if="rfqs.length === 0" class="ws-empty">
      <span class="ws-empty-icon"><WsIcon name="file" :size="24" /></span>
      <h3>등록된 구매 요청서가 없습니다</h3>
      <p>첫 번째 RFQ를 발행하고 복수 견적을 받아 보세요.</p>
      <router-link :to="`/${currentLocale}/${currentCurrency}/sourcing/rfq/new`" class="ws-btn ws-btn-primary">첫 번째 RFQ 발행하기</router-link>
    </div>

    <div v-else class="ws-stack">
      <article v-for="rfq in rfqs" :key="rfq.id" class="ws-card rfq-card">
        <div class="ws-split">
          <div class="rfq-title">
            <span class="ws-badge ws-badge-navy">{{ formatCategory(rfq.category) }}</span>
            <h3>{{ rfq.title }}</h3>
            <span class="ws-small ws-muted ws-figure">#{{ rfq.id }}</span>
          </div>
          <span class="ws-badge ws-badge-info">{{ rfq.status }}</span>
        </div>

        <div class="spec-strip">
          <div><i>요청 수량</i><b class="ws-figure">{{ Number(rfq.requested_qty).toLocaleString() }} {{ rfq.unit }}</b></div>
          <div><i>희망 목표 단가</i><b class="ws-price ws-figure">${{ rfq.target_price }} / {{ rfq.unit }}</b></div>
          <div><i>요구 납기</i><b>{{ rfq.lead_time_days }}일 이내</b></div>
          <div><i>인도 조건</i><b>{{ rfq.incoterms }}</b></div>
          <div><i>목적국</i><b>{{ rfq.destination_country }}</b></div>
          <div><i>등록일</i><b class="ws-muted">{{ formatDate(rfq.created_at) }}</b></div>
        </div>

        <div class="ws-split quotes-head">
          <b>제출된 공급사 견적 비교</b>
          <span class="ws-badge ws-badge-outline">총 {{ getQuotesForRfq(rfq.id).length }}건 접수</span>
        </div>

        <p v-if="getQuotesForRfq(rfq.id).length === 0" class="ws-small ws-muted" style="margin: 0">
          검증 공급사들의 견적 산정이 진행 중입니다. 잠시 후 확인해 주세요.
        </p>

        <div v-else class="ws-table-wrap">
          <div class="ws-table-scroll">
            <table class="ws-table">
              <thead>
                <tr><th>공급사명</th><th class="ws-num">제안 단가</th><th class="ws-num">총 견적 금액</th><th>납기</th><th>인도 조건</th><th>Rev</th><th>상태</th><th>조치</th></tr>
              </thead>
              <tbody>
                <tr v-for="q in getQuotesForRfq(rfq.id)" :key="q.id">
                  <td>
                    <span class="ws-cell-main">{{ q.supplier_name || 'Precision Korea Co., Ltd.' }}</span><br />
                    <span class="ws-badge ws-badge-success">Verified</span>
                  </td>
                  <td class="ws-num"><b class="ws-figure">${{ q.unit_price }}</b> <span class="ws-cell-sub">/ {{ q.unit || 'pcs' }}</span></td>
                  <td class="ws-num"><b class="ws-price ws-figure">${{ calculateTotal(q.unit_price, rfq.requested_qty) }}</b></td>
                  <td>{{ q.lead_time_days }}일</td>
                  <td>{{ q.incoterms }}</td>
                  <td><span class="ws-badge ws-badge-outline">Rev {{ q.revision_number || 1 }}</span></td>
                  <td><span class="ws-badge" :class="q.status === 'ACCEPTED' ? 'ws-badge-success' : 'ws-badge-info'">{{ q.status }}</span></td>
                  <td>
                    <button
                      v-if="q.status === 'ISSUED'"
                      class="ws-btn ws-btn-primary ws-btn-sm"
                      :disabled="acceptingQuoteId === q.id"
                      @click="acceptQuote(q, rfq)"
                    >
                      {{ acceptingQuoteId === q.id ? '발주 생성 중...' : '견적 수락·발주' }}
                    </button>
                    <span v-else-if="q.status === 'ACCEPTED'" class="ws-badge ws-badge-success">수락 완료</span>
                    <span v-else class="ws-small ws-muted">{{ q.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

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
.filter-strip { background: #fff; border: 1px solid var(--ws-border-subtle); border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; }
.sort-box { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: var(--ws-text-muted); }
.sort-box .ws-input { width: auto; font-size: 13px; padding: 8px 10px; }
.rfq-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.rfq-title h3 { margin: 0; font-size: 17px; font-weight: 800; letter-spacing: var(--ws-tracking-tight); }
.spec-strip { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; background: var(--ws-surface-muted); border-radius: 8px; padding: 12px 14px; margin: 14px 0; }
.spec-strip div { display: flex; flex-direction: column; gap: 2px; }
.spec-strip i { font-style: normal; font-size: 11px; font-weight: 700; color: var(--ws-text-muted); }
.spec-strip b { font-size: 13px; }
.quotes-head { margin-bottom: 10px; font-size: 14px; }
@media (max-width: 1024px) {
  .spec-strip { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .spec-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
