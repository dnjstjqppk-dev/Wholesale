<template>
  <div class="buyer-layout">
    <!-- Top Utility Bar -->
    <div class="utility-bar">
      <div class="container util-inner">
        <div class="util-left">
          <span>글로벌 도매 B2B 플랫폼</span>
          <span class="sep">|</span>
          <span>배송국가: <strong>🇰🇷 대한민국 (KR)</strong></span>
        </div>
        <div class="util-right">
          <span>통화: <strong>USD ($)</strong></span>
          <span class="sep">|</span>
          <span>언어: <strong>한국어</strong></span>
          <span class="sep">|</span>
          <span class="auth-link">Metro Wholesale LLC (구매사)</span>
        </div>
      </div>
    </div>

    <!-- Main Navigation Header -->
    <header class="main-header">
      <div class="container header-inner">
        <div class="brand">
          <div class="logo">W</div>
          <div>
            <h1>WHOLESALE</h1>
            <span class="tagline">Global B2B Sourcing Platform</span>
          </div>
        </div>

        <div class="search-box">
          <select v-model="searchType" class="search-type">
            <option value="PRODUCTS">상품 검색</option>
            <option value="SUPPLIERS">공급사 검색</option>
          </select>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="수량별 도매단가, 인증 제조사, 원부자재 검색..."
            @keyup.enter="handleSearch"
          />
          <button class="search-btn" @click="handleSearch">검색</button>
        </div>

        <div class="header-actions">
          <button class="rfq-cta-btn" @click="currentView = 'rfq-new'">
            + RFQ 견적 의뢰
          </button>
        </div>
      </div>
    </header>

    <!-- Sub-navigation -->
    <nav class="sub-nav">
      <div class="container sub-inner">
        <button
          v-for="item in navItems"
          :key="item.id"
          :class="['sub-link', { active: currentView === item.id }]"
          @click="currentView = item.id"
        >
          {{ item.label }}
        </button>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main class="main-content container">
      <!-- 1. Catalog & Search View -->
      <section v-if="currentView === 'catalog'" class="catalog-view">
        <!-- Multi-filter bar -->
        <div class="filter-panel">
          <div class="filter-group">
            <label>공급사 인증</label>
            <label class="checkbox-label">
              <input v-model="verifiedOnly" type="checkbox" /> Verified Supplier (공장 실사 완료)
            </label>
          </div>
          <div class="filter-group">
            <label>최소 발주 수량 (MOQ)</label>
            <select v-model="moqFilter">
              <option value="ALL">전체</option>
              <option value="100">100 pcs 이하</option>
              <option value="500">500 pcs 이하</option>
              <option value="1000">1,000 pcs 이하</option>
            </select>
          </div>
          <div class="filter-group">
            <label>거래 조건 (Incoterms)</label>
            <select v-model="incotermFilter">
              <option value="ALL">전체 (FOB / CIF / DDP)</option>
              <option value="FOB">FOB (본선 인도)</option>
              <option value="CIF">CIF (운임·보험료 포함)</option>
              <option value="DDP">DDP (관세지급 인도)</option>
            </select>
          </div>
        </div>

        <!-- Product Grid -->
        <div class="product-grid">
          <div
            v-for="p in filteredProducts"
            :key="p.id"
            class="product-card"
            @click="selectProduct(p)"
          >
            <div class="badge-row">
              <span v-if="p.isVerified" class="badge verified">✓ Verified Supplier</span>
              <span class="badge moq">MOQ {{ p.moq }} {{ p.unit }}</span>
            </div>
            <h3 class="product-title">{{ p.name }}</h3>
            <p class="supplier-name">{{ p.supplierName }} · {{ p.country }}</p>

            <!-- Tiered Price Matrix Table -->
            <div class="tier-matrix">
              <div
                v-for="(t, idx) in p.tiers"
                :key="idx"
                class="tier-col"
              >
                <div class="tier-qty">{{ t.range }}</div>
                <div class="tier-price">${{ t.price }}</div>
              </div>
            </div>

            <div class="card-footer">
              <span class="lead-time">표준 납기: {{ p.leadTime }}일</span>
              <button class="view-btn">상세보기 &gt;</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Product Detail Page (PDP) -->
      <section v-if="currentView === 'pdp' && selectedProduct" class="pdp-view">
        <button class="back-link" @click="currentView = 'catalog'">&larr; 상품 목록으로 돌아가기</button>
        <div class="pdp-grid">
          <!-- Left: Gallery & Specs -->
          <div class="pdp-main">
            <div class="pdp-header">
              <span v-if="selectedProduct.isVerified" class="badge verified">✓ Verified Supplier 실사 인증</span>
              <h2>{{ selectedProduct.name }}</h2>
              <p class="pdp-supplier">공급사: <strong>{{ selectedProduct.supplierName }}</strong> ({{ selectedProduct.country }})</p>
            </div>

            <div class="pdp-specs card">
              <h3>제품 상세 규격 및 상업 조건</h3>
              <table class="specs-table">
                <tbody>
                  <tr>
                    <th>최소 발주 수량 (MOQ)</th>
                    <td>{{ selectedProduct.moq }} {{ selectedProduct.unit }}</td>
                    <th>발주 단위 (Step)</th>
                    <td>{{ selectedProduct.quantityStep }} {{ selectedProduct.unit }} 배수</td>
                  </tr>
                  <tr>
                    <th>표준 제조 납기</th>
                    <td>{{ selectedProduct.leadTime }}일 이내 출고</td>
                    <th>인코텀즈 (Incoterms)</th>
                    <td>FOB Busan (수출국 선적 기준)</td>
                  </tr>
                  <tr>
                    <th>샘플 지원 여부</th>
                    <td>유료 샘플 주문 가능 (본주문 시 공제)</td>
                    <th>OEM / ODM 맞춤가공</th>
                    <td>로고 인쇄 (MOQ 500), 맞춤 패키징 가능</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Right: Interactive Sourcing & Order Matrix Panel -->
          <div class="pdp-action-panel card">
            <h3>실시간 수량 구간별 도매 공급가 계산기</h3>
            <p class="panel-desc">희망 발주 수량을 입력하면 해당하는 구간 단가와 총액이 실시간 산출됩니다.</p>

            <div class="tier-breakdown">
              <div
                v-for="(t, idx) in selectedProduct.tiers"
                :key="idx"
                :class="['tier-row', { active: activeTierIndex === idx }]"
              >
                <span>{{ t.range }}</span>
                <strong>${{ t.price }} / {{ selectedProduct.unit }}</strong>
              </div>
            </div>

            <div class="calculator-box">
              <label>발주 수량 입력 ({{ selectedProduct.unit }}):</label>
              <input
                v-model.number="orderQuantity"
                type="number"
                :min="selectedProduct.moq"
                :step="selectedProduct.quantityStep"
                @input="calculatePrice"
              />
              <span v-if="calcError" class="calc-err">{{ calcError }}</span>
            </div>

            <div v-if="calculatedTotal" class="total-summary">
              <div class="summary-line">
                <span>적용 단가:</span>
                <strong>${{ calculatedUnitPrice }} / {{ selectedProduct.unit }}</strong>
              </div>
              <div class="summary-line highlight">
                <span>예상 거래 총액:</span>
                <strong>${{ calculatedTotal.toLocaleString() }}</strong>
              </div>
              <div class="summary-sub">
                * 계약금 30% (${{ (calculatedTotal * 0.3).toLocaleString() }}) 결제 후 생산 시작
              </div>
            </div>

            <div class="btn-stack">
              <button class="primary-btn" :disabled="!!calcError" @click="proceedToOrder">
                발주 요청서(Order) 생성
              </button>
              <button class="secondary-btn" @click="currentView = 'rfq-new'">
                맞춤 사양 RFQ 발행하기
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. New RFQ View -->
      <section v-if="currentView === 'rfq-new'" class="rfq-view card">
        <h2>신규 견적 의뢰서 (RFQ) 발행</h2>
        <p class="rfq-desc">요구 사양, 수량, 목표 단가를 등록하면 적격 검증 공급사들의 비교 견적을 받으실 수 있습니다.</p>

        <form class="rfq-form" @submit.prevent="submitRFQ">
          <div class="form-row">
            <label>프로젝트 / 품목명</label>
            <input v-model="rfqForm.title" type="text" placeholder="예: 2026 친환경 패키징 쇼핑백 대량 조달" required />
          </div>

          <div class="form-grid-2">
            <div class="form-row">
              <label>목표 조달 수량</label>
              <input v-model.number="rfqForm.quantity" type="number" min="1" required />
            </div>
            <div class="form-row">
              <label>단위</label>
              <select v-model="rfqForm.unit">
                <option value="pcs">개 (pcs)</option>
                <option value="boxes">박스 (boxes)</option>
                <option value="kg">킬로그램 (kg)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <label>상세 사양 및 규격 (Specifications)</label>
            <textarea v-model="rfqForm.specs" rows="4" placeholder="소재, 규격, 색상, 허용 공차, 인증 요구사항을 상세히 작성해주세요." required></textarea>
          </div>

          <div class="form-grid-2">
            <div class="form-row">
              <label>도착국가</label>
              <input v-model="rfqForm.country" type="text" value="대한민국" required />
            </div>
            <div class="form-row">
              <label>희망 납기일</label>
              <input v-model="rfqForm.leadTimeDays" type="number" placeholder="예: 30일 이내" required />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="primary-btn">RFQ 공개 시장에 발행하기</button>
            <button type="button" class="cancel-btn" @click="currentView = 'catalog'">취소</button>
          </div>
        </form>
      </section>

      <!-- 4. Orders & Approvals View -->
      <section v-if="currentView === 'orders'" class="orders-view">
        <div class="card table-card">
          <div class="table-header">
            <h3>내 기업 발주 및 무역 계약 진행 현황</h3>
            <p>전자 서명 완료된 무역 계약(Incoterms 2020), 분할 결제 및 분할 출고 추적</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>주문 번호</th>
                <th>공급사</th>
                <th>품목 및 수량</th>
                <th>총 거래액</th>
                <th>계약 서명</th>
                <th>결제 상태</th>
                <th>주문 업무 상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in buyerOrders" :key="o.id">
                <td class="mono">{{ o.orderNumber }}</td>
                <td>{{ o.supplierName }}</td>
                <td>{{ o.productName }} ({{ o.quantity }} pcs)</td>
                <td><strong>${{ (o.amountMinor / 100).toLocaleString() }}</strong></td>
                <td>
                  <span v-if="o.isContractSigned" class="status-tag signed">✓ 쌍방 서명 완료</span>
                  <button v-else class="small-btn orange" @click="signContract(o)">계약서 전자 서명</button>
                </td>
                <td>
                  <span class="status-tag partial-paid">{{ o.paymentStatus }}</span>
                </td>
                <td>
                  <span class="status-tag in-production">{{ o.orderStatus }}</span>
                </td>
                <td>
                  <button class="small-btn blue" @click="viewTimeline(o)">추적 타임라인</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="buyer-footer">
      <div class="container footer-inner">
        <p>© 2026 WHOLESALE Platform. All rights reserved. Enterprise B2B Trade Architecture.</p>
        <p class="footer-sub">모든 거래는 SHA-256 서명 무역 계약 및 에스크로 정산 원장 규칙에 따라 보호됩니다.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const currentView = ref('catalog')
