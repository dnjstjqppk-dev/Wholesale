<template>
  <section class="ws-card">
    <div class="ws-card-head">
      <h3>기술 사양·검사 규격</h3>
      <span class="ws-badge ws-badge-outline ws-figure">SKU: {{ skuId || 'N/A' }}</span>
    </div>
    <div class="ws-table-scroll">
      <table class="spec-grid">
        <tbody>
          <tr v-for="(chunk, rowIdx) in specPairs" :key="rowIdx">
            <template v-for="(spec, colIdx) in chunk" :key="colIdx">
              <th>{{ spec.name }}</th>
              <td>{{ spec.value }}</td>
            </template>
            <template v-if="chunk.length === 1">
              <th>-</th>
              <td>-</td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  skuId?: string;
  specifications?: Array<{ name: string; value: string }>;
}>();

const defaultSpecs = [
  { name: '원산지 국가 (Country of Origin)', value: '대한민국 (Republic of Korea)' },
  { name: '품질 인증 규격 (Certifications)', value: 'ISO 9001:2015, CE, RoHS, FDA GRAS' },
  { name: '가공 공법 (Processing Standard)', value: '정밀 CNC 정밀 가공 및 품질 전수 검사' },
  { name: '포장 규격 (Export Packaging)', value: '수출용 5겹 강화 골판지 상자 및 방습 진공 밀봉' },
];

const specPairs = computed(() => {
  const list = props.specifications && props.specifications.length > 0 ? props.specifications : defaultSpecs;
  const pairs: Array<Array<{ name: string; value: string }>> = [];
  for (let i = 0; i < list.length; i += 2) {
    pairs.push(list.slice(i, i + 2));
  }
  return pairs;
});
</script>

<style scoped>
.spec-grid { width: 100%; border-collapse: collapse; font-size: 13px; }
.spec-grid th { background: var(--ws-surface-muted); border: 1px solid var(--ws-border-subtle); padding: 10px 14px; text-align: left; width: 20%; color: var(--ws-text-2); font-weight: 700; }
.spec-grid td { border: 1px solid var(--ws-border-subtle); padding: 10px 14px; color: var(--ws-text); width: 30%; }
</style>
