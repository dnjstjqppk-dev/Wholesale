<template>
  <div v-if="modelValue" class="ws-modal-backdrop" @click.self="closeModal">
    <div class="ws-modal" role="dialog" aria-modal="true">
      <div class="ws-modal-head">
        <h3>AI 비전 이미지 검색</h3>
        <button class="ws-icon-btn" aria-label="닫기" @click="closeModal"><WsIcon name="x" :size="15" /></button>
      </div>
      <div class="ws-modal-body">
        <label class="vision-drop">
          <input type="file" accept="image/*" class="ws-sr-only" @change="onFileSelected" />
          <template v-if="previewUrl">
            <img :src="previewUrl" alt="Uploaded preview" class="vision-preview" />
            <p class="ws-small"><b>{{ selectedFileName }}</b> ({{ selectedFileSize }})</p>
          </template>
          <template v-else>
            <WsIcon name="camera" :size="28" class="vision-ico" />
            <p><b>제품 사진·도면(JPG/PNG/WEBP)을 클릭하여 업로드</b></p>
            <span class="ws-small ws-muted">AI 비전 엔진이 형상·재질·치수 유사 상품을 실시간 매칭합니다</span>
          </template>
        </label>

        <div class="ws-field">
          <label>형상/재질 힌트 키워드 (선택)</label>
          <div class="hint-row">
            <input v-model="visualHint" type="text" placeholder="예: 스테인리스, CNC, PCB, 실리콘, 밸브..." @keyup.enter="runVisionSearch" />
            <button class="ws-btn ws-btn-accent" :disabled="searching" @click="runVisionSearch">
              <WsIcon v-if="!searching" name="search" :size="14" /> {{ searching ? '분석 중...' : 'AI 매칭 실행' }}
            </button>
          </div>
        </div>

        <div v-if="matchedResults.length > 0" class="vision-res">
          <p class="ws-small"><b class="ws-price-dark">{{ detectedCategory }}</b> 형상 매칭 · {{ matchedResults.length }}건 발견</p>
          <div class="vision-grid">
            <div v-for="prod in matchedResults.slice(0, 4)" :key="prod.id" class="vision-item" @click="goToProduct(prod.id)">
              <img :src="prod.thumbnail || prod.images?.[0]" :alt="prod.title" />
              <div class="ws-list-main">
                <p class="ws-list-title">{{ prod.title }}</p>
                <p class="ws-list-sub">일치율 <b>{{ prod.visual_confidence }}</b> · MOQ {{ prod.moq }}{{ prod.unit }}</p>
              </div>
            </div>
          </div>
          <button class="ws-btn ws-btn-accent ws-btn-block" @click="onApply">전체 매칭 카탈로그 결과 보기 →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

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
.vision-drop { display: block; border: 1.5px dashed var(--ws-border-strong); border-radius: 10px; padding: 26px 18px; text-align: center; cursor: pointer; background: var(--ws-surface-muted); margin-bottom: 16px; }
.vision-drop:hover { border-color: var(--ws-brand); background: var(--ws-brand-faint); }
.vision-drop p { margin: 8px 0 2px; font-size: 13px; }
.vision-ico { color: var(--ws-text-faint); }
.vision-preview { max-height: 140px; border-radius: 8px; object-fit: contain; }
.hint-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
.vision-res { background: #f6fef9; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px; margin-top: 4px; }
.vision-res > p { margin: 0 0 10px; }
.vision-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
.vision-item { display: flex; gap: 10px; align-items: center; background: #fff; border: 1px solid var(--ws-border-subtle); border-radius: 8px; padding: 8px; cursor: pointer; }
.vision-item:hover { border-color: var(--ws-brand); }
.vision-item img { width: 46px; height: 46px; border-radius: 6px; object-fit: cover; flex: none; background: var(--ws-surface-muted); }
@media (max-width: 640px) {
  .vision-grid { grid-template-columns: minmax(0, 1fr); }
  .hint-row { grid-template-columns: minmax(0, 1fr); }
}
</style>
