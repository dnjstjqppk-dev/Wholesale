<template>
  <div class="ws-page">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Settlement</p>
      <h1 class="ws-page-title">정산 원장·출금 신청</h1>
      <p class="ws-page-sub">에스크로 보호 기간 종료·바이어 검수 합격 후 출금 가능한 정산 대금입니다.</p>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton" style="height: 110px"></div>
      <div class="ws-skeleton" style="height: 200px"></div>
    </div>

    <div v-else-if="error" class="ws-banner ws-banner-danger">
      <WsIcon name="alert" :size="16" />
      <span>{{ error }}</span>
    </div>

    <div v-else class="ws-stack">
      <div class="ws-grid-3">
        <div class="ws-stat">
          <p class="ws-stat-label">지급 대기 잔액 (Pending)</p>
          <p class="ws-stat-value">$0.00</p>
          <p class="ws-stat-foot">검수 합격 후 해제 예정</p>
        </div>
        <div class="ws-stat eligible">
          <p class="ws-stat-label">출금 가능 잔액</p>
          <p class="ws-stat-value">${{ totalEligibleNet }}</p>
          <button class="ws-btn ws-btn-accent ws-btn-sm ws-btn-block" style="margin-top: 10px" :disabled="submitting || parseFloat(totalEligibleNet) <= 0" @click="requestPayout">
            {{ submitting ? '신청 중...' : '공식 출금 신청' }}
          </button>
        </div>
        <div class="ws-stat">
          <p class="ws-stat-label">분쟁 동결 금액</p>
          <p class="ws-stat-value held">$0.00</p>
          <p class="ws-stat-foot">현재 진행 중 분쟁 없음</p>
        </div>
      </div>

      <section class="ws-card ws-card-pad-sm">
        <div class="ws-card-head"><h3>정산 전표 내역</h3></div>
        <div class="ws-table-wrap">
          <div class="ws-table-scroll">
            <table class="ws-table">
              <thead><tr><th>정산 ID</th><th>주문번호</th><th class="ws-num">거래 총액</th><th class="ws-num">수수료 5%</th><th class="ws-num">정산 지급액</th><th>검수</th><th>정산 상태</th></tr></thead>
              <tbody>
                <tr v-for="rec in records" :key="rec.id">
                  <td class="ws-cell-sub ws-figure">{{ rec.id }}</td>
                  <td class="ws-cell-main ws-figure">{{ rec.order_number }}</td>
                  <td class="ws-num ws-figure">${{ (rec.gross_minor / 100).toFixed(2) }}</td>
                  <td class="ws-num ws-figure fee">-${{ (rec.fee_minor / 100).toFixed(2) }}</td>
                  <td class="ws-num"><b class="ws-figure">${{ (rec.net_minor / 100).toFixed(2) }}</b></td>
                  <td><span class="ws-badge ws-badge-success">✓ 합격</span></td>
                  <td><span class="ws-badge" :class="rec.status === 'RELEASE_ELIGIBLE' ? 'ws-badge-success' : rec.status === 'HELD' ? 'ws-badge-warning' : 'ws-badge-info'">{{ rec.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

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
    if (res.bank_transfer_ref) {
      alert(`[서버 출금 집행 완료]\n전신환 참조번호: ${res.bank_transfer_ref}\n지정 은행 계좌로 지급되었습니다.`);
    } else {
      alert(`[서버 출금 신청 접수 완료]\n${res.message || '플랫폼 본사 재무팀의 이중 승인(Dual Control) 후 지정 은행 계좌로 지급됩니다.'}`);
    }
  } catch (err: any) {
    alert(`출금 신청 실패: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.eligible { border-color: var(--ws-success); }
.eligible .ws-stat-value { color: var(--ws-success); }
.ws-stat-value.held { color: var(--ws-danger); }
.fee { color: var(--ws-danger); }
</style>
