<template>
  <div class="supplier-analytics-page">
    <div class="page-head">
      <div class="head-text">
        <h2>셀러 비즈니스 애널리틱스 (Seller Business Intelligence)</h2>
        <p class="subtitle">
          Alibaba.com 글로벌 바이어 노출 수(Impressions), 클릭률(CTR), 1:1 인콰이어리 유입 전환율, GMV 매출 성과를 종합 분석합니다.
        </p>
      </div>
      <div class="period-switcher">
        <button
          v-for="p in ['7d', '30d', '90d']"
          :key="p"
          class="btn-period"
          :class="{ active: currentPeriod === p }"
          @click="changePeriod(p)"
        >
          최근 {{ p.toUpperCase() }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="state-box">
      <p>비즈니스 통계 데이터를 분석하는 중입니다...</p>
    </div>

    <div v-else-if="analyticsData" class="analytics-content">
      <!-- 6 Key Performance Indicator Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-title">총 바이어 노출 수 (Impressions)</span>
          <span class="kpi-value text-blue-600">{{ analyticsData.summary.total_impressions.toLocaleString() }}</span>
          <span class="kpi-sub">글로벌 검색 및 카테고리 피드 노출</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">상품 상세 클릭 수 (Clicks)</span>
          <span class="kpi-value text-indigo-600">{{ analyticsData.summary.total_clicks.toLocaleString() }}</span>
          <span class="kpi-sub">클릭률 (CTR): <strong>{{ analyticsData.summary.click_through_rate }}</strong></span>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">수신 인콰이어리 (Inquiries)</span>
          <span class="kpi-value text-orange-600">{{ analyticsData.summary.inquiries_count }}건</span>
          <span class="kpi-sub">상담 전환율: <strong>{{ analyticsData.summary.inquiry_conversion_rate }}</strong></span>
        </div>
        <div class="kpi-card">
          <span class="kpi-title">성약 발주 건수 (Trade Orders)</span>
          <span class="kpi-value text-green-600">{{ analyticsData.summary.orders_count }}건</span>
          <span class="kpi-sub">재구매 바이어 비율: <strong>{{ analyticsData.summary.repeat_buyer_rate }}</strong></span>
        </div>
        <div class="kpi-card wide-card">
          <span class="kpi-title">누적 거래액 (GMV - Gross Merchandise Value)</span>
          <span class="kpi-value text-emerald-600 font-mono">
            ${{ analyticsData.summary.gmv_usd.toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
          </span>
          <span class="kpi-sub">에스크로 무역 보증 체결 기준</span>
        </div>
      </div>

      <!-- Traffic Source Breakdown -->
      <div class="card-section">
        <h3>글로벌 트래픽 유입 채널 분석 (Traffic Sources)</h3>
        <div class="traffic-bars">
          <div v-for="source in analyticsData.traffic_sources" :key="source.channel" class="traffic-item">
            <div class="traffic-info">
              <span class="channel-name">{{ source.channel }}</span>
              <span class="channel-metric">{{ source.visitors }}명 ({{ source.percentage }}%)</span>
            </div>
            <div class="progress-track">
              <div class="progress-bar" :style="{ width: `${source.percentage}%` }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Performing Products -->
      <div class="card-section">
        <h3>상위 성과 도매 품목 (Top Performing Listings)</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>상품명</th>
              <th>노출 수 (Imp)</th>
              <th>클릭 수 (Clicks)</th>
              <th>인콰이어리 (Inq)</th>
              <th>수주 건수 (Orders)</th>
              <th>전환율</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="prod in analyticsData.top_performing_products" :key="prod.id">
              <td class="font-bold text-gray-800">{{ prod.title }}</td>
              <td>{{ prod.impressions.toLocaleString() }}</td>
              <td>{{ prod.clicks.toLocaleString() }}</td>
              <td class="text-orange-600 font-bold">{{ prod.inquiries }}</td>
              <td class="text-green-600 font-bold">{{ prod.orders }}</td>
              <td>
                <span class="tag-rate">{{ prod.conversion_rate }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Daily Trend Timeline -->
      <div class="card-section">
        <h3>일별 비즈니스 트렌드 추이 (Daily Trend Logs)</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>일자 (Date)</th>
              <th>노출 수 (Impressions)</th>
              <th>클릭 수 (Clicks)</th>
              <th>인콰이어리 (Inquiries)</th>
              <th>발주 성약 (Orders)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in analyticsData.daily_metrics_timeline" :key="day.date">
              <td class="font-mono">{{ day.date }}</td>
              <td>{{ day.impressions.toLocaleString() }}</td>
              <td>{{ day.clicks }}</td>
              <td class="text-orange-600 font-bold">{{ day.inquiries }}</td>
              <td class="text-green-600 font-bold">{{ day.orders }}</td>
            </tr>
          </tbody>
        </table>
      </div>
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
.supplier-analytics-page {
  padding: 24px 32px 80px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.head-text h2 {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.period-switcher {
  display: flex;
  gap: 6px;
  background: white;
  padding: 4px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
}

.btn-period {
  padding: 6px 14px;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-period.active {
  background: #0f172a;
  color: white;
}

.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr) 1.5fr;
  gap: 16px;
}

.kpi-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.kpi-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 6px;
}

.kpi-sub {
  font-size: 11px;
  color: #94a3b8;
  margin-top: auto;
}

.card-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 24px;
}

.card-section h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 10px;
}

.traffic-bars {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.traffic-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 4px;
}

.channel-name {
  font-weight: 600;
  color: #334155;
}

.channel-metric {
  color: #64748b;
  font-family: monospace;
}

.progress-track {
  height: 8px;
  background: #f1f5f9;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #3b82f6;
  border-radius: 9999px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.data-table th {
  background: #f8fafc;
  padding: 10px 14px;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
}

.data-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
}

.tag-rate {
  background: #ecfdf5;
  color: #065f46;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.state-box {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 60px;
  text-align: center;
  color: #64748b;
}

/* Mobile & Tablet Responsive Layout */
@media (max-width: 992px) {
  .supplier-analytics-page {
    padding: 16px 12px;
  }
  .page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .wide-card {
    grid-column: span 2;
  }
}

@media (max-width: 640px) {
  .kpi-grid {
    grid-template-columns: 1fr !important;
  }
  .wide-card {
    grid-column: span 1;
  }
  .period-switcher {
    width: 100%;
    justify-content: space-between;
  }
  .data-table {
    display: block;
    overflow-x: auto;
  }
}
</style>

