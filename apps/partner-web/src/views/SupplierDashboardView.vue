<template>
  <div class="dashboard-page">
    <div class="dash-header">
      <h2>공급사 비즈니스 콘솔 대시보드</h2>
      <span class="updated">최종 갱신: 2026-10-18 (실시간 에지 동기화)</span>
    </div>

    <!-- Verification Banner -->
    <div class="audit-card">
      <div class="audit-left">
        <span class="badge">공장 실사 및 기업 인증 100% 완료</span>
        <h3>Verified Manufacturer 공식 파트너</h3>
        <p>사업자등록증 · 공장 시험성적서 · ISO 9001 인증 심사가 통과되어 글로벌 바이어 신뢰 마크가 부여되었습니다.</p>
      </div>
      <div class="audit-right">
        <button class="btn-cert">인증 증빙 서류 보기</button>
      </div>
    </div>

    <!-- 4 KPI Cards -->
    <div class="metrics-grid">
      <div class="kpi-card">
        <span class="label">운영 등록 상품</span>
        <span class="value">14개</span>
        <span class="sub">구간단가 적용 SKU 42종</span>
      </div>
      <div class="kpi-card">
        <span class="label">입찰 가능 RFQ</span>
        <span class="value">28건</span>
        <span class="sub">신규 매칭 3건</span>
      </div>
      <div class="kpi-card">
        <span class="label">생산/출고 진행 주문</span>
        <span class="value">5건</span>
        <span class="sub">금일 분할출고 예정 1건</span>
      </div>
      <div class="kpi-card">
        <span class="label">정산 대기 에스크로 잔액</span>
        <span class="value highlight">$14,200.00</span>
        <span class="sub">검수 합격 대기</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page { display: flex; flex-direction: column; gap: 24px; }
.dash-header { display: flex; justify-content: space-between; align-items: baseline; }
.dash-header h2 { margin: 0; font-size: 22px; color: #172B4D; }
.updated { font-size: 12px; color: #64748B; }
.audit-card { background: #FFF; border: 1px solid #86EFAC; border-left: 4px solid #15803D; border-radius: 8px; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
.audit-left .badge { background: #DCFCE7; color: #15803D; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; }
.audit-left h3 { margin: 8px 0 4px 0; font-size: 16px; color: #172B4D; }
.audit-left p { margin: 0; font-size: 13px; color: #42526E; }
.btn-cert { background: #F1F5F9; border: 1px solid #CBD5E1; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
.metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.kpi-card { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 20px; display: flex; flex-direction: column; }
.kpi-card .label { font-size: 13px; color: #64748B; margin-bottom: 8px; }
.kpi-card .value { font-size: 24px; font-weight: 800; color: #172B4D; font-variant-numeric: tabular-nums; }
.kpi-card .value.highlight { color: #C2410C; }
.kpi-card .sub { font-size: 11px; color: #94A3B8; margin-top: 6px; }
</style>

