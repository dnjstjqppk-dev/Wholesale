# 데이터베이스 데이터 사전 (DATABASE_DICTIONARY_KO)

- **버전**: 1.0 (2026-10-18)
- **엔진**: PostgreSQL 17+
- **보존 원칙**: 상업 증적, 결제 내역, 복식 원장, 계약서는 영구 보존(Immutable / Soft-delete / Archive).
- **수치 정밀도 표준**:
  - 단가 및 수량: `numeric(20,6)`
  - 통화 금액(결제/정산/소계): `bigint` (화폐 최소 단위 minor units: e.g. KRW 1원 = 1, USD 1센트 = 1)
  - 환율: `numeric(24,12)`
  - 시간대: `timestamptz` (ISO 8601 UTC 기준 저장)

---

## 1. 회원 및 기업 식별 도메인 (Identity & Organizations)

### `users` (개인 계정)
| 컬럼명 | 데이터 타입 | Null | 기본값 | 설명 및 제약 |
|---|---|---|---|---|
| `id` | `uuid` | N | `uuid_generate_v4()` | 사용자 고유 식별자 (PK) |
| `email` | `varchar(255)` | N | - | 로그인 이메일 (UNIQUE, 인덱스) |
| `password_hash` | `varchar(255)` | N | - | Argon2id 또는 bcrypt 해시 암호문 |
| `full_name` | `varchar(120)` | N | - | 실명 성명 |
| `phone_number` | `varchar(50)` | Y | NULL | 연락처 (국제 E.164 형식) |
| `is_active` | `boolean` | N | `true` | 계정 활성화 상태 |
| `created_at` | `timestamptz` | N | `now()` | 가입 시각 |

### `organizations` (기업 테넌트)
| 컬럼명 | 데이터 타입 | Null | 기본값 | 설명 및 제약 |
|---|---|---|---|---|
| `id` | `uuid` | N | `uuid_generate_v4()` | 기업 고유 식별자 (PK) |
| `legal_name` | `varchar(255)` | N | - | 법인/상호 공식 명칭 |
| `trade_name` | `varchar(255)` | Y | NULL | 브랜드/대외 표기 상호 |
| `business_number` | `varchar(100)` | N | - | 사업자등록번호 (UNIQUE) |
| `country` | `char(2)` | N | `'KR'` | 법인 등록 국가 (ISO 3166-1 alpha-2) |
| `business_type` | `varchar(50)` | N | - | `MANUFACTURER`, `TRADING_COMPANY`, `OEM_ODM`, `BUYER_CORP` |
| `capabilities` | `text[]` | N | `ARRAY['BUYER']` | 기업 역량 태그 (`BUYER`, `SUPPLIER`) |
| `is_verified_supplier`| `boolean` | N | `false` | 플랫폼 운영자 실사 및 인증 완료 여부 |

### `memberships` (기업-사용자 소속 및 권한)
| 컬럼명 | 데이터 타입 | Null | 기본값 | 설명 및 제약 |
|---|---|---|---|---|
| `id` | `uuid` | N | `uuid_generate_v4()` | 멤버십 식별자 (PK) |
| `user_id` | `uuid` | N | - | FK -> `users.id` (RESTRICT) |
| `organization_id` | `uuid` | N | - | FK -> `organizations.id` (RESTRICT) |
| `role` | `varchar(50)` | N | - | `ORG_OWNER`, `BUYER_PURCHASER`, `BUYER_APPROVER`, `SUPPLIER_SALES` 등 |
| `is_active` | `boolean` | N | `true` | 재직/소속 활성화 상태 |

---

## 2. 상품 카탈로그 및 구간 단가 도메인 (Catalog & Tiered Pricing)

### `listings` (도매 상품)
| 컬럼명 | 데이터 타입 | Null | 기본값 | 설명 및 제약 |
|---|---|---|---|---|
| `id` | `uuid` | N | `uuid_generate_v4()` | 상품 식별자 (PK) |
| `organization_id` | `uuid` | N | - | 공급사 기업 FK -> `organizations.id` |
| `category_id` | `uuid` | N | - | 분류 FK -> `categories.id` |
| `title` | `varchar(255)` | N | - | 상품명 (다국어 검색 대상) |
| `moq` | `numeric(20,6)` | N | - | 최소 발주 수량 (0 초과) |
| `quantity_step` | `numeric(20,6)` | N | `1.0` | 발주 단위 배수 (step) |
| `unit` | `varchar(30)` | N | `'pcs'` | 수량 단위 (`pcs`, `kg`, `boxes`, `sets` 등) |
| `lead_time_days` | `int` | N | `14` | 표준 제조/납기 소요일수 |
| `status` | `varchar(50)` | N | `'DRAFT'` | `DRAFT`, `UNDER_REVIEW`, `PUBLISHED`, `ARCHIVED` |

