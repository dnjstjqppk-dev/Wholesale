<template>
  <div class="storefront-page">
    <div v-if="loading" class="state-box">
      공급사 미니사이트 및 공장 실사 성적서를 불러오는 중입니다...
    </div>
    <div v-else-if="!storefront" class="state-box">
      공급사 정보를 찾을 수 없습니다.
    </div>
    <div v-else class="storefront-container">
      <!-- Storefront Top Banner -->
      <div class="hero-store-banner" :style="{ backgroundImage: `url(${storefront.banner_image})` }">
        <div class="banner-overlay">
          <div class="store-badge">✓ SGS / TÜV Verified Manufacturer</div>
          <h1 class="store-company-name">{{ storefront.company_name }}</h1>
          <p class="store-slogan">{{ storefront.slogan }}</p>
          <div class="store-quick-meta">
            <span>설립: <strong>{{ storefront.year_established }}년</strong></span>
            <span>연간 매출: <strong>{{ storefront.total_revenue_usd }}</strong></span>
            <span>수출 비중: <strong>{{ storefront.export_percentage }}</strong></span>
            <span>주요 시장: <strong>{{ (storefront.main_markets || []).join(', ') }}</strong></span>
          </div>
        </div>
      </div>

      <!-- Factory Tour & Video Section -->
      <section class="section-card factory-tour-card">
        <div class="card-head">
          <span class="icon">🏭</span>
          <h3>제조 공장 실사 및 생산 설비 현황 (Factory Tour & QC)</h3>
          <span class="iso-pill">ISO 9001:2015 공인</span>
        </div>
        <div class="tour-grid">
          <div class="tour-left">
            <h4>주요 보유 공작기계 및 자동화 설비</h4>
            <ul class="equip-list">
              <li v-for="(eq, idx) in storefront.production_equipment" :key="idx">
                <span class="eq-name">⚙️ {{ eq.name }}</span>
                <span class="eq-count">{{ eq.count }}대 가동 중</span>
              </li>
            </ul>
          </div>
          <div class="tour-right">
            <h4>보유 국제 규격 인증서</h4>
            <div class="cert-chips">
              <div v-for="(cert, idx) in storefront.certifications" :key="idx" class="cert-chip">
                <strong>{{ cert.name }}</strong>
                <span>인증 기관: {{ cert.issued_by }}</span>
                <span>유효 기간: {{ cert.valid_thru }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Product Showcase -->
      <section class="section-card">
        <div class="card-head">
          <span class="icon">⭐</span>
          <h3>공급사 주력 도매 상품 쇼케이스 (Featured Products)</h3>
        </div>
        <div class="showcase-grid">
          <div
            v-for="item in showcaseProducts"
            :key="item.id"
            class="showcase-card"
            @click="goToProduct(item.id)"
          >
            <div class="thumb-wrap">
              <img :src="item.thumbnail || item.images[0]" :alt="item.title" />
            </div>
            <div class="card-desc">
              <h4>{{ item.title }}</h4>
              <div class="price">{{ formatMoney(item.price_tiers[0]?.unit_price) }}</div>
              <div class="moq">MOQ: {{ item.moq }} {{ item.unit }} | 납기: {{ item.lead_time_days }}일</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiRequest } from '../api';
import { formatCurrency, SupportedLocale, SupportedCurrency } from '../i18n';

const route = useRoute();
const router = useRouter();

const currentLocale = computed<SupportedLocale>(() => {
  const loc = (route.params.locale as string) || 'ko';
  return ['ko', 'en', 'zh', 'ja'].includes(loc) ? (loc as SupportedLocale) : 'ko';
});

const currentCurrency = computed<SupportedCurrency>(() => {
  const cur = (route.params.currency as string) || 'KRW';
  return ['KRW', 'USD', 'CNY', 'JPY'].includes(cur) ? (cur as SupportedCurrency) : 'KRW';
});

function formatMoney(usdVal: string | number) {
  return formatCurrency(usdVal, currentCurrency.value);
}

const loading = ref(true);
const storefront = ref<any>(null);
const showcaseProducts = ref<any[]>([]);

async function loadStorefront() {
  const orgId = (route.params.orgId as string) || '11111111-1111-1111-1111-111111111111';
  loading.value = true;
  try {
    const [storeRes, prodRes] = await Promise.all([
      apiRequest(`/suppliers/${orgId}/storefront`),
      apiRequest('/catalog/listings'),
    ]);
    storefront.value = storeRes;
    const all = prodRes?.items || [];
    showcaseProducts.value = all.filter((p: any) => p.organization_id === orgId);
  } catch (err) {
    console.warn('Failed to load storefront:', err);
  } finally {
    loading.value = false;
  }
}

function goToProduct(id: string) {
  router.push(`/${currentLocale.value}/${currentCurrency.value}/products/${id}`);
}

onMounted(() => {
  loadStorefront();
});
</script>

<style scoped>
.storefront-page {
  max-width: 1320px;
  margin: 0 auto;
  padding: 16px 16px 60px;
}
.storefront-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.hero-store-banner {
  height: 280px;
  background-size: cover;
  background-position: center;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}
.banner-overlay {
  background: linear-gradient(to right, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.6) 100%);
  height: 100%;
  padding: 36px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: #FFF;
  box-sizing: border-box;
}
.store-badge {
  display: inline-block;
  background: #16A34A;
  color: #FFF;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
  margin-bottom: 10px;
}
.store-company-name {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 8px;
}
.store-slogan {
  font-size: 14px;
  color: #CBD5E1;
  margin: 0 0 20px;
}
.store-quick-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #94A3B8;
}
.store-quick-meta strong {
  color: #FFF;
}

.section-card {
  background: #FFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 20px;
}
.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #F1F5F9;
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.card-head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #0F172A;
}
.iso-pill {
  margin-left: auto;
  background: #EFF6FF;
  color: #1E40AF;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.tour-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.tour-left h4, .tour-right h4 {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  margin: 0 0 10px;
}
.equip-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.equip-list li {
  display: flex;
  justify-content: space-between;
  background: #F8FAFC;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
}
.eq-name {
  font-weight: 600;
  color: #1E293B;
}
.eq-count {
  color: #0284C7;
  font-weight: 700;
}

.cert-chips {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cert-chip {
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #166534;
}
.cert-chip strong {
  font-size: 12px;
}

.showcase-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.showcase-card {
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}
.showcase-card:hover {
  transform: translateY(-2px);
  border-color: #CC3D00;
}
.thumb-wrap {
  height: 160px;
  background: #F8FAFC;
}
.thumb-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card-desc {
  padding: 10px;
}
.card-desc h4 {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #0F172A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-desc .price {
  font-size: 15px;
  font-weight: 800;
  color: #CC3D00;
}
.card-desc .moq {
  font-size: 10px;
  color: #64748B;
  margin-top: 4px;
}

.state-box {
  background: #FFF;
  border: 1px solid #E2E8F0;
  padding: 60px 20px;
  text-align: center;
  border-radius: 8px;
}

@media (max-width: 992px) {
  .showcase-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-store-banner {
    padding: 24px 16px;
  }
  .store-company-name {
    font-size: 20px;
  }
  .store-quick-meta {
    flex-wrap: wrap;
    gap: 8px 14px;
  }
  .tour-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 540px) {
  .showcase-grid {
    grid-template-columns: 1fr;
  }
  .section-card {
    padding: 16px;
  }
}
</style>

