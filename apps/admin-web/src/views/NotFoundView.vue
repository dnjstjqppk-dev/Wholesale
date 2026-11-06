<template>
  <div class="admin-404">
    <div class="ws-admin-card not-found-card">
      <p class="not-found-code">404</p>
      <h1>요청하신 운영 페이지를 찾을 수 없습니다</h1>
      <p class="not-found-sub">주소 확인 후 다시 시도하세요. 요청 경로: <code>{{ $route.fullPath }}</code></p>
      <div class="not-found-actions">
        <router-link to="/" class="ws-admin-btn ws-admin-btn-primary">관제 대시보드로 이동</router-link>
        <router-link to="/audit" class="ws-admin-btn">감사 로그</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-404 { display: flex; justify-content: center; padding: 64px 24px; }
.not-found-card { max-width: 560px; width: 100%; text-align: center; }
.not-found-code {
  margin: 0;
  font-size: 56px;
  font-weight: 800;
  color: var(--ws-admin-accent);
  line-height: 1;
}
.not-found-card h1 { font-size: var(--ws-fs-xl); margin: 12px 0 8px; color: var(--ws-admin-text); }
.not-found-sub { font-size: var(--ws-fs-sm); color: var(--ws-admin-dim); margin: 0 0 20px; }
.not-found-sub code {
  background: var(--ws-admin-panel-2);
  padding: 2px 6px;
  border-radius: var(--ws-radius-sm);
  font-family: ui-monospace, monospace;
}
.not-found-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
</style>
