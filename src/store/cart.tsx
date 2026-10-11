import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';

export interface Line {
  key: string;
  kind: 'dish' | 'tea' | 'steamer';
  refId: string;
  name: string;
  image: string;
  unit: number;
  qty: number;
  meta?: string;
}

type Action =
  | { type: 'add'; line: Omit<Line, 'qty'>; qty?: number }
  | { type: 'qty'; key: string; qty: number }
  | { type: 'remove'; key: string }
  | { type: 'clear' };

const STORAGE = 'chabao.cart.v1';

function load(): Line[] {
  try { return JSON.parse(localStorage.getItem(STORAGE) || '[]'); } catch { return []; }
}

function reducer(state: Line[], a: Action): Line[] {
  switch (a.type) {
    case 'add': {
      const n = a.qty ?? 1;
      const hit = state.find((l) => l.key === a.line.key);
      if (hit) return state.map((l) => (l.key === a.line.key ? { ...l, qty: Math.min(20, l.qty + n) } : l));
      return [...state, { ...a.line, qty: n }];
    }
    case 'qty':
      return a.qty <= 0 ? state.filter((l) => l.key !== a.key) : state.map((l) => (l.key === a.key ? { ...l, qty: Math.min(20, a.qty) } : l));
    case 'remove':
      return state.filter((l) => l.key !== a.key);
    case 'clear':
      return [];
  }
}

interface CartCtx {
  lines: Line[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: Omit<Line, 'qty'>, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  toast: string | null;
}

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, undefined, load);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE, JSON.stringify(lines)); } catch { /* storage unavailable */ }
  }, [lines]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const value = useMemo<CartCtx>(() => ({
    lines,
    count: lines.reduce((s, l) => s + l.qty, 0),
    subtotal: lines.reduce((s, l) => s + l.qty * l.unit, 0),
    open,
    setOpen,
    add: (line, qty) => { dispatch({ type: 'add', line, qty }); setToast(`${line.name} added to your table`); },
    setQty: (key, qty) => dispatch({ type: 'qty', key, qty }),
    remove: (key) => dispatch({ type: 'remove', key }),
    clear: () => dispatch({ type: 'clear' }),
    toast,
  }), [lines, open, toast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCart outside CartProvider');
  return c;
}

/* ---------- Orders (saved locally so the tracking page survives a refresh) ---------- */
export interface Order {
  id: string;
  createdAt: number;
  lines: Line[];
  subtotal: number;
  delivery: number;
  discount: number;
  tip: number;
  total: number;
  fulfilment: 'delivery' | 'pickup';
  zone?: string;
  eta?: string;
  address?: string;
  when: string;
  name: string;
  phone: string;
  method: 'mpesa' | 'card' | 'paypal';
  reference: string;
}
const ORDERS = 'chabao.orders.v1';
export function saveOrder(o: Order) {
  try {
    const all = JSON.parse(localStorage.getItem(ORDERS) || '{}');
    all[o.id] = o;
    localStorage.setItem(ORDERS, JSON.stringify(all));
  } catch { /* ignore */ }
  sessionOrders[o.id] = o;
}
const sessionOrders: Record<string, Order> = {};
export function getOrder(id: string): Order | undefined {
  if (sessionOrders[id]) return sessionOrders[id];
  try { return JSON.parse(localStorage.getItem(ORDERS) || '{}')[id]; } catch { return undefined; }
}
