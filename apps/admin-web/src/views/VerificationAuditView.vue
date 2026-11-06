<template>
  <div class="ws-admin-page audit">
    <div class="admin-head">
      <div>
        <p class="admin-eyebrow">KYB Review</p>
        <h1>기업·공급사 입점 심사</h1>
        <p class="admin-sub">사업자등록증·SGS/TÜV 실사 성적서를 인앱 뷰어로 검수하고 Verified 자격을 부여합니다.</p>
      </div>
      <button class="ws-admin-btn" @click="loadVerifications"><WsIcon name="refresh" :size="14" /> 대기열 새로고침</button>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton sk-dark" style="height: 220px"></div>
      <div class="ws-skeleton sk-dark" style="height: 220px"></div>
    </div>

    <div v-else-if="error" class="admin-error">
      <WsIcon name="alert" :size="16" /> {{ error }}
    </div>

    <div v-else class="ws-stack">
      <section v-for="req in requests" :key="req.id" class="ws-admin-card">
        <div class="ws-split req-head">
          <div>
            <h3>{{ req.company_name }}</h3>
            <p class="ws-small dim ws-figure">{{ req.business_number }} · {{ req.business_type }} · {{ req.country }}</p>
          </div>
          <span class="ws-admin-badge" :class="req.status === 'APPROVED' ? 'ws-admin-badge-ok' : req.status === 'REJECTED' ? 'ws-admin-badge-bad' : 'ws-admin-badge-warn'">{{ req.status }}</span>
        </div>

        <div class="nts-bar">
          <span class="ws-small dim"><WsIcon name="building" :size="14" /> 국세청 법인실사·D-U-N-S</span>
          <span v-if="req.nts_status" class="ws-admin-badge" :class="req.nts_status.is_valid ? 'ws-admin-badge-ok' : 'ws-admin-badge-bad'">
            ✓ {{ req.nts_status.tax_status_kr }} ({{ req.nts_status.tax_type }})
          </span>
          <span v-else class="ws-admin-badge ws-admin-badge-idle"><WsIcon name="clock" :size="12" /> 국세청 미조회</span>
          <span v-if="req.nts_status?.duns_number" class="ws-admin-badge ws-admin-badge-info ws-figure">D-U-N-S® {{ req.nts_status.duns_number }}</span>
          <button type="button" class="ws-admin-btn" :disabled="verifyingId === req.id" @click="verifyWithNTS(req)">
            <WsIcon v-if="verifyingId !== req.id" name="search" :size="13" /> {{ verifyingId === req.id ? '검증 중...' : '국세청 MOD-10 검증' }}
          </button>
        </div>

        <div class="v-metrics">
          <span><WsIcon name="factory" :size="14" /> {{ req.facilities_sqm?.toLocaleString() }} m²</span>
          <span><WsIcon name="gear" :size="14" /> 라인 {{ req.production_lines }}개</span>
          <span><WsIcon name="search" :size="14" /> QC {{ req.qc_inspectors }}명</span>
          <span><WsIcon name="file" :size="14" /> {{ (req.certificates || []).join(', ') }}</span>
        </div>

        <div class="ws-cluster" style="margin-top: 12px">
          <button class="ws-admin-btn" @click="previewDoc('사업자등록증 원본 사본', req.license_url)">
            <WsIcon name="file" :size="14" /> 사업자등록증 열람
          </button>
          <button class="ws-admin-btn" @click="previewDoc('SGS/TÜV 공장 실사 성적서', req.audit_report_url)">
            <WsIcon name="factory" :size="14" /> 실사 성적서 원문
          </button>
        </div>

        <div v-if="req.status === 'PENDING'" class="ws-cluster verdict" style="gap: 8px">
          <button class="ws-admin-btn ws-admin-btn-primary" :disabled="submitting" @click="approve(req)">
            {{ submitting ? '처리 중...' : '✓ 승인 · Verified 자격 부여' }}
          </button>
          <button class="ws-admin-btn ws-admin-btn-danger" :disabled="submitting" @click="reject(req)">✕ 보완 요구·반려</button>
        </div>
        <p v-else-if="req.status === 'APPROVED'" class="verdict-note ok">✓ 심사 승인 완료 ({{ req.approved_at || 'UTC 검증됨' }})</p>
        <p v-else class="verdict-note bad">✕ 반려 처리됨 — {{ req.rejection_reason || '서류 불충분' }}</p>
      </section>
    </div>

    <div v-if="modalDoc" class="ws-modal-backdrop" @click.self="modalDoc = null">
      <div class="ws-modal ws-modal-wide doc-modal" role="dialog" aria-modal="true">
        <div class="ws-modal-head">
          <h3>{{ modalDoc.title }}</h3>
          <button class="ws-icon-btn" aria-label="닫기" @click="modalDoc = null"><WsIcon name="x" :size="15" /></button>
        </div>
        <div class="ws-modal-body">
          <img :src="modalDoc.url" alt="Document Preview" class="doc-img" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const loading = ref(true);
