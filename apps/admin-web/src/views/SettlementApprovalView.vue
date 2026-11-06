<template>
  <div class="ws-admin-page sod">
    <div class="admin-head">
      <div>
        <p class="admin-eyebrow">Dual Control</p>
        <h1>정산 지급 승인·이중 통제</h1>
        <p class="admin-sub">1차 심사관(Approver)과 2차 집행자(Disburser)의 직무 분리(SoD)를 강제합니다.</p>
      </div>
      <div class="role-switch-card">
        <span class="ws-small dim">현재 로그인 <b class="who">{{ currentUser.full_name }}</b> ({{ currentUser.role }})</span>
        <span class="ws-cluster" style="gap: 6px">
          <button class="ws-admin-btn" :class="{ on: currentUser.email === 'admin@wholesale.internal' }" @click="switchAccount('admin@wholesale.internal')">
            <WsIcon name="users" :size="13" /> 1차 심사관
          </button>
          <button class="ws-admin-btn" :class="{ on: currentUser.email === 'finance@wholesale.internal' }" @click="switchAccount('finance@wholesale.internal')">
            <WsIcon name="users" :size="13" /> 2차 집행관
          </button>
        </span>
      </div>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton sk-dark" style="height: 260px"></div>
    </div>

    <div v-else-if="error" class="admin-error">
      <WsIcon name="alert" :size="16" /> {{ error }}
    </div>

    <div v-else class="ws-stack">
      <section v-for="p in payouts" :key="p.id" class="ws-admin-card">
        <div class="ws-split">
          <div>
            <b class="p-id ws-figure">정산 #{{ p.id }}</b>
            <span class="ws-small"> · 수취 {{ p.supplier_name }} (Verified)</span>
          </div>
          <span class="ws-admin-badge" :class="p.status === 'PAYOUT_DISPATCHED' ? 'ws-admin-badge-info' : p.status === 'APPROVED_STAGE_1' ? 'ws-admin-badge-warn' : 'ws-admin-badge-ok'">{{ p.status }}</span>
        </div>
        <div class="amt-grid">
          <div><span>정산 총액</span><b class="ws-figure">${{ (p.gross_minor / 100).toFixed(2) }}</b></div>
          <div><span>수수료 (5%)</span><b class="ws-figure fee">-${{ (p.fee_minor / 100).toFixed(2) }}</b></div>
          <div><span>실 수령액</span><b class="ws-figure net">${{ (p.net_minor / 100).toFixed(2) }}</b></div>
          <div><span>수취 계좌</span><b class="ws-figure">{{ p.bank_account }}</b></div>
          <div><span>검수 상태</span><b class="pass">✓ 검수 합격·해제 적격</b></div>
        </div>

        <div class="sod-step">
          <div class="ws-split">
            <p class="ws-small"><span class="ws-admin-badge ws-admin-badge-idle">Step 1</span> <b>1차 재무 심사 승인</b></p>
          </div>
          <div v-if="p.status === 'APPROVED_STAGE_1' || p.status === 'PAYOUT_DISPATCHED' || p.first_approver_id">
            <span class="ws-admin-badge ws-admin-badge-ok">✓ 1차 승인 완료 · {{ p.first_approver_id || 'user-admin-001' }}</span>
          </div>
          <div v-else>
            <button class="ws-admin-btn ws-admin-btn-primary" :disabled="submitting" @click="approveStage1(p)">
              {{ submitting ? '승인 기록 중...' : '1차 정산 적격 승인' }}
            </button>
          </div>
        </div>

        <div class="sod-step" :class="{ disabled: p.status !== 'APPROVED_STAGE_1' && p.status !== 'PAYOUT_DISPATCHED' }">
          <p class="ws-small"><span class="ws-admin-badge ws-admin-badge-idle">Step 2</span> <b>2차 전신환(Wire) 이체 집행</b></p>
          <div v-if="p.status === 'PAYOUT_DISPATCHED'">
            <span class="ws-admin-badge ws-admin-badge-info">✓ 이체 집행 완료 (참조번호 발급됨)</span>
          </div>
          <div v-else>
            <button class="ws-admin-btn ws-admin-btn-primary" :disabled="submitting || p.status !== 'APPROVED_STAGE_1'" @click="executePayout(p)">
              {{ submitting ? '전신환 집행 중...' : '2차 최종 이체 집행' }}
            </button>
            <p class="ws-hint-dark">Dual Control 규칙: 1차 승인자와 2차 집행자가 일치하면 <code>409 SOD_VIOLATION</code>으로 차단됩니다.</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest, getCurrentUser, switchAdminUser } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const loading = ref(true);
