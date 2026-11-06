<template>
  <div class="ws-page legal-page">
    <div class="ws-card">
      <span class="ws-badge ws-badge-navy">WHOLESALE B2B</span>
      <h1 class="ws-card-title legal-title">개인정보처리방침 (Privacy Policy)</h1>
      <p class="ws-card-sub">시행일: 2026-01-01 · 최종 개정: 2026-10-01 · 버전 1.2</p>

      <section class="legal-section">
        <h2>1. 수집하는 개인정보</h2>
        <ul>
          <li><strong>회원 식별</strong>: 성명, 기업 이메일, 비밀번호(복원 불가능한 해시로 저장), 휴대전화번호</li>
          <li><strong>기업 식별</strong>: 상호, 사업자등록번호·EIN·VAT, 대표자명, 사업장 주소, KYB 실사 서류</li>
          <li><strong>거래 기록</strong>: 주문·계약·결제·선적·정산·분쟁 내역 (전자상거래법상 5년 보관)</li>
          <li><strong>자동 수집</strong>: 접속 IP, 기기 정보, 접속 로그, 알림 수신 토큰</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>2. 이용 목적</h2>
        <p>수집된 정보는 본인 확인과 기업 실사, 주문·결제·정산 처리, 무역보증과 분쟁 중재, 부정거래 탐지, 법령상 의무 이행에만 이용됩니다. 목적 외 이용 시 별도 동의를 받습니다.</p>
      </section>

      <section class="legal-section">
        <h2>3. 보관과 파기</h2>
        <p>회원 탈퇴 시 식별 정보는 지체 없이 파기합니다. 단, 거래·결제·정산·감사 기록은 전자상거래법·법인세법이 정한 기간(계약·청약 기록 5년, 대금결제 기록 5년) 동안 분리 보관 후 파기합니다.</p>
      </section>

      <section class="legal-section">
        <h2>4. 제3자 제공과 처리 위탁</h2>
        <p>결제대행(PG), 본인·기업 인증, 클라우드 인프라, 알림 발송 업체에만 필요한 최소 정보를 제공·위탁하며, 수탁자 명단과 위탁 업무는 공지사항을 통해 공개합니다. 국외 이전 시 사전 동의를 받습니다.</p>
      </section>

      <section class="legal-section">
        <h2>5. 정보주체의 권리</h2>
        <p>회원은 기업 프로필 화면에서 본인·기업 정보의 열람·정정·삭제를 요청할 수 있고, 마케팅 수신을 거부할 수 있습니다. 권리 행사 요청은 privacy@wholesale.internal로 접수하며 10일 이내에 조치 결과를 통지합니다.</p>
      </section>

      <section class="legal-section">
        <h2>6. 안전성 확보 조치</h2>
        <p>비밀번호는 PBKDF2 10만 회 해시로 저장하고, 인증 토큰은 서명된 JWT(1시간 만료)로 발급합니다. 결제 웹훅은 HMAC 서명을 검증하며, 조직 데이터는 테넌트 단위로 격리됩니다.</p>
      </section>

      <div class="legal-actions">
        <router-link :to="`${basePath}/terms`" class="ws-btn ws-btn-secondary">이용약관 보기</router-link>
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
