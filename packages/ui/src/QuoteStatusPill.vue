<template>
  <span
    class="status-pill"
    :style="{
      backgroundColor: config.bg,
      color: config.text,
      borderColor: config.border
    }"
  >
    {{ label || status }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { StatusColorMap, type OrderFSMStatus } from './index';

const props = defineProps<{
  status: OrderFSMStatus | string;
  label?: string;
}>();

const config = computed(() => {
  const s = props.status as OrderFSMStatus;
  return StatusColorMap[s] || { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
});
</script>

<style scoped>
.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 9999px;
  border: 1px solid;
  line-height: 1.4;
  white-space: nowrap;
}
</style>
