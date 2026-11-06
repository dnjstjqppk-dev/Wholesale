<template>
  <div class="ws-page ws-page-wide">
    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton" style="height: 260px"></div>
      <div class="ws-skeleton" style="height: 220px"></div>
    </div>
    <div v-else-if="!storefront" class="ws-empty">
      <span class="ws-empty-icon"><WsIcon name="factory" :size="24" /></span>
      <h3>공급사 정보를 찾을 수 없습니다</h3>
      <router-link :to="`/${currentLocale}/${currentCurrency}/suppliers`" class="ws-btn ws-btn-secondary">디렉토리로 이동</router-link>
    </div>
    <div v-else class="ws-stack">
      <!-- Banner -->
      <section class="store-banner" :style="{ backgroundImage: `url(${storefront.banner_image})` }">
        <div class="store-veil">
          <span class="ws-badge ws-badge-success">SGS / TÜV Verified Manufacturer</span>
          <h1>{{ storefront.company_name }}</h1>
          <p>{{ storefront.slogan }}</p>
          <div class="store-meta">
            <span>설립 <b>{{ storefront.year_established }}년</b></span>
            <span>연간 매출 <b>{{ storefront.total_revenue_usd }}</b></span>
            <span>수출 비중 <b>{{ storefront.export_percentage }}</b></span>
            <span>주요 시장 <b>{{ (storefront.main_markets || []).join(', ') }}</b></span>
          </div>
          <button class="ws-btn ws-btn-primary" @click="openAuditModal">
            <WsIcon name="file" :size="14" /> TÜV 공인 실사 보고서 확인
          </button>
        </div>
      </section>

      <!-- Factory tour -->
      <section class="ws-card">
        <div class="ws-card-head">
          <h3><WsIcon name="factory" :size="16" class="h-ico" /> 공장 설비·인증 현황</h3>
          <span class="ws-cluster" style="gap: 8px">
            <span class="ws-badge ws-badge-info">ISO 9001:2015</span>
            <button class="ws-btn ws-btn-ghost ws-btn-sm" @click="openAuditModal"><WsIcon name="search" :size="13" /> 실사 성적서 열람</button>
          </span>
        </div>
        <div class="ws-grid-2">
          <div>
            <p class="ws-small ws-strong" style="margin: 0 0 8px">보유 공작기계·자동화 설비</p>
            <div class="ws-list-row" v-for="(eq, idx) in storefront.production_equipment" :key="idx">
              <span class="doc-ico"><WsIcon name="gear" :size="16" /></span>
              <div class="ws-list-main"><p class="ws-list-title">{{ eq.name }}</p></div>
              <b class="ws-small ws-figure">{{ eq.count }}대 가동 중</b>
            </div>
          </div>
          <div>
            <p class="ws-small ws-strong" style="margin: 0 0 8px">보유 국제 규격 인증서</p>
            <div class="ws-list-row" v-for="(cert, idx) in storefront.certifications" :key="idx">
              <div class="ws-list-main">
                <p class="ws-list-title">{{ cert.name }}</p>
                <p class="ws-list-sub">{{ cert.issued_by }} · 유효 {{ cert.valid_thru }}</p>
              </div>
              <span class="ws-badge ws-badge-success">유효</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured products -->
      <section class="ws-card">
        <div class="ws-card-head">
          <h3><WsIcon name="star" :size="16" class="h-ico-star" /> 주력 도매 상품 쇼케이스</h3>
        </div>
        <div class="show-grid">
          <div v-for="item in showcaseProducts" :key="item.id" class="show-item" @click="goToProduct(item.id)">
            <img :src="item.thumbnail || item.images[0]" :alt="item.title" loading="lazy" />
            <p :title="item.title">{{ item.title }}</p>
            <b class="ws-price ws-figure">{{ formatMoney(item.price_tiers[0]?.unit_price) }}</b>
            <span class="ws-small ws-muted">MOQ {{ item.moq }}{{ item.unit }} · 납기 {{ item.lead_time_days }}일</span>
          </div>
        </div>
      </section>

      <!-- Audit modal -->
      <div v-if="showAuditModal" class="ws-modal-backdrop" @click.self="showAuditModal = false">
        <div class="ws-modal ws-modal-wide" role="dialog" aria-modal="true">
          <div class="ws-modal-head">
            <h3>공장 현장 실사 보고서</h3>
            <button class="ws-icon-btn" aria-label="닫기" @click="showAuditModal = false"><WsIcon name="x" :size="15" /></button>
          </div>
          <div class="ws-modal-body">
            <div v-if="loadingAudit" class="ws-stack-sm">
              <div class="ws-skeleton" style="height: 90px"></div>
              <div class="ws-skeleton" style="height: 90px"></div>
            </div>
            <div v-else-if="auditData">
              <div class="audit-hero">
                <div class="grade">
                  <span>종합 평가 등급</span>
                  <b>{{ auditData.verification_grade }}</b>
                  <span class="ws-badge ws-badge-brand">실사 점수 {{ auditData.overall_score }} / 100</span>
                </div>
                <table class="ws-spec-table">
                  <tbody>
                    <tr><th>보고서 번호</th><td class="ws-figure"><b>{{ auditData.report_id }}</b></td></tr>
                    <tr><th>심사 기관</th><td><b>{{ auditData.verification_agency }}</b></td></tr>
                    <tr><th>수석 감사원</th><td>{{ auditData.lead_auditor }}</td></tr>
                    <tr><th>실사 일자</th><td>{{ auditData.audit_date }} (유효 ~{{ auditData.valid_until }})</td></tr>
                    <tr><th>디지털 Seal</th><td><code>{{ auditData.sha256_digital_seal.slice(0, 24) }}...</code></td></tr>
                  </tbody>
                </table>
              </div>
              <p class="ws-small ws-strong" style="margin: 16px 0 8px"><WsIcon name="file" :size="14" /> 5대 항목 평가 결과</p>
              <div v-for="(sec, idx) in auditData.assessment_sections" :key="idx" class="audit-sec">
                <div class="ws-split">
                  <b>{{ sec.name }}</b>
                  <span class="ws-cluster" style="gap: 8px">
                    <b class="ws-price ws-figure">{{ sec.score }}점</b>
                    <span class="ws-badge ws-badge-success">{{ sec.status }}</span>
                  </span>
                </div>
                <p class="ws-small ws-muted">{{ sec.details }}</p>
                <div class="ws-meter ws-meter-success"><span :style="{ width: sec.score + '%' }"></span></div>
              </div>
              <p class="ws-small ws-strong" style="margin: 16px 0 8px"><WsIcon name="camera" :size="14" /> 현장 실사 촬영 사진</p>
              <div class="audit-photos">
                <img v-for="(p, idx) in auditData.facility_photos" :key="idx" :src="p" alt="Inspection Photo" loading="lazy" />
              </div>
            </div>
          </div>
          <div class="ws-modal-foot">
            <button class="ws-btn ws-btn-secondary" @click="showAuditModal = false">닫기</button>
            <button class="ws-btn ws-btn-primary" @click="downloadAuditReport"><WsIcon name="download" :size="14" /> 보고서 원본 다운로드 (PDF)</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiRequest } from '../api';
