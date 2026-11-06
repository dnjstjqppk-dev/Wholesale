# PHASE 2–4 완료 리포트 — 상용화 하드닝 + 디자인 시스템 통일

- 기준: [PHASE 1 정밀 분석 리포트](./PHASE1_AUDIT_REPORT.md) (정정 이력 포함)
- 작업일: 2026-11-07
- 원칙: 기존 코드 컨벤션 준수, 실동작 검증(빌드·테스트) 후 완료 선언

---

## 1. 보안 하드닝 (Auth & Security) — 치명적 5종 해결

| # | 결함 (PHASE 1 근거) | 수정 | 검증 |
|---|---|---|---|
| 1 | 평문 비밀번호 저장·비교 (`store.ts`, `routesAuth.ts:92`) | PBKDF2-SHA256 10만 회 해시로 시드 교체 (실제 `hashPassword`로 생성한 값 임베드) | `security_test.js` #4, #2·#3 |
| 2 | 미등록 이메일 로그인 시 자동계정 생성 (`routesAuth.ts:73-92`) | 안전 모듈(`authSecure.ts`)로 교체 배선 → 미등록 401 | `security_test.js` #1 |
| 3 | JWT 비밀키 하드코드 + 이중 구현 (`jwt.ts` vs `security.ts`) | 단일 구현(`security.ts`, iss/aud/1h)으로 통일, `Env.JWT_SECRET` 주입, 미설정 시 dev 폴백(경고) / production fail-closed, `configureRequest` 매 요청 바인딩 | `security_test.js` #10, `worker_trade_cycle_test.js` 전 구간 |
| 4 | PG 웹훅 서명 미검증 (`'valid-test-sig'`) | `X-Webhook-Timestamp`+`X-Webhook-Signature` HMAC-SHA256 검증, 미설정 시 503, 위조 시 401 | `security_test.js` #5·#6·#7 |
| 5 | Rate Limit 없음 | 엣지 슬라이딩 윈도우 (인증 30/분, 일반 600/분/IP) | `security_test.js` #8 |

추가 하드닝:

- **RBAC 전면 게이트**: 전체 변이 엔드포인트에 `check(ctx, 401)` + 역할/당사자 게이트 (구매·공급·어드민 분리, `PLATFORM_ADMIN` 전용 거버넌스).
- **데모 계정전환기 제거**: `/v1/auth/switch-role` 삭제, 프론트는 표준 로그인 재인증으로 전환.
- **서버 주도 가격**: 장바구니·주문·견적수락의 클라이언트 단가 신뢰 제거 → BigInt 정밀 `priceListing`/`moneyMinor` 배선 (사망 코드였던 `pricing.ts` 부활).
- **계약 해시 실체화**: 고정 상수 → 정식(canonical) 조건 SHA-256, 서명 시 재계산 검증 (시드 해시도 정식값으로 교체).
- **메신저 발신자 위조 차단**: `sender_*`를 세션에서 강제.
- **정산 SoD 복구**: 공급사 payout 직접 집행 → 신청(`PAYOUT_REQUESTED`)으로 격하, 1차 승인 필수 + 2인 이중통제 유지.
- **견적/주문/정산/분쟁 테넌트 필터**: 타사 견적·주문·정산·분쟁·문의 노출 차단.
- **신규 상품 심사 큐 강제**: `UNDER_REVIEW` 고정 + 뱃지 자동부여 차단 (모더레이션 승인 시에만 `PUBLISHED`).
- **등록 정책**: 12자 이상 비밀번호, 중복 이메일 409, `role_capability` 검증.
- `DomainError → RFC 7807` 매핑을 엣지 전역 경계에 추가 (422/403/409 등이 500이 아닌 정식 문제응답으로 반환).

삭제된 사망/취약 코드: `apps/api-worker/src/jwt.ts`, `apps/api-worker/src/routesAuth.ts`.

## 2. 디자인 시스템 v2 (Design 100% 기반)

- **브랜드 확정**: "Trade Certainty" — 딥 네이비(계약 신뢰) + 시그널 오렌지(거래 실행), `WHOLESALE` 워드마크 유지.
- **`packages/design-tokens/tokens.css` 신설**: 색·서체·스케일·반경·그림자 변수 + 버튼/뱃지/카드/폼/배너/스켈레톤/빈상태/어드민 헬퍼 클래스. 3개 앱 `main.ts`에서 임포트 (이전까지 토큰은 참조 0건인 장식 문서였음).
- **브랜드 오렌지 3종 분열 해소**: `#D64000`·`#CC3D00` → `#C2410C`로 25개 웹 파일 + 모바일 2개 파일 통일 (잔여 0건 검증).
- **SVG 아이콘 시스템**: `packages/ui/WsIcon.vue` 40종, 3개 앱 전체 뷰의 템플릿 이모지 200여 개 교체. `packages/ui`는 vite alias만 있고 import 0건이었음 → 3개 앱 + tsconfig paths 배선으로 실제 공용화.
- **셸 스타일 토큰화**: buyer/admin/partner `App.vue`의 하드코딩 색상을 `var(--ws-*)`로 전환 (라이트 테마 + 어드민 다크 테마 분리 유지).
- **신규 화면 100% 시스템 적용**: 404 ×3, 500 ×3(전역 에러핸들러 배선), 온보딩, 이용약관, 개인정보처리방침 + 에러/빈 상태(`ws-banner`, `ws-empty`) 2개 화면 추가.

