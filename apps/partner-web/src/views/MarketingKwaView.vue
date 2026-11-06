<template>
  <div class="ws-page ws-page-wide">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Keyword Advertising</p>
      <div class="ws-page-head-row">
        <h1 class="ws-page-title">키워드 광고·입찰 관리</h1>
        <div class="ws-page-actions">
          <button class="ws-btn ws-btn-primary" @click="showCreateModal = true"><WsIcon name="plus" :size="14" /> 신규 입찰 등록</button>
        </div>
      </div>
      <p class="ws-page-sub">검색 결과 상단 우선 노출을 위한 키워드 CPC 입찰·일일 예산·실시간 성과 관리.</p>
    </div>

    <div v-if="toastMessage" class="ws-banner" :class="toastType === 'error' ? 'ws-banner-danger' : 'ws-banner-success'">
      <WsIcon :name="toastType === 'error' ? 'alert' : 'check'" :size="16" />
      <span>{{ toastMessage }}</span>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-stats">
        <div class="ws-skeleton" style="height: 96px"></div>
        <div class="ws-skeleton" style="height: 96px"></div>
        <div class="ws-skeleton" style="height: 96px"></div>
        <div class="ws-skeleton" style="height: 96px"></div>
      </div>
    </div>

    <div v-else class="ws-stack">
      <div class="ws-stats">
        <div class="ws-stat">
          <p class="ws-stat-label">활성 캠페인</p>
          <p class="ws-stat-value">{{ summary.active_campaigns }} <span class="unit">/ {{ summary.total_campaigns }}개</span></p>
          <p class="ws-stat-foot">일일 총 예산 ${{ summary.daily_budget_total_usd }}</p>
        </div>
        <div class="ws-stat">
          <p class="ws-stat-label">누적 광고 지출</p>
          <p class="ws-stat-value spend">${{ summary.total_spend_usd.toLocaleString() }}</p>
          <p class="ws-stat-foot">예치금 잔액에서 실시간 차감</p>
        </div>
        <div class="ws-stat">
          <p class="ws-stat-label">노출 수</p>
          <p class="ws-stat-value">{{ summary.total_impressions.toLocaleString() }}</p>
          <p class="ws-stat-foot">바이어 검색 상단 슬롯</p>
        </div>
        <div class="ws-stat">
          <p class="ws-stat-label">유입 클릭</p>
          <p class="ws-stat-value clicks">{{ summary.total_clicks.toLocaleString() }}</p>
          <p class="ws-stat-foot">평균 CPC <b>${{ summary.average_cpc_usd }}</b></p>
        </div>
      </div>

      <section class="ws-card ws-card-pad-sm">
        <div class="ws-card-head">
          <h3>진행 중 키워드 입찰</h3>
          <button class="ws-btn ws-btn-ghost ws-btn-sm" @click="fetchMarketingData"><WsIcon name="refresh" :size="13" /> 새로고침</button>
        </div>
        <div class="ws-table-wrap">
          <div class="ws-table-scroll">
            <table class="ws-table">
              <thead>
                <tr><th>타겟 키워드</th><th>매칭</th><th class="ws-num">Max CPC</th><th class="ws-num">일일 예산</th><th class="ws-num">노출</th><th class="ws-num">클릭</th><th class="ws-num">지출</th><th>상태</th><th></th></tr>
              </thead>
              <tbody>
                <tr v-for="c in campaigns" :key="c.id">
                  <td class="ws-cell-main">{{ c.keyword }}</td>
                  <td><span class="ws-badge ws-badge-outline">{{ c.match_type }}</span></td>
                  <td class="ws-num ws-figure">${{ c.max_cpc_usd.toFixed(2) }}</td>
                  <td class="ws-num ws-figure">${{ c.daily_budget_usd.toFixed(2) }}</td>
                  <td class="ws-num ws-figure">{{ c.impressions.toLocaleString() }}</td>
                  <td class="ws-num ws-figure">{{ c.clicks.toLocaleString() }}</td>
                  <td class="ws-num"><b class="ws-price ws-figure">${{ c.total_spend_usd.toFixed(2) }}</b></td>
                  <td>
                    <button class="ws-badge" :class="c.status === 'ACTIVE' ? 'ws-badge-success' : 'ws-badge-outline'" style="cursor: pointer; border: 1px solid var(--ws-border)" @click="toggleStatus(c)">
                      <WsIcon v-if="c.status !== 'ACTIVE'" name="pause" :size="12" />{{ c.status === 'ACTIVE' ? '✓ 활성 중' : '일시 정지' }}
                    </button>
                  </td>
                  <td><button class="ws-btn ws-btn-ghost ws-btn-sm danger-link" @click="deleteCampaign(c.id)">삭제</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>

    <div v-if="showCreateModal" class="ws-modal-backdrop" @click.self="showCreateModal = false">
      <div class="ws-modal" role="dialog" aria-modal="true">
        <div class="ws-modal-head">
          <h3>신규 키워드 광고 캠페인</h3>
          <button class="ws-icon-btn" aria-label="닫기" @click="showCreateModal = false"><WsIcon name="x" :size="15" /></button>
        </div>
        <form @submit.prevent="submitCampaign">
          <div class="ws-modal-body">
            <div class="ws-field">
              <label>타겟 검색 키워드</label>
              <input v-model="newForm.keyword" type="text" placeholder="예: stainless steel tumbler wholesale" required />
            </div>
            <div class="ws-field">
              <label>매칭 방식</label>
              <select v-model="newForm.match_type">
                <option value="BROAD">확장 매칭 (연관 검색어 포함)</option>
                <option value="EXACT">일치 매칭 (정확한 단어만 노출)</option>
              </select>
            </div>
            <div class="ws-grid-2">
              <div class="ws-field"><label>Max CPC (USD)</label><input v-model.number="newForm.max_cpc_usd" type="number" step="0.05" min="0.50" required /></div>
              <div class="ws-field"><label>일일 예산 (USD)</label><input v-model.number="newForm.daily_budget_usd" type="number" step="10" min="20" required /></div>
            </div>
          </div>
          <div class="ws-modal-foot">
            <button type="button" class="ws-btn ws-btn-secondary" @click="showCreateModal = false">취소</button>
            <button type="submit" class="ws-btn ws-btn-primary" :disabled="submitting">
              <span v-if="submitting" class="ws-spinner"></span> {{ submitting ? '입찰 등록 중...' : '광고 등록·입찰 개시' }}
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
import WsIcon from '@packages/ui/WsIcon.vue';

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
.ws-stat-value .unit { font-size: 13px; font-weight: 700; color: var(--ws-text-muted); margin-left: 2px; }
.ws-stat-value.spend { color: var(--ws-brand); }
.ws-stat-value.clicks { color: var(--ws-success); }
.danger-link { color: var(--ws-danger); }
.danger-link:hover { background: var(--ws-danger-bg); color: var(--ws-danger); }
.ws-badge { font-family: var(--ws-font); }
</style>
