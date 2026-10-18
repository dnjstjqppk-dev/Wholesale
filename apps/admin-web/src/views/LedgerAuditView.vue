<template>
  <div class="ledger-audit-page">
    <h2>복식부기 회계 원장 감사 (Double-Entry Ledger Audit)</h2>
    <p class="subtitle">모든 거래는 차변(Debit)=대변(Credit) 일치 전표로 영구 보존되며, 정정은 역분개로만 처리됩니다.</p>

    <div v-if="loading" class="loading-state">
      원장 감사 데이터를 API 게이트웨이에서 집계 중입니다...
    </div>

    <div v-else-if="error" class="error-banner">
      ⚠️ {{ error }}
    </div>

    <div v-else class="journals-list">
      <div class="audit-summary-strip">
        <div class="summary-col">
          <span class="lbl">감사 기준 시각:</span>
          <span class="val">{{ auditData?.audit_timestamp }}</span>
        </div>
        <div class="summary-col">
          <span class="lbl">총 차변 합계 (Debit):</span>
          <span class="val">${{ ((auditData?.total_debit_minor || 0) / 100).toFixed(2) }}</span>
        </div>
        <div class="summary-col">
          <span class="lbl">총 대변 합계 (Credit):</span>
          <span class="val">${{ ((auditData?.total_credit_minor || 0) / 100).toFixed(2) }}</span>
        </div>
        <div class="summary-col">
          <span class="lbl">차대변 차액 (Variance):</span>
          <span class="val" :class="{ ok: auditData?.variance_minor === 0 }">
            ${{ ((auditData?.variance_minor || 0) / 100).toFixed(2) }}
          </span>
        </div>
      </div>

      <div v-for="j in auditData?.journals" :key="j.id" class="journal-card">
        <div class="j-head">
          <div>
            <span class="j-num">{{ j.id }}</span>
            <span class="j-type">{{ j.type }}</span>
            <span class="j-date">{{ j.created_at }}</span>
          </div>
          <div class="balance-indicator" :class="{ balanced: j.is_balanced }">
            {{ j.is_balanced ? '✓ 차대변 일치 (BALANCED)' : '✕ 불일치 (ERROR)' }}
          </div>
        </div>

        <table class="entries-table">
          <thead>
            <tr><th>계정과목 / 설명</th><th class="num">차변 (Debit)</th><th class="num">대변 (Credit)</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ j.debit_account }} ({{ j.memo }})</td>
              <td class="num">${{ (j.amount_minor / 100).toFixed(2) }}</td>
              <td class="num">-</td>
            </tr>
            <tr>
              <td>{{ j.credit_account }} ({{ j.memo }})</td>
              <td class="num">-</td>
              <td class="num">${{ (j.amount_minor / 100).toFixed(2) }}</td>
            </tr>
            <tr class="total-row">
              <td>합계 (Total)</td>
              <td class="num bold">${{ (j.amount_minor / 100).toFixed(2) }}</td>
              <td class="num bold">${{ (j.amount_minor / 100).toFixed(2) }}</td>
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
.ledger-audit-page { max-width: 1000px; margin: 0 auto; }
h2 { margin: 0 0 6px 0; font-size: 20px; color: #F8FAFC; }
.subtitle { color: #94A3B8; font-size: 13px; margin-bottom: 24px; }
.loading-state { padding: 40px; text-align: center; color: #94A3B8; }
.error-banner { background: #7F1D1D; color: #FECACA; padding: 12px; border-radius: 6px; margin-bottom: 20px; }
.audit-summary-strip { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 16px 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.summary-col .lbl { display: block; font-size: 11px; color: #94A3B8; margin-bottom: 4px; }
.summary-col .val { font-size: 15px; font-weight: 700; color: #FFF; font-variant-numeric: tabular-nums; }
.summary-col .val.ok { color: #34D399; }
.journals-list { display: flex; flex-direction: column; gap: 20px; }
.journal-card { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 20px; }
.j-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid #3A506B; padding-bottom: 12px; }
.j-num { font-weight: 700; color: #38BDF8; font-size: 15px; margin-right: 12px; }
.j-type { background: #0B132B; color: #E2E8F0; font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-right: 8px; }
.j-date { font-size: 12px; color: #94A3B8; }
.balance-indicator { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; }
.balance-indicator.balanced { background: #065F46; color: #A7F3D0; }
.entries-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.entries-table th, .entries-table td { border-bottom: 1px solid #3A506B; padding: 8px 12px; text-align: left; }
.entries-table th { background: #0B132B; color: #94A3B8; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.total-row { border-top: 2px solid #38BDF8; font-weight: 700; color: #FFF; }
.bold { font-weight: 700; }
</style>
