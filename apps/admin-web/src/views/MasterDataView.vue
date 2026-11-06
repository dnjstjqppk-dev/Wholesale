<template>
  <div class="ws-admin-page mdm">
    <div class="admin-head">
      <div>
        <p class="admin-eyebrow">Master Data</p>
        <h1>마스터 데이터·통상 규격 관리</h1>
        <p class="admin-sub">카테고리 트리·필수 속성·HS 관세율·실시간 환율을 전사 통합 관리합니다.</p>
      </div>
      <button class="ws-admin-btn" @click="fetchMasterData"><WsIcon name="refresh" :size="14" /> 데이터 새로고침</button>
    </div>

    <div v-if="toastMessage" class="admin-toast" :class="toastType">
      <WsIcon :name="toastType === 'error' ? 'alert' : 'check'" :size="15" /> {{ toastMessage }}
    </div>

    <div class="ws-admin-tabs">
      <button class="ws-admin-tab" :class="{ 'ws-admin-tab-active': activeTab === 'categories' }" @click="activeTab = 'categories'">
        <WsIcon name="layout" :size="13" /> 카테고리 체계
      </button>
      <button class="ws-admin-tab" :class="{ 'ws-admin-tab-active': activeTab === 'attributes' }" @click="activeTab = 'attributes'">
        <WsIcon name="gear" :size="13" /> 필수 속성
      </button>
      <button class="ws-admin-tab" :class="{ 'ws-admin-tab-active': activeTab === 'tariffs' }" @click="activeTab = 'tariffs'">
        <WsIcon name="file" :size="13" /> HS 관세율
      </button>
      <button class="ws-admin-tab" :class="{ 'ws-admin-tab-active': activeTab === 'fx' }" @click="activeTab = 'fx'">
        <WsIcon name="trend" :size="13" /> 기준 환율
      </button>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton sk-dark" style="height: 200px"></div>
    </div>

    <div v-else>
      <div v-if="activeTab === 'categories'" class="ws-stack">
        <div class="ws-split">
          <h3 class="admin-h">표준 산업군·세부 카테고리 트리</h3>
          <button class="ws-admin-btn ws-admin-btn-primary" @click="showAddCatModal = true"><WsIcon name="plus" :size="13" /> 대분류 추가</button>
        </div>
        <div class="cat-grid">
          <section v-for="cat in masterData.categories" :key="cat.id" class="ws-admin-card">
            <div class="ws-split">
              <div>
                <h4>{{ cat.name }}</h4>
                <p class="ws-small dim">{{ cat.name_en }}</p>
                <p class="ws-small dim ws-figure">ID {{ cat.id }}</p>
              </div>
              <span class="cat-emoji">{{ cat.icon }}</span>
            </div>
            <p class="ws-small dim" style="margin: 12px 0 8px">세부 산업 하위 분류</p>
            <span class="ws-cluster" style="gap: 6px">
              <span v-for="(sub, sIdx) in cat.subcategories" :key="sIdx" class="ws-admin-badge ws-admin-badge-idle">{{ sub }}</span>
            </span>
          </section>
        </div>
      </div>

      <div v-if="activeTab === 'attributes'">
        <div class="ws-split" style="margin-bottom: 12px">
          <h3 class="admin-h">품목 등록 필수 기술 속성</h3>
          <button class="ws-admin-btn ws-admin-btn-primary" @click="showAddAttrModal = true"><WsIcon name="plus" :size="13" /> 속성 추가</button>
        </div>
        <div class="ws-admin-table-wrap">
          <div class="ws-admin-table-scroll">
            <table class="ws-admin-table">
              <thead><tr><th>카테고리</th><th>속성 명칭</th><th>타입</th><th>옵션</th><th>필수</th></tr></thead>
              <tbody>
                <tr v-for="attr in masterData.category_attributes" :key="attr.id">
                  <td><span class="ws-admin-badge ws-admin-badge-info">{{ attr.category_id }}</span></td>
                  <td><b>{{ attr.attribute_name }}</b></td>
                  <td><span class="ws-admin-badge ws-admin-badge-idle">{{ attr.data_type }}</span></td>
                  <td class="ws-small dim">{{ attr.options ? attr.options.join(', ') : '자유 입력' }}</td>
                  <td><span v-if="attr.is_required" class="ws-admin-badge ws-admin-badge-warn">필수</span><span v-else class="ws-small dim">선택</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'tariffs'">
        <div class="ws-split" style="margin-bottom: 12px">
          <h3 class="admin-h">HS Code·기본 관세율표</h3>
          <button class="ws-admin-btn ws-admin-btn-primary" @click="showAddTariffModal = true"><WsIcon name="plus" :size="13" /> HS Code 등록</button>
        </div>
        <div class="ws-admin-table-wrap">
          <div class="ws-admin-table-scroll">
            <table class="ws-admin-table">
              <thead><tr><th>HS Code</th><th>품명·규격</th><th>관세율</th><th>부가세</th><th>수출 통제</th><th></th></tr></thead>
              <tbody>
                <tr v-for="t in masterData.customs_tariffs" :key="t.id">
                  <td class="ws-figure hs">{{ t.hs_code }}</td>
                  <td>{{ t.description }}</td>
                  <td><b class="ws-figure">{{ t.duty_rate_percent }}%</b></td>
                  <td>{{ t.vat_rate_percent }}%</td>
                  <td>
                    <span class="ws-admin-badge" :class="t.export_restriction === 'NONE' ? 'ws-admin-badge-ok' : 'ws-admin-badge-bad'">{{ t.export_restriction }}</span>
                  </td>
                  <td><button class="ws-admin-btn ws-admin-btn-danger" @click="deleteTariff(t.id)">삭제</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'fx'">
        <div class="ws-split" style="margin-bottom: 12px">
          <div>
            <h3 class="admin-h">복수 통화 기준 환율</h3>
            <p class="ws-small dim" style="margin: 4px 0 0">기준 USD · 최종 갱신 {{ formatDate(masterData.fx_rates?.updated_at) }}</p>
          </div>
          <button class="ws-admin-btn ws-admin-btn-primary" :disabled="savingFx" @click="saveFxRates">
            {{ savingFx ? '저장 중...' : '✓ 환율 저장' }}
          </button>
        </div>
        <div class="fx-grid">
          <div v-for="(rate, cur) in fxRatesForm" :key="cur" class="ws-admin-card fx-card">
            <b class="ws-figure">{{ cur }}</b>
            <label class="ws-small dim">1 USD =</label>
            <input v-model.number="fxRatesForm[cur]" type="number" step="0.01" class="ws-admin-input" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddCatModal" class="ws-modal-backdrop" @click.self="showAddCatModal = false">
      <div class="ws-modal" role="dialog" aria-modal="true">
        <div class="ws-modal-head">
          <h3>신규 표준 카테고리</h3>
          <button class="ws-icon-btn" aria-label="닫기" @click="showAddCatModal = false"><WsIcon name="x" :size="15" /></button>
        </div>
        <form @submit.prevent="submitCategory">
          <div class="ws-modal-body">
            <div class="ws-field"><label>카테고리 코드</label><input v-model="newCatForm.id" type="text" placeholder="예: CAT-AUT" required /></div>
            <div class="ws-field"><label>국문명</label><input v-model="newCatForm.name" type="text" placeholder="예: 자동차 & 모빌리티 부품" required /></div>
            <div class="ws-field"><label>영문명</label><input v-model="newCatForm.name_en" type="text" placeholder="Automotive & Mobility Parts" required /></div>
            <div class="ws-field" style="margin-bottom: 0"><label>아이콘</label><input v-model="newCatForm.icon" type="text" required /></div>
          </div>
          <div class="ws-modal-foot">
            <button type="button" class="ws-btn ws-btn-secondary" @click="showAddCatModal = false">취소</button>
            <button type="submit" class="ws-btn ws-btn-primary">등록하기</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showAddAttrModal" class="ws-modal-backdrop" @click.self="showAddAttrModal = false">
      <div class="ws-modal" role="dialog" aria-modal="true">
        <div class="ws-modal-head">
          <h3>신규 필수 속성 정의</h3>
          <button class="ws-icon-btn" aria-label="닫기" @click="showAddAttrModal = false"><WsIcon name="x" :size="15" /></button>
        </div>
        <form @submit.prevent="submitAttribute">
          <div class="ws-modal-body">
            <div class="ws-field">
              <label>적용 카테고리</label>
              <select v-model="newAttrForm.category_id">
                <option v-for="c in masterData.categories" :key="c.id" :value="c.id">{{ c.id }} — {{ c.name.split(' (')[0] }}</option>
              </select>
            </div>
            <div class="ws-field"><label>속성 명칭</label><input v-model="newAttrForm.attribute_name" type="text" placeholder="예: 절연 내전압" required /></div>
            <div class="ws-field">
              <label>데이터 타입</label>
              <select v-model="newAttrForm.data_type">
                <option value="STRING">자유 텍스트 (STRING)</option>
                <option value="NUMBER">숫자 규격 (NUMBER)</option>
                <option value="SELECT">선택형 드롭다운 (SELECT)</option>
              </select>
            </div>
            <label class="ws-check" style="margin-bottom: 0"><input v-model="newAttrForm.is_required" type="checkbox" /> 상품 등록 시 필수 입력 항목으로 지정</label>
          </div>
          <div class="ws-modal-foot">
            <button type="button" class="ws-btn ws-btn-secondary" @click="showAddAttrModal = false">취소</button>
            <button type="submit" class="ws-btn ws-btn-primary">속성 추가</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showAddTariffModal" class="ws-modal-backdrop" @click.self="showAddTariffModal = false">
      <div class="ws-modal" role="dialog" aria-modal="true">
        <div class="ws-modal-head">
          <h3>신규 HS Code 등록</h3>
          <button class="ws-icon-btn" aria-label="닫기" @click="showAddTariffModal = false"><WsIcon name="x" :size="15" /></button>
        </div>
        <form @submit.prevent="submitTariff">
          <div class="ws-modal-body">
            <div class="ws-field"><label>HS Code (10자리)</label><input v-model="newTariffForm.hs_code" type="text" placeholder="예: 8541.40.2000" required /></div>
            <div class="ws-field"><label>품명·기술 설명</label><input v-model="newTariffForm.description" type="text" required /></div>
            <div class="ws-grid-2">
              <div class="ws-field"><label>기본 관세율 (%)</label><input v-model.number="newTariffForm.duty_rate_percent" type="number" step="0.1" required /></div>
              <div class="ws-field"><label>부가세율 (%)</label><input v-model.number="newTariffForm.vat_rate_percent" type="number" step="0.1" required /></div>
            </div>
            <div class="ws-field" style="margin-bottom: 0">
              <label>수출입 통제 구분</label>
              <select v-model="newTariffForm.export_restriction">
                <option value="NONE">일반 품목 (NONE)</option>
                <option value="STRATEGIC_GOODS_PERMIT">전략물자 허가 필요</option>
                <option value="RESTRICTED_CHEMICAL">유해화학물질 승인</option>
              </select>
            </div>
          </div>
          <div class="ws-modal-foot">
            <button type="button" class="ws-btn ws-btn-secondary" @click="showAddTariffModal = false">취소</button>
            <button type="submit" class="ws-btn ws-btn-primary">HS Code 등록</button>
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
.mdm { display: flex; flex-direction: column; gap: 18px; }
.admin-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.admin-head h1 { margin: 0 0 6px; font-size: 24px; font-weight: 800; letter-spacing: -0.015em; }
.admin-eyebrow { margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ws-admin-accent); }
.admin-sub { margin: 0; font-size: 13px; color: var(--ws-admin-dim); }
.admin-toast { display: flex; gap: 8px; align-items: center; border-radius: 10px; padding: 12px 16px; font-size: 13px; font-weight: 600; }
.admin-toast.success { background: rgb(34 197 94 / 0.12); border: 1px solid rgb(34 197 94 / 0.4); color: #86efac; }
.admin-toast.error { background: rgb(239 68 68 / 0.12); border: 1px solid rgb(239 68 68 / 0.4); color: #fca5a5; }
.admin-h { color: #fff; font-size: 15px; margin: 0; }
.dim { color: var(--ws-admin-dim); }
.cat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.cat-grid h4 { margin: 0 0 2px; font-size: 15px; color: #fff; }
.cat-grid p { margin: 0; }
.cat-emoji { font-size: 30px; }
.hs { color: var(--ws-admin-link); font-weight: 800; }
.fx-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.fx-card { display: flex; flex-direction: column; gap: 6px; }
.fx-card b { font-size: 16px; color: #fff; }
.sk-dark { background: var(--ws-admin-panel); }
@media (max-width: 900px) {
  .cat-grid { grid-template-columns: minmax(0, 1fr); }
  .fx-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
