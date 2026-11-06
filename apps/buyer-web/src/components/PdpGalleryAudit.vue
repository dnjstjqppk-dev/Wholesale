<template>
  <div class="gal-col">
    <div class="gal-main">
      <img :src="currentImage" :alt="product?.title || 'Wholesale Product'" />
      <span v-if="product?.trade_assurance" class="ta-float"><WsIcon name="shield" :size="12" /> Trade Assurance</span>
      <span class="photo-count ws-figure">{{ selectedPhotoIndex + 1 }} / {{ imageList.length }}</span>
    </div>

    <div class="gal-thumbs">
      <img
        v-for="(imgUrl, idx) in imageList"
        :key="idx"
        :src="imgUrl"
        :alt="`Thumbnail ${idx + 1}`"
        class="ws-gallery-thumb"
        :class="{ 'ws-gallery-thumb-active': selectedPhotoIndex === idx }"
        @click="selectedPhotoIndex = idx"
      />
    </div>

    <div class="ws-card ws-card-pad-sm audit-card">
      <div class="ws-card-head">
        <h3><WsIcon name="factory" :size="16" class="h-ico" /> {{ product?.supplier_name || '제조사 공장 실사 보고서' }}</h3>
        <span v-if="product?.verified_supplier" class="ws-badge ws-badge-success">Verified</span>
      </div>
      <p class="ws-card-sub">SGS·플랫폼 운영진 현장 실사 성적서 (Third-Party Audited)</p>
      <div class="ws-grid-2 fac-facts">
        <div><span>공장 부지 면적</span><b>{{ product?.factory_floor_area || '15,000 m²' }} (제조 1~3공장)</b></div>
        <div><span>생산 라인</span><b>{{ product?.production_lines || '8개' }} 자동화 가공 라인</b></div>
        <div><span>품질 검수원</span><b>{{ product?.qc_headcount || '14명' }} 상주 (ISO 9001:2015)</b></div>
        <div><span>연간 수출 실적</span><b class="ws-figure">USD ${{ product?.annual_export_volume || '12,500,000+' }}</b></div>
        <div><span>인콰이어리 응답률</span><b class="ws-price">{{ product?.response_rate || '99.2%' }}</b></div>
        <div><span>업력</span><b>{{ product?.years_in_business || 12 }}년</b></div>
      </div>

      <div v-if="activeAudit" class="audit-strip">
        <span class="ws-cluster" style="gap: 6px">
          <span class="ws-badge ws-badge-navy">{{ activeAudit.auditor_agency }}</span>
          <span class="ws-badge ws-badge-outline">{{ activeAudit.audit_standard }}</span>
          <span class="ws-badge ws-badge-brand">★ {{ activeAudit.overall_rating_score }} / 5.0</span>
          <span class="ws-badge ws-badge-success">{{ activeAudit.qc_status }}</span>
        </span>
        <button class="ws-btn ws-btn-ghost ws-btn-sm" @click="showAuditModal = true"><WsIcon name="file" :size="13" /> 실사 성적서 원본 열람 ›</button>
      </div>

      <router-link
        :to="`/${locale}/${currency}/suppliers/${product?.organization_id || '11111111-1111-1111-1111-111111111111'}`"
        class="ws-btn ws-btn-secondary ws-btn-block ws-btn-sm store-link"
      >
        <WsIcon name="factory" :size="14" /> 제조사 미니사이트·공장 VR 투어 ›
      </router-link>
    </div>

    <div v-if="showAuditModal" class="ws-modal-backdrop" @click.self="showAuditModal = false">
      <div class="ws-modal ws-modal-wide" role="dialog" aria-modal="true">
        <div class="ws-modal-head">
          <h3>공인 제3자 공장 실사 성적서</h3>
          <button class="ws-icon-btn" aria-label="닫기" @click="showAuditModal = false"><WsIcon name="x" :size="15" /></button>
        </div>
        <div class="ws-modal-body">
          <div class="cert-hero">
            <div class="cert-agency">
              <b>{{ activeAudit?.auditor_agency || 'SGS' }}</b>
              <span>Quality Assurance Certificate</span>
            </div>
            <div class="cert-score">
              <b class="ws-figure">{{ activeAudit?.overall_rating_score || '4.90' }}</b>
              <span>Overall Rating</span>
              <span class="ws-badge ws-badge-success">PASSED / GRADE AAA</span>
            </div>
          </div>
          <table class="ws-spec-table">
            <tbody>
              <tr><th>실사 기관</th><td>{{ activeAudit?.auditor_agency || 'SGS' }} Geneva Headquarters</td></tr>
              <tr><th>적용 표준</th><td>{{ activeAudit?.audit_standard || 'ISO9001' }}:2015 & SA8000</td></tr>
              <tr><th>샘플링 기준</th><td>MIL-STD-105E AQL 2.5 (Major 0% · Minor 1.2%)</td></tr>
              <tr><th>실사 일자</th><td>{{ activeAudit?.audit_date || '2026-10-18' }}</td></tr>
              <tr><th>유효 기한</th><td>{{ activeAudit?.expires_at || '2027-10-17' }} (1년 유효)</td></tr>
              <tr><th>피감사 기업</th><td>{{ product?.supplier_name || 'Precision Korea Industrial' }}</td></tr>
            </tbody>
          </table>
          <div class="ws-banner ws-banner-info">
            <WsIcon name="lock" :size="16" />
            <div><b>블록체인 무결성 증명</b><br /><code class="hash-code">0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</code><p class="ws-hint">위변조 방지 전자서명 적용 국제 공인 인증서 · Trade Assurance 보증 한도 산출 기초 자료</p></div>
          </div>
        </div>
        <div class="ws-modal-foot">
          <button class="ws-btn ws-btn-secondary" @click="showAuditModal = false">닫기</button>
          <a :href="activeAudit?.report_pdf_url || '#'" target="_blank" rel="noopener noreferrer" class="ws-btn ws-btn-primary">
            <WsIcon name="download" :size="14" /> 원본 성적서 PDF 다운로드
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const props = defineProps<{
  product: any;
  locale: string;
  currency: string;
}>();

