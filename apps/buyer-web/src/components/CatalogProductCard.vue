<template>
  <div class="b2b-product-card">
    <!-- Thumbnail & Category Pill -->
    <div class="card-thumb">
      <div class="img-mock">
        <span class="mock-text">{{ item.category_name }}</span>
      </div>
      <span class="cat-pill">{{ item.category }}</span>
      <span v-if="item.customization" class="oem-pill">OEM/ODM</span>
    </div>

    <!-- Card Body -->
    <div class="card-content">
      <!-- Supplier Profile -->
      <div class="supplier-strip">
        <span class="country-flag">🇰🇷</span>
        <span class="supplier-name" :title="item.supplier_name">{{ item.supplier_name }}</span>
        <span v-if="item.is_verified_supplier" class="verified-gold">✓ Verified</span>
        <span class="years">{{ item.years_in_business }} yrs</span>
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
          <span>단가 (FOB)</span>
        </div>
        <div v-for="(tier, idx) in item.price_tiers" :key="idx" class="tier-matrix-row">
          <span class="tier-qty">{{ tier.min_quantity }} ~ {{ tier.max_quantity || '+' }} {{ item.unit }}</span>
          <span class="tier-val">${{ tier.unit_price }}</span>
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
          <span class="meta-v highlight">{{ item.response_rate }}</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="card-action-bar">
        <button class="btn-inquiry" @click="$emit('inquiry', item)">
          ✉️ 견적 문의
        </button>
        <router-link
          :to="`/${locale}/${currency}/products/${item.id}`"
          class="btn-start-order"
        >
          즉시 발주서 작성
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  item: any;
  locale: string;
  currency: string;
}>();

defineEmits<{
  (e: 'inquiry', item: any): void;
}>();
</script>

<style scoped>
.b2b-product-card { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; transition: box-shadow 0.2s, border-color 0.2s; }
.b2b-product-card:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08); border-color: #FF6600; }
.card-thumb { height: 160px; background: #F1F5F9; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.img-mock { text-align: center; color: #94A3B8; font-size: 13px; font-weight: 600; padding: 12px; }
.cat-pill { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.6); color: #FFF; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.oem-pill { position: absolute; top: 10px; right: 10px; background: #EA580C; color: #FFF; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
.card-content { padding: 16px; display: flex; flex-direction: column; flex: 1; }
.supplier-strip { display: flex; align-items: center; gap: 6px; font-size: 12px; margin-bottom: 8px; }
.supplier-name { color: #64748B; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
.verified-gold { background: #FEF3C7; color: #B45309; font-size: 10px; font-weight: 800; padding: 1px 4px; border-radius: 3px; }
.years { color: #94A3B8; font-size: 11px; margin-left: auto; }
.product-title { font-size: 14px; font-weight: 700; color: #1E293B; text-decoration: none; line-height: 1.4; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 40px; }
.product-title:hover { color: #FF6600; }
.tier-matrix-table { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 10px; margin-bottom: 12px; }
.tier-matrix-head { display: flex; justify-content: space-between; font-size: 11px; color: #64748B; font-weight: 700; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 4px; }
.tier-matrix-row { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
.tier-qty { color: #475569; }
.tier-val { font-weight: 800; color: #FF6600; font-variant-numeric: tabular-nums; }
.product-meta { display: flex; justify-content: space-between; font-size: 12px; border-top: 1px solid #F1F5F9; padding-top: 10px; margin-bottom: 14px; }
.meta-item { display: flex; flex-direction: column; }
.meta-k { color: #94A3B8; font-size: 10px; }
.meta-v { color: #334155; font-weight: 700; margin-top: 2px; }
.meta-v.highlight { color: #16A34A; }
.card-action-bar { display: flex; gap: 8px; margin-top: auto; }
.btn-inquiry { flex: 1; background: #FFF; border: 1px solid #CBD5E1; color: #334155; padding: 8px 0; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
.btn-inquiry:hover { border-color: #FF6600; color: #FF6600; background: #FFF7ED; }
.btn-start-order { flex: 1; background: #1E293B; color: #FFF; text-align: center; text-decoration: none; padding: 8px 0; border-radius: 6px; font-size: 12px; font-weight: 700; transition: background 0.15s; }
.btn-start-order:hover { background: #FF6600; }
</style>
