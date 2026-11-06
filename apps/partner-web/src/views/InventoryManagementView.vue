<template>
  <div class="inv-page">
    <div class="head-row">
      <div>
        <h2>창고·재고 원장 및 생산 배치 관리 (Warehouse & Inventory Ledger)</h2>
        <p class="subtitle">SKU별 실물 재고(`on_hand`), 주문 예약 재고(`reserved`), 가용 재고(`available`) 및 안전 재고를 실시간 관리합니다.</p>
      </div>
      <button class="btn-refresh" @click="loadInventory"><WsIcon name="refresh" :size="15" /> 재고 원장 새로고침</button>
    </div>

    <div v-if="loadError" class="ws-banner ws-banner-danger">{{ loadError }}</div>
    <div v-if="!loadError && inventory.length === 0" class="ws-empty">
      <h3>표시할 재고가 없습니다</h3>
      <p>새로고침 후에도 비어 있으면 상품·창고 등록 상태를 확인하세요.</p>
    </div>

    <div class="card">
      <h3><WsIcon name="package" :size="15" /> 창고별 실시간 재고 원장</h3>
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
import WsIcon from '@packages/ui/WsIcon.vue';

const inventory = ref<any[]>([]);
const adjustAmounts = ref<Record<string, number>>({});
const loadError = ref('');

async function loadInventory() {
  loadError.value = '';
  try {
    const res = await apiRequest('/partner/inventory');
    inventory.value = res.inventory || [];
    for (const item of inventory.value) {
      if (adjustAmounts.value[item.sku_id] === undefined) {
        adjustAmounts.value[item.sku_id] = 500;
      }
    }
  } catch (e: any) {
    loadError.value = `재고 원장을 불러오지 못했습니다: ${e.message}`;
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
h2 { margin: 0 0 4px 0; font-size: 20px; color: var(--ws-text); }
.subtitle { color: var(--ws-text-muted); font-size: 13px; margin: 0; }
.btn-refresh { background: var(--ws-surface); border: 1px solid #CBD5E1; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; }
.card { background: var(--ws-surface); border: 1px solid var(--ws-border); border-radius: 8px; padding: 24px; }
.card h3 { margin: 0 0 16px 0; font-size: 16px; color: var(--ws-text); }
.inv-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.inv-table th, .inv-table td { border-bottom: 1px solid var(--ws-surface-muted); padding: 10px 8px; text-align: left; }
.inv-table th { background: var(--ws-surface-muted); color: var(--ws-text-2); font-size: 12px; }
.bold { font-weight: 700; color: var(--ws-text); }
.num { font-variant-numeric: tabular-nums; font-weight: 600; }
.num.warn { color: var(--ws-warning); }
.num.avail { color: var(--ws-success); font-weight: 800; }
.adj-cell { display: flex; gap: 6px; align-items: center; }
.adj-input { width: 90px; padding: 6px 8px; border: 1px solid #CBD5E1; border-radius: 4px; font-size: 12px; }
.btn-adj { background: var(--ws-brand); color: var(--ws-surface); border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 700; cursor: pointer; }
</style>

