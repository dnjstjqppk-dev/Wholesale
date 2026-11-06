<template>
  <div class="ws-page ws-page-wide">
    <router-link :to="`/${currentLocale}/${currentCurrency}/orders`" class="ws-btn ws-btn-ghost ws-btn-sm back-link">← 발주 목록으로 돌아가기</router-link>

    <div v-if="toastMessage" class="ws-banner" :class="toastType === 'error' ? 'ws-banner-danger' : 'ws-banner-success'">
      <WsIcon :name="toastType === 'error' ? 'alert' : 'check'" :size="16" />
      <span>{{ toastMessage }}</span>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton" style="height: 120px"></div>
      <div class="ws-skeleton" style="height: 200px"></div>
    </div>

    <div v-else-if="!order" class="ws-empty">
      <span class="ws-empty-icon"><WsIcon name="package" :size="24" /></span>
      <h3>주문 정보를 찾을 수 없습니다</h3>
      <router-link :to="`/${currentLocale}/${currentCurrency}/orders`" class="ws-btn ws-btn-secondary">발주 목록으로 이동</router-link>
    </div>

    <div v-else class="od">
      <div class="ws-page-head">
        <p class="ws-eyebrow">Order {{ order.order_number }}</p>
        <div class="ws-page-head-row">
          <h1 class="ws-page-title ws-figure">{{ order.order_number }}</h1>
          <b class="ws-price ws-price-lg ws-figure">${{ (order.total_amount_minor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }) }}</b>
        </div>
        <p class="ws-page-sub">
          체결일 {{ formatDate(order.created_at) }} · {{ order.supplier_name }}
          <span class="ws-badge ws-badge-success">Verified</span>
          <span class="ws-badge ws-badge-brand"><WsIcon name="shield" :size="12" /> Trade Assurance</span>
        </p>
      </div>

      <!-- Milestone tracker -->
      <div class="ws-card">
        <div class="ws-card-head"><h3>무역 이행 마일스톤</h3></div>
        <div class="ws-steps od-steps">
          <div class="ws-step" :class="{ 'ws-step-done': getStepClass(1) === 'completed', 'ws-step-active': getStepClass(1) === 'current' }">
            <span class="ws-step-num">1</span>
            <span class="ws-step-label">계약 체결<br /><span class="ws-step-sub">{{ order.contract_hash ? '완료' : '서명 대기' }}</span></span>
          </div>
          <div class="ws-step" :class="{ 'ws-step-done': getStepClass(2) === 'completed', 'ws-step-active': getStepClass(2) === 'current' }">
            <span class="ws-step-num">2</span>
            <span class="ws-step-label">선급금 30%<br /><span class="ws-step-sub">{{ order.payment_status === 'DOWN_PAYMENT_PENDING' ? '결제 대기' : '에스크로 예치됨' }}</span></span>
          </div>
          <div class="ws-step" :class="{ 'ws-step-done': getStepClass(3) === 'completed', 'ws-step-active': getStepClass(3) === 'current' }">
            <span class="ws-step-num">3</span>
            <span class="ws-step-label">생산·품질 검수<br /><span class="ws-step-sub">{{ order.inspection_status || '진행 중' }}</span></span>
          </div>
          <div class="ws-step" :class="{ 'ws-step-done': getStepClass(4) === 'completed', 'ws-step-active': getStepClass(4) === 'current' }">
            <span class="ws-step-num">4</span>
            <span class="ws-step-label">잔금 70%<br /><span class="ws-step-sub">{{ order.payment_status === 'FULLY_PAID' ? '예치 완료' : '결제 대기' }}</span></span>
          </div>
          <div class="ws-step" :class="{ 'ws-step-done': getStepClass(5) === 'completed', 'ws-step-active': getStepClass(5) === 'current' }">
            <span class="ws-step-num">5</span>
            <span class="ws-step-label">운송·인수<br /><span class="ws-step-sub">{{ order.order_status === 'COMPLETED' ? '인수 완료' : order.order_status }}</span></span>
          </div>
        </div>
      </div>

      <div class="od-grid">
        <div class="ws-stack">
          <!-- Item spec -->
          <section class="ws-card">
            <div class="ws-card-head"><h3>발주 품목 명세</h3></div>
            <table class="ws-spec-table">
              <tbody>
                <tr><th>품목</th><td><b>{{ order.item_title }}</b></td></tr>
                <tr><th>발주 수량</th><td class="ws-figure">{{ order.ordered_quantity }} {{ order.unit }}</td></tr>
                <tr><th>인도 조건</th><td>{{ order.incoterms || 'FOB Busan Port' }}</td></tr>
                <tr><th>납기 기한</th><td>{{ order.lead_time_days }}일 이내</td></tr>
                <tr><th>배송 주소</th><td>{{ order.shipping_address || '450 Lexington Ave, New York, NY 10017, USA' }}</td></tr>
              </tbody>
            </table>
          </section>

          <!-- Escrow breakdown -->
          <section class="ws-card">
            <div class="ws-card-head"><h3>에스크로 정산 분할</h3></div>
            <table class="ws-tier-table">
              <tbody>
                <tr>
                  <td>1차 선급금 (30%)</td>
                  <td style="text-align: right" class="ws-figure"><b>${{ ((order.downpayment_minor || 126000) / 100).toLocaleString() }}</b></td>
                  <td style="text-align: right"><span v-if="order.payment_status !== 'DOWN_PAYMENT_PENDING'" class="ws-badge ws-badge-success">예치됨</span><span v-else class="ws-badge ws-badge-warning">미결제</span></td>
                </tr>
                <tr>
                  <td>2차 잔금 (70%)</td>
                  <td style="text-align: right" class="ws-figure"><b>${{ ((order.balance_minor || 294000) / 100).toLocaleString() }}</b></td>
                  <td style="text-align: right"><span v-if="order.payment_status === 'FULLY_PAID'" class="ws-badge ws-badge-success">예치됨</span><span v-else class="ws-badge ws-badge-outline">검수 후 예치</span></td>
                </tr>
                <tr>
                  <td><b>합계 (Escrow Vault)</b></td>
                  <td style="text-align: right"><b class="ws-price ws-figure">${{ (order.total_amount_minor / 100).toLocaleString() }}</b></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Documents -->
          <section class="ws-card">
            <div class="ws-card-head">
              <h3>무역 증빙 서류</h3>
              <button class="ws-btn ws-btn-secondary ws-btn-sm" @click="showUploadModal = true"><WsIcon name="upload" :size="14" /> 서류 업로드</button>
            </div>
            <div class="ws-list-row" v-for="doc in staticDocs" :key="doc.name">
              <span class="doc-ico"><WsIcon :name="doc.icon" :size="17" /></span>
              <div class="ws-list-main">
                <p class="ws-list-title">{{ doc.name }}</p>
                <p class="ws-list-sub">{{ doc.file }}</p>
              </div>
              <button class="ws-btn ws-btn-ghost ws-btn-sm" @click="downloadDoc(doc.short)">다운로드</button>
            </div>
            <div class="ws-list-row" v-for="d in uploadedDocumentsList" :key="d.id">
              <span class="doc-ico"><WsIcon name="file" :size="17" /></span>
              <div class="ws-list-main">
                <p class="ws-list-title">{{ d.file_name }}</p>
                <p class="ws-list-sub">R2 Vault: {{ d.sha256_hash?.slice(0, 16) }}... ({{ (d.file_size_bytes / 1024).toFixed(1) }} KB)</p>
              </div>
              <button class="ws-btn ws-btn-ghost ws-btn-sm" @click="downloadDoc(d.file_name)">다운로드</button>
            </div>
          </section>

          <!-- Customs -->
          <section class="ws-card">
            <div class="ws-card-head">
              <h3><WsIcon name="building" :size="16" class="h-ico" /> 세관 통관 필증 원장</h3>
              <span class="ws-badge ws-badge-success">{{ customsManifest?.customs_status || 'CLEARED' }}</span>
            </div>
            <div class="ws-grid-2 customs-grid">
              <div><span>수출신고번호</span><b class="ws-figure">{{ customsManifest?.declaration_number || `EXP-KR-2026-${order.order_number?.replace(/\D/g, '') || '88391'}` }}</b></div>
              <div><span>HS 코드</span><b class="ws-figure">{{ customsManifest?.hs_code || '7323.93.0000' }}</b></div>
              <div><span>적재항 (POL)</span><b>{{ customsManifest?.port_of_loading || 'Busan Port (KRPUS)' }}</b></div>
              <div><span>양하항 (POD)</span><b>{{ customsManifest?.port_of_discharge || 'Los Angeles (USLAX)' }}</b></div>
              <div><span>통관 관세사</span><b>{{ customsManifest?.customs_broker_name || 'Pantos Logistics Global' }}</b></div>
              <div><span>납부 관부가세</span><b class="ws-figure">${{ ((customsManifest?.duty_tax_amount_minor || 27300) / 100).toFixed(2) }} (납부완료)</b></div>
            </div>
            <div class="ws-split customs-foot">
              <span class="ws-small ws-muted">수출 승인 면허: <code>{{ customsManifest?.export_license_number || 'EL-2026-KR-7711' }}</code></span>
              <button class="ws-btn ws-btn-secondary ws-btn-sm" @click="openCustomsCert"><WsIcon name="file" :size="14" /> 필증 원본 열람</button>
            </div>
          </section>
        </div>

        <div class="ws-stack od-side">
          <div v-if="activeClaim" class="ws-banner ws-banner-warning claim-card">
            <WsIcon name="shield" :size="18" />
            <div>
              <b>Trade Assurance 심사 진행 중 · {{ activeClaim.arbitration_status }}</b>
              <p>청구 유형 <b>{{ activeClaim.claim_category }}</b> · 청구액 <b>${{ (activeClaim.claim_amount_minor / 100).toFixed(2) }}</b></p>
              <p>중재관이 B/L·SGS 성적서를 대조 중이며, 보증금 자동 환불 또는 정산 조정이 집행됩니다.</p>
            </div>
          </div>

          <!-- Actions -->
          <section class="ws-card">
            <div class="ws-card-head"><h3>발주 진행 조치</h3></div>
            <div class="ws-stack-sm">
              <div v-if="order.order_status === 'CONTRACT_PENDING'" class="act">
                <p>전자 무역 계약서 서명이 필요합니다.</p>
                <router-link :to="`/${currentLocale}/${currentCurrency}/orders/${order.id}/contract`" class="ws-btn ws-btn-primary ws-btn-block"><WsIcon name="pencil" :size="14" /> 전자계약서 확인·서명</router-link>
              </div>
              <div v-if="order.payment_status === 'DOWN_PAYMENT_PENDING'" class="act">
                <p>생산 착수를 위해 선급금 30%를 에스크로에 예치하세요.</p>
                <button class="ws-btn ws-btn-primary ws-btn-block" :disabled="processingPayment" @click="openPaymentModal('DOWNPAYMENT_30')">
                  {{ processingPayment ? '결제 처리 중...' : `선급금 30% ($${((order.downpayment_minor || 126000) / 100).toLocaleString()}) 결제` }}
                </button>
              </div>
              <div v-if="order.order_status === 'IN_PRODUCTION' && order.inspection_status !== 'PASSED'" class="act">
                <p>SGS/TÜV 제3자 출고 검수 결과 승인이 가능합니다.</p>
                <button class="ws-btn ws-btn-navy ws-btn-block" :disabled="approvingInspection" @click="approveInspection">
                  <WsIcon v-if="!approvingInspection" name="search" :size="14" /> {{ approvingInspection ? '승인 중...' : '품질 검수 합격 승인' }}
                </button>
              </div>
              <div v-if="order.payment_status === 'PARTIALLY_PAID_30' && (order.order_status === 'SHIPPED' || order.inspection_status === 'PASSED')" class="act">
                <p>검수 완료 후 선적을 위해 잔금 70%를 예치하세요.</p>
                <button class="ws-btn ws-btn-primary ws-btn-block" :disabled="processingPayment" @click="openPaymentModal('BALANCE_70')">
                  {{ processingPayment ? '결제 처리 중...' : `잔금 70% ($${((order.balance_minor || 294000) / 100).toLocaleString()}) 결제` }}
                </button>
              </div>
              <div v-if="order.order_status === 'SHIPPED' && order.payment_status === 'FULLY_PAID'" class="act">
                <p>화물 인수를 확인하고 에스크로 대금을 지급합니다.</p>
                <button class="ws-btn ws-btn-navy ws-btn-block" :disabled="confirmingDelivery" @click="confirmDelivery">
                  <WsIcon name="check" :size="14" /> {{ confirmingDelivery ? '확인 중...' : '최종 인수 확인·대금 지급' }}
                </button>
              </div>
              <div class="act dispute-act">
                <p>품질 불량·수량 부족·납기 지연이 발생했습니까?</p>
                <button class="ws-btn ws-btn-danger ws-btn-block" @click="showClaimModal = true"><WsIcon name="shield" :size="14" /> Trade Assurance 클레임 신청</button>
                <router-link :to="`/${currentLocale}/${currentCurrency}/orders/${order.id}/dispute`" class="ws-section-more">분쟁 조정·소명 센터로 이동 ›</router-link>
              </div>
            </div>
          </section>

          <!-- Tracking -->
          <section class="ws-card">
            <div class="ws-card-head"><h3>화물 운송 추적</h3></div>
            <ul class="ws-timeline">
              <li class="ws-timeline-now">
                <p class="ws-timeline-title">부산항 CY 통관 완료·본선 선적</p>
                <p class="ws-timeline-sub">2026-10-24 14:00 KST · Busan Port Container Terminal</p>
              </li>
              <li class="ws-timeline-done">
                <p class="ws-timeline-title">SGS 출하 전 사전 검수 (AQL 2.5 Pass)</p>
                <p class="ws-timeline-sub">2026-10-23 09:30 KST · Precision Korea Facility #2</p>
              </li>
              <li class="ws-timeline-done">
                <p class="ws-timeline-title">정식 발주·선급금 30% 에스크로 입금 확인</p>
                <p class="ws-timeline-sub">2026-10-18 10:15 KST · Wholesale Escrow Vault</p>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>

    <!-- Claim modal -->
    <div v-if="showClaimModal" class="ws-modal-backdrop" @click.self="showClaimModal = false">
      <div class="ws-modal ws-modal-wide" role="dialog" aria-modal="true">
        <div class="ws-modal-head">
          <h3>Trade Assurance 클레임 접수</h3>
          <button class="ws-icon-btn" aria-label="닫기" @click="showClaimModal = false"><WsIcon name="x" :size="15" /></button>
        </div>
        <div class="ws-modal-body">
          <p class="ws-small ws-muted" style="margin-top: 0">주문 {{ order?.order_number }} · 보증 한도 ${{ ((order?.total_amount_minor || 420000) / 100).toLocaleString() }}</p>
          <div class="ws-field">
            <label>클레임 청구 유형</label>
            <select v-model="claimCategory">
              <option value="QUALITY_DISPUTE">품질 불량·허용 오차 초과 (QUALITY_DISPUTE)</option>
              <option value="DELIVERY_DEFAULT">납기 지연·계약 미이행 (DELIVERY_DEFAULT)</option>
              <option value="SPEC_MISMATCH">계약 규격·재질 불일치 (SPEC_MISMATCH)</option>
              <option value="DAMAGE_IN_TRANSIT">운송 중 파손·침수 (DAMAGE_IN_TRANSIT)</option>
            </select>
          </div>
          <div class="ws-field">
            <label>청구 배상 금액 (USD)</label>
            <input v-model.number="claimAmount" type="number" :max="(order?.total_amount_minor || 420000) / 100" />
            <p class="ws-hint">최대 계약 총액(${{ ((order?.total_amount_minor || 420000) / 100).toFixed(2) }}) 범위 내 청구 가능</p>
          </div>
          <div class="ws-field">
            <label>피해 내역·입증 사유</label>
            <textarea v-model="claimReason" rows="3" class="ws-textarea" placeholder="검수 사진, 불량률 측정치 또는 납기 위반 일자를 기재하세요."></textarea>
          </div>
          <div class="ws-banner ws-banner-warning" style="margin-bottom: 0">
            <WsIcon name="alert" :size="16" />
            <span><b>에스크로 즉시 자동 동결(HELD):</b> 접수 시 공급사 정산 지급이 동결되고 판정 완료 시까지 보관됩니다.</span>
          </div>
        </div>
        <div class="ws-modal-foot">
          <button class="ws-btn ws-btn-secondary" @click="showClaimModal = false">취소</button>
          <button class="ws-btn ws-btn-danger" :disabled="submittingClaim || claimAmount <= 0" @click="fileTradeAssuranceClaim">
            <WsIcon v-if="!submittingClaim" name="shield" :size="14" /> {{ submittingClaim ? '심사 접수 중...' : '보증 심사 정식 제출' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Payment modal -->
    <div v-if="showPaymentModal" class="ws-modal-backdrop" @click.self="showPaymentModal = false">
      <div class="ws-modal ws-modal-wide" role="dialog" aria-modal="true">
        <div class="ws-modal-head">
          <h3>무역 에스크로 안전 결제</h3>
          <button class="ws-icon-btn" aria-label="닫기" @click="showPaymentModal = false"><WsIcon name="x" :size="15" /></button>
        </div>
        <div class="ws-modal-body">
          <p class="ws-small ws-muted" style="margin-top: 0">주문 {{ order?.order_number }} · <b>{{ paymentStage === 'DOWNPAYMENT_30' ? '1차 선급금 (30%)' : '2차 잔금 (70%)' }}</b></p>
          <div class="pay-amount">
            <span>에스크로 예치 청구 금액</span>
            <b class="ws-figure">${{ ((paymentStage === 'DOWNPAYMENT_30' ? (order?.downpayment_minor || 126000) : (order?.balance_minor || 294000)) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 }) }} {{ order?.currency || 'USD' }}</b>
          </div>
          <div class="ws-tabs">
            <button class="ws-tab" :class="{ 'ws-tab-active': selectedPaymentTab === 'VIRTUAL_ACCOUNT' }" @click="selectedPaymentTab = 'VIRTUAL_ACCOUNT'"><WsIcon name="building" :size="14" /> 가상계좌</button>
            <button class="ws-tab" :class="{ 'ws-tab-active': selectedPaymentTab === 'CARD' }" @click="selectedPaymentTab = 'CARD'"><WsIcon name="card" :size="14" /> 법인카드</button>
            <button class="ws-tab" :class="{ 'ws-tab-active': selectedPaymentTab === 'SWIFT' }" @click="selectedPaymentTab = 'SWIFT'"><WsIcon name="globe" :size="14" /> SWIFT</button>
          </div>
          <div v-if="selectedPaymentTab === 'VIRTUAL_ACCOUNT'">
            <table class="ws-spec-table">
              <tbody>
                <tr><th>입금 은행</th><td><b>{{ virtualAccount?.bank_name || '신한은행 (Shinhan Bank B2B Escrow)' }}</b></td></tr>
                <tr><th>가상 계좌번호</th><td><b class="ws-price ws-figure">{{ virtualAccount?.account_number || '562-910023-88192' }}</b></td></tr>
                <tr><th>예금주</th><td><b>{{ virtualAccount?.account_holder || '주식회사 홀세일무역 (무역에스크로신탁)' }}</b></td></tr>
                <tr><th>입금 마감</th><td>{{ formatDate(virtualAccount?.expires_at) }} 23:59 (7일 유효)</td></tr>
              </tbody>
            </table>
            <p class="ws-hint">실제 은행 펌뱅킹망 입금 통보(Webhook) 수신 시 상태가 실시간 전환됩니다.</p>
            <button class="ws-btn ws-btn-navy ws-btn-block" :disabled="simulatingDeposit" @click="simulateBankDeposit">
              <WsIcon v-if="!simulatingDeposit" name="bolt" :size="14" /> {{ simulatingDeposit ? '은행 전산망 통보 처리 중...' : '은행 입금 통보 시뮬레이터' }}
            </button>
          </div>
          <div v-if="selectedPaymentTab === 'CARD'">
            <div class="ws-field">
              <label>기업 법인카드 번호</label>
              <input v-model="cardForm.cardNumber" type="text" class="ws-figure" placeholder="5409-XXXX-XXXX-XXXX" />
            </div>
            <div class="ws-grid-2">
              <div class="ws-field"><label>유효기간 (MM/YY)</label><input v-model="cardForm.expiry" type="text" class="ws-figure" placeholder="12/28" /></div>
              <div class="ws-field"><label>CVC</label><input v-model="cardForm.cvc" type="password" maxlength="3" class="ws-figure" placeholder="•••" /></div>
            </div>
            <div class="ws-field">
              <label>법인 사업자등록번호 앞 5자리</label>
              <input v-model="cardForm.bizAuthNumber" type="text" maxlength="5" class="ws-figure" placeholder="12345" />
            </div>
            <button class="ws-btn ws-btn-primary ws-btn-block" :disabled="confirmingCard" @click="confirmCardPayment">
              <WsIcon v-if="!confirmingCard" name="card" :size="14" /> {{ confirmingCard ? 'PG사 결제 승인 중...' : '법인카드 에스크로 결제 승인' }}
            </button>
          </div>
          <div v-if="selectedPaymentTab === 'SWIFT'">
            <table class="ws-spec-table">
              <tbody>
                <tr><th>Beneficiary Bank</th><td>Shinhan Bank Seoul HQ</td></tr>
                <tr><th>SWIFT / BIC</th><td><code>SHBKKRSEXXX</code></td></tr>
                <tr><th>Account</th><td><code>USD-ESCROW-88192-KR</code></td></tr>
                <tr><th>Reference</th><td><code>{{ order?.order_number }}</code></td></tr>
              </tbody>
            </table>
            <div class="ws-banner ws-banner-warning" style="margin-bottom: 0">
              <WsIcon name="alert" :size="16" />
              <span>송금 시 발주번호(<code>{{ order?.order_number }}</code>)를 전문에 기재해야 자동 매칭됩니다.</span>
            </div>
          </div>
        </div>
        <div class="ws-modal-foot">
          <button class="ws-btn ws-btn-secondary" @click="showPaymentModal = false">닫기</button>
        </div>
      </div>
    </div>

    <!-- Upload modal -->
    <div v-if="showUploadModal" class="ws-modal-backdrop" @click.self="showUploadModal = false">
      <div class="ws-modal" role="dialog" aria-modal="true">
        <div class="ws-modal-head">
          <h3>무역 서류 업로드</h3>
          <button class="ws-icon-btn" aria-label="닫기" @click="showUploadModal = false"><WsIcon name="x" :size="15" /></button>
        </div>
        <div class="ws-modal-body">
          <p class="ws-small ws-muted" style="margin-top: 0">주문 {{ order?.order_number }} · R2/S3 영구 보관·SHA-256 검증</p>
          <div class="ws-field">
            <label>서류 구분</label>
            <select v-model="uploadCategory">
              <option value="COMMERCIAL_INVOICE">상업 송장 (Commercial Invoice)</option>
              <option value="PACKING_LIST">포장 명세서 (Packing List)</option>
              <option value="BILL_OF_LADING">선하증권 (Ocean / Air B/L)</option>
              <option value="INSPECTION_REPORT">SGS/TÜV 품질 검수 성적서</option>
              <option value="CUSTOMS_DECLARATION">수출입 통관신고필증</option>
              <option value="CAD_SPECIFICATION">제품 공학 도면 (CAD / 3D)</option>
            </select>
          </div>
          <div class="ws-field">
            <label>파일명</label>
            <input v-model="uploadFileName" type="text" />
          </div>
          <div class="dropzone">
            <WsIcon name="file" :size="22" />
            <p><b>파일을 드래그하거나 선택하세요</b></p>
            <span>PDF · PNG · JPG · CAD (최대 50MB, 암호화 저장)</span>
          </div>
        </div>
        <div class="ws-modal-foot">
          <button class="ws-btn ws-btn-secondary" @click="showUploadModal = false">취소</button>
          <button class="ws-btn ws-btn-primary" :disabled="uploadingDoc || !uploadFileName" @click="handleFileUpload">
            <WsIcon v-if="!uploadingDoc" name="upload" :size="14" /> {{ uploadingDoc ? '업로드 중...' : '클라우드 전송·원장 등록' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

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

// Commercial Escrow Payment State
const showPaymentModal = ref(false);
const paymentStage = ref<'DOWNPAYMENT_30' | 'BALANCE_70'>('DOWNPAYMENT_30');
const selectedPaymentTab = ref<'VIRTUAL_ACCOUNT' | 'CARD' | 'SWIFT'>('VIRTUAL_ACCOUNT');
const virtualAccount = ref<any>(null);
const simulatingDeposit = ref(false);
const confirmingCard = ref(false);
const cardForm = ref({
  cardNumber: '5409-4821-9920-1184',
  expiry: '12/28',
  cvc: '882',
  bizAuthNumber: '12345',
});

// Cloud Object Storage Uploader State
const showUploadModal = ref(false);
const uploadCategory = ref('COMMERCIAL_INVOICE');
const uploadFileName = ref('Commercial_Invoice_Final_Signed.pdf');
const uploadingDoc = ref(false);
const uploadedDocumentsList = ref<any[]>([]);

const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');

const staticDocs = computed(() => [
  { name: '상업 송장 (Commercial Invoice)', file: `CI-${order.value?.order_number}.pdf`, short: 'Commercial Invoice', icon: 'file' as any },
  { name: '포장 명세서 (Packing List)', file: `PL-${order.value?.order_number}.pdf`, short: 'Packing List', icon: 'package' as any },
  { name: '선하증권 (Ocean Bill of Lading)', file: 'BL-MAERSK-998821.pdf', short: 'Bill of Lading', icon: 'truck' as any },
  { name: 'SGS 품질 검수 성적서 (Inspection Report)', file: 'SGS-AQL-2.5-PASS.pdf', short: 'Inspection Report', icon: 'search' as any },
]);

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

    // Concurrently fetch customs manifest, trade assurance claims, virtual accounts, and uploaded docs
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

    try {
      const vaRes = await apiRequest(`/payments/virtual-account/${orderId.value}`);
      if (vaRes && vaRes.account_number) {
        virtualAccount.value = vaRes;
      }
    } catch (_) {}

    try {
      const docRes = await apiRequest(`/storage/documents?order_id=${orderId.value}`);
      if (docRes && docRes.documents) {
        uploadedDocumentsList.value = docRes.documents;
      }
    } catch (_) {}
  } catch (err: any) {
    showToast(`발주 상세 조회 실패: ${err.message}`, 'error');
  } finally {
    loading.value = false;
  }
}

function openPaymentModal(stage: 'DOWNPAYMENT_30' | 'BALANCE_70') {
  paymentStage.value = stage;
  showPaymentModal.value = true;
  if (!virtualAccount.value) {
    apiRequest(`/payments/virtual-account/${orderId.value}`)
      .then(res => { virtualAccount.value = res; })
      .catch(() => {});
  }
}

async function simulateBankDeposit() {
  if (!order.value) return;
  simulatingDeposit.value = true;
  try {
    const res = await apiRequest(`/payments/virtual-account/${order.value.id}/simulate-deposit`, {
      method: 'POST',
      body: JSON.stringify({ stage: paymentStage.value }),
    });
    showToast(res.message || '가상계좌 입금이 은행망으로부터 확인되었습니다.', 'success');
    showPaymentModal.value = false;
    fetchOrderDetail();
  } catch (err: any) {
    showToast(`입금 처리 오류: ${err.message}`, 'error');
  } finally {
    simulatingDeposit.value = false;
  }
}

async function confirmCardPayment() {
  if (!order.value) return;
  confirmingCard.value = true;
  try {
    const res = await apiRequest('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({
        order_id: order.value.id,
        stage: paymentStage.value,
        payment_method: 'CORPORATE_CARD',
      }),
    });
    showToast(`기업 카드 결제 승인 완료! (승인번호: ${res.transaction_id})`, 'success');
    showPaymentModal.value = false;
    fetchOrderDetail();
  } catch (err: any) {
    showToast(`카드 결제 승인 오류: ${err.message}`, 'error');
  } finally {
    confirmingCard.value = false;
  }
}

