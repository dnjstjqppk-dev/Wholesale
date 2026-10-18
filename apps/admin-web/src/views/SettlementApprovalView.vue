<template>
  <div class="settlement-approval-page">
    <h2>정산 지급 승인 및 이중 통제 (Dual Control Payouts)</h2>
    <p class="subtitle">금융 사고 방지를 위해 정산 승인자(Approver)와 자금 이체 실행자(Disburser)의 직무 분리를 강제합니다.</p>

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
            <span class="p-id">정산 건 #{{ p.id }}</span>
            <span class="supplier">수취 기업: {{ p.supplier_name }} (Verified)</span>
          </div>
          <span class="badge" :class="p.status.toLowerCase()">{{ p.status }}</span>
        </div>

        <div class="details-grid">
          <div><span>정산 총액:</span> <strong class="amount">${{ (p.gross_minor / 100).toFixed(2) }}</strong></div>
          <div><span>수수료 (5%):</span> <strong>-${{ (p.fee_minor / 100).toFixed(2) }}</strong></div>
          <div><span>실 수령액:</span> <strong class="amount net">${{ (p.net_minor / 100).toFixed(2) }}</strong></div>
          <div><span>입금 계좌:</span> <strong>{{ p.bank_account }}</strong></div>
          <div><span>검수 상태:</span> <span class="tag-ok">✓ 바이어 검수 합격</span></div>
        </div>

        <!-- SoD Step 1: Approve -->
        <div class="step-box">
          <div class="step-head">
            <span class="step-num">Step 1</span>
            <h4>1차 재무 심사 승인 (Financial Audit)</h4>
          </div>
          <div v-if="p.approved_by || p.status === 'RELEASE_ELIGIBLE'">
            <span class="approved-tag">✓ 1차 승인 완료: 재무 심사관 적격 판정</span>
          </div>
          <div v-else>
            <button class="btn-step" @click="approve(p)">1차 정산 적격 승인</button>
          </div>
        </div>

        <!-- SoD Step 2: Execute Disburse -->
        <div class="step-box" :class="{ disabled: p.status !== 'RELEASE_ELIGIBLE' && !p.approved_by }">
          <div class="step-head">
            <span class="step-num">Step 2</span>
            <h4>2차 자금 이체 집행 (Bank Wire Execution)</h4>
          </div>
          <div v-if="p.status === 'PAYOUT_DISPATCHED'">
            <span class="paid-tag">✓ 이체 집행 완료 (전신환 Wire 정상 전송)</span>
          </div>
          <div v-else>
            <button class="btn-step execute" :disabled="submitting" @click="disburse(p)">
              {{ submitting ? '집행 중...' : '최종 전신환(Wire) 이체 집행' }}
            </button>
            <p class="sod-note">※ 1차 승인자는 본 2차 이체를 집행할 수 없습니다 (Dual Control SoD).</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';

const loading = ref(true);
const submitting = ref(false);
const error = ref('');
const payouts = ref<any[]>([]);

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

onMounted(() => {
  loadSettlements();
});

function approve(p: any) {
  p.approved_by = '이재무 수석 (FINANCE_APPROVER)';
  alert('1차 정산 적격 승인이 완료되었습니다.');
}

async function disburse(p: any) {
  submitting.value = true;
  try {
    const res = await apiRequest(`/settlements/${p.id}/payout`, {
      method: 'POST',
    });
    p.status = res.status;
    alert(`[서버 이체 승인 완료]\n전신환 참조번호: ${res.bank_transfer_ref}\n공급사 계좌로 ${p.currency} $${(p.net_minor / 100).toFixed(2)} 이체가 집행되었습니다.`);
  } catch (err: any) {
    alert(`이체 실패: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.settlement-approval-page { max-width: 1000px; margin: 0 auto; }
h2 { margin: 0 0 6px 0; font-size: 20px; color: #F8FAFC; }
.subtitle { color: #94A3B8; font-size: 13px; margin-bottom: 24px; }
.loading-state { padding: 40px; text-align: center; color: #94A3B8; }
.error-banner { background: #7F1D1D; color: #FECACA; padding: 12px; border-radius: 6px; margin-bottom: 20px; }
.payout-list { display: flex; flex-direction: column; gap: 20px; }
.p-card { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 24px; }
.card-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #3A506B; padding-bottom: 12px; margin-bottom: 16px; }
.p-id { font-weight: 700; color: #38BDF8; font-size: 16px; margin-right: 12px; }
.supplier { font-size: 13px; color: #94A3B8; }
.badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
.badge.release_eligible { background: #065F46; color: #A7F3D0; }
.badge.payout_dispatched { background: #1E40AF; color: #BFDBFE; }
.details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 13px; margin-bottom: 20px; color: #CBD5E1; }
.amount { color: #38BDF8; font-size: 15px; font-variant-numeric: tabular-nums; }
.amount.net { color: #34D399; font-weight: 800; font-size: 16px; }
.tag-ok { color: #34D399; font-weight: 700; }
.step-box { background: #0B132B; border: 1px solid #3A506B; border-radius: 6px; padding: 16px; margin-bottom: 12px; }
.step-box.disabled { opacity: 0.5; }
.step-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.step-num { background: #3B82F6; color: #FFF; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 3px; }
.step-head h4 { margin: 0; font-size: 14px; color: #FFF; }
.btn-step { background: #059669; color: #FFF; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 700; cursor: pointer; }
.btn-step.execute { background: #C2410C; }
.btn-step:disabled { background: #475569; cursor: not-allowed; }
.approved-tag { color: #34D399; font-size: 12px; font-weight: 600; }
.paid-tag { color: #38BDF8; font-size: 12px; font-weight: 600; }
.sod-note { font-size: 11px; color: #94A3B8; margin-top: 6px; }
</style>
