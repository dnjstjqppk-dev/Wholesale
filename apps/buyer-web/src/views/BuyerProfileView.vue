<template>
  <div class="buyer-profile-page">
    <div class="page-header">
      <div class="header-content">
        <h2>구매 기업 프로필 및 조직 권한 관리 (Corporate Profile & Sub-Accounts)</h2>
        <p class="subtitle">
          기업 기본 식별 정보(EIN/VAT, 사업자등록증), 비과세 인증서, 조직 내 역할 분리(SoD) 계정 및 배송지 주소록을 통합 관리합니다.
        </p>
      </div>
      <div class="role-badge-box">
        <span class="role-label">현재 접속 역할:</span>
        <span class="badge" :class="currentRoleBadgeClass">{{ currentUser.role }}</span>
        <div class="role-switch-btns">
          <button
            class="btn-switch"
            :class="{ active: currentUser.role === 'BUYER_PURCHASER' }"
            @click="switchRole('BUYER_PURCHASER')"
          >
            구매 담당 (Purchaser)
          </button>
          <button
            class="btn-switch"
            :class="{ active: currentUser.role === 'BUYER_APPROVER' }"
            @click="switchRole('BUYER_APPROVER')"
          >
            구매 승인권자 (Approver)
          </button>
          <button
            class="btn-switch"
            :class="{ active: currentUser.role === 'BUYER_FINANCE' }"
            @click="switchRole('BUYER_FINANCE')"
          >
            재무 담당 (Finance)
          </button>
        </div>
      </div>
    </div>

    <!-- Alert / Toast -->
    <div v-if="toastMessage" class="toast-banner" :class="toastType">
      {{ toastMessage }}
    </div>

    <div v-if="loading" class="loading-state">
      <p>조직 프로필 데이터를 불러오는 중입니다...</p>
    </div>

    <div v-else class="profile-layout">
      <!-- Section 1: Corporate Profile & Tax Credentials -->
      <section class="card-section">
        <div class="section-head">
          <div class="title-with-icon">
            <span class="sec-icon">🏢</span>
            <h3>기업 식별 정보 및 면세 증빙 (EIN/VAT & Tax Exemption)</h3>
          </div>
          <button v-if="!editingProfile" class="btn-secondary" @click="editingProfile = true">
            프로필 수정
          </button>
          <div v-else class="edit-btns">
            <button class="btn-cancel" @click="cancelEditProfile">취소</button>
            <button class="btn-primary" :disabled="saving" @click="saveProfile">
              {{ saving ? '저장 중...' : '저장 완료' }}
            </button>
          </div>
        </div>

        <div v-if="!editingProfile" class="info-grid">
          <div class="info-item">
            <label>법인명 (Legal Name)</label>
            <div class="val font-semibold">{{ profile.legal_name }}</div>
          </div>
          <div class="info-item">
            <label>사업자 등록번호 (Business ID)</label>
            <div class="val">{{ profile.business_number }}</div>
          </div>
          <div class="info-item">
            <label>연방 사업자 번호 / VAT (EIN)</label>
            <div class="val font-mono">{{ profile.ein_vat }}</div>
          </div>
          <div class="info-item">
            <label>주요 수입 업종 (Industry)</label>
            <div class="val">{{ profile.primary_industry }}</div>
          </div>
          <div class="info-item">
            <label>연간 구매 규모 (Annual Volume)</label>
            <div class="val text-green-700 font-semibold">{{ profile.annual_purchasing_volume_usd }}</div>
          </div>
          <div class="info-item">
            <label>면세 인증 상태 (Tax Exemption)</label>
            <div class="val">
              <span class="tax-badge" :class="profile.tax_exemption_status.toLowerCase()">
                ✓ {{ profile.tax_exemption_status }} (US Resale Certificate Active)
              </span>
            </div>
          </div>
          <div class="info-item">
            <label>대표 담당자</label>
            <div class="val">{{ profile.contact_person }}</div>
          </div>
          <div class="info-item">
            <label>담당자 이메일</label>
            <div class="val">{{ profile.contact_email }}</div>
          </div>
          <div class="info-item">
            <label>대표 연락처</label>
            <div class="val">{{ profile.contact_phone }}</div>
          </div>
        </div>

        <!-- Edit Form Mode -->
        <form v-else class="edit-form" @submit.prevent="saveProfile">
          <div class="form-row">
            <div class="form-group">
              <label>법인명</label>
              <input v-model="editForm.legal_name" type="text" required />
            </div>
            <div class="form-group">
              <label>사업자 등록번호</label>
              <input v-model="editForm.business_number" type="text" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>EIN / VAT 번호</label>
              <input v-model="editForm.ein_vat" type="text" required />
            </div>
            <div class="form-group">
              <label>주요 수입 업종</label>
              <input v-model="editForm.primary_industry" type="text" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>담당자 이름</label>
              <input v-model="editForm.contact_person" type="text" required />
            </div>
            <div class="form-group">
              <label>담당자 이메일</label>
              <input v-model="editForm.contact_email" type="email" required />
            </div>
            <div class="form-group">
              <label>담당자 연락처</label>
              <input v-model="editForm.contact_phone" type="text" required />
            </div>
          </div>
        </form>
      </section>

      <!-- Section 2: Sub-Accounts & SoD (Segregation of Duties) -->
      <section class="card-section">
        <div class="section-head">
          <div class="title-with-icon">
            <span class="sec-icon">👥</span>
            <h3>서브 계정 및 구매 승인 권한 (Sub-Accounts & SoD Matrix)</h3>
          </div>
          <button class="btn-primary" @click="showAddSubModal = true">
            + 서브 계정 초대
          </button>
        </div>

        <p class="section-desc">
          Alibaba.com 엔터프라이즈 거버넌스 규격: 발주 요청자(Purchaser)와 승인권자(Approver)의 권한이 분리되어 <strong>$10,000 이상 거래 시 자기 승인(Self-Approval)이 금지</strong>됩니다.
        </p>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>이름 / 이메일</th>
                <th>조직 내 역할 (Role)</th>
                <th>승인 권한 (Approval Auth)</th>
                <th>1회 결제 한도 (Limit)</th>
                <th>계정 상태</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sub in profile.sub_accounts" :key="sub.id">
                <td>
                  <div class="user-cell">
                    <span class="user-name">{{ sub.full_name }}</span>
                    <span class="user-email">{{ sub.email }}</span>
                  </div>
                </td>
                <td>
                  <span class="role-tag" :class="sub.role">
                    {{ formatRoleName(sub.role) }}
                  </span>
                </td>
                <td>
                  <span v-if="sub.can_approve" class="text-green-600 font-semibold">✓ 승인 가능 (Can Approve)</span>
                  <span v-else class="text-gray-400">✗ 발주만 가능</span>
                </td>
                <td>
                  <strong>${{ sub.spending_limit_usd.toLocaleString() }}</strong>
                </td>
                <td>
                  <span class="status-pill active">{{ sub.status }}</span>
                </td>
                <td>{{ formatDate(sub.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Section 3: Address Book (Organization Addresses) -->
      <section class="card-section">
        <div class="section-head">
          <div class="title-with-icon">
            <span class="sec-icon">📍</span>
            <h3>화물 배송지 및 청구 주소록 (Organization Addresses)</h3>
          </div>
          <button class="btn-primary" @click="showAddAddressModal = true">
            + 배송지/청구지 추가
          </button>
        </div>

        <div class="address-grid">
          <div
            v-for="addr in profile.addresses"
            :key="addr.id"
            class="address-card"
            :class="{ 'is-default': addr.is_default }"
          >
            <div class="addr-header">
              <span class="type-badge" :class="addr.type">{{ addr.type === 'SHIPPING' ? '배송지' : '청구지' }}</span>
              <span v-if="addr.is_default" class="default-badge">기본 {{ addr.type === 'SHIPPING' ? '배송지' : '청구지' }}</span>
              <button class="btn-del" title="삭제" @click="deleteAddress(addr.id)">×</button>
            </div>
            <div class="addr-body">
              <div class="rec-name font-semibold">{{ addr.recipient_name }}</div>
              <div class="phone text-sm text-gray-500">{{ addr.phone }}</div>
              <div class="street">{{ addr.address_line1 }}</div>
              <div v-if="addr.address_line2" class="suite">{{ addr.address_line2 }}</div>
              <div class="region">{{ addr.city }}, {{ addr.state_province }} {{ addr.postal_code }} ({{ addr.country }})</div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Modal: Add Sub-Account -->
    <div v-if="showAddSubModal" class="modal-backdrop" @click.self="showAddSubModal = false">
      <div class="modal-window">
        <h3>신규 서브 계정 추가 (Invite Member)</h3>
        <form @submit.prevent="submitNewSubAccount">
          <div class="form-group">
            <label>이름</label>
            <input v-model="newSubForm.full_name" type="text" placeholder="예: 김구매 대리" required />
          </div>
          <div class="form-group">
            <label>이메일</label>
            <input v-model="newSubForm.email" type="email" placeholder="purchaser@company.com" required />
          </div>
          <div class="form-group">
            <label>부여 역할</label>
            <select v-model="newSubForm.role">
              <option value="BUYER_PURCHASER">구매 실무자 (BUYER_PURCHASER)</option>
              <option value="BUYER_APPROVER">구매 승인권자 (BUYER_APPROVER)</option>
              <option value="BUYER_FINANCE">재무 관리자 (BUYER_FINANCE)</option>
            </select>
          </div>
          <div class="form-group">
            <label>1회 발주 승인 한도 (USD)</label>
            <input v-model.number="newSubForm.spending_limit_usd" type="number" min="1000" step="1000" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showAddSubModal = false">취소</button>
            <button type="submit" class="btn-primary" :disabled="saving">추가하기</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Add Address -->
    <div v-if="showAddAddressModal" class="modal-backdrop" @click.self="showAddAddressModal = false">
      <div class="modal-window">
        <h3>신규 배송/청구 주소 등록 (Add Address)</h3>
        <form @submit.prevent="submitNewAddress">
          <div class="form-group">
            <label>주소 용도</label>
            <select v-model="newAddrForm.type">
              <option value="SHIPPING">화물 배송지 (Shipping Address)</option>
              <option value="BILLING">세무 청구지 (Billing Address)</option>
            </select>
          </div>
          <div class="form-group">
            <label>수령인 / 물류 창고 담당자</label>
            <input v-model="newAddrForm.recipient_name" type="text" required />
          </div>
          <div class="form-group">
            <label>연락처</label>
            <input v-model="newAddrForm.phone" type="text" required />
          </div>
          <div class="form-group">
            <label>국가</label>
            <select v-model="newAddrForm.country">
              <option value="US">United States (US)</option>
              <option value="KR">South Korea (KR)</option>
              <option value="CN">China (CN)</option>
              <option value="JP">Japan (JP)</option>
              <option value="DE">Germany (DE)</option>
            </select>
          </div>
          <div class="form-group">
            <label>주소 1 (도로명/번지)</label>
            <input v-model="newAddrForm.address_line1" type="text" required />
          </div>
          <div class="form-group">
            <label>주소 2 (상세/동·호수/부두 게이트)</label>
            <input v-model="newAddrForm.address_line2" type="text" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>도시 (City)</label>
              <input v-model="newAddrForm.city" type="text" required />
            </div>
            <div class="form-group">
              <label>주/도 (State/Province)</label>
              <input v-model="newAddrForm.state_province" type="text" required />
            </div>
            <div class="form-group">
              <label>우편번호 (Postal Code)</label>
              <input v-model="newAddrForm.postal_code" type="text" required />
            </div>
          </div>
          <div class="form-checkbox">
            <label>
              <input v-model="newAddrForm.is_default" type="checkbox" />
              기본 주소로 설정
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showAddAddressModal = false">취소</button>
            <button type="submit" class="btn-primary" :disabled="saving">주소 등록</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { apiRequest, getCurrentUser, switchBuyerUser, setAuthSession, UserSession } from '../api';

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
  try {
    const res = await apiRequest<{ access_token: string; user: any; organization: any }>('/auth/profile/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    const session: UserSession = {
      ...res.user,
      organization: res.organization,
    };
    setAuthSession(res.access_token, session);
    currentUser.value = session;
    showToast(`접속 역할이 '${formatRoleName(role)}'(으)로 전환되었습니다.`);
  } catch {
    // Local fallback
    if (role === 'BUYER_PURCHASER') {
      await switchBuyerUser('buyer@wholesale.internal');
    } else {
      await switchBuyerUser('approver@wholesale.internal');
    }
    currentUser.value = getCurrentUser();
    showToast(`접속 역할이 전환되었습니다.`);
  }
}

onMounted(() => {
  fetchProfile();
});
</script>

<style scoped>
.buyer-profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px 80px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 20px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px 0;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.role-badge-box {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 16px;
  text-align: right;
  flex-shrink: 0;
}

.role-label {
  font-size: 12px;
  color: #6b7280;
  margin-right: 6px;
}

.badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
}

.role-purchaser { background: #dbeafe; color: #1e40af; }
.role-approver { background: #fef3c7; color: #92400e; }
.role-finance { background: #d1fae5; color: #065f46; }

.role-switch-btns {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.btn-switch {
  font-size: 11px;
  padding: 4px 8px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-switch:hover {
  background: #f3f4f6;
}

.btn-switch.active {
  background: #ff6600;
  color: white;
  border-color: #ff6600;
  font-weight: 600;
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

.profile-layout {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.card-section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 12px;
}

.title-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sec-icon {
  font-size: 20px;
}

.section-head h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.section-desc {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
  margin-bottom: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.info-item label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.info-item .val {
  font-size: 14px;
  color: #111827;
}

.tax-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  background: #d1fae5;
  color: #065f46;
}

.edit-form .form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 14px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.form-group input,
.form-group select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.btn-primary {
  background: #ff6600;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: #e65c00;
}

.btn-secondary {
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 8px;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.data-table th {
  background: #f9fafb;
  padding: 10px 12px;
  font-weight: 600;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.user-cell {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: #111827;
}

.user-email {
  font-size: 12px;
  color: #6b7280;
}

.role-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.role-tag.BUYER_PURCHASER { background: #e0f2fe; color: #0369a1; }
.role-tag.BUYER_APPROVER { background: #fef3c7; color: #b45309; }
.role-tag.BUYER_FINANCE { background: #dcfce7; color: #15803d; }

.status-pill.active {
  background: #dcfce7;
  color: #166534;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
}

.address-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.address-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
  position: relative;
  display: flex;
  flex-direction: column;
}

.address-card.is-default {
  border-color: #ff6600;
  background: #fffbf7;
}

.addr-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.type-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.type-badge.SHIPPING { background: #e0e7ff; color: #3730a3; }
.type-badge.BILLING { background: #f3e8ff; color: #6b21a8; }

.default-badge {
  font-size: 11px;
  font-weight: 700;
  background: #fed7aa;
  color: #9a3412;
  padding: 2px 6px;
  border-radius: 4px;
}

.btn-del {
  margin-left: auto;
  background: transparent;
  border: none;
  font-size: 18px;
  color: #9ca3af;
  cursor: pointer;
}

.btn-del:hover {
  color: #ef4444;
}

.addr-body {
  font-size: 13px;
  line-height: 1.4;
  color: #374151;
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
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.modal-window h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-checkbox {
  margin-top: 10px;
  font-size: 13px;
}

/* Mobile & Tablet Responsive Layout */
@media (max-width: 992px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .role-badge-box {
    text-align: left;
  }
  .info-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .address-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 640px) {
  .info-grid {
    grid-template-columns: 1fr !important;
  }
  .address-grid {
    grid-template-columns: 1fr !important;
  }
  .role-switch-btns {
    flex-direction: column;
  }
  .edit-form .form-row {
    flex-direction: column;
    gap: 10px;
  }
}
</style>

