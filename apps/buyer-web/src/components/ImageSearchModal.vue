<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
    <div class="modal-card">
      <div class="modal-head">
        <h3>📷 이미지로 도매 품목/공급사 찾기</h3>
        <button class="close-btn" @click="$emit('update:modelValue', false)">✕</button>
      </div>
      <div class="modal-body">
        <div class="drop-zone" @click="uploadedImageSimulated = true">
          <span class="upload-icon">📁</span>
          <p class="drop-text">제품 샘플 사진이나 도면(CAD/JPG/PNG)을 드래그하거나 클릭하여 업로드하세요</p>
          <span class="sub-text">AI 비전 엔진이 형상, 재질, 치수와 유사한 인증 도매 상품을 매칭합니다</span>
        </div>
        <div v-if="uploadedImageSimulated" class="sim-result">
          <p class="success-msg">✓ 이미지 분석 완료: <strong>산업용 스테인리스 용기 / SUS304</strong> 형상 매칭 (98.4%)</p>
          <button class="btn-search-sim" @click="onApply">매칭 상품 2건 확인하기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'search-matched'): void;
}>();

const uploadedImageSimulated = ref(false);

function onApply() {
  uploadedImageSimulated.value = false;
  emit('update:modelValue', false);
  emit('search-matched');
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal-card { background: #FFF; width: 560px; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); }
.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #E2E8F0; }
.modal-head h3 { margin: 0; font-size: 16px; color: #1E293B; }
.close-btn { background: transparent; border: none; font-size: 18px; cursor: pointer; color: #64748B; }
.modal-body { padding: 24px; }
.drop-zone { border: 2px dashed #CBD5E1; border-radius: 8px; padding: 36px 20px; text-align: center; cursor: pointer; background: #F8FAFC; transition: border-color 0.2s; }
.drop-zone:hover { border-color: #FF6600; background: #FFF7ED; }
.upload-icon { font-size: 36px; display: block; margin-bottom: 12px; }
.drop-text { font-size: 14px; font-weight: 700; color: #1E293B; margin: 0 0 6px 0; }
.sub-text { font-size: 12px; color: #64748B; }
.sim-result { margin-top: 16px; background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 6px; padding: 14px; text-align: center; }
.success-msg { color: #166534; font-size: 13px; margin: 0 0 10px 0; }
.btn-search-sim { background: #FF6600; color: #FFF; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; }
</style>
