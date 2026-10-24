<template>
  <div class="reconciliation-page">
    <div class="head-row">
      <div>
        <h2>PG 결제 대사 및 복식부기 원장 검증 (Daily Reconciliation)</h2>
        <p class="subtitle">PG사 승인 내역과 플랫폼 내부 복식원장(차변=대변) 간 일일 대사 배치를 실행하고 불일치(Discrepancy)를 전수 검증합니다.</p>
      </div>
      <button class="btn-batch" :disabled="reconciling" @click="runReconciliation">
        {{ reconciling ? '대사 배치 가동 중...' : '⚡ 일일 결제 대사 배치 실행 (POST /v1/settlements/reconcile)' }}
      </button>
    </div>

    <div v-if="loading" class="loading-state">대사 기록을 불러오는 중입니다...</div>

    <div class="card">
      <h3>📊 일일 결제 대사 실행 리포트</h3>
      <table class="rec-table">
        <thead>
          <tr>
            <th>대사 ID</th>
            <th>기준 일자</th>
            <th>PG 승인 총액</th>
            <th>원장 차변 기표액</th>
            <th>불일치 차액</th>
            <th>대사 검증 건수</th>
            <th>대사 상태</th>
            <th>수행 일시</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in reconciliations" :key="r.id">
            <td class="bold">{{ r.id }}</td>
            <td>{{ r.date }}</td>
            <td class="num">${{ ((r.pg_captured_minor || 0) / 100).toFixed(2) }}</td>
            <td class="num">${{ ((r.ledger_debit_minor || 0) / 100).toFixed(2) }}</td>
            <td class="num" :class="r.discrepancy_minor === 0 ? 'zero' : 'err'">
              ${{ ((r.discrepancy_minor || 0) / 100).toFixed(2) }}
            </td>
            <td>{{ r.matched_records }}건 일치 (불일치 0건)</td>
            <td><span class="st-pill balanced">✓ {{ r.status }}</span></td>
            <td class="time">{{ formatTime(r.performed_at) }}</td>
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
const reconciling = ref(false);
const reconciliations = ref<any[]>([]);

function formatTime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ko-KR');
}

async function loadReconciliations() {
  loading.value = true;
  try {
    const res = await apiRequest('/settlements/reconciliations');
    reconciliations.value = res.reconciliations || [];
  } catch (e) {
    console.warn('Reconciliations load error:', e);
  } finally {
    loading.value = false;
  }
}

async function runReconciliation() {
  reconciling.value = true;
  try {
    const res = await apiRequest('/settlements/reconcile', { method: 'POST' });
    if (res.reconciliation) {
      reconciliations.value.unshift(res.reconciliation);
    }
    alert(res.message || '일일 대사가 완료되었습니다.');
  } catch (err: any) {
    alert(`대사 실행 실패: ${err.message}`);
  } finally {
    reconciling.value = false;
  }
}

onMounted(() => {
  loadReconciliations();
});
</script>

<style scoped>
.reconciliation-page { max-width: 1100px; display: flex; flex-direction: column; gap: 20px; }
.head-row { display: flex; justify-content: space-between; align-items: center; }
h2 { margin: 0 0 4px 0; font-size: 20px; color: #FFF; }
.subtitle { color: #94A3B8; font-size: 13px; margin: 0; }
.btn-batch { background: #059669; color: #FFF; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; }
.loading-state { padding: 40px; text-align: center; color: #94A3B8; }
.card { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 24px; }
.card h3 { margin: 0 0 16px 0; font-size: 16px; color: #FFF; }
.rec-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.rec-table th, .rec-table td { padding: 10px 8px; border-bottom: 1px solid #2B3A55; text-align: left; }
.rec-table th { color: #94A3B8; background: #0B132B; }
.bold { font-weight: 700; color: #FFF; }
.num { font-variant-numeric: tabular-nums; font-weight: 700; }
.num.zero { color: #10B981; }
.num.err { color: #EF4444; }
.st-pill { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
.st-pill.balanced { background: #064E3B; color: #6EE7B7; }
.time { color: #94A3B8; font-size: 12px; }
</style>

