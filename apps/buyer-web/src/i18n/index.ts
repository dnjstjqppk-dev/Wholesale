// apps/buyer-web/src/i18n/index.ts
// Real Internationalization (i18n) and Currency Conversion (FX) Engine

export type SupportedLocale = 'ko' | 'en' | 'zh' | 'ja';
export type SupportedCurrency = 'KRW' | 'USD' | 'CNY' | 'JPY';

export const FX_RATES: Record<SupportedCurrency, number> = {
  USD: 1.0,
  KRW: 1380.0,
  CNY: 7.24,
  JPY: 154.5,
};

export const TRANSLATIONS: Record<SupportedLocale, Record<string, string>> = {
  ko: {
    platform_title: '글로벌 B2B 도매 플랫폼 | Incoterms® 2020 & Trade Assurance 적용',
    seller_central: '공급사 파트너 콘솔 (Seller Central)',
    admin_console: '플랫폼 운영 관리자 콘솔',
    help_assurance: '고객센터 & 무역보증',
    search_placeholder: '품목명, 규격, 재질, 가공 방식을 검색하세요 (예: SUS304 텀블러, 알루미늄 방열판)...',
    search_btn: '검색',
    search_products: '상품 검색',
    search_suppliers: '인증 공급사',
    search_rfq: 'RFQ 시장',
    rfq_cta: 'RFQ 견적 요청',
    cart: '도매 카트',
    orders: '발주·계약',
    verified_buyer: '인증 구매기업',
    all_categories: '전체 도매 카테고리',
    ready_to_ship: '즉시 출고관 (Ready to Ship)',
    trade_assurance: '무역보증 (Trade Assurance)',
    sample_center: '샘플 센터 (Sample Center)',
    top_ranking: '산업별 인기 순위 (Top Ranking)',
    moq: '최소 주문수량 (MOQ)',
    lead_time: '표준 납기',
    sample_request: '유료 샘플 신청',
    add_to_cart: '도매 장바구니 담기',
    instant_order: '즉시 도매 발주서 생성',
    contact_supplier: '공급사 1:1 문의',
    specifications: '정밀 기술 규격',
    factory_audit: '공장 설비 및 제3자 실사 성적서',
    landed_cost: '예상 총 도입원가 (Landed Cost)',
  },
  en: {
    platform_title: 'Global B2B Wholesale Marketplace | Incoterms® 2020 & Trade Assurance Secured',
    seller_central: 'Supplier Seller Central',
    admin_console: 'Platform Admin Operations',
    help_assurance: 'Help Center & Trade Assurance',
    search_placeholder: 'Search by keyword, material, standard or specification...',
    search_btn: 'Search',
    search_products: 'Products',
    search_suppliers: 'Suppliers',
    search_rfq: 'RFQ Market',
    rfq_cta: 'Submit RFQ',
    cart: 'Wholesale Cart',
    orders: 'Orders & Contracts',
    verified_buyer: 'Verified Purchaser',
    all_categories: 'All Categories',
    ready_to_ship: 'Ready to Ship',
    trade_assurance: 'Trade Assurance',
    sample_center: 'Sample Center',
    top_ranking: 'Top Ranking',
    moq: 'Min Order (MOQ)',
    lead_time: 'Lead Time',
    sample_request: 'Order Sample',
    add_to_cart: 'Add to Cart',
    instant_order: 'Start Order',
    contact_supplier: 'Contact Supplier',
    specifications: 'Specifications',
    factory_audit: 'Factory Audit & Verified Facility',
    landed_cost: 'Estimated Landed Cost',
  },
  zh: {
    platform_title: '全球B2B跨境批发电商平台 | 适用国际贸易术语2020与信保保障',
    seller_central: '供应商商家中心 (Seller Central)',
    admin_console: '平台综合管理后台',
    help_assurance: '服务中心与跨境信保',
    search_placeholder: '输入产品名、材质、工业标准或加工工艺...',
    search_btn: '搜索',
    search_products: '商品搜索',
    search_suppliers: '认证工厂',
    search_rfq: 'RFQ采购商机',
    rfq_cta: '发布RFQ采购单',
    cart: '批发进货单',
    orders: '采购合同与订单',
    verified_buyer: '企业认证买家',
    all_categories: '全行业分类',
    ready_to_ship: '现货速发 (Ready to Ship)',
    trade_assurance: '信用保障 (Trade Assurance)',
    sample_center: '样品中心 (Sample Center)',
    top_ranking: '热销榜单 (Top Ranking)',
    moq: '起订量 (MOQ)',
    lead_time: '交期',
    sample_request: '申请定制样品',
    add_to_cart: '加入进货单',
    instant_order: '起草信保订单',
    contact_supplier: '联系供应商',
    specifications: '产品技术参数',
    factory_audit: '深度验厂报告与认证',
    landed_cost: '测算总到岸成本 (Landed Cost)',
  },
  ja: {
    platform_title: 'グローバルB2B卸売プラットフォーム | インコタームズ2020＆貿易保証対応',
    seller_central: 'サプライヤー販売者管理 (Seller Central)',
    admin_console: 'プラットフォーム運営管理者コンソール',
    help_assurance: 'カスタマーセンター＆貿易保証',
    search_placeholder: '品名、規格、材質、加工方法で検索...',
    search_btn: '検索',
    search_products: '商品検索',
    search_suppliers: '認証サプライヤー',
    search_rfq: 'RFQ調達案件',
    rfq_cta: 'RFQ見積依頼を作成',
    cart: '卸売カート',
    orders: '発注・契約管理',
    verified_buyer: '認証企業バイヤー',
    all_categories: '全カテゴリー',
    ready_to_ship: '即納商品 (Ready to Ship)',
    trade_assurance: '貿易保証 (Trade Assurance)',
    sample_center: 'サンプルセンター',
    top_ranking: '人気ランキング',
    moq: '最小ロット (MOQ)',
    lead_time: '納期',
    sample_request: 'サンプル発注',
    add_to_cart: 'カートに入れる',
    instant_order: '即時発注書を作成',
    contact_supplier: 'サプライヤーに問い合わせ',
    specifications: '詳細技術仕様',
    factory_audit: '工場審査報告書・認証',
    landed_cost: '着荷原価試算 (Landed Cost)',
  },
};