const searchType = ref('PRODUCTS')
const searchQuery = ref('')
const verifiedOnly = ref(false)
const moqFilter = ref('ALL')
const incotermFilter = ref('ALL')

const navItems = [
  { id: 'catalog', label: '도매 상품 탐색' },
  { id: 'orders', label: '발주 및 계약 관리' },
  { id: 'rfq-new', label: '신규 RFQ 견적의뢰' },
]

const products = ref([
  {
    id: 'PRD-001',
    name: '산업용 초경량 진공 스테인리스 텀블러 벌크팩',
    supplierName: 'Precision Korea Co.',
    country: '대한민국',
    isVerified: true,
    moq: 100,
    quantityStep: 10,
    unit: 'pcs',
    leadTime: 14,
    tiers: [
      { range: '100 ~ 499 pcs', price: '5.50', min: 100, max: 499, val: 5.5 },
      { range: '500 ~ 999 pcs', price: '4.80', min: 500, max: 999, val: 4.8 },
      { range: '1,000+ pcs', price: '4.20', min: 1000, max: null, val: 4.2 },
    ],
  },
  {
    id: 'PRD-002',
    name: '친환경 크라프트 파우치 지퍼백 (식품 포장용 500g)',
    supplierName: 'EcoPack Global',
    country: '대한민국',
    isVerified: true,
    moq: 500,
    quantityStep: 50,
    unit: 'pcs',
    leadTime: 20,
    tiers: [
      { range: '500 ~ 1,999 pcs', price: '0.45', min: 500, max: 1999, val: 0.45 },
      { range: '2,000 ~ 4,999 pcs', price: '0.38', min: 2000, max: 4999, val: 0.38 },
      { range: '5,000+ pcs', price: '0.32', min: 5000, max: null, val: 0.32 },
    ],
  },
])

