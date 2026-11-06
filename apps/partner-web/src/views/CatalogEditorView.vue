<template>
  <div class="ws-page ws-page-wide">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Catalog Manager</p>
      <div class="ws-page-head-row">
        <h1 class="ws-page-title">상품·구간단가 관리</h1>
        <div class="ws-page-actions">
          <button v-if="editingId" class="ws-btn ws-btn-secondary ws-btn-sm" @click="resetForm"><WsIcon name="plus" :size="13" /> 신규 등록 모드</button>
        </div>
      </div>
      <p class="ws-page-sub">자사 도매 상품 조회·등록·수정·삭제와 반개구간([min, max)) 수량별 단가 관리.</p>
    </div>

    <section class="ws-card ws-card-pad-sm">
      <div class="ws-card-head">
        <h3>등록된 도매 상품 ({{ myListings.length }}건)</h3>
        <span class="ws-search" style="width: 280px">
          <span class="ws-search-icon"><WsIcon name="search" :size="15" /></span>
          <input v-model="searchFilter" type="text" class="ws-input" placeholder="상품명·카테고리 검색..." />
        </span>
      </div>
      <div class="ws-table-wrap">
        <div class="ws-table-scroll">
          <table class="ws-table">
            <thead><tr><th></th><th>상품명</th><th>카테고리</th><th>MOQ / 단위</th><th class="ws-num">기준 단가</th><th>상태</th><th>관리</th></tr></thead>
            <tbody>
              <tr v-for="item in filteredMyListings" :key="item.id">
                <td><img :src="item.thumbnail || item.images?.[0]" class="row-thumb" alt="thumb" /></td>
                <td class="ws-cell-main">{{ item.title }}</td>
                <td class="ws-cell-sub">{{ item.category }}</td>
                <td class="ws-figure">{{ item.moq }} {{ item.unit }}</td>
                <td class="ws-num"><b class="ws-price-dark ws-figure">${{ Number(item.price_tiers?.[0]?.unit_price || 0).toFixed(2) }}</b></td>
                <td><span class="ws-badge ws-badge-info">{{ item.status || 'PUBLISHED' }}</span></td>
                <td>
                  <span class="ws-cluster" style="gap: 6px">
                    <button class="ws-btn ws-btn-secondary ws-btn-sm" @click="loadForEdit(item)">수정</button>
                    <button class="ws-btn ws-btn-ghost ws-btn-sm danger-link" @click="deleteListing(item)">삭제</button>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <form class="ws-card editor" @submit.prevent="handleSave">
      <div class="ws-card-head">
        <h3>
          <WsIcon v-if="editingId" name="pencil" :size="15" class="h-ico" />
          <WsIcon v-else name="plus" :size="15" class="h-ico" />
          {{ editingId ? `상품 수정 · ${editingId}` : '신규 도매 상품·구간단가 등록' }}
        </h3>
      </div>

      <p class="sec-cap">1 · 기본 상품 정보·카테고리</p>
      <div class="ws-grid-3">
        <div class="ws-field span-2">
          <label>상품명 (국문/영문 규격 포함)</label>
          <input v-model="title" type="text" required />
        </div>
        <div class="ws-field">
          <label>대분류 카테고리</label>
          <select v-model="category">
            <option value="CAT-IND">CAT-IND (산업기계 & 부품)</option>
            <option value="CAT-ELE">CAT-ELE (전기·전자 & 반도체)</option>
            <option value="CAT-PKG">CAT-PKG (친환경 패키징 & 용기)</option>
            <option value="CAT-HOM">CAT-HOM (생활·주방 & 소비재)</option>
            <option value="CAT-CHM">CAT-CHM (화학·소재 & 원부자재)</option>
          </select>
        </div>
        <div class="ws-field">
          <label>소분류명</label>
          <input v-model="subCategory" type="text" placeholder="예: CNC 가공 부품" />
        </div>
        <div class="ws-field">
          <label>인도 조건 (Incoterms® 2020)</label>
          <select v-model="incoterms">
            <option value="FOB Busan Port">FOB Busan Port</option>
            <option value="FOB Incheon">FOB Incheon</option>
            <option value="CIF Los Angeles">CIF Los Angeles</option>
            <option value="EXW Factory">EXW Factory</option>
          </select>
        </div>
        <div class="ws-field">
          <label>대표 상품 이미지 URL</label>
          <input v-model="imageUrl" type="url" required />
        </div>
      </div>

      <p class="sec-cap">2 · 발주 수량 제약 (MOQ·Step)</p>
      <div class="ws-grid-4">
        <div class="ws-field"><label>MOQ</label><input v-model.number="moq" type="number" min="1" required /></div>
        <div class="ws-field"><label>주문 증가 단위</label><input v-model.number="step" type="number" min="1" required /></div>
        <div class="ws-field">
          <label>측정 단위</label>
          <select v-model="unit">
            <option value="pcs">pcs (개)</option>
            <option value="boxes">boxes (박스)</option>
            <option value="kg">kg (킬로그램)</option>
            <option value="sets">sets (세트)</option>
          </select>
        </div>
        <div class="ws-field"><label>표준 리드타임 (일)</label><input v-model.number="leadTime" type="number" min="1" required /></div>
      </div>

      <p class="sec-cap">3 · 기술 사양</p>
      <div class="spec-row" v-for="(sp, idx) in specifications" :key="idx">
        <input v-model="sp.name" type="text" class="ws-input" placeholder="항목명 (예: 재질, 공차, 인증)" />
        <input v-model="sp.value" type="text" class="ws-input" placeholder="사양값 (예: SUS304, ±0.02mm, ISO 9001)" />
        <button type="button" class="ws-icon-btn" aria-label="행 삭제" @click="specifications.splice(idx, 1)"><WsIcon name="x" :size="14" /></button>
      </div>
      <button type="button" class="ws-btn ws-btn-ghost ws-btn-sm" @click="specifications.push({ name: '', value: '' })"><WsIcon name="plus" :size="13" /> 사양 항목 추가</button>

      <p class="sec-cap">4 · 수량 구간별 차등 단가 [min, max)</p>
      <div class="ws-table-wrap">
        <table class="ws-table">
          <thead><tr><th>최소 수량</th><th>최대 수량 미만 (무제한은 비움)</th><th>구간 단가 (USD)</th><th></th></tr></thead>
          <tbody>
            <tr v-for="(t, idx) in tiers" :key="idx">
              <td><input v-model.number="t.min" type="number" min="1" class="ws-input" required /></td>
              <td><input v-model.number="t.max" type="number" class="ws-input" placeholder="무제한 (∞)" /></td>
              <td><input v-model="t.price" type="text" class="ws-input ws-figure" required /></td>
              <td><button type="button" class="ws-btn ws-btn-ghost ws-btn-sm danger-link" @click="tiers.splice(idx, 1)">삭제</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <button type="button" class="ws-btn ws-btn-ghost ws-btn-sm" style="margin-top: 8px" @click="addTier"><WsIcon name="plus" :size="13" /> 수량 할인 구간 추가</button>

      <div v-if="errorMsg" class="ws-banner ws-banner-danger">
        <WsIcon name="alert" :size="16" />
        <span>{{ errorMsg }}</span>
      </div>

      <button type="submit" class="ws-btn ws-btn-accent ws-btn-block ws-btn-lg editor-save" :disabled="submitting">
        <span v-if="submitting" class="ws-spinner"></span>
        {{ submitting ? '서버 저장 중...' : (editingId ? '상품 정보·단가 수정 저장' : '신규 상품 게시·단가표 적용') }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

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
.row-thumb { width: 44px; height: 44px; object-fit: cover; border-radius: 6px; background: var(--ws-surface-muted); }
.danger-link { color: var(--ws-danger); }
.danger-link:hover { background: var(--ws-danger-bg); color: var(--ws-danger); }
.editor { margin-top: 16px; }
.h-ico { color: var(--ws-brand); vertical-align: -2px; }
.sec-cap { margin: 20px 0 12px; font-size: 13px; font-weight: 800; color: var(--ws-text); padding-top: 16px; border-top: 1px solid var(--ws-border-subtle); }
.sec-cap:first-of-type { border-top: 0; padding-top: 0; margin-top: 0; }
.span-2 { grid-column: span 2; }
.spec-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; margin-bottom: 8px; }
.editor .ws-field { margin-bottom: 12px; }
.editor-save { margin-top: 16px; }
@media (max-width: 640px) {
  .span-2 { grid-column: span 1; }
  .spec-row { grid-template-columns: minmax(0, 1fr); }
}
</style>
