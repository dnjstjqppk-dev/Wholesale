<template>
  <aside class="ws-card ws-card-pad-sm filters">
    <div class="ws-card-head">
      <h3>도매 조건 필터</h3>
      <button class="ws-btn ws-btn-ghost ws-btn-sm" @click="$emit('reset')">초기화</button>
    </div>

    <div class="f-group">
      <h4>공급사 자격·보증</h4>
      <label class="ws-check">
        <input :checked="filterVerified" type="checkbox" @change="$emit('update:filterVerified', ($event.target as HTMLInputElement).checked)" />
        <span><span class="ws-badge ws-badge-success">Verified</span> 인증 공장만</span>
      </label>
      <label class="ws-check">
        <input :checked="filterTradeAssurance" type="checkbox" @change="$emit('update:filterTradeAssurance', ($event.target as HTMLInputElement).checked)" />
        <span><WsIcon name="shield" :size="13" class="ck-ico" /> 무역보증 (TA)</span>
      </label>
      <label class="ws-check">
        <input :checked="filterCustomization" type="checkbox" @change="$emit('update:filterCustomization', ($event.target as HTMLInputElement).checked)" />
        <span>OEM / ODM 맞춤 제작 가능</span>
      </label>
    </div>

    <div class="f-group">
      <h4>최소 발주 수량 (MOQ)</h4>
      <div class="ws-cluster" style="gap: 6px">
        <button class="ws-tag" :class="{ 'ws-tag-active': selectedMoqPreset === 'all' }" @click="$emit('update:selectedMoqPreset', 'all')">전체</button>
        <button class="ws-tag" :class="{ 'ws-tag-active': selectedMoqPreset === '100' }" @click="$emit('update:selectedMoqPreset', '100')">≤ 100</button>
        <button class="ws-tag" :class="{ 'ws-tag-active': selectedMoqPreset === '500' }" @click="$emit('update:selectedMoqPreset', '500')">≤ 500</button>
        <button class="ws-tag" :class="{ 'ws-tag-active': selectedMoqPreset === '1000' }" @click="$emit('update:selectedMoqPreset', '1000')">1,000+</button>
      </div>
    </div>

    <div class="f-group">
      <h4>5대 핵심 산업 분류</h4>
      <div class="ws-stack-sm">
        <label v-for="cat in categories" :key="cat.val" class="ws-check">
          <input :checked="selectedCategory === cat.val" type="radio" name="cat" :value="cat.val" @change="$emit('update:selectedCategory', cat.val)" />
          <span>{{ cat.label }}</span>
        </label>
      </div>
    </div>

    <div class="f-group">
      <h4>소재·재질</h4>
      <div class="ws-cluster" style="gap: 6px">
        <button type="button" class="ws-tag" :class="{ 'ws-tag-active': selectedMaterial === 'ALL' || !selectedMaterial }" @click="$emit('update:selectedMaterial', 'ALL')">전체</button>
        <button
          v-for="mat in materialList"
          :key="mat.name"
          type="button"
          class="ws-tag"
          :class="{ 'ws-tag-active': selectedMaterial === mat.name }"
          @click="$emit('update:selectedMaterial', mat.name)"
        >
          {{ mat.name }} <span class="ws-tab-count">{{ mat.count }}</span>
        </button>
      </div>
    </div>

    <div class="f-group">
      <h4>국제 공인 인증</h4>
      <div class="ws-cluster" style="gap: 6px">
        <button type="button" class="ws-tag" :class="{ 'ws-tag-active': selectedCertification === 'ALL' || !selectedCertification }" @click="$emit('update:selectedCertification', 'ALL')">전체</button>
        <button
          v-for="cert in certList"
          :key="cert.name"
          type="button"
          class="ws-tag"
          :class="{ 'ws-tag-active': selectedCertification === cert.name }"
          @click="$emit('update:selectedCertification', cert.name)"
        >
          {{ cert.name }} <span class="ws-tab-count">{{ cert.count }}</span>
        </button>
      </div>
    </div>

    <div class="f-group">
      <h4>생산·출고 납기</h4>
      <div class="ws-stack-sm">
        <label class="ws-check">
          <input :checked="selectedLeadTime === 'ALL' || !selectedLeadTime" type="radio" name="lead" value="ALL" @change="$emit('update:selectedLeadTime', 'ALL')" />
          <span>전체 납기 기간</span>
        </label>
        <label class="ws-check">
          <input :checked="selectedLeadTime === '7'" type="radio" name="lead" value="7" @change="$emit('update:selectedLeadTime', '7')" />
          <span><WsIcon name="bolt" :size="13" class="ck-ico-brand" /> 빠른 출고 (≤ 7일)</span>
        </label>
        <label class="ws-check">
          <input :checked="selectedLeadTime === '15'" type="radio" name="lead" value="15" @change="$emit('update:selectedLeadTime', '15')" />
          <span>표준 납기 (≤ 15일)</span>
        </label>
        <label class="ws-check">
          <input :checked="selectedLeadTime === '30'" type="radio" name="lead" value="30" @change="$emit('update:selectedLeadTime', '30')" />
          <span>대량 주문 생산 (≤ 30일)</span>
        </label>
      </div>
    </div>

    <div class="f-group" style="margin-bottom: 0">
      <h4>인도 조건 (Incoterms 2020)</h4>
      <select :value="selectedIncoterm" class="ws-input" @change="$emit('update:selectedIncoterm', ($event.target as HTMLSelectElement).value)">
        <option value="ALL">전체 무역 조건</option>
        <option value="FOB">FOB (본선인도조건)</option>
        <option value="CIF">CIF (운임·보험료포함조건)</option>
        <option value="EXW">EXW (공장인도조건)</option>
        <option value="DDP">DDP (관세지급인도조건)</option>
      </select>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import WsIcon from '@packages/ui/WsIcon.vue';

