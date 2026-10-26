<template>
  <div class="settlement-page">
    <h2>공급사 정산 원장 및 출금 신청 (Settlement & Payouts)</h2>
    <p class="subtitle">에스크로 보호 기간 종료 및 바이어 검수 합격 후 출금 가능한 정산 대금입니다.</p>

    <div v-if="loading" class="loading-state">
      정산 원장 데이터를 API 서버에서 조회 중입니다...
    </div>

    <div v-else-if="error" class="error-banner">
      ⚠️ {{ error }}
    </div>

    <div v-else class="content-box">
      <!-- Balance Banner -->
      <div class="balance-cards">
        <div class="b-card">
          <span class="lbl">지급 대기 잔액 (Pending Escrow)</span>
          <span class="val">$0.00</span>
          <span class="sub">검수 합격 후 해제 예정</span>
        </div>
        <div class="b-card eligible">
          <span class="lbl">출금 가능 잔액 (Release Eligible)</span>
          <span class="val highlight">${{ totalEligibleNet }}</span>
          <button class="btn-payout" :disabled="submitting || parseFloat(totalEligibleNet) <= 0" @click="requestPayout">
            {{ submitting ? '신청 중...' : '공식 출금 신청 (Disburse)' }}
          </button>
        </div>
        <div class="b-card held">
          <span class="lbl">분쟁 동결 금액 (Dispute Hold)</span>
          <span class="val danger">$0.00</span>
          <span class="sub">현재 진행 중 분쟁 없음</span>
        </div>
      </div>

      <!-- Settlement Records Table -->
      <div class="records-box">
        <h3>정산 전표 내역 (Settlement Journals)</h3>
        <table class="settlement-table">
          <thead>
            <tr>
              <th>정산 ID</th>
              <th>주문번호</th>
              <th>거래 총액</th>
              <th>플랫폼 수수료(5%)</th>
              <th>정산 지급액</th>
              <th>검수 상태</th>
              <th>정산 상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rec in records" :key="rec.id">
              <td>{{ rec.id }}</td>
              <td class="ord-col">{{ rec.order_number }}</td>
              <td class="num">${{ (rec.gross_minor / 100).toFixed(2) }}</td>
              <td class="num fee">-${{ (rec.fee_minor / 100).toFixed(2) }}</td>
              <td class="num bold">${{ (rec.net_minor / 100).toFixed(2) }}</td>
              <td><span class="tag-pass">✓ 합격</span></td>
              <td><span class="tag-status" :class="rec.status.toLowerCase()">{{ rec.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { apiRequest } from '../api';

const loading = ref(true);
const submitting = ref(false);
const error = ref('');
const records = ref<any[]>([]);

const totalEligibleNet = computed(() => {
  const sum = records.value
    .filter(r => r.status === 'RELEASE_ELIGIBLE')
    .reduce((acc, r) => acc + r.net_minor, 0);
  return (sum / 100).toFixed(2);
});

async function loadSettlements() {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiRequest('/settlements');
    records.value = res.settlements || [];
  } catch (err: any) {
    error.value = err.message || '정산 원장 로드 실패';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadSettlements();
});

async function requestPayout() {
  if (records.value.length === 0) return;
  const target = records.value.find(r => r.status === 'RELEASE_ELIGIBLE') || records.value[0];

  submitting.value = true;
  try {
    const res = await apiRequest(`/settlements/${target.id}/payout`, {
      method: 'POST',
    });
    target.status = res.status;
    alert(`[서버 출금 신청 접수 완료]\n전신환 참조번호: ${res.bank_transfer_ref}\n플랫폼 본사 재무팀의 이중 승인(Dual Control) 후 지정 은행 계좌로 지급됩니다.`);
  } catch (err: any) {
    alert(`출금 신청 실패: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.settlement-page { max-width: 1000px; margin: 0 auto; }
h2 { margin: 0 0 6px 0; font-size: 20px; color: #172B4D; }
.subtitle { color: #64748B; font-size: 13px; margin-bottom: 24px; }
.loading-state { padding: 40px; text-align: center; color: #64748B; }
.error-banner { background: #FEF2F2; color: #B91C1C; padding: 12px; border-radius: 6px; margin-bottom: 20px; }
.balance-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
.b-card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 20px; display: flex; flex-direction: column; }
.b-card .lbl { font-size: 12px; color: #64748B; margin-bottom: 8px; }
.b-card .val { font-size: 24px; font-weight: 800; color: #172B4D; font-variant-numeric: tabular-nums; }
.b-card .val.highlight { color: #15803D; }
.b-card .val.danger { color: #DC2626; }
.b-card .sub { font-size: 11px; color: #94A3B8; margin-top: 6px; }
.btn-payout { margin-top: 12px; background: #C2410C; color: #FFF; border: none; padding: 8px 14px; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 13px; }
.btn-payout:disabled { background: #CBD5E1; cursor: not-allowed; }
.records-box { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 24px; }
.records-box h3 { margin: 0 0 16px 0; font-size: 16px; color: #172B4D; }
.settlement-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.settlement-table th, .settlement-table td { border-bottom: 1px solid #F1F5F9; padding: 10px 12px; text-align: left; }
.settlement-table th { background: #F8FAFC; color: #42526E; font-weight: 600; }
.ord-col { font-weight: 600; color: #172B4D; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.num.fee { color: #DC2626; }
.num.bold { font-weight: 700; color: #172B4D; }
.tag-pass { background: #DCFCE7; color: #15803D; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.tag-status { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
.tag-status.release_eligible { background: #DCFCE7; color: #15803D; }
.tag-status.payout_dispatched { background: #DBEAFE; color: #1E40AF; }
.tag-status.held { background: #FEF3C7; color: #B45309; }

@media (max-width: 768px) {
  .balance-cards { grid-template-columns: 1fr; gap: 12px; }
  .records-box { padding: 16px; }
  .settlement-table { display: block; overflow-x: auto; }
}
</style>
