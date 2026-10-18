<template>
  <nav class="category-nav-bar">
    <div class="cat-nav-container">
      <div class="mega-menu-trigger" @mouseenter="isMegaOpen = true" @mouseleave="isMegaOpen = false">
        <span class="menu-icon">☰</span>
        <span class="menu-title">전체 산업별 카테고리 (5대 핵심 분류)</span>
        <span class="arrow-down">▼</span>

        <!-- Mega Flyout Dropdown -->
        <div v-show="isMegaOpen" class="mega-flyout">
          <div class="mega-grid">
            <div
              v-for="cat in macroCategories"
              :key="cat.id"
              class="mega-col"
              @click="onSelectCategory(cat.id)"
            >
              <div class="cat-head">
                <span class="cat-icon">{{ cat.icon }}</span>
                <span class="cat-name">{{ cat.name }}</span>
              </div>
              <ul class="subcat-list">
                <li v-for="sub in cat.subcategories" :key="sub">{{ sub }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="quick-nav-links">
        <router-link to="/ko/KRW/catalog" class="quick-link">전체 도매 상품</router-link>
        <router-link to="/ko/KRW/catalog?verified=true" class="quick-link">인증 공장(Verified Supplier)</router-link>
        <router-link to="/ko/KRW/catalog?fast=true" class="quick-link">빠른 출고(Ready to Ship)</router-link>
        <router-link to="/ko/KRW/sourcing/rfq/new" class="quick-link">맞춤 제작(OEM/ODM)</router-link>
        <router-link to="/ko/KRW/orders" class="quick-link highlight">무역보증 에스크로</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'select-category', catId: string): void;
}>();

const isMegaOpen = ref(false);

const macroCategories = [
  {
    id: 'CAT-IND',
    name: '산업기계 & 부품',
    icon: '⚙️',
    subcategories: ['정밀 CNC 가공 부품', '산업용 스테인리스 용기', '유공압 밸브 및 펌프', '체결 부품 및 베어링', '금형 및 사출 가공'],
  },
  {
    id: 'CAT-ELE',
    name: '가전 & 전자부품',
    icon: '🔌',
    subcategories: ['PCBA 모듈 벌크', '전원 어댑터 및 변압기', '산업용 센서 및 계측기', '커넥터 및 하네스 케이블', '디스플레이 모듈'],
  },
  {
    id: 'CAT-PKG',
    name: '포장용기 & 인쇄',
    icon: '📦',
    subcategories: ['식품용 크라프트 지퍼 파우치', '수출용 골판지 상자', '화장품용 유리/플라스틱 용기', '친환경 생분해 완충재', '인쇄 롤 라벨'],
  },
  {
    id: 'CAT-HOM',
    name: '홈/인테리어 & 건축',
    icon: '🏠',
    subcategories: ['스테인리스 위생도기 부품', 'LED 산업용 조명기구', '도어 하드웨어 및 힌지', '세라믹 타일 및 석재', '알루미늄 프로파일'],
  },
  {
    id: 'CAT-CHM',
    name: '화학 원료 & 플라스틱',
    icon: '🧪',
    subcategories: ['엔지니어링 플라스틱 레진', '산업용 접착제 및 실리콘', '무기 안료 및 마스터배치', '세정제 및 계면활성제', '기능성 코팅 첨가제'],
  },
];

function onSelectCategory(catId: string) {
  isMegaOpen.value = false;
  emit('select-category', catId);
}
</script>

<style scoped>
.category-nav-bar { background: #FFFFFF; border-bottom: 1px solid #E5E7EB; position: relative; z-index: 50; }
.cat-nav-container { max-width: 1360px; margin: 0 auto; display: flex; align-items: center; }
.mega-menu-trigger { position: relative; background: #FF6600; color: #FFFFFF; padding: 12px 20px; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 10px; cursor: pointer; width: 280px; box-sizing: border-box; }
.arrow-down { font-size: 10px; margin-left: auto; }
.mega-flyout { position: absolute; top: 100%; left: 0; width: 1000px; background: #FFFFFF; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15); border-radius: 0 0 8px 8px; padding: 24px; z-index: 100; }
.mega-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; }
.mega-col { cursor: pointer; padding: 10px; border-radius: 6px; transition: background 0.15s; }
.mega-col:hover { background: #FFF7ED; }
.cat-head { display: flex; align-items: center; gap: 6px; font-weight: 800; font-size: 14px; color: #1E293B; margin-bottom: 12px; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px; }
.cat-icon { font-size: 18px; }
.subcat-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; font-size: 12px; color: #64748B; }
.subcat-list li:hover { color: #FF6600; font-weight: 600; }
.quick-nav-links { display: flex; gap: 24px; padding-left: 24px; }
.quick-link { text-decoration: none; font-size: 14px; font-weight: 600; color: #334155; }
.quick-link:hover { color: #FF6600; }
.quick-link.highlight { color: #C2410C; font-weight: 700; }
</style>