export function t(key: string, locale: SupportedLocale = 'ko'): string {
  const dict = TRANSLATIONS[locale] || TRANSLATIONS.ko;
  return dict[key] || TRANSLATIONS.ko[key] || key;
}

export async function loadFxRates(): Promise<void> {
  try {
    // Dynamic import to avoid circular dependency with api.ts
    const { apiRequest } = await import('../api');
    const res: any = await apiRequest('/fx/rates');
    const rates = res?.rates || res?.FX_RATES?.rates || res;
    if (rates && typeof rates === 'object') {
      for (const k of Object.keys(rates)) {
        const v = Number(rates[k]);
        if (!isNaN(v) && v > 0 && (k in FX_RATES)) {
          (FX_RATES as any)[k] = v;
        }
      }
    }
  } catch {
    // Keep static fallback rates
  }
}
export function formatCurrency(
  usdAmount: number | string,
  targetCurrency: SupportedCurrency = 'USD',
  fxRates?: Partial<Record<SupportedCurrency, number>>
): string {
  const num = typeof usdAmount === 'string' ? parseFloat(usdAmount) : usdAmount;
  if (isNaN(num)) return '$0.00';

  const rates = fxRates || FX_RATES;
  const rate = rates[targetCurrency] || FX_RATES[targetCurrency] || 1.0;
  const converted = num * rate;

  if (targetCurrency === 'KRW') {
    return `₩${Math.round(converted).toLocaleString('ko-KR')}`;
  } else if (targetCurrency === 'JPY') {
    return `¥${Math.round(converted).toLocaleString('ja-JP')}`;
  } else if (targetCurrency === 'CNY') {
    return `¥${converted.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

