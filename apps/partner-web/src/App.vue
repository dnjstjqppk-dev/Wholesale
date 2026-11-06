<template>
  <div class="partner-app">
    <!-- Top Global Switcher -->
    <div class="global-switcher-bar">
      <span>WHOLESALE 공급사 파트너 콘솔 (Alibaba.com Seller Central)</span>
      <div class="links">
        <a href="https://wholesale.dnjstjqppk.workers.dev/" target="_blank"><WsIcon name="cart" :size="12" /> 구매자 웹 콘솔 바로가기</a>
        <span class="sep">|</span>
        <a href="https://wholesale-admin.dnjstjqppk.workers.dev/" target="_blank"><WsIcon name="shield" :size="12" /> 플랫폼 운영 관리자 콘솔</a>
        <span class="sep">|</span>
        <a href="https://wholesale-api.dnjstjqppk.workers.dev/v1/health" target="_blank"><WsIcon name="bolt" :size="12" /> API 헬스체크</a>
      </div>
    </div>

    <header class="app-header">
      <div class="header-left">
        <button class="mobile-toggle-btn" aria-label="메뉴 열기" @click="sidebarOpen = !sidebarOpen">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
        <router-link to="/" class="brand">WHOLESALE <span>Partner</span></router-link>
        <span class="verified-badge">✓ Verified Manufacturer (ISO 9001 / SGS Audited)</span>
      </div>
      <div class="header-right">
        <span class="org-name">{{ user.organization?.legal_name || 'Precision Korea Co., Ltd.' }}</span>
        <span class="role-pill">{{ user.role }}</span>
      </div>
    </header>

    <div class="app-body">
      <!-- Mobile Backdrop -->
      <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false"></div>

      <aside class="sidebar" :class="{ 'mobile-open': sidebarOpen }">
        <nav class="nav-menu">
          <router-link to="/" class="nav-item" @click="sidebarOpen = false"><WsIcon name="chart" :size="15" /> 실시간 비즈니스 대시보드</router-link>
          <router-link to="/verification" class="nav-item" @click="sidebarOpen = false"><WsIcon name="shield" :size="15" /> Verified 실사/인증 신청</router-link>
          <router-link to="/catalog" class="nav-item" @click="sidebarOpen = false"><WsIcon name="tag" :size="15" /> 도매 상품 CRUD & 구간단가</router-link>
          <router-link to="/storefront" class="nav-item" @click="sidebarOpen = false"><WsIcon name="layout" :size="15" /> 미니사이트(Storefront) 편집</router-link>
          <router-link to="/bulk-upload" class="nav-item" @click="sidebarOpen = false"><WsIcon name="file" :size="15" /> CSV 대량 등록 (Dry-run)</router-link>
          <router-link to="/inventory" class="nav-item" @click="sidebarOpen = false"><WsIcon name="package" :size="15" /> 창고·재고 원장 관리</router-link>
          <router-link to="/inquiries" class="nav-item" @click="sidebarOpen = false"><WsIcon name="chat" :size="15" /> 바이어 1:1 인콰이어리</router-link>
          <router-link to="/rfq-market" class="nav-item" @click="sidebarOpen = false"><WsIcon name="bolt" :size="15" /> 공개 RFQ 입찰 시장</router-link>
          <router-link to="/marketing" class="nav-item" @click="sidebarOpen = false"><WsIcon name="send" :size="15" /> 키워드 광고(KWA) 관리</router-link>
          <router-link to="/analytics" class="nav-item" @click="sidebarOpen = false"><WsIcon name="trend" :size="15" /> 비즈니스 애널리틱스</router-link>
          <router-link to="/fulfillment" class="nav-item" @click="sidebarOpen = false"><WsIcon name="truck" :size="15" /> 수주 생산/분할출고 관리</router-link>
          <router-link to="/settlement" class="nav-item" @click="sidebarOpen = false"><WsIcon name="card" :size="15" /> 정산 원장 및 출금 관리</router-link>
        </nav>
      </aside>

      <main class="content-area">
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
.partner-app { display: flex; flex-direction: column; min-height: 100vh; background-color: var(--ws-canvas); }
.global-switcher-bar { background: var(--ws-admin-bg); color: var(--ws-admin-dim); font-size: 11px; padding: 4px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--ws-text); }
.global-switcher-bar .links { display: flex; gap: 10px; align-items: center; }
.global-switcher-bar a { color: var(--ws-admin-link); text-decoration: none; font-weight: 500; }
.global-switcher-bar .sep { color: var(--ws-text-2); }
.app-header { background: var(--ws-text); color: var(--ws-surface); padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 12px; }
.brand { font-size: 18px; font-weight: 800; color: var(--ws-surface); text-decoration: none; }
.brand span { color: var(--ws-brand); }
.verified-badge { background: var(--ws-success-bg); color: var(--ws-success); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
.header-right { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.role-pill { background: rgba(255,255,255,0.15); padding: 2px 6px; border-radius: 4px; font-size: 11px; }
.app-body { display: flex; flex: 1; position: relative; }
.sidebar { width: 250px; background: var(--ws-surface); border-right: 1px solid var(--ws-border); padding: 20px 0; flex-shrink: 0; }
.nav-menu { display: flex; flex-direction: column; }
.nav-item { padding: 12px 20px; color: var(--ws-text-2); text-decoration: none; font-size: 13px; font-weight: 600; border-left: 3px solid transparent; display: flex; align-items: center; gap: 10px; }
.nav-item:hover, .nav-item.router-link-active { background: var(--ws-brand-light); color: var(--ws-brand); border-left-color: var(--ws-brand); }
.content-area { flex: 1; overflow-x: hidden; }

.mobile-toggle-btn {
  display: none;
  background: transparent;
  border: none;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  padding: 4px;
}
.mobile-toggle-btn .bar {
  width: 20px;
  height: 2px;
  background: white;
  border-radius: 2px;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  backdrop-filter: blur(2px);
}

@media (max-width: 992px) {
  .global-switcher-bar {
    display: none;
  }
  .verified-badge {
    display: none;
  }
  .mobile-toggle-btn {
    display: flex;
  }
  .sidebar {
    position: fixed;
    top: 50px;
    left: -260px;
    bottom: 0;
    width: 250px;
    z-index: 101;
    box-shadow: 4px 0 15px rgba(0,0,0,0.1);
    transition: left 0.25s ease;
  }
  .sidebar.mobile-open {
    left: 0;
  }
  .org-name {
    display: none;
  }
  .content-area {
    padding: 16px 12px;
  }
}
</style>
