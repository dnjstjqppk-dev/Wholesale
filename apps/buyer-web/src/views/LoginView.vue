<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-tabs">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">기업 로그인 (Sign In)</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'">신규 구매/공급 기업 가입 (Join Free)</button>
      </div>

      <!-- Quick Role Switcher for Demo / SoD Verification -->
      <div class="quick-switch-box">
        <h4>⚡ 원클릭 실계정 전환 (HMAC-SHA256 JWT 실서명 발급)</h4>
        <p>기안자(Purchaser)와 결재권자(Approver) 간 내부결재 직무분리(SoD)를 즉시 검증할 수 있습니다.</p>
        <div class="role-btns">
          <button class="btn-role" @click="quickLogin('buyer@wholesale.internal')">
            👤 구매 기안자 (BUYER_PURCHASER)
          </button>
          <button class="btn-role approver" @click="quickLogin('approver@wholesale.internal')">
            ✍️ 구매 결재권자 (BUYER_APPROVER)
          </button>
        </div>
      </div>

      <form v-if="mode === 'login'" class="auth-form" @submit.prevent="handleLogin">
        <div class="field">
          <label>기업 이메일 (Business Email)</label>
          <input v-model="email" type="email" required />
        </div>
        <div class="field">
          <label>비밀번호 (Password)</label>
          <input v-model="password" type="password" required />
        </div>
        <p v-if="errorMsg" class="err-msg">{{ errorMsg }}</p>
        <button type="submit" class="btn-submit" :disabled="submitting">
          {{ submitting ? '인증 토큰 발급 중...' : '보안 로그인 및 세션 갱신' }}
        </button>
      </form>

      <form v-else class="auth-form" @submit.prevent="handleRegister">
        <div class="field">
          <label>담당자 성명 (Full Name)</label>
          <input v-model="regForm.full_name" type="text" placeholder="John Doe" required />
        </div>
        <div class="field">
          <label>기업 이메일 (Business Email)</label>
          <input v-model="regForm.email" type="email" placeholder="procurement@company.com" required />
        </div>
        <div class="field">
          <label>비밀번호 (Password)</label>
          <input v-model="regForm.password" type="password" required />
        </div>
        <div class="field">
          <label>법인 상호명 (Legal Company Name)</label>
          <input v-model="regForm.company_name" type="text" placeholder="Global Imports Inc." required />
        </div>
        <div class="field-row">
          <div class="field">
            <label>사업자등록번호 / EIN / VAT</label>
            <input v-model="regForm.business_number" type="text" placeholder="98-7654321" required />
          </div>
          <div class="field">
            <label>국가 (Country ISO)</label>
            <select v-model="regForm.country">
              <option value="US">United States (US)</option>
              <option value="KR">South Korea (KR)</option>
              <option value="DE">Germany (DE)</option>
              <option value="JP">Japan (JP)</option>
            </select>
          </div>
        </div>
        <p v-if="errorMsg" class="err-msg">{{ errorMsg }}</p>
        <button type="submit" class="btn-submit" :disabled="submitting">
          {{ submitting ? '기업 계정 생성 중...' : '기업 회원 가입 완료 및 즉시 로그인' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { loginUser, apiRequest, setAuthSession } from '../api';

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
  role: 'BUYER_PURCHASER',
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
      body: JSON.stringify(regForm.value),
    });
    setAuthSession(res.access_token, {
      ...res.user,
      organization: res.organization,
    });
    window.dispatchEvent(new Event('auth-changed'));
    alert(`신규 기업 계정이 생성되었습니다: ${res.organization.legal_name}`);
    router.push('/ko/KRW/');
  } catch (err: any) {
    errorMsg.value = err.message;
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.auth-page { max-width: 540px; margin: 32px auto; }
.auth-card { background: #FFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.auth-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; background: #F1F5F9; padding: 4px; border-radius: 8px; }
.auth-tabs button { border: none; background: transparent; padding: 10px; font-weight: 700; font-size: 13px; color: #64748B; border-radius: 6px; cursor: pointer; }
.auth-tabs button.active { background: #FFF; color: #D64000; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

.quick-switch-box { background: #FFF7ED; border: 1px solid #FDBA74; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
.quick-switch-box h4 { margin: 0 0 4px 0; font-size: 13px; color: #C2410C; }
.quick-switch-box p { margin: 0 0 10px 0; font-size: 11px; color: #9A3412; }
.role-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.btn-role { background: #FFF; border: 1px solid #FB923C; color: #C2410C; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; }
.btn-role.approver { background: #CC3D00; color: #FFF; border-color: #CC3D00; }

.auth-form { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field label { font-size: 12px; font-weight: 700; color: #334155; }
.field input, .field select { border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px 12px; font-size: 13px; }
.err-msg { color: #DC2626; font-size: 12px; margin: 0; font-weight: 600; }
.btn-submit { background: #D64000; color: #FFF; border: none; padding: 12px; border-radius: 6px; font-weight: 800; font-size: 14px; cursor: pointer; margin-top: 6px; }
</style>

