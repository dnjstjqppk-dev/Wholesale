<template>
  <div class="gallery-col">
    <!-- Main High-Res Image Viewport with Real <img> -->
    <div class="main-image-viewport">
      <img
        :src="currentImage"
        :alt="product?.title || 'Wholesale Product'"
        class="active-product-image"
      />
      <span v-if="product?.trade_assurance" class="ta-floating-badge">
        🛡️ Trade Assurance 100% 안심 무역 보증
      </span>
      <span class="photo-counter">
        {{ selectedPhotoIndex + 1 }} / {{ imageList.length }}
      </span>
    </div>

    <!-- Thumbnail Strip -->
    <div class="thumbnail-strip">
      <div
        v-for="(imgUrl, idx) in imageList"
        :key="idx"
        class="thumb-box"
        :class="{ active: selectedPhotoIndex === idx }"
        @click="selectedPhotoIndex = idx"
      >
        <img :src="imgUrl" :alt="`Thumbnail ${idx + 1}`" class="thumb-img" />
      </div>
    </div>

    <!-- Dynamic Verified Factory Audit Summary Card -->
    <div class="factory-audit-card">
      <div class="fac-head">
        <span class="fac-icon">🏭</span>
        <div class="fac-title-area">
          <h4>{{ product?.supplier_name || '제조사 공장 실사 보고서' }}</h4>
          <p>SGS 및 플랫폼 운영진 현장 실사 성적서 (Third-Party Audited)</p>
        </div>
        <span v-if="product?.verified_supplier" class="verified-tag">
          ✓ Verified Supplier
        </span>
      </div>

      <div class="fac-grid">
        <div class="fac-item">
          <span class="k">공장 부지 면적:</span>
          <span class="v">15,000 m² (제조 1~3 공장)</span>
        </div>
        <div class="fac-item">
          <span class="k">생산 라인 수:</span>
          <span class="v">8개 자동화 가공 라인</span>
        </div>
        <div class="fac-item">
          <span class="k">품질 검수원 (QC):</span>
          <span class="v">14명 상주 (ISO 9001:2015)</span>
        </div>
        <div class="fac-item">
          <span class="k">연간 수출 실적:</span>
          <span class="v">USD $12,500,000+</span>
        </div>
        <div class="fac-item">
          <span class="k">인콰이어리 응답률:</span>
          <span class="v highlight">{{ product?.response_rate || '99.2%' }}</span>
        </div>
        <div class="fac-item">
          <span class="k">업력 (Years in B2B):</span>
          <span class="v">{{ product?.years_in_business || 12 }}년</span>
        </div>
      </div>

      <!-- Action link to Storefront -->
      <div class="storefront-link-box">
        <router-link
          :to="`/${locale}/${currency}/suppliers/${product?.organization_id || '11111111-1111-1111-1111-111111111111'}`"
          class="btn-visit-storefront"
        >
          🏭 제조사 전용 미니사이트 & 공장 VR 설비 투어 보기 ›
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  product: any;
  locale: string;
  currency: string;
}>();

const selectedPhotoIndex = ref(0);

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
.gallery-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.main-image-viewport {
  height: 420px;
  background: #F8FAFC;
  border-radius: 10px;
  border: 1px solid #CBD5E1;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.active-product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}
.ta-floating-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(15, 23, 42, 0.85);
  color: #38BDF8;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  z-index: 2;
}
.photo-counter {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: #FFF;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
}
.thumbnail-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.thumb-box {
  width: 76px;
  height: 76px;
  border: 2px solid #E2E8F0;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  background: #FFF;
}
.thumb-box.active {
  border-color: #EA580C;
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.factory-audit-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 18px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}
.fac-head {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #F1F5F9;
  padding-bottom: 12px;
  margin-bottom: 14px;
}
.fac-icon {
  font-size: 26px;
}
.fac-title-area h4 {
  margin: 0;
  font-size: 14px;
  color: #0F172A;
  font-weight: 700;
}
.fac-title-area p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #64748B;
}
.verified-tag {
  margin-left: auto;
  background: #DCFCE7;
  color: #15803D;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 4px;
}
.fac-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  font-size: 12px;
  margin-bottom: 14px;
}
.fac-item .k {
  color: #64748B;
  display: block;
  margin-bottom: 2px;
}
.fac-item .v {
  font-weight: 700;
  color: #1E293B;
}
.fac-item .v.highlight {
  color: #16A34A;
}
.storefront-link-box {
  border-top: 1px solid #F1F5F9;
  padding-top: 12px;
}
.btn-visit-storefront {
  color: #EA580C;
  font-weight: 700;
  font-size: 12px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
}
.btn-visit-storefront:hover {
  text-decoration: underline;
}
</style>
