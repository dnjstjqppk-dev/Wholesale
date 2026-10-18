<template>
  <div class="ledger-card" :class="{ balanced: isBalanced, unbalanced: !isBalanced }">
    <div class="card-header">
      <span class="title">복식부기 전표 요약 (Journal #{{ journalNumber }})</span>
      <span class="balance-badge" :class="{ ok: isBalanced, err: !isBalanced }">
        {{ isBalanced ? '차대변 일치 (BALANCED)' : '차대변 불일치 (UNBALANCED)' }}
      </span>
    </div>
    <div class="ledger-table">
      <div class="row header-row">
        <span>계정과목 / 적요</span>
        <span class="num">차변 (Debit)</span>
        <span class="num">대변 (Credit)</span>
      </div>
      <div v-for="(entry, idx) in entries" :key="idx" class="row">
        <span>{{ entry.memo || entry.accountName }}</span>
        <span class="num">{{ formatAmount(entry.debitMinor) }}</span>
        <span class="num">{{ formatAmount(entry.creditMinor) }}</span>
      </div>
      <div class="row total-row">
        <span>합계</span>
        <span class="num bold">{{ formatAmount(totalDebit) }}</span>
        <span class="num bold">{{ formatAmount(totalCredit) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface LedgerEntryProp {
  accountName?: string;
  memo?: string;
  debitMinor: number;
  creditMinor: number;
}

const props = defineProps<{
  journalNumber: string;
  currency: string;
  entries: LedgerEntryProp[];
}>();

const totalDebit = computed(() => props.entries.reduce((sum, e) => sum + e.debitMinor, 0));
const totalCredit = computed(() => props.entries.reduce((sum, e) => sum + e.creditMinor, 0));
const isBalanced = computed(() => totalDebit.value === totalCredit.value);

function formatAmount(minor: number): string {
  if (minor === 0) return '-';
  const val = (minor / 100).toFixed(2);
  return `${props.currency} ${val}`;
}
</script>

<style scoped>
.ledger-card {
  border: 1px solid #D8E0EB;
  border-radius: 8px;
  background-color: #FFFFFF;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.title {
  font-weight: 700;
  font-size: 14px;
  color: #172B4D;
}
.balance-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
}
.balance-badge.ok { background-color: #DCFCE7; color: #15803D; }
.balance-badge.err { background-color: #FEE2E2; color: #B91C1C; }
.ledger-table { display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
.row { display: grid; grid-template-columns: 2fr 1fr 1fr; padding: 4px 0; }
.header-row { font-weight: 600; color: #42526E; border-bottom: 1px solid #E2E8F0; }
.total-row { border-top: 1px solid #172B4D; font-weight: 700; color: #172B4D; padding-top: 6px; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
</style>