const filteredProducts = computed(() => {
  return products.value.filter((p) => {
    if (verifiedOnly.value && !p.isVerified) return false
    if (moqFilter.value !== 'ALL' && p.moq > Number(moqFilter.value)) return false
    if (searchQuery.value && !p.name.includes(searchQuery.value)) return false
    return true
  })
})

const selectedProduct = ref<any>(null)
const orderQuantity = ref(100)
const calculatedUnitPrice = ref('5.50')
const calculatedTotal = ref(550)
const calcError = ref('')
const activeTierIndex = ref(0)

function selectProduct(p: any) {
  selectedProduct.value = p
  orderQuantity.value = p.moq
  calculatePrice()
  currentView.value = 'pdp'
}

function calculatePrice() {
  if (!selectedProduct.value) return
  const p = selectedProduct.value
  const q = orderQuantity.value

  if (q < p.moq) {
    calcError.value = `최소 발주 수량(MOQ: ${p.moq} ${p.unit}) 이상 입력해야 합니다.`
    calculatedTotal.value = 0
    return
  }

  const diff = q - p.moq
  if (p.quantityStep > 0 && diff % p.quantityStep !== 0) {
    calcError.value = `발주 단위 배수(${p.quantityStep} ${p.unit}) 단위로 증량해야 합니다.`
    calculatedTotal.value = 0
    return
  }

  calcError.value = ''
  // Find tier
  let matchedTier = p.tiers[0]
  let idx = 0
  for (let i = 0; i < p.tiers.length; i++) {
    const t = p.tiers[i]
    if (q >= t.min) {
      if (t.max === null || q <= t.max) {
        matchedTier = t
        idx = i
        break
      }
    }
  }

  activeTierIndex.value = idx
  calculatedUnitPrice.value = matchedTier.price
  calculatedTotal.value = Math.round(matchedTier.val * q * 100) / 100
}

