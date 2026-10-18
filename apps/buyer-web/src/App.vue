<template>
  <div class="buyer-app">
    <header class="app-header">
      <div class="header-container">
        <div class="brand-section">
          <router-link to="/ko/KRW/" class="brand-logo">WHOLESALE</router-link>
          <span class="brand-badge">B2B Verified</span>
        </div>
        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="품목명, 제조사, 사양 규격을 검색하세요 (MOQ 필터 지원)..."
            @keyup.enter="handleSearch"
          />
          <button class="search-btn" @click="handleSearch">검색</button>
        </div>
        <div class="header-actions">
          <select v-model="selectedLocaleCurrency" class="locale-select" @change="changeLocale">
            <option value="ko/KRW">한국어 (KRW ₩)</option>
            <option value="en/USD">English (USD $)</option>
          </select>
          <router-link to="/ko/KRW/sourcing/rfq/new" class="nav-link highlight">RFQ 견적요청</router-link>
          <router-link to="/ko/KRW/orders" class="nav-link">발주·계약 관리</router-link>
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-view />
    </main>

    <footer class="app-footer">
      <div class="footer-container">
        <p>© 2026 WHOLESALE Enterprise B2B Platform. Incoterms® 2020 Registered.</p>
        <p class="sub">기업 식별 인증 · 에스크로 안전 결제 · 복식부기 원장 검증 플랫폼</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const searchQuery = ref('');
const selectedLocaleCurrency = ref('ko/KRW');

function handleSearch() {
  const [lang, curr] = selectedLocaleCurrency.value.split('/');
  router.push(`/${lang}/${curr}/catalog?q=${encodeURIComponent(searchQuery.value)}`);
}

function changeLocale() {
  const [lang, curr] = selectedLocaleCurrency.value.split('/');
  router.push(`/${lang}/${curr}/`);
}
</script>

<style scoped>
.buyer-app { display: flex; flex-direction: column; min-height: 100vh; }
.app-header { background-color: #173A5E; color: #FFFFFF; padding: 12px 24px; }
.header-container { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.brand-section { display: flex; align-items: center; gap: 8px; }
.brand-logo { color: #FFFFFF; font-size: 22px; font-weight: 800; text-decoration: none; letter-spacing: -0.5px; }
.brand-badge { background: #C2410C; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.search-bar { flex: 1; max-width: 550px; display: flex; }
.search-bar input { flex: 1; padding: 10px 14px; border: none; border-radius: 4px 0 0 4px; font-size: 14px; outline: none; }
.search-btn { background: #C2410C; color: #FFF; border: none; padding: 0 20px; font-weight: 700; border-radius: 0 4px 4px 0; cursor: pointer; }
.header-actions { display: flex; align-items: center; gap: 14px; }
.locale-select { background: rgba(255,255,255,0.15); color: #FFF; border: 1px solid rgba(255,255,255,0.3); padding: 6px 10px; border-radius: 4px; font-size: 13px; outline: none; }
.locale-select option { background: #173A5E; color: #FFF; }
.nav-link { color: #CBD5E1; text-decoration: none; font-size: 14px; font-weight: 600; }
.nav-link.highlight { color: #FFEDD5; }
.main-content { flex: 1; max-width: 1280px; margin: 0 auto; width: 100%; padding: 24px; box-sizing: border-box; }
.app-footer { background: #0F243B; color: #94A3B8; padding: 24px; text-align: center; font-size: 13px; }
.app-footer .sub { font-size: 12px; margin-top: 4px; color: #64748B; }
</style>

