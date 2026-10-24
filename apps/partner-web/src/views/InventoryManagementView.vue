<template>
  <div class="inv-page">
    <div class="head-row">
      <div>
        <h2>창고·재고 원장 및 생산 배치 관리 (Warehouse & Inventory Ledger)</h2>
        <p class="subtitle">SKU별 실물 재고(`on_hand`), 주문 예약 재고(`reserved`), 가용 재고(`available`) 및 안전 재고를 실시간 관리합니다.</p>
      </div>
      <button class="btn-refresh" @click="loadInventory">↻ 재고 원장 새로고침</button>
    </div>

    <div class="card">
      <h3>📦 창고별 실시간 재고 원장</h3>
      <table class="inv-table">
        <thead>
          <tr>
            <th>SKU 코드</th>
            <th>상품명</th>
            <th>보관 창고</th>
            <th>실물재고 (On-Hand)</th>
            <th>예약재고 (Reserved)</th>
            <th>가용재고 (Available)</th>
            <th>안전재고 기준</th>
            <th>재고 입·출고 조정</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in inventory" :key="item.sku_id">
            <td class="bold">{{ item.sku_code }}</td>
            <td>{{ item.title }}</td>
            <td>{{ item.warehouse_name }}</td>
            <td class="num">{{ item.on_hand?.toLocaleString() }} {{ item.unit }}</td>
            <td class="num warn">{{ item.reserved?.toLocaleString() }} {{ item.unit }}</td>
            <td class="num avail">{{ item.available?.toLocaleString() }} {{ item.unit }}</td>
            <td class="num">{{ item.safety_stock?.toLocaleString() }} {{ item.unit }}</td>
            <td class="adj-cell">
              <input v-model.number="adjustAmounts[item.sku_id]" type="number" step="100" class="adj-input" placeholder="+500 / -200" />
              <button class="btn-adj" @click="applyAdjustment(item)">원장 반영</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest } from '../api';

const inventory = ref<any[]>([]);
const adjustAmounts = ref<Record<string, number>>({});

async function loadInventory() {
  try {
    const res = await apiRequest('/partner/inventory');
    inventory.value = res.inventory || [];
    for (const item of inventory.value) {
      if (adjustAmounts.value[item.sku_id] === undefined) {
        adjustAmounts.value[item.sku_id] = 500;
      }
    }
  } catch (e) {
    console.warn('Inventory load failed:', e);
  }
}

async function applyAdjustment(item: any) {
  const delta = Number(adjustAmounts.value[item.sku_id]) || 0;
  if (delta === 0) return;
  try {
    const res = await apiRequest('/inventory/adjustments', {
      method: 'POST',
      body: JSON.stringify({
        sku_id: item.sku_id,
        adjustment_quantity: delta,
      }),
    });
    if (res.item) {
      item.on_hand = res.item.on_hand;
      item.available = res.item.available;
    }
    alert(`[재고 원장 조정 완료]\nSKU: ${item.sku_code}\n조정 수량: ${delta > 0 ? '+' : ''}${delta} ${item.unit}\n신규 가용 재고: ${item.available.toLocaleString()} ${item.unit}`);
  } catch (err: any) {
    alert(`재고 조정 실패: ${err.message}`);
  }
}

onMounted(() => {
  loadInventory();
});
</script>

<style scoped>
.inv-page { max-width: 1080px; }
.head-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
h2 { margin: 0 0 4px 0; font-size: 20px; color: #172B4D; }
.subtitle { color: #64748B; font-size: 13px; margin: 0; }
.btn-refresh { background: #FFF; border: 1px solid #CBD5E1; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; }
.card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 24px; }
.card h3 { margin: 0 0 16px 0; font-size: 16px; color: #172B4D; }
.inv-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.inv-table th, .inv-table td { border-bottom: 1px solid #F1F5F9; padding: 10px 8px; text-align: left; }
.inv-table th { background: #F8FAFC; color: #475569; font-size: 12px; }
.bold { font-weight: 700; color: #0F172A; }
.num { font-variant-numeric: tabular-nums; font-weight: 600; }
.num.warn { color: #D97706; }
.num.avail { color: #15803D; font-weight: 800; }
.adj-cell { display: flex; gap: 6px; align-items: center; }
.adj-input { width: 90px; padding: 6px 8px; border: 1px solid #CBD5E1; border-radius: 4px; font-size: 12px; }
.btn-adj { background: #C2410C; color: #FFF; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 700; cursor: pointer; }
</style>

