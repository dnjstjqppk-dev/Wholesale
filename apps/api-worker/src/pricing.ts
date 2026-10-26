import { check } from './security';

export function quantity(value: unknown): number {
  check((typeof value === 'string' && /^\d+$/.test(value)) || typeof value === 'number', 422, 'INVALID_QUANTITY', '수량은 양의 정수여야 합니다.');
  const q = Number(value);
  check(Number.isSafeInteger(q) && q > 0, 422, 'INVALID_QUANTITY', '수량은 양의 정수여야 합니다.');
  return q;
}
export function moneyMinor(price: unknown, qty: number, currency: string): number {
  check(['USD', 'KRW', 'JPY', 'CNY', 'EUR'].includes(currency), 422, 'INVALID_CURRENCY', '지원하지 않는 결제 통화입니다.');
  const text = String(price);
  check(/^\d+(\.\d{1,6})?$/.test(text), 422, 'INVALID_PRICE', '단가는 소수점 6자리 이하의 양수여야 합니다.');
  const [whole, fraction = ''] = text.split('.');
  const micros = BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, '0'));
  check(micros > 0n, 422, 'INVALID_PRICE', '단가는 0보다 커야 합니다.');
  const divisor = ['KRW', 'JPY'].includes(currency) ? 1000000n : 10000n;
  const amount = (micros * BigInt(quantity(qty)) + divisor / 2n) / divisor;
  check(amount > 0n && amount <= BigInt(Number.MAX_SAFE_INTEGER), 422, 'AMOUNT_OUT_OF_RANGE', '금액 범위를 벗어났습니다.');
  return Number(amount);
}
export function priceListing(listing: any, value: unknown) {
  check(listing && listing.status === 'PUBLISHED', 404, 'LISTING_UNAVAILABLE', '판매 중인 상품을 찾을 수 없습니다.');
  const qty = quantity(value);
  const moq = quantity(listing.moq);
  check(qty >= moq, 422, 'BELOW_MOQ', `최소 주문 수량은 ${moq}입니다.`);
  const step = quantity(listing.order_step || listing.step_quantity || 1);
  check((qty - moq) % step === 0, 422, 'INVALID_ORDER_STEP', `최소 주문 수량부터 ${step} 단위로 주문하세요.`);
  const tier = [...(listing.price_tiers || [])].sort((a, b) => Number(b.min_quantity) - Number(a.min_quantity)).find(t => qty >= Number(t.min_quantity) && (!t.max_quantity || qty <= Number(t.max_quantity)));
  check(tier, 422, 'NO_PRICE_TIER', '해당 수량의 가격은 공급사에 견적을 요청하세요.');
  const currency = tier.currency || 'USD';
  return { quantity: qty, unit_price: String(tier.unit_price), currency, total_amount_minor: moneyMinor(tier.unit_price, qty, currency) };
}
export function major(minor: number, currency: string) { return (minor / (['KRW', 'JPY'].includes(currency) ? 1 : 100)).toFixed(['KRW', 'JPY'].includes(currency) ? 0 : 2); }
