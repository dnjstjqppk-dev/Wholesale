<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">W</div>
        <div>
          <h2>Wholesale Admin</h2>
          <span class="sub">운영 관리 및 거버넌스</span>
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
        <div class="admin-profile">
          <strong>최고운영관리자 (Ops Lead)</strong>
          <small>Audit Log: ACTIVE (불변)</small>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-wrapper">
      <header class="topbar">
        <div class="breadcrumb">
          <span>플랫폼 어드민</span> &gt; <strong>{{ activeTabLabel }}</strong>
        </div>
        <div class="topbar-actions">
          <button class="reconcile-btn" @click="runDailyReconciliation">
            ⚡ PG 및 원장 일일 대사 실행
          </button>
        </div>
      </header>

      <main class="content-body">
        <!-- 1. Dashboard Tab -->
        <section v-if="currentTab === 'dashboard'" class="tab-content">
          <div class="kpi-grid">
            <div class="card kpi">
              <span class="kpi-title">플랫폼 일 거래총액 (GMV)</span>
              <span class="kpi-value">$ 1,280,000</span>
              <span class="kpi-sub green">전일 대비 +8.4%</span>
            </div>
            <div class="card kpi">
              <span class="kpi-title">공급사 실사 심사 대기</span>
              <span class="kpi-value">{{ pendingVerificationsCount }}건</span>
              <span class="kpi-sub orange">처리 기한 24시간 이내</span>
            </div>
            <div class="card kpi">
              <span class="kpi-title">활성 분쟁 (Dispute)</span>
              <span class="kpi-value">{{ activeDisputesCount }}건</span>
              <span class="kpi-sub red">정산 동결액 $ 45,000</span>
            </div>
            <div class="card kpi">
              <span class="kpi-title">PG 입금 대사 일치율</span>
              <span class="kpi-value">100.0%</span>
              <span class="kpi-sub green">차대변 불일치 0건</span>
            </div>
          </div>
        </section>

        <!-- 2. Verifications Tab -->
        <section v-if="currentTab === 'verifications'" class="tab-content">
          <div class="card table-card">
            <div class="table-header">
              <h3>공급사 실사 및 Verified Supplier 인증 심사</h3>
              <p>사업자등록증, 공장 실사 보고서, ISO 인증서를 대조하여 승인/반려합니다.</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>신청번호</th>
                  <th>기업명</th>
                  <th>사업자등록번호</th>
                  <th>제조/무역 유형</th>
                  <th>제출 서류</th>
                  <th>상태</th>
                  <th>심사 결정</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in verifications" :key="v.id">
                  <td class="mono">{{ v.id }}</td>
                  <td><strong>{{ v.companyName }}</strong></td>
                  <td class="mono">{{ v.businessNumber }}</td>
                  <td>{{ v.businessType }}</td>
                  <td><a :href="v.docUrl" target="_blank" class="link">서류 열람 ↗</a></td>
                  <td><span :class="['status-tag', v.status.toLowerCase()]">{{ v.status }}</span></td>
                  <td>
                    <div v-if="v.status === 'PENDING'" class="btn-group">
                      <button class="small-btn green" @click="approveVerification(v)">승인</button>
                      <button class="small-btn red" @click="rejectVerification(v)">반려</button>
                    </div>
                    <span v-else class="text-muted">심사 완료</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 3. Disputes & Arbitration Tab -->
        <section v-if="currentTab === 'disputes'" class="tab-content">
          <div class="card table-card">
            <div class="table-header">
              <h3>거래 분쟁 중재 및 에스크로 정산 동결 관리</h3>
              <p>분쟁이 제기된 주문의 정산금은 자동으로 동결(HELD)되며, 중재 완료 후 환불 또는 해제됩니다.</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>분쟁 ID</th>
                  <th>주문 번호</th>
                  <th>신청 기업 (구매사)</th>
                  <th>분쟁 사유</th>
                  <th>청구 금액</th>
                  <th>정산 상태</th>
                  <th>중재 액션</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in disputes" :key="d.id">
                  <td class="mono">{{ d.id }}</td>
                  <td class="mono">{{ d.orderNumber }}</td>
                  <td>{{ d.buyerName }}</td>
                  <td>{{ d.reason }}</td>
                  <td><strong>${{ (d.amountMinor / 100).toLocaleString() }}</strong></td>
                  <td><span class="status-tag held">SETTLEMENT_FROZEN</span></td>
                  <td>
                    <div class="btn-group">
                      <button class="small-btn orange" @click="arbitrateRefund(d)">부분 환불 집행</button>
                      <button class="small-btn blue" @click="resolveDispute(d)">분쟁 기각/동결 해제</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 4. Reconciliation Tab -->
        <section v-if="currentTab === 'reconciliation'" class="tab-content">
          <div class="card table-card">
            <div class="table-header">
              <h3>복식부기 원장 및 일일 PG 거래 대사</h3>
              <p>PG 매입 거래와 내부 원장 전표의 일치 여부를 대조하고 통화별 차이를 검증합니다.</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>대사 일자</th>
                  <th>통화</th>
                  <th>PG 총 매입액</th>
                  <th>원장 총 차변액</th>
                  <th>원장 총 대변액</th>
                  <th>불일치 차액</th>
                  <th>대사 상태</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rec in reconciliations" :key="rec.date">
                  <td>{{ rec.date }}</td>
                  <td><strong>{{ rec.currency }}</strong></td>
                  <td>${{ (rec.pgTotal / 100).toLocaleString() }}</td>
                  <td>${{ (rec.debitTotal / 100).toLocaleString() }}</td>
                  <td>${{ (rec.creditTotal / 100).toLocaleString() }}</td>
                  <td><strong class="green-text">$0.00</strong></td>
                  <td><span class="status-tag matched">MATCHED</span></td>
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
  { id: 'dashboard', label: '운영 개요', icon: '📈' },
  { id: 'verifications', label: '공급사 심사', icon: '🛡️' },
  { id: 'disputes', label: '분쟁 및 중재', icon: '⚖️' },
  { id: 'reconciliation', label: '회계 원장 대사', icon: '📑' },
]