const props = defineProps<{
  filterVerified: boolean;
  filterTradeAssurance: boolean;
  filterCustomization: boolean;
  selectedMoqPreset: string;
  selectedCategory: string;
  selectedIncoterm: string;
  selectedMaterial?: string;
  selectedCertification?: string;
  selectedLeadTime?: string;
  facets?: {
    materials?: { name: string; count: number }[];
    certifications?: { name: string; count: number }[];
  };
}>();

defineEmits<{
  (e: 'update:filterVerified', val: boolean): void;
  (e: 'update:filterTradeAssurance', val: boolean): void;
  (e: 'update:filterCustomization', val: boolean): void;
  (e: 'update:selectedMoqPreset', val: string): void;
  (e: 'update:selectedCategory', val: string): void;
  (e: 'update:selectedIncoterm', val: string): void;
  (e: 'update:selectedMaterial', val: string): void;
  (e: 'update:selectedCertification', val: string): void;
  (e: 'update:selectedLeadTime', val: string): void;
  (e: 'reset'): void;
}>();

const materialList = computed(() => {
  return props.facets?.materials && props.facets.materials.length > 0
    ? props.facets.materials
    : [
        { name: 'SUS304', count: 14 },
        { name: 'SUS316', count: 6 },
        { name: 'Aluminum 6061', count: 9 },
        { name: 'Carbon Steel', count: 7 },
        { name: 'Cast Iron', count: 5 },
        { name: 'Polypropylene (PP)', count: 8 },
      ];
});

const certList = computed(() => {
  return props.facets?.certifications && props.facets.certifications.length > 0
    ? props.facets.certifications
    : [
        { name: 'ISO 9001', count: 22 },
        { name: 'CE', count: 18 },
        { name: 'FDA', count: 12 },
        { name: 'RoHS', count: 15 },
        { name: 'LFGB', count: 7 },
      ];
});

const categories = [
  { val: 'ALL', label: '전체 산업군' },
  { val: 'CAT-IND', label: '산업기계 & 부품' },
  { val: 'CAT-ELE', label: '가전 & 전자부품' },
  { val: 'CAT-PKG', label: '포장용기 & 인쇄' },
  { val: 'CAT-HOM', label: '홈/인테리어 & 건축' },
  { val: 'CAT-CHM', label: '화학 원료 & 플라스틱' },
];
</script>

<style scoped>
.filters { position: sticky; top: 84px; }
.f-group { margin-bottom: 20px; }
.f-group h4 { margin: 0 0 10px; font-size: 13px; font-weight: 800; padding-bottom: 6px; border-bottom: 1px solid var(--ws-border-subtle); }
.f-group .ws-check { margin-bottom: 4px; }
.ck-ico { color: var(--ws-brand); vertical-align: -2px; }
.ck-ico-brand { color: var(--ws-brand); vertical-align: -2px; }
.ws-check input[type="radio"] { width: 16px; height: 16px; accent-color: var(--ws-brand); }
@media (max-width: 1024px) {
  .filters { position: static; }
}
</style>
