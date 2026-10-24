<template>
  <div class="buyer-app">
    <!-- Top Utility Bar -->
    <div class="top-utility-bar">
      <div class="utility-container">
        <div class="util-left">
          <span class="util-text">{{ t('platform_title', currentLocale) }}</span>
        </div>
        <div class="util-right">
          <div class="locale-switcher">
            <span class="flag-icon">🌐</span>
            <select v-model="selectedLocaleCurrency" class="mini-select" @change="changeLocale">
              <option value="ko/KRW">한국어 (KRW ₩)</option>
              <option value="en/USD">English (USD $)</option>
              <option value="zh/CNY">中文 (CNY ¥)</option>
              <option value="zh/USD">中文 (USD $)</option>
              <option value="ja/JPY">日本語 (JPY ¥)</option>
              <option value="ja/USD">日本語 (USD $)</option>
            </select>
          </div>
          <span class="divider">|</span>
          <a href="https://wholesale-partner.dnjstjqppk.workers.dev/" target="_blank" class="util-link partner-link">
            🏭 {{ t('seller_central', currentLocale) }}
          </a>
          <span class="divider">|</span>
          <a href="https://wholesale-admin.dnjstjqppk.workers.dev/" target="_blank" class="util-link admin-link">
            🛡️ {{ t('admin_console', currentLocale) }}
          </a>
          <span class="divider">|</span>
          <router-link :to="`/${currentLocale}/${currentCurrency}/login`" class="util-link">
            🔐 계정 전환 / 로그인
          </router-link>
        </div>
      </div>
    </div>

    <!-- Main Global Header (Alibaba.com High-Fidelity Style) -->
    <header class="app-header">
      <div class="header-container">
        <!-- Logo -->
        <div class="brand-section">
          <router-link :to="`/${currentLocale}/${currentCurrency}/`" class="brand-logo">
            <span class="logo-accent">WHOLESALE</span><span class="logo-sub">.com</span>
          </router-link>
          <div class="assurance-tag">
            <span class="shield-icon">🛡️</span>
            <span>Trade Assurance</span>
          </div>
        </div>

        <!-- Search Bar with Search Type & Camera Image Search -->
        <div class="search-bar-wrapper">
          <div class="search-type-select">
            <select v-model="searchType">
              <option value="products">{{ t('search_products', currentLocale) }}</option>
              <option value="suppliers">{{ t('search_suppliers', currentLocale) }}</option>
              <option value="rfq">{{ t('search_rfq', currentLocale) }}</option>
            </select>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('search_placeholder', currentLocale)"
            @keyup.enter="handleSearch"
          />
          <button class="camera-btn" title="AI 비전 이미지로 도매 품목 찾기" @click="showImageSearchModal = true">
            📷
          </button>
          <button class="search-submit-btn" @click="handleSearch">
            <span class="search-icon">🔍</span> {{ t('search_btn', currentLocale) }}
          </button>
        </div>

        <!-- Header Actions -->
        <div class="header-actions">
          <router-link :to="`/${currentLocale}/${currentCurrency}/sourcing/rfq/new`" class="rfq-cta-btn">
            ✍️ {{ t('rfq_cta', currentLocale) }}
          </router-link>
          <router-link :to="`/${currentLocale}/${currentCurrency}/messages`" class="nav-icon-link">
            <span class="icon">💬</span>
            <span class="label">1:1 메시지</span>
          </router-link>
          <router-link :to="`/${currentLocale}/${currentCurrency}/cart`" class="nav-icon-link">
            <span class="icon">🛒</span>
            <span class="label">{{ t('cart', currentLocale) }}</span>
          </router-link>
          <router-link :to="`/${currentLocale}/${currentCurrency}/orders`" class="nav-icon-link">
            <span class="icon">📦</span>
            <span class="label">{{ t('orders', currentLocale) }}</span>
          </router-link>
          <router-link :to="`/${currentLocale}/${currentCurrency}/login`" class="user-profile-badge">
            <span class="user-avatar">🏢</span>
            <div class="user-text">
              <span class="corp-name">{{ currentUser.organization?.legal_name?.slice(0, 16) || 'Metro Wholesale' }}</span>
              <span class="role-tag">{{ currentUser.role }}</span>
            </div>
          </router-link>
        </div>
      </div>
    </header>

    <!-- Mega Category Bar & Flyout Navigation -->
    <MegaFlyoutNav @select-category="filterByCategory" />

    <!-- Main View Content -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <div class="footer-container">
        <div class="footer-columns">
          <div class="col">
            <h4>Trade Assurance 무역보증</h4>
            <p>선급금 및 잔금 100% 에스크로 보호</p>
            <p>생산 지연 및 품질 규격 불일치 시 환불 보장</p>
            <p>공인 검수 기관(SGS/TÜV) 현장 실사 연계</p>
          </div>
          <div class="col">
            <h4>B2B 도매 계약 및 결제</h4>
            <p>SHA-256 전자계약서 위변조 방지</p>
            <p>복식부기 실시간 무결성 원장 분개</p>
            <p>Incoterms® 2020 표준 무역 조건 준수</p>
          </div>
          <div class="col">
            <h4>멀티 콘솔 독립 연동</h4>
            <p><router-link :to="`/${currentLocale}/${currentCurrency}/`">구매자 웹 콘솔 (Buyer)</router-link></p>
            <p><a href="https://wholesale-partner.dnjstjqppk.workers.dev/" target="_blank">공급사 파트너 콘솔 (Partner)</a></p>
            <p><a href="https://wholesale-admin.dnjstjqppk.workers.dev/" target="_blank">운영 관리자 콘솔 (Admin)</a></p>
            <p><a href="https://wholesale-api.dnjstjqppk.workers.dev/" target="_blank">공통 API 게이트웨이 (API)</a></p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© 2026 WHOLESALE B2B Enterprise Commerce Platform. All Rights Reserved.</p>
          <p class="sub">고유 도메인 독립 배포 · 클라우드플레어 엣지 글로벌 네트워크 가동</p>
        </div>
      </div>
    </footer>

    <!-- Image Search Modal -->
    <ImageSearchModal
      v-model="showImageSearchModal"
      @search-matched="applyImageSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import MegaFlyoutNav from './components/MegaFlyoutNav.vue';
