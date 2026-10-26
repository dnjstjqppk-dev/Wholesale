<template>
  <div class="admin-app">
    <!-- Top Global Switcher -->
    <div class="global-switcher-bar">
      <span>WHOLESALE 플랫폼 운영 관리자 콘솔 (Platform Governance & Operations)</span>
      <div class="links">
        <a href="https://wholesale.dnjstjqppk.workers.dev/" target="_blank">🛒 구매자 웹 콘솔 바로가기</a>
        <span class="sep">|</span>
        <a href="https://wholesale-partner.dnjstjqppk.workers.dev/" target="_blank">🏭 공급사 파트너 콘솔 바로가기</a>
        <span class="sep">|</span>
        <a href="https://wholesale-api.dnjstjqppk.workers.dev/v1/health" target="_blank">🔌 API 헬스체크</a>
      </div>
    </div>

    <header class="app-header">
      <div class="header-left">
        <button class="mobile-toggle-btn" aria-label="관리자 메뉴 열기" @click="sidebarOpen = !sidebarOpen">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
        <router-link to="/" class="brand">WHOLESALE <span>Admin</span></router-link>
        <span class="env-pill">Zero Trust Secured</span>
      </div>
      <div class="header-right">
        <span class="admin-user">{{ currentUser.full_name }}</span>
        <span class="role-pill">{{ currentUser.role }}</span>
      </div>
    </header>

    <div class="app-body">
      <!-- Mobile Backdrop -->
      <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false"></div>

      <aside class="sidebar" :class="{ 'mobile-open': sidebarOpen }">
        <nav class="nav-menu">
          <router-link to="/" class="nav-item" @click="sidebarOpen = false">📊 종합 운영 관제 대시보드</router-link>
          <router-link to="/verifications" class="nav-item" @click="sidebarOpen = false">🏢 공급사 KYB 실사 심사</router-link>
          <router-link to="/moderation" class="nav-item" @click="sidebarOpen = false">🔍 상품/RFQ 모더레이션</router-link>
          <router-link to="/master-data" class="nav-item" @click="sidebarOpen = false">🌐 마스터 데이터 (표준/관세/환율)</router-link>
          <router-link to="/disputes" class="nav-item" @click="sidebarOpen = false">⚖️ 분쟁 중재 (Arbitration)</router-link>
          <router-link to="/ledger-audit" class="nav-item" @click="sidebarOpen = false">📖 복식부기 원장 감사</router-link>
          <router-link to="/reconciliation" class="nav-item" @click="sidebarOpen = false">⚡ PG 일일 결제 대사</router-link>
          <router-link to="/settlements" class="nav-item" @click="sidebarOpen = false">💰 정산 이중통제 승인 (SoD)</router-link>
          <router-link to="/audit" class="nav-item" @click="sidebarOpen = false">🔒 불변 보안 감사 로그</router-link>
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
import { getCurrentUser } from './api';

const currentUser = ref(getCurrentUser());
const sidebarOpen = ref(false);
</script>

<style scoped>
.admin-app { display: flex; flex-direction: column; min-height: 100vh; background-color: #0B132B; color: #E2E8F0; }
.global-switcher-bar { background: #070B19; color: #64748B; font-size: 11px; padding: 4px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1C2541; }
.global-switcher-bar .links { display: flex; gap: 10px; align-items: center; }
.global-switcher-bar a { color: #38BDF8; text-decoration: none; font-weight: 500; }
.global-switcher-bar .sep { color: #334155; }
.app-header { background: #1C2541; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #3A506B; }
.header-left { display: flex; align-items: center; gap: 12px; }
.brand { font-size: 18px; font-weight: 800; color: #FFF; text-decoration: none; }
.brand span { color: #C2410C; }
.env-pill { background: #3B82F6; color: #FFF; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.header-right { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.role-pill { background: #DC2626; color: #FFF; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; }
.app-body { display: flex; flex: 1; position: relative; }
.sidebar { width: 250px; background: #1C2541; border-right: 1px solid #3A506B; padding: 20px 0; flex-shrink: 0; }
.nav-menu { display: flex; flex-direction: column; }
.nav-item { padding: 12px 20px; color: #94A3B8; text-decoration: none; font-size: 13px; font-weight: 600; border-left: 3px solid transparent; }
.nav-item:hover { background: #0B132B; color: #FFF; }
.nav-item.router-link-exact-active { background: #0B132B; color: #38BDF8; border-left-color: #38BDF8; }
.content-area { flex: 1; padding: 32px; box-sizing: border-box; max-width: 1240px; background: #0B132B; overflow-x: hidden; }

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
  background: #E2E8F0;
  border-radius: 2px;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 100;
  backdrop-filter: blur(2px);
}

@media (max-width: 992px) {
  .global-switcher-bar {
    display: none;
  }
  .env-pill {
    display: none;
  }
  .admin-user {
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
    box-shadow: 4px 0 15px rgba(0,0,0,0.3);
    transition: left 0.25s ease;
  }
  .sidebar.mobile-open {
    left: 0;
  }
  .content-area {
    padding: 16px 12px;
  }
}
</style>
