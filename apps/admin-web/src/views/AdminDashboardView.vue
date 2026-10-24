<template>
  <div class="admin-dashboard">
    <div class="dash-head">
      <div>
        <h2>플랫폼 종합 운영 및 거버넌스 관제 센터 (Admin Operations Hub)</h2>
        <p class="subtitle">플랫폼 총 거래액(GMV), 에스크로 부채, 복식부기 원장 균형, 모더레이션 및 분쟁 현황을 실시간 관제합니다.</p>
      </div>
      <button class="btn-refresh" @click="loadDashboard">↻ 실시간 관제 지표 새로고침</button>
    </div>

    <div v-if="loading" class="loading-state">
      플랫폼 거버넌스 지표를 API 서버에서 집계 중입니다...
    </div>

    <template v-else>
      <!-- System Health Bar -->
      <div class="health-bar">
        <div class="health-item">
          <span class="dot green"></span>
          <span>복식부기 원장 균형: <strong>{{ health.double_entry_balanced ? '일치 (차액 $0.00)' : '불일치' }}</strong></span>
        </div>
        <div class="health-item">
          <span class="dot green"></span>
          <span>PG 일일 대사 상태: <strong>{{ health.pg_reconciliation }}</strong></span>
        </div>
        <div class="health-item">
          <span class="dot green"></span>
          <span>엣지 런타임: <strong>{{ health.edge_runtime }}</strong></span>
        </div>
      </div>

      <!-- Metric Cards -->
      <div class="metrics-grid">
        <div class="m-card">
          <span class="lbl">누적 총 거래액 (Platform GMV)</span>
          <span class="val highlight">${{ ((summary.total_gmv_minor || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
          <span class="sub">전체 B2B 도매 계약 총액</span>
        </div>
        <div class="m-card">
          <span class="lbl">에스크로 보관 부채 (Escrow Held)</span>
          <span class="val orange">${{ ((summary.escrow_held_minor || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
          <span class="sub">검수 및 선적 완료 전 안전 보관금</span>
        </div>
        <div class="m-card">
          <span class="lbl">누적 플랫폼 수수료 수익 (5% Net Fee)</span>
          <span class="val blue">${{ ((summary.fee_revenue_minor || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
          <span class="sub">정산 공제 수수료 누적액</span>
        </div>
        <div class="m-card">
          <span class="lbl">입점 심사 대기 공급사</span>
          <span class="val">{{ summary.pending_verifications_count }}건</span>
          <router-link to="/verifications" class="action-link">실사 승인/반려 →</router-link>
        </div>
        <div class="m-card">
          <span class="lbl">카탈로그 심사 대기</span>
          <span class="val">{{ summary.moderation_pending_count }}건</span>
          <router-link to="/moderation" class="action-link">모더레이션 심사 →</router-link>
        </div>
        <div class="m-card">
          <span class="lbl">진행 중 무역 분쟁</span>
          <span class="val danger">{{ summary.active_disputes_count }}건</span>
          <router-link to="/disputes" class="action-link">중재 판결 콘솔 →</router-link>
        </div>
      </div>

      <div class="two-col-layout">
        <!-- Recent Orders Monitor -->
        <div class="panel">
          <div class="panel-head">
            <h3>📦 최근 도매 발주 계약 관제</h3>
            <span class="badge">{{ recentOrders.length }}건</span>
          </div>
          <table class="panel-table">
            <thead>
              <tr><th>주문번호</th><th>구매기업</th><th>공급기업</th><th>총액</th><th>주문상태</th></tr>
            </thead>
            <tbody>
              <tr v-for="o in recentOrders" :key="o.id">
                <td class="bold">{{ o.order_number }}</td>
                <td>{{ o.buyer_name }}</td>
                <td>{{ o.supplier_name }}</td>
                <td class="num">${{ ((o.total_amount_minor || 0) / 100).toFixed(2) }}</td>
                <td><span class="status-pill">{{ o.order_status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Recent Immutable Audit Logs -->
        <div class="panel">
          <div class="panel-head">
            <h3>🔒 최근 보안 및 거버넌스 감사 로그 (Audit)</h3>
            <router-link to="/audit" class="head-link">전체 감사 로그 →</router-link>
          </div>
          <div class="log-stream">
            <div v-for="l in recentLogs" :key="l.id" class="log-item">
              <div class="log-top">
                <span class="log-action">{{ l.action }}</span>
                <span class="log-time">{{ formatTime(l.created_at) }}</span>
              </div>
              <div class="log-detail">{{ l.details }}</div>
              <div class="log-actor">행위자: {{ l.actor_id }} ({{ l.actor_role }})</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';

const loading = ref(true);
const summary = ref<any>({});
const health = ref<any>({});
const recentOrders = ref<any[]>([]);
const recentLogs = ref<any[]>([]);

function formatTime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

async function loadDashboard() {
  loading.value = true;
  try {
    const res = await apiRequest('/admin/dashboard');
    summary.value = res.summary || {};
    health.value = res.system_health || {};
    recentOrders.value = res.recent_orders || [];
    recentLogs.value = res.recent_audit_logs || [];
  } catch (e) {
    console.warn('Dashboard load error:', e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboard();
});
</script>

<style scoped>
.admin-dashboard { max-width: 1200px; display: flex; flex-direction: column; gap: 20px; }
.dash-head { display: flex; justify-content: space-between; align-items: center; }
h2 { margin: 0 0 4px 0; font-size: 20px; color: #FFF; }
.subtitle { color: #94A3B8; font-size: 13px; margin: 0; }
.btn-refresh { background: #1C2541; border: 1px solid #3A506B; color: #E2E8F0; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; }
.loading-state { padding: 40px; text-align: center; color: #94A3B8; }

.health-bar { display: flex; gap: 24px; background: #1C2541; border: 1px solid #3A506B; padding: 12px 20px; border-radius: 8px; font-size: 13px; }
.health-item { display: flex; align-items: center; gap: 8px; }
.dot.green { width: 8px; height: 8px; border-radius: 50%; background: #10B981; }

.metrics-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; }
.m-card { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 6px; }
.m-card .lbl { font-size: 11px; color: #94A3B8; font-weight: 600; }
.m-card .val { font-size: 22px; font-weight: 800; color: #FFF; font-variant-numeric: tabular-nums; }
.m-card .val.highlight { color: #38BDF8; }
.m-card .val.orange { color: #FB923C; }
.m-card .val.blue { color: #818CF8; }
.m-card .val.danger { color: #F87171; }
.m-card .sub { font-size: 10px; color: #64748B; }
.action-link { font-size: 11px; color: #38BDF8; text-decoration: none; font-weight: 700; margin-top: 4px; }

.two-col-layout { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; }
.panel { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 20px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.panel-head h3 { margin: 0; font-size: 15px; color: #FFF; }
.head-link { font-size: 12px; color: #38BDF8; text-decoration: none; font-weight: 700; }
.badge { background: #0B132B; padding: 2px 8px; border-radius: 4px; font-size: 11px; color: #94A3B8; }

.panel-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.panel-table th, .panel-table td { padding: 8px 6px; border-bottom: 1px solid #2B3A55; text-align: left; }
.panel-table th { color: #94A3B8; }
.bold { font-weight: 700; color: #FFF; }
.num { font-variant-numeric: tabular-nums; font-weight: 700; color: #38BDF8; }
.status-pill { background: #0B132B; border: 1px solid #3A506B; padding: 2px 6px; border-radius: 4px; font-size: 10px; color: #E2E8F0; }

.log-stream { display: flex; flex-direction: column; gap: 10px; }
.log-item { background: #0B132B; border: 1px solid #2B3A55; border-radius: 6px; padding: 10px 12px; }
.log-top { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
.log-action { color: #F59E0B; font-weight: 700; font-family: monospace; }
.log-time { color: #64748B; }
.log-detail { font-size: 12px; color: #E2E8F0; margin-bottom: 4px; }
.log-actor { font-size: 10px; color: #94A3B8; }
</style>

