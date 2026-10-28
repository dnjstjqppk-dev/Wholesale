<template>
  <div class="marketing-kwa-page">
    <div class="page-head">
      <div class="head-text">
        <h2>키워드 광고(KWA) 및 스폰서드 검색 입찰 관리 (Keyword Advertising)</h2>
        <p class="subtitle">
          Alibaba.com 글로벌 검색 결과 상단 우선 노출을 위한 키워드 CPC 입찰, 일일 예산 한도 설정 및 실시간 성과를 관리합니다.
        </p>
      </div>
      <button class="btn-create-campaign" @click="showCreateModal = true">
        + 신규 KWA 키워드 입찰 등록
      </button>
    </div>

    <!-- Alert / Toast -->
    <div v-if="toastMessage" class="toast-banner" :class="toastType">
      {{ toastMessage }}
    </div>

    <div v-if="loading" class="state-box">
      <p>광고 캠페인 데이터를 불러오는 중입니다...</p>
    </div>

    <div v-else class="kwa-content">
      <!-- 4 Summary KPI Cards -->
      <div class="summary-grid">
        <div class="summary-card">
          <span class="card-title">활성 키워드 캠페인</span>
          <span class="card-value text-blue-600">{{ summary.active_campaigns }} / {{ summary.total_campaigns }}개</span>
          <span class="card-sub">일일 총 예산 한도: ${{ summary.daily_budget_total_usd }}</span>
        </div>
        <div class="summary-card">
          <span class="card-title">누적 광고 지출 (Total Spend)</span>
          <span class="card-value text-orange-600">${{ summary.total_spend_usd.toLocaleString() }}</span>
          <span class="card-sub">예치금 잔액에서 실시간 차감</span>
        </div>
        <div class="summary-card">
          <span class="card-title">광고 노출 수 (Impressions)</span>
          <span class="card-value text-indigo-600">{{ summary.total_impressions.toLocaleString() }}</span>
          <span class="card-sub">글로벌 바이어 검색 상단 슬롯</span>
        </div>
        <div class="summary-card">
          <span class="card-title">총 유입 클릭 (Clicks)</span>
          <span class="card-value text-green-600">{{ summary.total_clicks.toLocaleString() }}</span>
          <span class="card-sub">평균 클릭당 단가 (CPC): <strong>${{ summary.average_cpc_usd }}</strong></span>
        </div>
      </div>

      <!-- Active Campaigns Table -->
      <div class="card-section">
        <div class="sec-head">
          <h3>진행 중인 키워드 입찰 목록 (Bidding Campaigns)</h3>
          <button class="btn-refresh" @click="fetchMarketingData">↻ 새로고침</button>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>키워드 (Target Keyword)</th>
              <th>매칭 방식 (Match Type)</th>
              <th>최대 클릭당 입찰가 (Max CPC)</th>
              <th>일일 예산 한도 (Daily Budget)</th>
              <th>노출 수 (Imp)</th>
              <th>클릭 수 (Clicks)</th>
              <th>소진 광고비 (Spend)</th>
              <th>상태 (Status)</th>
              <th>관리 조치</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in campaigns" :key="c.id">
              <td>
                <span class="font-bold text-gray-900">{{ c.keyword }}</span>
              </td>
              <td>
                <span class="badge-match" :class="c.match_type.toLowerCase()">{{ c.match_type }}</span>
              </td>
              <td class="font-mono">${{ c.max_cpc_usd.toFixed(2) }}</td>
              <td class="font-mono">${{ c.daily_budget_usd.toFixed(2) }} / 일</td>
              <td>{{ c.impressions.toLocaleString() }}</td>
              <td>{{ c.clicks.toLocaleString() }}</td>
              <td class="font-mono font-bold text-orange-600">${{ c.total_spend_usd.toFixed(2) }}</td>
              <td>
                <button
                  class="btn-status"
                  :class="c.status.toLowerCase()"
                  @click="toggleStatus(c)"
                >
                  {{ c.status === 'ACTIVE' ? '✓ 활성 중' : '⏸ 일시 정지' }}
                </button>
              </td>
              <td>
                <button class="btn-del-camp" title="캠페인 삭제" @click="deleteCampaign(c.id)">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal: Create KWA Campaign -->
    <div v-if="showCreateModal" class="modal-backdrop" @click.self="showCreateModal = false">
      <div class="modal-window">
        <h3>신규 키워드 광고(KWA) 캠페인 등록</h3>
        <form @submit.prevent="submitCampaign">
          <div class="form-group">
            <label>타겟 검색 키워드 (Keyword)</label>
            <input v-model="newForm.keyword" type="text" placeholder="예: stainless steel tumbler wholesale" required />
          </div>
          <div class="form-group">
            <label>매칭 방식 (Match Type)</label>
            <select v-model="newForm.match_type">
              <option value="BROAD">확장 매칭 (Broad Match - 유사 연관 검색어 포함)</option>
              <option value="EXACT">일치 매칭 (Exact Match - 정확한 단어 매칭 시만 노출)</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>최대 클릭당 입찰가 (Max CPC in USD)</label>
              <input v-model.number="newForm.max_cpc_usd" type="number" step="0.05" min="0.50" required />
            </div>
            <div class="form-group">
              <label>일일 예산 한도 (Daily Budget in USD)</label>
              <input v-model.number="newForm.daily_budget_usd" type="number" step="10" min="20" required />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showCreateModal = false">취소</button>
            <button type="submit" class="btn-submit" :disabled="submitting">
              {{ submitting ? '입찰 등록 중...' : '광고 등록 및 입찰 개시' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';

const loading = ref(true);
const submitting = ref(false);
const campaigns = ref<any[]>([]);
const summary = ref<any>({
  total_campaigns: 0,
  active_campaigns: 0,
  total_spend_usd: 0,
  total_impressions: 0,
  total_clicks: 0,
  average_cpc_usd: 0,
  daily_budget_total_usd: 0,
});

const showCreateModal = ref(false);
const newForm = ref({
  keyword: '',
  match_type: 'BROAD',
  max_cpc_usd: 1.50,
  daily_budget_usd: 50.00,
});

const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = '';
  }, 4000);
}