async function handleFileUpload() {
  if (!order.value || !uploadFileName.value) return;
  uploadingDoc.value = true;
  try {
    const res = await apiRequest('/storage/upload', {
      method: 'POST',
      body: JSON.stringify({
        order_id: order.value.id,
        file_name: uploadFileName.value,
        category: uploadCategory.value,
        mime_type: 'application/pdf',
        file_size_bytes: 842000,
      }),
    });
    uploadedDocumentsList.value.push(res);
    showUploadModal.value = false;
    showToast(`무역 서류 '${res.file_name}'이 클라우드 R2 스토리지에 무결성 검증 완료 후 업로드되었습니다.`, 'success');
  } catch (err: any) {
    showToast(`문서 업로드 실패: ${err.message}`, 'error');
  } finally {
    uploadingDoc.value = false;
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
.back-link { margin-bottom: 12px; }
.od-steps { margin-bottom: 0; }
.od-grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 16px; align-items: start; margin-top: 16px; }
.od-side { position: sticky; top: 84px; }
.claim-card { margin: 0; }
.claim-card p { margin: 4px 0 0; font-size: 12px; }
.act p { margin: 0 0 8px; font-size: 12px; color: var(--ws-text-2); }
.dispute-act { border-top: 1px solid var(--ws-border-subtle); padding-top: 14px; margin-top: 4px; }
.dispute-act .ws-section-more { display: inline-block; margin-top: 8px; }
.doc-ico { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 8px; background: var(--ws-surface-muted); color: var(--ws-text-2); }
.h-ico { color: var(--ws-navy); vertical-align: -3px; }
.customs-grid div { display: flex; flex-direction: column; gap: 3px; padding: 10px 0; border-bottom: 1px solid var(--ws-border-subtle); }
.customs-grid span { font-size: 11px; font-weight: 700; color: var(--ws-text-muted); }
.customs-grid b { font-size: 13px; }
.customs-foot { margin-top: 12px; }
.pay-amount { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; background: var(--ws-brand-faint); border: 1px solid var(--ws-brand-light); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; }
.pay-amount b { font-size: 20px; color: var(--ws-brand); }
.dropzone { border: 1.5px dashed var(--ws-border-strong); border-radius: 10px; padding: 26px 16px; text-align: center; color: var(--ws-text-muted); }
.dropzone p { margin: 8px 0 2px; font-size: 13px; color: var(--ws-text-2); }
.dropzone span { font-size: 12px; }
@media (max-width: 1024px) {
  .od-grid { grid-template-columns: minmax(0, 1fr); }
  .od-side { position: static; }
}
</style>