const submitting = ref(false);
const error = ref('');
const payouts = ref<any[]>([]);
const currentUser = ref(getCurrentUser());

async function loadSettlements() {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiRequest('/settlements');
    payouts.value = res.settlements || [];
  } catch (err: any) {
    error.value = err.message || '정산 목록을 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
}

async function switchAccount(email: 'admin@wholesale.internal' | 'finance@wholesale.internal') {
  try {
    const u = await switchAdminUser(email);
    currentUser.value = u;
    alert(`계정이 전환되었습니다: ${u.full_name} (${u.role})`);
  } catch (err: any) {
    alert(`계정 전환 실패: ${err.message}`);
  }
}

async function approveStage1(p: any) {
  submitting.value = true;
  try {
    const res = await apiRequest(`/settlements/${p.id}/approve`, {
      method: 'POST',
    });
    p.status = res.status;
    p.first_approver_id = res.first_approver_id;
    alert(res.message || '1차 재무 적격 승인이 완료되었습니다.');
  } catch (err: any) {
    alert(`1차 승인 실패: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}

async function executePayout(p: any) {
  submitting.value = true;
  try {
    const res = await apiRequest(`/settlements/${p.id}/payout`, {
      method: 'POST',
    });
    p.status = res.status;
    alert(`[서버 이체 집행 완료]\n참조번호: ${res.bank_transfer_ref}\n집행자: ${res.dispatched_by}\n공급사 계좌로 ${p.currency} $${(res.net_minor / 100).toFixed(2)} 이체가 송금되었습니다.`);
  } catch (err: any) {
    alert(`2차 이체 집행 차단: ${err.message}\n상단의 [2차 집행관 (Treasury Director)] 계정으로 전환 후 다시 시도하십시오.`);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadSettlements();
});
</script>

<style scoped>
.sod { display: flex; flex-direction: column; gap: 18px; }
.admin-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.admin-head h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; letter-spacing: -0.015em; }
.admin-eyebrow { margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ws-admin-accent); }
.admin-sub { margin: 0; font-size: 13px; color: var(--ws-admin-dim); max-width: 60ch; }
.role-switch-card { background: var(--ws-admin-panel); border: 1px solid var(--ws-admin-line); border-radius: 10px; padding: 10px 14px; display: flex; flex-direction: column; gap: 8px; }
.dim { color: var(--ws-admin-dim); }
.who { color: var(--ws-admin-link); }
.ws-admin-btn.on { border-color: var(--ws-admin-link); color: var(--ws-admin-link); background: rgb(92 200 245 / 0.08); }
.admin-error { background: rgb(239 68 68 / 0.12); border: 1px solid rgb(239 68 68 / 0.4); color: #fca5a5; border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 600; display: flex; gap: 8px; align-items: center; }
.p-id { color: var(--ws-admin-link); font-size: 15px; }
.amt-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; background: var(--ws-admin-panel-2); border: 1px solid var(--ws-admin-line); border-radius: 8px; padding: 12px 14px; margin-top: 14px; }
.amt-grid div { display: flex; flex-direction: column; gap: 2px; }
.amt-grid span { font-size: 11px; color: var(--ws-admin-dim); font-weight: 700; }
.amt-grid b { font-size: 14px; }
.fee { color: #fca5a5; }
.net { color: #6ee7b7; }
.pass { color: #6ee7b7; font-size: 12px; }
.sod-step { margin-top: 14px; border-top: 1px solid var(--ws-admin-line); padding-top: 14px; }
.sod-step > p { margin: 0 0 10px; }
.sod-step.disabled { opacity: 0.55; }
.ws-hint-dark { font-size: 11px; color: var(--ws-admin-dim); margin: 8px 0 0; }
.sk-dark { background: var(--ws-admin-panel); }
@media (max-width: 900px) {
  .amt-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