async function fetchMarketingData() {
  loading.value = true;
  try {
    const res = await apiRequest('/partner/marketing');
    campaigns.value = res.campaigns || [];
    summary.value = res.summary || summary.value;
  } catch (err: any) {
    showToast(`KWA 데이터 조회 실패: ${err.message}`, 'error');
  } finally {
    loading.value = false;
  }
}

async function submitCampaign() {
  submitting.value = true;
  try {
    const created = await apiRequest('/partner/marketing/campaigns', {
      method: 'POST',
      body: JSON.stringify(newForm.value),
    });
    campaigns.value.unshift(created);
    summary.value.total_campaigns++;
    summary.value.active_campaigns++;
    showCreateModal.value = false;
    newForm.value = {
      keyword: '',
      match_type: 'BROAD',
      max_cpc_usd: 1.50,
      daily_budget_usd: 50.00,
    };
    showToast(`키워드 '${created.keyword}' 입찰이 성공적으로 등록되었습니다.`);
  } catch (err: any) {
    showToast(`등록 실패: ${err.message}`, 'error');
  } finally {
    submitting.value = false;
  }
}

async function toggleStatus(campaign: any) {
  const nextStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  try {
    await apiRequest(`/partner/marketing/campaigns/${campaign.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: nextStatus }),
    });
    campaign.status = nextStatus;
    if (nextStatus === 'ACTIVE') {
      summary.value.active_campaigns++;
    } else {
      summary.value.active_campaigns--;
    }
    showToast(`캠페인 상태가 '${nextStatus}'(으)로 변경되었습니다.`);
  } catch (err: any) {
    showToast(`상태 변경 실패: ${err.message}`, 'error');
  }
}

async function deleteCampaign(id: string) {
  if (!confirm('이 키워드 광고 캠페인을 삭제하시겠습니까?')) return;
  try {
    await apiRequest(`/partner/marketing/campaigns/${id}`, { method: 'DELETE' });
    campaigns.value = campaigns.value.filter(c => c.id !== id);
    showToast('캠페인이 삭제되었습니다.');
  } catch (err: any) {
    showToast(`삭제 실패: ${err.message}`, 'error');
  }
}

onMounted(() => {
  fetchMarketingData();
});
</script>

<style scoped>
.marketing-kwa-page {
  padding: 24px 32px 80px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.head-text h2 {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.btn-create-campaign {
  background: #d64000;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}

.btn-create-campaign:hover {
  background: #e65c00;
}

.toast-banner {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 600;
}

.toast-banner.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.toast-banner.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.kwa-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.summary-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 6px;
}

.card-sub {
  font-size: 11px;
  color: #94a3b8;
  margin-top: auto;
}

.card-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 24px;
}

.sec-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 10px;
}

.sec-head h3 {
  margin: 0;
  font-size: 16px;
  color: #1e293b;
}

.btn-refresh {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.data-table th {
  background: #f8fafc;
  padding: 10px 12px;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.badge-match {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.badge-match.exact { background: #e0f2fe; color: #0284c7; }
.badge-match.broad { background: #fef3c7; color: #d97706; }

.btn-status {
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.btn-status.active { background: #dcfce7; color: #166534; }
.btn-status.paused { background: #f1f5f9; color: #64748b; }

.btn-del-camp {
  background: transparent;
  border: 1px solid #fecaca;
  color: #ef4444;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.btn-del-camp:hover {
  background: #fee2e2;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-window {
  background: white;
  width: 500px;
  max-width: 90vw;
  border-radius: 10px;
  padding: 24px;
}

.modal-window h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-group {
  flex: 1;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.btn-cancel {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.btn-submit {
  background: #d64000;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.state-box {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 60px;
  text-align: center;
  color: #64748b;
}

/* Mobile & Tablet Responsive Layout */
@media (max-width: 992px) {
  .marketing-kwa-page {
    padding: 16px 12px;
  }
  .page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .summary-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: 1fr !important;
  }
  .btn-create-campaign {
    width: 100%;
  }
  .data-table {
    display: block;
    overflow-x: auto;
  }
  .form-row {
    flex-direction: column;
  }
}
</style>

