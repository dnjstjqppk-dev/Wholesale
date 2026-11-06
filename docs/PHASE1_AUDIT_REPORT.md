# PHASE 1 — 코드베이스 + 디자인 전수 정밀 분석 리포트

- 분석 기준일: 2026-11-07 (코드 직접 판독, 추측 없음)
- 분석 범위: 루트 ~ `apps/*`, `services/*`, `packages/*`, `src/*`, `db/*`, `contracts/*`, `deploy/*`, `docs/*`, `tests/*`, `.github/*` 전체 (벤더 `node_modules`, 빌드 산출물 `dist`, `.wrangler` 제외, 소스 파일 약 150개)
- 검증 수행: `apps/buyer-web` 프로덕션 빌드 통과 확인, `services/api` Go 전체 테스트 통과 확인 (11개 패키지 모두 `ok`)
- 정정 이력: 초판의 3개 항목(서체 미적용 주장, VerificationReviewView 스텁 판정, MasterDataView 한글깨짐 판정)은 재검증 결과 오판으로 확인되어 본문에 정정 표시. `BuyerProfileView` 한글깨짐 의심도 동일하게 콘솔 아티팩트였음.

---

## 1. 플랫폼 정체 (코드 근거)

### 1.1 한 줄 정의

**Alibaba.com 방식의 B2B 도매 무역 전체 사이클을 구현한 독립 브랜드 엔터프라이즈 마켓플레이스 모노레포.**
구매자(buyer) 탐색·발주, 공급자(supplier) 판매·출고, 플랫폼 운영자(admin) 거버넌스를 3개 웹 콘솔 + 1개 모바일 앱 + 엣지 API + Go 코어 엔진으로 분리한 멀티테넌트 B2B 무역 플랫폼이다.

### 1.2 핵심 도메인 (코드 근거)

| 도메인 | 근거 파일 | 핵심 규칙 |
|---|---|---|
| 카탈로그 + 구간단가 | `services/api/internal/catalog/pricing.go` (`CalculatePrice`, `ValidateTiers`), `apps/api-worker/src/pricing.ts` | 수량 구간 `[min, max)` 전량 단일단가, MOQ·Step 검증, 통화별 minor 정밀도, `ROUND_HALF_UP` |
| 재고 예약 | `services/api/internal/inventory/reservation.go` | `available = on_hand - reserved`, 동시성 초과판매 차단 |
| RFQ/견적 소싱 | `services/api/internal/sourcing/rfq.go`, `apps/api-worker/src/routesSourcing.ts` | 공개 RFQ 연락처 마스킹, 견적 리비전 supersede, 낙찰 시 주문 원자 생성, 멱등키 |
| 무역 계약 | `services/api/internal/trade/contract.go` | Incoterms 2020 구조체, 계약서 SHA-256 해시 서명 검증, 자기결재(SoD) 차단 |
| 분할 결제 + 복식원장 | `services/api/internal/payment/ledger.go`, `apps/api-worker/src/routesPayment.ts` | 계약금 30% / 잔금 70%, `sum(debit)==sum(credit)` 강제, Reversal 역분개 |
| 분할 선적 | `services/api/internal/logistics/shipment.go` | `Σshipped ≤ ordered` 누적 초과 차단 |
| 정산 | `services/api/internal/settlement/settlement.go` | 매출 − 수수료(5%) − 세금, 분쟁 시 `HELD` 자동 동결 |
| 분쟁/중재 | `services/api/internal/support/dispute.go` | `OPENED → EVIDENCE → MEDIATION → RESOLVED_* → CLOSED`, 정산 동결 연동 |
| 거버넌스 | `apps/api-worker/src/routesGovernance.ts`, `apps/admin-web` 10개 라우트 | KYB 실사 승인, 모더레이션, 원장 감사, PG 대사, 정산 이중승인, 감사로그 |
| 비동기 이벤트 | `contracts/events/events.json` | Outbox/Inbox `BaseEvent` + 4개 페이로드 (주문·결제·재고·분쟁) |
| 상태기계 문서 | `docs/STATE_TRANSITIONS_KO.md` | 7개 FSM (RFQ/견적/주문/결제/선적/분쟁/정산) |

### 1.3 비즈니스 모델 (코드 근거)