### `price_tiers` (수량 구간별 단가표)
| 컬럼명 | 데이터 타입 | Null | 기본값 | 설명 및 제약 |
|---|---|---|---|---|
| `id` | `uuid` | N | `uuid_generate_v4()` | 구간 단가 식별자 (PK) |
| `price_list_id` | `uuid` | N | - | FK -> `price_lists.id` |
| `min_quantity` | `numeric(20,6)` | N | - | 구간 최소 수량 (포함 $[min, next)$) |
| `max_quantity` | `numeric(20,6)` | Y | NULL | 구간 상한 수량 (미만, NULL=무한대) |
| `unit_price` | `numeric(20,6)` | N | - | 해당 구간 단가 (전량 적용) |

---

## 3. 재고 도메인 (Inventory)

### `inventory_balances` (가용/예약 재고 원장)
| 컬럼명 | 데이터 타입 | Null | 기본값 | 설명 및 제약 |
|---|---|---|---|---|
| `id` | `uuid` | N | `uuid_generate_v4()` | PK |
| `warehouse_id` | `uuid` | N | - | FK -> `warehouses.id` |
| `sku_id` | `uuid` | N | - | FK -> `skus.id` |
| `on_hand` | `numeric(20,6)` | N | `0` | 실물 보유 재고 |
| `reserved` | `numeric(20,6)` | N | `0` | 주문 진행 중 예약 재고 |
| `available` | `numeric(20,6)` | N | (계산식) | `STORED GENERATED ALWAYS AS (on_hand - reserved)` |

---

## 4. 조달 및 무역 거래 계약 도메인 (Sourcing & Trade Contracts)

### `rfqs` (견적의뢰서)
| 컬럼명 | 데이터 타입 | Null | 기본값 | 설명 및 제약 |
|---|---|---|---|---|
| `id` | `uuid` | N | `uuid_generate_v4()` | RFQ PK |
| `buyer_organization_id`| `uuid` | N | - | 구매 기업 식별자 |
| `title` | `varchar(255)` | N | - | 조달 프로젝트명 |
| `destination_country` | `char(2)` | N | - | 도착국 ISO 코드 |
| `status` | `varchar(50)` | N | `'PUBLISHED'` | `DRAFT`, `SUBMITTED`, `PUBLISHED`, `AWARDED`, `EXPIRED` |

### `trade_orders` (도매 거래 주문)
| 컬럼명 | 데이터 타입 | Null | 기본값 | 설명 및 제약 |
|---|---|---|---|---|
| `id` | `uuid` | N | `uuid_generate_v4()` | 주문 식별자 (PK) |
| `order_number` | `varchar(64)` | N | - | 고유 거래 주문번호 (UNIQUE) |
| `buyer_organization_id`| `uuid` | N | - | 구매 기업 FK |
| `supplier_organization_id`| `uuid` | N | - | 공급 기업 FK |
| `quote_id` | `uuid` | Y | NULL | 수락된 견적서 FK |
| `total_amount_minor` | `bigint` | N | - | 최종 거래 총액 (소수점 없는 minor 단위) |
| `currency` | `char(3)` | N | `'USD'` | 결제/청구 거래 통화 |
| `order_status` | `varchar(50)` | N | `'DRAFT'` | FSM 업무 상태 (STATE_TRANSITIONS_KO 참조) |
| `payment_status` | `varchar(50)` | N | `'PENDING'` | 결제 진행 상태 |

---

## 5. 복식부기 원장 및 정산 도메인 (Ledger & Settlements)

### `ledger_journals` & `ledger_entries`
- **회계 원칙**: 불변 전표 (Immutable Posting). `posted` 이후 절대 UPDATE/DELETE 금지.
- **방정식**: $\sum \text{debit\_minor} = \sum \text{credit\_minor}$ per journal.
- **계정 과목**:
  - `ASSET_PG_CLEARING`: PG사 입금 대기 매입채권
  - `LIABILITY_ESCROW`: 고객 결제금 예수 부채
  - `LIABILITY_SUPPLIER_PAYABLE`: 공급사 정산 미지급금
  - `REVENUE_PLATFORM_FEE`: 플랫폼 거래 수수료 수익
