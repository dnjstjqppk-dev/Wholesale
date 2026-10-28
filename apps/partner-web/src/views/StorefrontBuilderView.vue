<template>
  <div class="storefront-builder-page">
    <div class="page-head">
      <div class="head-text">
        <h2>공급사 미니사이트(Storefront) 커스텀 빌더</h2>
        <p class="subtitle">
          Alibaba.com 글로벌 바이어에게 노출되는 브랜드 히어로 배너, 공장 360° VR 투어, 주력 쇼케이스 품목, 공장 설비 스펙을 실시간 편집하고 게시합니다.
        </p>
      </div>
      <div class="head-actions">
        <a :href="`https://wholesale.dnjstjqppk.workers.dev/ko/KRW/suppliers/${storefront.organization_id}`" target="_blank" class="btn-preview">
          👁️ 실제 바이어 뷰 보기
        </a>
        <button class="btn-save" :disabled="saving" @click="saveStorefront">
          {{ saving ? '저장 중...' : '✓ 미니사이트 변경사항 저장' }}
        </button>
      </div>
    </div>

    <!-- Toast Banner -->
    <div v-if="toastMessage" class="toast-banner" :class="toastType">
      {{ toastMessage }}
    </div>

    <div v-if="loading" class="state-box">
      <p>미니사이트 설정 데이터를 불러오는 중입니다...</p>
    </div>

    <div v-else class="builder-layout">
      <!-- Left: Editor Forms -->
      <div class="editor-col">
        <!-- Section 1: Hero Banner & Brand Slogan -->
        <div class="card-section">
          <h3>1. 브랜드 헤더 및 히어로 배너 (Hero Banner)</h3>
          <div class="form-group">
            <label>기업 공식 브랜드명</label>
            <input v-model="storefront.company_name" type="text" />
          </div>
          <div class="form-group">
            <label>브랜드 대표 슬로건 (Slogan)</label>
            <input v-model="storefront.slogan" type="text" />
          </div>
          <div class="form-group">
            <label>히어로 배너 이미지 URL (1600x400 권장)</label>
            <input v-model="storefront.banner_image" type="text" />
          </div>
          <div class="banner-preview-box">
            <img :src="storefront.banner_image" alt="Banner Preview" class="preview-img" />
          </div>
        </div>

        <!-- Section 2: Factory Virtual Tour & Video -->
        <div class="card-section">
          <h3>2. 공장 360° VR 및 현장 투어 영상 (Factory Tour)</h3>
          <div class="form-group">
            <label>공장 실사 비디오 / 360 VR 스트리밍 URL</label>
            <input v-model="storefront.video_tour_url" type="text" placeholder="https://..." />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>설립 연도</label>
              <input v-model.number="storefront.year_established" type="number" />
            </div>
            <div class="form-group">
              <label>수출 비중 (%)</label>
              <input v-model="storefront.export_percentage" type="text" />
            </div>
            <div class="form-group">
              <label>연간 총 매출액 (USD)</label>
              <input v-model="storefront.total_revenue_usd" type="text" />
            </div>
          </div>
        </div>

        <!-- Section 3: Equipment & Facilities -->
        <div class="card-section">
          <div class="sec-head-row">
            <h3>3. 공장 핵심 생산 설비 (Production Machinery)</h3>
            <button class="btn-add-item" @click="addEquipment">+ 설비 추가</button>
          </div>
          <div class="equip-list">
            <div v-for="(eq, idx) in storefront.production_equipment" :key="idx" class="equip-row">
              <input v-model="eq.name" type="text" placeholder="설비 명칭 (예: 500-Ton Hydraulic Press)" class="flex-2" />
              <input v-model.number="eq.count" type="number" min="1" placeholder="보유 대수" class="flex-1" />
              <button class="btn-del" @click="removeEquipment(idx)">×</button>
            </div>
          </div>
        </div>

        <!-- Section 4: Spotlight Showcase Products -->
        <div class="card-section">
          <h3>4. 스토어 전면 쇼케이스 품목 (Top Showcase Products)</h3>
          <p class="guide-text">바이어가 미니사이트 진입 시 상단에 우선 노출할 대표 제품 ID를 지정합니다.</p>
          <div class="showcase-inputs">
            <div v-for="(pId, idx) in storefront.showcase_product_ids" :key="idx" class="showcase-row">
              <span class="slot-badge">슬롯 {{ idx + 1 }}</span>
              <input v-model="storefront.showcase_product_ids[idx]" type="text" placeholder="상품 ID 입력" class="flex-1" />
              <button class="btn-del" @click="removeShowcaseProduct(idx)">×</button>
            </div>
            <button v-if="storefront.showcase_product_ids.length < 6" class="btn-add-item" @click="addShowcaseProduct">
              + 쇼케이스 슬롯 추가
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Live Storefront Mini Preview -->
      <div class="preview-col">
        <div class="preview-sticky-card">
          <h4>📱 바이어 화면 라이브 프리뷰</h4>
          <div class="mini-storefront-frame">
            <div class="frame-banner">
              <img :src="storefront.banner_image" alt="Banner" />
              <div class="frame-overlay">
                <h5>{{ storefront.company_name }}</h5>
                <p>{{ storefront.slogan }}</p>
              </div>
            </div>
            <div class="frame-meta">
              <span>📅 설립: {{ storefront.year_established }}년</span>
              <span>🚢 수출: {{ storefront.export_percentage }}</span>
              <span>💰 매출: {{ storefront.total_revenue_usd }}</span>
            </div>
            <div class="frame-section">
              <h6>주요 인증 규격</h6>
              <div class="certs-chips">
                <span v-for="c in storefront.certifications" :key="c.name" class="chip">
                  {{ c.name }} ({{ c.issued_by }})
                </span>
              </div>
            </div>
            <div class="frame-section">
              <h6>보유 생산 설비 요약</h6>
              <ul class="equip-ul">
                <li v-for="eq in storefront.production_equipment" :key="eq.name">
                  {{ eq.name }} - <strong>{{ eq.count }}대</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest, getCurrentUser } from '../api';

