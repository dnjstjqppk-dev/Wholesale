# Wholesale B2B Platform

Cloudflare Workers & Pages 기반의 도매 유통 및 실시간 발주 관리 포털입니다.

## 🌐 실제 라이브 배포 URL
- **Cloudflare Live Production URL**: [https://wholesale.dnjstjqppk.workers.dev](https://wholesale.dnjstjqppk.workers.dev)
- **배포 상태**: `HTTP 200 OK` (Cloudflare Global Edge Network 활성화)
- **최신 배포 버전 ID**: `bab3c594-09b0-4d37-9258-fa661cc0a74e`

## 기술 스택
- **Frontend**: React 18, TypeScript, Vite
- **Deployment**: Cloudflare Workers / Pages (Static Assets)
- **Tooling**: Wrangler 4
- **Backend Core**: Go 1.24+ (RFC 7807, Exact Decimal Minor Pricing, Double-entry Ledger)
- **Database Architecture**: PostgreSQL 17+ Strict Relational Schema

## 로컬 개발 환경 실행
```bash
# 의존성 설치
npm install

# 로컬 개발 서버 실행
npm run dev

# 빌드 테스트
npm run build

# Cloudflare 배포
npx wrangler deploy
```

## Cloudflare 배포 파이프라인
1. `wrangler.jsonc` 설정을 기반으로 정적 자산(Static Assets) 및 SPA 라우팅 지원
2. `npm run build`를 통해 `./dist` 디렉터리 자동 번들링 후 글로벌 엣지 네트워크 배포
