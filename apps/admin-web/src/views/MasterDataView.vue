<template>
  <div class="master-data-page">
    <div class="page-head">
      <div class="head-text">
        <h2>플랫폼 마스터 데이터 및 통상 규격 관리 (Master Data Management)</h2>
        <p class="subtitle">
          3단계 표준 산업 카테고리 트리, 카테고리별 필수 기술 속성, HS Code 수입 관세율 및 실시간 외환 환율을 전사 통합 관리합니다.
        </p>
      </div>
      <button class="btn-refresh" @click="fetchMasterData">
        ↻ 데이터 새로고침
      </button>
    </div>

    <!-- Toast Alert -->
    <div v-if="toastMessage" class="toast-banner" :class="toastType">
      {{ toastMessage }}
    </div>

    <!-- Tab Bar -->
    <div class="tab-bar">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'categories' }"
        @click="activeTab = 'categories'"
      >
        🌳 3단계 카테고리 체계 (Categories)
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'attributes' }"
        @click="activeTab = 'attributes'"
      >
        ⚙️ 카테고리 필수 속성 (Attributes)
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'tariffs' }"
        @click="activeTab = 'tariffs'"
      >
        🛃 HS Code 관세율 (Customs Tariffs)
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'fx' }"
        @click="activeTab = 'fx'"
      >
        💱 실시간 기준 환율 (FX Rates)
      </button>
    </div>

    <div v-if="loading" class="state-box">
      <p>마스터 데이터를 로드하는 중입니다...</p>
    </div>

    <div v-else class="tab-content-area">
      <!-- TAB 1: Categories -->
      <div v-if="activeTab === 'categories'" class="tab-panel">
        <div class="panel-head">
          <h3>표준 산업군 및 세부 카테고리 트리 (Standard Category Hierarchy)</h3>
          <button class="btn-primary" @click="showAddCatModal = true">+ 대분류 카테고리 추가</button>
        </div>
        <div class="category-cards">
          <div v-for="cat in masterData.categories" :key="cat.id" class="cat-card">
            <div class="cat-header">
              <span class="cat-icon">{{ cat.icon }}</span>
              <div class="cat-info">
                <h4>{{ cat.name }}</h4>
                <span class="cat-en">{{ cat.name_en }}</span>
                <span class="cat-code">ID: {{ cat.id }}</span>
              </div>
            </div>
            <div class="subcategories-box">
              <span class="sub-title">세부 산업 하위 분류 (Level 2/3):</span>
              <div class="sub-tags">
                <span v-for="(sub, sIdx) in cat.subcategories" :key="sIdx" class="sub-tag">
                  {{ sub }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: Category Attributes -->
      <div v-if="activeTab === 'attributes'" class="tab-panel">
        <div class="panel-head">
          <h3>품목 등록 필수 기술 속성 정의 (Category Mandatory Attributes)</h3>
          <button class="btn-primary" @click="showAddAttrModal = true">+ 기술 속성 추가</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>적용 카테고리</th>
              <th>속성 명칭 (Attribute Name)</th>
              <th>데이터 타입</th>
              <th>선택 옵션 (Options)</th>
              <th>필수 입력 여부</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="attr in masterData.category_attributes" :key="attr.id">
              <td>
                <span class="badge-cat">{{ attr.category_id }}</span>
              </td>
              <td class="font-bold text-gray-900">{{ attr.attribute_name }}</td>
              <td>
                <span class="badge-type">{{ attr.data_type }}</span>
              </td>
              <td class="text-sm text-gray-600">
                {{ attr.options ? attr.options.join(', ') : '자유 텍스트/숫자 입력' }}
              </td>
              <td>
                <span v-if="attr.is_required" class="badge-req">필수 (Required)</span>
                <span v-else class="text-gray-400">선택</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TAB 3: HS Code Customs Tariffs -->
      <div v-if="activeTab === 'tariffs'" class="tab-panel">
        <div class="panel-head">
          <h3>수출입 HS Code 및 기본 관세율표 (HS Tariff Table)</h3>
          <button class="btn-primary" @click="showAddTariffModal = true">+ 신규 HS Code 등록</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>HS Code</th>
              <th>품명 및 기술 규격 (Description)</th>
              <th>기본 관세율 (Duty)</th>
              <th>부가세 (VAT)</th>
              <th>수출 통제 및 요건 (Export Control)</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in masterData.customs_tariffs" :key="t.id">
              <td class="font-mono font-bold text-blue-600">{{ t.hs_code }}</td>
              <td>{{ t.description }}</td>
              <td class="font-bold">{{ t.duty_rate_percent }}%</td>
              <td>{{ t.vat_rate_percent }}%</td>
              <td>
                <span class="badge-restriction" :class="t.export_restriction.toLowerCase()">
                  {{ t.export_restriction }}
                </span>
              </td>
              <td>
                <button class="btn-del" @click="deleteTariff(t.id)">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TAB 4: FX Rates -->
      <div v-if="activeTab === 'fx'" class="tab-panel">
        <div class="panel-head">
          <h3>실시간 복수 통화 환율 설정 (Multi-Currency FX Rates)</h3>
          <button class="btn-primary" :disabled="savingFx" @click="saveFxRates">
            {{ savingFx ? '저장 중...' : '✓ 환율 변동 저장' }}
          </button>
        </div>
        <p class="guide-text">기준 통화: USD (미국 달러) | 최종 갱신: {{ formatDate(masterData.fx_rates?.updated_at) }}</p>
        <div class="fx-grid">
          <div v-for="(rate, cur) in fxRatesForm" :key="cur" class="fx-card">
            <span class="fx-cur">{{ cur }}</span>
            <div class="fx-input-wrap">
              <label>1 USD =</label>
              <input v-model.number="fxRatesForm[cur]" type="number" step="0.01" />
              <span class="fx-unit">{{ cur }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Add Category -->
    <div v-if="showAddCatModal" class="modal-backdrop" @click.self="showAddCatModal = false">
      <div class="modal-window">
        <h3>신규 표준 카테고리 추가</h3>
        <form @submit.prevent="submitCategory">
          <div class="form-group">
            <label>카테고리 코드 (예: CAT-AUT)</label>
            <input v-model="newCatForm.id" type="text" required />
          </div>
          <div class="form-group">
            <label>카테고리 국문명</label>
            <input v-model="newCatForm.name" type="text" placeholder="예: 자동차 & 모빌리티 부품" required />
          </div>
          <div class="form-group">
            <label>영문명 (English)</label>
            <input v-model="newCatForm.name_en" type="text" placeholder="Automotive & Mobility Parts" required />
          </div>
          <div class="form-group">
            <label>아이콘 이모지</label>
            <input v-model="newCatForm.icon" type="text" placeholder="🚗" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showAddCatModal = false">취소</button>
            <button type="submit" class="btn-primary">등록하기</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Add Attribute -->
    <div v-if="showAddAttrModal" class="modal-backdrop" @click.self="showAddAttrModal = false">
      <div class="modal-window">
        <h3>신규 카테고리 필수 속성 정의</h3>
        <form @submit.prevent="submitAttribute">
          <div class="form-group">
            <label>적용 카테고리</label>
            <select v-model="newAttrForm.category_id">
              <option v-for="c in masterData.categories" :key="c.id" :value="c.id">
                {{ c.id }} - {{ c.name.split(' (')[0] }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>속성 명칭 (Attribute Name)</label>
            <input v-model="newAttrForm.attribute_name" type="text" placeholder="예: 절연 내전압 (Withstand Voltage)" required />
          </div>
          <div class="form-group">
            <label>데이터 타입</label>
            <select v-model="newAttrForm.data_type">
              <option value="STRING">자유 텍스트 (STRING)</option>
              <option value="NUMBER">숫자 규격 (NUMBER)</option>
              <option value="SELECT">선택형 드롭다운 (SELECT)</option>
            </select>
          </div>
          <div class="form-checkbox">
            <label>
              <input v-model="newAttrForm.is_required" type="checkbox" />
              상품 등록 시 필수 입력 항목으로 지정
            </label>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showAddAttrModal = false">취소</button>
            <button type="submit" class="btn-primary">속성 추가</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Add Tariff -->
    <div v-if="showAddTariffModal" class="modal-backdrop" @click.self="showAddTariffModal = false">
      <div class="modal-window">
        <h3>신규 HS Code 및 통상 관세 규격 등록</h3>
        <form @submit.prevent="submitTariff">
          <div class="form-group">
            <label>HS Code (세번 부호 10자리)</label>
            <input v-model="newTariffForm.hs_code" type="text" placeholder="예: 8541.40.2000" required />
          </div>
          <div class="form-group">
            <label>품명 및 기술 설명 (Description)</label>
            <input v-model="newTariffForm.description" type="text" placeholder="예: 감광성 반도체 디바이스 및 태양전지" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>기본 관세율 (%)</label>
              <input v-model.number="newTariffForm.duty_rate_percent" type="number" step="0.1" required />
            </div>
            <div class="form-group">
              <label>부가세율 (%)</label>
              <input v-model.number="newTariffForm.vat_rate_percent" type="number" step="0.1" required />
            </div>
          </div>
          <div class="form-group">
            <label>수출입 통제 구분</label>
            <select v-model="newTariffForm.export_restriction">
              <option value="NONE">일반 품목 (NONE)</option>
              <option value="STRATEGIC_GOODS_PERMIT">전략물자 허가 필요 (STRATEGIC)</option>
              <option value="RESTRICTED_CHEMICAL">유해화학물질 취급 승인 (RESTRICTED)</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showAddTariffModal = false">취소</button>
            <button type="submit" class="btn-primary">HS Code 등록</button>
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
const savingFx = ref(false);
const activeTab = ref<'categories' | 'attributes' | 'tariffs' | 'fx'>('categories');

const masterData = ref<any>({
  categories: [],
  category_attributes: [],
  customs_tariffs: [],
  fx_rates: {},
});

const fxRatesForm = ref<Record<string, number>>({});

const showAddCatModal = ref(false);
const newCatForm = ref({
  id: '',
  name: '',
  name_en: '',
  icon: '📦',
});

const showAddAttrModal = ref(false);
const newAttrForm = ref({
  category_id: 'CAT-IND',
  attribute_name: '',
  data_type: 'STRING',
  is_required: true,
});

const showAddTariffModal = ref(false);
const newTariffForm = ref({
  hs_code: '',
  description: '',
  duty_rate_percent: 0.0,
  vat_rate_percent: 10.0,
  export_restriction: 'NONE',
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

function formatDate(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR');
}

async function fetchMasterData() {
  loading.value = true;
  try {
    const data = await apiRequest('/admin/master-data');
    masterData.value = data;
    if (data.fx_rates?.rates) {
      fxRatesForm.value = { ...data.fx_rates.rates };
    }
  } catch (err: any) {
    showToast(`마스터 데이터 조회 실패: ${err.message}`, 'error');
  } finally {
    loading.value = false;
  }
}

async function submitCategory() {
  try {
    const created = await apiRequest('/admin/master-data/categories', {
      method: 'POST',
      body: JSON.stringify(newCatForm.value),
    });
    masterData.value.categories.push(created);
    showAddCatModal.value = false;
    newCatForm.value = { id: '', name: '', name_en: '', icon: '📦' };
    showToast(`카테고리 '${created.name}'이(가) 성공적으로 생성되었습니다.`);
  } catch (err: any) {
    showToast(`생성 실패: ${err.message}`, 'error');
  }
}

async function submitAttribute() {
  try {
    const created = await apiRequest('/admin/master-data/attributes', {
      method: 'POST',
      body: JSON.stringify(newAttrForm.value),
    });
    masterData.value.category_attributes.push(created);
    showAddAttrModal.value = false;
    newAttrForm.value = { category_id: 'CAT-IND', attribute_name: '', data_type: 'STRING', is_required: true };
    showToast(`기술 속성 '${created.attribute_name}'이(가) 등록되었습니다.`);
  } catch (err: any) {
    showToast(`등록 실패: ${err.message}`, 'error');
  }
}

async function submitTariff() {
  try {
    const created = await apiRequest('/admin/master-data/tariffs', {
      method: 'POST',
      body: JSON.stringify(newTariffForm.value),
    });
    masterData.value.customs_tariffs.push(created);
    showAddTariffModal.value = false;
    newTariffForm.value = { hs_code: '', description: '', duty_rate_percent: 0.0, vat_rate_percent: 10.0, export_restriction: 'NONE' };
    showToast(`HS Code '${created.hs_code}' 관세 규격이 등록되었습니다.`);
  } catch (err: any) {
    showToast(`등록 실패: ${err.message}`, 'error');
  }
}

async function deleteTariff(id: string) {
  if (!confirm('해당 HS Code 관세 규격을 삭제하시겠습니까?')) return;
  try {
    await apiRequest(`/admin/master-data/tariffs/${id}`, { method: 'DELETE' });
    masterData.value.customs_tariffs = masterData.value.customs_tariffs.filter((t: any) => t.id !== id);
    showToast('관세 규격이 삭제되었습니다.');
  } catch (err: any) {
    showToast(`삭제 실패: ${err.message}`, 'error');
  }
}

async function saveFxRates() {
  savingFx.value = true;
  try {
    const updated = await apiRequest('/admin/master-data/fx-rates', {
      method: 'PUT',
      body: JSON.stringify({ rates: fxRatesForm.value }),
    });
    masterData.value.fx_rates = updated;
    showToast('실시간 기준 환율 테이블이 성공적으로 전산 갱신되었습니다.');
  } catch (err: any) {
    showToast(`환율 갱신 실패: ${err.message}`, 'error');
  } finally {
    savingFx.value = false;
  }
}

onMounted(() => {
  fetchMasterData();
});
</script>

<style scoped>
.master-data-page {
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

.btn-refresh {
  background: white;
  border: 1px solid #cbd5e1;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
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

.tab-bar {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 24px;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
}

.tab-btn.active {
  color: #ff6600;
  border-bottom-color: #ff6600;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-head h3 {
  margin: 0;
  font-size: 16px;
  color: #1e293b;
}

.btn-primary {
  background: #ff6600;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.category-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cat-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
}

.cat-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.cat-icon {
  font-size: 32px;
}

.cat-info h4 {
  margin: 0 0 2px 0;
  font-size: 16px;
  color: #0f172a;
}

.cat-en {
  font-size: 12px;
  color: #64748b;
  display: block;
}

.cat-code {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}

.subcategories-box {
  background: #f8fafc;
  border-radius: 6px;
  padding: 10px 14px;
}

.sub-title {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}

.sub-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sub-tag {
  background: white;
  border: 1px solid #cbd5e1;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #334155;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  font-size: 13px;
  text-align: left;
}

.data-table th {
  background: #f8fafc;
  padding: 12px 14px;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
}

.data-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
}

.badge-cat {
  background: #e0f2fe;
  color: #0284c7;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.badge-type {
  background: #f1f5f9;
  color: #334155;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.badge-req {
  background: #fef2f2;
  color: #b91c1c;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.badge-restriction {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.badge-restriction.none { background: #dcfce7; color: #166534; }
.badge-restriction.strategic_goods_permit { background: #fee2e2; color: #991b1b; }

.btn-del {
  background: transparent;
  border: 1px solid #fecaca;
  color: #ef4444;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.guide-text {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 16px;
}

.fx-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.fx-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 18px;
}

.fx-cur {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  display: block;
  margin-bottom: 10px;
}

.fx-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fx-input-wrap label {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.fx-input-wrap input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
}

.fx-unit {
  font-size: 12px;
  color: #475569;
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

.form-checkbox {
  margin-top: 10px;
  font-size: 13px;
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
  .master-data-page {
    padding: 16px 12px;
  }
  .page-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .fx-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .tab-bar {
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
  }
}

@media (max-width: 640px) {
  .fx-grid {
    grid-template-columns: 1fr !important;
  }
  .data-table {
    display: block;
    overflow-x: auto;
  }
  .panel-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .btn-primary {
    width: 100%;
    text-align: center;
  }
}
</style>

