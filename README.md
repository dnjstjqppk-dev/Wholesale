# Wholesale B2B Enterprise Platform (Alibaba.com Benchmark Architecture)

Alibaba.com의 검증된 B2B 도매 비즈니스 프로세스(수량 구간별 차등 단가, MOQ, 다자간 RFQ/견적 협상, SHA-256 서명 무역 계약, 분할 결제, 복식부기 회계 원장, 분할 선적, 분쟁 에스크로 동결 및 정산)를 바탕으로 구축된 **독립 브랜드 엔터프라이즈 B2B 전자상거래 모노레포 플랫폼**입니다.

---

## 🌐 Cloudflare 실제 독립 배포 URL (4개 콘솔)

| 콘솔 구분 | 실제 배포 URL | 설명 및 기능 범위 | 상태 |
|---|---|---|---|
| **사용자 웹 콘솔 (Buyer)** | [https://wholesale.dnjstjqppk.workers.dev/](https://wholesale.dnjstjqppk.workers.dev/) | 글로벌 도매 상품/공급사 탐색, 다중 필터, PDP 수량별 단가 계산기, RFQ 발행, 계약 서명, 발주/출고 추적 | `HTTP 200 OK` (Live) |
| **관리자 웹 콘솔 (Admin)** | [https://wholesale-admin.dnjstjqppk.workers.dev/](https://wholesale-admin.dnjstjqppk.workers.dev/) | 플랫폼 통합 거버넌스, 공급사 실사 및 Verified Supplier 심사 승인, 분쟁 중재, PG 입금 대사, 감사 로그 | `HTTP 200 OK` (Live) |
| **파트너 웹 콘솔 (Partner)** | [https://wholesale-partner.dnjstjqppk.workers.dev/](https://wholesale-partner.dnjstjqppk.workers.dev/) | 공급사 전용 비즈니스 센터, 상품 및 구간단가 CRUD, 재고 관리, RFQ 견적 제출, 분할 출고 등록, 정산 원장 | `HTTP 200 OK` (Live) |
| **공통 API (API Worker)** | [https://wholesale-api.dnjstjqppk.workers.dev/](https://wholesale-api.dnjstjqppk.workers.dev/) | 글로벌 엣지 API 게이트웨이, RFC 7807 규격, 카탈로그/주문/결제/선적/정산/분쟁 REST 엔드포인트 | `HTTP 200 OK` (Live) |

---

## 🛠️ 모노레포 프로젝트 아키텍처

```text
Wholesale/
├── apps/
│   ├── buyer-web/        # Vue 3 / Nuxt SSR 구매자 웹 포털
│   ├── partner-web/      # Vue 3 + Vite + Pinia 공급사 파트너 콘솔
│   ├── admin-web/        # Vue 3 + Vite + Pinia 운영 관리자 콘솔
│   ├── mobile/           # Flutter + Dart 모바일 앱 (구매자/공급사 듀얼 모드)
│   └── api-worker/       # Cloudflare Edge Worker API (TypeScript)
├── services/
│   ├── api/              # Go 1.24+ 코어 업무 비즈니스 엔진 (단가계산, 복식원장, 재고동시성)
│   └── worker/           # Go Outbox 발행, 예약 만료 회수, 일일 대사 백그라운드 워커
├── contracts/
│   ├── openapi/          # OpenAPI 3.0 사양서 (openapi.yaml)
│   └── events/           # Outbox/Inbox 비동기 이벤트 스키마 (events.json)
├── db/
│   ├── migrations/       # PostgreSQL 17+ 엄격한 DDL 및 RLS 테넌트 보안 정책
│   └── queries/          # sqlc 쿼리 정의서
├── packages/
│   ├── design-tokens/    # 웹·모바일 공통 B2B 디자인 토큰 (Navy, Orange, Surface)
│   └── ui/               # 공통 Vue 컴포넌트 라이브러리
├── deploy/
│   └── docker-compose.yml# PostgreSQL 17, Redis, Go API 로컬 통합 오케스트레이션
└── docs/
    ├── ALIBABA_REFERENCE_AUDIT_KO.md       # Alibaba.com 선행조사 및 참조 원칙
    ├── ALIBABA_URL_CATEGORY_MAPPING_KO.md  # 5대 대분류 계층 트리 및 원본 URL 대응 매트릭스
    ├── DATABASE_DICTIONARY_KO.md           # 146개 데이터베이스 사전 및 수치 정밀도 표준
    ├── STATE_TRANSITIONS_KO.md             # 주문/견적/선적/정산/분쟁 유한상태기계 (FSM)
    └── REQUIREMENTS_ACCEPTANCE.csv         # 요구사항 추적 매트릭스
```

---

## 🚀 로컬 개발 및 독립 배포 명령어

```bash
# 1. 구매자 콘솔 배포
cd apps/buyer-web
npm install
npm run build
npx wrangler deploy

# 2. 관리자 콘솔 배포
cd apps/admin-web
npm install
npm run build
npx wrangler deploy

# 3. 공급사 콘솔 배포
cd apps/partner-web
npm install
npm run build
npx wrangler deploy

# 4. 공통 API 배포
cd apps/api-worker
npx wrangler deploy

# 5. Go 핵심 비즈니스 엔진 테스트 실행
cd services/api
go test ./... -v
```
