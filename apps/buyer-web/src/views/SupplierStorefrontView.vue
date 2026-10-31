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
          <div class="store-actions-row">
            <button class="btn-audit-report" @click="openAuditModal">
              📄 TÜV Rheinland 공인 실사 보고서 (Audit Report) 확인
            </button>
          </div>
        </div>
      </div>

      <!-- Factory Tour & Video Section -->
      <section class="section-card factory-tour-card">
        <div class="card-head">
          <span class="icon">🏭</span>
          <h3>제조 공장 실사 및 생산 설비 현황 (Factory Tour & QC)</h3>
          <div class="head-badges-row">
            <span class="iso-pill">ISO 9001:2015 공인</span>
            <button class="btn-view-audit-link" @click="openAuditModal">
              🔍 공인 실사 성적서 원본 열람 & 다운로드
            </button>
          </div>
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

      <!-- TÜV Rheinland Official Audit Report Modal -->
      <div v-if="showAuditModal" class="audit-modal-backdrop" @click.self="showAuditModal = false">
        <div class="audit-modal-card">
          <div class="audit-modal-header">
            <div class="audit-header-title">
              <span class="tuv-badge">TÜV Rheinland Certified</span>
              <h3>제조공장 현장 실사 및 품질 공인 감사 보고서 (Factory Audit Report)</h3>
            </div>
            <button class="btn-close-modal" @click="showAuditModal = false">✕</button>
          </div>

          <div v-if="loadingAudit" class="audit-loading">
            공인 시험인증기관 감사 보고서 및 실사 데이터를 불러오는 중입니다...
          </div>
          <div v-else-if="auditData" class="audit-modal-body">
            <div class="audit-summary-banner">
              <div class="audit-grade-box">
                <span class="grade-label">종합 평가 등급</span>
                <span class="grade-value">{{ auditData.verification_grade }}</span>
                <span class="score-badge">실사 점수: {{ auditData.overall_score }} / 100</span>
              </div>
              <div class="audit-meta-grid">
                <div><span>보고서 번호:</span> <strong>{{ auditData.report_id }}</strong></div>
                <div><span>심사 기관:</span> <strong>{{ auditData.verification_agency }}</strong></div>
                <div><span>수석 감사원:</span> <strong>{{ auditData.lead_auditor }}</strong></div>
                <div><span>실사 일자:</span> <strong>{{ auditData.audit_date }} (유효: ~{{ auditData.valid_until }})</strong></div>
                <div class="seal-line"><span>디지털 무결성 Seal:</span> <code>{{ auditData.sha256_digital_seal.slice(0, 24) }}...</code></div>
              </div>
            </div>

            <!-- Audit Sections -->
            <div class="audit-sections-list">
              <h4>📋 공인 현장 실사 5대 항목 평가 결과</h4>
              <div v-for="(sec, idx) in auditData.assessment_sections" :key="idx" class="audit-sec-item">
                <div class="sec-head">
                  <span class="sec-name">{{ sec.name }}</span>
                  <div class="sec-score-wrap">
                    <span class="sec-score">{{ sec.score }}점</span>
                    <span class="sec-status-pill">{{ sec.status }}</span>
                  </div>
                </div>
                <p class="sec-details">{{ sec.details }}</p>
              </div>
            </div>

            <!-- On-Site Photos -->
            <div class="audit-photos-wrap">
              <h4>📸 검사관 현장 실사 촬영 사진 (On-site Inspection Photos)</h4>
              <div class="photos-grid">
                <img v-for="(p, idx) in auditData.facility_photos" :key="idx" :src="p" alt="Inspection Photo" />
              </div>
            </div>

            <!-- Modal Footer with Download Action -->
            <div class="audit-modal-footer">
              <button class="btn-download-pdf" @click="downloadAuditReport">
                📥 공인 실사 보고서 원본 다운로드 (PDF / Official Seal)
              </button>
              <button class="btn-close-bottom" @click="showAuditModal = false">
                닫기
              </button>
            </div>
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

.store-actions-row {
  margin-top: 14px;
}
.btn-audit-report {
  background: #C2410C;
  color: #FFFFFF;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(194, 65, 12, 0.4);
}
.btn-audit-report:hover {
  background: #9A3412;
}
.head-badges-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.btn-view-audit-link {
  background: #FFF7ED;
  border: 1px solid #FDBA74;
  color: #C2410C;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.btn-view-audit-link:hover {
  background: #FFEDD5;
}

/* Modal */
.audit-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.audit-modal-card {
  background: #FFFFFF;
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}
.audit-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #E2E8F0;
}
.audit-header-title h3 {
  margin: 6px 0 0;
  font-size: 16px;
  color: #0F172A;
}
.tuv-badge {
  background: #0284C7;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}
.btn-close-modal {
  background: none;
  border: none;
  font-size: 18px;
  color: #64748B;
  cursor: pointer;
}
.audit-modal-body {
  padding: 20px 24px;
}
.audit-loading {
  padding: 40px;
  text-align: center;
  color: #64748B;
}
.audit-summary-banner {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 20px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.audit-grade-box {
  background: #16A34A;
  color: #FFFFFF;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.grade-label {
  font-size: 11px;
  opacity: 0.9;
}
.grade-value {
  font-size: 24px;
  font-weight: 900;
  margin: 4px 0;
}
.score-badge {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.25);
  padding: 2px 6px;
  border-radius: 4px;
}
.audit-meta-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  font-size: 12px;
  color: #475569;
}
.seal-line code {
  font-size: 11px;
  background: #E2E8F0;
  padding: 2px 4px;
  border-radius: 3px;
}
.audit-sections-list {
  margin-bottom: 20px;
}
.audit-sections-list h4 {
  font-size: 14px;
  margin: 0 0 10px;
  color: #1E293B;
}
.audit-sec-item {
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 8px;
  background: #FFFFFF;
}
.sec-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sec-name {
  font-size: 13px;
  font-weight: 700;
  color: #0F172A;
}
.sec-score-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.sec-score {
  font-size: 13px;
  font-weight: 800;
  color: #0284C7;
}
.sec-status-pill {
  background: #DCFCE7;
  color: #166534;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}
.sec-details {
  margin: 6px 0 0;
  font-size: 12px;
  color: #64748B;
}
.audit-photos-wrap h4 {
  font-size: 14px;
  margin: 0 0 10px;
  color: #1E293B;
}
.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
.photos-grid img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
}
.audit-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #E2E8F0;
  padding-top: 16px;
}
.btn-download-pdf {
  background: #0284C7;
  color: #FFFFFF;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}
.btn-close-bottom {
  background: #F1F5F9;
  border: 1px solid #CBD5E1;
  color: #475569;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
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

