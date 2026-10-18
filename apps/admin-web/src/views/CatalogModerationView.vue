<template>
  <div class="moderation-page">
    <h2>상품 카탈로그 모더레이션 (Catalog Moderation)</h2>
    <p class="subtitle">공급사가 제출한 도매 상품의 MOQ, 구간 단가, 스펙 적합성을 심사합니다.</p>

    <div class="item-list">
      <div v-for="item in items" :key="item.id" class="mod-card">
        <div class="card-head">
          <div>
            <h3 class="title">{{ item.title }}</h3>
            <span class="sub">공급사: {{ item.supplier }} (Verified) | 등록일: {{ item.date }}</span>
          </div>
          <span class="badge" :class="item.status.toLowerCase()">{{ item.status }}</span>
        </div>

        <div class="info-row">
          <div><span>MOQ:</span> <strong>{{ item.moq }} pcs</strong></div>
          <div><span>발주단위(Step):</span> <strong>{{ item.step }} pcs</strong></div>
          <div><span>표준 납기:</span> <strong>{{ item.lead_time }}일</strong></div>
        </div>

        <div class="tiers-box">
          <span class="t-lbl">구간단가:</span>
          <span v-for="(t, idx) in item.tiers" :key="idx" class="tier-pill">
            {{ t.min }}~{{ t.max || '+' }} pcs: ${{ t.price }}
          </span>
        </div>

        <div v-if="item.status === 'UNDER_REVIEW'" class="actions">
          <button class="btn-approve" @click="approve(item)">✓ 마켓 공개 승인 (PUBLISH)</button>
          <button class="btn-reject" @click="reject(item)">✕ 수정 보완 반려</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const items = ref([
  {
    id: 'item-01',
    title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩',
    supplier: 'Precision Korea',
    date: '2026-10-18',
    status: 'PUBLISHED',
    moq: 100,
    step: 10,
    lead_time: 14,
    tiers: [
      { min: 100, max: 499, price: '5.50' },
      { min: 500, max: 999, price: '4.80' },
      { min: 1000, max: null, price: '4.20' },
    ],
  },
  {
    id: 'item-02',
    title: '고온용 산업용 세라믹 히터 코어 220V 500W',
    supplier: 'Hansung Precision',
    date: '2026-10-18',
    status: 'UNDER_REVIEW',
    moq: 200,
    step: 20,
    lead_time: 20,
    tiers: [
      { min: 200, max: 999, price: '8.40' },
      { min: 1000, max: null, price: '6.90' },
    ],
  },
]);

function approve(item: any) {
  item.status = 'PUBLISHED';
  alert(`승인 완료: '${item.title}' 상품이 공개 카탈로그에 정상 노출됩니다.`);
}

function reject(item: any) {
  item.status = 'DRAFT';
  alert('수정 요청과 함께 반려 처리되었습니다.');
}
</script>

<style scoped>
.moderation-page { max-width: 1000px; margin: 0 auto; }
h2 { margin: 0 0 6px 0; font-size: 20px; color: #F8FAFC; }
.subtitle { color: #94A3B8; font-size: 13px; margin-bottom: 24px; }
.item-list { display: flex; flex-direction: column; gap: 20px; }
.mod-card { background: #1C2541; border: 1px solid #3A506B; border-radius: 8px; padding: 20px; }
.card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; border-bottom: 1px solid #3A506B; padding-bottom: 12px; }
.title { margin: 0 0 4px 0; font-size: 16px; color: #FFF; }
.sub { font-size: 12px; color: #94A3B8; }
.badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
.badge.published { background: #065F46; color: #A7F3D0; }
.badge.under_review { background: #854D0E; color: #FEF08A; }
.info-row { display: flex; gap: 24px; font-size: 13px; margin-bottom: 12px; color: #CBD5E1; }
.tiers-box { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 16px; }
.t-lbl { color: #94A3B8; }
.tier-pill { background: #0B132B; border: 1px solid #3A506B; padding: 2px 8px; border-radius: 4px; color: #38BDF8; font-variant-numeric: tabular-nums; }
.actions { display: flex; gap: 12px; }
.btn-approve { background: #059669; color: #FFF; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 700; cursor: pointer; }
.btn-reject { background: #DC2626; color: #FFF; border: none; padding: 8px 16px; border-radius: 4px; font-weight: 700; cursor: pointer; }
</style>
