<template>
  <div class="audit-page">
    <h2>기업 및 공급사 입점 심사 (Verification Audit)</h2>
    <p class="subtitle">사업자등록증, 공장 실사 리포트(SGS/TÜV), 대표자 신원을 검수하여 공식 인증 배지를 부여합니다.</p>

    <div v-if="loading" class="loading-state">
      심사 대기열 데이터를 API 서버에서 조회 중입니다...
    </div>

    <div v-else-if="error" class="error-banner">
      ⚠️ {{ error }}
    </div>

    <div v-else class="requests-list">
      <div v-for="req in requests" :key="req.id" class="audit-card">
        <div class="card-head">
          <div>
            <h3 class="company-name">{{ req.company_name }}</h3>
            <span class="meta">사업자등록번호: {{ req.business_number }} | 사업 형태: {{ req.business_type }} | 국가: {{ req.country }}</span>
          </div>
          <span class="status-badge" :class="req.status.toLowerCase()">{{ req.status }}</span>
        </div>

        <div class="doc-links">
          <a :href="req.license_url" target="_blank" class="doc-btn">📄 사업자등록증 사본 (PDF)</a>
          <a :href="req.audit_report_url" target="_blank" class="doc-btn">🏭 공장 실사 성적서 (SGS/TÜV)</a>
        </div>

        <div v-if="req.status === 'PENDING'" class="actions">
          <button class="btn-approve" :disabled="submitting" @click="approve(req)">
            {{ submitting ? '처리 중...' : '✓ 실사 승인 (Verified 부여)' }}
          </button>
          <button class="btn-reject" :disabled="submitting" @click="reject(req)">
            ✕ 보완 요구 및 반려
          </button>
        </div>
        <div v-else class="approved-info">
          <span>✓ 심사 완료 (승인일시: {{ req.approved_at || '기승인' }})</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';

const loading = ref(true);
const submitting = ref(false);
const error = ref('');
const requests = ref<any[]>([]);

async function loadVerifications() {
  loading.value = true;
  error.value = '';
  try {
    const res = await apiRequest('/admin/verifications');
    requests.value = res.verifications || [];
  } catch (err: any) {
    error.value = err.message || '심사 목록을 불러오는 중 오류가 발생했습니다.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadVerifications();
});

async function approve(req: any) {
  submitting.value = true;
  try {
    const res = await apiRequest(`/admin/verifications/${req.id}/approve`, {
      method: 'POST',
    });
    req.status = res.status;
    req.approved_at = res.approved_at;
    alert(`[서버 승인 완료]\n${req.company_name} 기업에 공식 Verified Supplier 자격이 부여되었습니다.`);
  } catch (err: any) {
    alert(`승인 실패: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}

async function reject(req: any) {
  const reason = prompt('반려 및 보완 요구 사유를 입력하세요:');
  if (!reason) return;

  submitting.value = true;
  try {
    const res = await apiRequest(`/admin/verifications/${req.id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    req.status = res.status;
    alert(`[서버 반려 완료] 반려 사유: ${reason}`);
  } catch (err: any) {
    alert(`반려 실패: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.audit-page { max-width: 1000px; margin: 0 auto; }
h2 { margin: 0 0 6px 0; font-size: 20px; color: #F8FAFC; }
.subtitle { color: #94A3B8; font-size: 13px; margin-bottom: 24px; }
.loading-state { padding: 40px; text-align: center; color: #94A3B8; font-size: 14px; }
.error-banner { background: #7F1D1D; color: #FECACA; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; }
.requests-list { display: flex; flex-direction: column; gap: 20px; }
.audit-card { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 24px; }
.card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid #3A506B; padding-bottom: 14px; }
.company-name { margin: 0 0 6px 0; font-size: 17px; color: #FFF; }
.meta { font-size: 12px; color: #94A3B8; }
.status-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
.status-badge.approved { background: #065F46; color: #A7F3D0; }
.status-badge.pending { background: #854D0E; color: #FEF08A; }
.status-badge.rejected { background: #7F1D1D; color: #FECACA; }
.doc-links { display: flex; gap: 12px; margin-bottom: 20px; }
.doc-btn { background: #0B132B; border: 1px solid #3A506B; color: #38BDF8; padding: 8px 14px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 600; }
.actions { display: flex; gap: 12px; }
.btn-approve { background: #059669; color: #FFF; border: none; padding: 10px 18px; border-radius: 4px; font-weight: 700; cursor: pointer; }
.btn-reject { background: #DC2626; color: #FFF; border: none; padding: 10px 18px; border-radius: 4px; font-weight: 700; cursor: pointer; }
.approved-info { color: #34D399; font-size: 12px; font-weight: 600; }
</style>