import ImageSearchModal from './components/ImageSearchModal.vue';
import { t, SupportedLocale, SupportedCurrency } from './i18n';
import { getCurrentUser } from './api';

const router = useRouter();
const route = useRoute();

const searchQuery = ref('');
const searchType = ref('products');
const selectedLocaleCurrency = ref('ko/KRW');
const showImageSearchModal = ref(false);
const currentUser = ref(getCurrentUser());

const currentLocale = computed<SupportedLocale>(() => {
  const loc = (route.params.locale as string) || selectedLocaleCurrency.value.split('/')[0] || 'ko';
  return ['ko', 'en', 'zh', 'ja'].includes(loc) ? (loc as SupportedLocale) : 'ko';
});

const currentCurrency = computed<SupportedCurrency>(() => {
  const cur = (route.params.currency as string) || selectedLocaleCurrency.value.split('/')[1] || 'KRW';
  return ['KRW', 'USD', 'CNY', 'JPY'].includes(cur) ? (cur as SupportedCurrency) : 'KRW';
});

watch(
  () => [route.params.locale, route.params.currency],
  ([loc, cur]) => {
    if (loc && cur) {
      selectedLocaleCurrency.value = `${loc}/${cur}`;
    }
  },
  { immediate: true }
);

onMounted(() => {
  window.addEventListener('auth-changed', () => {
    currentUser.value = getCurrentUser();
  });
});

function handleSearch() {
  const [lang, curr] = selectedLocaleCurrency.value.split('/');
  if (searchType.value === 'rfq') {
    router.push(`/${lang}/${curr}/sourcing/rfq/new?title=${encodeURIComponent(searchQuery.value)}`);
    return;
  }
  router.push(`/${lang}/${curr}/catalog?q=${encodeURIComponent(searchQuery.value)}&type=${searchType.value}`);
}

function filterByCategory(catId: string) {
  const [lang, curr] = selectedLocaleCurrency.value.split('/');
  router.push(`/${lang}/${curr}/catalog?category=${catId}`);
}

function changeLocale() {
  const [lang, curr] = selectedLocaleCurrency.value.split('/');
  const subPath = route.path.replace(/^\/(ko|en|zh|ja)\/(KRW|USD|CNY|JPY)/, '') || '/';
  router.push({
    path: `/${lang}/${curr}${subPath.startsWith('/') ? subPath : '/' + subPath}`,
    query: route.query,
  });
}

