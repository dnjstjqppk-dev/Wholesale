<template>
  <div class="ws-page">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Bulk Import</p>
      <div class="ws-page-head-row">
        <h1 class="ws-page-title">CSV 대량 상품 등록</h1>
        <div class="ws-page-actions">
          <button class="ws-btn ws-btn-secondary ws-btn-sm" @click="downloadTemplate"><WsIcon name="download" :size="14" /> 표준 양식 다운로드</button>
        </div>
      </div>
      <p class="ws-page-sub">수백 개 SKU·구간단가를 Dry-run 검증 후 원자적으로(Atomically) 등록합니다.</p>
    </div>

    <div class="ws-steps">
      <div class="ws-step" :class="dryRunResult ? 'ws-step-done' : 'ws-step-active'">
        <span class="ws-step-num">{{ dryRunResult ? '✓' : '1' }}</span>
        <span class="ws-step-label">Dry-run 유효성 검증</span>
      </div>
      <div class="ws-step" :class="{ 'ws-step-active': !!dryRunResult && !commitResult, 'ws-step-done': !!commitResult }">
        <span class="ws-step-num">{{ commitResult ? '✓' : '2' }}</span>
        <span class="ws-step-label">원자적 일괄 등록</span>
      </div>
    </div>

    <section class="ws-card">
      <div class="ws-split" style="margin-bottom: 10px">
        <b>1 · CSV 업로드·원본 편집 (헤더 포함)</b>
        <input type="file" accept=".csv,.txt" class="file-input" @change="onCsvFileChosen" />
      </div>
      <textarea v-model="csvContent" rows="7" class="ws-input ws-textarea csv-area"></textarea>
      <p class="ws-hint">컬럼 규격: <code>title,category,moq,unit,base_price,sub_category,lead_time_days,incoterms</code></p>

      <div class="ws-cluster" style="margin-top: 14px">
        <button class="ws-btn ws-btn-navy" :disabled="processing" @click="runServerDryRun">
          <WsIcon name="search" :size="14" /> 1단계: Dry-run 검증
        </button>
        <button
          class="ws-btn ws-btn-primary"
          :disabled="processing || !dryRunResult || dryRunResult.invalid_count > 0 || dryRunResult.valid_count === 0"
          @click="commitBulkUpload"
        >
          <WsIcon name="send" :size="14" /> 2단계: 검증 통과 품목 일괄 등록
        </button>
      </div>

      <div v-if="dryRunResult" class="result-box">
        <span class="ws-cluster" style="gap: 8px">
          <span class="ws-badge ws-badge-outline">전체 {{ dryRunResult.total_rows }}건</span>
          <span class="ws-badge ws-badge-success">유효 {{ dryRunResult.valid_count }}건</span>
          <span v-if="dryRunResult.invalid_count > 0" class="ws-badge ws-badge-danger">오류 {{ dryRunResult.invalid_count }}건</span>
        </span>
        <p class="ws-small">{{ dryRunResult.message }}</p>
        <div v-if="dryRunResult.errors?.length > 0" class="ws-banner ws-banner-danger">
          <WsIcon name="alert" :size="16" />
          <div>
            <b>서버 검증 오류 상세</b>
            <ul style="margin: 6px 0 0; padding-left: 18px">
              <li v-for="(e, i) in dryRunResult.errors" :key="i">Row #{{ e.row }}: {{ e.error }}</li>
            </ul>
          </div>
        </div>
        <div v-if="dryRunResult.sample_preview?.length > 0" class="ws-table-wrap">
          <div class="ws-table-scroll">
            <table class="ws-table">
              <thead><tr><th>상품명</th><th>카테고리</th><th>MOQ</th><th>단위</th><th class="ws-num">기본 단가</th><th>인도조건</th></tr></thead>
              <tbody>
                <tr v-for="(r, idx) in dryRunResult.sample_preview" :key="idx">
                  <td class="ws-cell-main">{{ r.title }}</td>
                  <td class="ws-cell-sub">{{ r.category }} ({{ r.sub_category }})</td>
                  <td class="ws-figure">{{ r.moq }}</td>
                  <td>{{ r.unit }}</td>
                  <td class="ws-num"><b class="ws-price ws-figure">${{ Number(r.price_tiers?.[0]?.unit_price || 0).toFixed(2) }}</b></td>
                  <td>{{ r.incoterms }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="commitResult" class="ws-banner ws-banner-success">
        <WsIcon name="check" :size="16" />
        <div>
          <b>일괄 등록 완료 (Job {{ commitResult.import_job_id }})</b><br />
          {{ commitResult.message }} — 등록된 상품은 즉시 바이어 카탈로그에 노출됩니다.
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const SAMPLE_CSV = `title,category,moq,unit,base_price,sub_category,lead_time_days,incoterms
SUS304 이중 진공 텀블러 500ml 벌크,CAT-HOM,100,pcs,4.20,스테인리스 진공 텀블러,14,FOB Busan Port
고강도 카톤 수출용 박스 600x400,CAT-PKG,500,pcs,1.15,골판지 카톤 박스,7,FOB Incheon
CNC 정밀 가공 티타늄 볼트 M8 세트,CAT-IND,200,sets,8.50,CNC 머시닝센터,14,FOB Busan Port`;

const csvContent = ref(SAMPLE_CSV);
const processing = ref(false);
const dryRunResult = ref<any>(null);
const commitResult = ref<any>(null);

function downloadTemplate() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wholesale_bulk_upload_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function onCsvFileChosen(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    csvContent.value = reader.result as string;
    dryRunResult.value = null;
    commitResult.value = null;
  };
  reader.readAsText(file);
}

async function runServerDryRun() {
  processing.value = true;
  commitResult.value = null;
  try {
    const res = await apiRequest('/catalog/bulk-upload', {
      method: 'POST',
      body: JSON.stringify({
        csv_content: csvContent.value,
        dry_run: true,
      }),
    });
    dryRunResult.value = res;
  } catch (err: any) {
    alert(`Dry-run 검증 실패: ${err.message}`);
  } finally {
    processing.value = false;
  }
}

async function commitBulkUpload() {
  processing.value = true;
  try {
    const res = await apiRequest('/catalog/bulk-upload', {
      method: 'POST',
      body: JSON.stringify({
        csv_content: csvContent.value,
        dry_run: false,
      }),
    });
    commitResult.value = res;
  } catch (err: any) {
    alert(`일괄 등록 실패: ${err.message}`);
  } finally {
    processing.value = false;
  }
}
</script>

<style scoped>
.file-input { font-size: 12px; max-width: 260px; }
.csv-area { font-family: ui-monospace, monospace; font-size: 12px; background: var(--ws-surface-muted); }
.result-box { margin-top: 16px; display: flex; flex-direction: column; gap: 10px; }
.result-box p { margin: 0; }
</style>
