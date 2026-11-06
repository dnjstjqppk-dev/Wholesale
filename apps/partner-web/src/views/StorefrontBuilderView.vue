<template>
  <div class="ws-page ws-page-wide">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Storefront Builder</p>
      <div class="ws-page-head-row">
        <h1 class="ws-page-title">미니사이트 커스텀 빌더</h1>
        <div class="ws-page-actions">
          <a :href="`https://wholesale.dnjstjqppk.workers.dev/ko/KRW/suppliers/${storefront.organization_id}`" target="_blank" class="ws-btn ws-btn-secondary ws-btn-sm">
            <WsIcon name="eye" :size="14" /> 실제 바이어 뷰
          </a>
          <button class="ws-btn ws-btn-accent ws-btn-sm" :disabled="saving" @click="saveStorefront">
            <span v-if="saving" class="ws-spinner"></span> {{ saving ? '저장 중...' : '✓ 변경사항 저장' }}
          </button>
        </div>
      </div>
      <p class="ws-page-sub">브랜드 히어로 배너·공장 VR 투어·쇼케이스 품목·설비 스펙을 실시간 편집하고 게시합니다.</p>
    </div>

    <div v-if="toastMessage" class="ws-banner" :class="toastType === 'error' ? 'ws-banner-danger' : 'ws-banner-success'">
      <WsIcon :name="toastType === 'error' ? 'alert' : 'check'" :size="16" />
      <span>{{ toastMessage }}</span>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton" style="height: 200px"></div>
      <div class="ws-skeleton" style="height: 200px"></div>
    </div>

    <div v-else class="builder-grid">
      <div class="ws-stack">
        <section class="ws-card">
          <div class="ws-card-head"><h3>1 · 브랜드 헤더·히어로 배너</h3></div>
          <div class="ws-field"><label>기업 공식 브랜드명</label><input v-model="storefront.company_name" type="text" /></div>
          <div class="ws-field"><label>브랜드 대표 슬로건</label><input v-model="storefront.slogan" type="text" /></div>
          <div class="ws-field"><label>히어로 배너 이미지 URL (1600×400 권장)</label><input v-model="storefront.banner_image" type="text" /></div>
          <div class="banner-preview"><img :src="storefront.banner_image" alt="Banner Preview" /></div>
        </section>

        <section class="ws-card">
          <div class="ws-card-head"><h3>2 · 공장 VR·현장 투어 영상</h3></div>
          <div class="ws-field">
            <label>공장 실사 비디오 / 360 VR 스트리밍 URL</label>
            <input v-model="storefront.video_tour_url" type="text" placeholder="https://..." />
          </div>
          <div class="ws-grid-3">
            <div class="ws-field"><label>설립 연도</label><input v-model.number="storefront.year_established" type="number" /></div>
            <div class="ws-field"><label>수출 비중 (%)</label><input v-model="storefront.export_percentage" type="text" /></div>
            <div class="ws-field"><label>연간 총 매출액 (USD)</label><input v-model="storefront.total_revenue_usd" type="text" /></div>
          </div>
        </section>

        <section class="ws-card">
          <div class="ws-card-head">
            <h3>3 · 핵심 생산 설비</h3>
            <button class="ws-btn ws-btn-ghost ws-btn-sm" @click="addEquipment"><WsIcon name="plus" :size="13" /> 설비 추가</button>
          </div>
          <div v-for="(eq, idx) in storefront.production_equipment" :key="idx" class="equip-row">
            <input v-model="eq.name" type="text" class="ws-input" placeholder="설비 명칭 (예: 500-Ton Hydraulic Press)" />
            <input v-model.number="eq.count" type="number" min="1" class="ws-input equip-count" placeholder="대수" />
            <button class="ws-icon-btn" aria-label="삭제" @click="removeEquipment(idx)"><WsIcon name="x" :size="14" /></button>
          </div>
        </section>

        <section class="ws-card">
          <div class="ws-card-head"><h3>4 · 전면 쇼케이스 품목</h3></div>
          <p class="ws-card-sub">미니사이트 진입 시 상단 우선 노출할 대표 제품 ID를 지정합니다.</p>
          <div v-for="(pId, idx) in storefront.showcase_product_ids" :key="idx" class="equip-row">
            <span class="ws-badge ws-badge-brand">슬롯 {{ idx + 1 }}</span>
            <input v-model="storefront.showcase_product_ids[idx]" type="text" class="ws-input" placeholder="상품 ID 입력" />
            <button class="ws-icon-btn" aria-label="삭제" @click="removeShowcaseProduct(idx)"><WsIcon name="x" :size="14" /></button>
          </div>
          <button v-if="storefront.showcase_product_ids.length < 6" class="ws-btn ws-btn-ghost ws-btn-sm" @click="addShowcaseProduct">
            <WsIcon name="plus" :size="13" /> 쇼케이스 슬롯 추가
          </button>
        </section>
      </div>

      <aside class="ws-card preview-card">
        <div class="ws-card-head">
          <h3><WsIcon name="phone" :size="15" class="h-ico" /> 바이어 화면 라이브 프리뷰</h3>
        </div>
        <div class="pv-banner">
          <img :src="storefront.banner_image" alt="Banner" />
          <div class="pv-overlay">
            <b>{{ storefront.company_name }}</b>
            <span>{{ storefront.slogan }}</span>
          </div>
        </div>
        <div class="pv-meta">
          <span><WsIcon name="calendar" :size="13" /> 설립 {{ storefront.year_established }}년</span>
          <span><WsIcon name="truck" :size="13" /> 수출 {{ storefront.export_percentage }}</span>
          <span><WsIcon name="card" :size="13" /> 매출 {{ storefront.total_revenue_usd }}</span>
        </div>
        <p class="pv-cap">주요 인증 규격</p>
        <div class="ws-cluster" style="gap: 6px">
          <span v-for="c in storefront.certifications" :key="c.name" class="ws-badge ws-badge-outline">{{ c.name }} ({{ c.issued_by }})</span>
        </div>
        <p class="pv-cap">보유 생산 설비 요약</p>
        <ul class="pv-equip">
          <li v-for="eq in storefront.production_equipment" :key="eq.name">{{ eq.name }} — <b>{{ eq.count }}대</b></li>
        </ul>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest, getCurrentUser } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

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
.builder-grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 16px; align-items: start; }
.ws-field { margin-bottom: 12px; }
.banner-preview { border: 1px solid var(--ws-border-subtle); border-radius: 8px; overflow: hidden; background: var(--ws-surface-muted); aspect-ratio: 4 / 1; }
.banner-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
.equip-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 8px; align-items: center; margin-bottom: 8px; }
.equip-count { width: 110px; }
.preview-card { position: sticky; top: 84px; }
.h-ico { color: var(--ws-accent); vertical-align: -2px; }
.pv-banner { position: relative; border-radius: 8px; overflow: hidden; background: var(--ws-surface-muted); aspect-ratio: 16 / 7; }
.pv-banner img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pv-overlay { position: absolute; inset: auto 0 0 0; padding: 12px; background: linear-gradient(transparent, rgb(11 28 48 / 0.85)); color: #fff; display: flex; flex-direction: column; gap: 2px; }
.pv-overlay b { font-size: 15px; }
.pv-overlay span { font-size: 12px; color: #c3cede; }
.pv-meta { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: var(--ws-text-2); margin: 12px 0; }
.pv-meta span { display: inline-flex; align-items: center; gap: 6px; }
.pv-cap { margin: 12px 0 8px; font-size: 12px; font-weight: 800; }
.pv-equip { margin: 0; padding-left: 18px; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
@media (max-width: 1024px) {
  .builder-grid { grid-template-columns: minmax(0, 1fr); }
  .preview-card { position: static; }
}
</style>
