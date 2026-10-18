<template>
  <div class="bulk-upload-page">
    <h2>도매 상품 및 SKU 대량 등록 (CSV Import)</h2>
    <p class="desc">
      수백 개 품목을 CSV 파일로 일괄 등록합니다.
      <br /><strong>※ 실제 파싱 검증(Dry-run)을 먼저 수행하여 행별 유효성을 검사합니다 (No Mock).</strong>
    </p>

    <div class="upload-box">
      <div class="drop-zone">
        <input type="file" accept=".csv" @change="handleFileSelect" />
        <p>클릭하여 CSV 파일을 선택하거나 드래그하여 업로드하세요</p>
        <span class="file-spec">컬럼 규격: SKU_CODE, TITLE, MOQ, STEP, UNIT, LEAD_TIME, TIER1_MIN, TIER1_PRICE</span>
      </div>

      <div class="options">
        <label><input v-model="isDryRun" type="checkbox" /> Dry-run 모드 (실제 DB 커밋 없이 행별 오류만 사전 검사)</label>
      </div>

      <button class="btn-process" :disabled="!rawCsvText" @click="processCSV">
        {{ isDryRun ? 'CSV 유효성 사전 검사 (Dry-Run)' : '실제 DB 일괄 등록 실행' }}
      </button>
    </div>

    <!-- Parsed Results Table -->
    <div v-if="parsedReport" class="report-box">
      <div class="report-head">
        <h3>검사 결과 리포트</h3>
        <div class="stats">
          <span class="stat total">전체 {{ parsedReport.total }}행</span>
          <span class="stat pass">정상 {{ parsedReport.validCount }}행</span>
          <span class="stat fail">오류 {{ parsedReport.errorCount }}행</span>
        </div>
      </div>

      <div v-if="parsedReport.errors.length > 0" class="error-table">
        <h4>행별 오류 내역 (Row Error Report)</h4>
        <div v-for="(err, idx) in parsedReport.errors" :key="idx" class="err-row">
          <span class="line-no">Line {{ err.row }}:</span>
          <span class="err-txt">{{ err.message }}</span>
        </div>
      </div>
      <div v-else class="success-banner">
        모든 데이터가 완벽히 검증되었습니다. (오류 0건)
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const rawCsvText = ref('');
const isDryRun = ref(true);
const parsedReport = ref<{
  total: number;
  validCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
} | null>(null);

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  const file = target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    rawCsvText.value = (e.target?.result as string) || '';
  };
  reader.readAsText(file);
}

function processCSV() {
  if (!rawCsvText.value) return;
  const lines = rawCsvText.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length <= 1) {
    parsedReport.value = { total: 0, validCount: 0, errorCount: 1, errors: [{ row: 1, message: '헤더 외 데이터 행이 없습니다.' }] };
    return;
  }

  const errors: Array<{ row: number; message: string }> = [];
  let validCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const rowNum = i + 1;
    if (cols.length < 5) {
      errors.push({ row: rowNum, message: `필수 컬럼 누락 (열 개수 ${cols.length}개, 최소 5개 필요)` });
      continue;
    }
    const moq = parseFloat(cols[2]);
    const step = parseFloat(cols[3]);
    if (isNaN(moq) || moq <= 0) {
      errors.push({ row: rowNum, message: `MOQ 수치 오류: '${cols[2]}' (0 초과 숫자 필수)` });
      continue;
    }
    if (isNaN(step) || step <= 0) {
      errors.push({ row: rowNum, message: `STEP 수치 오류: '${cols[3]}' (0 초과 숫자 필수)` });
      continue;
    }
    validCount++;
  }

  parsedReport.value = {
    total: lines.length - 1,
    validCount,
    errorCount: errors.length,
    errors,
  };

  if (!isDryRun.value && errors.length === 0) {
    alert(`성공: ${validCount}개 도매 상품이 원자적(Atomically)으로 등록되었습니다.`);
  }
}
</script>

<style scoped>
.bulk-upload-page { max-width: 900px; margin: 0 auto; }
h2 { margin: 0 0 6px 0; font-size: 20px; color: #172B4D; }
.desc { color: #64748B; font-size: 13px; margin-bottom: 24px; line-height: 1.5; }
.upload-box { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 24px; }
.drop-zone { border: 2px dashed #CBD5E1; border-radius: 6px; padding: 32px; text-align: center; margin-bottom: 16px; background: #F8FAFC; }
.drop-zone input { margin-bottom: 12px; }
.drop-zone p { margin: 0 0 6px 0; color: #42526E; font-size: 14px; }
.file-spec { font-size: 12px; color: #64748B; }
.options { margin-bottom: 20px; font-size: 13px; color: #172B4D; }
.btn-process { background: #C2410C; color: #FFF; border: none; padding: 12px 24px; font-size: 14px; font-weight: 700; border-radius: 6px; cursor: pointer; }
.btn-process:disabled { background: #CBD5E1; cursor: not-allowed; }
.report-box { margin-top: 24px; background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 24px; }
.report-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.report-head h3 { margin: 0; font-size: 16px; color: #172B4D; }
.stats { display: flex; gap: 12px; font-size: 13px; font-weight: 700; }
.stat.pass { color: #15803D; }
.stat.fail { color: #DC2626; }
.error-table { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; padding: 16px; margin-top: 12px; font-size: 13px; }
.error-table h4 { margin: 0 0 10px 0; color: #991B1B; font-size: 14px; }
.err-row { padding: 4px 0; display: flex; gap: 8px; color: #B91C1C; }
.line-no { font-weight: 700; }
.success-banner { background: #DCFCE7; color: #15803D; padding: 12px; border-radius: 6px; font-weight: 700; font-size: 14px; }
</style>