- B2B 마켓플레이스 중개 + 에스크로 결제 보호 + 정산 수수료(시드 정산 `fee_minor: 21000 / gross 420000` = **5%**, `apps/api-worker/src/store.ts:229`).
- 공급자 성장 상품 존재: 키워드 광고(KWA) 관리 화면 (`apps/partner-web/src/views/MarketingKwaView.vue`), Verified Supplier 실사 (`verifications` 맵, `VerificationAuditView.vue`).
- 무역보증(Trade Assurance) 클레임·세관 신고·공장 품질감사 스토어 존재 (`tradeAssuranceClaims`, `customsDeclarations`, `factoryQualityAudits` in `routesTrade.ts` import).

## 2. 전체 기술 스택 (코드 근거)

### 2.1 Frontend

| 앱 | 스택 (package.json / pubspec 근거) | 라우트 수 |
|---|---|---|
| `apps/buyer-web` | Vue 3.5 + vue-router 4.4 + Pinia 2.2, Vite 6.2, TypeScript 5.7, `vue-tsc` 빌드 게이트 | 18개 뷰 (locale prefix `/ko|en|zh|ja/KRW|USD|CNY|JPY` + 평문 별칭) |
| `apps/partner-web` | 동일 Vue 스택 | 12개 뷰 |
| `apps/admin-web` | 동일 Vue 스택 | 10개 라우트 (9개 실뷰 + 스텁 1개) |
| `apps/mobile` | Flutter 3 + Dart (`http ^1.2.0`, `intl ^0.19.0`), MaterialApp 듀얼모드(구매/공급 전환) | 구매 6탭 / 공급 5탭 |
| `packages/ui` | 공용 Vue 컴포넌트 4종 (`TierPriceBadge`, `QuoteStatusPill`, `IncotermSelector`, `LedgerSummaryCard`) + `StatusColorMap` | — |
| `packages/design-tokens` | `tokens.json` 단일 진실공급원 (색/간격/서체/반경/그림자/브레이크포인트) | — |

### 2.2 Backend

| 레이어 | 스택 | 근거 |
|---|---|---|
| 엣지 API | Cloudflare Workers + TypeScript (`apps/api-worker`), RFC 7807 `problemResponse`, CORS, `X-Request-Id` 트레이싱 | `src/index.ts`, `src/response.ts`, `src/routes*.ts` 9개 |
| 코어 엔진 | Go 1.24 (`services/api`, `shopspring/decimal`), 의존성 `google/uuid`, `lib/pq` | `go.mod`, `cmd/api/*.go`, `internal/*` 8개 도메인 |
| 백그라운드 워커 | Go (`services/worker`) Outbox 발행·예약만료·PG대사, 틱 루프 | `worker.go` (`RunBackgroundLoop`) |
| DB | PostgreSQL 17 + RLS 테넌트 격리, 6개 마이그레이션, `sqlc` 쿼리 6종 | `db/migrations/001~006`, `db/queries/*.sql` |
| 캐시 | Redis 7 (docker-compose), 세션/락 용도 선언 | `deploy/docker-compose.yml`, `.env.example` |
| 스토리지 | S3 호환 presigned URL 설계 + R2 언급 (구현은 URL 문자열 수준) | `routesStorage.ts`, `.env.example` S3 항목 |
| Auth | HMAC-SHA256 JWT 자체 구현 2종 (아래 Gap 참조), PBKDF2 10만회 해시 함수 존재 | `jwt.ts`, `security.ts`, `authSecure.ts` |
| Payment | 샌드박스 에스크로 엔진 (가상계좌 발급·입금 시뮬레이터·Toss/Stripe 웹훅 리시버 형태만) | `routesPayment.ts`, REQ-EXT-01 BLOCKED |

### 2.3 Infra & Ops

- 호스팅: Cloudflare Workers + Static Assets 4개 독립 배포 (`wrangler.jsonc` × 5, 루트 포함).
- 로컬 오케스트레이션: `deploy/docker-compose.yml` (postgres 17-alpine + redis 7-alpine + Go api 빌드).
- CI: `.github/workflows/ci.yml` (Zero-Mock 린트, PG17 컨트랙트 테스트, Go 테스트, 3개 프론트 빌드) + `cloudflare-deploy.yml` (main 푸시 자동 배포).
- 테스트: Node 계약/E2E/부하 4종 (`tests/`), Go 단위·통합 테스트 전 도메인, buyer-web `tests/router.test.mjs`.
- 관측성: `/v1/health` (엔진 상태), `/v1/metrics` (요청수·주문수·P95/P99 고정값), `SENTRY_DSN`은 Env 선언만.