function applyImageSearch(query: string) {
  const [lang, curr] = selectedLocaleCurrency.value.split('/');
  router.push(`/${lang}/${curr}/catalog?q=${encodeURIComponent(query || '스테인리스')}`);
}
</script>

<style scoped>
.buyer-app { display: flex; flex-direction: column; min-height: 100vh; background-color: #F4F6F9; color: #111827; }
.top-utility-bar { background-color: #F8FAFC; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B; padding: 6px 24px; }
.utility-container { max-width: 1360px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
.util-right { display: flex; align-items: center; gap: 12px; }
.mini-select { background: transparent; border: 1px solid #CBD5E1; border-radius: 4px; font-size: 11px; padding: 2px 6px; color: #334155; }
.divider { color: #CBD5E1; }
.util-link { color: #64748B; text-decoration: none; font-weight: 500; cursor: pointer; }
.partner-link { color: #EA580C; font-weight: 600; }
.admin-link { color: #2563EB; font-weight: 600; }

.app-header { background-color: #FFFFFF; border-bottom: 1px solid #E5E7EB; padding: 16px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.header-container { max-width: 1360px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.brand-section { display: flex; align-items: center; gap: 12px; }
.brand-logo { font-size: 26px; font-weight: 900; text-decoration: none; letter-spacing: -0.5px; }
.logo-accent { color: #FF6600; }
.logo-sub { color: #1F2937; font-size: 18px; }
.assurance-tag { display: flex; align-items: center; gap: 4px; background: #FFF7ED; border: 1px solid #FDBA74; color: #C2410C; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }

.search-bar-wrapper { flex: 1; max-width: 640px; display: flex; align-items: center; border: 2px solid #FF6600; border-radius: 24px; overflow: hidden; background: #FFF; }
.search-type-select select { background: #F8FAFC; border: none; border-right: 1px solid #E2E8F0; padding: 10px 14px; font-size: 13px; font-weight: 600; color: #334155; outline: none; cursor: pointer; }
.search-bar-wrapper input { flex: 1; border: none; padding: 10px 14px; font-size: 14px; outline: none; }
.camera-btn { background: transparent; border: none; font-size: 16px; padding: 0 10px; cursor: pointer; opacity: 0.7; }
.camera-btn:hover { opacity: 1; }
.search-submit-btn { background: #FF6600; color: #FFF; border: none; padding: 10px 22px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background 0.2s; }
.search-submit-btn:hover { background: #E65C00; }

.header-actions { display: flex; align-items: center; gap: 16px; }
.rfq-cta-btn { background: #1E293B; color: #FFF; text-decoration: none; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
.rfq-cta-btn:hover { background: #0F172A; }
.nav-icon-link { display: flex; flex-direction: column; align-items: center; text-decoration: none; color: #475569; font-size: 11px; font-weight: 600; }
.nav-icon-link .icon { font-size: 18px; }
.user-profile-badge { display: flex; align-items: center; gap: 8px; border-left: 1px solid #E2E8F0; padding-left: 14px; text-decoration: none; }
.user-avatar { font-size: 24px; background: #F1F5F9; border-radius: 50%; padding: 4px; }
.user-text { display: flex; flex-direction: column; font-size: 12px; }
.corp-name { font-weight: 700; color: #1E293B; }
.role-tag { font-size: 10px; color: #15803D; font-weight: 700; }

.main-content { flex: 1; max-width: 1360px; margin: 0 auto; width: 100%; padding: 24px 20px; box-sizing: border-box; }

.app-footer { background: #1E293B; color: #CBD5E1; padding: 48px 24px 32px 24px; margin-top: 48px; border-top: 1px solid #334155; }
.footer-container { max-width: 1360px; margin: 0 auto; }
.footer-columns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-bottom: 32px; }
.footer-columns h4 { color: #FFFFFF; font-size: 16px; margin-top: 0; margin-bottom: 16px; font-weight: 700; }
.footer-columns p { margin: 6px 0; font-size: 13px; color: #94A3B8; }
.footer-columns a { color: #38BDF8; text-decoration: none; font-weight: 500; }
.footer-bottom { border-top: 1px solid #334155; padding-top: 24px; text-align: center; font-size: 13px; color: #64748B; }
.footer-bottom .sub { font-size: 12px; margin-top: 4px; }
</style>
