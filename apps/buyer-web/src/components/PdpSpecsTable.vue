<template>
  <section class="specs-section">
    <div class="specs-head">
      <h2>산업용 기술 사양 및 검사 규격 (Specifications)</h2>
    </div>
    <div class="specs-table-container">
      <table class="specs-table">
        <tbody>
          <tr>
            <th class="spec-th">품목 식별 번호 (SKU)</th>
            <td class="spec-td">{{ skuId }}</td>
            <th class="spec-th">원산지 국가 (Country of Origin)</th>
            <td class="spec-td">대한민국 (Republic of Korea)</td>
          </tr>
          <tr>
            <th class="spec-th">주요 원소재 (Material)</th>
            <td class="spec-td">오스테나이트계 SUS304 (식품/의료 등급 스테인리스)</td>
            <th class="spec-th">가공 공법 (Processing)</th>
            <td class="spec-td">이중벽 진공 브레이징 (Dual Vacuum Brazing)</td>
          </tr>
          <tr>
            <th class="spec-th">공차 기준 (Tolerance)</th>
            <td class="spec-td">±0.05 mm 정밀 가공 규격 준수</td>
            <th class="spec-th">표면 처리 (Surface Finishing)</th>
            <td class="spec-td">전해 연마 (Electropolishing) / 무독성 파우더 코팅</td>
          </tr>
          <tr>
            <th class="spec-th">국제 품질 인증 (Certifications)</th>
            <td class="spec-td">ISO 9001:2015, ISO 14001, CE, FDA GRAS 통과</td>
            <th class="spec-th">포장 규격 (Packaging)</th>
            <td class="spec-td">개별 충격완화 에어캡 + 5겹 수출용 골판지 상자 (50pcs/Box)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  skuId: string;
}>();
</script>

<style scoped>
.specs-section { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 10px; padding: 24px; margin-top: 12px; }
.specs-head h2 { font-size: 18px; font-weight: 800; color: #1E293B; margin: 0 0 16px 0; }
.specs-table-container { overflow-x: auto; }
.specs-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.spec-th { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px 14px; text-align: left; width: 20%; color: #334155; font-weight: 700; }
.spec-td { border: 1px solid #E2E8F0; padding: 10px 14px; color: #475569; width: 30%; }
</style>

