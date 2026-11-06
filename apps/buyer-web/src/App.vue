<template>
  <div class="buyer-app">
    <!-- Top utility strip -->
    <div class="util-strip">
      <div class="util-inner">
        <p class="util-claim">{{ t('platform_title', currentLocale) }}</p>
        <div class="util-right">
          <span class="util-locale">
            <WsIcon name="globe" :size="14" />
            <select v-model="selectedLocaleCurrency" class="util-select" aria-label="Language and currency" @change="changeLocale">
              <option value="ko/KRW">한국어 · KRW ₩</option>
              <option value="en/USD">English · USD $</option>
              <option value="zh/CNY">中文 · CNY ¥</option>
              <option value="zh/USD">中文 · USD $</option>
              <option value="ja/JPY">日本語 · JPY ¥</option>
              <option value="ja/USD">日本語 · USD $</option>
            </select>
          </span>
          <a href="https://wholesale-partner.dnjstjqppk.workers.dev/" target="_blank" class="util-link">
            <WsIcon name="factory" :size="13" /> {{ t('seller_central', currentLocale) }}
          </a>
          <a href="https://wholesale-admin.dnjstjqppk.workers.dev/" target="_blank" class="util-link">
            <WsIcon name="shield" :size="13" /> {{ t('admin_console', currentLocale) }}
          </a>
          <router-link :to="`/${currentLocale}/${currentCurrency}/login`" class="util-link util-login">
            <WsIcon name="lock" :size="13" /> 계정 전환 / 로그인
          </router-link>
        </div>
      </div>
    </div>

    <!-- Main header -->
    <header class="site-header">
      <div class="header-inner">
        <div class="brand-zone">
          <button class="menu-btn" aria-label="메뉴 열기" @click="mobileDrawerOpen = !mobileDrawerOpen">
            <span></span><span></span><span></span>
          </button>
          <router-link :to="`/${currentLocale}/${currentCurrency}/`" class="ws-brand-lockup">
            <span class="ws-brand-mark">W</span>
            <span class="ws-brand-main">WHOLESALE</span>
          </router-link>
          <span class="assurance-pill"><WsIcon name="shield" :size="12" /> Trade Assurance</span>
        </div>

        <div class="search-zone">
          <div class="search-tabs" role="tablist" aria-label="검색 대상">
            <button role="tab" :class="{ active: searchType === 'products' }" @click="searchType = 'products'">{{ t('search_products', currentLocale) }}</button>
            <button role="tab" :class="{ active: searchType === 'suppliers' }" @click="searchType = 'suppliers'">{{ t('search_suppliers', currentLocale) }}</button>
            <button role="tab" :class="{ active: searchType === 'rfq' }" @click="searchType = 'rfq'">{{ t('search_rfq', currentLocale) }}</button>
          </div>
          <div class="search-box">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('search_placeholder', currentLocale)"
              @keyup.enter="handleSearch"
            />
            <button class="search-cam" title="AI 비전 이미지로 도매 품목 찾기" aria-label="이미지로 검색" @click="showImageSearchModal = true">
              <WsIcon name="camera" :size="18" />
            </button>
            <button class="search-go" @click="handleSearch">
              <WsIcon name="search" :size="15" /> {{ t('search_btn', currentLocale) }}
            </button>
          </div>
        </div>

        <div class="action-zone">
          <router-link :to="`/${currentLocale}/${currentCurrency}/sourcing/rfq/new`" class="rfq-cta">
            <WsIcon name="send" :size="14" /> {{ t('rfq_cta', currentLocale) }}
          </router-link>
          <router-link :to="`/${currentLocale}/${currentCurrency}/messages`" class="h-icon" :title="'1:1 메시지'">
            <WsIcon name="chat" :size="20" /><span>1:1 메시지</span>
          </router-link>
          <router-link :to="`/${currentLocale}/${currentCurrency}/cart`" class="h-icon" :title="t('cart', currentLocale)">
            <WsIcon name="cart" :size="20" /><span>{{ t('cart', currentLocale) }}</span>
          </router-link>
          <router-link :to="`/${currentLocale}/${currentCurrency}/orders`" class="h-icon" :title="t('orders', currentLocale)">
            <WsIcon name="package" :size="20" /><span>{{ t('orders', currentLocale) }}</span>
          </router-link>
          <div class="notif-zone">
            <button class="h-icon notif-btn" title="실시간 무역 통보" @click="notifDrawerOpen = !notifDrawerOpen">
              <WsIcon name="bell" :size="20" />
              <span v-if="unreadNotifsCount > 0" class="notif-count">{{ unreadNotifsCount }}</span>
              <span>알림</span>
            </button>
            <div v-if="notifDrawerOpen" class="notif-pop">
              <div class="notif-pop-head">
                <b>실시간 무역 통보 센터</b>
                <button class="notif-read-all" @click="markAllNotifsRead">모두 읽음</button>
              </div>
              <div v-if="liveNotifs.length === 0" class="notif-empty">새로운 알림이 없습니다.</div>
              <div v-else class="notif-list">
                <div v-for="n in liveNotifs" :key="n.id" class="notif-row" :class="{ unread: !n.is_read }">
                  <div class="notif-row-top">
                    <span class="notif-title">{{ n.title }}</span>
                    <span class="notif-time">{{ formatTime(n.created_at) }}</span>
                  </div>
                  <p class="notif-msg">{{ n.message }}</p>
                </div>
              </div>
            </div>
          </div>
          <router-link :to="`/${currentLocale}/${currentCurrency}/my-alibaba/profile`" class="user-chip">
            <span class="ws-avatar ws-avatar-sm"><WsIcon name="building" :size="16" /></span>
            <span class="user-meta">
              <b>{{ currentUser.organization?.legal_name?.slice(0, 16) || 'Metro Wholesale' }}</b>
              <i>{{ currentUser.role }}</i>
            </span>
          </router-link>
        </div>
      </div>
    </header>

    <MegaFlyoutNav @select-category="filterByCategory" />

    <main class="main-content">
      <router-view />
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-grid">
          <div class="footer-brand">
            <span class="ws-brand-lockup footer-lockup">
              <span class="ws-brand-mark">W</span>
              <span class="ws-brand-main">WHOLESALE</span>
            </span>
            <p>계약 신뢰 위에 서는 B2B 도매 무역 플랫폼. 에스크로·전자계약·이중승인으로 모든 거래를 확정한다.</p>
          </div>
          <div class="footer-col">
            <h4>Trade Assurance 무역보증</h4>
            <p>선급금 및 잔금 100% 에스크로 보호</p>
            <p>생산 지연·품질 불일치 시 환불 보장</p>
            <p>공인 검수 기관(SGS/TÜV) 현장 실사 연계</p>
          </div>
          <div class="footer-col">
            <h4>B2B 계약 및 결제</h4>
            <p>SHA-256 전자계약서 위변조 방지</p>
            <p>복식부기 실시간 무결성 원장 분개</p>
            <p>Incoterms® 2020 표준 무역 조건 준수</p>
          </div>
          <div class="footer-col">
            <h4>콘솔 바로가기</h4>
            <p><router-link :to="`/${currentLocale}/${currentCurrency}/`">구매자 웹 콘솔 (Buyer)</router-link></p>
            <p><a href="https://wholesale-partner.dnjstjqppk.workers.dev/" target="_blank">공급사 파트너 콘솔 (Partner)</a></p>
            <p><a href="https://wholesale-admin.dnjstjqppk.workers.dev/" target="_blank">운영 관리자 콘솔 (Admin)</a></p>
            <p><a href="https://wholesale-api.dnjstjqppk.workers.dev/" target="_blank">공통 API 게이트웨이 (API)</a></p>
          </div>
        </div>
        <div class="footer-legal">
          <p>
            <router-link :to="`/${currentLocale}/${currentCurrency}/terms`">이용약관</router-link>
            <span aria-hidden="true">·</span>
            <router-link :to="`/${currentLocale}/${currentCurrency}/privacy`">개인정보처리방침</router-link>
          </p>
          <p>© 2026 WHOLESALE B2B Enterprise Commerce Platform. All Rights Reserved.</p>
        </div>
      </div>
    </footer>

    <div v-if="mobileDrawerOpen" class="drawer-veil" @click="mobileDrawerOpen = false"></div>
    <aside class="drawer" :class="{ open: mobileDrawerOpen }">
      <div class="drawer-head">
        <span class="ws-brand-lockup"><span class="ws-brand-mark">W</span><span class="ws-brand-main">WHOLESALE</span></span>
        <button class="drawer-x" aria-label="메뉴 닫기" @click="mobileDrawerOpen = false">×</button>
      </div>
      <div class="drawer-user">
        <span class="ws-avatar ws-avatar-sm"><WsIcon name="building" :size="16" /></span>
        <div>
          <b>{{ currentUser.organization?.legal_name || 'Metro Wholesale Imports' }}</b>
          <span>{{ currentUser.role }}</span>
        </div>
      </div>
      <nav class="drawer-nav">
        <router-link :to="`/${currentLocale}/${currentCurrency}/catalog`" @click="mobileDrawerOpen = false">
          <WsIcon name="tag" :size="16" /> 도매 상품 카탈로그
        </router-link>
        <router-link :to="`/${currentLocale}/${currentCurrency}/suppliers`" @click="mobileDrawerOpen = false">
          <WsIcon name="factory" :size="16" /> 검증 제조사 디렉토리 (Verified)
        </router-link>
        <router-link :to="`/${currentLocale}/${currentCurrency}/sourcing/rfqs`" @click="mobileDrawerOpen = false">
          <WsIcon name="bolt" :size="16" /> 구매 요청서(RFQ) 및 복수 견적
        </router-link>
        <router-link :to="`/${currentLocale}/${currentCurrency}/sourcing/rfq/new`" class="drawer-accent" @click="mobileDrawerOpen = false">
          <WsIcon name="send" :size="16" /> 신규 RFQ 소싱 요청 발행
        </router-link>
        <router-link :to="`/${currentLocale}/${currentCurrency}/messages`" @click="mobileDrawerOpen = false">
          <WsIcon name="chat" :size="16" /> 1:1 제조사 메신저 상담
        </router-link>
        <router-link :to="`/${currentLocale}/${currentCurrency}/cart`" @click="mobileDrawerOpen = false">
          <WsIcon name="cart" :size="16" /> 도매 장바구니
        </router-link>
        <router-link :to="`/${currentLocale}/${currentCurrency}/orders`" @click="mobileDrawerOpen = false">
          <WsIcon name="package" :size="16" /> 발주 및 무역 이행 관리 (Orders)
        </router-link>
        <router-link :to="`/${currentLocale}/${currentCurrency}/my-alibaba/profile`" @click="mobileDrawerOpen = false">
          <WsIcon name="gear" :size="16" /> 기업 프로필 및 권한(SoD) 관리
        </router-link>
      </nav>
      <div class="drawer-foot">
        <a href="https://wholesale-partner.dnjstjqppk.workers.dev/" target="_blank" class="drawer-ext go-partner">
          <WsIcon name="factory" :size="14" /> 공급사 셀러 콘솔 바로가기
        </a>
        <a href="https://wholesale-admin.dnjstjqppk.workers.dev/" target="_blank" class="drawer-ext go-admin">
          <WsIcon name="shield" :size="14" /> 플랫폼 운영 관리자 콘솔
        </a>
      </div>
    </aside>

    <ImageSearchModal
      v-model="showImageSearchModal"
      @search-matched="applyImageSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import WsIcon from '@packages/ui/WsIcon.vue';
