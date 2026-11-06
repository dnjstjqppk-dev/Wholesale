<template>
  <div class="ws-page ws-page-wide">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Corporate Profile</p>
      <div class="ws-page-head-row">
        <h1 class="ws-page-title">기업 프로필·조직 권한</h1>
        <div class="role-switch">
          <span class="ws-small ws-muted">현재 역할 <b class="role-tag" :class="currentRoleBadgeClass">{{ currentUser.role }}</b></span>
          <span class="ws-cluster" style="gap: 6px">
            <button class="ws-tag" :class="{ 'ws-tag-active': currentUser.role === 'BUYER_PURCHASER' }" @click="switchRole('BUYER_PURCHASER')">구매 담당</button>
            <button class="ws-tag" :class="{ 'ws-tag-active': currentUser.role === 'BUYER_APPROVER' }" @click="switchRole('BUYER_APPROVER')">승인권자</button>
            <button class="ws-tag" :class="{ 'ws-tag-active': currentUser.role === 'BUYER_FINANCE' }" @click="switchRole('BUYER_FINANCE')">재무 담당</button>
          </span>
        </div>
      </div>
      <p class="ws-page-sub">EIN/VAT 식별 정보·면세 증명·SoD 서브 계정·배송지 주소록 통합 관리. <router-link to="/onboarding" class="ws-link">온보딩 체크리스트 보기</router-link></p>
    </div>

    <div v-if="toastMessage" class="ws-banner" :class="toastType === 'error' ? 'ws-banner-danger' : 'ws-banner-success'">
      <WsIcon :name="toastType === 'error' ? 'alert' : 'check'" :size="16" />
      <span>{{ toastMessage }}</span>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton" style="height: 200px"></div>
      <div class="ws-skeleton" style="height: 200px"></div>
    </div>

    <div v-else class="ws-stack">
      <!-- Corporate identity -->
      <section class="ws-card">
        <div class="ws-card-head">
          <h3><WsIcon name="building" :size="16" class="h-ico" /> 기업 식별 정보·면세 증빙</h3>
          <span v-if="!editingProfile"><button class="ws-btn ws-btn-secondary ws-btn-sm" @click="editingProfile = true">프로필 수정</button></span>
          <span v-else class="ws-cluster" style="gap: 8px">
            <button class="ws-btn ws-btn-ghost ws-btn-sm" @click="cancelEditProfile">취소</button>
            <button class="ws-btn ws-btn-primary ws-btn-sm" :disabled="saving" @click="saveProfile">{{ saving ? '저장 중...' : '저장 완료' }}</button>
          </span>
        </div>

        <div v-if="!editingProfile" class="ws-grid-3 info-tiles">
          <div><span>법인명</span><b>{{ profile.legal_name }}</b></div>
          <div><span>사업자 등록번호</span><b class="ws-figure">{{ profile.business_number }}</b></div>
          <div><span>EIN / VAT</span><b class="ws-figure">{{ profile.ein_vat }}</b></div>
          <div><span>주요 수입 업종</span><b>{{ profile.primary_industry }}</b></div>
          <div><span>연간 구매 규모</span><b class="ws-price ws-figure">{{ profile.annual_purchasing_volume_usd }}</b></div>
          <div><span>면세 인증 상태</span><b><span class="ws-badge ws-badge-success">{{ profile.tax_exemption_status }}</span></b></div>
          <div><span>대표 담당자</span><b>{{ profile.contact_person }}</b></div>
          <div><span>담당자 이메일</span><b>{{ profile.contact_email }}</b></div>
          <div><span>대표 연락처</span><b class="ws-figure">{{ profile.contact_phone }}</b></div>
        </div>

        <form v-else class="ws-stack" @submit.prevent="saveProfile">
          <div class="ws-grid-2">
            <div class="ws-field"><label>법인명</label><input v-model="editForm.legal_name" type="text" required /></div>
            <div class="ws-field"><label>사업자 등록번호</label><input v-model="editForm.business_number" type="text" required /></div>
          </div>
          <div class="ws-grid-2">
            <div class="ws-field"><label>EIN / VAT 번호</label><input v-model="editForm.ein_vat" type="text" required /></div>
            <div class="ws-field"><label>주요 수입 업종</label><input v-model="editForm.primary_industry" type="text" required /></div>
          </div>
          <div class="ws-grid-3">
            <div class="ws-field"><label>담당자 이름</label><input v-model="editForm.contact_person" type="text" required /></div>
            <div class="ws-field"><label>담당자 이메일</label><input v-model="editForm.contact_email" type="email" required /></div>
            <div class="ws-field"><label>담당자 연락처</label><input v-model="editForm.contact_phone" type="text" required /></div>
          </div>
        </form>
      </section>

      <!-- Sub-accounts -->
      <section class="ws-card">
        <div class="ws-card-head">
          <h3><WsIcon name="users" :size="16" class="h-ico" /> 서브 계정·승인 권한 (SoD)</h3>
          <button class="ws-btn ws-btn-primary ws-btn-sm" @click="showAddSubModal = true"><WsIcon name="plus" :size="13" /> 서브 계정 초대</button>
        </div>
        <p class="ws-card-sub">발주 요청자(Purchaser)와 승인권자(Approver) 권한 분리 · <b>$10,000 이상 거래 자기 승인(Self-Approval) 금지</b></p>
        <div class="ws-table-wrap">
          <div class="ws-table-scroll">
            <table class="ws-table">
              <thead><tr><th>이름 / 이메일</th><th>역할</th><th>승인 권한</th><th class="ws-num">1회 한도</th><th>상태</th><th>등록일</th></tr></thead>
              <tbody>
                <tr v-for="sub in profile.sub_accounts" :key="sub.id">
                  <td><span class="ws-cell-main">{{ sub.full_name }}</span><br /><span class="ws-cell-sub">{{ sub.email }}</span></td>
                  <td><span class="ws-badge ws-badge-navy">{{ formatRoleName(sub.role) }}</span></td>
                  <td><span v-if="sub.can_approve" class="ws-badge ws-badge-success">승인 가능</span><span v-else class="ws-badge ws-badge-outline">발주만</span></td>
                  <td class="ws-num ws-figure"><b>${{ sub.spending_limit_usd.toLocaleString() }}</b></td>
                  <td><span class="ws-badge ws-badge-info">{{ sub.status }}</span></td>
                  <td class="ws-cell-sub">{{ formatDate(sub.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Addresses -->
      <section class="ws-card">
        <div class="ws-card-head">
          <h3><WsIcon name="pin" :size="16" class="h-ico" /> 배송지·청구 주소록</h3>
          <button class="ws-btn ws-btn-primary ws-btn-sm" @click="showAddAddressModal = true"><WsIcon name="plus" :size="13" /> 주소 추가</button>
        </div>
        <div class="ws-grid-3">
          <div v-for="addr in profile.addresses" :key="addr.id" class="addr-card" :class="{ 'is-default': addr.is_default }">
            <div class="ws-split">
              <span class="ws-cluster" style="gap: 6px">
                <span class="ws-badge" :class="addr.type === 'SHIPPING' ? 'ws-badge-info' : 'ws-badge-brand'">{{ addr.type === 'SHIPPING' ? '배송지' : '청구지' }}</span>
                <span v-if="addr.is_default" class="ws-badge ws-badge-success">기본</span>
              </span>
              <button class="ws-icon-btn" title="삭제" aria-label="주소 삭제" @click="deleteAddress(addr.id)"><WsIcon name="x" :size="14" /></button>
            </div>
            <b>{{ addr.recipient_name }}</b>
            <p class="ws-small ws-muted ws-figure">{{ addr.phone }}</p>
            <p class="ws-small">{{ addr.address_line1 }}</p>
            <p v-if="addr.address_line2" class="ws-small">{{ addr.address_line2 }}</p>
            <p class="ws-small">{{ addr.city }}, {{ addr.state_province }} {{ addr.postal_code }} ({{ addr.country }})</p>
          </div>
        </div>
      </section>
    </div>

    <!-- Sub-account modal -->
    <div v-if="showAddSubModal" class="ws-modal-backdrop" @click.self="showAddSubModal = false">
      <div class="ws-modal" role="dialog" aria-modal="true">
        <div class="ws-modal-head">
          <h3>서브 계정 초대</h3>
          <button class="ws-icon-btn" aria-label="닫기" @click="showAddSubModal = false"><WsIcon name="x" :size="15" /></button>
        </div>
        <form @submit.prevent="submitNewSubAccount">
          <div class="ws-modal-body">
            <div class="ws-field"><label>이름</label><input v-model="newSubForm.full_name" type="text" placeholder="예: 김구매 대리" required /></div>
            <div class="ws-field"><label>이메일</label><input v-model="newSubForm.email" type="email" placeholder="purchaser@company.com" required /></div>
            <div class="ws-field">
              <label>부여 역할</label>
              <select v-model="newSubForm.role">
                <option value="BUYER_PURCHASER">구매 실무자 (BUYER_PURCHASER)</option>
                <option value="BUYER_APPROVER">구매 승인권자 (BUYER_APPROVER)</option>
                <option value="BUYER_FINANCE">재무 관리자 (BUYER_FINANCE)</option>
              </select>
            </div>
            <div class="ws-field" style="margin-bottom: 0"><label>1회 발주 승인 한도 (USD)</label><input v-model.number="newSubForm.spending_limit_usd" type="number" min="1000" step="1000" required /></div>
          </div>
          <div class="ws-modal-foot">
            <button type="button" class="ws-btn ws-btn-secondary" @click="showAddSubModal = false">취소</button>
            <button type="submit" class="ws-btn ws-btn-primary" :disabled="saving">추가하기</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Address modal -->
    <div v-if="showAddAddressModal" class="ws-modal-backdrop" @click.self="showAddAddressModal = false">
      <div class="ws-modal" role="dialog" aria-modal="true">
        <div class="ws-modal-head">
          <h3>배송/청구 주소 등록</h3>
          <button class="ws-icon-btn" aria-label="닫기" @click="showAddAddressModal = false"><WsIcon name="x" :size="15" /></button>
        </div>
        <form @submit.prevent="submitNewAddress">
          <div class="ws-modal-body">
            <div class="ws-field">
              <label>주소 용도</label>
              <select v-model="newAddrForm.type">
                <option value="SHIPPING">화물 배송지 (Shipping Address)</option>
                <option value="BILLING">세무 청구지 (Billing Address)</option>
              </select>
            </div>
            <div class="ws-grid-2">
              <div class="ws-field"><label>수령인 / 담당자</label><input v-model="newAddrForm.recipient_name" type="text" required /></div>
              <div class="ws-field"><label>연락처</label><input v-model="newAddrForm.phone" type="text" required /></div>
            </div>
            <div class="ws-field">
              <label>국가</label>
              <select v-model="newAddrForm.country">
                <option value="US">United States (US)</option>
                <option value="KR">South Korea (KR)</option>
                <option value="CN">China (CN)</option>
                <option value="JP">Japan (JP)</option>
                <option value="DE">Germany (DE)</option>
              </select>
            </div>
            <div class="ws-field"><label>주소 1 (도로명/번지)</label><input v-model="newAddrForm.address_line1" type="text" required /></div>
            <div class="ws-field"><label>주소 2 (상세/부두 게이트)</label><input v-model="newAddrForm.address_line2" type="text" /></div>
            <div class="ws-grid-3">
              <div class="ws-field"><label>도시</label><input v-model="newAddrForm.city" type="text" required /></div>
              <div class="ws-field"><label>주/도</label><input v-model="newAddrForm.state_province" type="text" required /></div>
              <div class="ws-field"><label>우편번호</label><input v-model="newAddrForm.postal_code" type="text" required /></div>
            </div>
            <label class="ws-check" style="margin-bottom: 0"><input v-model="newAddrForm.is_default" type="checkbox" /> 기본 주소로 설정</label>
          </div>
          <div class="ws-modal-foot">
            <button type="button" class="ws-btn ws-btn-secondary" @click="showAddAddressModal = false">취소</button>
            <button type="submit" class="ws-btn ws-btn-primary" :disabled="saving">주소 등록</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { apiRequest, getCurrentUser, switchBuyerUser, UserSession } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const currentUser = ref<UserSession>(getCurrentUser());
const loading = ref(true);
const saving = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');

const profile = ref<any>({
  legal_name: '',
  business_number: '',
  ein_vat: '',
  tax_exemption_status: 'VERIFIED',
  primary_industry: '',
  annual_purchasing_volume_usd: '',
  contact_person: '',
  contact_email: '',
  contact_phone: '',
  sub_accounts: [],
  addresses: [],
});

const editingProfile = ref(false);
const editForm = ref<any>({});

const showAddSubModal = ref(false);
const newSubForm = ref({
  full_name: '',
  email: '',
  role: 'BUYER_PURCHASER',
  spending_limit_usd: 10000,
});

const showAddAddressModal = ref(false);
const newAddrForm = ref({
  type: 'SHIPPING',
  recipient_name: '',
  phone: '',
  country: 'US',
  address_line1: '',
  address_line2: '',
  city: '',
  state_province: '',
  postal_code: '',
  is_default: false,
});

const currentRoleBadgeClass = computed(() => {
  const r = currentUser.value.role;
  if (r === 'BUYER_PURCHASER') return 'role-purchaser';
  if (r === 'BUYER_APPROVER') return 'role-approver';
  if (r === 'BUYER_FINANCE') return 'role-finance';
  return 'role-default';
});

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = '';
  }, 4000);
}

