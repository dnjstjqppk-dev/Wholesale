<template>
  <div class="catalog-editor-page">
    <div class="page-head">
      <h2>도매 상품 및 수량 구간 단가(Tiered Pricing) 편집</h2>
      <button class="btn-save" @click="handleSave">저장 및 심사 요청</button>
    </div>

    <div class="editor-grid">
      <div class="card basic-info">
        <h3>기본 상품 정보</h3>
        <div class="field">
          <label>상품명 (Listing Title)</label>
          <input v-model="form.title" type="text" />
        </div>
        <div class="field-row">
          <div class="field flex-1">
            <label>최소 발주 수량 (MOQ)</label>
            <input v-model.number="form.moq" type="number" />
          </div>
          <div class="field flex-1">
            <label>발주 단위 (Step)</label>
            <input v-model.number="form.step" type="number" />
          </div>
          <div class="field flex-1">
            <label>수량 단위</label>
            <input v-model="form.unit" type="text" />
          </div>
        </div>
        <div class="field">
          <label>표준 제조/납기 소요일수 (Lead Time)</label>
          <input v-model.number="form.leadTimeDays" type="number" />
        </div>
      </div>

      <div class="card tier-info">
        <div class="tier-head">
          <h3>수량 구간별 단가표 (반개구간 [Min, Max) 엄격 적용)</h3>
          <button class="btn-add-tier" @click="addTier">+ 구간 추가</button>
        </div>
        <div class="tier-table">
          <div class="t-row t-head">
            <span>최소 수량 (이상)</span>
            <span>최대 수량 (미만)</span>
            <span>단가 (USD)</span>
            <span>삭제</span>
          </div>
          <div v-for="(tier, idx) in form.tiers" :key="idx" class="t-row">
            <input v-model.number="tier.min" type="number" />
            <input v-model.number="tier.max" type="number" :placeholder="idx === form.tiers.length - 1 ? '무제한 (Infinity)' : ''" />
            <input v-model="tier.price" type="text" />
            <button class="btn-del" @click="removeTier(idx)">×</button>
          </div>
        </div>
        <p class="tier-tip">※ 부동소수점 오차 방지를 위해 통화는 <code>numeric(20,6)</code>로 직렬화되어 DB에 저장됩니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const form = ref({
  title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩',
  moq: 100,
  step: 10,
  unit: 'pcs',
  leadTimeDays: 14,
  tiers: [
    { min: 100, max: 500, price: '5.50' },
    { min: 500, max: 1000, price: '4.80' },
    { min: 1000, max: null, price: '4.20' },
  ],
});

function addTier() {
  form.value.tiers.push({ min: 2000, max: null, price: '3.90' });
}

function removeTier(idx: number) {
  if (form.value.tiers.length > 1) {
    form.value.tiers.splice(idx, 1);
  }
}

function handleSave() {
  alert('구간 단가 및 발주 조건이 성공적으로 저장되었습니다.');
}
</script>

<style scoped>
.catalog-editor-page { max-width: 1000px; margin: 0 auto; }
.page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-head h2 { margin: 0; font-size: 20px; color: #172B4D; }
.btn-save { background: #C2410C; color: #FFF; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; }
.editor-grid { display: flex; flex-direction: column; gap: 24px; }
.card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 24px; }
.card h3 { margin: 0 0 16px 0; font-size: 16px; color: #172B4D; }
.field { margin-bottom: 16px; }
.field label { display: block; font-size: 13px; font-weight: 600; color: #42526E; margin-bottom: 6px; }
.field input { width: 100%; padding: 8px 12px; border: 1px solid #D8E0EB; border-radius: 4px; box-sizing: border-box; }
.field-row { display: flex; gap: 16px; }
.flex-1 { flex: 1; }
.tier-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.btn-add-tier { background: #F1F5F9; border: 1px solid #CBD5E1; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; }
.tier-table { display: flex; flex-direction: column; gap: 8px; }
.t-row { display: grid; grid-template-columns: 2fr 2fr 2fr 40px; gap: 12px; align-items: center; }
.t-head { font-weight: 700; font-size: 12px; color: #64748B; }
.t-row input { padding: 8px; border: 1px solid #D8E0EB; border-radius: 4px; }
.btn-del { background: #FEE2E2; color: #DC2626; border: none; border-radius: 4px; width: 32px; height: 32px; cursor: pointer; font-size: 16px; font-weight: 700; }
.tier-tip { font-size: 12px; color: #64748B; margin-top: 14px; }
</style>

