/**
 * Admin data layer. Like the payment layer, this runs in DEMO mode: everything
 * lives in this browser's localStorage, so the admin only sees orders and
 * messages created on the same device. To go live, back each read/write below
 * with your own API (and put the admin behind real login on that server).
 */
import { useSyncExternalStore } from 'react';
import { DISHES, ZONES } from '../data/menu';
import type { Line, Order } from './cart';

export type OrderStatus = 'new' | 'kitchen' | 'ready' | 'out' | 'done' | 'cancelled';
export type MessageKind = 'cancel' | 'enquiry' | 'reservation' | 'delivery' | 'feedback';
export type PayoutMethod = 'mpesa' | 'card' | 'paypal';
export type PayoutReason = 'refund' | 'partial' | 'goodwill' | 'other';

export interface AdminOrder extends Order { status: OrderStatus; refunded: number; }

export interface ThreadEntry { from: 'customer' | 'staff'; body: string; at: number; }
export interface Message {
  id: string;
  kind: MessageKind;
  orderId?: string;
  name: string;
  phone: string;
  subject: string;
  thread: ThreadEntry[];
  status: 'open' | 'resolved';
  createdAt: number;
  meta?: Record<string, string>;
}

export interface Payout {
  id: string;
  name: string;
  phone: string;
  method: PayoutMethod;
  amount: number;
  reason: PayoutReason;
  note?: string;
  orderId?: string;
  messageId?: string;
  reference: string;
  at: number;
}

export const KIND_LABEL: Record<MessageKind, string> = {
  cancel: 'Cancellation',
  enquiry: 'Order enquiry',
  reservation: 'Reservation',
  delivery: 'Delivery issue',
  feedback: 'Feedback',
};
export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'New', kitchen: 'In kitchen', ready: 'Ready', out: 'Out for delivery', done: 'Completed', cancelled: 'Cancelled',
};
export const REASON_LABEL: Record<PayoutReason, string> = {
  refund: 'Full refund', partial: 'Partial refund', goodwill: 'Goodwill credit', other: 'Other',
};

/* ---------- storage ---------- */
const K = { orders: 'chabao.orders.v1', status: 'chabao.admin.status.v1', messages: 'chabao.messages.v1', payouts: 'chabao.payouts.v1', seeded: 'chabao.admin.seeded.v1' };

function read<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function write(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ }
  emit();
}

let version = 0;
const listeners = new Set<() => void>();
function emit() { version++; listeners.forEach((l) => l()); }
if (typeof window !== 'undefined') {
  // Another tab (e.g. a customer cancelling) wrote to storage: refresh the admin live.
  window.addEventListener('storage', (e) => { if (e.key?.startsWith('chabao.')) emit(); });
}
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }

/** Re-renders whenever any admin data changes, in this tab or another. */
export function useAdminData() {
  useSyncExternalStore(subscribe, () => version);
  return { orders: listOrders(), messages: listMessages(), payouts: listPayouts() };
}

/* ---------- reads ---------- */
export function listOrders(): AdminOrder[] {
  const raw = read<Record<string, Order & { refunded?: number }>>(K.orders, {});
  const status = read<Record<string, OrderStatus>>(K.status, {});
  return Object.values(raw)
    .map((o) => ({ ...o, status: status[o.id] ?? autoStatus(o), refunded: o.refunded ?? 0 }))
    .sort((a, b) => b.createdAt - a.createdAt);
}
export function listMessages(): Message[] {
  return Object.values(read<Record<string, Message>>(K.messages, {})).sort((a, b) => last(b) - last(a));
}
export function listPayouts(): Payout[] {
  return read<Payout[]>(K.payouts, []).sort((a, b) => b.at - a.at);
}
const last = (m: Message) => m.thread[m.thread.length - 1]?.at ?? m.createdAt;

/** Orders nobody has touched yet: new for 5 minutes, then assumed to be with the kitchen. */
function autoStatus(o: Order): OrderStatus {
  return Date.now() - o.createdAt < 5 * 60_000 ? 'new' : 'kitchen';
}

/* ---------- writes ---------- */
export function setOrderStatus(id: string, s: OrderStatus) {
  write(K.status, { ...read<Record<string, OrderStatus>>(K.status, {}), [id]: s });
}

