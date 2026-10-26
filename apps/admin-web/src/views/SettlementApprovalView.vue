<template>
  <div class="settlement-approval-page">
    <div class="head-row">
      <div>
        <h2>정산 지급 승인 및 이중 통제 (Dual Control Payouts)</h2>
        <p class="subtitle">금융 사고 방지를 위해 정산 1차 심사관(Approver)과 2차 자금 이체 집행자(Disburser)의 직무 분리(SoD)를 강제합니다.</p>
      </div>

      <!-- Quick Admin Role Switcher for Dual Control Testing -->
      <div class="admin-switcher-box">
        <span class="curr-user">현재 로그인: <strong>{{ currentUser.full_name }}</strong> ({{ currentUser.role }})</span>
        <div class="switch-btns">
          <button
            class="btn-sw"
            :class="{ active: currentUser.email === 'admin@wholesale.internal' }"
            @click="switchAccount('admin@wholesale.internal')"
          >
            👤 1차 심사관 (Super Admin)
          </button>
          <button
            class="btn-sw finance"
            :class="{ active: currentUser.email === 'finance@wholesale.internal' }"
            @click="switchAccount('finance@wholesale.internal')"
          >
            💼 2차 집행관 (Treasury Director)
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      정산 승인 대기열 데이터를 API 서버에서 조회 중입니다...
    </div>

    <div v-else-if="error" class="error-banner">
      ⚠️ {{ error }}
    </div>

    <div v-else class="payout-list">
      <div v-for="p in payouts" :key="p.id" class="p-card">
        <div class="card-head">
          <div>
            <span class="p-id">정산 번호 #{{ p.id }}</span>
            <span class="supplier">수취 기업: {{ p.supplier_name }} (Verified Manufacturer)</span>
          </div>
          <span class="badge" :class="p.status.toLowerCase()">{{ p.status }}</span>
        </div>

        <div class="details-grid">
          <div><span>정산 총액:</span> <strong class="amount">${{ (p.gross_minor / 100).toFixed(2) }}</strong></div>
          <div><span>수수료 (5%):</span> <strong>-${{ (p.fee_minor / 100).toFixed(2) }}</strong></div>
          <div><span>실 수령액:</span> <strong class="amount net">${{ (p.net_minor / 100).toFixed(2) }}</strong></div>
          <div><span>수취 계좌:</span> <strong>{{ p.bank_account }}</strong></div>
          <div><span>검수 상태:</span> <span class="tag-ok">✓ 바이어 검수 합격 및 에스크로 해제 적격</span></div>
        </div>

        <!-- SoD Step 1: Approve -->
        <div class="step-box">
          <div class="step-head">
            <span class="step-num">Step 1</span>
            <h4>1차 재무 심사 승인 (POST /v1/settlements/:id/approve)</h4>
          </div>
          <div v-if="p.status === 'APPROVED_STAGE_1' || p.status === 'PAYOUT_DISPATCHED' || p.first_approver_id">
            <span class="approved-tag">✓ 1차 승인 완료 (승인자: {{ p.first_approver_id || 'user-admin-001' }})</span>
          </div>
          <div v-else>
            <button class="btn-step" :disabled="submitting" @click="approveStage1(p)">
              {{ submitting ? '승인 기록 중...' : '1차 정산 적격 승인 (Stage 1)' }}
            </button>
          </div>
        </div>

        <!-- SoD Step 2: Execute Disburse -->
        <div class="step-box" :class="{ disabled: p.status !== 'APPROVED_STAGE_1' && p.status !== 'PAYOUT_DISPATCHED' }">
          <div class="step-head">
            <span class="step-num">Step 2</span>
            <h4>2차 전신환(Wire) 이체 집행 (POST /v1/settlements/:id/payout)</h4>
          </div>
          <div v-if="p.status === 'PAYOUT_DISPATCHED'">
            <span class="paid-tag">✓ 전신환(Wire) 이체 집행 완료 (참조번호 발급됨)</span>
          </div>
          <div v-else>
            <button class="btn-step execute" :disabled="submitting || p.status !== 'APPROVED_STAGE_1'" @click="executePayout(p)">
              {{ submitting ? '전신환 집행 중...' : '2차 최종 전신환(Wire) 이체 집행' }}
            </button>
            <p class="sod-note">
              ※ Dual Control 직무 분리 규칙: 1차 승인자 ID와 2차 집행자 ID가 일치할 경우 백엔드가 `409 SOD_VIOLATION`으로 차단합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest, getCurrentUser, switchAdminUser } from '../api';

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
.settlement-approval-page { max-width: 1040px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.head-row { display: flex; justify-content: space-between; align-items: flex-start; }
h2 { margin: 0 0 4px 0; font-size: 20px; color: #F8FAFC; }
.subtitle { color: #94A3B8; font-size: 13px; margin: 0; max-width: 600px; }

.admin-switcher-box { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 10px 14px; display: flex; flex-direction: column; gap: 6px; }
.curr-user { font-size: 11px; color: #94A3B8; }
.curr-user strong { color: #38BDF8; }
.switch-btns { display: flex; gap: 6px; }
.btn-sw { background: #0B132B; border: 1px solid #3A506B; color: #E2E8F0; padding: 6px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; }
.btn-sw.active { border-color: #38BDF8; color: #38BDF8; background: rgba(56,189,248,0.1); }

.loading-state { padding: 40px; text-align: center; color: #94A3B8; }
.error-banner { background: #7F1D1D; color: #FECACA; padding: 12px; border-radius: 6px; }
.payout-list { display: flex; flex-direction: column; gap: 20px; }
.p-card { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 22px; }
.card-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2B3A55; padding-bottom: 12px; margin-bottom: 14px; }
.p-id { font-weight: 700; color: #38BDF8; font-size: 15px; margin-right: 12px; }
.supplier { font-size: 13px; color: #E2E8F0; }
.badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; }
.badge.release_eligible { background: #065F46; color: #A7F3D0; }
.badge.approved_stage_1 { background: #854D0E; color: #FEF08A; }
.badge.payout_dispatched { background: #1E3A8A; color: #93C5FD; }

.details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 13px; background: #0B132B; padding: 14px; border-radius: 6px; margin-bottom: 16px; border: 1px solid #2B3A55; }
.details-grid span { color: #94A3B8; }
.details-grid strong { color: #FFF; }
.amount.net { color: #10B981; }
.tag-ok { color: #10B981; font-weight: 700; font-size: 12px; }

.step-box { background: #152238; border: 1px solid #2B3A55; border-radius: 6px; padding: 14px; margin-bottom: 12px; }
.step-box.disabled { opacity: 0.5; }
.step-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.step-num { background: #3B82F6; color: #FFF; font-size: 11px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
.step-head h4 { margin: 0; font-size: 14px; color: #FFF; }
.approved-tag { color: #10B981; font-weight: 700; font-size: 13px; }
.paid-tag { color: #38BDF8; font-weight: 700; font-size: 13px; }
.btn-step { background: #D97706; color: #FFF; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 700; cursor: pointer; }
.btn-step.execute { background: #059669; }
.sod-note { color: #94A3B8; font-size: 11px; margin: 8px 0 0 0; }

@media (max-width: 768px) {
  .head-row { flex-direction: column; gap: 14px; }
  .card-head { flex-direction: column; align-items: flex-start; gap: 8px; }
  .details-grid { grid-template-columns: 1fr; gap: 8px; }
  .switch-btns { flex-wrap: wrap; }
}
</style>
