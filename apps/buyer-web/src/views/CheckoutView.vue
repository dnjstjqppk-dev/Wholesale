<template>
  <div class="checkout-page">
    <div class="checkout-header">
      <h2>B2B 도매 수주 계약서 작성 및 체크아웃 (Trade Checkout)</h2>
      <p class="subtitle">국제 무역 표준 규정에 따라 전자 계약서가 생성되고 에스크로 결제 계좌가 발급됩니다.</p>
    </div>

    <div v-if="loading" class="loading-state">
      도매 계약 및 에스크로 정산 조건을 API 서버에서 확인 중입니다...
    </div>

    <div v-else class="checkout-layout">
      <!-- Left: Form Sections -->
      <div class="checkout-forms">
        <!-- 1. Buyer & Consignee -->
        <div class="form-card">
          <div class="card-head">
            <span class="step-num">1</span>
            <h3>수하인 및 구매 기업 정보 (Consignee)</h3>
          </div>
          <div class="form-grid">
            <div>
              <label>수하인 기업명</label>
              <input v-model="consignee.companyName" type="text" />
            </div>
            <div>
              <label>사업자/수입자 등록번호 (EIN/VAT)</label>
              <input v-model="consignee.taxId" type="text" />
            </div>
            <div class="span-2">
              <label>도착지 항구 및 인도 주소 (Destination Port)</label>
              <input v-model="consignee.destinationAddress" type="text" />
            </div>
          </div>
        </div>

        <!-- 2. Incoterms & Trade Terms -->
        <div class="form-card">
          <div class="card-head">
            <span class="step-num">2</span>
            <h3>무역 조건 및 운송 협약 (Incoterms® 2020)</h3>
          </div>
          <div class="form-grid">
            <div>
              <label>인도 조건 (Incoterms)</label>
              <select v-model="tradeTerms.incoterms">
                <option value="FOB">FOB (본선인도가산, FOB Busan Port)</option>
                <option value="CIF">CIF (운임보험료포함인도)</option>
                <option value="EXW">EXW (공장인도)</option>
                <option value="DDP">DDP (관세지급인도)</option>
              </select>
            </div>
            <div>
              <label>예상 생산 완료 납기</label>
              <input :value="tradeTerms.leadTime" type="text" disabled />
            </div>
            <div class="span-2">
              <label>품질 검수 조건</label>
              <div class="spec-note">
                ✓ 선적 전 제3자 공인 검수(SGS/TÜV) 통과 필수 · 불합격 시 수정 또는 전액 환불
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Escrow Payment Schedule -->
        <div class="form-card">
          <div class="card-head">
            <span class="step-num">3</span>
            <h3>에스크로 분할 결제 일정 (Payment Schedule)</h3>
          </div>
          <div class="schedule-table-wrap">
            <table class="schedule-table">
              <thead>
                <tr>
                  <th>회차</th>
                  <th>결제 항목</th>
                  <th>비율</th>
                  <th>금액 (USD)</th>
                  <th>정산 지급 조건</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1차</td>
                  <td><strong>선급금 (Down Payment)</strong></td>
                  <td>30%</td>
                  <td class="amount">$1,260.00</td>
                  <td>계약 체결 후 에스크로 가상계좌 입금 즉시 생산 착수</td>
                </tr>
                <tr>
                  <td>2차</td>
                  <td><strong>잔금 (Final Balance)</strong></td>
                  <td>70%</td>
                  <td class="amount">$2,940.00</td>
                  <td>선적 B/L 발행 및 제3자 검수 합격 후 공급사에 최종 정산 지급</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right: Contract Confirmation Panel -->
      <div class="order-confirm-panel">
        <div class="confirm-card">
          <h3>발주 품목 및 금액 요약</h3>

          <div class="item-summary-box">
            <span class="badge-sup">🏢 Precision Korea Co., Ltd.</span>
            <h4>산업용 초경량 스테인리스 진공 텀블러 벌크팩</h4>
            <div class="meta-line">
              <span>수량: <strong>1,000 pcs</strong></span>
              <span>단가: <strong>$4.20 USD</strong></span>
            </div>
          </div>

          <div class="price-breakdown">
            <div class="row">
              <span>물품 공급가액 (FOB)</span>
              <span>$4,200.00</span>
            </div>
            <div class="row">
              <span>무역보증 에스크로 수수료</span>
              <span class="free">면제 ($0.00)</span>
            </div>
            <div class="row total">
              <span>총 발주 계약액</span>
              <span class="val-total">$4,200.00 USD</span>
            </div>
            <div class="row downpayment-row">
              <span>1차 결제 예정 (선급금 30%)</span>
              <span class="val-dp">$1,260.00 USD</span>
            </div>
          </div>

          <div class="legal-notice">
            <p>
              「발주서 생성」을 클릭하면 플랫폼 공통 API를 통해 정식 도매 거래 계약(Trade Contract)이 생성되고 고유 SHA-256 계약 해시가 부여됩니다.
            </p>
          </div>

          <div v-if="error" class="error-msg">
            ⚠️ {{ error }}
          </div>

          <button
            class="btn-generate-contract"
            :disabled="submitting"
            @click="generateContract"
          >
            {{ submitting ? '계약서 생성 및 주문 접수 중...' : '📝 최종 도매 계약서 발급 및 주문 체결 →' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiRequest } from '../api';

const router = useRouter();
const loading = ref(false);
const submitting = ref(false);
const error = ref('');

const consignee = ref({
  companyName: 'Metro Wholesale Imports LLC',
  taxId: 'US-EIN-98-7654321',
  destinationAddress: 'Port of Los Angeles / 1000 Waterfront Way, San Pedro, CA 90731, USA',
});

const tradeTerms = ref({
  incoterms: 'FOB',
  leadTime: '발주 확정 후 14 영업일 이내 선적',
});

async function generateContract() {
  submitting.value = true;
  error.value = '';
  try {
    const idempKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const res = await apiRequest('/sourcing/quotes/quote-001/accept', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempKey,
      },
      body: JSON.stringify({
        notes: 'Checkout Trade Order generated from wholesale cart',
      }),
    });

    const orderId = res.id || 'ord-20261018-001';
    alert(`[도매 수주 계약서 발급 완료]\n주문번호: ${res.order_number || orderId}\n계약금(30%): $1,260.00 USD\n전자서명 단계로 이동합니다.`);
    router.push(`/ko/KRW/orders/${orderId}/contract`);
  } catch (err: any) {
    if (err.message && err.message.includes('409')) {
      alert('이미 처리된 견적 주문입니다. 발주 관리 목록으로 이동합니다.');
      router.push('/ko/KRW/orders');
    } else {
      error.value = err.message || '계약서 생성 중 오류가 발생했습니다.';
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.checkout-page { max-width: 1200px; margin: 0 auto; }
.checkout-header h2 { font-size: 22px; color: #1E293B; margin: 0 0 6px 0; font-weight: 800; }
.subtitle { color: #64748B; font-size: 13px; margin-bottom: 24px; }
.loading-state { padding: 40px; text-align: center; color: #64748B; }

.checkout-layout { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
.checkout-forms { display: flex; flex-direction: column; gap: 20px; }
.form-card { background: #FFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 22px; }
.card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; }
.step-num { width: 24px; height: 24px; background: #FF6600; color: #FFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; }
.card-head h3 { margin: 0; font-size: 16px; color: #1E293B; font-weight: 700; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-grid .span-2 { grid-column: span 2; }
.form-grid label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
.form-grid input, .form-grid select { width: 100%; padding: 8px 12px; border: 1px solid #CBD5E1; border-radius: 4px; box-sizing: border-box; font-size: 13px; }
.form-grid input:disabled { background: #F8FAFC; color: #64748B; }
.spec-note { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px 12px; border-radius: 4px; font-size: 12px; color: #334155; }

.schedule-table-wrap { overflow-x: auto; }
.schedule-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.schedule-table th, .schedule-table td { border: 1px solid #E2E8F0; padding: 8px 10px; text-align: left; }
.schedule-table th { background: #F8FAFC; font-weight: 700; color: #334155; }
.schedule-table .amount { font-weight: 700; color: #1E293B; }

.confirm-card { background: #FFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 22px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.confirm-card h3 { font-size: 16px; color: #1E293B; margin: 0 0 16px 0; font-weight: 700; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px; }
.item-summary-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px; margin-bottom: 16px; }
.badge-sup { font-size: 11px; font-weight: 700; color: #475569; }
.item-summary-box h4 { margin: 6px 0; font-size: 13px; color: #1E293B; }
.meta-line { display: flex; justify-content: space-between; font-size: 12px; color: #64748B; }

.price-breakdown { border-top: 1px solid #F1F5F9; padding-top: 12px; margin-bottom: 16px; }
.row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; color: #475569; }
.row.total { font-weight: 800; font-size: 15px; color: #1E293B; border-top: 1px solid #E2E8F0; margin-top: 8px; padding-top: 10px; }
.row .free { color: #16A34A; font-weight: 700; }
.row.downpayment-row { background: #FFF7ED; border-radius: 4px; padding: 8px; margin-top: 8px; font-weight: 700; }
.val-dp { color: #C2410C; font-size: 15px; }

.legal-notice { font-size: 11px; color: #64748B; line-height: 1.4; margin-bottom: 16px; background: #F8FAFC; padding: 10px; border-radius: 4px; }
.error-msg { background: #FEF2F2; color: #B91C1C; padding: 8px 12px; border-radius: 4px; font-size: 12px; margin-bottom: 14px; }

.btn-generate-contract { width: 100%; background: #FF6600; color: #FFF; border: none; padding: 14px; border-radius: 6px; font-size: 14px; font-weight: 800; cursor: pointer; transition: background 0.15s; }
.btn-generate-contract:hover { background: #E65C00; }
.btn-generate-contract:disabled { background: #CBD5E1; cursor: not-allowed; }
</style>