export function postMessage(m: Omit<Message, 'id' | 'createdAt' | 'status' | 'thread'> & { body: string }) {
  const all = read<Record<string, Message>>(K.messages, {});
  const id = 'M' + Date.now().toString(36).toUpperCase();
  const { body, ...rest } = m;
  all[id] = { ...rest, id, createdAt: Date.now(), status: 'open', thread: [{ from: 'customer', body, at: Date.now() }] };
  write(K.messages, all);
  return id;
}
export function replyToMessage(id: string, body: string) {
  const all = read<Record<string, Message>>(K.messages, {});
  if (!all[id]) return;
  all[id].thread.push({ from: 'staff', body, at: Date.now() });
  write(K.messages, all);
}
export function setMessageStatus(id: string, status: Message['status']) {
  const all = read<Record<string, Message>>(K.messages, {});
  if (!all[id]) return;
  all[id].status = status;
  write(K.messages, all);
}

export function recordPayout(p: Omit<Payout, 'id' | 'at'>) {
  const payout: Payout = { ...p, id: 'P' + Date.now().toString(36).toUpperCase(), at: Date.now() };
  write(K.payouts, [payout, ...read<Payout[]>(K.payouts, [])]);
  if (p.orderId) {
    const orders = read<Record<string, Order & { refunded?: number }>>(K.orders, {});
    if (orders[p.orderId]) {
      orders[p.orderId].refunded = (orders[p.orderId].refunded ?? 0) + p.amount;
      write(K.orders, orders);
    }
  }
  return payout;
}

/* ---------- demo seed ---------- */
const NAMES = ['Wanjiru Kamau', 'Brian Otieno', 'Amina Hassan', 'Kevin Mwangi', 'Faith Njeri', 'Daniel Kiprop', 'Grace Achieng', 'Samuel Mutua', 'Leah Wambui', 'Omar Abdi', 'Priya Shah', 'Tom Ndegwa', 'Joy Chebet', 'Mark Odhiambo'];

