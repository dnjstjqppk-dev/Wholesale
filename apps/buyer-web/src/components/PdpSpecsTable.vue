<template>
  <section class="specs-section">
    <div class="specs-head">
      <h2>산업용 기술 사양 및 검사 규격 (Specifications)</h2>
      <span class="sku-tag">SKU: {{ skuId || 'N/A' }}</span>
    </div>
    <div class="specs-table-container">
      <table class="specs-table">
        <tbody>
          <tr v-for="(chunk, rowIdx) in specPairs" :key="rowIdx">
            <template v-for="(spec, colIdx) in chunk" :key="colIdx">
              <th class="spec-th">{{ spec.name }}</th>
              <td class="spec-td">{{ spec.value }}</td>
            </template>
            <template v-if="chunk.length === 1">
              <th class="spec-th">-</th>
              <td class="spec-td">-</td>
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
.specs-section {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  padding: 24px;
  margin-top: 12px;
}
.specs-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.specs-head h2 {
  font-size: 16px;
  font-weight: 800;
  color: #1E293B;
  margin: 0;
}
.sku-tag {
  background: #F1F5F9;
  color: #64748B;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
}
.specs-table-container {
  overflow-x: auto;
}
.specs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.spec-th {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  padding: 10px 14px;
  text-align: left;
  width: 22%;
  color: #334155;
  font-weight: 700;
}
.spec-td {
  border: 1px solid #E2E8F0;
  padding: 10px 14px;
  color: #475569;
  width: 28%;
}
</style>
