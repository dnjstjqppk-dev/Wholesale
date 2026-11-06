<template>
  <div class="partner-app">
    <div class="console-strip">
      <span>WHOLESALE 공급사 파트너 콘솔 · Seller Central</span>
      <div class="strip-links">
        <a href="https://wholesale.dnjstjqppk.workers.dev/" target="_blank"><WsIcon name="cart" :size="12" /> 구매자 콘솔</a>
        <a href="https://wholesale-admin.dnjstjqppk.workers.dev/" target="_blank"><WsIcon name="shield" :size="12" /> 관리자 콘솔</a>
        <a href="https://wholesale-api.dnjstjqppk.workers.dev/v1/health" target="_blank"><WsIcon name="bolt" :size="12" /> API 상태</a>
      </div>
    </div>

    <header class="console-header">
      <div class="console-brand">
        <button class="menu-btn" aria-label="메뉴 열기" @click="sidebarOpen = !sidebarOpen">
          <span></span><span></span><span></span>
        </button>
        <router-link to="/" class="ws-brand-lockup">
          <span class="ws-brand-mark">W</span>
          <span class="brand-word">WHOLESALE <i>Partner</i></span>
        </router-link>
        <span class="ws-badge ws-badge-success">Verified · ISO 9001 / SGS</span>
      </div>
      <div class="console-user">
        <span class="ws-avatar ws-avatar-sm ws-avatar-brand">{{ (user.organization?.legal_name || 'P').slice(0, 1) }}</span>
        <span class="user-meta">
          <b>{{ user.organization?.legal_name || 'Precision Korea Co., Ltd.' }}</b>
          <i>{{ user.role }}</i>
        </span>
      </div>
    </header>

    <div class="console-body">
      <div v-if="sidebarOpen" class="side-veil" @click="sidebarOpen = false"></div>
      <aside class="side-nav" :class="{ open: sidebarOpen }">
        <nav>
          <p class="nav-cap">비즈니스</p>
          <router-link to="/" @click="sidebarOpen = false"><WsIcon name="chart" :size="16" /> 대시보드</router-link>
          <router-link to="/analytics" @click="sidebarOpen = false"><WsIcon name="trend" :size="16" /> 애널리틱스</router-link>
          <router-link to="/verification" @click="sidebarOpen = false"><WsIcon name="shield" :size="16" /> 실사·인증 신청</router-link>
          <p class="nav-cap">상품·재고</p>
          <router-link to="/catalog" @click="sidebarOpen = false"><WsIcon name="tag" :size="16" /> 상품·구간단가</router-link>
          <router-link to="/bulk-upload" @click="sidebarOpen = false"><WsIcon name="file" :size="16" /> CSV 대량 등록</router-link>
          <router-link to="/inventory" @click="sidebarOpen = false"><WsIcon name="package" :size="16" /> 창고·재고 원장</router-link>
          <router-link to="/storefront" @click="sidebarOpen = false"><WsIcon name="layout" :size="16" /> 미니사이트 편집</router-link>
          <p class="nav-cap">영업·마케팅</p>
          <router-link to="/inquiries" @click="sidebarOpen = false"><WsIcon name="chat" :size="16" /> 바이어 인콰이어리</router-link>
          <router-link to="/rfq-market" @click="sidebarOpen = false"><WsIcon name="bolt" :size="16" /> 공개 RFQ 입찰</router-link>
          <router-link to="/marketing" @click="sidebarOpen = false"><WsIcon name="send" :size="16" /> 키워드 광고</router-link>
          <p class="nav-cap">이행·정산</p>
          <router-link to="/fulfillment" @click="sidebarOpen = false"><WsIcon name="truck" :size="16" /> 생산·분할출고</router-link>
          <router-link to="/settlement" @click="sidebarOpen = false"><WsIcon name="card" :size="16" /> 정산·출금</router-link>
        </nav>
      </aside>
      <main class="console-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import WsIcon from '@packages/ui/WsIcon.vue';
import { getCurrentUser } from './api';

const user = ref(getCurrentUser());
const sidebarOpen = ref(false);
</script>

<style scoped>
.partner-app { display: flex; flex-direction: column; min-height: 100vh; background: var(--ws-canvas); color: var(--ws-text); }
.console-strip { background: var(--ws-navy-ink); color: #8fa0b5; font-size: 11px; font-weight: 600; padding: 6px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.strip-links { display: flex; gap: 16px; }
.strip-links a { color: #7dd3fc; text-decoration: none; display: inline-flex; align-items: center; gap: 5px; }
.strip-links a:hover { text-decoration: underline; }
.console-header { background: #fff; border-bottom: 1px solid var(--ws-border-subtle); box-shadow: var(--ws-shadow-bar); padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; position: sticky; top: 0; z-index: 50; }
.console-brand { display: flex; align-items: center; gap: 12px; }
.menu-btn { display: none; background: none; border: 1px solid var(--ws-border); border-radius: 8px; width: 36px; height: 36px; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; }
.menu-btn span { width: 16px; height: 2px; background: var(--ws-text); border-radius: 2px; }
.brand-word { font-size: 16px; }
.brand-word i { font-style: normal; color: var(--ws-text-faint); font-weight: 600; font-size: 13px; }
.console-user { display: flex; align-items: center; gap: 10px; }
.user-meta { display: flex; flex-direction: column; line-height: 1.3; text-align: right; }
.user-meta b { font-size: 12px; }
.user-meta i { font-style: normal; font-size: 10px; color: var(--ws-text-muted); font-weight: 700; }
.console-body { display: flex; flex: 1; align-items: stretch; }
.side-veil { position: fixed; inset: 0; background: rgb(11 28 48 / 0.45); z-index: 90; }
.side-nav { width: 248px; flex: none; background: #fff; border-right: 1px solid var(--ws-border-subtle); padding: 16px 12px 24px; }
.side-nav nav { display: flex; flex-direction: column; gap: 2px; position: sticky; top: 76px; }
.nav-cap { margin: 14px 8px 6px; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ws-text-faint); }
.nav-cap:first-child { margin-top: 0; }
.side-nav a { display: flex; align-items: center; gap: 11px; padding: 9px 10px; border-radius: 8px; color: var(--ws-text-2); font-size: 13px; font-weight: 600; text-decoration: none; }
.side-nav a:hover { background: var(--ws-surface-muted); color: var(--ws-text); }
.side-nav a.router-link-active { background: var(--ws-navy); color: #fff; font-weight: 800; }
.console-main { flex: 1; min-width: 0; }
@media (max-width: 992px) {
  .console-strip { display: none; }
  .menu-btn { display: inline-flex; }
  .console-brand .ws-badge { display: none; }
  .user-meta { display: none; }
  .side-nav { position: fixed; top: 0; left: -270px; bottom: 0; z-index: 100; width: 260px; transition: left 220ms ease; box-shadow: var(--ws-shadow-pop); overflow-y: auto; }
  .side-nav.open { left: 0; }
  .side-nav nav { position: static; }
}
</style>
