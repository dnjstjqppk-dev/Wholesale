import { createRouter, createWebHistory } from 'vue-router';
import SupplierDashboardView from '../views/SupplierDashboardView.vue';
import CatalogEditorView from '../views/CatalogEditorView.vue';
import BulkUploadView from '../views/BulkUploadView.vue';
import RFQMarketView from '../views/RFQMarketView.vue';
import FulfillmentView from '../views/FulfillmentView.vue';
import SettlementView from '../views/SettlementView.vue';

const routes = [
  { path: '/', name: 'dashboard', component: SupplierDashboardView },
  { path: '/catalog', name: 'catalog', component: CatalogEditorView },
  { path: '/bulk-upload', name: 'bulk-upload', component: BulkUploadView },
  { path: '/rfq-market', name: 'rfq-market', component: RFQMarketView },
  { path: '/fulfillment', name: 'fulfillment', component: FulfillmentView },
  { path: '/settlement', name: 'settlement', component: SettlementView },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
