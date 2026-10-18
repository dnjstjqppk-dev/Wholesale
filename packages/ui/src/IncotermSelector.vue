<template>
  <div class="incoterm-selector">
    <div class="field-row">
      <label class="label">Incoterms 규칙 (2020 필수)</label>
      <select
        :value="modelValue.code"
        class="select"
        @change="updateCode(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="rule in INCOTERMS_RULES" :key="rule.code" :value="rule.code">
          {{ rule.code }} - {{ rule.description }}
        </option>
      </select>
    </div>
    <div class="field-row">
      <label class="label">지정 장소 (Named Place 필수)</label>
      <input
        type="text"
        :value="modelValue.namedPlace"
        class="input"
        placeholder="예: Busan Port, South Korea"
        @input="updatePlace(($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
export interface IncotermsData {
  code: string;
  version: string;
  namedPlace: string;
}

const INCOTERMS_RULES = [
  { code: 'EXW', description: '공장 인도 (Ex Works)' },
  { code: 'FCA', description: '운송인 인도 (Free Carrier)' },
  { code: 'FOB', description: '본선 인도 (Free On Board - 해상)' },
  { code: 'CIF', description: '운임·보험료 포함 인도 (Cost, Insurance & Freight)' },
  { code: 'DAP', description: '도착지 인도 (Delivered at Place)' },
  { code: 'DDP', description: '관세지급 인도 (Delivered Duty Paid)' },
];

const props = defineProps<{
  modelValue: IncotermsData;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: IncotermsData): void;
}>();

function updateCode(code: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    code,
    version: 'Incoterms 2020',
  });
}

function updatePlace(namedPlace: string) {
  emit('update:modelValue', {
    ...props.modelValue,
    namedPlace,
    version: 'Incoterms 2020',
  });
}
</script>

<style scoped>
.incoterm-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.field-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.label {
  font-size: 13px;
  font-weight: 600;
  color: #172B4D;
}
.select, .input {
  padding: 8px 12px;
  border: 1px solid #D8E0EB;
  border-radius: 6px;
  font-size: 14px;
  background-color: #FFFFFF;
}
.select:focus, .input:focus {
  border-color: #C2410C;
  outline: none;
}
</style>

