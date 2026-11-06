<template>
  <div class="ws-page ws-page-wide">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Seller Central</p>
      <div class="ws-page-head-row">
        <h1 class="ws-page-title">영업·생산 종합 대시보드</h1>
        <div class="ws-page-actions">
          <button class="ws-btn ws-btn-secondary ws-btn-sm" @click="loadDashboard"><WsIcon name="refresh" :size="14" /> 실시간 지표 새로고침</button>
        </div>
      </div>
      <p class="ws-page-sub">카탈로그·RFQ 입찰·수주 생산·재고 원장·에스크로 정산 지표가 API 서버와 동기화됩니다.</p>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton" style="height: 90px"></div>
      <div class="ws-stats">
        <div class="ws-skeleton" style="height: 96px"></div>
        <div class="ws-skeleton" style="height: 96px"></div>
        <div class="ws-skeleton" style="height: 96px"></div>
        <div class="ws-skeleton" style="height: 96px"></div>
      </div>
    </div>

    <template v-else>
      <div class="ws-banner ws-banner-success verify-banner">
        <WsIcon name="shield" :size="20" />
        <div>
          <b>Verified Manufacturer · 평점 ★ {{ stats.supplier_rating || 4.9 }} · 응답률 {{ stats.response_rate || '99.2%' }}</b>
          <p>사업자등록증 검증 완료 · ISO 9001:2015 · 에스크로 정산 계좌 연동됨</p>
        </div>
        <router-link to="/verification" class="ws-btn ws-btn-secondary ws-btn-sm">인증·실사 관리 →</router-link>
      </div>

      <div class="kpi-5">
        <div class="ws-stat">
          <p class="ws-stat-label">운영 등록 상품</p>
          <p class="ws-stat-value">{{ stats.active_listings_count }}<span class="unit">개</span></p>
          <router-link to="/catalog" class="ws-section-more">구간단가 편집 →</router-link>
        </div>
        <div class="ws-stat">
          <p class="ws-stat-label">입찰 가능 공개 RFQ</p>
          <p class="ws-stat-value hot">{{ stats.open_rfqs_count }}<span class="unit">건</span></p>
          <router-link to="/rfq-market" class="ws-section-more">견적서 제출 →</router-link>
        </div>
        <div class="ws-stat">
          <p class="ws-stat-label">바이어 문의 (미답변)</p>
          <p class="ws-stat-value">{{ stats.pending_inquiries_count }}<span class="unit">건</span></p>
          <router-link to="/inquiries" class="ws-section-more">인콰이어리 →</router-link>
        </div>
        <div class="ws-stat">
          <p class="ws-stat-label">진행 중 수주</p>
          <p class="ws-stat-value">{{ stats.in_production_orders_count }}<span class="unit">건</span></p>
          <router-link to="/fulfillment" class="ws-section-more">분할 선적 →</router-link>
        </div>
        <div class="ws-stat">
          <p class="ws-stat-label">에스크로 정산 대기</p>
          <p class="ws-stat-value escrow">${{ ((stats.escrow_pending_minor || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</p>
          <router-link to="/settlement" class="ws-section-more">출금 가능 ${{ ((stats.escrow_release_eligible_minor || 0) / 100).toFixed(2) }} →</router-link>
        </div>
      </div>

      <div class="ws-grid-2 dash-panels">
        <section class="ws-card ws-card-pad-sm">
          <div class="ws-card-head">
            <h3><WsIcon name="package" :size="15" class="h-ico" /> 최근 수주 주문</h3>
            <router-link to="/fulfillment" class="ws-section-more">전체 주문 관리 →</router-link>
          </div>
          <div class="ws-table-scroll">
            <table class="ws-table">
              <thead><tr><th>주문번호</th><th>구매기업</th><th>품목</th><th class="ws-num">총액</th><th>상태</th></tr></thead>
              <tbody>
                <tr v-for="o in recentOrders" :key="o.id">
                  <td class="ws-cell-main ws-figure">{{ o.order_number }}</td>
                  <td>{{ o.buyer_name }}</td>
                  <td class="ws-cell-sub">{{ o.item_title?.slice(0, 24) }}...</td>
                  <td class="ws-num ws-figure"><b>${{ ((o.total_amount_minor || 0) / 100).toFixed(2) }}</b></td>
                  <td><span class="ws-badge ws-badge-info">{{ o.order_status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="ws-card ws-card-pad-sm">
          <div class="ws-card-head">
            <h3><WsIcon name="factory" :size="15" class="h-ico" /> 창고 가용 재고 요약</h3>
            <router-link to="/inventory" class="ws-section-more">재고 입고/조정 →</router-link>
          </div>
          <div class="ws-table-scroll">
            <table class="ws-table">
              <thead><tr><th>SKU</th><th>창고</th><th class="ws-num">실물</th><th class="ws-num">예약</th><th class="ws-num">가용</th></tr></thead>
              <tbody>
                <tr v-for="inv in inventoryList" :key="inv.sku_id">
                  <td class="ws-cell-main ws-figure">{{ inv.sku_code }}</td>
                  <td>{{ inv.warehouse_name }}</td>
                  <td class="ws-num ws-figure">{{ inv.on_hand?.toLocaleString() }}</td>
                  <td class="ws-num ws-figure">{{ inv.reserved?.toLocaleString() }}</td>
                  <td class="ws-num ws-figure"><b class="avail">{{ inv.available?.toLocaleString() }}</b></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const loading = ref(true);
const stats = ref<any>({
  active_listings_count: 25,
  open_rfqs_count: 1,
  in_production_orders_count: 1,
  pending_inquiries_count: 1,
  escrow_pending_minor: 399000,
  escrow_release_eligible_minor: 399000,
  response_rate: '99.2%',
  supplier_rating: 4.9,
});
const recentOrders = ref<any[]>([]);
const inventoryList = ref<any[]>([]);

async function loadDashboard() {
  loading.value = true;
  try {
    const res = await apiRequest('/partner/dashboard');
    if (res.stats) stats.value = res.stats;
    recentOrders.value = res.recent_orders || [];
    inventoryList.value = res.available_inventory || [];
  } catch (e) {
    console.warn('Dashboard load warning:', e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboard();
});
</script>

<style scoped>
.verify-banner { align-items: center; margin-top: 0; }
.verify-banner p { margin: 2px 0 0; font-size: 12px; }
.verify-banner .ws-btn { margin-left: auto; flex: none; }
.kpi-5 { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.ws-stat-value .unit { font-size: 13px; font-weight: 700; color: var(--ws-text-muted); margin-left: 2px; }
.ws-stat-value.hot { color: var(--ws-brand); }
.ws-stat-value.escrow { font-size: 19px; }
.ws-stat .ws-section-more { display: inline-block; margin-top: 6px; font-size: 12px; }
.h-ico { color: var(--ws-navy); vertical-align: -2px; }
.avail { color: var(--ws-success); }
@media (max-width: 1100px) {
  .kpi-5 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .kpi-5 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .verify-banner { align-items: flex-start; }
  .verify-banner .ws-btn { margin-left: 0; }
}
</style>