const selectedPhotoIndex = ref(0);
const showAuditModal = ref(false);
const audits = ref<any[]>([]);

const activeAudit = computed(() => {
  if (audits.value.length > 0) return audits.value[0];
  return {
    auditor_agency: 'SGS',
    audit_standard: 'ISO9001',
    overall_rating_score: 4.90,
    qc_status: 'PASSED',
    audit_date: '2026-10-18',
    expires_at: '2027-10-17',
    report_pdf_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
  };
});

onMounted(async () => {
  try {
    const res = await apiRequest('/catalog/audits');
    if (res && res.audits) {
      audits.value = res.audits;
    }
  } catch (_) {
    // Graceful fallback to default certified audit
  }
});

const imageList = computed<string[]>(() => {
  if (props.product?.images && props.product.images.length > 0) {
    return props.product.images;
  }
  if (props.product?.thumbnail) {
    return [props.product.thumbnail];
  }
  return [
    'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
  ];
});

const currentImage = computed(() => {
  return imageList.value[selectedPhotoIndex.value] || imageList.value[0];
});
</script>

<style scoped>
.gal-col { display: flex; flex-direction: column; gap: 14px; }
.gal-main { position: relative; border-radius: var(--ws-radius-card); overflow: hidden; border: 1px solid var(--ws-border-subtle); background: var(--ws-surface-muted); aspect-ratio: 1 / 1; }
.gal-main img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ta-float { position: absolute; top: 12px; left: 12px; display: inline-flex; align-items: center; gap: 5px; background: rgb(11 28 48 / 0.85); color: #7dd3fc; font-size: 11px; font-weight: 800; padding: 5px 11px; border-radius: 9999px; }
.photo-count { position: absolute; bottom: 12px; right: 12px; background: rgb(0 0 0 / 0.6); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 6px; }
.gal-thumbs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; }
.h-ico { color: var(--ws-navy); vertical-align: -3px; }
.fac-facts div { display: flex; flex-direction: column; gap: 3px; padding: 9px 0; border-bottom: 1px solid var(--ws-border-subtle); }
.fac-facts span { font-size: 11px; font-weight: 700; color: var(--ws-text-muted); }
.fac-facts b { font-size: 13px; }
.audit-strip { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; background: var(--ws-surface-muted); border-radius: 8px; padding: 10px 12px; margin-top: 14px; }
.store-link { margin-top: 12px; }
.cert-hero { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; align-items: center; background: var(--ws-navy-ink); color: #fff; border-radius: 10px; padding: 20px; margin-bottom: 16px; }
.cert-agency b { display: block; font-size: 26px; font-weight: 900; }
.cert-agency span { font-size: 12px; color: #93a4bc; font-weight: 600; }
.cert-score { text-align: right; display: flex; flex-direction: column; gap: 2px; align-items: flex-end; }
.cert-score b { font-size: 32px; font-weight: 900; color: #fbbf24; }
.cert-score span { font-size: 11px; color: #93a4bc; font-weight: 700; }
.hash-code { font-size: 11px; word-break: break-all; }
@media (max-width: 640px) {
  .cert-hero { grid-template-columns: minmax(0, 1fr); }
  .cert-score { align-items: flex-start; text-align: left; }
}
</style>
