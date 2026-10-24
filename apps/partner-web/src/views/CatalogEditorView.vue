<template>
  <div class="catalog-editor">
    <div class="head-row">
      <div>
        <h2>도매 상품 카탈로그 CRUD 및 수량 구간별 단가 관리</h2>
        <p class="subtitle">자사 도매 상품 조회·신규 등록·수정·삭제 및 반개구간([min, max)) 수량별 단가를 관리합니다.</p>
      </div>
      <button v-if="editingId" class="btn-new" @click="resetForm">+ 신규 상품 등록 모드로 전환</button>
    </div>

    <!-- Registered Products Table -->
    <div class="list-card">
      <div class="list-head">
        <h3>📋 등록된 도매 상품 목록 ({{ myListings.length }}건)</h3>
        <input v-model="searchFilter" type="text" placeholder="상품명 또는 카테고리 검색..." class="filter-input" />
      </div>
      <div class="table-scroll">
        <table class="prod-table">
          <thead>
            <tr>
              <th>썸네일</th>
              <th>상품명</th>
              <th>카테고리</th>
              <th>MOQ / 단위</th>
              <th>기준 단가(USD)</th>
              <th>상태</th>
              <th>관리 작업</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredMyListings" :key="item.id">
              <td><img :src="item.thumbnail || item.images?.[0]" class="mini-thumb" alt="thumb" /></td>
              <td class="title-cell">{{ item.title }}</td>
              <td>{{ item.category }}</td>
              <td>{{ item.moq }} {{ item.unit }}</td>
              <td class="price-cell">${{ Number(item.price_tiers?.[0]?.unit_price || 0).toFixed(2) }}</td>
              <td><span class="st-pill" :class="(item.status || 'PUBLISHED').toLowerCase()">{{ item.status || 'PUBLISHED' }}</span></td>
              <td class="actions-cell">
                <button class="btn-sm edit" @click="loadForEdit(item)">수정</button>
                <button class="btn-sm del" @click="deleteListing(item)">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Form -->
    <form class="form-card" @submit.prevent="handleSave">
      <h3>{{ editingId ? `✏️ 기존 상품 수정 (ID: ${editingId})` : '➕ 신규 도매 상품 및 구간단가 등록' }}</h3>

      <div class="section">
        <h4>1. 기본 상품 정보 및 카테고리</h4>
        <div class="form-grid-3">
          <div class="field span-2">
            <label>상품명 (국문/영문 표준 규격 포함)</label>
            <input v-model="title" type="text" required />
          </div>
          <div class="field">
            <label>대분류 카테고리</label>
            <select v-model="category">
              <option value="CAT-IND">CAT-IND (산업기계 & 부품)</option>
              <option value="CAT-ELE">CAT-ELE (전기·전자 & 반도체)</option>
              <option value="CAT-PKG">CAT-PKG (친환경 패키징 & 용기)</option>
              <option value="CAT-HOM">CAT-HOM (생활·주방 & 소비재)</option>
              <option value="CAT-CHM">CAT-CHM (화학·소재 & 원부자재)</option>
            </select>
          </div>
          <div class="field">
            <label>소분류명</label>
            <input v-model="subCategory" type="text" placeholder="예: CNC 가공 부품" />
          </div>
          <div class="field">
            <label>인도 조건 (Incoterms® 2020)</label>
            <select v-model="incoterms">
              <option value="FOB Busan Port">FOB Busan Port</option>
              <option value="FOB Incheon">FOB Incheon</option>
              <option value="CIF Los Angeles">CIF Los Angeles</option>
              <option value="EXW Factory">EXW Factory</option>
            </select>
          </div>
          <div class="field">
            <label>대표 상품 이미지 URL</label>
            <input v-model="imageUrl" type="url" required />
          </div>
        </div>
      </div>

      <div class="section">
        <h4>2. 발주 수량 제약 (MOQ & Step Enforcement)</h4>
        <div class="form-grid-4">
          <div class="field">
            <label>최소 주문 수량 (MOQ)</label>
            <input v-model.number="moq" type="number" min="1" required />
          </div>
          <div class="field">
            <label>주문 증가 단위 (Step)</label>
            <input v-model.number="step" type="number" min="1" required />
          </div>
          <div class="field">
            <label>측정 단위 (Unit)</label>
            <select v-model="unit">
              <option value="pcs">pcs (개)</option>
              <option value="boxes">boxes (박스)</option>
              <option value="kg">kg (킬로그램)</option>
              <option value="sets">sets (세트)</option>
            </select>
          </div>
          <div class="field">
            <label>표준 생산 리드타임 (일)</label>
            <input v-model.number="leadTime" type="number" min="1" required />
          </div>
        </div>
      </div>

      <div class="section">
        <h4>3. 기술 사양 (Technical Specifications)</h4>
        <div class="specs-list">
          <div v-for="(sp, idx) in specifications" :key="idx" class="spec-row">
            <input v-model="sp.name" type="text" placeholder="항목명 (예: 재질, 공차, 인증)" />
            <input v-model="sp.value" type="text" placeholder="사양값 (예: SUS304, ±0.02mm, ISO 9001)" />
            <button type="button" class="btn-del-row" @click="specifications.splice(idx, 1)">✕</button>
          </div>
          <button type="button" class="btn-add-tier" @click="specifications.push({ name: '', value: '' })">
            + 기술 사양 항목 추가
          </button>
        </div>
      </div>

      <div class="section">
        <h4>4. 수량 구간별 차등 단가표 (Tiered Pricing — 반개구간 [min, max))</h4>
        <table class="tier-editor-table">
          <thead>
            <tr>
              <th>최소 수량 (Min Qty)</th>
              <th>최대 수량 미만 (Max Qty, 무제한은 비움)</th>
              <th>구간 단가 (USD)</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(t, idx) in tiers" :key="idx">
              <td><input v-model.number="t.min" type="number" min="1" required /></td>
              <td><input v-model.number="t.max" type="number" placeholder="무제한 (∞)" /></td>
              <td><input v-model="t.price" type="text" required /></td>
              <td><button type="button" class="btn-del-row" @click="tiers.splice(idx, 1)">삭제</button></td>
            </tr>
          </tbody>
        </table>
        <button type="button" class="btn-add-tier" @click="addTier">+ 수량 할인 구간 추가</button>
      </div>

      <p v-if="errorMsg" class="error-banner">⚠️ {{ errorMsg }}</p>

      <div class="actions">
        <button type="submit" class="btn-save" :disabled="submitting">
          {{ submitting ? '서버 저장 중...' : (editingId ? '상품 정보 및 단가 수정 저장' : '신규 도매 상품 게시 및 단가표 적용') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { apiRequest } from '../api';

const myListings = ref<any[]>([]);
const searchFilter = ref('');
const editingId = ref<string | null>(null);

const title = ref('산업용 고정밀 CNC 알루미늄 방열판 하우징 벌크팩');
const category = ref('CAT-IND');
const subCategory = ref('CNC 머시닝 & 금속가공');
const incoterms = ref('FOB Busan Port');
const imageUrl = ref('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80');
const moq = ref(100);
const step = ref(10);
const unit = ref('pcs');
const leadTime = ref(14);
const submitting = ref(false);
const errorMsg = ref('');

const specifications = ref([
  { name: '재질 (Material)', value: 'Aluminum 6061-T6 / SUS304' },
  { name: '가공 정밀도 (Tolerance)', value: '±0.01 mm (5-Axis CNC)' },
  { name: '품질 인증 (Certification)', value: 'ISO 9001:2015, RoHS 2.0' },
]);

const tiers = ref<Array<{ min: number; max: number | null; price: string }>>([
  { min: 100, max: 500, price: '4.80' },
  { min: 500, max: 2000, price: '4.20' },
  { min: 2000, max: null, price: '3.60' },
]);

const filteredMyListings = computed(() => {
  if (!searchFilter.value.trim()) return myListings.value;
  const q = searchFilter.value.toLowerCase();
  return myListings.value.filter(i =>
    i.title?.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q)
  );
});

async function loadListings() {
  try {
    const res = await apiRequest('/catalog/listings');
    myListings.value = res.items || [];
  } catch (e) {
    console.warn('Failed to load listings:', e);
  }
}

onMounted(() => {
  loadListings();
});

function addTier() {
  const last = tiers.value[tiers.value.length - 1];
  const nextMin = last ? (last.max || last.min * 2) : 100;
  if (last && !last.max) last.max = nextMin;
  tiers.value.push({ min: nextMin, max: null, price: '3.00' });
}

function resetForm() {
  editingId.value = null;
  title.value = '';
  category.value = 'CAT-IND';
  subCategory.value = '산업 정밀 부품';
  moq.value = 100;
  step.value = 10;
  unit.value = 'pcs';
  leadTime.value = 14;
  tiers.value = [
    { min: 100, max: 500, price: '5.00' },
    { min: 500, max: null, price: '4.20' },
  ];
}

function loadForEdit(item: any) {
  editingId.value = item.id;
  title.value = item.title;
  category.value = item.category || 'CAT-IND';
  subCategory.value = item.sub_category || '';
  incoterms.value = item.incoterms || 'FOB Busan Port';
  imageUrl.value = item.thumbnail || item.images?.[0] || '';
  moq.value = Number(item.moq) || 100;
  step.value = Number(item.quantity_step) || 10;
  unit.value = item.unit || 'pcs';
  leadTime.value = Number(item.lead_time_days) || 14;
  if (item.specifications && item.specifications.length > 0) {
    specifications.value = item.specifications.map((s: any) => ({ ...s }));
  }
  if (item.price_tiers && item.price_tiers.length > 0) {
    tiers.value = item.price_tiers.map((t: any) => ({
      min: Number(t.min_quantity),
      max: t.max_quantity ? Number(t.max_quantity) : null,
      price: String(Number(t.unit_price).toFixed(2)),
    }));
  }
  window.scrollTo({ top: 400, behavior: 'smooth' });
}

async function deleteListing(item: any) {
  try {
    await apiRequest(`/catalog/listings/${item.id}`, { method: 'DELETE' });
    myListings.value = myListings.value.filter(i => i.id !== item.id);
    if (editingId.value === item.id) resetForm();
  } catch (err: any) {
    alert(`삭제 실패: ${err.message}`);
  }
}

async function handleSave() {
  errorMsg.value = '';
  for (let i = 0; i < tiers.value.length - 1; i++) {
    const cur = tiers.value[i];
    const next = tiers.value[i + 1];
    if (cur.max !== null && cur.max > next.min) {
      errorMsg.value = `구간 #${i + 1}의 최대수량(${cur.max})이 구간 #${i + 2}의 최소수량(${next.min})과 중첩됩니다.`;
      return;
    }
  }

  submitting.value = true;
  const payload = {
    title: title.value,
    category: category.value,
    sub_category: subCategory.value,
    incoterms: incoterms.value,
    images: [imageUrl.value],
    moq: String(moq.value),
    quantity_step: String(step.value),
    unit: unit.value,
    lead_time_days: leadTime.value,
    specifications: specifications.value.filter(s => s.name && s.value),
    price_tiers: tiers.value.map(t => ({
      min_quantity: String(t.min),
      max_quantity: t.max ? String(t.max) : null,
      unit_price: parseFloat(t.price).toFixed(6),
      currency: 'USD',
    })),
  };

  try {
    if (editingId.value) {
      const updated = await apiRequest(`/catalog/listings/${editingId.value}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const idx = myListings.value.findIndex(i => i.id === editingId.value);
      if (idx >= 0) myListings.value[idx] = updated;
      alert(`상품 '${updated.title}' 정보가 성공적으로 수정되었습니다.`);
    } else {
      const created = await apiRequest('/catalog/listings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      myListings.value.unshift(created);
      alert(`신규 도매 상품 '${created.title}'이(가) 등록되었습니다.`);
    }
  } catch (err: any) {
    errorMsg.value = err.message || '상품 저장 중 오류가 발생했습니다.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.catalog-editor { max-width: 1080px; display: flex; flex-direction: column; gap: 20px; }
.head-row { display: flex; justify-content: space-between; align-items: center; }
h2 { margin: 0 0 4px 0; font-size: 20px; color: #172B4D; }
.subtitle { color: #64748B; font-size: 13px; margin: 0; }
.btn-new { background: #1E293B; color: #FFF; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 12px; }

.list-card, .form-card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 22px; }
.list-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.list-head h3, .form-card h3 { margin: 0; font-size: 16px; color: #172B4D; }
.filter-input { border: 1px solid #CBD5E1; border-radius: 6px; padding: 6px 12px; font-size: 12px; width: 240px; }
.table-scroll { max-height: 280px; overflow-y: auto; border: 1px solid #E2E8F0; border-radius: 6px; }
.prod-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.prod-table th, .prod-table td { border-bottom: 1px solid #F1F5F9; padding: 8px 10px; text-align: left; }
.prod-table th { background: #F8FAFC; color: #475569; position: sticky; top: 0; }
.mini-thumb { width: 36px; height: 36px; border-radius: 4px; object-fit: cover; }
.title-cell { font-weight: 700; color: #0F172A; max-width: 280px; }
.price-cell { font-weight: 700; color: #C2410C; }
.st-pill { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; background: #DCFCE7; color: #15803D; }
.actions-cell { display: flex; gap: 6px; }
.btn-sm { border: 1px solid #CBD5E1; background: #FFF; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; }
.btn-sm.edit { color: #2563EB; border-color: #93C5FD; }
.btn-sm.del { color: #DC2626; border-color: #FCA5A5; }

.section { margin-top: 20px; border-bottom: 1px solid #F1F5F9; padding-bottom: 18px; }
.section h4 { margin: 0 0 12px 0; font-size: 14px; color: #172B4D; }
.form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.form-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.field.span-2 { grid-column: span 2; }
.field label { display: block; font-size: 12px; font-weight: 600; color: #42526E; margin-bottom: 4px; }
.field input, .field select { width: 100%; padding: 8px 10px; border: 1px solid #D8E0EB; border-radius: 4px; font-size: 13px; box-sizing: border-box; }

.specs-list { display: flex; flex-direction: column; gap: 8px; }
.spec-row { display: grid; grid-template-columns: 1fr 2fr auto; gap: 8px; }
.spec-row input { padding: 7px 10px; border: 1px solid #D8E0EB; border-radius: 4px; font-size: 13px; }
.btn-del-row { background: #FEE2E2; color: #B91C1C; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-weight: 700; }

.tier-editor-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 10px; }
.tier-editor-table th, .tier-editor-table td { border: 1px solid #D8E0EB; padding: 8px; text-align: left; }
.tier-editor-table th { background: #F8FAFC; font-size: 12px; }
.tier-editor-table input { width: 100%; padding: 6px; border: 1px solid #CBD5E1; border-radius: 4px; box-sizing: border-box; }
.btn-add-tier { background: #F1F5F9; border: 1px dashed #94A3B8; color: #334155; padding: 7px 14px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; }
.error-banner { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; padding: 10px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; margin-top: 12px; }
.actions { margin-top: 16px; }
.btn-save { background: #C2410C; color: #FFF; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 700; font-size: 14px; cursor: pointer; }
</style>
