<template>
  <div class="ws-admin-page admin-dash">
    <div class="admin-head">
      <div>
        <p class="admin-eyebrow">Operations Hub</p>
        <h1>종합 운영·거버넌스 관제 센터</h1>
        <p class="admin-sub">GMV·에스크로 부채·원장 균형·모더레이션·분쟁 현황 실시간 관제.</p>
      </div>
      <button class="ws-admin-btn" @click="loadDashboard"><WsIcon name="refresh" :size="14" /> 지표 새로고침</button>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton sk-dark" style="height: 56px"></div>
      <div class="metrics-6">
        <div class="ws-skeleton sk-dark" style="height: 110px"></div>
        <div class="ws-skeleton sk-dark" style="height: 110px"></div>
        <div class="ws-skeleton sk-dark" style="height: 110px"></div>
        <div class="ws-skeleton sk-dark" style="height: 110px"></div>
        <div class="ws-skeleton sk-dark" style="height: 110px"></div>
        <div class="ws-skeleton sk-dark" style="height: 110px"></div>
      </div>
    </div>

    <template v-else>
      <div class="health-strip">
        <span class="h-item"><i class="ws-dot ws-dot-success"></i> 복식부기 균형 <b>{{ health.double_entry_balanced ? '일치 ($0.00)' : '불일치' }}</b></span>
        <span class="h-item"><i class="ws-dot ws-dot-success"></i> PG 대사 <b>{{ health.pg_reconciliation }}</b></span>
        <span class="h-item"><i class="ws-dot ws-dot-success"></i> 엣지 런타임 <b>{{ health.edge_runtime }}</b></span>
      </div>

      <div class="metrics-6">
        <div class="ws-admin-stat">
          <p class="ws-admin-stat-label">누적 GMV</p>
          <p class="ws-admin-stat-value gmv">${{ ((summary.total_gmv_minor || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</p>
          <p class="admin-foot">전체 B2B 도매 계약 총액</p>
        </div>
        <div class="ws-admin-stat">
          <p class="ws-admin-stat-label">에스크로 부채</p>
          <p class="ws-admin-stat-value escrow">${{ ((summary.escrow_held_minor || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</p>
          <p class="admin-foot">검수·선적 전 안전 보관금</p>
        </div>
        <div class="ws-admin-stat">
          <p class="ws-admin-stat-label">수수료 수익 (5%)</p>
          <p class="ws-admin-stat-value fee">${{ ((summary.fee_revenue_minor || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</p>
          <p class="admin-foot">정산 공제 수수료 누적</p>
        </div>
        <div class="ws-admin-stat">
          <p class="ws-admin-stat-label">심사 대기 공급사</p>
          <p class="ws-admin-stat-value">{{ summary.pending_verifications_count }}<span class="unit">건</span></p>
          <router-link to="/verifications" class="admin-link">실사 승인/반려 →</router-link>
        </div>
        <div class="ws-admin-stat">
          <p class="ws-admin-stat-label">카탈로그 심사 대기</p>
          <p class="ws-admin-stat-value">{{ summary.moderation_pending_count }}<span class="unit">건</span></p>
          <router-link to="/moderation" class="admin-link">모더레이션 심사 →</router-link>
        </div>
        <div class="ws-admin-stat">
          <p class="ws-admin-stat-label">진행 중 분쟁</p>
          <p class="ws-admin-stat-value danger">{{ summary.active_disputes_count }}<span class="unit">건</span></p>
          <router-link to="/disputes" class="admin-link">중재 판결 콘솔 →</router-link>
        </div>
      </div>

      <div class="panels-2">
        <section class="ws-admin-card">
          <div class="ws-card-head">
            <h3 class="admin-h"><WsIcon name="package" :size="15" class="h-ico" /> 최근 발주 계약 관제</h3>
            <span class="ws-admin-badge ws-admin-badge-idle">{{ recentOrders.length }}건</span>
          </div>
          <div class="ws-admin-table-scroll">
            <table class="ws-admin-table">
              <thead><tr><th>주문번호</th><th>구매기업</th><th>공급기업</th><th>총액</th><th>상태</th></tr></thead>
              <tbody>
                <tr v-for="o in recentOrders" :key="o.id">
                  <td class="ws-figure"><b>{{ o.order_number }}</b></td>
                  <td>{{ o.buyer_name }}</td>
                  <td>{{ o.supplier_name }}</td>
                  <td class="ws-figure amt">${{ ((o.total_amount_minor || 0) / 100).toFixed(2) }}</td>
                  <td><span class="ws-admin-badge ws-admin-badge-info">{{ o.order_status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="ws-admin-card">
          <div class="ws-card-head">
            <h3 class="admin-h"><WsIcon name="lock" :size="15" class="h-ico" /> 보안·거버넌스 감사 로그</h3>
            <router-link to="/audit" class="admin-link">전체 로그 →</router-link>
          </div>
          <div class="log-stream">
            <div v-for="l in recentLogs" :key="l.id" class="log-row">
              <div class="ws-split">
                <code class="log-action">{{ l.action }}</code>
                <span class="log-time">{{ formatTime(l.created_at) }}</span>
              </div>
              <p class="log-detail">{{ l.details }}</p>
              <p class="log-actor">행위자 {{ l.actor_id }} ({{ l.actor_role }})</p>
            </div>
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
.admin-dash { display: flex; flex-direction: column; gap: 18px; }
.admin-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.admin-eyebrow { margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ws-admin-accent); }
.admin-head h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; letter-spacing: -0.015em; }
.admin-sub { margin: 0; font-size: 13px; color: var(--ws-admin-dim); }
.health-strip { display: flex; gap: 28px; flex-wrap: wrap; background: var(--ws-admin-panel); border: 1px solid var(--ws-admin-line); border-radius: 10px; padding: 12px 20px; font-size: 13px; }
.h-item { display: inline-flex; align-items: center; gap: 8px; }
.metrics-6 { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
.ws-admin-stat-value { font-size: 19px; }
.ws-admin-stat-value .unit { font-size: 12px; font-weight: 700; color: var(--ws-admin-dim); margin-left: 2px; }
.gmv { color: var(--ws-admin-link); }
.escrow { color: #fb923c; }
.fee { color: #818cf8; }
.danger { color: #f87171; }
.admin-foot { font-size: 10px; color: var(--ws-admin-dim); margin: 4px 0 0; }
.admin-link { font-size: 11px; font-weight: 700; color: var(--ws-admin-link); text-decoration: none; display: inline-block; margin-top: 6px; }
.admin-link:hover { text-decoration: underline; }
.panels-2 { display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px; }
.admin-h { color: #fff; font-size: 15px; display: flex; align-items: center; gap: 8px; }
.h-ico { color: var(--ws-admin-accent); }
.ws-admin-table .amt { color: var(--ws-admin-link); font-weight: 700; }
.log-stream { display: flex; flex-direction: column; gap: 10px; }
.log-row { background: var(--ws-admin-panel-2); border: 1px solid var(--ws-admin-line); border-radius: 8px; padding: 10px 12px; }
.log-action { color: var(--ws-admin-accent); font-weight: 700; font-size: 11px; }
.log-time { font-size: 11px; color: var(--ws-admin-dim); }
.log-detail { font-size: 12px; margin: 6px 0 4px; }
.log-actor { font-size: 10px; color: var(--ws-admin-dim); margin: 0; }
.sk-dark { background: var(--ws-admin-panel); }
@media (max-width: 1100px) {
  .metrics-6 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .panels-2 { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 680px) {
  .metrics-6 { grid-template-columns: minmax(0, 1fr); }
  .admin-head { align-items: flex-start; flex-direction: column; }
}
</style>
