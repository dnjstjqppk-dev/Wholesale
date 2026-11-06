<template>
  <div class="admin-app ws-admin-page">
    <div class="global-strip">
      <span>WHOLESALE Platform Governance & Operations</span>
      <div class="strip-links">
        <a href="https://wholesale.dnjstjqppk.workers.dev/" target="_blank"><WsIcon name="cart" :size="12" /> 구매자 콘솔</a>
        <a href="https://wholesale-partner.dnjstjqppk.workers.dev/" target="_blank"><WsIcon name="factory" :size="12" /> 파트너 콘솔</a>
        <a href="https://wholesale-api.dnjstjqppk.workers.dev/v1/health" target="_blank"><WsIcon name="bolt" :size="12" /> API 상태</a>
      </div>
    </div>

    <header class="ops-header">
      <div class="ops-brand">
        <button class="menu-btn" aria-label="관리자 메뉴 열기" @click="sidebarOpen = !sidebarOpen">
          <span></span><span></span><span></span>
        </button>
        <router-link to="/" class="brand-lockup">
          <span class="ws-brand-mark">W</span>
          <span class="brand-word">WHOLESALE <i>Admin</i></span>
        </router-link>
        <span class="ws-admin-badge ws-admin-badge-info">Zero Trust Secured</span>
      </div>
      <div class="ops-user">
        <span class="user-meta">
          <b>{{ currentUser.full_name }}</b>
          <i>{{ currentUser.role }}</i>
        </span>
        <span class="ws-avatar ws-avatar-sm ops-avatar">{{ (currentUser.full_name || 'A').slice(0, 1) }}</span>
      </div>
    </header>

    <div class="ops-body">
      <div v-if="sidebarOpen" class="side-veil" @click="sidebarOpen = false"></div>
      <aside class="side-nav" :class="{ open: sidebarOpen }">
        <nav>
          <p class="nav-cap">관제</p>
          <router-link to="/" @click="sidebarOpen = false"><WsIcon name="chart" :size="16" /> 종합 운영 대시보드</router-link>
          <p class="nav-cap">심사·모더레이션</p>
          <router-link to="/verifications" @click="sidebarOpen = false"><WsIcon name="building" :size="16" /> KYB 실사 심사</router-link>
          <router-link to="/moderation" @click="sidebarOpen = false"><WsIcon name="search" :size="16" /> 상품·RFQ 모더레이션</router-link>
          <router-link to="/master-data" @click="sidebarOpen = false"><WsIcon name="globe" :size="16" /> 마스터 데이터</router-link>
          <p class="nav-cap">재무·분쟁</p>
          <router-link to="/disputes" @click="sidebarOpen = false"><WsIcon name="alert" :size="16" /> 분쟁 중재</router-link>
          <router-link to="/ledger-audit" @click="sidebarOpen = false"><WsIcon name="book" :size="16" /> 복식부기 감사</router-link>
          <router-link to="/reconciliation" @click="sidebarOpen = false"><WsIcon name="refresh" :size="16" /> PG 일일 대사</router-link>
          <router-link to="/settlements" @click="sidebarOpen = false"><WsIcon name="card" :size="16" /> 정산 이중통제 (SoD)</router-link>
          <p class="nav-cap">보안</p>
          <router-link to="/audit" @click="sidebarOpen = false"><WsIcon name="lock" :size="16" /> 불변 감사 로그</router-link>
        </nav>
      </aside>
      <main class="ops-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import WsIcon from '@packages/ui/WsIcon.vue';
import { getCurrentUser } from './api';

const currentUser = ref(getCurrentUser());
const sidebarOpen = ref(false);
</script>

<style scoped>
.admin-app { display: flex; flex-direction: column; min-height: 100vh; background: var(--ws-admin-bg); }
.global-strip { background: #070b19; color: #7c8fad; font-size: 11px; font-weight: 600; padding: 6px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--ws-admin-panel); }
.strip-links { display: flex; gap: 16px; }
.strip-links a { color: var(--ws-admin-link); text-decoration: none; display: inline-flex; align-items: center; gap: 5px; }
.strip-links a:hover { text-decoration: underline; }
.ops-header { background: var(--ws-admin-panel); border-bottom: 1px solid var(--ws-admin-line); padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; position: sticky; top: 0; z-index: 50; }
.ops-brand { display: flex; align-items: center; gap: 12px; }
.menu-btn { display: none; background: none; border: 1px solid var(--ws-admin-line); border-radius: 8px; width: 36px; height: 36px; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; }
.menu-btn span { width: 16px; height: 2px; background: var(--ws-admin-text); border-radius: 2px; }
.brand-lockup { display: inline-flex; align-items: center; gap: 9px; text-decoration: none; font-weight: 800; font-size: 16px; color: #fff; }
.brand-word i { font-style: normal; color: var(--ws-admin-dim); font-weight: 600; font-size: 13px; }
.ops-user { display: flex; align-items: center; gap: 10px; }
.user-meta { display: flex; flex-direction: column; line-height: 1.3; text-align: right; }
.user-meta b { font-size: 12px; }
.user-meta i { font-style: normal; font-size: 10px; color: var(--ws-admin-accent); font-weight: 800; }
.ops-avatar { background: var(--ws-brand); }
.ops-body { display: flex; flex: 1; align-items: stretch; }
.side-veil { position: fixed; inset: 0; background: rgb(0 0 0 / 0.6); z-index: 90; }
.side-nav { width: 248px; flex: none; background: var(--ws-admin-panel); border-right: 1px solid var(--ws-admin-line); padding: 16px 12px 24px; }
.side-nav nav { display: flex; flex-direction: column; gap: 2px; position: sticky; top: 76px; }
.nav-cap { margin: 14px 8px 6px; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #54678a; }
.nav-cap:first-child { margin-top: 0; }
.side-nav a { display: flex; align-items: center; gap: 11px; padding: 9px 10px; border-radius: 8px; color: var(--ws-admin-dim); font-size: 13px; font-weight: 600; text-decoration: none; }
.side-nav a:hover { background: var(--ws-admin-panel-2); color: #fff; }
.side-nav a.router-link-active { background: rgb(245 158 11 / 0.14); color: var(--ws-admin-accent); font-weight: 800; }
.ops-main { flex: 1; min-width: 0; padding: 28px 28px 80px; max-width: 1240px; }
@media (max-width: 992px) {
  .global-strip { display: none; }
  .menu-btn { display: inline-flex; }
  .ops-brand .ws-admin-badge { display: none; }
  .user-meta { display: none; }
  .side-nav { position: fixed; top: 0; left: -270px; bottom: 0; z-index: 100; width: 260px; transition: left 220ms ease; overflow-y: auto; }
  .side-nav.open { left: 0; }
  .side-nav nav { position: static; }
  .ops-main { padding: 18px 14px 64px; }
}
</style>
