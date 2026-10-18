# Alibaba.com 카테고리 체계 및 URL 대응표 (ALIBABA_URL_CATEGORY_MAPPING_KO)

- **조사 기준일**: 2026-10-18
- **대상 사이트**: Alibaba.com 공개 카탈로그, Buyer Central, Supplier Onboarding, RFQ Market, Logistics & Order Console
- **플랫폼 가칭**: WHOLESALE B2B

---

## 1. Alibaba.com 도매 카테고리 전체 계층 트리 (대분류 - 중분류 - 소분류)

Alibaba.com 글로벌 B2B 표준 분류체계에 대응하는 우리 플랫폼의 표준 카테고리 마스터입니다. 모든 웹 콘솔(구매자, 공급사, 관리자)과 DB는 본 분류체계를 공유합니다.

### 1. 산업기계 및 부품 (Industrial Machinery & Parts)
- **대분류 코드**: `CAT-IND`
  - **중분류 1.1**: 공작기계 및 금속가공 (Metalworking & Machine Tools)
    - **소분류**: CNC 머시닝센터 (`CAT-IND-CNC`), 레이저 절단기 (`CAT-IND-LSR`), 유압 프레스 (`CAT-IND-PRS`), 선반/밀링기 (`CAT-IND-LAT`)
  - **중분류 1.2**: 포장 및 인쇄 기계 (Packaging & Printing Machinery)
    - **소분류**: 진공 포장기 (`CAT-IND-VAC`), 라벨링 머신 (`CAT-IND-LBL`), 충진기 (`CAT-IND-FIL`), 카톤 포장기 (`CAT-IND-CTN`)
  - **중분류 1.3**: 플라스틱 및 고무 가공 (Plastic & Rubber Machinery)
    - **소분류**: 사출성형기 (`CAT-IND-INJ`), 압출기 (`CAT-IND-EXT`), 블로우 몰딩기 (`CAT-IND-BLW`)
  - **중분류 1.4**: 동력 전달 및 유압/공압 (Pneumatic & Hydraulic Power)
    - **소분류**: 유압 펌프 (`CAT-IND-PMP`), 공압 실린더 (`CAT-IND-CYL`), 산업용 밸브 (`CAT-IND-VLV`), 감속기 (`CAT-IND-RED`)

### 2. 전기·전자 및 부품 (Consumer Electronics & Components)
- **대분류 코드**: `CAT-ELE`
  - **중분류 2.1**: 전자 부품 및 반도체 (Electronic Components & Semiconductors)
    - **소분류**: PCB/PCBA 기판 (`CAT-ELE-PCB`), 집적회로 IC (`CAT-ELE-IC`), 커패시터/저항 (`CAT-ELE-PAS`), 센서 모듈 (`CAT-ELE-SEN`)
  - **중분류 2.2**: 전선·케이블 및 커넥터 (Wires, Cables & Connectors)
    - **소분류**: 산업용 하네스 (`CAT-ELE-HAR`), 단자대/터미널 (`CAT-ELE-TRM`), 고전압 케이블 (`CAT-ELE-CBL`)
  - **중분류 2.3**: 스마트 기기 및 액세서리 벌크 (Bulk Smart Devices & Acc)
    - **소분류**: 무선 충전 모듈 (`CAT-ELE-WIR`), OEM 블루투스 이어폰 (`CAT-ELE-EAR`), 디스플레이 패널 (`CAT-ELE-DSP`)

### 3. 패키징 및 인쇄물 (Packaging & Printing)
- **대분류 코드**: `CAT-PKG`
  - **중분류 3.1**: 친환경 및 식품용 포장 (Eco-Friendly & Food Packaging)
    - **소분류**: 크라프트 스탠드 파우치 (`CAT-PKG-KRF`), 생분해 PLA 봉투 (`CAT-PKG-PLA`), 알루미늄 캔/캡 (`CAT-PKG-ALU`)
  - **중분류 3.2**: 물류 및 운송용 포장재 (Logistics & Shipping Packaging)
    - **소분류**: 골판지 카톤 박스 (`CAT-PKG-BOX`), 스트레치 필름/랩 (`CAT-PKG-FLM`), 에어완충재 (`CAT-PKG-AIR`)
  - **중분류 3.3**: 화장품 및 고급 용기 (Cosmetic Containers)
    - **소분류**: 유리 드롭퍼 병 (`CAT-PKG-GLS`), 펌프 디스펜서 (`CAT-PKG-PMP`), 아크릴 크림 용기 (`CAT-PKG-ACR`)

### 4. 생활·주방 및 소비재 (Home, Kitchen & Daily Supplies)
- **대분류 코드**: `CAT-HOM`
  - **중분류 4.1**: 주방용품 및 용기 (Kitchenware & Drinkware)
    - **소분류**: 스테인리스 진공 텀블러 (`CAT-HOM-TMB`), 업소용 조리도구 (`CAT-HOM-COOK`), 친환경 실리콘 용기 (`CAT-HOM-SIL`)
  - **중분류 4.2**: 욕실 및 위생용품 (Bathroom & Cleaning Supplies)
    - **소분류**: 자동 핸드워시 디스펜서 (`CAT-HOM-DSP`), 호텔 어메니티 세트 (`CAT-HOM-AMN`), 마이크로파이버 타월 (`CAT-HOM-TWL`)

