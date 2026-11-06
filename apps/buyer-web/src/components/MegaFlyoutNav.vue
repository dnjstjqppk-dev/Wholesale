<template>
  <nav class="cat-bar">
    <div class="cat-inner">
      <div class="mega-trigger" @mouseenter="isMegaOpen = true" @mouseleave="isMegaOpen = false">
        <WsIcon name="menu" :size="15" />
        <b>전체 산업별 카테고리</b>
        <span class="mega-arrow">▾</span>
        <div v-show="isMegaOpen" class="mega-flyout">
          <div
            v-for="cat in macroCategories"
            :key="cat.id"
            class="mega-col"
            @click="onSelectCategory(cat.id)"
          >
            <p class="mega-head"><WsIcon :name="cat.icon" :size="16" class="mega-ico" /> {{ cat.name }}</p>
            <ul>
              <li v-for="sub in cat.subcategories" :key="sub">{{ sub }}</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="quick-links">
        <router-link to="/ko/KRW/catalog">전체 도매 상품</router-link>
        <router-link to="/ko/KRW/catalog?verified=true">인증 공장</router-link>
        <router-link to="/ko/KRW/catalog?fast=true">빠른 출고</router-link>
        <router-link to="/ko/KRW/sourcing/rfq/new">맞춤 제작(OEM/ODM)</router-link>
        <router-link to="/ko/KRW/orders" class="accent">무역보증 에스크로</router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import WsIcon from '@packages/ui/WsIcon.vue';
import type { WsIconName } from '@packages/ui/WsIcon.vue';

const emit = defineEmits<{
  (e: 'select-category', catId: string): void;
}>();

const isMegaOpen = ref(false);

const macroCategories: { id: string; name: string; icon: WsIconName; subcategories: string[] }[] = [
  {
    id: 'CAT-IND',
    name: '산업기계 & 부품',
    icon: 'gear',
    subcategories: ['정밀 CNC 가공 부품', '산업용 스테인리스 용기', '유공압 밸브 및 펌프', '체결 부품 및 베어링', '금형 및 사출 가공'],
  },
  {
    id: 'CAT-ELE',
    name: '가전 & 전자부품',
    icon: 'bolt',
    subcategories: ['PCBA 모듈 벌크', '전원 어댑터 및 변압기', '산업용 센서 및 계측기', '커넥터 및 하네스 케이블', '디스플레이 모듈'],
  },
  {
    id: 'CAT-PKG',
    name: '포장용기 & 인쇄',
    icon: 'package',
    subcategories: ['식품용 크라프트 지퍼 파우치', '수출용 골판지 상자', '화장품용 유리/플라스틱 용기', '친환경 생분해 완충재', '인쇄 롤 라벨'],
  },
  {
    id: 'CAT-HOM',
    name: '홈/인테리어 & 건축',
    icon: 'home',
    subcategories: ['스테인리스 위생도기 부품', 'LED 산업용 조명기구', '도어 하드웨어 및 힌지', '세라믹 타일 및 석재', '알루미늄 프로파일'],
  },
  {
    id: 'CAT-CHM',
    name: '화학 원료 & 플라스틱',
    icon: 'flask',
    subcategories: ['엔지니어링 플라스틱 레진', '산업용 접착제 및 실리콘', '무기 안료 및 마스터배치', '세정제 및 계면활성제', '기능성 코팅 첨가제'],
  },
];

function onSelectCategory(catId: string) {
  isMegaOpen.value = false;
  emit('select-category', catId);
}
</script>

<style scoped>
.cat-bar { background: #fff; border-bottom: 1px solid var(--ws-border-subtle); position: relative; z-index: 40; }
.cat-inner { max-width: 1360px; margin: 0 auto; padding: 0 20px; display: flex; align-items: stretch; }
.mega-trigger { position: relative; display: flex; align-items: center; gap: 9px; background: #fff; color: var(--ws-text); font-size: 13px; padding: 11px 18px; cursor: pointer; min-width: 240px; border-right: 1px solid var(--ws-border-subtle); }
.mega-trigger b { font-weight: 800; }
.mega-trigger:hover b { color: var(--ws-accent); }
.mega-arrow { margin-left: auto; font-size: 11px; color: var(--ws-text-faint); }
.mega-flyout { position: absolute; top: 100%; left: 0; width: min(1020px, calc(100vw - 32px)); background: #fff; border: 1px solid var(--ws-border-subtle); border-top: 0; border-radius: 0 0 12px 12px; box-shadow: var(--ws-shadow-pop); padding: 20px; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 18px; z-index: 60; }
.mega-col { cursor: pointer; border-radius: 8px; padding: 10px; }
.mega-col:hover { background: var(--ws-brand-faint); }
.mega-head { display: flex; align-items: center; gap: 7px; margin: 0 0 10px; padding-bottom: 8px; border-bottom: 1px solid var(--ws-border-subtle); font-size: 13px; font-weight: 800; color: var(--ws-text); }
.mega-ico { color: var(--ws-brand); }
.mega-col ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px; font-size: 12px; color: var(--ws-text-muted); }
.mega-col li:hover { color: var(--ws-brand); font-weight: 700; }
.quick-links { display: flex; align-items: center; gap: 24px; padding: 0 0 0 24px; overflow-x: auto; }
.quick-links a { font-size: 13px; font-weight: 700; color: var(--ws-text-2); text-decoration: none; white-space: nowrap; padding: 11px 0; }
.quick-links a:hover { color: var(--ws-brand); }
.quick-links a.accent { color: var(--ws-brand); }
@media (max-width: 992px) {
  .cat-inner { overflow-x: auto; padding: 0 12px; }
  .mega-trigger { min-width: 0; padding: 10px 14px; flex: none; }
  .mega-flyout { grid-template-columns: minmax(0, 1fr); max-height: 65vh; overflow-y: auto; }
  .quick-links { gap: 16px; padding-left: 16px; }
}
</style>
