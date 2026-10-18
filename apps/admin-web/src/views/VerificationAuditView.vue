<template>
  <div class="audit-page">
    <h2>기업 및 공급사 입점 심사 (Verification Audit)</h2>
    <p class="subtitle">사업자등록증, 공장 실사 리포트(SGS/TÜV), 대표자 신원을 검수하여 공식 인증 배지를 부여합니다.</p>

    <div class="requests-list">
      <div v-for="req in requests" :key="req.id" class="audit-card">
        <div class="card-head">
          <div>
            <h3 class="company-name">{{ req.company_name }}</h3>
            <span class="meta">사업자등록번호: {{ req.business_number }} | 사업 형태: {{ req.business_type }}</span>
          </div>
          <span class="status-badge" :class="req.status.toLowerCase()">{{ req.status }}</span>
        </div>

        <div class="doc-links">
          <a :href="req.license_url" target="_blank" class="doc-btn">📄 사업자등록증 사본 (PDF)</a>
          <a :href="req.audit_report_url" target="_blank" class="doc-btn">🏭 공장 실사 성적서 (SGS)</a>
        </div>

        <div v-if="req.status === 'PENDING'" class="actions">
          <button class="btn-approve" @click="approve(req)">✓ 실사 승인 (Verified 부여)</button>
          <button class="btn-reject" @click="reject(req)">✕ 보완 요구 및 반려</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const requests = ref([
  {
    id: 'req-001',
    company_name: 'Precision Korea (글로벌정밀산업)',
    business_number: '123-45-67890',
    business_type: 'MANUFACTURER',
    status: 'APPROVED',
    license_url: '#',
    audit_report_url: '#',
  },
  {
    id: 'req-002',
    company_name: 'Hansung Precision Tool Co.',
    business_number: '456-78-12345',
    business_type: 'OEM_ODM',
    status: 'PENDING',
    license_url: '#',
    audit_report_url: '#',
  },
]);

function approve(req: any) {
  req.status = 'APPROVED';
  alert(`${req.company_name} 기업에 공장 실사 완료 인증 배지(Verified Supplier)가 성공적으로 부여되었습니다.`);
}

function reject(req: any) {
  const reason = prompt('반려 및 보완 사유를 입력하세요:');
  if (reason) {
    req.status = 'REJECTED';
    alert(`반려 처리되었습니다. 사유: ${reason}`);
  }
}
</script>

<style scoped>
.audit-page { max-width: 1000px; margin: 0 auto; }
h2 { margin: 0 0 6px 0; font-size: 20px; color: #F8FAFC; }
.subtitle { color: #94A3B8; font-size: 13px; margin-bottom: 24px; }
.requests-list { display: flex; flex-direction: column; gap: 20px; }
.audit-card { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 24px; }
.card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid #3A506B; padding-bottom: 14px; }
.company-name { margin: 0 0 6px 0; font-size: 17px; color: #FFF; }
.meta { font-size: 12px; color: #94A3B8; }
.status-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
.status-badge.approved { background: #065F46; color: #A7F3D0; }
.status-badge.pending { background: #854D0E; color: #FEF08A; }
.doc-links { display: flex; gap: 12px; margin-bottom: 20px; }
.doc-btn { background: #0B132B; border: 1px solid #3A506B; color: #38BDF8; padding: 8px 14px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 600; }
.actions { display: flex; gap: 12px; }
.btn-approve { background: #059669; color: #FFF; border: none; padding: 10px 18px; border-radius: 4px; font-weight: 700; cursor: pointer; }
.btn-reject { background: #DC2626; color: #FFF; border: none; padding: 10px 18px; border-radius: 4px; font-weight: 700; cursor: pointer; }
</style>

