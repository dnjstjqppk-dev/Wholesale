<template>
  <div class="ledger-audit-page">
    <h2>복식부기 회계 원장 감사 (Double-Entry Ledger Audit)</h2>
    <p class="subtitle">모든 거래는 차변(Debit)=대변(Credit) 일치 전표로 영구 보존되며, 정정은 역분개로만 처리됩니다.</p>

    <div class="journals-list">
      <div v-for="j in journals" :key="j.id" class="journal-card">
        <div class="j-head">
          <div>
            <span class="j-num">{{ j.journal_number }}</span>
            <span class="j-type">{{ j.event_type }}</span>
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
            <tr v-for="(e, idx) in j.entries" :key="idx">
              <td>{{ e.account_name }}</td>
              <td class="num">{{ formatCurrency(e.debit_minor, j.currency) }}</td>
              <td class="num">{{ formatCurrency(e.credit_minor, j.currency) }}</td>
            </tr>
            <tr class="total-row">
              <td>합계 (Total)</td>
              <td class="num bold">{{ formatCurrency(j.total_debit, j.currency) }}</td>
              <td class="num bold">{{ formatCurrency(j.total_credit, j.currency) }}</td>
            </tr>
          </tbody>
        </table>

        <div v-if="!j.is_reversed" class="j-footer">
          <button class="btn-reversal" @click="createReversal(j)">
            ⟲ 정정 역분개 전표 발행 (Issue Reversal Journal)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const journals = ref([
  {
    id: 'j-001',
    journal_number: 'JRN-20261018-001',
    event_type: 'PAYMENT_CAPTURE',
    currency: 'USD',
    created_at: '2026-10-18 14:30 UTC',
    is_balanced: true,
    is_reversed: false,
    total_debit: 144000,
    total_credit: 144000,
    entries: [
      { account_name: '1010 자산: PG 정산 대기금 (PG Clearing)', debit_minor: 144000, credit_minor: 0 },
      { account_name: '2010 부채: 에스크로 보관 예수금 (Escrow Liability)', debit_minor: 0, credit_minor: 144000 },
    ],
  },
  {
    id: 'j-002',
    journal_number: 'JRN-20261018-002',
    event_type: 'SETTLEMENT_RELEASE',
    currency: 'USD',
    created_at: '2026-10-18 15:10 UTC',
    is_balanced: true,
    is_reversed: false,
    total_debit: 1000000,
    total_credit: 1000000,
    entries: [
      { account_name: '2010 부채: 에스크로 보관 예수금 (Release Escrow)', debit_minor: 1000000, credit_minor: 0 },
      { account_name: '4010 수익: 플랫폼 중개 수수료 수익 (5% Platform Fee)', debit_minor: 0, credit_minor: 50000 },
      { account_name: '2020 부채: 공급사 미지급 정산금 (Supplier Payable)', debit_minor: 0, credit_minor: 950000 },
    ],
  },
]);

function formatCurrency(minor: number, curr: string): string {
  if (minor === 0) return '-';
  return `${curr} $${(minor / 100).toFixed(2)}`;
}

function createReversal(j: any) {
  j.is_reversed = true;
  alert(`역분개 전표가 생성되었습니다: JRN-REV-${j.journal_number}\n차변과 대변이 반대 방향으로 상계 기장되었습니다.`);
}
</script>

<style scoped>
.ledger-audit-page { max-width: 1000px; margin: 0 auto; }
h2 { margin: 0 0 6px 0; font-size: 20px; color: #F8FAFC; }
.subtitle { color: #94A3B8; font-size: 13px; margin-bottom: 24px; }
.journals-list { display: flex; flex-direction: column; gap: 24px; }
.journal-card { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 20px; }
.j-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid #3A506B; padding-bottom: 12px; }
.j-num { font-weight: 700; color: #38BDF8; font-size: 15px; margin-right: 12px; }
.j-type { background: #0B132B; color: #E2E8F0; font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-right: 8px; }
.j-date { font-size: 12px; color: #94A3B8; }
.balance-indicator { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; }
.balance-indicator.balanced { background: #065F46; color: #A7F3D0; }
.entries-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; }
.entries-table th, .entries-table td { border-bottom: 1px solid #3A506B; padding: 8px 12px; text-align: left; }
.entries-table th { background: #0B132B; color: #94A3B8; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.total-row { border-top: 2px solid #38BDF8; font-weight: 700; color: #FFF; }
.bold { font-weight: 700; }
.j-footer { display: flex; justify-content: flex-end; }
.btn-reversal { background: #334155; border: 1px solid #475569; color: #F8FAFC; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; }
</style>
