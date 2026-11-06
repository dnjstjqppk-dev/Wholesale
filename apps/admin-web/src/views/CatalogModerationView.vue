<template>
  <div class="ws-admin-page mod">
    <div class="admin-head">
      <div>
        <p class="admin-eyebrow">Content Review</p>
        <h1>상품 카탈로그 모더레이션</h1>
        <p class="admin-sub">MOQ·구간단가·스펙 적합성을 심사하고 승인/반려합니다.</p>
      </div>
      <button class="ws-admin-btn" @click="loadListings"><WsIcon name="refresh" :size="14" /> 대기열 새로고침</button>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton sk-dark" style="height: 220px"></div>
      <div class="ws-skeleton sk-dark" style="height: 220px"></div>
    </div>

    <div v-else class="ws-stack">
      <div v-if="items.length === 0" class="admin-empty">
        <span class="ws-empty-icon dark"><WsIcon name="check" :size="22" /></span>
        <h3>심사 대기 중인 상품이 없습니다</h3>
      </div>
      <section v-for="item in items" :key="item.id" class="ws-admin-card">
        <div class="ws-split item-head">
          <span class="ws-cluster" style="gap: 12px">
            <img :src="item.thumbnail || item.images?.[0]" class="thumb" alt="thumb" />
            <div>
              <h3>{{ item.title }}</h3>
              <p class="ws-small dim">{{ item.supplier_name }} ({{ item.supplier_country }}) · {{ item.category }} ({{ item.sub_category }})</p>
            </div>
          </span>
          <span class="ws-admin-badge" :class="item.status === 'PUBLISHED' ? 'ws-admin-badge-ok' : item.status === 'FLAGGED' ? 'ws-admin-badge-bad' : 'ws-admin-badge-warn'">{{ item.status }}</span>
        </div>
        <div class="fact-strip">
          <div><span>MOQ</span><b class="ws-figure">{{ item.moq }} {{ item.unit }}</b></div>
          <div><span>Step</span><b class="ws-figure">{{ item.quantity_step || 10 }} {{ item.unit }}</b></div>
          <div><span>납기</span><b>{{ item.lead_time_days }}일</b></div>
          <div><span>인도조건</span><b>{{ item.incoterms || 'FOB Busan Port' }}</b></div>
        </div>
        <div class="tier-line">
          <span class="ws-small dim">구간단가</span>
          <span v-for="(t, idx) in item.price_tiers" :key="idx" class="ws-admin-badge ws-admin-badge-info ws-figure">
            {{ t.min_quantity }}~{{ t.max_quantity || '∞' }}{{ item.unit }} · ${{ Number(t.unit_price).toFixed(2) }}
          </span>
        </div>
        <div class="ws-cluster verdict" style="gap: 8px">
          <button class="ws-admin-btn ws-admin-btn-primary" :disabled="submitting || item.status === 'PUBLISHED'" @click="reviewListing(item, 'APPROVE')">
            ✓ 마켓 공개 승인
          </button>
          <button class="ws-admin-btn" :disabled="submitting || item.status === 'UNDER_REVIEW'" @click="reviewListing(item, 'REJECT')">✕ 심사 대기 전환</button>
          <button class="ws-admin-btn ws-admin-btn-danger" :disabled="submitting || item.status === 'FLAGGED'" @click="reviewListing(item, 'FLAG')">
            <WsIcon name="alert" :size="13" /> 부정 의심 플래그
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

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
.mod { display: flex; flex-direction: column; gap: 18px; }
.admin-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.admin-head h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; letter-spacing: -0.015em; }
.admin-eyebrow { margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ws-admin-accent); }
.admin-sub { margin: 0; font-size: 13px; color: var(--ws-admin-dim); }
.admin-empty { text-align: center; padding: 48px 16px; }
.admin-empty h3 { font-size: 16px; margin: 12px 0 0; }
.ws-empty-icon.dark { background: var(--ws-admin-panel); }
.item-head h3 { margin: 0 0 4px; font-size: 16px; color: #fff; }
.item-head p { margin: 0; }
.dim { color: var(--ws-admin-dim); }
.thumb { width: 52px; height: 52px; border-radius: 8px; object-fit: cover; border: 1px solid var(--ws-admin-line); flex: none; }
.fact-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
.fact-strip div { display: flex; flex-direction: column; gap: 2px; background: var(--ws-admin-panel-2); border: 1px solid var(--ws-admin-line); border-radius: 8px; padding: 8px 12px; }
.fact-strip span { font-size: 11px; color: var(--ws-admin-dim); font-weight: 700; }
.fact-strip b { font-size: 13px; }
.tier-line { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.verdict { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--ws-admin-line); }
.sk-dark { background: var(--ws-admin-panel); }
@media (max-width: 768px) {
  .fact-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