const activeTabLabel = computed(() => {
  const t = tabs.find((x) => x.id === currentTab.value)
  return t ? t.label : ''
})

const verifications = ref([
  {
    id: 'VER-2026-001',
    companyName: '태양금속정밀 주식회사',
    businessNumber: '214-88-12345',
    businessType: 'MANUFACTURER',
    docUrl: '#',
    status: 'PENDING',
  },
  {
    id: 'VER-2026-002',
    companyName: '한양하이테크',
    businessNumber: '110-81-99887',
    businessType: 'OEM_ODM',
    docUrl: '#',
    status: 'APPROVED',
  },
])

const disputes = ref([
  {
    id: 'DISP-2026-004',
    orderNumber: 'ORD-20261017-092',
    buyerName: 'EuroTrade GMBH',
    reason: '검수 결과 허용 공차 초과 (불량률 4.2%)',
    amountMinor: 850000,
    status: 'OPENED',
  },
])

const reconciliations = ref([
  {
    date: '2026-10-18',
    currency: 'USD',
    pgTotal: 128000000,
    debitTotal: 128000000,
    creditTotal: 128000000,
    difference: 0,
    status: 'MATCHED',
  },
])

const pendingVerificationsCount = computed(() => verifications.value.filter((v) => v.status === 'PENDING').length)
const activeDisputesCount = computed(() => disputes.value.length)

function approveVerification(v: any) {
  v.status = 'APPROVED'
  alert(`[심사 승인] ${v.companyName}에 Verified Supplier 배지가 부여되었습니다.`)
}

function rejectVerification(v: any) {
  v.status = 'REJECTED'
  alert(`[심사 반려] ${v.companyName}의 서류 보완 요청을 발송했습니다.`)
}

function arbitrateRefund(d: any) {
  alert(`[분쟁 중재] 주문 ${d.orderNumber}에 대해 $${(d.amountMinor / 100).toLocaleString()} 부분 환불 및 복식 원장 역분개를 집행합니다.`)
}

function resolveDispute(d: any) {
  alert(`[분쟁 기각] 주문 ${d.orderNumber}의 정산 동결을 해제하고 공급사 정산 적격으로 전환합니다.`)
}

function runDailyReconciliation() {
  alert('PG사 거래 내역 1,420건과 내부 복식 원장을 실시간 대사했습니다. 차액 0건으로 검증되었습니다.')
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #F6F8FB;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #172B4D;
}

.sidebar {
  width: 250px;
  background-color: #0F172A;
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
  background-color: #DC2626;
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
  color: #94A3B8;
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
  background-color: #1E293B;
  color: #38BDF8;
  font-weight: 600;
  border-left: 3px solid #38BDF8;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-profile strong {
  display: block;
  font-size: 13px;
  color: #F8FAFC;
}

.admin-profile small {
  font-size: 11px;
  color: #10B981;
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

.reconcile-btn {
  background-color: #1E293B;
  color: #F8FAFC;
  border: 1px solid #334155;
  padding: 10px 18px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reconcile-btn:hover {
  background-color: #0F172A;
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
.kpi-sub.orange { color: #D97706; font-weight: 600; }
.kpi-sub.red { color: #DC2626; font-weight: 600; }

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

.link {
  color: #2563EB;
  text-decoration: none;
  font-weight: 500;
}

.status-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-tag.pending { background: #FEF3C7; color: #B45309; }
.status-tag.approved { background: #DCFCE7; color: #15803D; }
.status-tag.held { background: #FEE2E2; color: #B91C1C; }
.status-tag.matched { background: #DCFCE7; color: #15803D; }

.btn-group {
  display: flex;
  gap: 8px;
}

.small-btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.small-btn.green { background: #15803D; color: #FFFFFF; }
.small-btn.red { background: #DC2626; color: #FFFFFF; }
.small-btn.orange { background: #D97706; color: #FFFFFF; }
.small-btn.blue { background: #2563EB; color: #FFFFFF; }

.green-text { color: #15803D; }
.text-muted { color: #94A3B8; font-size: 12px; }
</style>