function proceedToOrder() {
  alert(`주문서(ORD-20261018-99)가 생성되었습니다. 계약서 서명 단계로 이동합니다. 총액: $${calculatedTotal.value}`)
  currentView.value = 'orders'
}

const rfqForm = ref({
  title: '',
  quantity: 1000,
  unit: 'pcs',
  specs: '',
  country: '대한민국',
  leadTimeDays: 30,
})

function submitRFQ() {
  alert(`[RFQ 발행 완료] "${rfqForm.value.title}" 건이 적격 검증 공급사 시장에 게시되었습니다.`)
  currentView.value = 'catalog'
}

const buyerOrders = ref([
  {
    id: 'ORD-01',
    orderNumber: 'ORD-20261018-001',
    supplierName: 'Precision Korea Co.',
    productName: '초경량 스테인리스 텀블러',
    quantity: 1000,
    amountMinor: 420000,
    isContractSigned: true,
    paymentStatus: '30% 계약금 납입 완료',
    orderStatus: 'IN_PRODUCTION (생산 중)',
  },
])

function signContract(order: any) {
  order.isContractSigned = true
  alert(`[전자 서명 완료] 주문 ${order.orderNumber}의 계약서 해시 검증 및 서명이 완료되었습니다.`)
}

function viewTimeline(order: any) {
  alert(`주문 ${order.orderNumber} 타임라인: 계약금 수납 완료 -> 생산 공정률 65% -> 검수(Pre-shipment) 예정`)
}

