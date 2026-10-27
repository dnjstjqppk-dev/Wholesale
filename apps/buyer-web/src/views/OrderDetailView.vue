<template>
  <div class="order-detail-page">
    <div class="breadcrumb">
      <router-link :to="`/${currentLocale}/${currentCurrency}/orders`">← 발주 목록으로 돌아가기 (Orders)</router-link>
    </div>

    <!-- Alert / Toast -->
    <div v-if="toastMessage" class="toast-banner" :class="toastType">
      {{ toastMessage }}
    </div>

    <div v-if="loading" class="state-box">
      <p>발주 상세 내역 및 물류 상태를 불러오는 중입니다...</p>
    </div>

    <div v-else-if="!order" class="state-box">
      <p>주문 정보를 찾을 수 없습니다.</p>
    </div>

    <div v-else class="order-content">
      <!-- Top Overview Header -->
      <div class="order-header-card">
        <div class="header-left">
          <div class="order-num-row">
            <h2>발주 상세: {{ order.order_number }}</h2>
            <span class="ord-date">체결일: {{ formatDate(order.created_at) }}</span>
          </div>
          <p class="supplier-text">
            공급사: <strong>{{ order.supplier_name }}</strong>
            <span class="badge-verified">✓ Verified Supplier</span>
            <span class="badge-ta">🛡️ Trade Assurance</span>
          </p>
        </div>
        <div class="header-right">
          <span class="total-label">총 발주 금액 (Total):</span>
          <span class="total-amount">${{ (order.total_amount_minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</span>
        </div>
      </div>

      <!-- 5-Stage Milestone Timeline Tracker -->
      <div class="timeline-card">
        <h3>5대 무역 이행 마일스톤 추적 (Milestone Timeline)</h3>
        <div class="timeline-steps">
          <div class="timeline-step" :class="getStepClass(1)">
            <div class="step-num">1</div>
            <div class="step-info">
              <span class="step-title">계약 체결</span>
              <span class="step-status">{{ order.contract_hash ? '완료' : '서명 대기' }}</span>
            </div>
          </div>
          <div class="timeline-step" :class="getStepClass(2)">
            <div class="step-num">2</div>
            <div class="step-info">
              <span class="step-title">선급금 30%</span>
              <span class="step-status">{{ order.payment_status === 'DOWN_PAYMENT_PENDING' ? '결제 대기' : '에스크로 예치됨' }}</span>
            </div>
          </div>
          <div class="timeline-step" :class="getStepClass(3)">
            <div class="step-num">3</div>
            <div class="step-info">
              <span class="step-title">공장 생산 및 품질 검수</span>
              <span class="step-status">{{ order.inspection_status || '진행 중' }}</span>
            </div>
          </div>
          <div class="timeline-step" :class="getStepClass(4)">
            <div class="step-num">4</div>
            <div class="step-info">
              <span class="step-title">잔금 70%</span>
              <span class="step-status">{{ order.payment_status === 'FULLY_PAID' ? '예치 완료' : '결제 대기' }}</span>
            </div>
          </div>
          <div class="timeline-step" :class="getStepClass(5)">
            <div class="step-num">5</div>
            <div class="step-info">
              <span class="step-title">해상/항공 운송 및 인수</span>
              <span class="step-status">{{ order.order_status === 'COMPLETED' ? '인수 완료' : order.order_status }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Columns: Details + Actions -->
      <div class="detail-grid">
        <!-- Left: Item & Contract Details -->
        <div class="detail-left">
          <!-- Item Card -->
          <div class="card-box">
            <h4>발주 품목 명세 (Item Specification)</h4>
            <div class="item-detail-row">
              <div class="item-info">
                <h5>{{ order.item_title }}</h5>
                <p><strong>발주 수량:</strong> {{ order.ordered_quantity }} {{ order.unit }}</p>
                <p><strong>인도 조건:</strong> {{ order.incoterms || 'FOB Busan Port' }}</p>
                <p><strong>납기 기한:</strong> {{ order.lead_time_days }}일 이내</p>
                <p><strong>화물 배송 주소:</strong> {{ order.shipping_address || '450 Lexington Ave, New York, NY 10017, USA' }}</p>
              </div>
            </div>
          </div>

          <!-- Escrow Financial Breakdown -->
          <div class="card-box">
            <h4>무역 에스크로 정산 분할 (Financial Breakdown)</h4>
            <table class="financial-table">
              <tbody>
                <tr>
                  <td>1차 선급금 (30% Downpayment):</td>
                  <td class="font-bold text-right">
                    ${{ ((order.downpayment_minor || 126000) / 100).toLocaleString() }}
                    <span v-if="order.payment_status !== 'DOWN_PAYMENT_PENDING'" class="text-green-600 font-bold ml-2">✓ 예치됨</span>
                    <span v-else class="text-orange-600 font-bold ml-2">미결제</span>
                  </td>
                </tr>
                <tr>
                  <td>2차 잔금 (70% Balance):</td>
                  <td class="font-bold text-right">
                    ${{ ((order.balance_minor || 294000) / 100).toLocaleString() }}
                    <span v-if="order.payment_status === 'FULLY_PAID'" class="text-green-600 font-bold ml-2">✓ 예치됨</span>
                    <span v-else class="text-gray-400 ml-2">검수 후 예치</span>
                  </td>
                </tr>
                <tr class="total-row">
                  <td>합계 (Total Escrow Vault):</td>
                  <td class="font-bold text-right text-lg text-orange-600">
                    ${{ (order.total_amount_minor / 100).toLocaleString() }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Document Center -->
          <div class="card-box">
            <h4>무역 공식 증빙 서류 (Document Center)</h4>
            <div class="doc-list">
              <div class="doc-item">
                <span class="doc-icon">📄</span>
                <div class="doc-info">
                  <span class="doc-title">상업 송장 (Commercial Invoice)</span>
                  <span class="doc-sub">CI-{{ order.order_number }}.pdf</span>
                </div>
                <button class="btn-download" @click="downloadDoc('Commercial Invoice')">다운로드</button>
              </div>
              <div class="doc-item">
                <span class="doc-icon">📦</span>
                <div class="doc-info">
                  <span class="doc-title">포장 명세서 (Packing List)</span>
                  <span class="doc-sub">PL-{{ order.order_number }}.pdf</span>
                </div>
                <button class="btn-download" @click="downloadDoc('Packing List')">다운로드</button>
              </div>
              <div class="doc-item">
                <span class="doc-icon">🚢</span>
                <div class="doc-info">
                  <span class="doc-title">선하증권 (Ocean Bill of Lading)</span>
                  <span class="doc-sub">BL-MAERSK-998821.pdf</span>
                </div>
                <button class="btn-download" @click="downloadDoc('Bill of Lading')">다운로드</button>
              </div>
              <div class="doc-item">
                <span class="doc-icon">🔍</span>
                <div class="doc-info">
                  <span class="doc-title">SGS 국제 품질 검수 성적서 (Inspection Report)</span>
                  <span class="doc-sub">SGS-AQL-2.5-PASS.pdf</span>
                </div>
                <button class="btn-download" @click="downloadDoc('Inspection Report')">다운로드</button>
              </div>
            </div>
          </div>

          <!-- Real-Time Customs Declaration Manifest -->
          <div class="card-box customs-box">
            <div class="box-head-row">
              <h4>🏛️ 수출입 세관 통관 필증 원장 (Customs Manifest)</h4>
              <span class="customs-badge" :class="customsManifest?.customs_status?.toLowerCase() || 'cleared'">
                {{ customsManifest?.customs_status || 'CLEARED' }}
              </span>
            </div>
            <div class="customs-grid">
              <div class="cg-item">
                <span class="cg-lbl">수출신고번호:</span>
                <span class="cg-val font-mono">{{ customsManifest?.declaration_number || `EXP-KR-2026-${order.order_number?.replace(/\D/g, '') || '88391'}` }}</span>
              </div>
              <div class="cg-item">
                <span class="cg-lbl">HS 코드 (세번부호):</span>
                <span class="cg-val font-mono">{{ customsManifest?.hs_code || '7323.93.0000' }}</span>
              </div>
              <div class="cg-item">
                <span class="cg-lbl">적재항 (POL):</span>
                <span class="cg-val">{{ customsManifest?.port_of_loading || 'Busan Port (KRPUS)' }}</span>
              </div>
              <div class="cg-item">
                <span class="cg-lbl">양하항 (POD):</span>
                <span class="cg-val">{{ customsManifest?.port_of_discharge || 'Los Angeles (USLAX)' }}</span>
              </div>
              <div class="cg-item">
                <span class="cg-lbl">통관 관세사:</span>
                <span class="cg-val">{{ customsManifest?.customs_broker_name || 'Pantos Logistics Global' }}</span>
              </div>
              <div class="cg-item">
                <span class="cg-lbl">납부 관부가세:</span>
                <span class="cg-val text-green-700 font-bold">${{ ((customsManifest?.duty_tax_amount_minor || 27300) / 100).toFixed(2) }} (납부완료)</span>
              </div>
            </div>
            <div class="customs-foot">
              <span>수출 승인 면허: <code>{{ customsManifest?.export_license_number || 'EL-2026-KR-7711' }}</code></span>
              <button class="btn-sm-view" @click="openCustomsCert">📄 세관 필증 원본 열람</button>
            </div>
          </div>
        </div>

        <!-- Right: Actions & Timeline Events -->
        <div class="detail-right">
          <!-- Active Trade Assurance Claim Notice -->
          <div v-if="activeClaim" class="claim-status-card">
            <div class="claim-badge-row">
              <span class="claim-icon">🛡️</span>
              <span class="claim-title">Trade Assurance 무역 안심 보증 심사 진행 중</span>
              <span class="claim-stat-tag">{{ activeClaim.arbitration_status }}</span>
            </div>
            <p class="claim-meta">청구 유형: <strong>{{ activeClaim.claim_category }}</strong> | 청구액: <strong>${{ (activeClaim.claim_amount_minor / 100).toFixed(2) }}</strong></p>
            <p class="claim-desc">※ 플랫폼 중재관이 공급사의 선적 B/L 및 SGS 성적서를 대조 조사 중이며, 보증금 자동 환불 또는 정산 조정이 집행됩니다.</p>
          </div>

          <!-- Action Console -->
          <div class="card-box actions-console">
            <h4>발주 진행 조치 (Actions)</h4>

            <!-- 1. Sign Contract -->
            <div v-if="order.order_status === 'CONTRACT_PENDING'" class="action-block">
              <p class="action-desc">전자 무역 계약서 서명이 필요합니다.</p>
              <router-link
                :to="`/${currentLocale}/${currentCurrency}/orders/${order.id}/contract`"
                class="btn-full primary"
              >
                ✍️ 전자계약서 확인 및 서명하기
              </router-link>
            </div>

            <!-- 2. Pay 30% Downpayment -->
            <div v-if="order.payment_status === 'DOWN_PAYMENT_PENDING'" class="action-block">
              <p class="action-desc">생산 착수를 위해 선급금 30%를 에스크로에 예치하세요.</p>
              <button
                class="btn-full primary"
                :disabled="processingPayment"
                @click="payDownpayment"
              >
                {{ processingPayment ? '결제 처리 중...' : `선급금 30% ($${((order.downpayment_minor || 126000) / 100).toLocaleString()}) 결제` }}
              </button>
            </div>

            <!-- 3. Quality Inspection Approval -->
            <div v-if="order.order_status === 'IN_PRODUCTION' && order.inspection_status !== 'PASSED'" class="action-block">
              <p class="action-desc">SGS/TÜV 제3자 공장 사전 출고 검수 결과 승인이 가능합니다.</p>
              <button
                class="btn-full success"
                :disabled="approvingInspection"
                @click="approveInspection"
              >
                {{ approvingInspection ? '승인 중...' : '🔍 제3자 품질 검수(SGS) 합격 승인' }}
              </button>
            </div>

            <!-- 4. Pay 70% Balance -->
            <div v-if="order.payment_status === 'PARTIALLY_PAID_30' && (order.order_status === 'SHIPPED' || order.inspection_status === 'PASSED')" class="action-block">
              <p class="action-desc">검수 완료 후 화물 선적을 위해 잔금 70%를 에스크로에 예치하세요.</p>
              <button
                class="btn-full primary"
                :disabled="processingPayment"
                @click="payBalance"
              >
                {{ processingPayment ? '결제 처리 중...' : `잔금 70% ($${((order.balance_minor || 294000) / 100).toLocaleString()}) 결제 승인` }}
              </button>
            </div>

            <!-- 5. Confirm Delivery -->
            <div v-if="order.order_status === 'SHIPPED' && order.payment_status === 'FULLY_PAID'" class="action-block">
              <p class="action-desc">화물 인수를 최종 확인하고 에스크로 대금을 공급사로 지급합니다.</p>
              <button
                class="btn-full success"
                :disabled="confirmingDelivery"
                @click="confirmDelivery"
              >
                {{ confirmingDelivery ? '확인 중...' : '✓ 화물 최종 인수 확인 및 대금 지급 승인' }}
              </button>
            </div>

            <!-- 6. Dispute Claim Button -->
            <div class="dispute-block">
              <p class="dispute-desc">품질 불량, 수량 부족 또는 납기 지연이 발생했습니까?</p>
              <div class="dispute-btn-group">
                <button
                  class="btn-full danger"
                  @click="showClaimModal = true"
                >
                  🛡️ 100% Trade Assurance 보증 클레임 신청
                </button>
                <router-link
                  :to="`/${currentLocale}/${currentCurrency}/orders/${order.id}/dispute`"
                  class="btn-link-dispute"
                >
                  상세 분쟁 조정 및 소명 서류 제출 센터로 이동 ›
                </router-link>
              </div>
            </div>
          </div>

          <!-- Logistics Tracking Events Timeline -->
          <div class="card-box">
            <h4>실시간 화물 운송 추적 (Shipment Tracking)</h4>
            <div class="tracking-events">
              <div class="tracking-event active">
                <span class="event-dot"></span>
                <div class="event-body">
                  <span class="event-time">2026-10-24 14:00 (KST)</span>
                  <span class="event-desc font-bold">부산항 CY 통관 완료 및 본선 선적 (Vessel Departed)</span>
                  <span class="event-loc">Busan Port Container Terminal (KR)</span>
                </div>
              </div>
              <div class="tracking-event">
                <span class="event-dot"></span>
                <div class="event-body">
                  <span class="event-time">2026-10-23 09:30 (KST)</span>
                  <span class="event-desc">SGS 공장 출하 전 사전 검수 (MIL-STD-105E AQL 2.5 Pass)</span>
                  <span class="event-loc">Precision Korea Facility #2</span>
                </div>
              </div>
              <div class="tracking-event">
                <span class="event-dot"></span>
                <div class="event-body">
                  <span class="event-time">2026-10-18 10:15 (KST)</span>
                  <span class="event-desc">정식 무역 발주 및 30% 선급금 에스크로 입금 확인</span>
                  <span class="event-loc">Wholesale Escrow Vault</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Trade Assurance Guarantee Claim Filing Modal -->
    <div v-if="showClaimModal" class="claim-modal-backdrop" @click.self="showClaimModal = false">
      <div class="claim-modal">
        <div class="modal-head">
          <div class="head-left">
            <span class="cert-icon">🛡️</span>
            <div>
              <h3>100% 무역 안심 보증 (Trade Assurance) 클레임 접수</h3>
              <p>주문번호: {{ order?.order_number }} | 보증 한도: ${{ ((order?.total_amount_minor || 420000) / 100).toLocaleString() }}</p>
            </div>
          </div>
          <button class="btn-close" @click="showClaimModal = false">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>클레임 청구 유형 (Claim Category):</label>
            <select v-model="claimCategory" class="form-select">
              <option value="QUALITY_DISPUTE">품질 불량 및 허용 오차 초과 (QUALITY_DISPUTE)</option>
              <option value="DELIVERY_DEFAULT">납기 지연 및 계약 미이행 (DELIVERY_DEFAULT)</option>
              <option value="SPEC_MISMATCH">계약 규격 및 재질 불일치 (SPEC_MISMATCH)</option>
              <option value="DAMAGE_IN_TRANSIT">해상/항공 운송 중 파손 및 침수 (DAMAGE_IN_TRANSIT)</option>
            </select>
          </div>

          <div class="form-group">
            <label>청구 배상 금액 (USD):</label>
            <input v-model.number="claimAmount" type="number" :max="(order?.total_amount_minor || 420000) / 100" class="form-input" />
            <span class="input-hint">※ 최대 계약 총액(${{ ((order?.total_amount_minor || 420000) / 100).toFixed(2) }}) 범위 내에서 청구 가능합니다.</span>
          </div>

          <div class="form-group">
            <label>피해 내역 및 입증 사유:</label>
            <textarea v-model="claimReason" rows="3" class="form-textarea" placeholder="검수 사진, 불량률 측정치 또는 납기 위반 일자를 기재하세요."></textarea>
          </div>

          <div class="claim-info-box">
            <p><strong>에스크로 즉시 자동 동결(HELD) 안내:</strong></p>
            <p>클레임이 접수되면 공급사 정산 지급(Escrow Payout)은 실시간 자동 동결(HELD)되며, 플랫폼 감사관의 판정 완료 시까지 안전하게 보관됩니다.</p>
          </div>
        </div>

        <div class="modal-foot">
          <button class="btn-secondary" @click="showClaimModal = false">취소</button>
          <button
            class="btn-submit-claim"
            :disabled="submittingClaim || claimAmount <= 0"
            @click="fileTradeAssuranceClaim"
          >
            {{ submittingClaim ? '클레임 심사 접수 중...' : '🛡️ Trade Assurance 보증 심사 정식 제출' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { apiRequest } from '../api';

const route = useRoute();
const currentLocale = ref<string>((route.params.locale as string) || 'ko');
const currentCurrency = ref<string>((route.params.currency as string) || 'KRW');
const orderId = ref<string>((route.params.id as string) || '');

const loading = ref(true);
const order = ref<any>(null);
const processingPayment = ref(false);
const approvingInspection = ref(false);
const confirmingDelivery = ref(false);

const customsManifest = ref<any>(null);
const activeClaim = ref<any>(null);
const showClaimModal = ref(false);
const claimCategory = ref('QUALITY_DISPUTE');
const claimAmount = ref(1500);
const claimReason = ref('MIL-STD-105E AQL 2.5 불량률 초과 및 계약 재질 오차');
const submittingClaim = ref(false);

const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = msg;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = '';
  }, 4000);
}

function formatDate(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getStepClass(stepNum: number): string {
  if (!order.value) return '';
  const s = order.value.order_status;
  const p = order.value.payment_status;

  if (stepNum === 1) return 'completed';
  if (stepNum === 2) {
    if (p !== 'DOWN_PAYMENT_PENDING') return 'completed';
    return 'current';
  }
  if (stepNum === 3) {
    if (order.value.inspection_status === 'PASSED') return 'completed';
    if (s === 'IN_PRODUCTION') return 'current';
    return '';
  }
  if (stepNum === 4) {
    if (p === 'FULLY_PAID') return 'completed';
    if (p === 'PARTIALLY_PAID_30' && order.value.inspection_status === 'PASSED') return 'current';
    return '';
  }
  if (stepNum === 5) {
    if (s === 'COMPLETED') return 'completed';
    if (s === 'SHIPPED') return 'current';
    return '';
  }
  return '';
}

async function fetchOrderDetail() {
  loading.value = true;
  try {
    const data = await apiRequest(`/trade/orders/${orderId.value}`);
    order.value = data;

    // Concurrently fetch customs manifest and trade assurance claims
    try {
      const customsRes = await apiRequest('/logistics/customs');
      if (customsRes && customsRes.manifests && customsRes.manifests.length > 0) {
        customsManifest.value = customsRes.manifests.find((m: any) => m.order_id === orderId.value) || customsRes.manifests[0];
      }
    } catch (_) {}

    try {
      const claimRes = await apiRequest('/trade/assurance/claims');
      if (claimRes && claimRes.claims && claimRes.claims.length > 0) {
        activeClaim.value = claimRes.claims.find((c: any) => c.order_id === orderId.value) || null;
      }
    } catch (_) {}
  } catch (err: any) {
    showToast(`발주 상세 조회 실패: ${err.message}`, 'error');
  } finally {
    loading.value = false;
  }
}

async function fileTradeAssuranceClaim() {
  if (!order.value || claimAmount.value <= 0) return;
  submittingClaim.value = true;
  try {
    const claimMinor = Math.round(claimAmount.value * 100);
    const res = await apiRequest('/trade/assurance/claims', {
      method: 'POST',
      body: JSON.stringify({
        order_id: order.value.id,
        claim_category: claimCategory.value,
        claim_amount_minor: claimMinor,
        reason: claimReason.value,
        evidence_urls: [
          'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
        ],
      }),
    });
    activeClaim.value = res;
    showClaimModal.value = false;
    showToast('Trade Assurance 클레임이 성공적으로 접수되어 에스크로가 동결되었습니다.', 'success');
  } catch (err: any) {
    showToast(`클레임 접수 실패: ${err.message}`, 'error');
  } finally {
    submittingClaim.value = false;
  }
}

function openCustomsCert() {
  const num = customsManifest.value?.declaration_number || `EXP-KR-2026-${order.value?.order_number?.replace(/\D/g, '') || '88391'}`;
  alert(`[관세청 전자수출신고필증 교부 확인서]\n신고번호: ${num}\n적재항: Busan Port (KRPUS) -> 양하항: Los Angeles (USLAX)\nHS Code: 7323.93.0000\n통관상태: 수리완료 (CLEARED)\n관세사: Pantos Logistics Global`);
}

async function payDownpayment() {
  processingPayment.value = true;
  try {
    const amount = order.value.downpayment_minor || 126000;
    await apiRequest('/payments/process', {
      method: 'POST',
      body: JSON.stringify({
        order_id: order.value.id,
        amount_minor: amount,
        currency: 'USD',
        payment_method: 'CORPORATE_ESCROW_WIRE',
        stage: 'DOWNPAYMENT_30',
      }),
    });
    order.value.payment_status = 'PARTIALLY_PAID_30';
    order.value.order_status = 'IN_PRODUCTION';
    showToast('선급금 30%가 에스크로에 안전하게 예치되었습니다. 공급사가 생산에 착수합니다.');
  } catch (err: any) {
    showToast(`결제 실패: ${err.message}`, 'error');
  } finally {
    processingPayment.value = false;
  }
}

async function approveInspection() {
  approvingInspection.value = true;
  try {
    await apiRequest(`/logistics/inspections/${order.value.id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ order_id: order.value.id }),
    });
    order.value.inspection_status = 'PASSED';
    showToast('SGS 제3자 품질 검수가 공식 합격 승인되었습니다. 잔금 결제 및 화물 선적이 진행됩니다.');
  } catch (err: any) {
    showToast(`검수 승인 실패: ${err.message}`, 'error');
  } finally {
    approvingInspection.value = false;
  }
}

async function payBalance() {
  processingPayment.value = true;
  try {
    const amount = order.value.balance_minor || 294000;
    await apiRequest('/payments/process', {
      method: 'POST',
      body: JSON.stringify({
        order_id: order.value.id,
        amount_minor: amount,
        currency: 'USD',
        payment_method: 'CORPORATE_ESCROW_WIRE',
        stage: 'BALANCE_70',
      }),
    });
    order.value.payment_status = 'FULLY_PAID';
    order.value.order_status = 'SHIPPED';
    showToast('잔금 70%가 에스크로에 예치되었습니다. 선하증권 및 화물 운송이 진행됩니다.');
  } catch (err: any) {
    showToast(`잔금 결제 실패: ${err.message}`, 'error');
  } finally {
    processingPayment.value = false;
  }
}

async function confirmDelivery() {
  confirmingDelivery.value = true;
  try {
    await apiRequest(`/trade/orders/${order.value.id}/confirm-delivery`, {
      method: 'POST',
    });
    order.value.order_status = 'COMPLETED';
    order.value.fulfillment_status = 'FULFILLED';
    order.value.settlement_status = 'RELEASE_ELIGIBLE';
    showToast('화물 인수가 확인되었습니다! 에스크로 정산 대금이 공급사로 지급 가능 상태로 전환되었습니다.');
  } catch (err: any) {
    showToast(`인수 확인 실패: ${err.message}`, 'error');
  } finally {
    confirmingDelivery.value = false;
  }
}

function downloadDoc(docName: string) {
  showToast(`[다운로드 시작] ${docName} 원본 PDF가 다운로드됩니다.`);
}

onMounted(() => {
  fetchOrderDetail();
});
</script>

<style scoped>
.order-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 16px 80px;
}

.breadcrumb {
  margin-bottom: 16px;
}

.breadcrumb a {
  color: #ff6600;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}

.toast-banner {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 600;
}

.toast-banner.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.toast-banner.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.order-header-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.order-num-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 6px;
}

.order-num-row h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}

.ord-date {
  font-size: 13px;
  color: #6b7280;
}

.supplier-text {
  font-size: 14px;
  color: #374151;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-verified {
  background: #0284c7;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.badge-ta {
  background: #ea580c;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.header-right {
  text-align: right;
}

.total-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
}

.total-amount {
  font-size: 26px;
  font-weight: 800;
  color: #ff6600;
}

.timeline-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 24px;
  margin-bottom: 24px;
}

.timeline-card h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

.timeline-steps {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.timeline-step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.timeline-step.completed {
  background: #ecfdf5;
  border-color: #10b981;
}

.timeline-step.current {
  background: #fff7ed;
  border-color: #ff6600;
}

.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #d1d5db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}

.timeline-step.completed .step-num {
  background: #10b981;
}

.timeline-step.current .step-num {
  background: #ff6600;
}

.step-info {
  display: flex;
  flex-direction: column;
}

.step-title {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
}

.step-status {
  font-size: 11px;
  color: #6b7280;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
}

.card-box {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
}

.card-box h4 {
  margin: 0 0 14px 0;
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 10px;
}

.item-info h5 {
  font-size: 16px;
  margin: 0 0 8px 0;
  color: #111827;
}

.item-info p {
  margin: 4px 0;
  font-size: 13px;
  color: #4b5563;
}

.financial-table {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
}

.financial-table td {
  padding: 8px 0;
  border-bottom: 1px solid #f9fafb;
}

.financial-table .total-row td {
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
}

.doc-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.doc-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  gap: 12px;
}

.doc-icon {
  font-size: 20px;
}

.doc-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.doc-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.doc-sub {
  font-size: 11px;
  color: #9ca3af;
}

.btn-download {
  background: white;
  border: 1px solid #d1d5db;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.actions-console {
  border-top: 4px solid #ff6600;
}

.action-block {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.action-desc {
  font-size: 13px;
  color: #4b5563;
  margin: 0 0 10px 0;
}

.btn-full {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  border: none;
  text-align: center;
  display: block;
  text-decoration: none;
  box-sizing: border-box;
}

.btn-full.primary {
  background: #ff6600;
  color: white;
}

.btn-full.success {
  background: #16a34a;
  color: white;
}

.btn-full.danger {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #f87171;
}

.dispute-block {
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px dashed #e5e7eb;
}

.dispute-desc {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.tracking-events {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  padding-left: 10px;
}

.tracking-event {
  display: flex;
  gap: 12px;
  position: relative;
}

.event-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #cbd5e1;
  margin-top: 4px;
  flex-shrink: 0;
}

.tracking-event.active .event-dot {
  background: #ff6600;
  box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.2);
}

.event-body {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

.event-time {
  color: #9ca3af;
  font-size: 11px;
}

.event-desc {
  color: #1f2937;
  margin: 2px 0;
}

.event-loc {
  color: #6b7280;
}

.state-box {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 60px;
  text-align: center;
  color: #6b7280;
}

.dispute-btn-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.btn-link-dispute {
  display: block;
  text-align: center;
  font-size: 12px;
  color: #DC2626;
  text-decoration: none;
  font-weight: 600;
  margin-top: 4px;
}
.btn-link-dispute:hover {
  text-decoration: underline;
}

/* Customs Manifest Box */
.customs-box {
  border-left: 4px solid #0284C7;
}
.box-head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.customs-badge {
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 4px;
}
.customs-badge.cleared {
  background: #DCFCE7;
  color: #15803D;
}
.customs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  background: #F8FAFC;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
  margin-bottom: 12px;
}
.cg-item {
  font-size: 12px;
}
.cg-lbl {
  color: #64748B;
  display: block;
  font-size: 11px;
}
.cg-val {
  font-weight: 600;
  color: #1E293B;
}
.customs-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #475569;
}
.btn-sm-view {
  background: #E0F2FE;
  color: #0369A1;
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

/* Claim Status Card */
.claim-status-card {
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 16px;
}
.claim-badge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.claim-title {
  font-weight: 700;
  color: #991B1B;
  font-size: 13px;
}
.claim-stat-tag {
  margin-left: auto;
  background: #FEE2E2;
  color: #B91C1C;
  font-weight: 800;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}
.claim-meta {
  font-size: 12px;
  color: #7F1D1D;
  margin: 4px 0;
}
.claim-desc {
  font-size: 11px;
  color: #991B1B;
  margin: 4px 0 0;
  line-height: 1.4;
}

/* Claim Modal */
.claim-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}
.claim-modal {
  background: #FFF;
  border-radius: 12px;
  max-width: 580px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
}
.form-group {
  margin-bottom: 14px;
}
.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 4px;
}
.form-select, .form-input, .form-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #CBD5E1;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}
.input-hint {
  font-size: 11px;
  color: #64748B;
  margin-top: 4px;
  display: block;
}
.claim-info-box {
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 11px;
  color: #78350F;
}
.claim-info-box p {
  margin: 2px 0;
}
.btn-submit-claim {
  padding: 8px 16px;
  background: #DC2626;
  color: #FFF;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
}
.btn-submit-claim:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile & Tablet Responsive Layout */
@media (max-width: 992px) {
  .order-header-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .header-right {
    text-align: left;
  }
  .timeline-steps {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .detail-grid {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 640px) {
  .timeline-steps {
    grid-template-columns: 1fr !important;
  }
  .order-num-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>

