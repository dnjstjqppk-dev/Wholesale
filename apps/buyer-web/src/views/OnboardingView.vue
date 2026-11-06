<template>
  <div class="ws-page onboarding-page">
    <div class="ws-card onboarding-card">
      <span class="ws-badge ws-badge-brand">ONBOARDING</span>
      <h1 class="ws-card-title onboarding-title">도매 거래 시작하기</h1>
      <p class="ws-card-sub">아래 단계를 마치면 견적 요청부터 에스크로 결제까지 전 기능을 이용할 수 있습니다.</p>

      <div v-if="loading" class="ob-loading">
        <div class="ws-skeleton" style="height: 12px; margin-bottom: 16px;"></div>
        <div class="ws-skeleton" style="height: 64px; margin-bottom: 8px;"></div>
        <div class="ws-skeleton" style="height: 64px;"></div>
      </div>
      <div v-else-if="loadError" class="ws-banner ws-banner-danger">{{ loadError }}</div>
      <template v-else>
        <div class="ob-progress">
          <div class="ob-progress-bar"><span :style="{ width: progressPct + '%' }"></span></div>
          <p class="ob-progress-text">{{ doneCount }} / {{ steps.length }} 단계 완료 ({{ progressPct }}%)</p>
        </div>

        <ol class="ob-steps">
          <li v-for="step in steps" :key="step.id" class="ob-step" :class="{ done: step.done }">
            <span class="ob-check">
              <WsIcon v-if="step.done" name="check" :size="16" />
              <span v-else class="ob-num">{{ step.n }}</span>
            </span>
            <div class="ob-body">
              <strong>{{ step.title }}</strong>
              <p>{{ step.desc }}</p>
            </div>
            <router-link v-if="!step.done" :to="step.to" class="ws-btn ws-btn-secondary ws-btn-sm">이동</router-link>
            <span v-else class="ws-badge ws-badge-success">완료</span>
          </li>
        </ol>

        <div v-if="allDone" class="ws-banner ws-banner-success">
          온보딩을 모두 마쳤습니다. 첫 견적 요청을 발행해 보세요.
        </div>
        <div class="ob-actions">
          <router-link :to="`${basePath}/rfqs/new`" class="ws-btn ws-btn-accent">첫 RFQ 발행하기</router-link>
          <router-link :to="basePath" class="ws-btn ws-btn-secondary">홈으로</router-link>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import WsIcon from '@packages/ui/WsIcon.vue';
import { apiRequest } from '../api';

const route = useRoute();
const locale = computed(() => (route.params.locale as string) || 'ko');
const currency = computed(() => (route.params.currency as string) || 'KRW');
const basePath = computed(() => `/${locale.value}/${currency.value}`);

const loading = ref(true);
const loadError = ref('');
const profileDone = ref(false);
const taxDone = ref(false);
const addressDone = ref(false);
const orderDone = ref(false);

const steps = computed(() => [
  { id: 'profile', n: 1, title: '기업 프로필 등록', desc: '상호·사업자번호·담당자 정보를 입력하세요.', done: profileDone.value, to: `${basePath.value}/profile` },
  { id: 'tax', n: 2, title: '사업자 인증', desc: '비과세 인증 상태가 VERIFIED인지 확인하세요.', done: taxDone.value, to: `${basePath.value}/profile` },
  { id: 'address', n: 3, title: '배송지 등록', desc: '기본 배송지 주소를 1건 이상 등록하세요.', done: addressDone.value, to: `${basePath.value}/profile` },
  { id: 'order', n: 4, title: '첫 거래 시작', desc: 'RFQ 발행 또는 상품 주문으로 첫 거래를 만드세요.', done: orderDone.value, to: `${basePath.value}/rfqs/new` },
]);
const doneCount = computed(() => steps.value.filter(s => s.done).length);
const progressPct = computed(() => Math.round((doneCount.value / steps.value.length) * 100));
const allDone = computed(() => doneCount.value === steps.value.length);

async function loadStatus() {
  loading.value = true;
  loadError.value = '';
  try {
    const [profile, orders] = await Promise.all([
      apiRequest('/auth/profile'),
      apiRequest('/trade/orders').catch(() => ({ orders: [] })),
    ]);
    profileDone.value = !!(profile?.legal_name && profile?.business_number);
    taxDone.value = profile?.tax_exemption_status === 'VERIFIED';
    addressDone.value = Array.isArray(profile?.addresses) && profile.addresses.length > 0;
    const list = Array.isArray(orders?.orders) ? orders.orders : (Array.isArray(orders) ? orders : []);
    orderDone.value = list.length > 0;
  } catch (e: any) {
    loadError.value = `온보딩 상태를 불러오지 못했습니다: ${e.message}`;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadStatus();
});
</script>

<style scoped>
.onboarding-page { display: flex; justify-content: center; }
.onboarding-card { max-width: 680px; width: 100%; }
.onboarding-title { margin-top: 12px; }
.ob-progress { margin: 4px 0 20px; }
.ob-progress-bar { height: 8px; background: var(--ws-surface-muted); border-radius: var(--ws-radius-pill); overflow: hidden; }
.ob-progress-bar span { display: block; height: 100%; background: var(--ws-brand); transition: width 300ms ease; }
.ob-progress-text { font-size: var(--ws-fs-xs); color: var(--ws-text-muted); margin: 8px 0 0; }
.ob-steps { list-style: none; margin: 0 0 20px; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.ob-step {
  display: flex; align-items: center; gap: 12px;
  border: 1px solid var(--ws-border-subtle);
  border-radius: var(--ws-radius-card);
  padding: 12px 14px;
}
.ob-step.done { border-color: var(--ws-success-bg); background: #f6fef9; }
.ob-check {
  width: 28px; height: 28px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%; background: var(--ws-surface-muted); color: var(--ws-text-muted);
  font-size: var(--ws-fs-xs); font-weight: 800;
}
.ob-step.done .ob-check { background: var(--ws-success-bg); color: var(--ws-success); }
.ob-num { line-height: 1; }
.ob-body { flex: 1; }
.ob-body strong { font-size: var(--ws-fs-sm); color: var(--ws-text); }
.ob-body p { margin: 2px 0 0; font-size: var(--ws-fs-xs); color: var(--ws-text-muted); }
.ob-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.ob-loading { margin: 8px 0 16px; }
</style>