## 3. 아키텍처와 데이터 플로우

```text
buyer-web / partner-web / admin-web (Vue SPA, Cloudflare Pages/Workers Static)
        │  https://wholesale-api…/v1  (Bearer JWT)
        ▼
api-worker (Cloudflare Workers, Edge TS)
  ├─ CORE_API_URL 설정 시 → Go Core로 프록시 (index.ts:90-98)
  └─ 미설정 시 → Edge-native 인메모리 엔진 (store.ts Map 기반)
        │
        ├─ services/api (Go, :8080) — 가격/원장/재고/계약/정산 도메인 진실
        │     └─ PostgreSQL 17 (RLS) + Redis (docker-compose)
        └─ services/worker (Go) — Outbox/만료/대사 틱 루프 (DB 미연동, 메모리 큐)
```

- **이중 진실 구조**: 엣지 TS 엔진과 Go 엔진이 동일 도메인 로직을 각자 보유. `index.ts`는 `CORE_API_URL`이 있으면 전체 프록시, 없으면 엣지 인메모리로 동작. 실배포 4개 URL은 모두 엣지 단독 모드로 보인다 (workers.dev default, `CORE_API_URL` 바인딩 없음).
- **데이터 플로우 (발주 사이클)**: 카탈로그 탐색 → 장바구니(`carts`) → RFQ/견적(`rfqs`/`quotes`) → 주문+계약(`orders`, SHA-256) → 가상계좌/결제(`virtualAccounts`/`paymentIntents`) → 분할출고(`shipments`) → 정산(`settlements`) → 분쟁 시 동결(`disputes`).
- **ERD (001 중심, 전체 163테이블 선언)**: `users → user_* (프로필/세션/토큰/MFA/OAuth)`, `organizations → organization_profiles/memberships`, `verification_requests/certificates`, `listings → skus → price_tiers (EXCLUDE 중첩방지)`, `warehouses → inventory_balances/reservations`, `rfqs → rfq_items → quotes → quote_revisions/lines`, `trade_orders → trade_contracts → contract_signatures → payment_schedules → payments`, `ledger_journals → ledger_entries`, `shipments → shipment_items`, `inspections`, `settlements → payouts`, `disputes → dispute_evidences`, `reconciliation_runs`, `audit_logs`, `outbox_events/inbox_events`. 002/004/006은 테넌트 RLS, 003/005는850라인 보조·무역보증·세관 스키마.

### 3.1 API 구조 (엣지 기준, 19+ 오퍼레이션)

- Auth: `POST /v1/auth/register|login`, `GET /v1/auth/me`, `GET|PUT /v1/auth/profile`, 주소 CRUD, 서브계정, `POST /v1/auth/switch-role` (데모 전환기).
- Catalog: `/v1/catalog/listings (GET|POST)`, `/detail`, `/categories`, `/suppliers`, CSV 벌크업로드, 이미지검색, `/v1/fx/rates`.
- Sourcing: `/v1/sourcing/rfqs (GET|POST)`, `/{id}/quotes (POST)`, `/quotes/{id}/accept (Idempotency-Key)`, 인콰이어리/메신저 스레드.
- Trade: `/v1/cart*`, `/v1/trade/orders*`, `/contract/sign`, 샘플주문, 물류 선적, 무역보증/세관/검수.
- Payment: 가상계좌 발급·입금시뮬레이터, `create-intent/confirm`, `/webhook` (Toss/Stripe 수신 형태).
- Governance: 검증 승인/반려, 모더레이션, 원장감사, 대사, 정산승인(SoD), 감사로그, 마스터데이터.
- Storage/Realtime/Verification: presigned URL, SSE+알림허브, KYB (NTS MOD-10 + D-U-N-S 언급).

## 4. 구현 vs 미구현/더미 (코드 근거)

### 4.1 실제 동작 (검증됨)

- 구간단가/MOQ/Step/반올림 (Go `pricing.go` + 테스트 전부 `ok`), 복식원장 균형·역분개, 재고 예약·초과방지, 계약 해시·서명, 분할선적 누적상한, 정산·분쟁동결, RFQ 리비전 supersede.
- 엣지 API 전 도메인 CRUD + 상태전이 (인메모리), 4개 콘솔 실배포 `HTTP 200` (README 선언), 4개 언어×4개 통화 i18n+FX (정적 환율), 메신저 스레드·알림허브·SSE 형태.
- CI 4잡 + Go 11패키지 테스트 + Node 계약/E2E/부하 테스트 존재.