const user = ref(getCurrentUser());
const loading = ref(true);
const saving = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');

const storefront = ref<any>({
  organization_id: '11111111-1111-1111-1111-111111111111',
  company_name: '',
  slogan: '',
  year_established: 2014,
  business_type: 'MANUFACTURER',
  total_revenue_usd: '$25M - $50M',
  export_percentage: '85%',
  banner_image: '',
  video_tour_url: '',
  certifications: [],
  production_equipment: [],
  showcase_product_ids: [],
});

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = '';
  }, 4000);
}

async function fetchStorefront() {
  loading.value = true;
  try {
    const orgId = user.value.organization?.id || '11111111-1111-1111-1111-111111111111';
    const data = await apiRequest(`/suppliers/${orgId}/storefront`);
    storefront.value = data;
  } catch (err: any) {
    showToast(`미니사이트 로딩 실패: ${err.message}`, 'error');
  } finally {
    loading.value = false;
  }
}

async function saveStorefront() {
  saving.value = true;
  try {
    const orgId = user.value.organization?.id || '11111111-1111-1111-1111-111111111111';
    await apiRequest(`/suppliers/${orgId}/storefront`, {
      method: 'PUT',
      body: JSON.stringify(storefront.value),
    });
    showToast('미니사이트 구성 변경사항이 글로벌 바이어 웹에 실시간 반영되었습니다.');
  } catch (err: any) {
    showToast(`저장 실패: ${err.message}`, 'error');
  } finally {
    saving.value = false;
  }
}

function addEquipment() {
  storefront.value.production_equipment.push({ name: '', count: 1 });
}

function removeEquipment(idx: number) {
  storefront.value.production_equipment.splice(idx, 1);
}

function addShowcaseProduct() {
  storefront.value.showcase_product_ids.push('');
}

function removeShowcaseProduct(idx: number) {
  storefront.value.showcase_product_ids.splice(idx, 1);
}

onMounted(() => {
  fetchStorefront();
});
</script>

<style scoped>
.storefront-builder-page {
  padding: 24px 32px 80px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.head-text h2 {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.head-actions {
  display: flex;
  gap: 10px;
}

.btn-preview {
  padding: 8px 16px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  color: #334155;
  display: flex;
  align-items: center;
}

.btn-save {
  padding: 8px 18px;
  background: #d64000;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.btn-save:hover {
  background: #e65c00;
}

.toast-banner {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 600;
}

.toast-banner.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.toast-banner.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.builder-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
}

.card-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
}

.card-section h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 8px;
}

.sec-head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 8px;
  margin-bottom: 16px;
}

.sec-head-row h3 {
  border: none;
  margin: 0;
  padding: 0;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-group {
  flex: 1;
}

.banner-preview-box {
  border-radius: 6px;
  overflow: hidden;
  height: 120px;
  background: #f8fafc;
  margin-top: 8px;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.equip-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.equip-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.flex-2 { flex: 2; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; }
.flex-1 { flex: 1; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; }

.btn-add-item {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-del {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 18px;
  cursor: pointer;
}

.showcase-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.showcase-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.slot-badge {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
}

.guide-text {
  font-size: 12px;
  color: #64748b;
  margin-top: -8px;
  margin-bottom: 12px;
}

/* Right Sticky Preview */
.preview-sticky-card {
  position: sticky;
  top: 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
}

.preview-sticky-card h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #1e293b;
}

.mini-storefront-frame {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
}

.frame-banner {
  position: relative;
  height: 100px;
  background: #1e293b;
}

.frame-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.6;
}

.frame-overlay {
  position: absolute;
  bottom: 8px;
  left: 10px;
  right: 10px;
  color: white;
}

.frame-overlay h5 {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}

.frame-overlay p {
  margin: 2px 0 0;
  font-size: 10px;
  opacity: 0.9;
}

.frame-meta {
  display: flex;
  justify-content: space-around;
  padding: 8px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  font-size: 11px;
  color: #475569;
}

.frame-section {
  padding: 10px;
  border-bottom: 1px solid #f1f5f9;
}

.frame-section h6 {
  margin: 0 0 6px 0;
  font-size: 11px;
  color: #64748b;
}

.certs-chips {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chip {
  background: #ecfdf5;
  color: #065f46;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
}

.equip-ul {
  margin: 0;
  padding-left: 16px;
  font-size: 11px;
  color: #334155;
}

/* Mobile & Tablet Responsive Layout */
@media (max-width: 992px) {
  .storefront-builder-page {
    padding: 16px 12px;
  }
  .page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .builder-layout {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
  }
  .head-actions {
    width: 100%;
    flex-direction: column;
  }
  .btn-preview, .btn-save {
    width: 100%;
    text-align: center;
    box-sizing: border-box;
    justify-content: center;
  }
}
</style>

