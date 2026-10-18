<template>
  <div class="partner-layout">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">W</div>
        <div>
          <h2>Wholesale Partner</h2>
          <span class="sub">공급사 업무 콘솔</span>
        </div>
      </div>

      <nav class="nav-menu">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['nav-item', { active: currentTab === tab.id }]"
          @click="currentTab = tab.id"
        >
          <span class="icon">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="verified-badge">
          <span class="dot">●</span> Verified Supplier
        </div>
        <div class="supplier-info">
          <strong>Precision Korea Co.</strong>
          <small>ID: 11111111-1111</small>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-wrapper">
      <header class="topbar">
        <div class="breadcrumb">
          <span>공급사 콘솔</span> &gt; <strong>{{ activeTabLabel }}</strong>
        </div>
        <div class="topbar-actions">
          <button class="action-btn" @click="openNewProductModal">+ 신규 도매상품 등록</button>
        </div>
      </header>

      <main class="content-body">
        <!-- 1. Dashboard Tab -->
        <section v-if="currentTab === 'dashboard'" class="tab-content">
          <div class="kpi-grid">
            <div class="card kpi">
              <span class="kpi-title">정산 가능 잔액</span>
              <span class="kpi-value">₩ 45,800,000</span>
              <span class="kpi-sub green">분쟁 보류금 ₩ 0</span>
            </div>
            <div class="card kpi">
              <span class="kpi-title">진행 중인 수주(발주)</span>
              <span class="kpi-value">12건</span>
              <span class="kpi-sub blue">생산 중 8건 · 검수 대기 4건</span>
            </div>
            <div class="card kpi">
              <span class="kpi-title">접수된 RFQ 견적의뢰</span>
              <span class="kpi-value">5건</span>
              <span class="kpi-sub orange">마감 임박 2건</span>
            </div>
            <div class="card kpi">
              <span class="kpi-title">가용 재고 현황</span>
              <span class="kpi-value">9,400 pcs</span>
              <span class="kpi-sub">총 10,000 pcs 중 600 pcs 예약</span>
            </div>
          </div>
        </section>

        <!-- 2. Products Tab -->
        <section v-if="currentTab === 'products'" class="tab-content">
          <div class="card table-card">
            <div class="table-header">
              <h3>등록 상품 및 구간단가표</h3>
              <p>수량 구간별 차등 단가(Tiered Pricing) 및 최소 발주 수량(MOQ) 설정</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>상품 식별자 / SKU</th>
                  <th>상품명</th>
                  <th>MOQ / 단위</th>
                  <th>수량 구간별 단가 (USD)</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in products" :key="p.id">
                  <td class="mono">{{ p.sku }}</td>
                  <td><strong>{{ p.name }}</strong></td>
                  <td>{{ p.moq }} {{ p.unit }}</td>
                  <td>
                    <div class="tier-pills">
                      <span v-for="(t, idx) in p.tiers" :key="idx" class="tier-pill">
                        {{ t.range }}: <strong>${{ t.price }}</strong>
                      </span>
                    </div>
                  </td>
                  <td><span class="status-tag published">{{ p.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 3. RFQs & Quotes Tab -->
        <section v-if="currentTab === 'rfqs'" class="tab-content">
          <div class="card table-card">
            <div class="table-header">
              <h3>매칭된 구매자 RFQ 및 견적서 발행</h3>
              <p>구매자의 요구 규격, 수량, 목표단가를 확인하고 견적서(Quote Revision)를 제출합니다.</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>RFQ 번호</th>
                  <th>구매 품목 및 사양</th>
                  <th>요청 수량</th>
                  <th>도착국 / 희망납기</th>
                  <th>견적 상태</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in rfqs" :key="r.id">
                  <td class="mono">{{ r.id }}</td>
                  <td><strong>{{ r.title }}</strong><br/><small>{{ r.specs }}</small></td>
                  <td>{{ r.quantity }} {{ r.unit }}</td>
                  <td>{{ r.destination }} · {{ r.leadTime }}일 이내</td>
                  <td><span class="status-tag quoted">{{ r.status }}</span></td>
                  <td>
                    <button class="small-btn orange" @click="openQuoteModal(r)">견적서 제출</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 4. Orders & Split Shipments Tab -->
        <section v-if="currentTab === 'orders'" class="tab-content">
          <div class="card table-card">
            <div class="table-header">
              <h3>수주 거래 및 분할 선적 관리</h3>
              <p>누적 출고 수량은 발주 수량을 초과할 수 없습니다. Incoterms 및 전자 서명된 무역 계약 확인</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>주문 번호</th>
                  <th>구매사</th>
                  <th>발주 수량</th>
                  <th>출고 완료 누적</th>
                  <th>잔여 미출고</th>
                  <th>거래 총액</th>
                  <th>상태</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="o in orders" :key="o.id">
                  <td class="mono">{{ o.orderNumber }}</td>
                  <td>{{ o.buyerName }}</td>
                  <td>{{ o.totalQty }} pcs</td>
                  <td><strong class="green-text">{{ o.shippedQty }} pcs</strong></td>
                  <td>{{ o.totalQty - o.shippedQty }} pcs</td>
                  <td><strong>${{ (o.amountMinor / 100).toLocaleString() }}</strong></td>
                  <td><span class="status-tag in-production">{{ o.status }}</span></td>
                  <td>
                    <button
                      class="small-btn blue"
                      :disabled="o.shippedQty >= o.totalQty"
                      @click="openShipmentModal(o)"
                    >
                      분할 출고 등록
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 5. Settlements Tab -->
        <section v-if="currentTab === 'settlements'" class="tab-content">
          <div class="card table-card">
            <div class="table-header">
              <h3>정산 원장 및 지급 내역</h3>
              <p>구매 확정 및 검수 통과 건에 대해 플랫폼 수수료(5%) 차감 후 정산 계좌로 입금됩니다.</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>정산 번호</th>
                  <th>거래 주문 번호</th>
                  <th>총 매출액 (Gross)</th>
                  <th>수수료 (5%)</th>
                  <th>실수령액 (Net Payout)</th>
                  <th>정산 상태</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in settlements" :key="s.id">
                  <td class="mono">{{ s.id }}</td>
                  <td class="mono">{{ s.orderNumber }}</td>
                  <td>${{ (s.gross / 100).toLocaleString() }}</td>
                  <td class="red-text">-${{ (s.fee / 100).toLocaleString() }}</td>
                  <td><strong>${{ (s.net / 100).toLocaleString() }}</strong></td>
                  <td><span class="status-tag released">{{ s.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const currentTab = ref('dashboard')

const tabs = [
  { id: 'dashboard', label: '대시보드', icon: '📊' },
  { id: 'products', label: '상품 및 구간단가', icon: '📦' },
  { id: 'rfqs', label: 'RFQ 시장 및 견적', icon: '📝' },
  { id: 'orders', label: '수주 및 출고관리', icon: '🚢' },
  { id: 'settlements', label: '정산 및 매출', icon: '💰' },
]

const activeTabLabel = computed(() => {
  const t = tabs.find((x) => x.id === currentTab.value)
  return t ? t.label : ''
})

const products = ref([
  {
    id: 'PRD-01',
    sku: 'SKU-TMB-500ML',
    name: '산업용 진공 스테인리스 텀블러 벌크팩',
    moq: 100,
    unit: 'pcs',
    status: 'PUBLISHED',
    tiers: [
      { range: '100~499', price: '5.50' },
      { range: '500~999', price: '4.80' },
      { range: '1,000+', price: '4.20' },
    ],
  },
])

const rfqs = ref([
  {
    id: 'RFQ-20261018-01',
    title: '식품 포장용 크라프트 파우치 (지퍼형)',
    specs: '크라프트+PE 코팅, 500g 용량, 친환경 인증 필수',
    quantity: 20000,
    unit: 'pcs',
    destination: '대한민국 부산항 (FOB)',
    leadTime: 30,
    status: 'OPEN_FOR_QUOTES',
  },
])

const orders = ref([
  {
    id: 'ORD-01',
    orderNumber: 'ORD-20261018-001',
    buyerName: 'Metro Wholesale Imports LLC',
    totalQty: 1000,
    shippedQty: 400,
    amountMinor: 420000,
    status: 'IN_PRODUCTION',
  },
])

const settlements = ref([
  {
    id: 'SET-2026-0091',
    orderNumber: 'ORD-20261015-084',
    gross: 1000000,
    fee: 50000,
    net: 950000,
    status: 'RELEASE_ELIGIBLE',
  },
])

function openNewProductModal() {
  alert('신규 상품 및 구간단가 등록 양식을 호출합니다.')
}

function openQuoteModal(rfq: any) {
  alert(`[견적 제출] ${rfq.title}에 대한 견적서(Quote Revision) 작성창을 엽니다.`)
}

function openShipmentModal(order: any) {
  const remain = order.totalQty - order.shippedQty
  alert(`[분할 출고 등록] 주문 ${order.orderNumber}의 잔여 수량 ${remain} pcs 범위 내에서 패킹리스트 및 운송장을 등록합니다.`)
}
</script>

<style scoped>
.partner-layout {
  display: flex;
  min-height: 100vh;
  background-color: #F6F8FB;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #172B4D;
}

.sidebar {
  width: 250px;
  background-color: #173A5E;
  color: #FFFFFF;
  display: flex;
  flex-direction: column;
}

.brand {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  width: 36px;
  height: 36px;
  background-color: #C2410C;
  color: #FFFFFF;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
}

.brand h2 {
  font-size: 16px;
  margin: 0;
  font-weight: 700;
}

.brand .sub {
  font-size: 12px;
  color: #93C5FD;
}

.nav-menu {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #E2E8F0;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  transition: all 0.15s ease;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.nav-item.active {
  background-color: #C2410C;
  color: #FFFFFF;
  font-weight: 600;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.verified-badge {
  font-size: 11px;
  font-weight: 600;
  color: #4ADE80;
  margin-bottom: 6px;
}

.verified-badge .dot {
  font-size: 8px;
}

.supplier-info strong {
  display: block;
  font-size: 13px;
}

.supplier-info small {
  font-size: 11px;
  color: #94A3B8;
  font-family: monospace;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.topbar {
  background-color: #FFFFFF;
  border-bottom: 1px solid #D8E0EB;
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.breadcrumb {
  font-size: 14px;
  color: #64748B;
}

.action-btn {
  background-color: #C2410C;
  color: #FFFFFF;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.content-body {
  padding: 32px;
  flex: 1;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.card {
  background: #FFFFFF;
  border-radius: 8px;
  border: 1px solid #D8E0EB;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.kpi-title {
  font-size: 13px;
  color: #64748B;
  display: block;
}

.kpi-value {
  font-size: 24px;
  font-weight: 700;
  color: #172B4D;
  margin: 6px 0;
  display: block;
}

.kpi-sub {
  font-size: 12px;
  color: #64748B;
}

.kpi-sub.green { color: #15803D; font-weight: 600; }
.kpi-sub.blue { color: #1D4ED8; font-weight: 600; }
.kpi-sub.orange { color: #C2410C; font-weight: 600; }

.table-card {
  padding: 0;
  overflow: hidden;
}

.table-header {
  padding: 20px 24px;
  border-bottom: 1px solid #D8E0EB;
}

.table-header h3 {
  font-size: 18px;
  margin: 0 0 4px 0;
}

.table-header p {
  font-size: 13px;
  color: #64748B;
  margin: 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th {
  background-color: #F8FAFC;
  padding: 12px 20px;
  text-align: left;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #D8E0EB;
}

td {
  padding: 14px 20px;
  border-bottom: 1px solid #F1F5F9;
}

.mono {
  font-family: monospace;
  color: #64748B;
  font-size: 13px;
}

.tier-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tier-pill {
  background: #F1F5F9;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #E2E8F0;
}

.status-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-tag.published { background: #DCFCE7; color: #15803D; }
.status-tag.quoted { background: #DBEAFE; color: #1D4ED8; }
.status-tag.in-production { background: #EDE9FE; color: #6D28D9; }
.status-tag.released { background: #DCFCE7; color: #15803D; }

.small-btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.small-btn.orange { background: #C2410C; color: #FFFFFF; }
.small-btn.blue { background: #1D4ED8; color: #FFFFFF; }
.small-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.green-text { color: #15803D; }
.red-text { color: #B91C1C; }
</style>