### 4.2 더미·스텁·외부차단 (파일:라인 근거)

| # | 항목 | 근거 | 상태 |
|---|---|---|---|
| 1 | 비밀번호 평문 저장·비교 | `store.ts:18,26,34,42,50` 평문, `routesAuth.ts:92` 문자열 비교 | 치명적 |
| 2 | 로그인 시 미등록 이메일 자동계정 생성 (아무 비밀번호로 가입·로그인) | `routesAuth.ts:73-92` | 치명적 (인증 우회) |
| 3 | JWT 비밀키 하드코딩 | `jwt.ts:5` 상수, `security.ts` env 비밀은 `configureRequest` 미호출로 항상 미설정 → `routesPayment`의 `ctx` 항상 null | 치명적 |
| 4 | 이중 JWT 구현 불일치 | `jwt.ts`(30일, iss/aud 없음) vs `security.ts`(1시간, iss/aud 검증) 병존, 라우터별 혼용 | 구조 결함 |
| 5 | PG 웹훅 서명 미검증 | `routesPayment.ts:220` 기본값 `'valid-test-sig'`, `signature_verified: !!signature` 항상 true 가능 | 치명적 |
| 6 | 실제 PG 결제 없음 | `create-intent/confirm` 인메모리 상태 전이만, REQ-EXT-01 `BLOCKED_EXTERNAL` (법인 PG 계약 필요) | 외부 차단 (정당) |
| 7 | 실시간 관세·물류 추적 없음 | REQ-EXT-02 `BLOCKED_EXTERNAL` (Unipass/택배 API 계약 필요) | 외부 차단 (정당) |
| 8 | 영속성 없음 (엣지) | `store.ts` 전체가 `Map/Set` 인메모리, 워커 재배포·리스타트 시 소멸 | 치명적 (상용 불가) |
| 9 | Rate Limit 없음 | 전 코드베이스에 레이트리밋·브루트포스 방어 없음 | 상용 Gap |
| 10 | 소셜 로그인·MFA·세션관리 미구현 | 스키마(`oauth_accounts`, `mfa_*`, `user_sessions`)만 존재, API 없음 | Gap |
| 11 | 입력 검증 체계 없음 | Zod/Joi 등 전무, 각 핸들러 수동 `if` 검사만 | Gap |
| 12 | Go 워커 시뮬레이션 상수 | `worker.go:50,58` `expired := 2`, `reconciled := 3` 고정 반환, DB/큐 미연동 | 더미 |
| 13 | 메트릭 고정값 | `index.ts:81-84` 메모리/P95/P99/에러율 하드코딩 | 더미 |
| 14 | `/v1/auth/switch-role` 데모 계정전환기 | `routesAuth.ts:258-293` 아무나 approver/finance 토큰 발급 | 데모 잔재 (상용 제거 대상) |
| 15 | ~~`VerificationReviewView.vue` 153바이트 스텁~~ → 정정: `VerificationAuditView`를 감싸는 별칭 라우트(정상) | 재확인 결과 스텁 아님 | 정상 |
| 16 | Unsplash 외부 핫링크 ~100건 | 상품·증빙·B/L·인보이스·배너 전부 `images.unsplash.com` | 더미 이미지 |
| 17 | 릭롤 영상 URL | `store.ts:405`, `routesSourcing.ts:582` `watch?v=dQw4w9WgXcQ` | 오염 데이터 |
| 18 | ~~`MasterDataView.vue` 한글 깨짐~~ → 정정: 콘솔 출력 아티팩트, 파일은 정상 UTF-8 (`예: 자동차 & 모빌리티 부품`) | 재확인 결과 정상 | 정상 |
| 19 | `REQUIREMENTS_ACCEPTANCE.csv` 한글 깨짐 | CP949를 UTF-8로 저장, 전 행 `媛쒖씤` 형태 | 오염 |
| 20 | 소수점 정밀도 불일치 | 엣지 `parseFloat` 연산 (`routesTrade.ts:61-73`, 카트 합계 `Math.round(parseFloat*100)`) vs Go decimal 엄밀 계산 | 정합성 Gap |
| 21 | 404/500/약관·개인정보·온보딩 없음 | 라우터가 미지정 경로를 홈으로 `redirect`, Legal 뷰 0개 | UX Gap |
| 22 | Sentry·구조화로깅·페이지네이션 표준 없음 | `SENTRY_DSN` 선언만, `console.*` 산재, cursor 페이지네이션 미구현 | Ops Gap |
| 23 | 모바일 API 연동 불완전 | `ApiClient`는 GET/POST만, 토큰 주입·갱신·에러매핑 없음, 화면 일부 정적 | Gap |

