<template>
  <div class="verif-page">
    <h2>공급사 입점 온보딩 & Verified Supplier 실사 서류 제출</h2>
    <p class="subtitle">SGS / TÜV Rheinland 제3자 현장 공장 실사 리포트 및 ISO/CE/FDA 인증서를 제출하여 Verified 자격을 취득하세요.</p>

    <!-- Existing Verifications Status -->
    <div class="status-section">
      <h3>📋 기업 실사 심사 이력 및 현재 상태</h3>
      <div v-for="v in verifications" :key="v.id" class="verif-card">
        <div class="v-top">
          <div>
            <strong>{{ v.company_name }}</strong>
            <span class="biz-no">사업자번호: {{ v.business_number }} | 유형: {{ v.business_type }}</span>
          </div>
          <span class="status-badge" :class="v.status.toLowerCase()">{{ v.status }}</span>
        </div>
        <div class="v-metrics">
          <span>🏭 공장 면적: {{ v.facilities_sqm?.toLocaleString() }} m²</span>
          <span>⚙️ 생산 라인: {{ v.production_lines }}개</span>
          <span>🔬 QC 검수원: {{ v.qc_inspectors }}명</span>
          <span>📜 보유 인증: {{ (v.certificates || []).join(', ') }}</span>
        </div>
        <div v-if="v.rejection_reason" class="reject-alert">
          ⚠️ 반려 사유: {{ v.rejection_reason }}
        </div>
      </div>
    </div>

    <!-- Submit New / Updated Verification Form -->
    <form class="form-card" @submit.prevent="submitVerification">
      <h3>📤 신규 공장 실사 성적서 및 인증서 제출</h3>
      <div class="form-grid">
        <div class="field">
          <label>법인 상호명 (Legal Name)</label>
          <input v-model="form.company_name" type="text" required />
        </div>
        <div class="field">
          <label>사업자등록번호 (Business Registration No.)</label>
          <input v-model="form.business_number" type="text" required />
        </div>
        <div class="field">
          <label>공급사 유형 (Business Type)</label>
          <select v-model="form.business_type">
            <option value="MANUFACTURER">MANUFACTURER (직접 제조 공장)</option>
            <option value="OEM_ODM">OEM_ODM (맞춤형 위탁 제조사)</option>
            <option value="TRADING_COMPANY">TRADING_COMPANY (전문 무역상사)</option>
          </select>
        </div>
        <div class="field">
          <label>공장 부지 면적 (m²)</label>
          <input v-model.number="form.facilities_sqm" type="number" min="100" required />
        </div>
        <div class="field">
          <label>가동 생산 라인 수 (Lines)</label>
          <input v-model.number="form.production_lines" type="number" min="1" required />
        </div>
        <div class="field">
          <label>전담 품질관리(QC) 인력 수</label>
          <input v-model.number="form.qc_inspectors" type="number" min="1" required />
        </div>
        <div class="field span-2">
          <label>사업자등록증 사본 이미지 URL</label>
          <input v-model="form.license_url" type="url" required />
        </div>
        <div class="field span-2">
          <label>SGS / TÜV 공장 실사 성적서 이미지 URL</label>
          <input v-model="form.audit_report_url" type="url" required />
        </div>
        <div class="field span-2">
          <label>보유 국제 품질 인증서 (쉼표 구분)</label>
          <input v-model="certsInput" type="text" placeholder="ISO 9001:2015, CE, FDA GRAS, RoHS" />
        </div>
      </div>

      <button type="submit" class="btn-submit" :disabled="submitting">
        {{ submitting ? '플랫폼 심사팀으로 제출 중...' : '🛡️ Verified Supplier 실사 심사 요청 제출' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest, getCurrentUser } from '../api';

const verifications = ref<any[]>([]);
const submitting = ref(false);
const certsInput = ref('ISO 9001:2015, ISO 14001, CE Machinery Directive, RoHS 2.0');

const form = ref({
  company_name: 'Precision Korea Co., Ltd. (글로벌정밀산업)',
  business_number: '123-45-67890',
  business_type: 'MANUFACTURER',
  facilities_sqm: 15000,
  production_lines: 8,
  qc_inspectors: 14,
  license_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
  audit_report_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
});

async function loadVerifications() {
  try {
    const res = await apiRequest('/admin/verifications');
    verifications.value = res.verifications || [];
  } catch (e) {
    console.warn('Failed to load verifications:', e);
  }
}

async function submitVerification() {
  submitting.value = true;
  const user = getCurrentUser();
  const orgId = user.organization?.id || '11111111-1111-1111-1111-111111111111';
  try {
    const res = await apiRequest(`/organizations/${orgId}/verifications`, {
      method: 'POST',
      body: JSON.stringify({
        ...form.value,
        certificates: certsInput.value.split(',').map(s => s.trim()).filter(Boolean),
      }),
    });
    verifications.value.unshift(res);
    alert(`[실사 서류 제출 완료]\n접수 번호: ${res.id}\n상태: ${res.status}\n운영 관리자 콘솔(/verifications)에서 즉시 심사 승인/반려할 수 있습니다.`);
  } catch (err: any) {
    alert(`제출 실패: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  loadVerifications();
});
</script>

<style scoped>
.verif-page { max-width: 960px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
h2 { margin: 0; font-size: 20px; color: #172B4D; }
.subtitle { margin: 0; font-size: 13px; color: #64748B; }
.status-section, .form-card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 24px; }
.status-section h3, .form-card h3 { margin: 0 0 16px 0; font-size: 16px; color: #172B4D; }
.verif-card { border: 1px solid #E2E8F0; border-radius: 6px; padding: 14px; margin-bottom: 10px; background: #F8FAFC; }
.v-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.biz-no { font-size: 12px; color: #64748B; margin-left: 10px; }
.status-badge { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; }
.status-badge.approved { background: #DCFCE7; color: #15803D; }
.status-badge.pending { background: #FEF3C7; color: #B45309; }
.status-badge.rejected { background: #FEE2E2; color: #B91C1C; }
.v-metrics { display: flex; gap: 16px; font-size: 12px; color: #334155; }
.reject-alert { margin-top: 8px; color: #B91C1C; font-size: 12px; font-weight: 700; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field.span-2 { grid-column: span 2; }
.field label { font-size: 12px; font-weight: 700; color: #334155; }
.field input, .field select { border: 1px solid #CBD5E1; border-radius: 6px; padding: 9px 12px; font-size: 13px; }
.btn-submit { background: #C2410C; color: #FFF; border: none; padding: 12px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 14px; }

@media (max-width: 640px) {
  .v-top { flex-direction: column; align-items: flex-start; gap: 6px; }
  .v-metrics { flex-direction: column; gap: 6px; }
  .form-grid { grid-template-columns: 1fr; }
  .field.span-2 { grid-column: span 1; }
  .status-section, .form-card { padding: 16px; }
}
</style>

