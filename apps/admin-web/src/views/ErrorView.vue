<template>
  <div class="admin-error">
    <div class="ws-admin-card error-card">
      <p class="error-code">500</p>
      <h1>운영 콘솔에 일시적인 오류가 발생했습니다</h1>
      <p class="error-sub">잠시 후 다시 시도하세요. 반복되면 감사 로그와 함께 플랫폼팀에 보고하세요.</p>
      <div class="error-actions">
        <button class="ws-admin-btn ws-admin-btn-primary" @click="retry">다시 시도</button>
        <router-link to="/" class="ws-admin-btn">관제 대시보드로 이동</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function retry() {
  router.go(-1);
}
</script>

<style scoped>
.admin-error { display: flex; justify-content: center; padding: 64px 24px; }
.error-card { max-width: 560px; width: 100%; text-align: center; }
.error-code {
  margin: 0;
  font-size: 56px;
  font-weight: 800;
  color: var(--ws-admin-accent);
  line-height: 1;
}
.error-card h1 { font-size: var(--ws-fs-xl); margin: 12px 0 8px; color: var(--ws-admin-text); }
.error-sub { font-size: var(--ws-fs-sm); color: var(--ws-admin-dim); margin: 0 0 20px; }
.error-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
</style>
