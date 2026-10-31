<template>
  <aside class="filter-sidebar">
    <div class="sidebar-head">
      <h3>도매 조건 필터</h3>
      <button class="btn-reset" @click="$emit('reset')">초기화</button>
    </div>

    <!-- Supplier Certification -->
    <div class="filter-group">
      <h4 class="group-title">공급사 자격 및 보증</h4>
      <label class="checkbox-label">
        <input :checked="filterVerified" type="checkbox" @change="$emit('update:filterVerified', ($event.target as HTMLInputElement).checked)" />
        <span class="badge-gold">✓ Verified</span> 인증 공장만
      </label>
      <label class="checkbox-label">
        <input :checked="filterTradeAssurance" type="checkbox" @change="$emit('update:filterTradeAssurance', ($event.target as HTMLInputElement).checked)" />
        <span class="shield-badge">🛡️</span> 무역보증(Trade Assurance)
      </label>
      <label class="checkbox-label">
        <input :checked="filterCustomization" type="checkbox" @change="$emit('update:filterCustomization', ($event.target as HTMLInputElement).checked)" />
        <span>OEM / ODM 맞춤 제작 가능</span>
      </label>
    </div>

    <!-- MOQ Filter -->
    <div class="filter-group">
      <h4 class="group-title">최소 발주 수량 (MOQ)</h4>
      <div class="moq-pills">
        <button :class="{ active: selectedMoqPreset === 'all' }" @click="$emit('update:selectedMoqPreset', 'all')">전체</button>
        <button :class="{ active: selectedMoqPreset === '100' }" @click="$emit('update:selectedMoqPreset', '100')">≤ 100</button>
        <button :class="{ active: selectedMoqPreset === '500' }" @click="$emit('update:selectedMoqPreset', '500')">≤ 500</button>
        <button :class="{ active: selectedMoqPreset === '1000' }" @click="$emit('update:selectedMoqPreset', '1000')">1,000+</button>
      </div>
    </div>

    <!-- Macro Category -->
    <div class="filter-group">
      <h4 class="group-title">5대 핵심 산업 분류</h4>
      <div class="cat-radio-list">
        <label v-for="cat in categories" :key="cat.val" class="radio-label">
          <input
            :checked="selectedCategory === cat.val"
            type="radio"
            name="cat"
            :value="cat.val"
            @change="$emit('update:selectedCategory', cat.val)"
          />
          <span>{{ cat.label }}</span>
        </label>
      </div>
    </div>

    <!-- Technical Material Facets (Alibaba Specs) -->
    <div class="filter-group">
      <h4 class="group-title">소재 및 재질 (Material)</h4>
      <div class="facet-chips-list">
        <button
          type="button"
          class="facet-chip"
          :class="{ active: selectedMaterial === 'ALL' || !selectedMaterial }"
          @click="$emit('update:selectedMaterial', 'ALL')"
        >
          전체 재질
        </button>
        <button
          v-for="mat in materialList"
          :key="mat.name"
          type="button"
          class="facet-chip"
          :class="{ active: selectedMaterial === mat.name }"
          @click="$emit('update:selectedMaterial', mat.name)"
        >
          {{ mat.name }}
          <span class="facet-count">{{ mat.count }}</span>
        </button>
      </div>
    </div>

    <!-- Certification Facets -->
    <div class="filter-group">
      <h4 class="group-title">국제 공인 인증 (Certifications)</h4>
      <div class="facet-chips-list">
        <button
          type="button"
          class="facet-chip"
          :class="{ active: selectedCertification === 'ALL' || !selectedCertification }"
          @click="$emit('update:selectedCertification', 'ALL')"
        >
          전체 인증
        </button>
        <button
          v-for="cert in certList"
          :key="cert.name"
          type="button"
          class="facet-chip"
          :class="{ active: selectedCertification === cert.name }"
          @click="$emit('update:selectedCertification', cert.name)"
        >
          {{ cert.name }}
          <span class="facet-count">{{ cert.count }}</span>
        </button>
      </div>
    </div>

    <!-- Lead Time Facets -->
    <div class="filter-group">
      <h4 class="group-title">생산 및 출고 납기 (Lead Time)</h4>
      <div class="lead-time-list">
        <label class="radio-label">
          <input
            :checked="selectedLeadTime === 'ALL' || !selectedLeadTime"
            type="radio"
            name="lead"
            value="ALL"
            @change="$emit('update:selectedLeadTime', 'ALL')"
          />
          <span>전체 납기 기간</span>
        </label>
        <label class="radio-label">
          <input
            :checked="selectedLeadTime === '7'"
            type="radio"
            name="lead"
            value="7"
            @change="$emit('update:selectedLeadTime', '7')"
          />
          <span>⚡ 빠른 출고 (≤ 7일 이내)</span>
        </label>
        <label class="radio-label">
          <input
            :checked="selectedLeadTime === '15'"
            type="radio"
            name="lead"
            value="15"
            @change="$emit('update:selectedLeadTime', '15')"
          />
          <span>표준 납기 (≤ 15일 이내)</span>
        </label>
        <label class="radio-label">
          <input
            :checked="selectedLeadTime === '30'"
            type="radio"
            name="lead"
            value="30"
            @change="$emit('update:selectedLeadTime', '30')"
          />
          <span>대량 주문 생산 (≤ 30일 이내)</span>
        </label>
      </div>
    </div>

    <!-- Incoterms -->
    <div class="filter-group">
      <h4 class="group-title">인도 조건 (Incoterms 2020)</h4>
      <select :value="selectedIncoterm" class="select-box" @change="$emit('update:selectedIncoterm', ($event.target as HTMLSelectElement).value)">
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
  { val: 'CAT-IND', label: '⚙️ 산업기계 & 부품' },
  { val: 'CAT-ELE', label: '🔌 가전 & 전자부품' },
  { val: 'CAT-PKG', label: '📦 포장용기 & 인쇄' },
  { val: 'CAT-HOM', label: '🏠 홈/인테리어 & 건축' },
  { val: 'CAT-CHM', label: '🧪 화학 원료 & 플라스틱' },
];
</script>

