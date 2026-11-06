<template>
  <div class="ws-page legal-page">
    <div class="ws-card">
      <span class="ws-badge ws-badge-navy">WHOLESALE B2B</span>
      <h1 class="ws-card-title legal-title">이용약관 (Terms of Service)</h1>
      <p class="ws-card-sub">시행일: 2026-01-01 · 최종 개정: 2026-10-01 · 버전 1.2</p>

      <section class="legal-section">
        <h2>제1조 (목적)</h2>
        <p>본 약관은 WHOLESALE(이하 "플랫폼")이 제공하는 기업간(B2B) 도매 무역 중개, 에스크로 결제 보호, 정산, 물류 연계 서비스의 이용 조건과 운영자·구매기업·공급기업의 권리·의무를 정합니다.</p>
      </section>

      <section class="legal-section">
        <h2>제2조 (정의)</h2>
        <ul>
          <li><strong>구매기업(Buyer)</strong>: 플랫폼에서 상품을 탐색·발주하는 법인·사업자 회원</li>
          <li><strong>공급기업(Supplier)</strong>: 상품을 등록·판매하는 법인·사업자 회원 (Verified 실사 등급 별도)</li>
          <li><strong>에스크로(Escrow)</strong>: 대금을 플랫폼이 보관 후 거래 조건 충족 시 공급기업에 지급하는 결제 보호 제도</li>
          <li><strong>무역보증(Trade Assurance)</strong>: 주문 조건 미이행 시 약정 한도 내에서 구매대금을 보상하는 제도</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>제3조 (회원 유형과 권한 분리)</h2>
        <p>구매기업 계정은 구매담당(Purchaser)·결재권자(Approver)·재무(Finance) 역할로 분리되며, 발주자와 승인자는 동일인이 될 수 없습니다(직무 분리, SoD). 공급기업 계정은 판매 권한만 부여됩니다.</p>
      </section>

      <section class="legal-section">
        <h2>제4조 (주문·계약)</h2>
        <p>견적 수락 또는 직접 발주로 무역 주문이 생성되며, 계약 조건(수량·단가·인코텀즈·총액)의 SHA-256 해시가 계약서에 기록됩니다. 서명된 계약 조건과 주문 금액이 일치하지 않으면 서명이 거부됩니다.</p>
      </section>

      <section class="legal-section">
        <h2>제5조 (결제와 정산)</h2>
        <p>결제는 계약금 30%·잔금 70% 분할을 기본으로 하며, 모든 자금 이동은 복식부기 원장에 차변·대변 동시 기록됩니다. 정산금은 플랫폼 수수료(매출의 5%)를 공제한 뒤 지급되며, 지급 집행은 1차 승인자와 다른 2차 집행자의 이중 승인(Dual Control)을 거칩니다.</p>
      </section>

      <section class="legal-section">
        <h2>제6조 (분쟁과 중재)</h2>
        <p>구매기업이 분쟁을 제기하면 해당 정산금은 자동으로 동결(HELD)됩니다. 플랫폼 중재팀은 증거 검토 후 환불·부분환불·기각을 결정하며, 당사자는 중재 결과에 대해 7일 이내에 이의를 제기할 수 있습니다.</p>
      </section>

      <section class="legal-section">
        <h2>제7조 (금지 행위)</h2>
        <p>회원은 허위 상품 등록, 직접 결제 유도(플랫폼 우회), 타사 견적 정보의 무단 수집·유포, 결제 웹훅 위조, 타인 명의 도용을 해서는 안 됩니다. 위반 시 거래 제한·계정 정지·손해배상 청구의 대상이 됩니다.</p>
      </section>

      <section class="legal-section">
        <h2>제8조 (준거법과 관할)</h2>
        <p>본 약관은 대한민국법을 준거법으로 하며, 분쟁의 전속 관할은 서울중앙지방법원으로 합니다.</p>
      </section>

      <div class="legal-actions">
        <router-link :to="`${basePath}/privacy`" class="ws-btn ws-btn-secondary">개인정보처리방침 보기</router-link>
        <router-link :to="basePath" class="ws-btn ws-btn-primary">홈으로 돌아가기</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const locale = computed(() => (route.params.locale as string) || 'ko');
const currency = computed(() => (route.params.currency as string) || 'KRW');
const basePath = computed(() => `/${locale.value}/${currency.value}`);
</script>

<style scoped>
.legal-page { display: flex; justify-content: center; }
.legal-page .ws-card { max-width: 760px; width: 100%; }
.legal-title { margin-top: 12px; }
.legal-section { margin-bottom: 20px; }
.legal-section h2 { font-size: var(--ws-fs-md); margin: 0 0 8px; color: var(--ws-text); }
.legal-section p, .legal-section li { font-size: var(--ws-fs-sm); color: var(--ws-text-2); line-height: 1.7; margin: 0 0 6px; }
.legal-section ul { padding-left: 20px; margin: 0; }
.legal-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 24px; }
</style>
