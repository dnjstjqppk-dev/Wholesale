<template>
  <div class="gallery-col">
    <div class="main-image-viewport">
      <div class="active-photo-display">
        <span class="photo-badge">{{ selectedPhotoLabel }}</span>
        <span class="photo-zoom-hint">🔍 고해상도 규격 도면 및 실사 확대</span>
      </div>
    </div>

    <!-- Thumbnail Switcher -->
    <div class="thumbnail-strip">
      <div
        v-for="(photo, idx) in photos"
        :key="idx"
        class="thumb-box"
        :class="{ active: selectedPhotoIndex === idx }"
        @click="selectedPhotoIndex = idx"
      >
        <span>{{ photo.thumbLabel }}</span>
      </div>
    </div>

    <!-- Verified Factory Audit Summary Card (Alibaba Style) -->
    <div class="factory-audit-card">
      <div class="fac-head">
        <span class="fac-icon">🏭</span>
        <div>
          <h4>제조사 현장 실사 보고서 (Factory Audit)</h4>
          <p>SGS 및 플랫폼 운영진 3자 현장 검증 완료</p>
        </div>
        <span class="verified-tag">✓ Verified Supplier</span>
      </div>
      <div class="fac-grid">
        <div class="fac-item">
          <span class="k">공장 부지 면적:</span>
          <span class="v">15,000 m² (제1~3 공장)</span>
        </div>
        <div class="fac-item">
          <span class="k">생산 라인 수:</span>
          <span class="v">8개 자동화 가공 라인</span>
        </div>
        <div class="fac-item">
          <span class="k">품질 검수원:</span>
          <span class="v">14명 상주 (ISO 9001)</span>
        </div>
        <div class="fac-item">
          <span class="k">연간 수출 실적:</span>
          <span class="v">USD $12,500,000+</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const photos = [
  { thumbLabel: '제품 전면 실물' },
  { thumbLabel: '내부 SUS304 진공 단면' },
  { thumbLabel: '밀폐 캡 실리콘 링' },
  { thumbLabel: '공장 생산 라인 실사' },
  { thumbLabel: '수출용 포장 팔레트' },
];

const selectedPhotoIndex = ref(0);
const selectedPhotoLabel = computed(() => photos[selectedPhotoIndex.value].thumbLabel);
</script>

<style scoped>
.gallery-col { display: flex; flex-direction: column; gap: 16px; }
.main-image-viewport { height: 380px; background: #E2E8F0; border-radius: 10px; border: 1px solid #CBD5E1; display: flex; align-items: center; justify-content: center; position: relative; }
.active-photo-display { text-align: center; }
.photo-badge { background: rgba(0,0,0,0.7); color: #FFF; font-size: 14px; font-weight: 700; padding: 6px 14px; border-radius: 6px; display: inline-block; margin-bottom: 8px; }
.photo-zoom-hint { display: block; font-size: 12px; color: #64748B; }
.thumbnail-strip { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; }
.thumb-box { flex: 1; min-width: 80px; height: 60px; background: #F1F5F9; border: 2px solid #E2E8F0; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #475569; text-align: center; cursor: pointer; padding: 4px; }
.thumb-box.active { border-color: #FF6600; background: #FFF7ED; color: #FF6600; }
.factory-audit-card { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 10px; padding: 18px; }
.fac-head { display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; margin-bottom: 12px; }
.fac-icon { font-size: 26px; }
.fac-head h4 { margin: 0; font-size: 14px; color: #1E293B; font-weight: 700; }
.fac-head p { margin: 2px 0 0 0; font-size: 11px; color: #64748B; }
.verified-tag { margin-left: auto; background: #DCFCE7; color: #15803D; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; }
.fac-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; }
.fac-item .k { color: #64748B; display: block; margin-bottom: 2px; }
.fac-item .v { font-weight: 700; color: #1E293B; }
</style>