<style scoped>
.filter-sidebar { width: 280px; flex-shrink: 0; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; box-sizing: border-box; }
.sidebar-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; margin-bottom: 16px; }
.sidebar-head h3 { margin: 0; font-size: 15px; font-weight: 700; color: #1E293B; }
.btn-reset { background: transparent; border: none; font-size: 12px; color: #64748B; cursor: pointer; text-decoration: underline; }
.btn-reset:hover { color: #D64000; }
.filter-group { margin-bottom: 24px; }
.group-title { font-size: 13px; font-weight: 700; color: #334155; margin: 0 0 10px 0; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569; margin-bottom: 8px; cursor: pointer; }
.badge-gold { background: #FEF3C7; color: #B45309; font-weight: 700; font-size: 11px; padding: 1px 6px; border-radius: 4px; }
.shield-badge { font-size: 12px; }
.moq-pills { display: flex; gap: 6px; }
.moq-pills button { flex: 1; background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 4px; padding: 6px 0; font-size: 12px; color: #475569; cursor: pointer; }
.moq-pills button.active { background: #D64000; color: #FFFFFF; border-color: #D64000; font-weight: 700; }
.cat-radio-list { display: flex; flex-direction: column; gap: 8px; }
.radio-label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #475569; cursor: pointer; margin-bottom: 6px; }
.radio-label:hover { color: #D64000; }
.facet-chips-list { display: flex; flex-wrap: wrap; gap: 6px; }
.facet-chip {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}
.facet-chip:hover {
  background: #FFF7ED;
  border-color: #FED7AA;
  color: #C2410C;
}
.facet-chip.active {
  background: #C2410C;
  border-color: #C2410C;
  color: #FFFFFF;
  font-weight: 700;
}
.facet-count {
  font-size: 10px;
  opacity: 0.8;
  background: rgba(0,0,0,0.06);
  padding: 1px 4px;
  border-radius: 99px;
}
.facet-chip.active .facet-count {
  background: rgba(255,255,255,0.25);
  color: #FFF;
}
.lead-time-list { display: flex; flex-direction: column; gap: 6px; }
.select-box { width: 100%; padding: 8px 10px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; color: #334155; outline: none; background: #FFF; }
</style>

