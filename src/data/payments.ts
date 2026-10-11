/**
 * Payment layer. DEMO_MODE is on: every method resolves with a fake reference
 * after a short delay and no money moves. To go live, replace each function body
 * with a call to your own backend (never call these providers with secret keys
 * from the browser):
 *   - M-PESA  → Safaricom Daraja "M-Pesa Express" (STK Push) via a serverless function
 *   - Card    → a card processor's hosted fields / checkout (e.g. Paystack, Flutterwave, Stripe)
 *   - PayPal  → PayPal JS SDK buttons + server-side order capture
 */
export const DEMO_MODE = true;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ref = (prefix: string, len = 8) => prefix + Array.from({ length: len }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

export async function requestStkPush(_phone: string, _amount: number): Promise<{ checkoutId: string }> {
  await wait(1200);
  return { checkoutId: ref('ws_CO_', 10) };
}
export async function pollStkStatus(_checkoutId: string): Promise<{ status: 'paid' | 'pending'; receipt?: string }> {
  await wait(4200);
  return { status: 'paid', receipt: ref('T', 9) };
}
export async function chargeCard(_card: { number: string; exp: string; cvc: string; name: string }, _amount: number) {
  await wait(2600);
  return { reference: ref('CRD-') };
}
export async function paypalCheckout(_amount: number) {
  await wait(3000);
  return { reference: ref('PP-') };
}

/* ---------- outgoing: refunds & payments to customers (admin) ----------
 * Live versions belong on the server:
 *   - M-PESA → Daraja B2C "BusinessPayment" / reversal of the original C2B receipt
 *   - Card   → your processor's refund endpoint against the original charge
 *   - PayPal → Payments API refund on the captured order
 */
export async function sendMpesaB2C(_phone: string, _amount: number): Promise<{ stage: 'accepted'; conversationId: string }> {
  await wait(1400);
  return { stage: 'accepted', conversationId: ref('AG_', 12) };
}
export async function confirmMpesaB2C(_conversationId: string): Promise<{ receipt: string }> {
  await wait(2200);
  return { receipt: ref('S', 9) };
}
export async function refundCard(_originalRef: string, _amount: number) {
  await wait(2000);
  return { receipt: ref('RFD-') };
}
export async function refundPaypal(_originalRef: string, _amount: number) {
  await wait(2000);
  return { receipt: ref('PPR-') };
}

/* ---------- helpers ---------- */
export function normaliseKePhone(raw: string): string | null {
  const d = raw.replace(/\D/g, '');
  if (/^0[17]\d{8}$/.test(d)) return '254' + d.slice(1);
  if (/^254[17]\d{8}$/.test(d)) return d;
  if (/^[17]\d{8}$/.test(d)) return '254' + d;
  return null;
}
export function luhn(num: string) {
  const d = num.replace(/\D/g, '');
  if (d.length < 13) return false;
  let sum = 0, alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = +d[i];
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}
export function cardBrand(num: string): 'visa' | 'mastercard' | null {
  const d = num.replace(/\D/g, '');
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard';
  return null;
}
export function expiryValid(exp: string) {
  const m = exp.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const mo = +m[1], yr = 2000 + +m[2];
  if (mo < 1 || mo > 12) return false;
  const end = new Date(yr, mo, 1);
  return end > new Date();
}
