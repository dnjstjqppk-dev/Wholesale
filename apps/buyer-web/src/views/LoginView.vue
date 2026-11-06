<template>
  <div class="ws-page ws-page-narrow auth-wrap">
    <div class="auth-split">
      <aside class="auth-side">
        <span class="ws-brand-lockup"><span class="ws-brand-mark">W</span><span class="side-word">WHOLESALE</span></span>
        <h2>계약 신뢰 위에 서는<br />B2B 도매 무역</h2>
        <ul>
          <li><WsIcon name="shield" :size="16" /> 에스크로 100% 대금 보호</li>
          <li><WsIcon name="file" :size="16" /> SHA-256 전자계약 위변조 방지</li>
          <li><WsIcon name="users" :size="16" /> 기안·결재 직무분리(SoD)</li>
        </ul>
        <p class="side-foot">Trade Assurance · Incoterms® 2020</p>
      </aside>
      <div class="auth-main">
        <div class="ws-tabs auth-tabs">
          <button class="ws-tab" :class="{ 'ws-tab-active': mode === 'login' }" @click="mode = 'login'">기업 로그인</button>
          <button class="ws-tab" :class="{ 'ws-tab-active': mode === 'register' }" @click="mode = 'register'">기업 가입</button>
        </div>

        <div class="ws-banner ws-banner-warning quick-box">
          <WsIcon name="bolt" :size="16" />
          <div>
            <b>원클릭 실계정 전환</b>
            <p>기안자·결재권자 간 직무분리(SoD)를 즉시 검증할 수 있습니다.</p>
            <div class="quick-btns">
              <button class="ws-btn ws-btn-secondary ws-btn-sm" @click="quickLogin('buyer@wholesale.internal')">
                <WsIcon name="users" :size="14" /> 구매 기안자
              </button>
              <button class="ws-btn ws-btn-navy ws-btn-sm" @click="quickLogin('approver@wholesale.internal')">
                <WsIcon name="pencil" :size="14" /> 구매 결재권자
              </button>
            </div>
          </div>
        </div>

        <form v-if="mode === 'login'" class="auth-form" @submit.prevent="handleLogin">
          <div class="ws-field">
            <label>기업 이메일 <span class="ws-muted">Business Email</span></label>
            <input v-model="email" type="email" autocomplete="email" required />
          </div>
          <div class="ws-field">
            <label>비밀번호 <span class="ws-muted">Password</span></label>
            <input v-model="password" type="password" autocomplete="current-password" required />
          </div>
          <p v-if="errorMsg" class="ws-error-text">{{ errorMsg }}</p>
          <button type="submit" class="ws-btn ws-btn-primary ws-btn-block ws-btn-lg" :disabled="submitting">
            <span v-if="submitting" class="ws-spinner"></span>
            {{ submitting ? '인증 토큰 발급 중...' : '보안 로그인' }}
          </button>
        </form>

        <form v-else class="auth-form" @submit.prevent="handleRegister">
          <div class="ws-grid-2">
            <div class="ws-field">
              <label>담당자 성명</label>
              <input v-model="regForm.full_name" type="text" placeholder="John Doe" required />
            </div>
            <div class="ws-field">
              <label>기업 이메일</label>
              <input v-model="regForm.email" type="email" placeholder="procurement@company.com" required />
            </div>
          </div>
          <div class="ws-field">
            <label>비밀번호 <span class="ws-field-req">*</span></label>
            <input v-model="regForm.password" type="password" minlength="12" autocomplete="new-password" required />
            <p class="ws-hint">12자 이상 입력하세요.</p>
          </div>
          <div class="ws-field">
            <label>법인 상호명 <span class="ws-muted">Legal Company Name</span></label>
            <input v-model="regForm.company_name" type="text" placeholder="Global Imports Inc." required />
          </div>
          <div class="ws-grid-2">
            <div class="ws-field">
              <label>사업자등록번호 / EIN / VAT</label>
              <input v-model="regForm.business_number" type="text" placeholder="98-7654321" required />
            </div>
            <div class="ws-field">
              <label>국가</label>
              <select v-model="regForm.country">
                <option value="US">United States (US)</option>
                <option value="KR">South Korea (KR)</option>
                <option value="DE">Germany (DE)</option>
                <option value="JP">Japan (JP)</option>
              </select>
            </div>
          </div>
          <div class="ws-field">
            <label>가입 유형</label>
            <div class="ws-radio-row">
              <label class="ws-radio-card">
                <input v-model="regForm.role" type="radio" value="BUYER" />
                <span class="ws-radio-body"><b>구매기업</b><br /><span class="ws-muted">Buyer</span></span>
              </label>
              <label class="ws-radio-card">
                <input v-model="regForm.role" type="radio" value="SUPPLIER" />
                <span class="ws-radio-body"><b>공급기업</b><br /><span class="ws-muted">Supplier</span></span>
              </label>
            </div>
          </div>
          <p v-if="errorMsg" class="ws-error-text">{{ errorMsg }}</p>
          <button type="submit" class="ws-btn ws-btn-primary ws-btn-block ws-btn-lg" :disabled="submitting">
            <span v-if="submitting" class="ws-spinner"></span>
            {{ submitting ? '기업 계정 생성 중...' : '기업 가입 완료' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { loginUser, apiRequest, setAuthSession } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const router = useRouter();
const route = useRoute();
const mode = ref<'login' | 'register'>(route.path.includes('register') ? 'register' : 'login');
const email = ref('buyer@wholesale.internal');
const password = ref('Password123!');
const submitting = ref(false);
const errorMsg = ref('');

const regForm = ref({
  full_name: '',
  email: '',
  password: 'Password123!',
  company_name: '',
  business_number: '',
  country: 'US',
  role: 'BUYER',
});

async function handleLogin() {
  submitting.value = true;
  errorMsg.value = '';
  try {
    const session = await loginUser(email.value, password.value);
    window.dispatchEvent(new Event('auth-changed'));
    alert(`환영합니다, ${session.full_name} (${session.role})님!`);
    router.push('/ko/KRW/');
  } catch (err: any) {
    errorMsg.value = err.message;
  } finally {
    submitting.value = false;
  }
}

async function quickLogin(targetEmail: string) {
  email.value = targetEmail;
  password.value = 'Password123!';
  await handleLogin();
}

async function handleRegister() {
  submitting.value = true;
  errorMsg.value = '';
  try {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...regForm.value,
        role_capability: regForm.value.role === 'SUPPLIER' ? 'SUPPLIER' : 'BUYER',
      }),
    });
    setAuthSession(res.access_token, {
      ...res.user,
      organization: res.organization,
    });
    window.dispatchEvent(new Event('auth-changed'));
    alert(`신규 기업 계정이 생성되었습니다: ${res.organization.legal_name}`);
    router.push('/onboarding');
  } catch (err: any) {
    errorMsg.value = err.message;
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.auth-wrap { padding-top: 40px; }
.auth-split { display: grid; grid-template-columns: 300px minmax(0, 1fr); background: #fff; border: 1px solid var(--ws-border-subtle); border-radius: 14px; overflow: hidden; box-shadow: var(--ws-shadow-pop); }
.auth-side { background: var(--ws-navy-ink); color: #dbe4f1; padding: 32px 28px; display: flex; flex-direction: column; }
.auth-side .side-word { color: #fff; }
.auth-side h2 { margin: 28px 0 20px; font-size: 22px; font-weight: 900; letter-spacing: var(--ws-tracking-tight); line-height: 1.4; color: #fff; }
.auth-side ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; font-size: 13px; font-weight: 600; }
.auth-side li { display: flex; align-items: center; gap: 10px; }
.auth-side li svg { color: #5cc8f5; flex: none; }
.side-foot { margin: auto 0 0; padding-top: 24px; font-size: 11px; color: #7c8fad; font-weight: 700; letter-spacing: 0.05em; }
.auth-main { padding: 28px 30px 30px; }
.auth-tabs { margin-bottom: 16px; }
.quick-box { margin: 0 0 20px; }
.quick-box p { margin: 4px 0 10px; font-size: 12px; }
.quick-btns { display: flex; gap: 8px; flex-wrap: wrap; }
.auth-form { display: flex; flex-direction: column; }
.auth-form .ws-field { margin-bottom: 14px; }
@media (max-width: 768px) {
  .auth-split { grid-template-columns: minmax(0, 1fr); }
  .auth-side { padding: 24px 20px; }
  .auth-side ul { display: none; }
  .auth-main { padding: 20px 18px 24px; }
}
</style>
