// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  app: {
    head: {
      title: 'Wholesale B2B - 글로벌 도매 및 기업 조달 플랫폼',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '검증된 제조사 공급망, 수량 구간별 도매 공급가, RFQ 및 무역 계약 보호' }
      ]
    }
  }
})

