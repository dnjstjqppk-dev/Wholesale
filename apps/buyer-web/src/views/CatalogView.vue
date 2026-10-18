<template>
  <div class="catalog-page">
    <div class="filter-sidebar">
      <h3>도매 필터</h3>
      <div class="filter-group">
        <label><input v-model="verifiedOnly" type="checkbox" /> 인증 공급사만 보기</label>
      </div>
      <div class="filter-group">
        <label class="title">최소 발주 수량(MOQ)</label>
        <select v-model="selectedMOQ">
          <option value="all">전체</option>
          <option value="100">100개 이하</option>
          <option value="500">500개 이하</option>
          <option value="1000">1,000개 이상 대량</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="title">카테고리</label>
        <div class="cat-list">
          <span class="cat-item active">전체 기계/소재/가공</span>
          <span class="cat-item">산업용 금속 부품</span>
          <span class="cat-item">정밀 금형/사출</span>
          <span class="cat-item">전자부품 벌크팩</span>
        </div>
      </div>
    </div>

    <div class="catalog-list">
      <div class="list-header">
        <h2>산업용 도매 카탈로그 ({{ filteredItems.length }}건)</h2>
        <span class="notice">※ 수량 구간별 단가(Tiered Pricing)가 자동 적용됩니다.</span>
      </div>

      <div class="grid">
        <div v-for="item in filteredItems" :key="item.id" class="product-card">
          <div class="card-img-placeholder">
            <span class="badge">{{ item.category }}</span>
          </div>
          <div class="card-body">
            <div class="supplier-info">
              <span class="sup-name">{{ item.supplier_name }}</span>
              <span v-if="item.is_verified_supplier" class="verified-tag">✓ Verified</span>
            </div>
            <router-link :to="`/${$route.params.locale || 'ko'}/${$route.params.currency || 'KRW'}/products/${item.id}`" class="item-title">
              {{ item.title }}
            </router-link>
            <div class="tier-preview">
              <div class="tier-row" v-for="(t, idx) in item.price_tiers" :key="idx">
                <span class="qty">{{ t.min_quantity }}~{{ t.max_quantity || '+' }} {{ item.unit }}</span>
                <span class="price">${{ t.unit_price }}</span>
              </div>
            </div>
            <div class="card-footer">
              <span class="moq-label">MOQ: {{ item.moq }} {{ item.unit }}</span>
              <router-link :to="`/${$route.params.locale || 'ko'}/${$route.params.currency || 'KRW'}/products/${item.id}`" class="btn-detail">
                발주 및 견적
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const verifiedOnly = ref(false);
const selectedMOQ = ref('all');

const items = ref([
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩',
    supplier_name: 'Precision Korea (글로벌정밀산업)',
    is_verified_supplier: true,
    category: '주방용품/산업용기',
    moq: '100',
    unit: 'pcs',
    lead_time_days: 14,
    price_tiers: [
      { min_quantity: '100', max_quantity: '499', unit_price: '5.50' },
      { min_quantity: '500', max_quantity: '999', unit_price: '4.80' },
      { min_quantity: '1000', max_quantity: null, unit_price: '4.20' },
    ],
  },
  {
    id: 'a1b2c3d4-1111-2222-3333-444455556666',
    title: '정밀 CNC 가공 알루미늄 6061 방열판 하우징',
    supplier_name: 'Hansung Precision',
    is_verified_supplier: true,
    category: '금속/가공부품',
    moq: '500',
    unit: 'pcs',
    lead_time_days: 21,
    price_tiers: [
      { min_quantity: '500', max_quantity: '999', unit_price: '12.40' },
      { min_quantity: '1000', max_quantity: null, unit_price: '9.80' },
    ],
  },
]);

const filteredItems = computed(() => {
  return items.value.filter(i => {
    if (verifiedOnly.value && !i.is_verified_supplier) return false;
    return true;
  });
});
</script>

<style scoped>
.catalog-page { display: flex; gap: 24px; }
.filter-sidebar { width: 240px; background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 16px; height: fit-content; }
.filter-sidebar h3 { font-size: 16px; margin: 0 0 16px 0; color: #172B4D; }
.filter-group { margin-bottom: 20px; }
.filter-group .title { display: block; font-size: 13px; font-weight: 600; color: #42526E; margin-bottom: 8px; }
.filter-group select { width: 100%; padding: 8px; border: 1px solid #D8E0EB; border-radius: 4px; }
.cat-list { display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
.cat-item { padding: 4px 6px; border-radius: 4px; color: #42526E; cursor: pointer; }
.cat-item.active { background: #FFEDD5; color: #C2410C; font-weight: 600; }
.catalog-list { flex: 1; }
.list-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
.list-header h2 { font-size: 20px; color: #172B4D; margin: 0; }
.notice { font-size: 12px; color: #64748B; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
.product-card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
.card-img-placeholder { height: 160px; background: #E2E8F0; position: relative; padding: 12px; }
.card-img-placeholder .badge { background: rgba(0,0,0,0.6); color: #FFF; font-size: 11px; padding: 2px 6px; border-radius: 4px; }
.card-body { padding: 16px; flex: 1; display: flex; flex-direction: column; }
.supplier-info { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 12px; }
.sup-name { color: #42526E; }
.verified-tag { background: #DCFCE7; color: #15803D; font-weight: 700; padding: 1px 4px; border-radius: 3px; font-size: 10px; }
.item-title { font-size: 15px; font-weight: 700; color: #172B4D; text-decoration: none; margin-bottom: 12px; line-height: 1.4; }
.item-title:hover { color: #C2410C; }
.tier-preview { background: #F8FAFC; border-radius: 6px; padding: 8px; margin-bottom: 12px; font-size: 12px; }
.tier-row { display: flex; justify-content: space-between; padding: 2px 0; }
.tier-row .price { font-weight: 700; color: #172B4D; font-variant-numeric: tabular-nums; }
.card-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: center; pt: 8px; border-top: 1px solid #F1F5F9; }
.moq-label { font-size: 12px; font-weight: 600; color: #64748B; }
.btn-detail { background: #C2410C; color: #FFF; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 600; }
</style>

