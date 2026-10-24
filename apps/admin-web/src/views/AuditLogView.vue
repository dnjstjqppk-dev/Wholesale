<template>
  <div class="audit-log-page">
    <div class="head-row">
      <div>
        <h2>플랫폼 불변 보안 감사 로그 (Immutable Audit Trail)</h2>
        <p class="subtitle">인증·상품 모더레이션·무역계약·결제·분쟁 중재·정산 이체 등 모든 트랜잭션 행위가 법적 효력을 갖는 감사 원장에 기록됩니다.</p>
      </div>
      <div class="filter-controls">
        <select v-model="selectedAction" @change="loadLogs">
          <option value="">전체 행위 이벤트 (All Actions)</option>
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
        <button class="btn-refresh" @click="loadLogs">↻ 새로고침</button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">감사 로그를 안전하게 불러오는 중입니다...</div>

    <div class="card">
      <div class="card-head">
        <h3>기록된 감사 전표 ({{ logs.length }}건)</h3>
        <span class="policy-tag">보존 연한: 법적 불변 아카이브 7년</span>
      </div>

      <table class="log-table">
        <thead>
          <tr>
            <th>로그 ID</th>
            <th>타임스탬프 (UTC/KST)</th>
            <th>이벤트 액션</th>
            <th>행위 주체 (Actor)</th>
            <th>대상 엔티티</th>
            <th>감사 상세 내역</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in logs" :key="l.id">
            <td class="bold code">{{ l.id }}</td>
            <td class="time">{{ formatTime(l.created_at) }}</td>
            <td><span class="action-badge">{{ l.action }}</span></td>
            <td>
              <div class="actor-info">
                <strong>{{ l.actor_id }}</strong>
                <span class="role-chip">{{ l.actor_role }}</span>
              </div>
            </td>
            <td><code>{{ l.target_type }}:{{ l.target_id }}</code></td>
            <td class="desc">{{ l.details }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';

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
.audit-log-page { max-width: 1200px; display: flex; flex-direction: column; gap: 20px; }
.head-row { display: flex; justify-content: space-between; align-items: center; }
h2 { margin: 0 0 4px 0; font-size: 20px; color: #FFF; }
.subtitle { color: #94A3B8; font-size: 13px; margin: 0; }
.filter-controls { display: flex; gap: 8px; }
.filter-controls select { background: #1C2541; color: #E2E8F0; border: 1px solid #3A506B; padding: 8px 12px; border-radius: 6px; font-size: 12px; }
.btn-refresh { background: #1C2541; border: 1px solid #3A506B; color: #E2E8F0; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; }
.loading-state { padding: 40px; text-align: center; color: #94A3B8; }

.card { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 24px; }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.card-head h3 { margin: 0; font-size: 16px; color: #FFF; }
.policy-tag { background: #064E3B; color: #6EE7B7; font-size: 11px; padding: 4px 10px; border-radius: 4px; font-weight: 700; }

.log-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.log-table th, .log-table td { padding: 10px 8px; border-bottom: 1px solid #2B3A55; text-align: left; }
.log-table th { background: #0B132B; color: #94A3B8; }
.code { font-family: monospace; color: #94A3B8; }
.time { color: #94A3B8; white-space: nowrap; }
.action-badge { background: #0B132B; border: 1px solid #3A506B; color: #F59E0B; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: 700; }
.actor-info { display: flex; flex-direction: column; gap: 2px; }
.role-chip { font-size: 10px; color: #38BDF8; font-weight: 600; }
.desc { color: #E2E8F0; max-width: 440px; }
</style>