import MegaFlyoutNav from './components/MegaFlyoutNav.vue';
import ImageSearchModal from './components/ImageSearchModal.vue';
import { t, SupportedLocale, SupportedCurrency, loadFxRates } from './i18n';
import { getCurrentUser, apiRequest } from './api';

const router = useRouter();
const route = useRoute();

const searchQuery = ref('');
const searchType = ref('products');
const selectedLocaleCurrency = ref('ko/KRW');
const showImageSearchModal = ref(false);
const mobileDrawerOpen = ref(false);
const currentUser = ref(getCurrentUser());

const notifDrawerOpen = ref(false);
const liveNotifs = ref<any[]>([]);

const unreadNotifsCount = computed(() => {
  return liveNotifs.value.filter(n => !n.is_read).length;
});

async function fetchNotifications() {
  try {
    const res = await apiRequest('/notifications');
    if (res && res.notifications) {
      liveNotifs.value = res.notifications;
    }
  } catch (_) {}
}

async function markAllNotifsRead() {
  for (const n of liveNotifs.value) {
    if (!n.is_read) {
      n.is_read = true;
      apiRequest(`/notifications/${n.id}/read`, { method: 'PUT' }).catch(() => {});
    }
  }
}

function formatTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

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
  // Load real-time FX rates from API (falls back to static rates on failure)
  loadFxRates();
  // Fetch real-time trade notifications
  fetchNotifications();
  setInterval(fetchNotifications, 15000);
});

