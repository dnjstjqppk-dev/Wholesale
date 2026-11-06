<template>
  <div class="ws-admin-page auditlog">
    <div class="admin-head">
      <div>
        <p class="admin-eyebrow">Audit Trail</p>
        <h1>불변 보안 감사 로그</h1>
        <p class="admin-sub">인증·모더레이션·계약·결제·분쟁·정산 행위 전체가 법적 효력의 감사 원장에 기록됩니다.</p>
      </div>
      <span class="ws-cluster" style="gap: 8px">
        <select v-model="selectedAction" class="ws-admin-input" style="width: auto" @change="loadLogs">
          <option value="">전체 행위 이벤트</option>
          <option value="TRADE_ORDER_PLACED">TRADE_ORDER_PLACED</option>
          <option value="ORDER_APPROVED">ORDER_APPROVED</option>
          <option value="CONTRACT_SIGNED">CONTRACT_SIGNED</option>
          <option value="PAYMENT_CAPTURED">PAYMENT_CAPTURED</option>
          <option value="SHIPMENT_DISPATCHED">SHIPMENT_DISPATCHED</option>
          <option value="INSPECTION_PASSED">INSPECTION_PASSED</option>
          <option value="DISPUTE_OPENED">DISPUTE_OPENED</option>
          <option value="DISPUTE_ARBITRATED">DISPUTE_ARBITRATED</option>
          <option value="SETTLEMENT_STAGE_1_APPROVED">SETTLEMENT_STAGE_1_APPROVED</option>
          <option value="SETTLEMENT_PAYOUT_DISPATCHED">SETTLEMENT_PAYOUT_DISPATCHED</option>
          <option value="SUPPLIER_VERIFICATION_APPROVED">SUPPLIER_VERIFICATION_APPROVED</option>
        </select>
        <button class="ws-admin-btn" @click="loadLogs"><WsIcon name="refresh" :size="13" /> 새로고침</button>
      </span>
    </div>

    <div v-if="loading" class="ws-skeleton sk-dark" style="height: 240px"></div>

    <section v-else class="ws-admin-card">
      <div class="ws-card-head">
        <h3 class="admin-h">감사 전표 ({{ logs.length }}건)</h3>
        <span class="ws-admin-badge ws-admin-badge-ok">불변 아카이브 7년 보존</span>
      </div>
      <div class="ws-admin-table-wrap">
        <div class="ws-admin-table-scroll">
          <table class="ws-admin-table">
            <thead><tr><th>로그 ID</th><th>타임스탬프</th><th>이벤트</th><th>행위 주체</th><th>대상 엔티티</th><th>상세 내역</th></tr></thead>
            <tbody>
              <tr v-for="l in logs" :key="l.id">
                <td class="ws-figure dim">{{ l.id }}</td>
                <td class="ws-small dim nowrap">{{ formatTime(l.created_at) }}</td>
                <td><code class="evt">{{ l.action }}</code></td>
                <td>
                  <b>{{ l.actor_id }}</b><br />
                  <span class="ws-small role">{{ l.actor_role }}</span>
                </td>
                <td><code class="ws-small">{{ l.target_type }}:{{ l.target_id }}</code></td>
                <td class="desc">{{ l.details }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const loading = ref(true);
const logs = ref<any[]>([]);
const selectedAction = ref('');

function formatTime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ko-KR');
}

async function loadLogs() {
  loading.value = true;
  try {
    const url = selectedAction.value
      ? `/admin/audit-logs?action=${encodeURIComponent(selectedAction.value)}`
      : '/admin/audit-logs';
    const res = await apiRequest(url);
    logs.value = res.audit_logs || [];
  } catch (e) {
    console.warn('Audit logs load failed:', e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadLogs();
});
</script>

<style scoped>
.auditlog { display: flex; flex-direction: column; gap: 18px; }
.admin-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.admin-head h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; letter-spacing: -0.015em; }
.admin-eyebrow { margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ws-admin-accent); }
.admin-sub { margin: 0; font-size: 13px; color: var(--ws-admin-dim); max-width: 62ch; }
.admin-h { color: #fff; font-size: 15px; }
.evt { color: var(--ws-admin-accent); font-weight: 700; font-size: 11px; }
.dim { color: var(--ws-admin-dim); }
.nowrap { white-space: nowrap; }
.role { color: var(--ws-admin-link); font-weight: 600; }
.desc { max-width: 440px; }
.sk-dark { background: var(--ws-admin-panel); }
</style>
