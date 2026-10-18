export interface CatalogItem {
  id: string;
  sku_id: string;
  title: string;
  category: string;
  category_name: string;
  supplier_name: string;
  is_verified_supplier: boolean;
  country: string;
  moq: number;
  quantity_step: number;
  unit: string;
  lead_time_days: number;
  incoterm: string;
  trade_assurance: boolean;
  customization: boolean;
  years_in_business: number;
  response_rate: string;
  price_tiers: Array<{
    min_quantity: string;
    max_quantity: string | null;
    unit_price: string;
  }>;
}

export const sampleCatalogListings: CatalogItem[] = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    sku_id: '44444444-4444-4444-4444-444444444444',
    title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩 (SUS304 이중 진공)',
    category: 'CAT-IND',
    category_name: '산업기계 & 부품 / 산업용 용기',
    supplier_name: 'Precision Korea Co., Ltd. (글로벌정밀산업)',
    is_verified_supplier: true,
    country: 'KR',
    moq: 100,
    quantity_step: 10,
    unit: 'pcs',
    lead_time_days: 14,
    incoterm: 'FOB',
    trade_assurance: true,
    customization: true,
    years_in_business: 12,
    response_rate: '98.5%',
    price_tiers: [
      { min_quantity: '100', max_quantity: '499', unit_price: '5.50' },
      { min_quantity: '500', max_quantity: '999', unit_price: '4.80' },
      { min_quantity: '1000', max_quantity: null, unit_price: '4.20' },
    ],
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    sku_id: '66666666-6666-6666-6666-666666666666',
    title: '고정밀 4축 알루미늄 방열판 CNC 밀링 가공 모듈',
    category: 'CAT-IND',
    category_name: '산업기계 & 부품 / 정밀 CNC',
    supplier_name: 'HwaSeong Precision CNC Co.',
    is_verified_supplier: true,
    country: 'KR',
    moq: 50,
    quantity_step: 5,
    unit: 'pcs',
    lead_time_days: 21,
    incoterm: 'FOB',
    trade_assurance: true,
    customization: true,
    years_in_business: 8,
    response_rate: '96.2%',
    price_tiers: [
      { min_quantity: '50', max_quantity: '199', unit_price: '18.50' },
      { min_quantity: '200', max_quantity: '499', unit_price: '15.20' },
      { min_quantity: '500', max_quantity: null, unit_price: '12.80' },
    ],
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    sku_id: '88888888-8888-8888-8888-888888888888',
    title: '식품 등급 크라프트 스탠딩 지퍼백 파우치 (방습 알루미늄 증착)',
    category: 'CAT-PKG',
    category_name: '포장용기 & 인쇄 / 지퍼백',
    supplier_name: 'EcoPack Global Solutions',
    is_verified_supplier: false,
    country: 'KR',
    moq: 1000,
    quantity_step: 500,
    unit: 'pcs',
    lead_time_days: 10,
    incoterm: 'CIF',
    trade_assurance: true,
    customization: true,
    years_in_business: 5,
    response_rate: '94.0%',
    price_tiers: [
      { min_quantity: '1000', max_quantity: '4999', unit_price: '0.22' },
      { min_quantity: '5000', max_quantity: '9999', unit_price: '0.18' },
      { min_quantity: '10000', max_quantity: null, unit_price: '0.14' },
    ],
  },
];

