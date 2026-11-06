<template>
  <div class="ws-page">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Supplier Onboarding</p>
      <h1 class="ws-page-title">입점 온보딩·Verified 실사 서류</h1>
      <p class="ws-page-sub">SGS·TÜV 제3자 현장 실사 리포트와 ISO/CE/FDA 인증서를 제출하여 Verified 자격을 취득하세요.</p>
    </div>

    <div class="ws-stack">
      <section class="ws-card">
        <div class="ws-card-head"><h3>실사 심사 이력·현재 상태</h3></div>
        <div v-for="v in verifications" :key="v.id" class="verif-card">
          <div class="ws-split">
            <div>
              <b>{{ v.company_name }}</b>
              <span class="ws-small ws-muted ws-figure"> · {{ v.business_number }} · {{ v.business_type }}</span>
            </div>
            <span class="ws-badge" :class="v.status === 'APPROVED' ? 'ws-badge-success' : v.status === 'REJECTED' ? 'ws-badge-danger' : 'ws-badge-warning'">{{ v.status }}</span>
          </div>
          <div class="v-metrics">
            <span><WsIcon name="factory" :size="14" /> {{ v.facilities_sqm?.toLocaleString() }} m²</span>
            <span><WsIcon name="gear" :size="14" /> 라인 {{ v.production_lines }}개</span>
            <span><WsIcon name="search" :size="14" /> QC {{ v.qc_inspectors }}명</span>
            <span><WsIcon name="file" :size="14" /> {{ (v.certificates || []).join(', ') }}</span>
          </div>
          <div v-if="v.rejection_reason" class="ws-banner ws-banner-danger" style="margin-bottom: 0">
            <WsIcon name="alert" :size="15" />
            <span><b>반려 사유:</b> {{ v.rejection_reason }}</span>
          </div>
        </div>
      </section>

      <form class="ws-card" @submit.prevent="submitVerification">
        <div class="ws-card-head"><h3><WsIcon name="upload" :size="15" class="h-ico" /> 신규 실사 성적서·인증서 제출</h3></div>
        <div class="ws-grid-2">
          <div class="ws-field"><label>법인 상호명</label><input v-model="form.company_name" type="text" required /></div>
          <div class="ws-field">
            <label>사업자등록번호</label>
            <div class="biz-row">
              <input v-model="form.business_number" type="text" placeholder="123-45-67890" required />
              <button type="button" class="ws-btn ws-btn-navy ws-btn-sm" :disabled="verifyingNts" @click="verifyWithNTS">
                <WsIcon v-if="!verifyingNts" name="search" :size="13" /> {{ verifyingNts ? '조회 중...' : '국세청 진위 확인' }}
              </button>
            </div>
            <div v-if="ntsResult" class="ws-banner" :class="ntsResult.is_valid ? 'ws-banner-success' : 'ws-banner-danger'" style="margin-bottom: 0">
              <WsIcon :name="ntsResult.is_valid ? 'check' : 'alert'" :size="15" />
              <div>
                <b>{{ ntsResult.is_valid ? '국세청 홈택스 인증 완료' : '인증 실패' }}</b>
                <span> · {{ ntsResult.data?.tax_status_kr || ntsResult.message }}</span>
                <p v-if="ntsResult.is_valid" class="ws-small" style="margin: 4px 0 0">
                  과세유형 <b>{{ ntsResult.data?.tax_type }}</b> · D-U-N-S <b class="ws-figure">{{ ntsResult.data?.duns_number }}</b> ·
                  해시 <code>{{ ntsResult.data?.verification_hash?.slice(0, 18) }}...</code>
                </p>
              </div>
            </div>
          </div>
          <div class="ws-field">
            <label>공급사 유형</label>
            <select v-model="form.business_type">
              <option value="MANUFACTURER">MANUFACTURER (직접 제조 공장)</option>
              <option value="OEM_ODM">OEM_ODM (맞춤형 위탁 제조사)</option>
              <option value="TRADING_COMPANY">TRADING_COMPANY (전문 무역상사)</option>
            </select>
          </div>
          <div class="ws-field"><label>공장 부지 면적 (m²)</label><input v-model.number="form.facilities_sqm" type="number" min="100" required /></div>
          <div class="ws-field"><label>가동 생산 라인 수</label><input v-model.number="form.production_lines" type="number" min="1" required /></div>
          <div class="ws-field"><label>전담 QC 인력 수</label><input v-model.number="form.qc_inspectors" type="number" min="1" required /></div>
          <div class="ws-field"><label>사업자등록증 사본 URL</label><input v-model="form.license_url" type="url" required /></div>
          <div class="ws-field"><label>SGS/TÜV 실사 성적서 URL</label><input v-model="form.audit_report_url" type="url" required /></div>
          <div class="ws-field" style="grid-column: 1 / -1"><label>보유 국제 품질 인증서 (쉼표 구분)</label><input v-model="certsInput" type="text" placeholder="ISO 9001:2015, CE, FDA GRAS, RoHS" /></div>
        </div>
        <button type="submit" class="ws-btn ws-btn-primary ws-btn-block ws-btn-lg" :disabled="submitting">
          <WsIcon v-if="!submitting" name="shield" :size="14" /> {{ submitting ? '심사팀으로 제출 중...' : 'Verified 실사 심사 요청 제출' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest, getCurrentUser } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const verifications = ref<any[]>([]);
const submitting = ref(false);
const certsInput = ref('ISO 9001:2015, ISO 14001, CE Machinery Directive, RoHS 2.0');

const verifyingNts = ref(false);
const ntsResult = ref<any>(null);

async function verifyWithNTS() {
  if (!form.value.business_number) return;
  verifyingNts.value = true;
  ntsResult.value = null;
  try {
    const res = await apiRequest('/verification/business-tax-id', {
      method: 'POST',
      body: JSON.stringify({
        tax_id: form.value.business_number,
        company_name: form.value.company_name,
      }),
    });
    ntsResult.value = res;
  } catch (err: any) {
    ntsResult.value = {
      is_valid: false,
      message: err.message || '국세청 조회 실패',
    };
  } finally {
    verifyingNts.value = false;
  }
}

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
.verif-card { border: 1px solid var(--ws-border-subtle); border-radius: 10px; padding: 14px; margin-bottom: 10px; background: var(--ws-surface-muted); }
.verif-card:last-child { margin-bottom: 0; }
.v-metrics { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--ws-text-2); margin-top: 8px; }
.v-metrics span { display: inline-flex; align-items: center; gap: 5px; }
.h-ico { color: var(--ws-navy); vertical-align: -2px; }
.biz-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
.ws-field { margin-bottom: 12px; }
</style>