const submitting = ref(false);
const verifyingId = ref<string | null>(null);
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

    // Pre-check or lookup status for all requests
    for (const req of requests.value) {
      if (req.business_number) {
        try {
          const clean = req.business_number.replace(/\D/g, '');
          const statusRes = await apiRequest(`/verification/status/${clean}`);
          if (statusRes && statusRes.data) {
            req.nts_status = statusRes.data;
          }
        } catch {
          // If not pre-cached, it will remain unverified until user clicks
        }
      }
    }
  } catch (err: any) {
    error.value = err.message || '심사 목록을 불러오는 중 오류가 발생했습니다.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadVerifications();
});

async function verifyWithNTS(req: any) {
  verifyingId.value = req.id;
  try {
    const res = await apiRequest('/verification/business-tax-id', {
      method: 'POST',
      body: JSON.stringify({
        business_number: req.business_number,
        company_name: req.company_name,
      }),
    });
    req.nts_status = res.data;
    alert(`[국세청(NTS) 공식 MOD-10 진위 인증 성공]\n기업명: ${res.data.company_name}\n과세유형: ${res.data.tax_type}\n상태: ${res.data.tax_status_kr}\nD-U-N-S: ${res.data.duns_number}`);
  } catch (err: any) {
    alert(`국세청 검증 실패: ${err.message}`);
  } finally {
    verifyingId.value = null;
  }
}

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
.audit { display: flex; flex-direction: column; gap: 18px; }
.admin-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.admin-eyebrow { margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ws-admin-accent); }
.admin-head h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; letter-spacing: -0.015em; }
.admin-sub { margin: 0; font-size: 13px; color: var(--ws-admin-dim); }
.admin-error { background: rgb(239 68 68 / 0.12); border: 1px solid rgb(239 68 68 / 0.4); color: #fca5a5; border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 600; display: flex; gap: 8px; align-items: center; }
.req-head h3 { margin: 0 0 4px; font-size: 17px; color: #fff; }
.dim { color: var(--ws-admin-dim); }
.nts-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; background: var(--ws-admin-panel-2); border: 1px solid var(--ws-admin-line); border-radius: 8px; padding: 10px 14px; margin-top: 12px; }
.nts-bar .ws-admin-btn { margin-left: auto; }
.v-metrics { display: flex; gap: 18px; flex-wrap: wrap; font-size: 12px; color: var(--ws-admin-text); margin-top: 12px; }
.v-metrics span { display: inline-flex; align-items: center; gap: 6px; }
.verdict { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--ws-admin-line); }
.verdict-note { margin: 14px 0 0; padding-top: 14px; border-top: 1px solid var(--ws-admin-line); font-size: 13px; font-weight: 700; }
.verdict-note.ok { color: #86efac; }
.verdict-note.bad { color: #fca5a5; }
.doc-modal { background: var(--ws-surface); color: var(--ws-text); }
.doc-img { width: 100%; border-radius: 8px; display: block; }
.sk-dark { background: var(--ws-admin-panel); }
</style>
