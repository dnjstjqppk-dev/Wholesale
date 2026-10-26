import { createRouter, createWebHistory } from 'vue-router';
import AdminDashboardView from '../views/AdminDashboardView.vue';
import VerificationAuditView from '../views/VerificationAuditView.vue';
import VerificationReviewView from '../views/VerificationReviewView.vue';
import CatalogModerationView from '../views/CatalogModerationView.vue';
import LedgerAuditView from '../views/LedgerAuditView.vue';
import LedgerReconciliationView from '../views/LedgerReconciliationView.vue';
import DisputeArbitrationView from '../views/DisputeArbitrationView.vue';
import SettlementApprovalView from '../views/SettlementApprovalView.vue';
import AuditLogView from '../views/AuditLogView.vue';
import MasterDataView from '../views/MasterDataView.vue';

const routes = [
  { path: '/', name: 'dashboard', component: AdminDashboardView },
  { path: '/verifications', name: 'verifications', component: VerificationAuditView },
  { path: '/verifications/review', name: 'verifications-review', component: VerificationReviewView },
  { path: '/moderation', name: 'moderation', component: CatalogModerationView },
  { path: '/master-data', name: 'master-data', component: MasterDataView },
  { path: '/ledger-audit', name: 'ledger-audit', component: LedgerAuditView },
  { path: '/reconciliation', name: 'reconciliation', component: LedgerReconciliationView },
  { path: '/disputes', name: 'disputes', component: DisputeArbitrationView },
  { path: '/settlements', name: 'settlements', component: SettlementApprovalView },
  { path: '/audit', name: 'audit', component: AuditLogView },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