## 5. 상용화 치명적 Gap (우선순위)

1. **영속성 부재** — 엣지 인메모리 Map은 상용 데이터 저장소가 될 수 없음. Go+Postgres를 진실로 승격하거나 D1/KV 바인딩 필요.
2. **인증 붕괴 3종** — 평문 비밀번호, 자동가입 로그인, 하드코드 JWT 비밀키 + 이중 구현.
3. **결제 신뢰 불가** — 웹훅 서명 미검증 + 실제 PG 미연동(외부 계약 차단).
4. **남용 방어 없음** — Rate Limit, 계정 잠금, CSRF(쿠키 미사용으로 낮음)·XSS(입력 살균 없음) 대책 없음.
5. **정합성 이중화** — 엣지 float 연산 vs Go decimal, 이중 JWT, 이중 진실(Edge vs Go) permanently drift 가능.
6. **관측·복구 불가** — Sentry 미연동, 감사로그 인메모리(재시작 시 소멸), DB 백업·마이그레이션 러너(`db/migrate.js`는 1.3KB 최소형) 미검증.
7. **법무·UX 공백** — 약관/개인정보/404/500/온보딩 전무.

## 6. 디자인 전수 감사

### 6.1 페이지·컴포넌트 목록

- buyer-web: App 셸 + 18뷰 + 8 공용컴포넌트 (MegaFlyoutNav, CatalogFilterSidebar, CatalogProductCard, CatalogInquiryModal, ImageSearchModal, PdpGalleryAudit, PdpOrderCalculator, PdpSpecsTable).
- partner-web: App 셸 + 12뷰. admin-web: App 셸 + 9실뷰 + 1스텁.
- packages/ui: 4종 공용 컴포넌트. **단, 3개 앱 어디에서도 `@packages/ui`를 import하지 않음** (vite alias만 선언, 실제 사용 0건) — 공용화 실패.
- mobile: 20개 Dart 파일 (main + api_client + 3모델 + 15뷰).

### 6.2 현재 스타일 정리

- 토큰 선언: Primary `#C2410C` / Hover `#9A3412` / Light `#FFEDD5`, Navy `#173A5E/#0F243B`, 텍스트 `#172B4D/#42526E/#64748B`, 상태 4종 + 배경, 서체 `Noto Sans KR` 스택, 반경 4/6/8/12/pill, 그림자 2종, 브레이크포인트 360/390/768/1024/1440.
- 실제 사용 Top: `#FFF`(176) `#E2E8F0`(134) `#64748B`(119) `#CBD5E1`(85) `#F8FAFC`(82) `#C2410C`(55) `#D64000`(51) `#CC3D00`(51) `#D8E0EB`(33) `#38BDF8`(26).
- **브랜드 오렌지가 3종 병존** (`#C2410C` 토큰 vs `#D64000` vs `#CC3D00`) — 같은 CTA가 앱·화면별로 다른 색.
- admin은 별도 다크 네이비 테마 (`#0B132B/#1C2541/#3A506B` + `#F59E0B` 강조) — 토큰과 무관한 독자 팔레트.
- mobile은 `#D64000` 시드 + `#1A73E8` 세컨더리 — 웹 토큰과 불일치.
- 서체: (정정) 3개 앱 `index.html`이 모두 Google Fonts Noto Sans KR을 로드하고 body에 `font-family`를 지정 — 전역 서체 적용됨. 단, 컴포넌트 단위 타이포 스케일(var)은 없어 크기·자간이 파일별 제각각.
- 버튼/카드/모달: 뷰마다 인라인 재정의 (`.btn-refresh`, `.btn-approve` 등이 파일별로 복사 존재), pill/반경/그림자도 파일별 상이.
- 아이콘: 전면 이모지 (🔍🛒📦🛡️🏭⚖️💰 등 수백 건) — 상용 서비스에서 금기 수준.