function handleSearch() {
  currentView.value = 'catalog'
}
</script>

<style scoped>
.buyer-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #F6F8FB;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #172B4D;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.utility-bar {
  background-color: #0F243B;
  color: #94A3B8;
  font-size: 12px;
  padding: 8px 0;
}

.util-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sep {
  margin: 0 8px;
  color: #334155;
}

.auth-link {
  color: #F8FAFC;
  font-weight: 600;
}

.main-header {
  background-color: #173A5E;
  color: #FFFFFF;
  padding: 20px 0;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 44px;
  height: 44px;
  background-color: #C2410C;
  color: #FFFFFF;
  font-weight: 800;
  font-size: 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand h1 {
  font-size: 20px;
  margin: 0;
  letter-spacing: 0.5px;
}

.tagline {
  font-size: 11px;
  color: #93C5FD;
}

.search-box {
  display: flex;
  flex: 1;
  max-width: 600px;
  background: #FFFFFF;
  border-radius: 6px;
  overflow: hidden;
}

.search-type {
  border: none;
  background: #F1F5F9;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  outline: none;
}

.search-box input {
  flex: 1;
  border: none;
  padding: 12px 16px;
  font-size: 14px;
  outline: none;
}

.search-btn {
  background-color: #C2410C;
  color: #FFFFFF;
  border: none;
  padding: 0 24px;
  font-weight: 700;
  cursor: pointer;
}

.rfq-cta-btn {
  background-color: #C2410C;
  color: #FFFFFF;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.sub-nav {
  background-color: #FFFFFF;
  border-bottom: 1px solid #D8E0EB;
}

.sub-inner {
  display: flex;
  gap: 8px;
}

.sub-link {
  background: none;
  border: none;
  padding: 14px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  border-bottom: 3px solid transparent;
}

.sub-link.active {
  color: #C2410C;
  border-bottom-color: #C2410C;
}

.main-content {
  padding-top: 32px;
  padding-bottom: 48px;
  flex: 1;
}

.filter-panel {
  background: #FFFFFF;
  border: 1px solid #D8E0EB;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.filter-group label {
  font-weight: 600;
  color: #475569;
}

.filter-group select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #CBD5E1;
  font-size: 13px;
  background: #FFFFFF;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.product-card {
  background: #FFFFFF;
  border: 1px solid #D8E0EB;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.product-card:hover {
  border-color: #2563EB;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.badge-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
}

