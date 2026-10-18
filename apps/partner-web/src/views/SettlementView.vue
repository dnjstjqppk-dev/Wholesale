<template>
  <div class="settlement-page">
    <h2>공급사 정산 원장 및 출금 신청 (Settlement & Payouts)</h2>
    <p class="subtitle">에스크로 보호 기간 종료 및 바이어 검수 합격 후 출금 가능한 정산 대금입니다.</p>

    <!-- Balance Banner -->
    <div class="balance-cards">
      <div class="b-card">
        <span class="lbl">지급 대기 잔액 (Pending Escrow)</span>
        <span class="val">$4,560.00</span>
        <span class="sub">검수 합격 후 해제 예정</span>
      </div>
      <div class="b-card eligible">
        <span class="lbl">출금 가능 잔액 (Release Eligible)</span>
        <span class="val highlight">$9,500.00</span>
        <button class="btn-payout" @click="requestPayout">공식 출금 신청 (Disburse)</button>
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
            <td class="ord-col">{{ rec.order_number }}</td>
            <td class="num">${{ rec.gross }}</td>
            <td class="num fee">-${{ rec.fee }}</td>
            <td class="num bold">${{ rec.net }}</td>
            <td><span class="tag-pass">✓ 합격</span></td>
            <td><span class="tag-status" :class="rec.status.toLowerCase()">{{ rec.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const records = ref([
  {
    id: 'set-001',
    order_number: 'ORD-2026-0001',
    gross: '10,000.00',
    fee: '500.00',
    net: '9,500.00',
    status: 'RELEASE_ELIGIBLE',
  },
  {
    id: 'set-002',
    order_number: 'ORD-2026-0002',
    gross: '4,800.00',
    fee: '240.00',
    net: '4,560.00',
    status: 'HELD',
  },
]);

function requestPayout() {
  alert('출금 신청이 접수되었습니다. 플랫폼 본사 재무팀의 이중 승인(Dual Control) 후 지정 은행 계좌로 지급됩니다.');
}
</script>

<style scoped>
.settlement-page { max-width: 1000px; margin: 0 auto; }
h2 { margin: 0 0 6px 0; font-size: 20px; color: #172B4D; }
.subtitle { color: #64748B; font-size: 13px; margin-bottom: 24px; }
.balance-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
.b-card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 20px; display: flex; flex-direction: column; }
.b-card .lbl { font-size: 12px; color: #64748B; margin-bottom: 8px; }
.b-card .val { font-size: 24px; font-weight: 800; color: #172B4D; font-variant-numeric: tabular-nums; }
.b-card .val.highlight { color: #15803D; }
.b-card .val.danger { color: #DC2626; }
.b-card .sub { font-size: 11px; color: #94A3B8; margin-top: 6px; }
.btn-payout { margin-top: 12px; background: #C2410C; color: #FFF; border: none; padding: 8px 14px; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 13px; }
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
.tag-status.held { background: #FEF3C7; color: #B45309; }
</style>

