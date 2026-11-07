<template>
  <div class="ws-page ws-page-wide">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Inventory Ledger</p>
      <div class="ws-page-head-row">
        <h1 class="ws-page-title">창고·재고 원장</h1>
        <div class="ws-page-actions">
          <button class="ws-btn ws-btn-secondary ws-btn-sm" @click="loadInventory"><WsIcon name="refresh" :size="14" /> 원장 새로고침</button>
        </div>
      </div>
      <p class="ws-page-sub">SKU별 실물·예약·가용·안전 재고를 실시간 관리합니다.</p>
    </div>

    <div v-if="loadError" class="ws-banner ws-banner-danger"><WsIcon name="alert" :size="16" /> {{ loadError }}</div>
    <div v-if="!loadError && inventory.length === 0" class="ws-empty">
      <span class="ws-empty-icon"><WsIcon name="package" :size="24" /></span>
      <h3>표시할 재고가 없습니다</h3>
      <p>새로고침 후에도 비어 있으면 상품·창고 등록 상태를 확인하세요.</p>
    </div>

    <section class="ws-card ws-card-pad-sm">
      <div class="ws-card-head"><h3><WsIcon name="package" :size="15" class="h-ico" /> 창고별 실시간 재고 원장</h3></div>
      <div class="ws-table-wrap">
        <div class="ws-table-scroll">
          <table class="ws-table">
            <thead><tr><th>SKU</th><th>상품명</th><th>창고</th><th class="ws-num">실물</th><th class="ws-num">예약</th><th class="ws-num">가용</th><th class="ws-num">안전기준</th><th>입·출고 조정</th></tr></thead>
            <tbody>
              <tr v-for="item in inventory" :key="item.sku_id">
                <td class="ws-cell-main ws-figure">{{ item.sku_code ?? item.sku_id }}</td>
                <td>{{ item.title }}</td>
                <td class="ws-cell-sub">{{ item.warehouse_name ?? item.warehouse }}</td>
                <td class="ws-num ws-figure">{{ item.on_hand?.toLocaleString() }} {{ item.unit }}</td>
                <td class="ws-num ws-figure warn">{{ item.reserved?.toLocaleString() }} {{ item.unit }}</td>
                <td class="ws-num"><b class="avail ws-figure">{{ item.available?.toLocaleString() }} {{ item.unit }}</b></td>
                <td class="ws-num ws-figure">{{ item.safety_stock?.toLocaleString() }} {{ item.unit }}</td>
                <td>
                  <span class="adj-box">
                    <input v-model.number="adjustAmounts[item.sku_id]" type="number" step="100" class="ws-input" placeholder="+500 / -200" />
                    <button class="ws-btn ws-btn-accent ws-btn-sm" @click="applyAdjustment(item)">반영</button>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
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
.h-ico { color: var(--ws-accent); vertical-align: -2px; }
.warn { color: var(--ws-warning); }
.avail { color: var(--ws-success); }
.adj-box { display: inline-flex; gap: 6px; align-items: center; }
.adj-box .ws-input { width: 110px; padding: 7px 9px; font-size: 12px; }
</style>
