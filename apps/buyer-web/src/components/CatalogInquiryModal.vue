<template>
  <div v-if="item" class="modal-overlay" @click.self="$emit('close')">
    <div class="inquiry-modal-card">
      <div class="inquiry-modal-head">
        <h3>공급사 견적 및 기술 문의 (Send Inquiry)</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      <div class="inquiry-modal-body">
        <div class="target-item-preview">
          <span class="preview-title"><strong>품목:</strong> {{ item.title }}</span>
          <span class="preview-sup"><strong>수신 공급사:</strong> {{ item.supplier_name }} (Verified)</span>
        </div>

        <div class="form-row">
          <label>희망 발주 수량 (MOQ: {{ item.moq }} {{ item.unit }})</label>
          <input v-model.number="quantity" type="number" :min="item.moq" class="inquiry-input" />
        </div>

        <div class="form-row">
          <label>목표 단가 (Target Unit Price, USD)</label>
          <input v-model="targetPrice" type="text" placeholder="예: 4.50" class="inquiry-input" />
        </div>

        <div class="form-row">
          <label>상세 요구사항 (재질 규격, 패키징, 납기 희망일)</label>
          <textarea
            v-model="message"
            rows="4"
            class="inquiry-textarea"
            placeholder="예: SUS304 레이저 로고 인쇄 포함, 개별 무지 박스 포장 및 30일 이내 부산항 선적 희망합니다."
          ></textarea>
        </div>

        <div class="form-actions">
          <button class="btn-submit-inquiry" @click="onSubmit">견적 문의 발송 (Trade Assurance 보호)</button>
          <button class="btn-cancel" @click="$emit('close')">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ item: any }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submitted', payload: any): void;
}>();

const quantity = ref(500);
const targetPrice = ref('');
const message = ref('');

watch(() => props.item, (val) => {
  if (val) {
    quantity.value = val.moq || 500;
  }
}, { immediate: true });

function onSubmit() {
  emit('submitted', {
    item: props.item,
    quantity: quantity.value,
    targetPrice: targetPrice.value,
    message: message.value,
  });
}
</script>

<style scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; }
.inquiry-modal-card { background: #FFF; width: 620px; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); }
.inquiry-modal-head { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid #E2E8F0; background: #F8FAFC; }
.inquiry-modal-head h3 { margin: 0; font-size: 16px; font-weight: 700; color: #1E293B; }
.close-btn { background: transparent; border: none; font-size: 18px; cursor: pointer; color: #64748B; }
.inquiry-modal-body { padding: 24px; }
.target-item-preview { background: #F1F5F9; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
.form-row { margin-bottom: 16px; }
.form-row label { display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 6px; }
.inquiry-input, .inquiry-textarea { width: 100%; border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px 12px; font-size: 13px; outline: none; box-sizing: border-box; }
.inquiry-input:focus, .inquiry-textarea:focus { border-color: #FF6600; }
.form-actions { display: flex; gap: 12px; margin-top: 24px; }
.btn-submit-inquiry { flex: 1; background: #FF6600; color: #FFF; border: none; padding: 12px; border-radius: 6px; font-weight: 700; font-size: 14px; cursor: pointer; }
.btn-cancel { padding: 12px 20px; background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; color: #475569; }
</style>
