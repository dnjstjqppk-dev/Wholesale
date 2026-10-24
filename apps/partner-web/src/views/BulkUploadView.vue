<template>
  <div class="bulk-upload">
    <div class="head-row">
      <div>
        <h2>CSV 대량 상품 등록 및 서버 트랜잭션 검증 (Bulk Import)</h2>
        <p class="subtitle">수백 개의 도매 SKU와 구간단가를 서버 API(`POST /v1/catalog/bulk-upload`)를 통해 Dry-run 검증 후 원자적(Atomically)으로 등록합니다.</p>
      </div>
      <button class="btn-template" @click="downloadTemplate">📥 표준 CSV 양식 다운로드</button>
    </div>

    <div class="card">
      <div class="upload-section">
        <div class="file-row">
          <label>1. CSV 파일 업로드 또는 원본 데이터 편집 (헤더 포함)</label>
          <input type="file" accept=".csv,.txt" @change="onCsvFileChosen" />
        </div>
        <textarea v-model="csvContent" rows="7" class="csv-textarea"></textarea>
        <p class="hint">※ 컬럼 규격: `title,category,moq,unit,base_price,sub_category,lead_time_days,incoterms`</p>
      </div>

      <div class="action-bar">
        <button class="btn-dryrun" :disabled="processing" @click="runServerDryRun">
          🔍 1단계: 서버 Dry-run 유효성 사전 검증 (`POST /v1/catalog/bulk-upload`)
        </button>
        <button
          class="btn-commit"
          :disabled="processing || !dryRunResult || dryRunResult.invalid_count > 0 || dryRunResult.valid_count === 0"
          @click="commitBulkUpload"
        >
          🚀 2단계: 검증 통과 품목 카탈로그 원자적(Atomic) 일괄 등록
        </button>
      </div>

      <!-- Dry Run Result -->
      <div v-if="dryRunResult" class="result-section">
        <div class="result-summary">
          <span class="tag-total">전체 행: {{ dryRunResult.total_rows }}건</span>
          <span class="tag-ok">유효 통과: {{ dryRunResult.valid_count }}건</span>
          <span v-if="dryRunResult.invalid_count > 0" class="tag-err">오류 행: {{ dryRunResult.invalid_count }}건</span>
        </div>
        <p class="server-msg">{{ dryRunResult.message }}</p>

        <div v-if="dryRunResult.errors?.length > 0" class="err-box">
          <h4>⚠️ 서버 검증 오류 상세</h4>
          <ul>
            <li v-for="(e, i) in dryRunResult.errors" :key="i">Row #{{ e.row }}: {{ e.error }}</li>
          </ul>
        </div>

        <table v-if="dryRunResult.sample_preview?.length > 0" class="result-table">
          <thead>
            <tr>
              <th>상품명</th>
              <th>카테고리</th>
              <th>MOQ</th>
              <th>단위</th>
              <th>기본 단가 (USD)</th>
              <th>인도조건</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, idx) in dryRunResult.sample_preview" :key="idx">
              <td class="bold">{{ r.title }}</td>
              <td>{{ r.category }} ({{ r.sub_category }})</td>
              <td>{{ r.moq }}</td>
              <td>{{ r.unit }}</td>
              <td>${{ Number(r.price_tiers?.[0]?.unit_price || 0).toFixed(2) }}</td>
              <td>{{ r.incoterms }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="commitResult" class="commit-banner">
        <strong>✅ 서버 일괄 등록 완료 (Job ID: {{ commitResult.import_job_id }})</strong>
        <p>{{ commitResult.message }} — 등록된 상품은 즉시 구매자 카탈로그에 노출됩니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { apiRequest } from '../api';

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
.bulk-upload { max-width: 980px; }
.head-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
h2 { margin: 0 0 4px 0; font-size: 20px; color: #172B4D; }
.subtitle { color: #64748B; font-size: 13px; margin: 0; }
.btn-template { background: #FFF; border: 1px solid #CBD5E1; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; color: #1E293B; }
.card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 24px; }
.file-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.upload-section label { font-size: 13px; font-weight: 700; color: #172B4D; }
.csv-textarea { width: 100%; font-family: monospace; font-size: 12px; padding: 12px; border: 1px solid #D8E0EB; border-radius: 6px; background: #F8FAFC; box-sizing: border-box; }
.hint { font-size: 11px; color: #64748B; margin: 6px 0 16px 0; }
.action-bar { display: flex; gap: 12px; margin-bottom: 20px; }
.btn-dryrun { background: #1E293B; color: #FFF; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; }
.btn-commit { background: #15803D; color: #FFF; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; }
.btn-commit:disabled { background: #CBD5E1; cursor: not-allowed; }
.result-summary { display: flex; gap: 12px; margin-bottom: 8px; font-size: 12px; font-weight: 700; }
.tag-total { background: #F1F5F9; padding: 4px 10px; border-radius: 4px; }
.tag-ok { background: #DCFCE7; color: #15803D; padding: 4px 10px; border-radius: 4px; }
.tag-err { background: #FEE2E2; color: #B91C1C; padding: 4px 10px; border-radius: 4px; }
.server-msg { font-size: 13px; color: #334155; margin-bottom: 12px; }
.err-box { background: #FEF2F2; border: 1px solid #FECACA; padding: 12px; border-radius: 6px; color: #B91C1C; font-size: 12px; margin-bottom: 12px; }
.result-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.result-table th, .result-table td { border: 1px solid #D8E0EB; padding: 8px 10px; text-align: left; }
.result-table th { background: #F8FAFC; }
.bold { font-weight: 700; }
.commit-banner { margin-top: 16px; background: #F0FDF4; border: 1px solid #86EFAC; padding: 14px 18px; border-radius: 6px; color: #14532D; font-size: 13px; }
</style>
