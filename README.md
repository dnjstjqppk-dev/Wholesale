# Wholesale B2B Platform

Cloudflare Workers & Pages 기반의 도매 유통 및 실시간 발주 관리 포털입니다.

## 기술 스택
- **Frontend**: React 18, TypeScript, Vite
- **Deployment**: Cloudflare Workers / Pages (Static Assets)
- **Tooling**: Wrangler 4

## 로컬 개발 환경 실행
```bash
# 의존성 설치
npm install

# 로컬 개발 서버 실행
npm run dev

# 빌드 테스트
npm run build

# Cloudflare Wrangler 배포 시뮬레이션
npx wrangler deploy --dry-run
```

## Cloudflare 자동 배포
GitHub 저장소의 `main` 브랜치에 푸시되면 Cloudflare가 `wrangler.jsonc` 설정을 기반으로 자동 빌드(`npm run build`) 후 배포합니다.
