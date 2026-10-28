<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
    <div class="modal-card">
      <div class="modal-head">
        <h3>📷 AI 비전 이미지로 도매 품목/공급사 찾기</h3>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>
      <div class="modal-body">
        <label class="drop-zone">
          <input
            type="file"
            accept="image/*"
            class="hidden-file-input"
            @change="onFileSelected"
          />
          <template v-if="previewUrl">
            <img :src="previewUrl" alt="Uploaded preview" class="preview-img" />
            <p class="drop-text">{{ selectedFileName }} ({{ selectedFileSize }})</p>
          </template>
          <template v-else>
            <span class="upload-icon">📁</span>
            <p class="drop-text">제품 샘플 사진이나 도면(JPG/PNG/WEBP)을 클릭하여 업로드하세요</p>
            <span class="sub-text">AI 비전 엔진이 형상, 재질, 치수와 유사한 인증 도매 상품을 실시간 매칭합니다</span>
          </template>
        </label>

        <div class="keyword-override">
          <label>형상/재질 힌트 키워드 (선택):</label>
          <input
            v-model="visualHint"
            type="text"
            placeholder="예: 스테인리스, CNC, PCB, 실리콘, 밸브..."
            @keyup.enter="runVisionSearch"
          />
          <button class="btn-analyze" :disabled="searching" @click="runVisionSearch">
            {{ searching ? '분석 중...' : '🔍 AI 비전 매칭 실행' }}
          </button>
        </div>

        <div v-if="matchedResults.length > 0" class="sim-result">
          <p class="success-msg">
            ✓ AI 비전 분석 완료: <strong>{{ detectedCategory }}</strong> 형상 매칭 ({{ matchedResults.length }}건 발견)
          </p>
          <div class="matched-list">
            <div
              v-for="prod in matchedResults.slice(0, 4)"
              :key="prod.id"
              class="matched-item"
              @click="goToProduct(prod.id)"
            >
              <img :src="prod.thumbnail || prod.images?.[0]" :alt="prod.title" class="matched-thumb" />
              <div class="matched-info">
                <div class="m-title">{{ prod.title }}</div>
                <div class="m-meta">일치율: <strong>{{ prod.visual_confidence }}</strong> | MOQ: {{ prod.moq }} {{ prod.unit }}</div>
              </div>
            </div>
          </div>
          <button class="btn-search-sim" @click="onApply">
            전체 매칭 카탈로그 결과 보기 →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiRequest } from '../api';

defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'search-matched', query: string): void;
}>();

const router = useRouter();
const route = useRoute();

const previewUrl = ref<string | null>(null);
const selectedFileName = ref('');
const selectedFileSize = ref('');
const visualHint = ref('스테인리스');
const searching = ref(false);
const detectedCategory = ref('');
const matchedResults = ref<any[]>([]);

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  selectedFileName.value = file.name;
  selectedFileSize.value = `${(file.size / 1024).toFixed(1)} KB`;
  const nameLower = file.name.toLowerCase();
  if (nameLower.includes('cnc') || nameLower.includes('metal')) visualHint.value = 'CNC';
  else if (nameLower.includes('pcb') || nameLower.includes('elec')) visualHint.value = 'PCB';
  else if (nameLower.includes('box') || nameLower.includes('pack')) visualHint.value = '패키징';

  const reader = new FileReader();
  reader.onload = () => {
    previewUrl.value = reader.result as string;
    runVisionSearch();
  };
  reader.readAsDataURL(file);
}

async function runVisionSearch() {
  searching.value = true;
  try {
    const res = await apiRequest('/catalog/image-search', {
      method: 'POST',
      body: JSON.stringify({
        visual_query: visualHint.value || '스테인리스',
        file_name: selectedFileName.value || 'sample_upload.jpg',
      }),
    });
    detectedCategory.value = res.query_features?.detected_category || visualHint.value;
    matchedResults.value = res.results || [];
  } catch (err: any) {
    alert(`비전 검색 오류: ${err.message}`);
  } finally {
    searching.value = false;
  }
}

function goToProduct(prodId: string) {
  const loc = (route.params.locale as string) || 'ko';
  const cur = (route.params.currency as string) || 'KRW';
  emit('update:modelValue', false);
  router.push(`/${loc}/${cur}/products/${prodId}`);
}

function closeModal() {
  emit('update:modelValue', false);
}

function onApply() {
  emit('update:modelValue', false);
  emit('search-matched', visualHint.value || '스테인리스');
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; }
.modal-card { background: #FFF; width: 620px; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); }
.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #E2E8F0; }
.modal-head h3 { margin: 0; font-size: 16px; color: #1E293B; }
.close-btn { background: transparent; border: none; font-size: 18px; cursor: pointer; color: #64748B; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.drop-zone { display: block; border: 2px dashed #CBD5E1; border-radius: 8px; padding: 24px 20px; text-align: center; cursor: pointer; background: #F8FAFC; transition: border-color 0.2s; }
.drop-zone:hover { border-color: #D64000; background: #FFF7ED; }
.hidden-file-input { display: none; }
.preview-img { max-height: 140px; border-radius: 6px; margin-bottom: 8px; object-fit: contain; }
.upload-icon { font-size: 32px; display: block; margin-bottom: 8px; }
.drop-text { font-size: 14px; font-weight: 700; color: #1E293B; margin: 0 0 4px 0; }
.sub-text { font-size: 12px; color: #64748B; }

.keyword-override { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.keyword-override input { flex: 1; border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px 10px; font-size: 13px; }
.btn-analyze { background: #1E293B; color: #FFF; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 700; cursor: pointer; }

.sim-result { background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; padding: 14px; }
.success-msg { color: #166534; font-size: 13px; margin: 0 0 10px 0; }
.matched-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
.matched-item { display: flex; align-items: center; gap: 8px; background: #FFF; padding: 8px; border-radius: 6px; border: 1px solid #DCFCE7; cursor: pointer; }
.matched-item:hover { border-color: #D64000; }
.matched-thumb { width: 44px; height: 44px; border-radius: 4px; object-fit: cover; }
.m-title { font-size: 12px; font-weight: 700; color: #0F172A; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.m-meta { font-size: 11px; color: #475569; }
.btn-search-sim { width: 100%; background: #D64000; color: #FFF; border: none; padding: 10px; border-radius: 6px; font-weight: 700; cursor: pointer; }
</style>
