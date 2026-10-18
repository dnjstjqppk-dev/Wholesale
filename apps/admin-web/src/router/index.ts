import { createRouter, createWebHistory } from 'vue-router';
import VerificationAuditView from '../views/VerificationAuditView.vue';
import CatalogModerationView from '../views/CatalogModerationView.vue';
import LedgerAuditView from '../views/LedgerAuditView.vue';
import DisputeArbitrationView from '../views/DisputeArbitrationView.vue';
import SettlementApprovalView from '../views/SettlementApprovalView.vue';

const routes = [
  { path: '/', redirect: '/verifications' },
  { path: '/verifications', name: 'verifications', component: VerificationAuditView },
  { path: '/moderation', name: 'moderation', component: CatalogModerationView },
  { path: '/ledger-audit', name: 'ledger-audit', component: LedgerAuditView },
  { path: '/disputes', name: 'disputes', component: DisputeArbitrationView },
  { path: '/settlements', name: 'settlements', component: SettlementApprovalView },
  { path: '/:pathMatch(.*)*', redirect: '/verifications' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