function formatDate(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatRoleName(role: string): string {
  switch (role) {
    case 'BUYER_PURCHASER':
      return '구매 실무 담당자';
    case 'BUYER_APPROVER':
      return '구매 승인권자 (결재권자)';
    case 'BUYER_FINANCE':
      return '재무/에스크로 관리자';
    default:
      return role;
  }
}

async function fetchProfile() {
  loading.value = true;
  try {
    const data = await apiRequest('/auth/profile', { method: 'GET' });
    profile.value = data;
    editForm.value = { ...data };
  } catch (err: any) {
    showToast(`프로필 로딩 실패: ${err.message}`, 'error');
  } finally {
    loading.value = false;
  }
}

function cancelEditProfile() {
  editForm.value = { ...profile.value };
  editingProfile.value = false;
}

async function saveProfile() {
  saving.value = true;
  try {
    const updated = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(editForm.value),
    });
    profile.value = updated;
    editingProfile.value = false;
    showToast('기업 프로필 및 면세 식별 정보가 성공적으로 업데이트되었습니다.');
  } catch (err: any) {
    showToast(`저장 실패: ${err.message}`, 'error');
  } finally {
    saving.value = false;
  }
}

async function submitNewSubAccount() {
  saving.value = true;
  try {
    const canApprove = newSubForm.value.role !== 'BUYER_PURCHASER';
    const newSub = await apiRequest('/auth/profile/sub-accounts', {
      method: 'POST',
      body: JSON.stringify({
        ...newSubForm.value,
        can_approve: canApprove,
      }),
    });
    profile.value.sub_accounts.push(newSub);
    showAddSubModal.value = false;
    newSubForm.value = {
      full_name: '',
      email: '',
      role: 'BUYER_PURCHASER',
      spending_limit_usd: 10000,
    };
    showToast('신규 서브 계정이 조직에 성공적으로 등록되었습니다.');
  } catch (err: any) {
    showToast(`서브 계정 등록 실패: ${err.message}`, 'error');
  } finally {
    saving.value = false;
  }
}

