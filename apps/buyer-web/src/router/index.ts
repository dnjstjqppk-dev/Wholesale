import { createRouter, createWebHistory } from 'vue-router';
import CatalogView from '../views/CatalogView.vue';
import ProductDetailView from '../views/ProductDetailView.vue';
import RFQCreateView from '../views/RFQCreateView.vue';
import QuoteReviewView from '../views/QuoteReviewView.vue';
import ContractSignView from '../views/ContractSignView.vue';
import OrdersView from '../views/OrdersView.vue';
import DisputeCreateView from '../views/DisputeCreateView.vue';
import CartView from '../views/CartView.vue';
import CheckoutView from '../views/CheckoutView.vue';

const routes = [
  {
    path: '/',
    redirect: '/ko/KRW/',
  },
  // Explicit top-level direct routes (prevents route collision)
  { path: '/catalog', component: CatalogView },
  { path: '/products/:id', component: ProductDetailView },
  { path: '/cart', component: CartView },
  { path: '/checkout', component: CheckoutView },
  { path: '/sourcing/rfq/new', component: RFQCreateView },
  { path: '/sourcing/quotes/:id', component: QuoteReviewView },
  { path: '/orders', component: OrdersView },
  { path: '/orders/:id/contract', component: ContractSignView },
  { path: '/orders/:id/dispute', component: DisputeCreateView },

  // Locale-prefixed routes with strict regex constraint
  {
    path: '/:locale(ko|en|zh|ja)/:currency(KRW|USD|CNY|JPY)',
    children: [
      { path: '', name: 'home', component: CatalogView },
      { path: 'catalog', name: 'catalog', component: CatalogView },
      { path: 'products/:id', name: 'product-detail', component: ProductDetailView },
      { path: 'cart', name: 'cart', component: CartView },
      { path: 'checkout', name: 'checkout', component: CheckoutView },
      { path: 'sourcing/rfq/new', name: 'rfq-create', component: RFQCreateView },
      { path: 'sourcing/quotes/:id', name: 'quote-review', component: QuoteReviewView },
      { path: 'orders', name: 'orders', component: OrdersView },
      { path: 'orders/:id/contract', name: 'contract-sign', component: ContractSignView },
      { path: 'orders/:id/dispute', name: 'dispute-create', component: DisputeCreateView },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/ko/KRW/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