## 3. Legal & UX 공백 해소

- 404 페이지 3종 + 라우터 캐치올 연결 (무단 홈 리다이렉트 제거, `/` 루트 리다이렉트는 유지).
- 이용약관·개인정보처리방침 (실제 플랫폼 규칙 반영: SoD·에스크로·수수료 5%·이중승인·분쟁동결·PBKDF2·테넌트 격리) + 푸터 링크.
- RFQ/분쟁 작성 화면 제출 상태 바인딩 (`submitting` → disabled + 라벨).
- 재고/문의 화면 로드 실패·빈 상태 배너 추가.
- SEO: buyer 메타/OG 4개 언어 로케일, partner/admin `noindex` + 설명·테마컬러.

## 4. 데이터 오염 제거

- 릭롤 영상 URL 2건 → 빈 값 (렌더 사용처 없음 확인).
- `REQUIREMENTS_ACCEPTANCE.csv` 한글 복원 (26행, openapi·테스트명 근거) + IDN/CAT/SRC/TRD/PAY/LOG/SET 행의 구현 파일을 실제 파일로 정정.

## 5. 관측 가능성 (Observability) — 가짜 메트릭 제거 + Sentry 실배선

- **실측 메트릭**: `src/observability.ts` 신설. `export default.fetch`를 `handleRequest` + 측정 래퍼로 분리, 매 요청의 상태·지연을 기록. `/v1/metrics`의 고정값(`latency_p95_ms: 12.4` 등)과 가짜 누적(`total_requests` 4820 시작) 삭제 → 실측 `requests_total`·`errors_total`(5xx만)·`error_rate`·`latency_ms_p50/p95/p99`·`latency_samples` 반환.
- **전 응답 추적 헤더**: health·metrics·OPTIONS·404를 포함한 모든 응답에 `X-Request-Id`·`X-Response-Time-Ms` 부착.
- **구조화 로그**: 요청당 1줄 JSON 로그 (`ts`·`level`·`service`·`request_id`·`method`·`path`·`status`·`latency_ms`).
- **Sentry 훅**: 5xx 전역 경계에서 `reportError()` 호출 — 항상 구조화 로그, `SENTRY_DSN` 유효 시에만 envelope API 전송(2초 타임아웃, 실패해도 throw 금지). DSN 파서는 garbage·평문http를 fail-closed로 거부.
- **프론트 Sentry**: 3개 앱에 `@sentry/vue` v11 설치 + `VITE_SENTRY_DSN` 설정 시에만 lazy-load 초기화, 기존 500 리다이렉트 핸들러와 체인 유지.
- **운영 문서**: `.env.example`에 `SENTRY_DSN`·`VITE_SENTRY_DSN` 추가, `apps/api-worker/README.md` 신설(시크릿 주입·메트릭·로그 규격).
- **빌드 수정**: 루트 `tsconfig.json`에 `allowImportingTsExtensions` 추가 — CI의 루트 `tsc --noEmit`이 기존 `.ts` 확장자 관례와 충돌해 실패하던 것을 해소.

## 6. 테스트 (Durable Collateral)

| 스위트 | 결과 |
|---|---|
| `tests/security/security_test.js` (신규, 실제 워커 실행) | 30/30 |
| `tests/e2e/worker_trade_cycle_test.js` (신규, 14단계 전체 사이클) | 65/65 |
| `tests/e2e/worker_pagination_test.js` (신규, 페이지네이션·검색·필터) | 88/88 |
| `tests/e2e/worker_observability_test.js` (신규, 실측 메트릭·추적·Sentry 훅) | 32/32 |
| `tests/contract/contract_test.js`, `tests/contract/schema_verification_test.js`, `tests/e2e/e2e_full_cycle.js`(22/22), `tests/load/load_concurrency.js` (기존) | 전부 PASS (최종 검증에서 재확인) |
| `apps/buyer-web` router tests (404·500·법무·온보딩 케이스 포함) | 6/6 |
| `services/api` Go 전체 | 11 패키지 ok (최종 검증에서 재확인) |
| `flutter analyze --no-pub` | No issues |
| 빌드: worker tsc + 루트 tsc + buyer/partner/admin (`vue-tsc` + vite) | 전부 그린 |

CI(`ci.yml`)에 신규 스위트 4종 등록 (security, trade_cycle, pagination, observability).

## 7. 남은 상용화 과제 (정직한 선언 — 외부 차단·후속)

1. **영속성**: 엣지 인메모리는 데모 한계 그대로. 상용은 Go+Postgres 승격 또는 D1/KV 바인딩 필요 (아키텍처 결정 사항).
2. **실결제**: 법인 PG 계약 후 키 주입 (웹훅 HMAC 검증부는 준비됨). `REQ-EXT-01` 유지.
3. **실시간 관세·택배**: Unipass·택배사 협약 필요. `REQ-EXT-02` 유지.
4. **소셜 로그인·MFA**: 스키마만 존재. 다음 마일스톤.
5. **본문 장식 이모지 잔여**: 템플릿 이모지는 전수 교체 완료. 본문 카피 내 일부 장식 이모지 잔존 가능 — 화면별 순차 교체 권장.
6. **E2E 브라우저 테스트**: 다음 마일스톤.

---

*모든 완료 선언은 본 세션에서 직접 실행한 빌드·테스트 결과에 근거한다.*