export function seedDemo(force = false) {
  if (!force && read(K.seeded, false)) return;
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const phone = () => '07' + String(Math.floor(rnd() * 1e8)).padStart(8, '0');
  const now = Date.now();
  const midnight = new Date(now).setHours(0, 0, 0, 0);
  const span = Math.max(60 * 60_000, Math.min(10 * 3600_000, now - midnight - 15 * 60_000));
  const orders = read<Record<string, Order & { demo?: boolean }>>(K.orders, {});
  const status = read<Record<string, OrderStatus>>(K.status, {});
  const ids: string[] = [];

  for (let i = 0; i < 22; i++) {
    // First seven are live (on the board); the rest spread back over the day so far.
    const ago = i < 7 ? Math.floor(1 + i * 4 + rnd() * 3) * 60_000 : Math.floor(35 * 60_000 + ((i - 7) / 15) * (span - 35 * 60_000) + rnd() * 600_000);
    const lines: Line[] = Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => {
      const d = pick(DISHES);
      return { key: d.id, kind: 'dish' as const, refId: d.id, name: d.name, image: d.image, unit: d.price, qty: 1 + Math.floor(rnd() * 2) };
    }).filter((l, j, arr) => arr.findIndex((x) => x.key === l.key) === j);
    const subtotal = lines.reduce((t, l) => t + l.unit * l.qty, 0);
    const delivery = rnd() > 0.3;
    const zone = pick(ZONES);
    const fee = delivery ? zone.fee : 0;
    const method = pick(['mpesa', 'mpesa', 'mpesa', 'card', 'paypal'] as const);
    const id = 'CB' + (now - ago).toString(36).toUpperCase().slice(-6);
    ids.push(id);
    orders[id] = {
      demo: true, id, createdAt: now - ago, lines, subtotal, delivery: fee, discount: 0, tip: 0, total: subtotal + fee,
      fulfilment: delivery ? 'delivery' : 'pickup', zone: delivery ? zone.name : undefined, eta: delivery ? zone.eta : '20–25',
      address: delivery ? `${pick(['Apt 4B', 'House 12', 'Block C, 3rd floor', 'Office 210'])}, ${zone.name}` : undefined,
      when: 'As soon as possible', name: NAMES[i % NAMES.length], phone: phone(), method,
      reference: method === 'mpesa' ? 'T' + Math.floor(rnd() * 1e9).toString(36).toUpperCase() : (method === 'card' ? 'CRD-' : 'PP-') + Math.floor(rnd() * 1e8).toString(36).toUpperCase(),
    };
    const age = ago / 60_000;
    status[id] = age < 6 ? 'new' : age < 15 ? 'kitchen' : age < 22 ? 'ready' : age < 32 ? 'out' : i === 9 ? 'cancelled' : 'done';
  }
  write(K.orders, orders);
  write(K.status, status);

  const msgs = read<Record<string, Message>>(K.messages, {});
  const o = (i: number) => orders[ids[i]];
  const m = (id: string, kind: MessageKind, i: number | null, subject: string, body: string, wantAgo: number, extra: Partial<Message> = {}) => {
    const ord = i === null ? undefined : o(i);
    // Never earlier than the order it is about.
    const minsAgo = ord ? Math.max(1, Math.min(wantAgo, Math.floor((now - ord.createdAt) / 60_000) - 2)) : wantAgo;
    msgs[id] = {
      id, kind, orderId: ord?.id, name: ord?.name ?? pick(NAMES), phone: ord?.phone ?? phone(), subject, status: 'open',
      createdAt: now - minsAgo * 60_000, thread: [{ from: 'customer', body, at: now - minsAgo * 60_000 }], ...extra,
    };
  };
  m('MDEMO1', 'cancel', 1, 'Please cancel, ordered twice', 'Hi, I placed the same order twice by mistake. Please cancel this one and refund to my M-PESA.', 4);
  m('MDEMO2', 'cancel', 3, 'Cancel order — plans changed', 'Sorry, we have to leave the office early. Can you cancel before it goes out?', 11);
  m('MDEMO3', 'enquiry', 2, 'Can I add a second bao?', 'Is it too late to add another Sticky Pork Belly Bao to my order? Happy to pay the difference.', 7);
  m('MDEMO4', 'delivery', 6, 'Rider can’t find the gate', 'The rider called but couldn’t find us. It’s the black gate next to the pharmacy.', 26);
  m('MDEMO5', 'enquiry', 5, 'Is the har gow gluten free?', 'My friend is coeliac. Is the crystal skin on the har gow safe for her?', 33);
  m('MDEMO6', 'reservation', null, 'Table for 8, Saturday 7pm', 'Birthday dinner for my sister, 8 people. Can we get the round table with the lazy Susan?', 52, { meta: { Guests: '8', Date: 'Saturday', Time: '19:00', Occasion: 'Birthday' } });
  m('MDEMO7', 'feedback', 12, 'Best dan dan in Nairobi', 'Just wanted to say the dan dan noodles were incredible. Will be back this weekend.', 95, { status: 'resolved' });
  m('MDEMO8', 'delivery', 8, 'Missing the cucumber salad', 'My order arrived but the smashed cucumber was missing from the bag.', 140);
  m('MDEMO9', 'cancel', 9, 'Cancel please', 'Ordered to the wrong address, please cancel. I’ll reorder.', 180, { status: 'resolved' });
  const refundAt = msgs.MDEMO9.createdAt + 6 * 60_000;
  msgs.MDEMO9.thread.push({ from: 'staff', body: 'Done — cancelled and refunded to your M-PESA. Sorry for the trouble!', at: refundAt });
  m('MDEMO10', 'reservation', null, 'Business lunch, 4 people', 'Table for four tomorrow at 1pm, quiet corner if possible.', 230, { meta: { Guests: '4', Date: 'Tomorrow', Time: '13:00', Occasion: 'Business' } });
  write(K.messages, msgs);

  write(K.payouts, [{ id: 'PDEMO1', name: o(9).name, phone: o(9).phone, method: 'mpesa', amount: o(9).total, reason: 'refund', orderId: o(9).id, messageId: 'MDEMO9', reference: 'SKD4Q7X2LM', at: refundAt }]);
  orders[o(9).id] = { ...orders[o(9).id], refunded: o(9).total } as Order;
  write(K.orders, orders);
  write(K.seeded, true);
}

/** Wipes the seeded demo records (real orders placed on this device stay) and seeds a fresh set. */
export function resetDemo() {
  const orders = read<Record<string, Order & { demo?: boolean }>>(K.orders, {});
  const status = read<Record<string, OrderStatus>>(K.status, {});
  const demoIds = new Set(Object.keys(orders).filter((id) => orders[id].demo));
  for (const id of demoIds) { delete orders[id]; delete status[id]; }
  const msgs = read<Record<string, Message>>(K.messages, {});
  for (const id of Object.keys(msgs)) if (id.startsWith('MDEMO')) delete msgs[id];
  write(K.orders, orders);
  write(K.status, status);
  write(K.messages, msgs);
  write(K.payouts, read<Payout[]>(K.payouts, []).filter((p) => !p.id.startsWith('PDEMO') && !demoIds.has(p.orderId ?? '')));
  seedDemo(true);
}
