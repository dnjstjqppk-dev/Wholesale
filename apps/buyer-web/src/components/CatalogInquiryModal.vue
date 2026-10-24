<template>
  <div v-if="item" class="modal-overlay" @click.self="$emit('close')">
    <div class="inquiry-modal-card">
      <div class="inquiry-modal-head">
        <h3>💬 공급사 1:1 직통 문의 및 견적 요청 (Direct Inquiry)</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      <div class="inquiry-modal-body">
        <div class="target-item-preview">
          <span class="preview-title"><strong>문의 품목:</strong> {{ item.title }}</span>
          <span class="preview-sup"><strong>수신 공급사:</strong> {{ item.supplier_name }} (Verified Manufacturer)</span>
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
          <label>상세 기술 요구사항 (재질 규격, OEM 로고, 패키징, 납기 희망일)</label>
          <textarea
            v-model="message"
            rows="4"
            class="inquiry-textarea"
            placeholder="예: SUS304 레이저 로고 인쇄 포함, 개별 무지 박스 포장 및 30일 이내 부산항 선적 가능 여부 문의드립니다."
          ></textarea>
        </div>

        <div class="form-actions">
          <button class="btn-submit-inquiry" :disabled="sending" @click="onSubmit">
            {{ sending ? '1:1 대화방 개설 중...' : '📨 1:1 문의 발송 및 메신저 열기' }}
          </button>
          <button class="btn-cancel" @click="$emit('close')">취소</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiRequest } from '../api';

const props = defineProps<{ item: any }>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submitted', payload: any): void;
}>();

const router = useRouter();
const route = useRoute();

const quantity = ref(500);
const targetPrice = ref('');
const message = ref('');
const sending = ref(false);

watch(() => props.item, (val) => {
  if (val) {
    quantity.value = Number(val.moq) || 500;
    targetPrice.value = val.price_tiers?.[0]?.unit_price || '4.20';
  }
}, { immediate: true });

async function onSubmit() {
  if (!props.item) return;
  sending.value = true;
  try {
    const contentText = `[수량: ${quantity.value} ${props.item.unit} / 희망단가: $${targetPrice.value || '협의'}] ${message.value || '제품 사양 및 납기 견적 문의드립니다.'}`;
    const thread = await apiRequest('/inquiries', {
      method: 'POST',
      body: JSON.stringify({
        supplier_organization_id: props.item.organization_id || '11111111-1111-1111-1111-111111111111',
        supplier_name: props.item.supplier_name,
        listing_id: props.item.id,
        listing_title: props.item.title,
        subject: `${props.item.title} (${quantity.value} ${props.item.unit}) 견적 문의`,
        message: contentText,
      }),
    });
    emit('submitted', thread);
    emit('close');
    const loc = (route.params.locale as string) || 'ko';
    const cur = (route.params.currency as string) || 'KRW';
    router.push(`/${loc}/${cur}/messages?threadId=${thread.id}`);
  } catch (err: any) {
    alert(`1:1 문의 전송 실패: ${err.message}`);
  } finally {
    sending.value = false;
  }
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