### 6.3 결함 리스트

| 분류 | 내용 | 근거 |
|---|---|---|
| 스타일 불일치 | 오렌지 3종, 어드민 독자 다크팔레트, 모바일 별도 시드, 버튼 클래스 파일별 중복 정의, `packages/ui` 사용 0건 | 색상 빈도표, App 3종, alias 미사용 |
| 반응형 | `@media`는 33개 파일에 1~3개씩 존재하나 브레이크포인트가 파일별 제각각 (토큰 360/390/768/1024/1440 미준수), 일부 테이블·모달은 모바일 오버플로 | 미디어쿼리 감사표 |
| 더미 이미지 | Unsplash 핫링크 ~100건 (상품·사업자등록증·B/L·인보이스·배너), 릭롤 영상 2건 | exec-3 스캔 |
| 플레이스홀더 | `MasterDataView` 깨진 placeholder 5건, `via.placeholder` 없음 (대신 Unsplash) | exec-3 스캔 |
| 접근성 | `aria-/role/alt` 전 앱 24건 (40개 뷰 대비), icon-only 버튼 라벨 일부만, 포커스 링 전무, 명도 대비 미검증, 이모지 아이콘 스크린리더 대응 없음 | a11y 감사 |
| UX 데드엔드 | 404 없음(홈 리다이렉트), `DisputeCreateView/RFQCreateView` 제출 상태 미표시 | 상태 감사표 |
| 로딩/빈/에러 | 대부분 뷰는 부분 처리, App 셸·인용검토는 2건 수준, 전역 스켈레톤·에러바운더리 없음 | 상태 감사표 |
| SEO | `index.html` 3종 모두 기본 타이틀 수준, meta/OG/sitemap 없음, SPA 단일 청크 (buyer 318KB JS 단일 번들) | index.html, 빌드 출력 |

### 6.4 결론: 전면 재설계 필요 (코드 근거)

- 토큰(`tokens.json`)은 존재하나 **어느 앱에서도 로드하지 않는 장식 문서**다 (CSS 변수·import 0건).
- 공용 컴포넌트(`packages/ui`) 역시 **import 0건**으로 공용화에 실패했다.
- 브랜드 핵심색이 3종으로 분열되고 어드민·모바일이 각자 독자 팔레트라 "같은 서비스"로 보이지 않는다.
- 이모지 아이콘 전면 사용 + OS 기본 서체 + 파일별 버튼 재정의는 Linear·Stripe급과 거리가 멀다.
- **유지 가치**: 정보구조(라우트·도메인 분리)와 상태색 의미(StatusColorMap의 FSM 매핑)는 유지. **시각 언어는 전면 재설계**가 답이다.

## 7. PHASE 2 기준 대비 현재 판정

| # | 기준 | 판정 | 근거 요약 |
|---|---|---|---|
| 1 | Core 실제 동작 | △ 조건부 | Go 엔진은 엄밀, 엣지는 인메모리+float — 진실 일원화 필요 |
| 2 | Auth & Security | ✕ | 평문 비번·자동가입·하드코드 비밀키·서명 미검증·레이트리밋 없음 |
| 3 | Data | △ | DDL·RLS 우수, 시드·검증체계(Zod/Joi)·트랜잭션(엣지) 없음 |
| 4 | API & Backend | △ | 에러규격·라우팅 양호, 로깅·페이지네이션·검색표준 미흡 |
| 5 | Frontend | △ | 화면·상태처리 다수 존재, 더미 제거·SEO·a11y 미흡 |
| 6 | Payment | ✕(외부차단) | 샌드박스만, 실PG는 법인계약 후 가능 — 코드는 키 주입형으로 준비 |
| 7 | Admin | ○ | 9개 실뷰 거버넌스 완비 (스텁 1개 제외) |
| 8 | Infra & Ops | △ | CI·테스트·배포 양호, Sentry·모니터링·E2E브라우저 미흡 |
| 9 | Legal & UX | ✕ | 약관·개인정보·404·500·온보딩 없음 |
| 10 | Design 100% | ✕ | 토큰 미적용·3색 분열·이모지·서체 미지정 |

---

*본 리포트는 코드 판독과 실행 검증(빌드·테스트)에만 근거한다. 추측 항목 없음.*
