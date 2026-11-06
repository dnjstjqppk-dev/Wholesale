<template>
  <div class="ws-page not-found-page">
    <div class="ws-card not-found-card">
      <span class="ws-empty-icon"><WsIcon name="search" :size="28" /></span>
      <p class="not-found-code">404</p>
      <h1 class="ws-card-title">요청하신 페이지를 찾을 수 없습니다</h1>
      <p class="ws-card-sub">
        주소가 변경되었거나, 삭제된 페이지입니다.<br />
        아래 바로가기로 판매 관리를 계속 이어가세요.
      </p>
      <div class="not-found-actions">
        <router-link to="/" class="ws-btn ws-btn-primary">대시보드로 이동</router-link>
        <router-link to="/catalog" class="ws-btn ws-btn-secondary">상품 관리</router-link>
        <router-link to="/rfq-market" class="ws-btn ws-btn-secondary">RFQ 입찰 시장</router-link>
      </div>
      <p class="not-found-path">요청 경로: <code>{{ $route.fullPath }}</code></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import WsIcon from '@packages/ui/WsIcon.vue';
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