async function submitNewAddress() {
  saving.value = true;
  try {
    const created = await apiRequest('/auth/profile/addresses', {
      method: 'POST',
      body: JSON.stringify(newAddrForm.value),
    });
    if (created.is_default) {
      profile.value.addresses.forEach((a: any) => {
        if (a.type === created.type) a.is_default = false;
      });
    }
    profile.value.addresses.push(created);
    showAddAddressModal.value = false;
    newAddrForm.value = {
      type: 'SHIPPING',
      recipient_name: '',
      phone: '',
      country: 'US',
      address_line1: '',
      address_line2: '',
      city: '',
      state_province: '',
      postal_code: '',
      is_default: false,
    };
    showToast('새 주소가 주소록에 등록되었습니다.');
  } catch (err: any) {
    showToast(`주소 등록 실패: ${err.message}`, 'error');
  } finally {
    saving.value = false;
  }
}

async function deleteAddress(id: string) {
  if (!confirm('해당 주소를 삭제하시겠습니까?')) return;
  try {
    await apiRequest(`/auth/profile/addresses/${id}`, { method: 'DELETE' });
    profile.value.addresses = profile.value.addresses.filter((a: any) => a.id !== id);
    showToast('주소가 성공적으로 삭제되었습니다.');
  } catch (err: any) {
    showToast(`삭제 실패: ${err.message}`, 'error');
  }
}

