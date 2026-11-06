<template>
  <div class="ws-page error-page">
    <div class="ws-card error-card">
      <span class="ws-empty-icon"><WsIcon name="alert" :size="28" /></span>
      <p class="error-code">500</p>
      <h1 class="ws-card-title">일시적인 오류가 발생했습니다</h1>
      <p class="ws-card-sub">
        요청을 처리하는 중에 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.<br />
        같은 문제가 반복되면 아래 요청 ID와 함께 고객센터로 문의해 주세요.
      </p>
      <p v-if="requestId" class="error-rid">요청 ID: <code>{{ requestId }}</code></p>
      <div class="error-actions">
        <button class="ws-btn ws-btn-accent" @click="retry">다시 시도</button>
        <router-link :to="homePath" class="ws-btn ws-btn-secondary">홈으로 이동</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import WsIcon from '@packages/ui/WsIcon.vue';

const route = useRoute();
const router = useRouter();
const locale = computed(() => (route.params.locale as string) || 'ko');
const currency = computed(() => (route.params.currency as string) || 'KRW');
const homePath = computed(() => `/${locale.value}/${currency.value}`);
const requestId = computed(() => (route.query.rid as string) || '');

function retry() {
  router.go(-1);
}
</script>

<style scoped>
.error-page { display: flex; justify-content: center; padding-top: 64px; }
.error-card { max-width: 560px; width: 100%; text-align: center; }
.error-code {
  margin: 8px 0 0;
  font-size: 56px;
  font-weight: 800;
  color: var(--ws-danger);
  letter-spacing: -0.02em;
  line-height: 1;
}
.error-rid { font-size: var(--ws-fs-xs); color: var(--ws-text-muted); margin: 0 0 16px; }
.error-rid code {
  background: var(--ws-surface-muted);
  padding: 2px 6px;
  border-radius: var(--ws-radius-sm);
  font-family: ui-monospace, monospace;
}
.error-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin: 8px 0 8px; }
</style>
