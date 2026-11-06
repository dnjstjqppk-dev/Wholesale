<template>
  <div class="ws-page ws-page-wide">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Business Intelligence</p>
      <div class="ws-page-head-row">
        <h1 class="ws-page-title">셀러 비즈니스 애널리틱스</h1>
        <div class="ws-page-actions">
          <span class="seg">
            <button v-for="p in ['7d', '30d', '90d']" :key="p" :class="{ active: currentPeriod === p }" @click="changePeriod(p)">
              최근 {{ p.toUpperCase() }}
            </button>
          </span>
        </div>
      </div>
      <p class="ws-page-sub">노출·클릭률·인콰이어리 전환율·GMV 매출 성과를 종합 분석합니다.</p>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-stats">
        <div class="ws-skeleton" style="height: 96px"></div>
        <div class="ws-skeleton" style="height: 96px"></div>
        <div class="ws-skeleton" style="height: 96px"></div>
        <div class="ws-skeleton" style="height: 96px"></div>
      </div>
      <div class="ws-skeleton" style="height: 200px"></div>
    </div>

    <div v-else-if="analyticsData" class="ws-stack">
      <div class="kpi-row">
        <div class="ws-stat">
          <p class="ws-stat-label">바이어 노출 수</p>
          <p class="ws-stat-value">{{ analyticsData.summary.total_impressions.toLocaleString() }}</p>
          <p class="ws-stat-foot">검색·카테고리 피드 노출</p>
        </div>
        <div class="ws-stat">
          <p class="ws-stat-label">상세 클릭 수</p>
          <p class="ws-stat-value">{{ analyticsData.summary.total_clicks.toLocaleString() }}</p>
          <p class="ws-stat-foot">CTR <b>{{ analyticsData.summary.click_through_rate }}</b></p>
        </div>
        <div class="ws-stat">
          <p class="ws-stat-label">수신 인콰이어리</p>
          <p class="ws-stat-value hot">{{ analyticsData.summary.inquiries_count }}<span class="unit">건</span></p>
          <p class="ws-stat-foot">상담 전환율 <b>{{ analyticsData.summary.inquiry_conversion_rate }}</b></p>
        </div>
        <div class="ws-stat">
          <p class="ws-stat-label">성약 발주</p>
          <p class="ws-stat-value ok">{{ analyticsData.summary.orders_count }}<span class="unit">건</span></p>
          <p class="ws-stat-foot">재구매율 <b>{{ analyticsData.summary.repeat_buyer_rate }}</b></p>
        </div>
        <div class="ws-stat gmv">
          <p class="ws-stat-label">누적 거래액 (GMV)</p>
          <p class="ws-stat-value">${{ analyticsData.summary.gmv_usd.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</p>
          <p class="ws-stat-foot">에스크로 무역 보증 체결 기준</p>
        </div>
      </div>

      <section class="ws-card">
        <div class="ws-card-head"><h3>트래픽 유입 채널 분석</h3></div>
        <div v-for="source in analyticsData.traffic_sources" :key="source.channel" class="traf-row">
          <div class="ws-split">
            <b>{{ source.channel }}</b>
            <span class="ws-small ws-figure">{{ source.visitors }}명 ({{ source.percentage }}%)</span>
          </div>
          <div class="ws-meter ws-meter-navy"><span :style="{ width: `${source.percentage}%` }"></span></div>
        </div>
      </section>

      <section class="ws-card ws-card-pad-sm">
        <div class="ws-card-head"><h3>상위 성과 도매 품목</h3></div>
        <div class="ws-table-wrap">
          <div class="ws-table-scroll">
            <table class="ws-table">
              <thead><tr><th>상품명</th><th class="ws-num">노출</th><th class="ws-num">클릭</th><th class="ws-num">문의</th><th class="ws-num">수주</th><th>전환율</th></tr></thead>
              <tbody>
                <tr v-for="prod in analyticsData.top_performing_products" :key="prod.id">
                  <td class="ws-cell-main">{{ prod.title }}</td>
                  <td class="ws-num ws-figure">{{ prod.impressions.toLocaleString() }}</td>
                  <td class="ws-num ws-figure">{{ prod.clicks.toLocaleString() }}</td>
                  <td class="ws-num"><b class="ws-price-dark ws-figure">{{ prod.inquiries }}</b></td>
                  <td class="ws-num"><b class="ok-num ws-figure">{{ prod.orders }}</b></td>
                  <td><span class="ws-badge ws-badge-brand">{{ prod.conversion_rate }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="ws-card ws-card-pad-sm">
        <div class="ws-card-head"><h3>일별 비즈니스 트렌드</h3></div>
        <div class="ws-table-wrap">
          <div class="ws-table-scroll">
            <table class="ws-table">
              <thead><tr><th>일자</th><th class="ws-num">노출</th><th class="ws-num">클릭</th><th class="ws-num">문의</th><th class="ws-num">성약</th></tr></thead>
              <tbody>
                <tr v-for="day in analyticsData.daily_metrics_timeline" :key="day.date">
                  <td class="ws-cell-main ws-figure">{{ day.date }}</td>
                  <td class="ws-num ws-figure">{{ day.impressions.toLocaleString() }}</td>
                  <td class="ws-num ws-figure">{{ day.clicks }}</td>
                  <td class="ws-num"><b class="ws-price-dark ws-figure">{{ day.inquiries }}</b></td>
                  <td class="ws-num"><b class="ok-num ws-figure">{{ day.orders }}</b></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';

const loading = ref(true);
const currentPeriod = ref('30d');
const analyticsData = ref<any>(null);

async function fetchAnalytics() {
  loading.value = true;
  try {
    const res = await apiRequest(`/partner/analytics?range=${currentPeriod.value}`);
    analyticsData.value = res;
  } catch (err) {
    console.error('Failed to load analytics', err);
  } finally {
    loading.value = false;
  }
}

function changePeriod(p: string) {
  currentPeriod.value = p;
  fetchAnalytics();
}

onMounted(() => {
  fetchAnalytics();
});
</script>

<style scoped>
.seg { display: inline-flex; gap: 4px; background: #fff; border: 1px solid var(--ws-border); border-radius: 8px; padding: 4px; }
.seg button { border: 0; background: transparent; border-radius: 6px; font-size: 12px; font-weight: 700; padding: 6px 14px; cursor: pointer; color: var(--ws-text-2); font-family: var(--ws-font); }
.seg button.active { background: var(--ws-accent); color: #fff; }
.kpi-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)) 1.6fr; gap: 12px; }
.ws-stat-value .unit { font-size: 13px; font-weight: 700; color: var(--ws-text-muted); margin-left: 2px; }
.ws-stat-value.hot { color: var(--ws-brand); }
.ws-stat-value.ok { color: var(--ws-success); }
.gmv { background: var(--ws-accent); border-color: var(--ws-accent); color: #fff; }
.gmv .ws-stat-label, .gmv .ws-stat-foot { color: rgb(255 255 255 / 0.82); }
.gmv .ws-stat-value { color: #fff; }
.traf-row { margin-bottom: 14px; }
.traf-row:last-child { margin-bottom: 0; }
.traf-row .ws-split { margin-bottom: 6px; font-size: 13px; }
.ok-num { color: var(--ws-success); }
@media (max-width: 1100px) {
  .kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .gmv { grid-column: 1 / -1; }
}
</style>
