<template>
  <div class="tier-price-badges">
    <div
      v-for="(tier, idx) in tiers"
      :key="idx"
      class="tier-badge"
      :class="{ active: isTierActive(tier) }"
    >
      <div class="tier-qty">
        {{ tier.minQuantity }}
        <span v-if="tier.maxQuantity">- {{ tier.maxQuantity }}</span>
        <span v-else>+</span>
        {{ unit }}
      </div>
      <div class="tier-price">
        {{ currencySymbol }} {{ tier.unitPrice }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PriceTierItem } from './index';

const props = defineProps<{
  tiers: PriceTierItem[];
  currentQty?: number;
  unit?: string;
  currency?: string;
}>();

const unit = computed(() => props.unit || 'pcs');
const currencySymbol = computed(() => (props.currency === 'KRW' ? '₩' : '$'));

function isTierActive(tier: PriceTierItem): boolean {
  if (!props.currentQty) return false;
  const min = parseFloat(tier.minQuantity);
  const max = tier.maxQuantity ? parseFloat(tier.maxQuantity) : Infinity;
  return props.currentQty >= min && props.currentQty < max;
}
</script>

<style scoped>
.tier-price-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tier-badge {
  border: 1px solid #D8E0EB;
  border-radius: 6px;
  padding: 8px 12px;
  background-color: #FFFFFF;
  text-align: center;
  transition: all 0.2s ease;
}
.tier-badge.active {
  border-color: #C2410C;
  background-color: #FFEDD5;
}
.tier-qty {
  font-size: 12px;
  color: #42526E;
  margin-bottom: 2px;
}
.tier-price {
  font-size: 15px;
  font-weight: 700;
  color: #172B4D;
  font-variant-numeric: tabular-nums;
}
.tier-badge.active .tier-price {
  color: #C2410C;
}
</style>
