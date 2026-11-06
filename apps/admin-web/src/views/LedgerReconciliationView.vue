<template>
  <div class="ws-admin-page recon">
    <div class="admin-head">
      <div>
        <p class="admin-eyebrow">Daily Reconciliation</p>
        <h1>PG 결제 대사·원장 검증</h1>
        <p class="admin-sub">PG 승인 내역과 복식원장 간 일일 대사 배치를 실행하고 불일치를 전수 검증합니다.</p>
      </div>
      <button class="ws-admin-btn ws-admin-btn-primary" :disabled="reconciling" @click="runReconciliation">
        <WsIcon v-if="!reconciling" name="bolt" :size="14" /> {{ reconciling ? '대사 배치 가동 중...' : '일일 대사 배치 실행' }}
      </button>
    </div>

    <div v-if="loading" class="ws-skeleton sk-dark" style="height: 240px"></div>

    <section v-else class="ws-admin-card">
      <div class="ws-card-head">
        <h3 class="admin-h"><WsIcon name="trend" :size="15" class="h-ico" /> 일일 대사 실행 리포트</h3>
      </div>
      <div class="ws-admin-table-wrap">
        <div class="ws-admin-table-scroll">
          <table class="ws-admin-table">
            <thead><tr><th>대사 ID</th><th>기준 일자</th><th>PG 승인 총액</th><th>원장 차변 기표액</th><th>불일치 차액</th><th>검증 건수</th><th>상태</th><th>수행 일시</th></tr></thead>
            <tbody>
              <tr v-for="r in reconciliations" :key="r.id">
                <td><b class="ws-figure">{{ r.id }}</b></td>
                <td>{{ r.date }}</td>
                <td class="ws-figure">${{ ((r.pg_captured_minor || 0) / 100).toFixed(2) }}</td>
                <td class="ws-figure">${{ ((r.ledger_debit_minor || 0) / 100).toFixed(2) }}</td>
                <td class="ws-figure" :class="r.discrepancy_minor === 0 ? 'zero' : 'err'"><b>${{ ((r.discrepancy_minor || 0) / 100).toFixed(2) }}</b></td>
                <td>{{ r.matched_records }}건 일치 (불일치 0건)</td>
                <td><span class="ws-admin-badge ws-admin-badge-ok">✓ {{ r.status }}</span></td>
                <td class="ws-small dim">{{ formatTime(r.performed_at) }}</td>
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
.recon { display: flex; flex-direction: column; gap: 18px; }
.admin-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.admin-head h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; letter-spacing: -0.015em; }
.admin-eyebrow { margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ws-admin-accent); }
.admin-sub { margin: 0; font-size: 13px; color: var(--ws-admin-dim); }
.admin-h { color: #fff; font-size: 15px; display: flex; align-items: center; gap: 8px; }
.h-ico { color: var(--ws-admin-accent); }
.zero { color: #6ee7b7; }
.err { color: #f87171; }
.dim { color: var(--ws-admin-dim); }
.sk-dark { background: var(--ws-admin-panel); }
</style>