async function switchRole(role: 'BUYER_PURCHASER' | 'BUYER_APPROVER' | 'BUYER_FINANCE') {
  // Role switching always re-authenticates via standard login (no demo switcher endpoint).
  try {
    if (role === 'BUYER_PURCHASER') {
      await switchBuyerUser('buyer@wholesale.internal');
    } else {
      await switchBuyerUser('approver@wholesale.internal');
    }
    currentUser.value = getCurrentUser();
    showToast(`접속 역할이 '${formatRoleName(role)}'(으)로 전환되었습니다.`);
  } catch (err: any) {
    showToast(`역할 전환 실패: ${err.message}`, 'error');
  }
}

onMounted(() => {
  fetchProfile();
});
</script>

<style scoped>
.role-switch { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
.role-tag { font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 9999px; margin-left: 6px; }
.role-purchaser { background: var(--ws-info-bg); color: var(--ws-info); }
.role-approver { background: var(--ws-brand-light); color: var(--ws-brand); }
.role-finance { background: var(--ws-success-bg); color: var(--ws-success); }
.role-default { background: var(--ws-surface-muted); color: var(--ws-text-2); }
.h-ico { color: var(--ws-navy); vertical-align: -3px; }
.info-tiles div { display: flex; flex-direction: column; gap: 3px; padding: 12px 0; border-bottom: 1px solid var(--ws-border-subtle); }
.info-tiles span { font-size: 11px; font-weight: 700; color: var(--ws-text-muted); }
.info-tiles b { font-size: 14px; }
.addr-card { border: 1px solid var(--ws-border-subtle); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 2px; }
.addr-card.is-default { border-color: var(--ws-success); background: #f6fef9; }
.addr-card b { font-size: 14px; margin-top: 8px; }
.addr-card p { margin: 0; }
@media (max-width: 900px) {
  .role-switch { align-items: flex-start; }
}
</style>
