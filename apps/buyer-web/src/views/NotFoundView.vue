<template>
  <div class="ws-page not-found-page">
    <div class="ws-card not-found-card">
      <span class="ws-empty-icon"><WsIcon name="search" :size="28" /></span>
      <p class="not-found-code">404</p>
      <h1 class="ws-card-title">요청하신 페이지를 찾을 수 없습니다</h1>
      <p class="ws-card-sub">
        주소가 변경되었거나, 삭제된 페이지입니다.<br />
        아래 바로가기로 도매 거래를 계속 이어가세요.
      </p>
      <div class="not-found-actions">
        <router-link :to="homePath" class="ws-btn ws-btn-accent">홈으로 이동</router-link>
        <router-link :to="`${basePath}/catalog`" class="ws-btn ws-btn-secondary">상품 카탈로그</router-link>
        <router-link :to="`${basePath}/rfq`" class="ws-btn ws-btn-secondary">RFQ 소싱</router-link>
      </div>
      <p class="not-found-path">요청 경로: <code>{{ $route.fullPath }}</code></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import WsIcon from '@packages/ui/WsIcon.vue';

const route = useRoute();
const locale = computed(() => (route.params.locale as string) || 'ko');
const currency = computed(() => (route.params.currency as string) || 'KRW');
const basePath = computed(() => `/${locale.value}/${currency.value}`);
const homePath = computed(() => basePath.value);
</script>

<style scoped>
.not-found-page { display: flex; justify-content: center; padding-top: 64px; }
.not-found-card { max-width: 560px; width: 100%; text-align: center; }
.not-found-code {
  margin: 8px 0 0;
  font-size: 56px;
  font-weight: 800;
  color: var(--ws-brand);
  letter-spacing: -0.02em;
  line-height: 1;
}
.not-found-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin: 8px 0 20px; }
.not-found-path { font-size: var(--ws-fs-xs); color: var(--ws-text-muted); margin: 0; }
.not-found-path code {
  background: var(--ws-surface-muted);
  padding: 2px 6px;
  border-radius: var(--ws-radius-sm);
  font-family: ui-monospace, monospace;
}
</style>
