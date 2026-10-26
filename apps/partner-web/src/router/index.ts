import { createRouter, createWebHistory } from 'vue-router';
import SupplierDashboardView from '../views/SupplierDashboardView.vue';
import SupplierVerificationView from '../views/SupplierVerificationView.vue';
import CatalogEditorView from '../views/CatalogEditorView.vue';
import BulkUploadView from '../views/BulkUploadView.vue';
import InventoryManagementView from '../views/InventoryManagementView.vue';
import SupplierInquiriesView from '../views/SupplierInquiriesView.vue';
import RFQMarketView from '../views/RFQMarketView.vue';
import FulfillmentView from '../views/FulfillmentView.vue';
import SettlementView from '../views/SettlementView.vue';
import StorefrontBuilderView from '../views/StorefrontBuilderView.vue';
import SupplierAnalyticsView from '../views/SupplierAnalyticsView.vue';
import MarketingKwaView from '../views/MarketingKwaView.vue';

const routes = [
  { path: '/', name: 'dashboard', component: SupplierDashboardView },
  { path: '/verification', name: 'verification', component: SupplierVerificationView },
  { path: '/catalog', name: 'catalog', component: CatalogEditorView },
  { path: '/storefront', name: 'storefront', component: StorefrontBuilderView },
  { path: '/bulk-upload', name: 'bulk-upload', component: BulkUploadView },
  { path: '/catalog/bulk', name: 'catalog-bulk', component: BulkUploadView },
  { path: '/inventory', name: 'inventory', component: InventoryManagementView },
  { path: '/inquiries', name: 'inquiries', component: SupplierInquiriesView },
  { path: '/rfq-market', name: 'rfq-market', component: RFQMarketView },
  { path: '/marketing', name: 'marketing', component: MarketingKwaView },
  { path: '/analytics', name: 'analytics', component: SupplierAnalyticsView },
  { path: '/fulfillment', name: 'fulfillment', component: FulfillmentView },
  { path: '/settlement', name: 'settlement', component: SettlementView },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
