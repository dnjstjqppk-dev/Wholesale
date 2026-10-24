<template>
  <div class="b2b-product-card">
    <!-- Thumbnail & Category Pill -->
    <div class="card-thumb" @click="$router.push(`/${locale}/${currency}/products/${item.id}`)">
      <img
        :src="item.thumbnail || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=400&q=80'"
        :alt="item.title"
        class="card-img"
      />
      <span class="cat-pill">{{ item.category }}</span>
      <span v-if="item.trade_assurance" class="ta-pill">🛡️ Trade Assurance</span>
      <span v-if="item.customization" class="oem-pill">OEM/ODM</span>
    </div>

    <!-- Card Body -->
    <div class="card-content">
      <!-- Supplier Profile -->
      <div class="supplier-strip">
        <span class="country-flag">🇰🇷</span>
        <span class="supplier-name" :title="item.supplier_name">{{ item.supplier_name }}</span>
        <span v-if="item.verified_supplier || item.is_verified_supplier" class="verified-gold">✓ Verified</span>
        <span class="years">{{ item.years_in_business || 10 }} yrs</span>
      </div>

      <!-- Product Title -->
      <router-link
        :to="`/${locale}/${currency}/products/${item.id}`"
        class="product-title"
        :title="item.title"
      >
        {{ item.title }}
      </router-link>

      <!-- Tiered Pricing Matrix Table (Alibaba Style) -->
      <div class="tier-matrix-table">
        <div class="tier-matrix-head">
          <span>수량 구간</span>
          <span>구간 단가</span>
        </div>
        <div v-for="(tier, idx) in item.price_tiers" :key="idx" class="tier-matrix-row">
          <span class="tier-qty">{{ tier.min_quantity }} ~ {{ tier.max_quantity || '+' }} {{ item.unit }}</span>
          <span class="tier-val">{{ formatPrice(tier.unit_price) }}</span>
        </div>
      </div>

      <!-- Metrics (MOQ, Lead Time, Rating) -->
      <div class="product-meta">
        <div class="meta-item">
          <span class="meta-k">MOQ:</span>
          <span class="meta-v">{{ item.moq }} {{ item.unit }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-k">표준 납기:</span>
          <span class="meta-v">{{ item.lead_time_days }}일</span>
        </div>
        <div class="meta-item">
          <span class="meta-k">응답률:</span>
          <span class="meta-v highlight">{{ item.response_rate || '99.2%' }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="card-action-bar">
        <button class="btn-inquiry" @click="$emit('inquiry', item)">
          💬 1:1 문의
        </button>
        <button class="btn-cart" @click="addToCart(item)" :disabled="addingCart">
          🛒 {{ addingCart ? '담는 중...' : '카트 담기' }}
        </button>
        <router-link
          :to="`/${locale}/${currency}/products/${item.id}`"
          class="btn-start-order"
        >
          상세 발주 ›
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { formatCurrency, SupportedCurrency } from '../i18n';
import { apiRequest } from '../api';

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
.b2b-product-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.b2b-product-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08);
  border-color: #FF6600;
}
.card-thumb {
  height: 180px;
  background: #F1F5F9;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}
.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}
.b2b-product-card:hover .card-img {
  transform: scale(1.03);
}
.cat-pill {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(15, 23, 42, 0.75);
  color: #FFF;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.ta-pill {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(15, 23, 42, 0.85);
  color: #38BDF8;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.oem-pill {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #EA580C;
  color: #FFF;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}
.card-content {
  padding: 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.supplier-strip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin-bottom: 8px;
}
.supplier-name {
  color: #64748B;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}
.verified-gold {
  background: #DCFCE7;
  color: #15803D;
  font-size: 10px;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 3px;
}
.years {
  color: #94A3B8;
  font-size: 11px;
  margin-left: auto;
}
.product-title {
  font-size: 13px;
  font-weight: 700;
  color: #1E293B;
  text-decoration: none;
  line-height: 1.4;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 38px;
}
.product-title:hover {
  color: #FF6600;
}
.tier-matrix-table {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}
.tier-matrix-head {
  display: flex;
  justify-content: space-between;
  background: #EDF2F7;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 700;
  color: #4A5568;
}
.tier-matrix-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  font-size: 11px;
  border-top: 1px solid #EDF2F7;
}
.tier-val {
  font-weight: 700;
  color: #EA580C;
}
.product-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #64748B;
  margin-bottom: 12px;
}
.highlight {
  color: #16A34A;
  font-weight: 700;
}
.card-action-bar {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  margin-top: auto;
}
.btn-inquiry, .btn-cart, .btn-start-order {
  padding: 6px 4px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  text-decoration: none;
  box-sizing: border-box;
}
.btn-inquiry {
  background: #FFF;
  border: 1px solid #CBD5E1;
  color: #334155;
}
.btn-cart {
  background: #FFF7ED;
  border: 1px solid #FDBA74;
  color: #EA580C;
}
.btn-start-order {
  background: #FF6A00;
  color: #FFF;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-start-order:hover {
  background: #E55E00;
}
</style>