import { formatCurrency, SupportedLocale, SupportedCurrency } from '../i18n';
import WsIcon from '@packages/ui/WsIcon.vue';

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

const showAuditModal = ref(false);
const loadingAudit = ref(false);
const auditData = ref<any>(null);

async function openAuditModal() {
  showAuditModal.value = true;
  if (!auditData.value) {
    loadingAudit.value = true;
    try {
      const orgId = (route.params.orgId as string) || '11111111-1111-1111-1111-111111111111';
      const res = await apiRequest(`/suppliers/${orgId}/audit-report`);
      auditData.value = res;
    } catch (err) {
      console.warn('Failed to load audit report:', err);
    } finally {
      loadingAudit.value = false;
    }
  }
}

function downloadAuditReport() {
  const orgId = (route.params.orgId as string) || '11111111-1111-1111-1111-111111111111';
  window.open(`https://wholesale-api.dnjstjqppk.workers.dev/v1/suppliers/${orgId}/audit-report/download`, '_blank');
}

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
.store-banner { border-radius: var(--ws-radius-lg); background-size: cover; background-position: center; overflow: hidden; }
.store-veil { background: linear-gradient(to right, rgb(11 28 48 / 0.92), rgb(11 28 48 / 0.55)); padding: 40px; color: #fff; display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
.store-veil h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: var(--ws-tracking-tight); }
.store-veil p { margin: 0 0 6px; color: #c3cede; font-size: 14px; }
.store-meta { display: flex; gap: 22px; flex-wrap: wrap; font-size: 12px; color: #93a4bc; margin-bottom: 12px; }
.store-meta b { color: #fff; }
.h-ico { color: var(--ws-navy); vertical-align: -3px; }
.h-ico-star { color: #f59e0b; vertical-align: -3px; }
.doc-ico { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 8px; background: var(--ws-surface-muted); color: var(--ws-text-2); }
.show-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.show-item { border: 1px solid var(--ws-border-subtle); border-radius: 10px; overflow: hidden; cursor: pointer; padding: 10px; display: flex; flex-direction: column; gap: 4px; }
.show-item:hover { border-color: var(--ws-brand); }
.show-item img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 6px; background: var(--ws-surface-muted); }
.show-item p { margin: 4px 0 0; font-size: 13px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.audit-hero { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 20px; align-items: start; }
.grade { background: var(--ws-navy-ink); color: #fff; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
.grade span { font-size: 11px; color: #93a4bc; font-weight: 700; }
.grade b { font-size: 34px; font-weight: 900; }
.audit-sec { border-top: 1px solid var(--ws-border-subtle); padding: 12px 0; }
.audit-sec p { margin: 4px 0 8px; }
.audit-photos { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.audit-photos img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 8px; background: var(--ws-surface-muted); }
@media (max-width: 1024px) {
  .show-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .audit-hero { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 640px) {
  .store-veil { padding: 28px 20px; }
}
</style>
