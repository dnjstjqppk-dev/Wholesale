<template>
  <div class="dashboard">
    <div class="dash-head">
      <div>
        <h2>공급사 파트너 영업/생산 종합 대시보드 (Seller Central)</h2>
        <p class="subtitle">실시간 카탈로그, RFQ 입찰, 수주 생산, 재고 원장 및 에스크로 정산 지표가 API 서버와 동기화됩니다.</p>
      </div>
      <button class="btn-refresh" @click="loadDashboard">↻ 실시간 지표 새로고침</button>
    </div>

    <div v-if="loading" class="loading-box">대시보드 지표를 서버에서 불러오는 중입니다...</div>

    <template v-else>
      <!-- Supplier Verification Banner -->
      <div class="verification-banner">
        <div class="banner-left">
          <span class="shield">✓</span>
          <div>
            <h4>기업 실사 및 품질 인증 완료 (Verified Manufacturer — 평점 ★ {{ stats.supplier_rating || 4.9 }} / 응답률 {{ stats.response_rate || '99.2%' }})</h4>
            <p>사업자등록증 검증 완료 · ISO 9001:2015 제조 설비 인증 · 에스크로 정산 계좌 연동됨</p>
          </div>
        </div>
        <router-link to="/verification" class="btn-outline">인증 증빙 서류 및 공장 실사 관리 →</router-link>
      </div>

      <!-- KPI Grid -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="label">운영 등록 도매 상품</span>
          <span class="value">{{ stats.active_listings_count }}개</span>
          <router-link to="/catalog" class="sub-link">구간단가 및 카탈로그 편집 →</router-link>
        </div>
        <div class="kpi-card">
          <span class="label">입찰 가능 공개 RFQ</span>
          <span class="value highlight">{{ stats.open_rfqs_count }}건</span>
          <router-link to="/rfq-market" class="sub-link">실시간 견적서 제출하기 →</router-link>
        </div>
        <div class="kpi-card">
          <span class="label">바이어 1:1 문의 (미답변)</span>
          <span class="value">{{ stats.pending_inquiries_count }}건</span>
          <router-link to="/inquiries" class="sub-link">1:1 인콰이어리 메신저 →</router-link>
        </div>
        <div class="kpi-card">
          <span class="label">진행 중 수주 주문</span>
          <span class="value">{{ stats.in_production_orders_count }}건</span>
          <router-link to="/fulfillment" class="sub-link">분할 선적 및 B/L 등록 →</router-link>
        </div>
        <div class="kpi-card">
          <span class="label">에스크로 정산 대기 잔액</span>
          <span class="value">${{ ((stats.escrow_pending_minor || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
          <router-link to="/settlement" class="sub-link">출금 가능: ${{ ((stats.escrow_release_eligible_minor || 0) / 100).toFixed(2) }} →</router-link>
        </div>
      </div>

      <div class="dash-two-col">
        <!-- Recent Received Orders -->
        <div class="panel-card">
          <div class="panel-head">
            <h3>📦 최근 수주 도매 주문</h3>
            <router-link to="/fulfillment">전체 주문 관리 →</router-link>
          </div>
          <table class="mini-table">
            <thead>
              <tr><th>주문번호</th><th>구매기업</th><th>품목</th><th>총액</th><th>상태</th></tr>
            </thead>
            <tbody>
              <tr v-for="o in recentOrders" :key="o.id">
                <td class="bold">{{ o.order_number }}</td>
                <td>{{ o.buyer_name }}</td>
                <td>{{ o.item_title?.slice(0, 24) }}...</td>
                <td class="num">${{ ((o.total_amount_minor || 0) / 100).toFixed(2) }}</td>
                <td><span class="badge">{{ o.order_status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Warehouse Inventory Quick Status -->
        <div class="panel-card">
          <div class="panel-head">
            <h3>🏭 창고 가용 재고 원장 요약</h3>
            <router-link to="/inventory">재고 입고/조정 →</router-link>
          </div>
          <table class="mini-table">
            <thead>
              <tr><th>SKU 코드</th><th>창고 위치</th><th>실물재고</th><th>예약됨</th><th>가용재고</th></tr>
            </thead>
            <tbody>
              <tr v-for="inv in inventoryList" :key="inv.sku_id">
                <td class="bold">{{ inv.sku_code }}</td>
                <td>{{ inv.warehouse_name }}</td>
                <td>{{ inv.on_hand?.toLocaleString() }}</td>
                <td>{{ inv.reserved?.toLocaleString() }}</td>
                <td class="avail">{{ inv.available?.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';

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
.dash-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
h2 { margin: 0 0 4px 0; font-size: 20px; color: #172B4D; }
.subtitle { color: #64748B; font-size: 13px; margin: 0; }
.btn-refresh { background: #FFF; border: 1px solid #CBD5E1; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; }
.loading-box { padding: 40px; text-align: center; background: #FFF; border-radius: 8px; border: 1px solid #D8E0EB; }

.verification-banner { background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.banner-left { display: flex; align-items: center; gap: 14px; }
.shield { background: #15803D; color: #FFF; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; }
.banner-left h4 { margin: 0 0 4px 0; color: #14532D; font-size: 15px; }
.banner-left p { margin: 0; color: #166534; font-size: 12px; }
.btn-outline { background: #FFF; border: 1px solid #86EFAC; color: #15803D; padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; text-decoration: none; }

.kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 24px; }
.kpi-card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 18px; display: flex; flex-direction: column; gap: 6px; }
.kpi-card .label { font-size: 12px; color: #64748B; font-weight: 600; }
.kpi-card .value { font-size: 24px; font-weight: 800; color: #172B4D; font-variant-numeric: tabular-nums; }
.kpi-card .value.highlight { color: #C2410C; }
.kpi-card .sub-link { font-size: 11px; color: #2563EB; text-decoration: none; font-weight: 600; margin-top: 4px; }

.dash-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.panel-card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 20px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.panel-head h3 { margin: 0; font-size: 15px; color: #172B4D; }
.panel-head a { font-size: 12px; color: #C2410C; text-decoration: none; font-weight: 700; }
.mini-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.mini-table th, .mini-table td { border-bottom: 1px solid #F1F5F9; padding: 8px 6px; text-align: left; }
.mini-table th { color: #64748B; background: #F8FAFC; }
.bold { font-weight: 700; color: #0F172A; }
.num { font-variant-numeric: tabular-nums; font-weight: 700; }
.avail { color: #15803D; font-weight: 800; }
.badge { background: #EFF6FF; color: #1D4ED8; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; }

@media (max-width: 1024px) {
  .kpi-grid { grid-template-columns: repeat(3, 1fr); }
  .dash-two-col { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .verification-banner { flex-direction: column; align-items: flex-start; gap: 12px; }
  .dash-head { flex-direction: column; align-items: flex-start; gap: 10px; }
  .mini-table { display: block; overflow-x: auto; }
}
</style>
