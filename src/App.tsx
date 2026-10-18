import { useState } from 'react'

interface Product {
  id: string
  name: string
  category: string
  sku: string
  price: number
  moq: number
  stock: number
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PRD-001',
    name: '프리미엄 원두 (콜롬비아 수프레모 1kg)',
    category: '식음료/커피',
    sku: 'COF-COL-1KG',
    price: 18500,
    moq: 10,
    stock: 240,
    status: 'IN_STOCK',
  },
  {
    id: 'PRD-002',
    name: '친환경 크라프트 쇼핑백 (대형 500매)',
    category: '포장재/소모품',
    sku: 'PKG-BAG-LG',
    price: 32000,
    moq: 5,
    stock: 12,
    status: 'LOW_STOCK',
  },
  {
    id: 'PRD-003',
    name: '올인원 핸드워시 디스펜서 (무광 화이트)',
    category: '생활용품',
    sku: 'HOM-DSP-WHT',
    price: 14500,
    moq: 20,
    stock: 0,
    status: 'OUT_OF_STOCK',
  },
  {
    id: 'PRD-004',
    name: '스테인리스 텀블러 (500ml 벌크팩 24입)',
    category: '주방용품',
    sku: 'KTN-TMB-500',
    price: 128000,
    moq: 2,
    stock: 85,
    status: 'IN_STOCK',
  },
  {
    id: 'PRD-005',
    name: '유기농 제주 녹차 파우더 (500g)',
    category: '식음료/차',
    sku: 'TEA-JEJ-500',
    price: 24000,
    moq: 15,
    stock: 150,
    status: 'IN_STOCK',
  },
]

export default function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [products] = useState<Product[]>(INITIAL_PRODUCTS)

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'ALL' || p.category.includes(categoryFilter)
    return matchesSearch && matchesCategory
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '20px',
            }}
          >
            W
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Wholesale B2B</h1>
            <p style={{ fontSize: '12px', color: '#64748b' }}>도매 유통 및 실시간 발주 관리 포털</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span
            style={{
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '9999px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              fontWeight: 600,
              border: '1px solid #a7f3d0',
            }}
          >
            ● Cloudflare Deployed
          </span>
          <div
            style={{
              fontSize: '14px',
              color: '#334155',
              fontWeight: 500,
              backgroundColor: '#f1f5f9',
              padding: '6px 12px',
              borderRadius: '6px',
            }}
          >
            관리자 모드
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '32px 24px', flex: 1 }}>
        {/* KPI Cards */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>오늘의 발주 총액</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>
              ₩ 18,450,000
            </div>
            <div style={{ fontSize: '12px', color: '#10b981', marginTop: '6px' }}>↑ 전일 대비 +14.2%</div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>신규 발주 건수</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>42건</div>
            <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '6px' }}>처리 대기 6건</div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>등록 상품 (SKU)</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>158개</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>활성 카테고리 8개</div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>재고 주의 품목</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444', marginTop: '8px' }}>2건</div>
            <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px' }}>품절 1건 / 부족 1건</div>
          </div>
        </section>

        {/* Product Catalog Section */}
        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          {/* Controls Bar */}
          <div
            style={{
              padding: '20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>도매 상품 목록</h2>
              <p style={{ fontSize: '13px', color: '#64748b' }}>B2B 회원사 전용 공급 단가 및 재고 현황</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="상품명, SKU 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  minWidth: '220px',
                }}
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="ALL">전체 카테고리</option>
                <option value="식음료">식음료</option>
                <option value="포장재">포장재/소모품</option>
                <option value="생활용품">생활용품</option>
                <option value="주방용품">주방용품</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: '#475569' }}>상품 식별코드</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: '#475569' }}>상품명</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: '#475569' }}>카테고리</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: '#475569' }}>도매 공급단가</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: '#475569' }}>최소 발주(MOQ)</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: '#475569' }}>가용 재고</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: '#475569' }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '16px 20px', color: '#64748b', fontFamily: 'monospace' }}>
                      {p.sku}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#1e293b' }}>
                      {p.name}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b' }}>{p.category}</td>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#0f172a' }}>
                      ₩ {p.price.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#475569' }}>{p.moq}개</td>
                    <td style={{ padding: '16px 20px', color: '#475569' }}>{p.stock}개</td>
                    <td style={{ padding: '16px 20px' }}>
                      {p.status === 'IN_STOCK' && (
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          정상 출고
                        </span>
                      )}
                      {p.status === 'LOW_STOCK' && (
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            backgroundColor: '#fef3c7',
                            color: '#b45309',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          재고 부족
                        </span>
                      )}
                      {p.status === 'OUT_OF_STOCK' && (
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          품절
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      검색 조건과 일치하는 상품이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '24px 32px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '13px',
        }}
      >
        © {new Date().getFullYear()} Wholesale Platform. Powered by Cloudflare Pages & Workers.
      </footer>
    </div>
  )
}

