<template>
  <div class="contract-sign-page">
    <div class="card">
      <div class="contract-header">
        <h2>국제 B2B 도매 거래 표준 계약서 (Trade Contract)</h2>
        <span class="contract-no">계약번호: {{ contract.contract_number }}</span>
      </div>

      <div class="contract-body">
        <div class="section">
          <h4>1. 계약 당사자</h4>
          <p><strong>구매사 (Buyer):</strong> Metro Wholesale Imports LLC (미국)</p>
          <p><strong>공급사 (Supplier):</strong> Precision Korea (대한민국, Verified)</p>
        </div>

        <div class="section">
          <h4>2. 무역 인도 조건 (Incoterms® 2020 필수)</h4>
          <p><strong>조건:</strong> FOB Busan Port, South Korea (Incoterms 2020)</p>
          <p><strong>표준 납기:</strong> 계약 체결 및 계약금 납입 후 14일 이내 선적</p>
        </div>

        <div class="section">
          <h4>3. 거래 대금 및 분할 결제 일정 (Payment Schedule)</h4>
          <table class="schedule-table">
            <thead>
              <tr><th>구분</th><th>비율</th><th>금액 (USD)</th><th>지급 조건</th></tr>
            </thead>
            <tbody>
              <tr><td>계약금 (Down Payment)</td><td>30%</td><td>$1,440.00</td><td>계약 체결 직후 (생산 착수금)</td></tr>
              <tr><td>잔금 (Balance)</td><td>70%</td><td>$3,360.00</td><td>검수 합격 및 B/L 선적 확인 후</td></tr>
            </tbody>
          </table>
        </div>

        <div class="section integrity-section">
          <h4>4. 무역 계약서 데이터 무결성 검증 (Cryptographic Integrity)</h4>
          <div class="hash-box">
            <span class="lbl">SHA-256 Document Hash:</span>
            <code>{{ contract.document_hash }}</code>
          </div>
          <p class="hash-note">※ 전자서명 완료 후 계약서 본문 및 조건 변조는 원천 차단됩니다.</p>
        </div>
      </div>

      <div class="signatures">
        <div class="sig-box">
          <span>구매사 서명:</span>
          <strong v-if="contract.buyer_signed">✓ 서명 완료 (2026-10-18 UTC)</strong>
          <button v-else class="btn-sign" @click="handleSignBuyer">구매사 전자 서명</button>
        </div>
        <div class="sig-box">
          <span>공급사 서명:</span>
          <strong>✓ 서명 완료 (공급사 기서명)</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const contract = ref({
  contract_number: 'CTR-2026-0001',
  document_hash: '9f833777d9498425d978a3c8e5473724c96576d4df43a3db18e27c1f8a8dc4e5',
  buyer_signed: false,
});

function handleSignBuyer() {
  contract.value.buyer_signed = true;
  alert('구매사 전자서명이 SHA-256 해시 검증을 통과하여 완료되었습니다.\n계약금(30%) 결제 단계로 이동합니다.');
  router.push('/ko/KRW/orders');
}
</script>

<style scoped>
.contract-sign-page { max-width: 900px; margin: 0 auto; }
.card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.contract-header { border-bottom: 2px solid #172B4D; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: baseline; }
.contract-header h2 { margin: 0; font-size: 20px; color: #172B4D; }
.contract-no { font-size: 13px; color: #64748B; font-weight: 600; }
.section { margin-bottom: 24px; font-size: 14px; }
.section h4 { margin: 0 0 8px 0; font-size: 14px; color: #172B4D; }
.section p { margin: 4px 0; color: #42526E; }
.schedule-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
.schedule-table th, .schedule-table td { border: 1px solid #D8E0EB; padding: 8px 12px; text-align: left; }
.schedule-table th { background: #F8FAFC; color: #172B4D; }
.integrity-section { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; }
.hash-box { display: flex; flex-direction: column; gap: 4px; }
.hash-box .lbl { font-size: 12px; font-weight: 700; color: #42526E; }
.hash-box code { font-family: monospace; font-size: 11px; background: #FFF; padding: 6px; border: 1px solid #D8E0EB; border-radius: 4px; word-break: break-all; }
.hash-note { font-size: 11px; color: #64748B; margin-top: 6px; }
.signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-top: 1px solid #E2E8F0; padding-top: 24px; margin-top: 24px; }
.sig-box { background: #F8FAFC; border: 1px solid #D8E0EB; border-radius: 6px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.btn-sign { background: #C2410C; color: #FFF; border: none; padding: 10px; border-radius: 4px; font-weight: 700; cursor: pointer; }
</style>
