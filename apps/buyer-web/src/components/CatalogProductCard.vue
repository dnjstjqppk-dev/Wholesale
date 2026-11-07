<template>
  <article class="cc-card">
    <div class="cc-media" @click="$router.push(`/${locale}/${currency}/products/${item.id}`)">
      <img
        :src="item.thumbnail || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=400&q=80'"
        :alt="item.title"
        loading="lazy"
      />
      <span class="ws-badge ws-badge-brand cc-cat">{{ item.category }}</span>
      <span class="ws-cluster cc-pills" style="gap: 6px">
        <span v-if="item.trade_assurance" class="ws-badge ws-badge-brand"><WsIcon name="shield" :size="12" /> TA</span>
        <span v-if="item.customization" class="ws-badge ws-badge-info">OEM/ODM</span>
      </span>
    </div>

    <div class="cc-body">
      <p class="cc-sup">
        <b :title="item.supplier_name">{{ item.supplier_name }}</b>
        <span v-if="item.verified_supplier || item.is_verified_supplier" class="ws-badge ws-badge-success">Verified</span>
        <span class="ws-muted yrs">{{ item.years_in_business || 10 }} yrs</span>
      </p>

      <router-link :to="`/${locale}/${currency}/products/${item.id}`" class="cc-title" :title="item.title">
        {{ item.title }}
      </router-link>

      <table class="ws-tier-table cc-tiers">
        <thead><tr><th>수량 구간</th><th style="text-align: right">구간 단가</th></tr></thead>
        <tbody>
          <tr v-for="(tier, idx) in item.price_tiers" :key="idx">
            <td>{{ tier.min_quantity }} ~ {{ tier.max_quantity || '+' }} {{ item.unit }}</td>
            <td style="text-align: right"><b class="ws-price-dark ws-figure">{{ formatPrice(tier.unit_price) }}</b></td>
          </tr>
        </tbody>
      </table>

      <p class="cc-meta"><span class="ws-moq meta-seg">MOQ: <b>{{ item.moq }}{{ item.unit }}</b></span> · <span class="meta-seg">납기 <b>{{ item.lead_time_days }}일</b></span> · <span class="meta-seg">응답률 <b>{{ item.response_rate || '99.2%' }}</b></span></p>

      <div class="cc-actions">
        <button class="ws-btn ws-btn-secondary ws-btn-sm" @click="$emit('inquiry', item)">
          <WsIcon name="chat" :size="13" /> 1:1 문의
        </button>
        <button class="ws-btn ws-btn-secondary ws-btn-sm" :disabled="addingCart" @click="addToCart(item)">
          <WsIcon name="cart" :size="13" /> {{ addingCart ? '담는 중...' : '카트 담기' }}
        </button>
        <router-link :to="`/${locale}/${currency}/products/${item.id}`" class="ws-btn ws-btn-accent ws-btn-sm">
          상세 발주 ›
        </router-link>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { formatCurrency, SupportedCurrency } from '../i18n';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const props = defineProps<{
  item: any;
  locale: string;
  currency: string;
}>();

const emit = defineEmits<{
  (e: 'inquiry', item: any): void;
}>();

const addingCart = ref(false);

function formatPrice(usdVal: string | number) {
  return formatCurrency(usdVal, (props.currency as SupportedCurrency) || 'KRW');
}

async function addToCart(item: any) {
  addingCart.value = true;
  try {
    const moq = parseInt(item.moq, 10) || 100;
    await apiRequest('/cart/items', {
      method: 'POST',
      body: JSON.stringify({
        listing_id: item.id,
        quantity: moq,
      }),
    });
    alert(`'${item.title}' 품목이 도매 카트에 ${moq}개 담겼습니다.`);
  } catch (err: any) {
    alert(`장바구니 담기 실패: ${err.message}`);
  } finally {
    addingCart.value = false;
  }
}
</script>

<style scoped>
.cc-card { background: #fff; border: 1px solid var(--ws-border-subtle); border-radius: var(--ws-radius-card); overflow: hidden; display: flex; flex-direction: column; box-shadow: var(--ws-shadow-card); transition: border-color 120ms ease; }
.cc-card:hover { border-color: var(--ws-brand); }
.cc-media { position: relative; aspect-ratio: 16 / 10; background: var(--ws-surface-muted); cursor: pointer; }
.cc-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.cc-cat { position: absolute; top: 10px; left: 10px; }
.cc-pills { position: absolute; bottom: 10px; left: 10px; }
.cc-body { padding: 14px; display: flex; flex-direction: column; flex: 1; }
.cc-sup { display: flex; align-items: center; gap: 7px; margin: 0 0 6px; font-size: 12px; }
.cc-sup b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.cc-sup .ws-badge, .cc-sup .yrs { flex: none; }
.cc-sup .yrs { white-space: nowrap; }
.cc-meta .meta-seg { white-space: nowrap; }
.cc-title { font-size: 14px; font-weight: 700; color: var(--ws-text); text-decoration: none; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 40px; margin-bottom: 8px; }
.cc-title:hover { color: var(--ws-brand); }
.cc-tiers { margin-bottom: 8px; }
.cc-tiers th, .cc-tiers td { padding: 6px 8px; font-size: 12px; }
.cc-meta { margin: 0 0 12px; font-size: 12px; color: var(--ws-text-2); }
.cc-actions { display: flex; gap: 6px; margin-top: auto; }
.cc-actions .ws-btn { flex: 1; padding-left: 6px; padding-right: 6px; }
</style>