.badge.verified { background: #DCFCE7; color: #15803D; }
.badge.moq { background: #F1F5F9; color: #475569; }

.product-title {
  font-size: 16px;
  margin: 0 0 6px 0;
  color: #0F172A;
}

.supplier-name {
  font-size: 13px;
  color: #64748B;
  margin: 0 0 16px 0;
}

.tier-matrix {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  background: #F8FAFC;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
  margin-bottom: 16px;
}

.tier-col {
  text-align: center;
}

.tier-qty {
  font-size: 11px;
  color: #64748B;
}

.tier-price {
  font-size: 14px;
  font-weight: 800;
  color: #C2410C;
  margin-top: 2px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #64748B;
  border-top: 1px solid #F1F5F9;
  padding-top: 12px;
}

.view-btn {
  background: none;
  border: none;
  color: #2563EB;
  font-weight: 600;
  cursor: pointer;
}

/* PDP */
.back-link {
  background: none;
  border: none;
  color: #2563EB;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
}

.pdp-grid {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 32px;
}

.card {
  background: #FFFFFF;
  border: 1px solid #D8E0EB;
  border-radius: 8px;
  padding: 24px;
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  font-size: 13px;
}

.specs-table th {
  background: #F8FAFC;
  padding: 10px 14px;
  border: 1px solid #E2E8F0;
  text-align: left;
  color: #475569;
}

.specs-table td {
  padding: 10px 14px;
  border: 1px solid #E2E8F0;
}

.tier-breakdown {
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tier-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
  font-size: 13px;
}

.tier-row.active {
  background: #FFEDD5;
  border-color: #FB923C;
  color: #9A3412;
}

.calculator-box {
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.calculator-box label {
  font-size: 13px;
  font-weight: 600;
}

.calculator-box input {
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid #CBD5E1;
  font-size: 16px;
  font-weight: 700;
}

.calc-err {
  font-size: 12px;
  color: #DC2626;
  font-weight: 600;
}

.total-summary {
  background: #F8FAFC;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
  margin-bottom: 20px;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 6px;
}

.summary-line.highlight {
  font-size: 18px;
  color: #C2410C;
  font-weight: 800;
}

.summary-sub {
  font-size: 11px;
  color: #64748B;
  border-top: 1px solid #E2E8F0;
  padding-top: 8px;
  margin-top: 8px;
}

.btn-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.primary-btn {
  background: #C2410C;
  color: #FFFFFF;
  border: none;
  padding: 14px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  font-size: 15px;
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-btn {
  background: #FFFFFF;
  color: #173A5E;
  border: 1px solid #173A5E;
  padding: 12px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

/* Forms */
.rfq-form {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row label {
  font-size: 13px;
  font-weight: 600;
}

.form-row input, .form-row select, .form-row textarea {
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid #CBD5E1;
  font-size: 14px;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.cancel-btn {
  background: #F1F5F9;
  border: 1px solid #CBD5E1;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

/* Table */
.table-card { padding: 0; overflow: hidden; }
.table-header { padding: 20px 24px; border-bottom: 1px solid #D8E0EB; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { background: #F8FAFC; padding: 12px 20px; text-align: left; font-weight: 600; color: #475569; border-bottom: 1px solid #D8E0EB; }
td { padding: 14px 20px; border-bottom: 1px solid #F1F5F9; }
.mono { font-family: monospace; color: #64748B; font-size: 13px; }
.status-tag { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px; }
.status-tag.signed { background: #DCFCE7; color: #15803D; }
.status-tag.partial-paid { background: #FEF3C7; color: #B45309; }
.status-tag.in-production { background: #EDE9FE; color: #6D28D9; }
.small-btn { padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; }
.small-btn.orange { background: #C2410C; color: #FFFFFF; }
.small-btn.blue { background: #2563EB; color: #FFFFFF; }

.buyer-footer {
  background: #0F172A;
  color: #94A3B8;
  padding: 32px 0;
  font-size: 13px;
  text-align: center;
  border-top: 1px solid #1E293B;
}

.footer-sub {
  font-size: 11px;
  color: #64748B;
  margin-top: 6px;
}
</style>

