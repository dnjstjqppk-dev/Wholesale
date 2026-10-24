<template>
  <div class="moderation-page">
    <div class="head-row">
      <div>
        <h2>상품 카탈로그 모더레이션 (Catalog Moderation)</h2>
        <p class="subtitle">공급사가 제출한 도매 상품의 MOQ, 구간 단가, 스펙 적합성을 심사하고 승인/반려합니다.</p>
      </div>
      <button class="btn-refresh" @click="loadListings">↻ 심사 대기열 새로고침</button>
    </div>

    <div v-if="loading" class="loading-state">
      심사 대기 상품을 API 서버에서 조회 중입니다...
    </div>

    <div v-else class="item-list">
      <div v-if="items.length === 0" class="empty-state">
        현재 심사 대기 중인 상품이 없습니다.
      </div>
      <div v-for="item in items" :key="item.id" class="mod-card">
        <div class="card-head">
          <div class="left-info">
            <img :src="item.thumbnail || item.images?.[0]" class="thumb" alt="thumb" />
            <div>
              <h3 class="title">{{ item.title }}</h3>
              <span class="sub">공급사: {{ item.supplier_name }} ({{ item.supplier_country }}) | 카테고리: {{ item.category }} ({{ item.sub_category }})</span>
            </div>
          </div>
          <span class="badge" :class="item.status.toLowerCase()">{{ item.status }}</span>
        </div>

        <div class="info-row">
          <div><span>MOQ:</span> <strong>{{ item.moq }} {{ item.unit }}</strong></div>
          <div><span>발주단위(Step):</span> <strong>{{ item.quantity_step || 10 }} {{ item.unit }}</strong></div>
          <div><span>표준 납기:</span> <strong>{{ item.lead_time_days }}일</strong></div>
          <div><span>인도조건:</span> <strong>{{ item.incoterms || 'FOB Busan Port' }}</strong></div>
        </div>

        <div class="tiers-box">
          <span class="t-lbl">수량별 구간단가:</span>
          <span v-for="(t, idx) in item.price_tiers" :key="idx" class="tier-pill">
            {{ t.min_quantity }}~{{ t.max_quantity || '∞' }} {{ item.unit }}: ${{ Number(t.unit_price).toFixed(2) }}
          </span>
        </div>

        <div class="actions">
          <button
            class="btn-approve"
            :disabled="submitting || item.status === 'PUBLISHED'"
            @click="reviewListing(item, 'APPROVE')"
          >
            ✓ 마켓 공개 승인 (PUBLISH)
          </button>
          <button
            class="btn-reject"
            :disabled="submitting || item.status === 'UNDER_REVIEW'"
            @click="reviewListing(item, 'REJECT')"
          >
            ✕ 심사 대기 전환 (REJECT)
          </button>
          <button
            class="btn-flag"
            :disabled="submitting || item.status === 'FLAGGED'"
            @click="reviewListing(item, 'FLAG')"
          >
            ⚠️ 부정 의심 플래그 (FLAG)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';

const loading = ref(true);
const submitting = ref(false);
const items = ref<any[]>([]);

async function loadListings() {
  loading.value = true;
  try {
    const res = await apiRequest('/admin/moderation/listings');
    items.value = res.items || [];
  } catch (err: any) {
    console.warn('Moderation listings fetch error:', err);
  } finally {
    loading.value = false;
  }
}

async function reviewListing(item: any, action: 'APPROVE' | 'REJECT' | 'FLAG') {
  submitting.value = true;
  try {
    const res = await apiRequest(`/admin/moderation/listings/${item.id}/review`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        reason: action === 'APPROVE' ? '도매 규격 및 구간단가 승인' : '관리자 카탈로그 검수 조치',
      }),
    });
    item.status = res.status;
    alert(`[서버 모더레이션 완료]\n상품: ${item.title}\n상태 변경: ${res.status}`);
  } catch (err: any) {
    alert(`모더레이션 처리 실패: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadListings();
});
</script>

<style scoped>
.moderation-page { max-width: 1040px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.head-row { display: flex; justify-content: space-between; align-items: center; }
h2 { margin: 0 0 4px 0; font-size: 20px; color: #F8FAFC; }
.subtitle { color: #94A3B8; font-size: 13px; margin: 0; }
.btn-refresh { background: #1C2541; border: 1px solid #3A506B; color: #E2E8F0; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; }
.loading-state, .empty-state { padding: 40px; text-align: center; color: #94A3B8; }
.item-list { display: flex; flex-direction: column; gap: 16px; }
.mod-card { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 20px; }
.card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; border-bottom: 1px solid #2B3A55; padding-bottom: 12px; }
.left-info { display: flex; gap: 14px; align-items: center; }
.thumb { width: 52px; height: 52px; border-radius: 6px; object-fit: cover; border: 1px solid #3A506B; }
.title { margin: 0 0 4px 0; font-size: 16px; color: #FFF; }
.sub { font-size: 12px; color: #94A3B8; }
.badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; }
.badge.published { background: #065F46; color: #A7F3D0; }
.badge.under_review { background: #854D0E; color: #FEF08A; }
.badge.flagged { background: #7F1D1D; color: #FECACA; }
.info-row { display: flex; gap: 24px; font-size: 13px; margin-bottom: 12px; color: #CBD5E1; }
.tiers-box { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.t-lbl { color: #94A3B8; }
.tier-pill { background: #0B132B; border: 1px solid #3A506B; padding: 3px 8px; border-radius: 4px; color: #38BDF8; font-variant-numeric: tabular-nums; }
.actions { display: flex; gap: 10px; }
.btn-approve { background: #059669; color: #FFF; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 700; cursor: pointer; }
.btn-reject { background: #DC2626; color: #FFF; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 700; cursor: pointer; }
.btn-flag { background: #D97706; color: #FFF; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 700; cursor: pointer; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
