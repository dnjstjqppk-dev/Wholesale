/// <reference lib="dom" />
// apps/api-worker/src/routesCatalog.ts
// Catalog, Categories, Rich Filtering, CSV Bulk Upload, Image Vision Search & FX Rates

import { jsonResponse, problemResponse } from './response';
import { listings, CATEGORIES, SUPPLIER_ORG_ID, importJobs, logAudit, users, organizations } from './store';
import { getAuthContext } from './jwt';

export const FX_RATES = {
  base: 'USD',
  timestamp: new Date().toISOString(),
  rates: {
    USD: 1.0,
    KRW: 1380.0,
    CNY: 7.24,
    JPY: 154.5,
    EUR: 0.92,
  },
};

export async function handleCatalog(request: Request, url: URL): Promise<Response | null> {
  const ctx = await getAuthContext(request, users, organizations);

  // GET /v1/fx/rates
  if (url.pathname === '/v1/fx/rates' && request.method === 'GET') {
    return jsonResponse(FX_RATES);
  }

  // GET /v1/catalog/categories
  if (url.pathname === '/v1/catalog/categories' && request.method === 'GET') {
    return jsonResponse({
      categories: CATEGORIES,
      total_count: CATEGORIES.length,
    });
  }

  // GET /v1/catalog/suppliers & /v1/suppliers (Verified Supplier Directory)
  if ((url.pathname === '/v1/catalog/suppliers' || url.pathname === '/v1/suppliers') && request.method === 'GET') {
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const category = url.searchParams.get('category');
    const country = url.searchParams.get('country');
    const verifiedOnly = url.searchParams.get('verified_only') === 'true';
    const tradeAssurance = url.searchParams.get('trade_assurance') === 'true';
    const cert = (url.searchParams.get('cert') || '').toLowerCase();
    const minRating = Number(url.searchParams.get('min_rating') || 0);

    const suppliersMaster = [
      {
        id: SUPPLIER_ORG_ID,
        organization_id: SUPPLIER_ORG_ID,
        company_name: 'Precision Korea Co., Ltd. (글로벌정밀산업)',
        slogan: '글로벌 최고 수준의 정밀 프레스 및 스테인리스 가공 전문 제조사',
        country: 'KR',
        business_type: 'MANUFACTURER',
        is_verified_supplier: true,
        trade_assurance: true,
        rating: 4.9,
        reviews_count: 142,
        response_rate: '99.2%',
        years_in_business: 12,
        total_revenue_usd: '$25M - $50M',
        export_percentage: '85%',
        factory_size: '28,000 m²',
        production_lines: 8,
        categories: ['CAT-IND', 'CAT-HOM'],
        main_products: ['SUS 304 Vacuum Tumbler', '500-Ton Hydraulic Cold Forming Press', 'VMC-850 3-Axis CNC Parts', 'High-Pressure Industrial Ball Valve'],
        certifications: ['ISO 9001:2015', 'CE Compliance', 'FDA Food Contact', 'RoHS Compliant'],
        inspection_agency: 'SGS Global Testing Services',
        banner_image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
        logo_image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=200&q=80',
      },
      {
        id: 'org-supp-ele-001',
        organization_id: 'org-supp-ele-001',
        company_name: 'Hanbit Nano Electronics Co., Ltd. (한빛나노전자)',
        slogan: '초고속 질화갈륨(GaN) 전력 변환 및 차세대 IoT 스마트 디바이스 전문 제조',
        country: 'KR',
        business_type: 'MANUFACTURER',
        is_verified_supplier: true,
        trade_assurance: true,
        rating: 4.8,
        reviews_count: 98,
        response_rate: '98.4%',
        years_in_business: 8,
        total_revenue_usd: '$10M - $25M',
        export_percentage: '78%',
        factory_size: '18,500 m²',
        production_lines: 6,
        categories: ['CAT-ELE'],
        main_products: ['GaN 140W PD 3.1 Fast Charger', 'TWS ANC Dual Driver Earbuds', '1.43-inch Round AMOLED Display', '51.2V 100Ah LiFePO4 Battery Pack'],
        certifications: ['CE Compliance', 'FCC Part 15', 'RoHS Compliant', 'ISO 14001:2015'],
        inspection_agency: 'TÜV Rheinland Inspection Lab',
        banner_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        logo_image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=200&q=80',
      },
      {
        id: 'org-supp-pkg-001',
        organization_id: 'org-supp-pkg-001',
        company_name: 'EcoPack Global Solutions (에코팩글로벌)',
        slogan: '100% 생분해 크라프트 및 고기능 스마트 패키징 글로벌 솔루션',
        country: 'KR',
        business_type: 'MANUFACTURER',
        is_verified_supplier: true,
        trade_assurance: true,
        rating: 4.8,
        reviews_count: 85,
        response_rate: '97.9%',
        years_in_business: 10,
        total_revenue_usd: '$15M - $30M',
        export_percentage: '80%',
        factory_size: '14,000 m²',
        production_lines: 5,
        categories: ['CAT-PKG'],
        main_products: ['FSC Honeycomb Kraft Padded Mailers', 'Heavy-Duty Double Wall Corrugated Boxes', 'Cosmetic Frosted Amber Glass Dropper Bottle', 'Tamper Evident Security Hologram Label'],
        certifications: ['FSC Certified', 'ISO 9001:2015', 'FDA Food Contact', 'ISO 14001:2015'],
        inspection_agency: 'Bureau Veritas QC Lab',
        banner_image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
        logo_image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=200&q=80',
      },
      {
        id: 'org-supp-hom-001',
        organization_id: 'org-supp-hom-001',
        company_name: 'Living Art Cast Kitchenware (리빙아트주철기물)',
        slogan: '전통 에나멜 주철 쿡웨어 및 인체공학 스마트 가구 수출 전문 기업',
        country: 'KR',
        business_type: 'MANUFACTURER',
        is_verified_supplier: true,
        trade_assurance: true,
        rating: 4.9,
        reviews_count: 116,
        response_rate: '99.0%',
        years_in_business: 15,
        total_revenue_usd: '$20M - $40M',
        export_percentage: '88%',
        factory_size: '22,000 m²',
        production_lines: 7,
        categories: ['CAT-HOM'],
        main_products: ['Cast Iron Enameled Dutch Oven 5.5-Quart', 'Ergonomic Mesh High-Back Office Chair', 'Food-Grade Silicone Heat-Resistant Utensils', 'Smart Infrared Motion Sensor Waste Bin'],
        certifications: ['FDA Food Contact', 'LFGB German Standard', 'ISO 9001:2015'],
        inspection_agency: 'SGS Global Testing Services',
        banner_image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
        logo_image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=200&q=80',
      },
      {
        id: 'org-supp-chm-001',
        organization_id: 'org-supp-chm-001',
        company_name: 'Daehan Advanced Materials Corp. (대한첨단소재화학)',
        slogan: '고순도 석유화학 수지 및 첨단 유기화학 기초 원자재 공급 선두주자',
        country: 'KR',
        business_type: 'MANUFACTURER',
        is_verified_supplier: true,
        trade_assurance: true,
        rating: 4.7,
        reviews_count: 74,
        response_rate: '96.8%',
        years_in_business: 18,
        total_revenue_usd: '$50M - $100M',
        export_percentage: '92%',
        factory_size: '35,000 m²',
        production_lines: 10,
        categories: ['CAT-CHM'],
        main_products: ['Virgin Polypropylene (PP) Homopolymer Granules', '99.9% Electronic Grade Isopropyl Alcohol (IPA)', 'Optically Clear UV Curing Epoxy Resin', 'Linear Alkylbenzene Sulfonic Acid (LABSA 96%)'],
        certifications: ['ISO 9001:2015', 'ISO 14001:2015', 'REACH Certified', 'RoHS Compliant'],
        inspection_agency: 'Intertek Chemical Testing Group',
        banner_image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
        logo_image: 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=200&q=80',
      },
    ];

    let filtered = suppliersMaster;

    if (q) {
      filtered = filtered.filter(s =>
        s.company_name.toLowerCase().includes(q) ||
        s.slogan.toLowerCase().includes(q) ||
        s.main_products.some(p => p.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'ALL') {
      filtered = filtered.filter(s => s.categories.includes(category));
    }

    if (country && country !== 'ALL') {
      filtered = filtered.filter(s => s.country === country);
    }

    if (verifiedOnly) {
      filtered = filtered.filter(s => s.is_verified_supplier);
    }

    if (tradeAssurance) {
      filtered = filtered.filter(s => s.trade_assurance);
    }

    if (minRating > 0) {
      filtered = filtered.filter(s => s.rating >= minRating);
    }

    if (cert) {
      filtered = filtered.filter(s => s.certifications.some(c => c.toLowerCase().includes(cert)));
    }

    return jsonResponse({
      items: filtered,
      total_count: filtered.length,
    });
  }

  // POST /v1/catalog/image-search (AI Visual Feature Matcher)
  if (url.pathname === '/v1/catalog/image-search' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    const visualQuery = (body.visual_query || body.category_hint || '스테인리스').toLowerCase();

    const items = Array.from(listings.values());
    const matched = items
      .map(item => {
        let score = 75.0;
        const text = `${item.title} ${item.category_name} ${item.sub_category}`.toLowerCase();
        if (text.includes(visualQuery) || visualQuery.includes('텀블러') || visualQuery.includes('sus')) {
          score = 98.4;
        } else if (text.includes('기계') || text.includes('금속') || text.includes('가공')) {
          score = 88.2;
        } else {
          score = Math.floor(70 + Math.random() * 20) + 0.5;
        }
        return { item, match_score: score };
      })
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 8);

    return jsonResponse({
      query_features: {
        dominant_colors: ['#4A5568', '#CBD5E1', '#E2E8F0'],
        detected_category: visualQuery,
        confidence: 0.984,
      },
      results: matched.map(m => ({ ...m.item, visual_confidence: `${m.match_score}%` })),
      total_count: matched.length,
    });
  }

  // POST /v1/catalog/bulk-upload (Dry-run & Atomic Commit)
  if (url.pathname === '/v1/catalog/bulk-upload' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as any;
    const csvContent = body.csv_content || '';
    const isDryRun = body.dry_run === true || body.dry_run === 'true';

    if (!csvContent || typeof csvContent !== 'string') {
      return problemResponse(400, 'INVALID_CSV', 'Missing CSV Content', 'csv_content string is required');
    }

    const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      return problemResponse(400, 'EMPTY_CSV', 'Empty CSV Rows', 'CSV must contain a header row and at least 1 data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const parsedRows: any[] = [];
    const errors: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length < 5) {
        errors.push({ row: i, error: 'Insufficient columns (minimum 5 required)' });
        continue;
      }

      const title = cols[0];
      const category = cols[1] || 'CAT-IND';
      const moq = parseInt(cols[2], 10);
      const unit = cols[3] || 'pcs';
      const basePrice = parseFloat(cols[4]);

      if (!title) {
        errors.push({ row: i, error: 'Title cannot be empty' });
        continue;
      }
      if (isNaN(moq) || moq <= 0) {
        errors.push({ row: i, error: 'MOQ must be a positive number' });
        continue;
      }
      if (isNaN(basePrice) || basePrice <= 0) {
        errors.push({ row: i, error: 'Base unit price must be positive' });
        continue;
      }

      const rowProduct = {
        id: crypto.randomUUID(),
        sku_id: crypto.randomUUID(),
        organization_id: ctx?.org?.id || SUPPLIER_ORG_ID,
        supplier_name: ctx?.org?.legal_name || 'Precision Korea Co., Ltd. (글로벌정밀산업)',
        supplier_country: 'KR',
        title,
        category,
        sub_category: cols[5] || '산업 정밀 부품',
        category_name: '산업기계 & 부품',
        images: [
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        ],
        thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
        moq: String(moq),
        quantity_step: '10',
        unit,
        lead_time_days: parseInt(cols[6], 10) || 14,
        sample_price: String((basePrice * 1.5).toFixed(2)),
        sample_lead_time_days: 3,
        status: 'PUBLISHED',
        rating: 5.0,
        reviews_count: 0,
        response_rate: '100%',
        years_in_business: 10,
        trade_assurance: true,
        verified_supplier: true,
        customization: {
          custom_logo_moq: moq * 2,
          custom_packaging_moq: moq * 5,
          graphic_customization_moq: moq * 5,
        },
        incoterms: cols[7] || 'FOB Busan Port',
        port_of_dispatch: 'Busan, South Korea',
        specifications: [
          { name: '원산지 (Origin)', value: 'South Korea' },
          { name: '품질 인증 (Quality Standard)', value: 'ISO 9001 / CE Certified' },
        ],
        price_tiers: [
          { min_quantity: String(moq), max_quantity: String(moq * 5 - 1), unit_price: basePrice.toFixed(6), currency: 'USD' },
          { min_quantity: String(moq * 5), max_quantity: null, unit_price: (basePrice * 0.85).toFixed(6), currency: 'USD' },
        ],
      };
      parsedRows.push(rowProduct);
    }

    if (isDryRun) {
      return jsonResponse({
        dry_run: true,
        total_rows: lines.length - 1,
        valid_count: parsedRows.length,
        invalid_count: errors.length,
        errors,
        sample_preview: parsedRows.slice(0, 3),
        message: `Dry-run 검증 완료: ${parsedRows.length}건 유효, ${errors.length}건 오류. 데이터가 데이터베이스에 반영되지 않았습니다.`,
      });
    }

    // Atomic Commit: Add to listings map
    for (const item of parsedRows) {
      listings.set(item.id, item);
    }

    const jobId = `job-${Date.now()}`;
    importJobs.set(jobId, {
      job_id: jobId,
      created_count: parsedRows.length,
      created_at: new Date().toISOString(),
    });

    logAudit(
      'CATALOG_BULK_UPLOADED',
      ctx?.user?.id || 'user-supplier-001',
      'SUPPLIER_SALES',
      'CATALOG',
      jobId,
      `Bulk upload imported ${parsedRows.length} products atomically.`
    );

    return jsonResponse({
      success: true,
      import_job_id: jobId,
      created_count: parsedRows.length,
      message: `성공: ${parsedRows.length}개의 도매 상품이 원자적(Atomically)으로 등록되었습니다.`,
    }, 201);
  }

  // GET & POST /v1/catalog/listings
  if (url.pathname === '/v1/catalog/listings') {
    if (request.method === 'GET') {
      const cat = url.searchParams.get('category');
      const subCat = url.searchParams.get('sub_category');
      const q = url.searchParams.get('q');
      const verified = url.searchParams.get('verified');
      const tradeAssurance = url.searchParams.get('trade_assurance');
      const customization = url.searchParams.get('customization');
      const moqMax = url.searchParams.get('moq_max');
      const incoterm = url.searchParams.get('incoterm');
      const sort = url.searchParams.get('sort');

      let items = Array.from(listings.values());

      // Category filter
      if (cat && cat !== 'ALL') {
        items = items.filter(i => i.category === cat);
      }
      if (subCat && subCat !== 'ALL') {
        items = items.filter(i => i.sub_category === subCat || i.category_name?.includes(subCat));
      }

      // Keyword query
      if (q) {
        const query = q.toLowerCase();
        items = items.filter(i =>
          i.title.toLowerCase().includes(query) ||
          i.supplier_name.toLowerCase().includes(query) ||
          i.category_name.toLowerCase().includes(query) ||
          (i.specifications && i.specifications.some((s: any) => s.value.toLowerCase().includes(query)))
        );
      }

      // Verified supplier
      if (verified === 'true') {
        items = items.filter(i => i.verified_supplier === true);
      }

      // Trade assurance
      if (tradeAssurance === 'true') {
        items = items.filter(i => i.trade_assurance === true);
      }

      // Customization
      if (customization === 'true') {
        items = items.filter(i => i.customization && (i.customization.custom_logo_moq > 0 || i.customization.custom_packaging_moq > 0));
      }

      // MOQ filter
      if (moqMax) {
        const max = parseInt(moqMax, 10);
        if (!isNaN(max)) {
          items = items.filter(i => parseInt(i.moq, 10) <= max);
        }
      }

      // Incoterm filter
      if (incoterm && incoterm !== 'ALL') {
        items = items.filter(i => i.incoterms?.toUpperCase().includes(incoterm.toUpperCase()));
      }

      // Sorting
      if (sort === 'price_asc') {
        items.sort((a, b) => parseFloat(a.price_tiers[0]?.unit_price || 0) - parseFloat(b.price_tiers[0]?.unit_price || 0));
      } else if (sort === 'price_desc') {
        items.sort((a, b) => parseFloat(b.price_tiers[0]?.unit_price || 0) - parseFloat(a.price_tiers[0]?.unit_price || 0));
      } else if (sort === 'rating') {
        items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sort === 'moq_asc') {
        items.sort((a, b) => parseInt(a.moq || 0, 10) - parseInt(b.moq || 0, 10));
      } else if (sort === 'lead_time') {
        items.sort((a, b) => (a.lead_time_days || 99) - (b.lead_time_days || 99));
      }

      return jsonResponse({
        items,
        total_count: items.length,
        facets: {
          categories: CATEGORIES.map(c => ({
            id: c.id,
            name: c.name,
            count: items.filter(i => i.category === c.id).length,
          })),
        },
      });
    }

    if (request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      if (!body.title || !body.moq || !body.price_tiers || !body.price_tiers.length) {
        return problemResponse(400, 'INVALID_BODY', 'Missing Listing Data', 'title, moq, and price_tiers are required');
      }

      const id = crypto.randomUUID();
      const newListing = {
        id,
        sku_id: crypto.randomUUID(),
        organization_id: body.organization_id || ctx?.org?.id || SUPPLIER_ORG_ID,
        supplier_name: body.supplier_name || ctx?.org?.legal_name || 'Precision Korea Co., Ltd. (글로벌정밀산업)',
        supplier_country: body.supplier_country || 'KR',
        title: body.title,
        category: body.category || 'CAT-IND',
        sub_category: body.sub_category || '산업 정밀 부품',
        category_name: body.category_name || '산업기계 & 부품',
        images: body.images && body.images.length ? body.images : [
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        ],
        thumbnail: body.thumbnail || (body.images && body.images[0]) || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
        moq: String(body.moq),
        quantity_step: String(body.quantity_step || '10'),
        unit: body.unit || 'pcs',
        lead_time_days: Number(body.lead_time_days || 14),
        sample_price: String(body.sample_price || '20.00'),
        sample_lead_time_days: Number(body.sample_lead_time_days || 3),
        status: body.status || 'PUBLISHED',
        rating: 5.0,
        reviews_count: 0,
        response_rate: '100%',
        years_in_business: 12,
        trade_assurance: true,
        verified_supplier: true,
        customization: body.customization || {
          custom_logo_moq: Number(body.moq) * 2,
          custom_packaging_moq: Number(body.moq) * 5,
          graphic_customization_moq: Number(body.moq) * 5,
        },
        incoterms: body.incoterms || 'FOB Busan Port',
        port_of_dispatch: body.port_of_dispatch || 'Busan, South Korea',
        specifications: body.specifications || [
          { name: '원산지 (Origin)', value: 'South Korea' },
          { name: '품질 인증 (Quality Standard)', value: 'ISO 9001:2015' },
        ],
        price_tiers: body.price_tiers,
        created_at: new Date().toISOString(),
      };
      listings.set(id, newListing);

      logAudit(
        'CATALOG_LISTING_CREATED',
        ctx?.user?.id || 'user-supplier-001',
        'SUPPLIER_SALES',
        'CATALOG_LISTING',
        id,
        `New wholesale product listing created: '${newListing.title}'`
      );

      return jsonResponse(newListing, 201);
    }
  }

  // GET, PUT, DELETE /v1/catalog/listings/:id
  const listingMatch = url.pathname.match(/^\/v1\/catalog\/listings\/([^\/]+)$/);
  if (listingMatch) {
    const id = listingMatch[1];
    const item = listings.get(id);

    if (request.method === 'GET') {
      if (!item) {
        return problemResponse(404, 'NOT_FOUND', 'Listing Not Found', `Product listing ${id} does not exist`);
      }
      return jsonResponse(item);
    }

    if (request.method === 'PUT') {
      if (!item) {
        return problemResponse(404, 'NOT_FOUND', 'Listing Not Found', `Product listing ${id} does not exist`);
      }
      const body = (await request.json().catch(() => ({}))) as any;
      Object.assign(item, body);
      item.updated_at = new Date().toISOString();

      logAudit(
        'CATALOG_LISTING_UPDATED',
        ctx?.user?.id || 'user-supplier-001',
        'SUPPLIER_SALES',
        'CATALOG_LISTING',
        id,
        `Wholesale product listing updated: '${item.title}'`
      );

      return jsonResponse(item);
    }

    if (request.method === 'DELETE') {
      if (!item) {
        return problemResponse(404, 'NOT_FOUND', 'Listing Not Found', `Product listing ${id} does not exist`);
      }
      listings.delete(id);

      logAudit(
        'CATALOG_LISTING_DELETED',
        ctx?.user?.id || 'user-supplier-001',
        'SUPPLIER_SALES',
        'CATALOG_LISTING',
        id,
        `Wholesale product listing deleted: '${item.title}'`
      );

      return jsonResponse({ success: true, deleted_id: id });
    }
  }

  return null;
}
