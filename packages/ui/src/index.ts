export { default as TierPriceBadge } from './TierPriceBadge.vue';
export { default as QuoteStatusPill } from './QuoteStatusPill.vue';
export { default as IncotermSelector } from './IncotermSelector.vue';
export { default as LedgerSummaryCard } from './LedgerSummaryCard.vue';

export interface PriceTierItem {
  minQuantity: string;
  maxQuantity?: string | null;
  unitPrice: string;
  currency: string;
}

export type OrderFSMStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'CONTRACT_PENDING'
  | 'CONTRACT_SIGNED'
  | 'PAYMENT_PENDING'
  | 'IN_PRODUCTION'
  | 'INSPECTION_PENDING'
  | 'SHIPPED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export const StatusColorMap: Record<OrderFSMStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
  PENDING_APPROVAL: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  APPROVED: { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  CONTRACT_PENDING: { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' },
  CONTRACT_SIGNED: { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  PAYMENT_PENDING: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  IN_PRODUCTION: { bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE' },
  INSPECTION_PENDING: { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE' },
  SHIPPED: { bg: '#CFFAFE', text: '#0E7490', border: '#A5F3FC' },
  CONFIRMED: { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  COMPLETED: { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' },
  CANCELLED: { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' },
  DISPUTED: { bg: '#FEE2E2', text: '#B91C1C', border: '#EF4444' },
};