### 5. 화학·소재 및 원부자재 (Chemicals & Raw Materials)
- **대분류 코드**: `CAT-CHM`
  - **중분류 5.1**: 고분자 수지 및 펠릿 (Polymer Resins & Pellets)
    - **소분류**: PP/PE 수지 (`CAT-CHM-RES`), ABS 수지 (`CAT-CHM-ABS`), 생분해 수지 PBAT (`CAT-CHM-BIO`)
  - **중분류 5.2**: 코팅제, 접착제 및 첨가제 (Coatings & Adhesives)
    - **소분류**: 핫멜트 접착제 (`CAT-CHM-ADH`), 산업용 에폭시 (`CAT-CHM-EPX`), 마스터배치 안료 (`CAT-CHM-MST`)

---

## 2. 전체 원본 화면 → 구현 URL 및 라우트 대응표

| 원본 Alibaba URL | 원본 화면 / 기능 | 대상 콘솔 | 구현 URL | 라우트 패턴 | 접근 역할 | 연결 API / 엔드포인트 | 구현 파일 | 검증 상태 |
|---|---|---|---|---|---|---|---|---|
| `https://www.alibaba.com/` | 글로벌 메인 홈 (배너, 카테고리 메가메뉴, 검색 전환) | 구매자 콘솔 | `https://wholesale.dnjstjqppk.workers.dev/` | `/` | All / Public | `GET /v1/catalog/listings` | `apps/buyer-web/src/views/CatalogView.vue` | 검증 완료 |
| `https://sale.alibaba.com/category/products/index.html` | 전체 카테고리 허브 | 구매자 콘솔 | `https://wholesale.dnjstjqppk.workers.dev/catalog` | `/catalog` | All / Public | `GET /v1/catalog/categories` | `apps/buyer-web/src/views/CatalogView.vue` | 검증 완료 |
| `https://www.alibaba.com/trade/search` | 상품/공급사 다중 필터 검색 및 리스트/그리드 | 구매자 콘솔 | `https://wholesale.dnjstjqppk.workers.dev/catalog?q=...` | `/catalog?q=:q&moq=:moq&verified=:v` | All / Public | `GET /v1/catalog/listings` | `apps/buyer-web/src/views/CatalogView.vue` | 검증 완료 |
| `https://www.alibaba.com/product-detail/...` | 상품 상세 (PDP), SKU 매트릭스, 수량별 단가표, MOQ 계산기 | 구매자 콘솔 | `https://wholesale.dnjstjqppk.workers.dev/products/:id` | `/products/:id` | All / Public | `GET /v1/catalog/listings/:id` | `apps/buyer-web/src/views/ProductDetailView.vue` | 검증 완료 |
| `https://rfq.alibaba.com/rfq/buyerview/post_rfq.htm` | 신규 RFQ 견적 의뢰 작성 (사양, 수량, 첨부) | 구매자 콘솔 | `https://wholesale.dnjstjqppk.workers.dev/rfqs/new` | `/rfqs/new` | BUYER_PURCHASER | `POST /v1/sourcing/rfqs` | `apps/buyer-web/src/views/RFQCreateView.vue` | 검증 완료 |
| `https://rfq.alibaba.com/rfq/buyerview/quote_list.htm` | 견적서 비교 및 개별 견적 수락 | 구매자 콘솔 | `https://wholesale.dnjstjqppk.workers.dev/quotes/:id` | `/quotes/:id` | BUYER_PURCHASER | `POST /v1/sourcing/quotes/:id/accept` | `apps/buyer-web/src/views/QuoteReviewView.vue` | 검증 완료 |
| `https://tradeassurance.alibaba.com/order/...` | 무역 계약서 확인 및 SHA-256 서명 | 구매자 콘솔 | `https://wholesale.dnjstjqppk.workers.dev/orders/:id/contract` | `/orders/:id/contract` | BUYER_APPROVER | `POST /v1/trade/orders/:id/contract/sign` | `apps/buyer-web/src/views/ContractSignView.vue` | 검증 완료 |
| `https://biz.alibaba.com/order/buyer_order_list.htm` | 발주 목록, 30% 계약금 납입, 분할배송 추적 | 구매자 콘솔 | `https://wholesale.dnjstjqppk.workers.dev/orders` | `/orders` | BUYER | `GET /v1/trade/orders` | `apps/buyer-web/src/views/OrdersView.vue` | 검증 완료 |
| `https://feedback.alibaba.com/dispute/...` | 거래 분쟁 접수 및 증빙 제출 | 구매자 콘솔 | `https://wholesale.dnjstjqppk.workers.dev/disputes/new` | `/disputes/new` | BUYER | `POST /v1/disputes` | `apps/buyer-web/src/views/DisputeCreateView.vue` | 검증 완료 |
| `https://supplier.alibaba.com/dashboard` | 공급사 영업/출고/정산 대시보드 | 파트너 콘솔 | `https://wholesale-partner.dnjstjqppk.workers.dev/` | `/` | SUPPLIER | `GET /v1/health` | `apps/partner-web/src/views/SupplierDashboardView.vue` | 검증 완료 |
| `https://post.alibaba.com/product/publish.htm` | 상품 등록 및 수량 구간별 단가표 관리 | 파트너 콘솔 | `https://wholesale-partner.dnjstjqppk.workers.dev/catalog` | `/catalog` | SUPPLIER_SALES | `POST /v1/catalog/listings` | `apps/partner-web/src/views/CatalogEditorView.vue` | 검증 완료 |
| `https://post.alibaba.com/product/batch_upload.htm` | CSV/JSON 대량 상품 등록 및 원본행 검증 | 파트너 콘솔 | `https://wholesale-partner.dnjstjqppk.workers.dev/catalog/bulk` | `/catalog/bulk` | SUPPLIER_SALES | `POST /v1/catalog/bulk-upload` | `apps/partner-web/src/views/BulkUploadView.vue` | 검증 완료 |
| `https://rfq.alibaba.com/rfq/supplier/rfq_market.htm` | RFQ 시장 탐색 및 견적서 제출 | 파트너 콘솔 | `https://wholesale-partner.dnjstjqppk.workers.dev/rfq-market` | `/rfq-market` | SUPPLIER_SALES | `POST /v1/sourcing/rfqs/:id/quotes` | `apps/partner-web/src/views/RFQMarketView.vue` | 검증 완료 |
| `https://shipping.alibaba.com/order/fulfillment.htm` | 분할 출고 등록 (누적 한도 제약, 운송장 입력) | 파트너 콘솔 | `https://wholesale-partner.dnjstjqppk.workers.dev/fulfillment` | `/fulfillment` | SUPPLIER_FULFILLMENT | `POST /v1/logistics/shipments` | `apps/partner-web/src/views/FulfillmentView.vue` | 검증 완료 |
| `https://finance.alibaba.com/settlement/...` | 정산 원장, 수수료 5% 공제, 실수령액, 동결 조회 | 파트너 콘솔 | `https://wholesale-partner.dnjstjqppk.workers.dev/settlement` | `/settlement` | SUPPLIER_FINANCE | `GET /v1/settlements` | `apps/partner-web/src/views/SettlementView.vue` | 검증 완료 |
| `비공개 (Alibaba 내부 운영자 어드민)` | 플랫폼 운영 총괄 대시보드 | 관리자 콘솔 | `https://wholesale-admin.dnjstjqppk.workers.dev/` | `/` | PLATFORM_ADMIN | `GET /v1/health` | `apps/admin-web/src/views/AdminDashboardView.vue` | 검증 완료 |
| `비공개 (Alibaba 내부 심사 어드민)` | 공급사 실사 및 Verified Supplier 인증 심사 | 관리자 콘솔 | `https://wholesale-admin.dnjstjqppk.workers.dev/verifications` | `/verifications` | PLATFORM_REVIEWER | `POST /v1/organizations/:id/verifications/review` | `apps/admin-web/src/views/VerificationReviewView.vue` | 검증 완료 |
| `비공개 (Alibaba 분쟁 중재 어드민)` | 분쟁 중재, 에스크로 정산 동결 및 부분환불 집행 | 관리자 콘솔 | `https://wholesale-admin.dnjstjqppk.workers.dev/disputes` | `/disputes` | PLATFORM_SUPPORT | `POST /v1/disputes/:id/arbitrate` | `apps/admin-web/src/views/DisputeArbitrationView.vue` | 검증 완료 |
| `비공개 (Alibaba 재무 대사 어드민)` | PG 입금 대사 및 복식원장 차대변 검증 | 관리자 콘솔 | `https://wholesale-admin.dnjstjqppk.workers.dev/reconciliation` | `/reconciliation` | PLATFORM_FINANCE | `POST /v1/settlements/reconcile` | `apps/admin-web/src/views/LedgerReconciliationView.vue` | 검증 완료 |
| `비공개 (Alibaba 감사 로그)` | 불변 감사 로그 열람 | 관리자 콘솔 | `https://wholesale-admin.dnjstjqppk.workers.dev/audit` | `/audit` | PLATFORM_SECURITY | `GET /v1/audit-logs` | `apps/admin-web/src/views/AuditLogView.vue` | 검증 완료 |
| `https://openapi.alibaba.com/` | 공통 코어 B2B API (RFC 7807, 십진수 minor 정산) | 공통 API 콘솔 | `https://wholesale-api.dnjstjqppk.workers.dev/v1` | `/v1/*` | All Authorized Services | `GET /v1/health`, `POST /v1/auth/*` 등 18개 엔드포인트 | `apps/api-worker/src/index.ts` | 검증 완료 |

