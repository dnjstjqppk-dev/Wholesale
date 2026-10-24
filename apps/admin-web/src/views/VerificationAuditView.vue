<template>
  <div class="audit-page">
    <div class="head-row">
      <div>
        <h2>기업 및 공급사 입점 심사 (Verification Audit)</h2>
        <p class="subtitle">제출된 사업자등록증 및 SGS/TÜV 현장 공장 실사 성적서를 인앱 뷰어로 검수하고 Verified Supplier 자격을 부여합니다.</p>
      </div>
      <button class="btn-refresh" @click="loadVerifications">↻ 심사 대기열 새로고침</button>
    </div>

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

        <div class="v-metrics">
          <span>🏭 공장 부지 면적: <strong>{{ req.facilities_sqm?.toLocaleString() }} m²</strong></span>
          <span>⚙️ 생산 라인 수: <strong>{{ req.production_lines }}개</strong></span>
          <span>🔬 품질 검수원: <strong>{{ req.qc_inspectors }}명</strong></span>
          <span>📜 보유 인증: <strong>{{ (req.certificates || []).join(', ') }}</strong></span>
        </div>

        <div class="doc-links">
          <button class="doc-btn" @click="previewDoc('사업자등록증 원본 사본', req.license_url)">
            📄 사업자등록증 인앱 서류 열람
          </button>
          <button class="doc-btn" @click="previewDoc('SGS/TÜV 공장 실사 성적서', req.audit_report_url)">
            🏭 공장 실사 성적서 원문 열람
          </button>
        </div>

        <div v-if="req.status === 'PENDING'" class="actions">
          <button class="btn-approve" :disabled="submitting" @click="approve(req)">
            {{ submitting ? '처리 중...' : '✓ 실사 승인 (Verified Supplier 자격 부여)' }}
          </button>
          <button class="btn-reject" :disabled="submitting" @click="reject(req)">
            ✕ 보완 요구 및 반려 (POST reject)
          </button>
        </div>
        <div v-else-if="req.status === 'APPROVED'" class="approved-info">
          <span>✓ 심사 승인 완료 (승인일시: {{ req.approved_at || 'UTC 검증됨' }})</span>
        </div>
        <div v-else class="rejected-info">
          <span>✕ 반려 처리됨 (반려 사유: {{ req.rejection_reason || '서류 불충분' }})</span>
        </div>
      </div>
    </div>

    <!-- In-App Document Viewer Modal -->
    <div v-if="modalDoc" class="modal-overlay" @click.self="modalDoc = null">
      <div class="modal-box">
        <div class="modal-head">
          <h3>{{ modalDoc.title }}</h3>
          <button class="btn-close" @click="modalDoc = null">✕</button>
        </div>
        <div class="modal-body">
          <img :src="modalDoc.url" alt="Document Preview" class="doc-img" />
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
const modalDoc = ref<{ title: string; url: string } | null>(null);

function previewDoc(title: string, url: string) {
  modalDoc.value = {
    title,
    url: url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
  };
}

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
  const reason = prompt('반려 및 보완 요구 사유를 입력하세요:', '사업자등록증 식별 불가 또는 공장 실사 서류 불충분');
  if (!reason) return;

  submitting.value = true;
  try {
    const res = await apiRequest(`/admin/verifications/${req.id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    req.status = res.status;
    req.rejection_reason = reason;
    alert(`[서버 반려 완료] 반려 사유: ${reason}`);
  } catch (err: any) {
    alert(`반려 실패: ${err.message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.audit-page { max-width: 1040px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.head-row { display: flex; justify-content: space-between; align-items: center; }
h2 { margin: 0 0 4px 0; font-size: 20px; color: #F8FAFC; }
.subtitle { color: #94A3B8; font-size: 13px; margin: 0; }
.btn-refresh { background: #1C2541; border: 1px solid #3A506B; color: #E2E8F0; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; }
.loading-state { padding: 40px; text-align: center; color: #94A3B8; }
.error-banner { background: #7F1D1D; color: #FECACA; padding: 12px; border-radius: 6px; }
.requests-list { display: flex; flex-direction: column; gap: 18px; }
.audit-card { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 22px; }
.card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px solid #2B3A55; padding-bottom: 12px; }
.company-name { margin: 0 0 4px 0; font-size: 17px; color: #FFF; }
.meta { font-size: 12px; color: #94A3B8; }
.status-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
.status-badge.approved { background: #065F46; color: #A7F3D0; }
.status-badge.pending { background: #854D0E; color: #FEF08A; }
.status-badge.rejected { background: #7F1D1D; color: #FECACA; }
.v-metrics { display: flex; gap: 18px; font-size: 12px; color: #CBD5E1; margin-bottom: 14px; flex-wrap: wrap; }
.doc-links { display: flex; gap: 10px; margin-bottom: 16px; }
.doc-btn { background: #0B132B; border: 1px solid #3A506B; color: #38BDF8; padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; }
.actions { display: flex; gap: 10px; }
.btn-approve { background: #059669; color: #FFF; border: none; padding: 9px 18px; border-radius: 4px; font-weight: 700; cursor: pointer; }
.btn-reject { background: #DC2626; color: #FFF; border: none; padding: 9px 18px; border-radius: 4px; font-weight: 700; cursor: pointer; }
.approved-info { color: #10B981; font-weight: 700; font-size: 13px; }
.rejected-info { color: #EF4444; font-weight: 700; font-size: 13px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-box { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; width: 680px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; }
.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid #2B3A55; }
.modal-head h3 { margin: 0; font-size: 15px; color: #FFF; }
.btn-close { background: transparent; border: none; color: #94A3B8; font-size: 18px; cursor: pointer; }
.modal-body { padding: 16px; overflow-y: auto; text-align: center; }
.doc-img { max-width: 100%; border-radius: 6px; }
</style>
