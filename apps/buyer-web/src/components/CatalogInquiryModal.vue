<template>
  <div v-if="item" class="ws-modal-backdrop" @click.self="$emit('close')">
    <div class="ws-modal" role="dialog" aria-modal="true">
      <div class="ws-modal-head">
        <h3>공급사 1:1 직통 문의</h3>
        <button class="ws-icon-btn" aria-label="닫기" @click="$emit('close')"><WsIcon name="x" :size="15" /></button>
      </div>
      <div class="ws-modal-body">
        <div class="inquiry-target">
          <p><b>문의 품목</b><br />{{ item.title }}</p>
          <p><b>수신 공급사</b><br />{{ item.supplier_name }} <span class="ws-badge ws-badge-success">Verified</span></p>
        </div>
        <div class="ws-grid-2">
          <div class="ws-field">
            <label>희망 발주 수량 (MOQ {{ item.moq }}{{ item.unit }})</label>
            <input v-model.number="quantity" type="number" :min="item.moq" />
          </div>
          <div class="ws-field">
            <label>목표 단가 (USD)</label>
            <input v-model="targetPrice" type="text" placeholder="예: 4.50" />
          </div>
        </div>
        <div class="ws-field" style="margin-bottom: 0">
          <label>상세 기술 요구사항</label>
          <textarea v-model="message" rows="4" class="ws-textarea" placeholder="예: SUS304 레이저 로고 인쇄 포함, 개별 무지 박스 포장 및 30일 이내 부산항 선적 가능 여부 문의드립니다."></textarea>
        </div>
      </div>
      <div class="ws-modal-foot">
        <button class="ws-btn ws-btn-secondary" @click="$emit('close')">취소</button>
        <button class="ws-btn ws-btn-primary" :disabled="sending" @click="onSubmit">
          <WsIcon v-if="!sending" name="send" :size="14" /> {{ sending ? '대화방 개설 중...' : '문의 발송·메신저 열기' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

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
.inquiry-target { background: var(--ws-surface-muted); border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.inquiry-target p { margin: 0; font-size: 13px; }
@media (max-width: 640px) {
  .inquiry-target { grid-template-columns: minmax(0, 1fr); }
}
</style>
