<template>
  <div class="ws-admin-page ledger">
    <div class="admin-head">
      <div>
        <p class="admin-eyebrow">Ledger Audit</p>
        <h1>복식부기 원장 감사</h1>
        <p class="admin-sub">차변=대변 일치 전표 영구 보존 · 정정은 역분개로만 처리.</p>
      </div>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton sk-dark" style="height: 90px"></div>
      <div class="ws-skeleton sk-dark" style="height: 180px"></div>
    </div>

    <div v-else-if="error" class="admin-error">
      <WsIcon name="alert" :size="16" /> {{ error }}
    </div>

    <div v-else class="ws-stack">
      <div class="sum-strip">
        <div><span>감사 기준 시각</span><b class="ws-figure">{{ auditData?.audit_timestamp }}</b></div>
        <div><span>총 차변 (Debit)</span><b class="ws-figure">${{ ((auditData?.total_debit_minor || 0) / 100).toFixed(2) }}</b></div>
        <div><span>총 대변 (Credit)</span><b class="ws-figure">${{ ((auditData?.total_credit_minor || 0) / 100).toFixed(2) }}</b></div>
        <div><span>차액 (Variance)</span><b class="ws-figure" :class="auditData?.variance_minor === 0 ? 'ok' : 'bad'">${{ ((auditData?.variance_minor || 0) / 100).toFixed(2) }}</b></div>
      </div>

      <section v-for="j in auditData?.journals" :key="j.id" class="ws-admin-card">
        <div class="ws-split j-head">
          <span class="ws-cluster" style="gap: 10px">
            <b class="j-num ws-figure">{{ j.id }}</b>
            <span class="ws-admin-badge ws-admin-badge-idle">{{ j.type }}</span>
            <span class="ws-small dim">{{ j.created_at }}</span>
          </span>
          <span class="ws-admin-badge" :class="j.is_balanced ? 'ws-admin-badge-ok' : 'ws-admin-badge-bad'">
            {{ j.is_balanced ? '✓ BALANCED' : '✕ ERROR' }}
          </span>
        </div>
        <div class="ws-admin-table-wrap">
          <table class="ws-admin-table">
            <thead><tr><th>계정과목 / 설명</th><th>차변 (Debit)</th><th>대변 (Credit)</th></tr></thead>
            <tbody>
              <tr>
                <td>{{ j.debit_account }} ({{ j.memo }})</td>
                <td class="ws-figure">${{ (j.amount_minor / 100).toFixed(2) }}</td>
                <td>-</td>
              </tr>
              <tr>
                <td>{{ j.credit_account }} ({{ j.memo }})</td>
                <td>-</td>
                <td class="ws-figure">${{ (j.amount_minor / 100).toFixed(2) }}</td>
              </tr>
              <tr class="total-row">
                <td><b>합계</b></td>
                <td class="ws-figure"><b>${{ (j.amount_minor / 100).toFixed(2) }}</b></td>
                <td class="ws-figure"><b>${{ (j.amount_minor / 100).toFixed(2) }}</b></td>
              </tr>
            </tbody>
          </table>
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
const error = ref('');
const auditData = ref<any>(null);

async function loadLedgerAudit() {
  loading.value = true;
  error.value = '';
  try {
    auditData.value = await apiRequest('/admin/ledger/audit');
  } catch (err: any) {
    error.value = err.message || '원장 감사 데이터를 불러오는 중 오류가 발생했습니다.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadLedgerAudit();
});
</script>

<style scoped>
.ledger { display: flex; flex-direction: column; gap: 18px; }
.admin-head h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; letter-spacing: -0.015em; }
.admin-eyebrow { margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ws-admin-accent); }
.admin-sub { margin: 0; font-size: 13px; color: var(--ws-admin-dim); }
.admin-error { background: rgb(239 68 68 / 0.12); border: 1px solid rgb(239 68 68 / 0.4); color: #fca5a5; border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 600; display: flex; gap: 8px; align-items: center; }
.sum-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; background: var(--ws-admin-panel); border: 1px solid var(--ws-admin-line); border-radius: 10px; padding: 16px 20px; }
.sum-strip div { display: flex; flex-direction: column; gap: 4px; }
.sum-strip span { font-size: 11px; color: var(--ws-admin-dim); font-weight: 700; }
.sum-strip b { font-size: 16px; }
.ok { color: #6ee7b7; }
.bad { color: #fca5a5; }
.j-head { margin-bottom: 12px; }
.j-num { color: var(--ws-admin-link); font-size: 15px; }
.dim { color: var(--ws-admin-dim); }
.total-row td { border-top: 2px solid var(--ws-admin-link); }
.sk-dark { background: var(--ws-admin-panel); }
@media (max-width: 768px) {
  .sum-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