function handleSearch() {
  const [lang, curr] = selectedLocaleCurrency.value.split('/');
  if (searchType.value === 'suppliers') {
    router.push(`/${lang}/${curr}/suppliers?q=${encodeURIComponent(searchQuery.value)}`);
    return;
  }
  if (searchType.value === 'rfq') {
    router.push(`/${lang}/${curr}/sourcing/rfqs?q=${encodeURIComponent(searchQuery.value)}`);
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
.buyer-app { display: flex; flex-direction: column; min-height: 100vh; background: var(--ws-canvas); color: var(--ws-text); }

/* Utility strip */
.util-strip { background: var(--ws-strip-bg); color: var(--ws-strip-text); font-size: 12px; border-bottom: 1px solid #e2e4e8; }
.util-inner { max-width: 1360px; margin: 0 auto; padding: 7px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.util-claim { margin: 0; font-weight: 600; letter-spacing: 0.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.util-right { display: flex; align-items: center; gap: 18px; flex: none; }
.util-locale { display: inline-flex; align-items: center; gap: 6px; color: var(--ws-strip-text); }
.util-select { background: #fff; border: 1px solid var(--ws-border); color: var(--ws-text); border-radius: 6px; font-size: 12px; font-weight: 600; padding: 3px 6px; cursor: pointer; }
.util-link { display: inline-flex; align-items: center; gap: 5px; color: var(--ws-strip-text); text-decoration: none; font-weight: 600; }
.util-link:hover { color: var(--ws-accent); }
.util-login { color: var(--ws-accent); font-weight: 800; }
.util-login:hover { color: var(--ws-accent-hover); }

/* Header */
.site-header { position: sticky; top: 0; z-index: 50; background: var(--ws-surface); border-bottom: 1px solid var(--ws-border-subtle); box-shadow: var(--ws-shadow-bar); }
.header-inner { max-width: 1360px; margin: 0 auto; padding: 12px 20px; display: flex; align-items: center; gap: 28px; }
.brand-zone { display: flex; align-items: center; gap: 12px; flex: none; }
.menu-btn { display: none; background: none; border: 1px solid var(--ws-border); border-radius: 8px; width: 38px; height: 38px; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; }
.menu-btn span { width: 18px; height: 2px; background: var(--ws-text); border-radius: 2px; }
.assurance-pill { display: inline-flex; align-items: center; gap: 5px; background: var(--ws-brand-faint); border: 1px solid var(--ws-brand-light); color: var(--ws-brand); font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; white-space: nowrap; }

/* Search */
.search-zone { flex: 1; min-width: 0; }
.search-tabs { display: flex; gap: 2px; margin-bottom: 6px; }
.search-tabs button { background: none; border: 0; font-size: 13px; font-weight: 700; color: var(--ws-text-muted); padding: 4px 12px; border-radius: 6px 6px 0 0; cursor: pointer; font-family: var(--ws-font); }
.search-tabs button:hover { color: var(--ws-text); }
.search-tabs button.active { color: var(--ws-accent); box-shadow: inset 0 -2px 0 var(--ws-accent); }
.search-box { display: flex; align-items: stretch; border: 2px solid var(--ws-accent); border-radius: 10px; overflow: hidden; background: #fff; max-width: 680px; }
.search-box input { flex: 1; min-width: 0; border: 0; padding: 11px 14px; font-size: 14px; font-family: var(--ws-font); color: var(--ws-text); }
.search-box input:focus { outline: none; }
.search-box input::placeholder { color: var(--ws-text-faint); }
.search-cam { background: none; border: 0; padding: 0 12px; color: var(--ws-text-muted); cursor: pointer; display: inline-flex; align-items: center; }
.search-cam:hover { color: var(--ws-accent); }
.search-go { background: var(--ws-accent); color: #fff; border: 0; padding: 0 26px; font-size: 14px; font-weight: 800; font-family: var(--ws-font); cursor: pointer; display: inline-flex; align-items: center; gap: 7px; }
.search-go:hover { background: var(--ws-accent-hover); }

/* Header actions */
.action-zone { display: flex; align-items: center; gap: 6px; flex: none; }
.rfq-cta { display: inline-flex; align-items: center; gap: 7px; background: var(--ws-accent); color: #fff; text-decoration: none; font-size: 13px; font-weight: 800; padding: 10px 16px; border-radius: 9999px; margin-right: 8px; box-shadow: 0 1px 2px rgb(234 88 12 / 0.35); white-space: nowrap; }
.rfq-cta:hover { background: var(--ws-accent-hover); }
.h-icon { position: relative; display: inline-flex; flex-direction: column; align-items: center; gap: 3px; color: var(--ws-text-2); text-decoration: none; font-size: 10px; font-weight: 700; padding: 6px 10px; border-radius: 8px; background: none; border: 0; cursor: pointer; font-family: var(--ws-font); }
.h-icon:hover { background: var(--ws-surface-muted); color: var(--ws-text); }
.notif-zone { position: relative; }
.notif-count { position: absolute; top: 0; right: 4px; background: var(--ws-danger); color: #fff; font-size: 10px; font-weight: 800; border-radius: 9999px; padding: 1px 6px; line-height: 1.5; }
.notif-pop { position: absolute; top: calc(100% + 10px); right: 0; width: 360px; background: #fff; border: 1px solid var(--ws-border-subtle); border-radius: 12px; box-shadow: var(--ws-shadow-pop); z-index: 80; overflow: hidden; }
.notif-pop-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--ws-surface-muted); border-bottom: 1px solid var(--ws-border-subtle); font-size: 13px; }
.notif-read-all { background: none; border: 0; color: var(--ws-info); font-size: 12px; font-weight: 700; cursor: pointer; font-family: var(--ws-font); }
.notif-empty { padding: 28px 16px; text-align: center; font-size: 13px; color: var(--ws-text-muted); }
.notif-list { max-height: 340px; overflow-y: auto; }
.notif-row { padding: 12px 16px; border-bottom: 1px solid var(--ws-border-subtle); }
.notif-row:last-child { border-bottom: 0; }
.notif-row.unread { background: var(--ws-brand-faint); }
.notif-row-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
.notif-title { font-size: 13px; font-weight: 800; color: var(--ws-text); }
.notif-time { font-size: 11px; color: var(--ws-text-faint); flex: none; }
.notif-msg { margin: 0; font-size: 12px; color: var(--ws-text-2); line-height: 1.5; }
.user-chip { display: inline-flex; align-items: center; gap: 9px; margin-left: 8px; padding: 5px 12px 5px 5px; border: 1px solid var(--ws-border-subtle); border-radius: 9999px; text-decoration: none; }
.user-chip:hover { border-color: var(--ws-border-strong); background: var(--ws-surface-muted); }
.user-meta { display: flex; flex-direction: column; line-height: 1.3; }
.user-meta b { font-size: 12px; color: var(--ws-text); }
.user-meta i { font-style: normal; font-size: 10px; color: var(--ws-success); font-weight: 800; }

.main-content { flex: 1; width: 100%; max-width: 1360px; margin: 0 auto; padding: 0; box-sizing: border-box; }

/* Footer */
.site-footer { background: #fff; color: var(--ws-text-2); margin-top: 64px; border-top: 1px solid var(--ws-border-subtle); }
.footer-inner { max-width: 1360px; margin: 0 auto; padding: 48px 20px 28px; }
.footer-grid { display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 36px; padding-bottom: 32px; border-bottom: 1px solid var(--ws-border-subtle); }
.footer-brand p { font-size: 13px; line-height: 1.6; margin: 14px 0 0; max-width: 32ch; color: var(--ws-text-muted); }
.footer-col h4 { margin: 0 0 14px; font-size: 13px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ws-text); }
.footer-col p { margin: 0 0 9px; font-size: 13px; }
.footer-col a { color: var(--ws-text-2); text-decoration: none; }
.footer-col a:hover { color: var(--ws-accent); text-decoration: underline; }
.footer-legal { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding-top: 22px; font-size: 12px; color: var(--ws-text-muted); }
.footer-legal p { margin: 0; }
.footer-legal a { color: var(--ws-text); font-weight: 700; text-decoration: none; }
.footer-legal a:hover { color: var(--ws-accent); text-decoration: underline; }
.footer-legal span { margin: 0 8px; color: var(--ws-border-strong); }

/* Drawer */
.drawer-veil { position: fixed; inset: 0; background: rgb(11 28 48 / 0.5); z-index: 200; }
.drawer { position: fixed; top: 0; left: -300px; width: 288px; height: 100dvh; background: #fff; z-index: 210; box-shadow: var(--ws-shadow-pop); transition: left 220ms ease; display: flex; flex-direction: column; }
.drawer.open { left: 0; }
.drawer-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--ws-border-subtle); }
.drawer-x { background: var(--ws-surface-muted); border: 0; width: 32px; height: 32px; border-radius: 8px; font-size: 20px; color: var(--ws-text-2); cursor: pointer; line-height: 1; }
.drawer-user { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: var(--ws-surface-muted); border-bottom: 1px solid var(--ws-border-subtle); }
.drawer-user div { display: flex; flex-direction: column; }
.drawer-user b { font-size: 13px; }
.drawer-user span { font-size: 11px; color: var(--ws-success); font-weight: 700; }
.drawer-nav { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
.drawer-nav a { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 8px; text-decoration: none; color: var(--ws-text-2); font-size: 13px; font-weight: 600; }
.drawer-nav a:hover, .drawer-nav a.router-link-active { background: var(--ws-brand-faint); color: var(--ws-brand); }
.drawer-nav a.drawer-accent { color: var(--ws-brand); font-weight: 800; }
.drawer-foot { padding: 14px 16px; border-top: 1px solid var(--ws-border-subtle); display: flex; flex-direction: column; gap: 10px; }
.drawer-ext { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; text-decoration: none; }
.drawer-ext.go-partner { color: var(--ws-brand); }
.drawer-ext.go-admin { color: var(--ws-info); }

@media (max-width: 1100px) {
  .header-inner { flex-wrap: wrap; gap: 12px; }
  .search-zone { order: 3; flex-basis: 100%; }
  .search-box { max-width: none; }
  .rfq-cta { display: none; }
  .user-meta { display: none; }
  .user-chip { padding: 5px; border: 0; margin-left: 0; }
}
@media (max-width: 992px) {
  .menu-btn { display: inline-flex; }
  .assurance-pill { display: none; }
  .util-claim { display: none; }
  .util-inner { justify-content: flex-end; }
  .footer-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 640px) {
  .util-strip { display: none; }
  .h-icon span { display: none; }
  .h-icon { padding: 8px; }
  .search-go { padding: 0 14px; }
  .footer-grid { grid-template-columns: 1fr; gap: 24px; }
  .notif-pop { width: min(340px, calc(100vw - 32px)); position: fixed; top: 120px; right: 16px; }
}
</style>
