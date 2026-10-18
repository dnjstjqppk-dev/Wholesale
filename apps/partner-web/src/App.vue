<template>
  <div class="partner-app">
    <!-- Top Global Switcher -->
    <div class="global-switcher-bar">
      <span>WHOLESALE 공급사 파트너 콘솔 (Seller Central)</span>
      <div class="links">
        <a href="https://wholesale.dnjstjqppk.workers.dev/" target="_blank">🛒 구매자 웹 콘솔 바로가기</a>
        <span class="sep">|</span>
        <a href="https://wholesale-admin.dnjstjqppk.workers.dev/" target="_blank">🛡️ 플랫폼 운영 관리자 콘솔</a>
        <span class="sep">|</span>
        <a href="https://wholesale-api.dnjstjqppk.workers.dev/v1/health" target="_blank">🔌 API 헬스체크</a>
      </div>
    </div>

    <header class="app-header">
      <div class="header-left">
        <router-link to="/" class="brand">WHOLESALE <span>Partner</span></router-link>
        <span class="verified-badge">✓ Verified Manufacturer (ISO 9001)</span>
      </div>
      <div class="header-right">
        <span class="org-name">Precision Korea (글로벌정밀산업)</span>
        <span class="role-pill">SUPPLIER_SALES</span>
      </div>
    </header>

    <div class="app-body">
      <aside class="sidebar">
        <nav class="nav-menu">
          <router-link to="/" class="nav-item">📊 대시보드 요약</router-link>
          <router-link to="/catalog" class="nav-item">🏷️ 도매 상품/구간단가 관리</router-link>
          <router-link to="/bulk-upload" class="nav-item">📁 CSV 대량 등록 (Dry-run)</router-link>
          <router-link to="/rfq-market" class="nav-item">⚡ 공개 RFQ 입찰 시장</router-link>
          <router-link to="/fulfillment" class="nav-item">🚢 수주 생산/분할출고 관리</router-link>
          <router-link to="/settlement" class="nav-item">💰 정산 원장 및 출금 관리</router-link>
        </nav>
      </aside>

      <main class="content-area">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.partner-app { display: flex; flex-direction: column; min-height: 100vh; background-color: #F6F8FB; }
.global-switcher-bar { background: #0F172A; color: #94A3B8; font-size: 11px; padding: 4px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1E293B; }
.global-switcher-bar .links { display: flex; gap: 10px; align-items: center; }
.global-switcher-bar a { color: #38BDF8; text-decoration: none; font-weight: 500; }
.global-switcher-bar .sep { color: #475569; }
.app-header { background: #172B4D; color: #FFF; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 12px; }
.brand { font-size: 18px; font-weight: 800; color: #FFF; text-decoration: none; }
.brand span { color: #C2410C; }
.verified-badge { background: #DCFCE7; color: #15803D; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
.header-right { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.role-pill { background: rgba(255,255,255,0.15); padding: 2px 6px; border-radius: 4px; font-size: 11px; }
.app-body { display: flex; flex: 1; }
.sidebar { width: 240px; background: #FFF; border-right: 1px solid #D8E0EB; padding: 20px 0; }
.nav-menu { display: flex; flex-direction: column; }
.nav-item { padding: 12px 24px; color: #42526E; text-decoration: none; font-size: 14px; font-weight: 600; border-left: 3px solid transparent; }
.nav-item:hover { background: #F8FAFC; color: #172B4D; }
.nav-item.router-link-exact-active { background: #FFEDD5; color: #C2410C; border-left-color: #C2410C; }
.content-area { flex: 1; padding: 32px; box-sizing: border-box; max-width: 1200px; }
</style>
