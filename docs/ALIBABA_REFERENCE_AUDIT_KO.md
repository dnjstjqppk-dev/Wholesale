# Alibaba.com 도매 거래 구조 선행조사 및 참조 원칙 (ALIBABA_REFERENCE_AUDIT_KO)

- **조사 기준일**: 2026-10-18
- **문서 버전**: 1.0
- **프로젝트 가칭**: WHOLESALE (독립 브랜드 B2B 전자상거래 플랫폼)
- **작성자**: B2B 커머스 총괄 테크 리드 / 시스템 아키텍트

---

## 1. 선행조사 개요 및 투명성 선언

본 조사는 2026-10-18 기준 공개 웹(Alibaba.com Buyer Central, Supplier Onboarding Guide, RFQ Market, Verified Supplier 공시, Trade Assurance 정책 공시, Logistics & Trade Document 가이드, Open Platform 개발자 문서)을 바탕으로 분석된 도매 업무 흐름 및 데이터 구조를 정리한 것입니다.

> **[원칙 및 한계 공시]**
> 1. 로그인 후 비공개 내부 콘솔(공급사 내부 생산 ERP, 알리바바 내부 운영 관리자 어드민, 결제 정산 원장 DB, 비공개 API)은 검수 대상에 포함되지 않았으며, 이를 추정하여 무단 복제하지 않습니다.
> 2. 참고 대상은 **도매 상업 업무 프로세스(RFQ, 수량 구간별 가격, MOQ, 검수, 무역 서류, 에스크로 정산)**이며, Alibaba 로고, 상표, 배지, 카탈로그 사진 및 상품 DB를 무단 도용하지 않고 독립 브랜드 및 고유 디자인 시스템으로 구현합니다.
> 3. Alibaba.com, 1688, AliExpress는 별개의 사업자/API 자격/권한 계약 체계를 가지므로 본 플랫폼은 독립된 자체 공급망 및 카탈로그 체계로 동작합니다.

---

## 2. Alibaba.com 핵심 기능 구조 분석 및 벤치마킹 매핑

### 2.1 공급사 유형 및 검증(Verification)
- **Alibaba 모델**: Gold Supplier vs. Verified Supplier (SGS, TÜV 등 제3자 인증기관의 공장 실사, 생산능력, 시험성적서, 인증서 검증).
- **WHOLESALE 구현 원칙**:
  - `organizations` 테이블에 `business_type` (MANUFACTURER / TRADING_COMPANY / OEM_ODM) 및 `verification_status` 필드 필수화.
  - 제3자 심사 서류 및 사업자 등록증 업로드 검증 모듈 (`verification_requests`, `certificates`).
  - 미승인 공급사의 "인증 배지" 자동 생성 절대 금지 (운영자 심사 승인 트랜잭션 필수).

### 2.2 상품(Catalog) & 수량 구간별 단가(Tiered Pricing)
- **Alibaba 모델**:
  - 단일 가격이 아닌 수량 구간(Quantity Tiers: e.g. 100~499, 500~999, 1000+)별 계단식 단가.
  - 최소 주문 수량 (MOQ: Minimum Order Quantity) 및 발주 단위(Step Quantity).
  - 샘플 정책 (유료/무료, 배송비 부담 조건, 본주문 시 공제 여부).
  - 커스터마이징 조건 (로고 인쇄, 맞춤형 포장, 그래픽 커스텀에 따른 MOQ 및 추가 납기).
- **WHOLESALE 구현 원칙**:
  - 단가: `numeric(20,6)`, 수량: `numeric(20,6)`, 소수점 반올림: `ROUND_HALF_UP`.
  - 가격 구간은 `[min_quantity, next_tier_quantity)` 반개구간이며 누진제가 아닌 전량 해당 구간 단가 적용.
  - 구간 중복은 DB PostgreSQL EXCLUDE 제약으로 원천 차단.

### 2.3 조달 프로세스 (RFQ & Quotes)
- **Alibaba 모델**:
  - Buyer가 규격, 도면, 목표 단가, 배송국을 담아 RFQ 발행.
  - 적격 공급사 매칭 및 견적(Quote) 제출.
  - 견적 협상(Quote Revisions)을 통한 단가/납기/인코텀즈 합의 후 주문 전환.
- **WHOLESALE 구현 원칙**:
  - RFQ 공개 시 구매사 연락처는 익명화하여 무단 우회 거래 방지.
  - 공급사 A의 견적 및 채팅을 공급사 B에게 절대 노출하지 않는 테넌트 격리.
  - 견적 승인 시 멱등키 및 분산 락(Row Locking)을 통해 동일 버전 중복 수락 및 초과 발주 방지.

### 2.4 무역 거래 계약 및 결제 (Trade Contract & Split Payments)
- **Alibaba 모델**:
  - Sales Contract (당사자, 규격, Incoterms 2020 규칙, 생산 검수 조건 명시).
  - 대량 거래 결제 분할 (Down Payment: 계약금 30%, Balance: 잔금 70%).
  - 에스크로(Escrow) 기반 보호: 잔금은 선적 및 검수 통과 확인 후 지급 보류 해제.
- **WHOLESALE 구현 원칙**:
  - 계약서 전자 서명 시 문서 SHA-256 해시 대조 및 서명자 자격 검증.
  - `payment_schedules` 테이블을 통한 계약금/중도금/잔금 일정 분리.
  - 검수(Inspection) 합격 증빙 및 수령 확인 이전 정산 대금 자동 지급 차단.

### 2.5 물류, 분할 선적 및 무역 서류 (Logistics & Trade Documents)
- **Alibaba 모델**:
  - B/L (선하증권), AWB (항공화물운송장), Packing List, Commercial Invoice 첨부.
  - 분할 출고(Partial Shipment) 지원.
- **WHOLESALE 구현 원칙**:
  - 누적 출고 수량 $\le$ 계약 발주 수량 무결성 제약.
  - 무역 서류 업로드 시 파일 MIME/크기/악성코드 검증 및 거래 당사자 ACL 적용.

---

## 3. 독자 플랫폼 구현 및 아키텍처 경계

1. **독립된 고유 UI/UX**:
   - 주색상 Navy (`#173A5E`), 액션 Orange (`#C2410C`), 밀도 높은 표와 데이터 중심의 B2B 업무 환경.
2. **복식부기 금융 원장**:
   - 모든 결제, 수수료, 채무, 정산, 환불은 불변 전표(`ledger_journals`, `ledger_entries`)에 기록하며 차변 합계 = 대변 합계 원칙 준수.
3. **엄격한 다중 테넌트 격리**:
   - Organization 단위 멤버십 및 RBAC 권한 검사.
   - DB 레벨 Row-Level Security (RLS) 및 서비스 계층 2중 방어.
