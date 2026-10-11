import type { ReactNode } from 'react';
import type { MessageKind, OrderStatus } from '../../store/admin';
import { KIND_LABEL, STATUS_LABEL } from '../../store/admin';

export const kes = (n: number) => n.toLocaleString('en-KE');

export function ago(t: number, now = Date.now()) {
  const m = Math.round((now - t) / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60 ? `${m % 60}m ` : ''}ago`;
  return new Date(t).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}
export const clock = (t: number) => new Date(t).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false });

export function StatusPill({ s }: { s: OrderStatus }) {
  return <span className={`a-pill a-pill--${s}`}><i />{STATUS_LABEL[s]}</span>;
}
export function KindTag({ k }: { k: MessageKind }) {
  return <span className={`a-kind a-kind--${k}`}>{KIND_LABEL[k]}</span>;
}

const P: Record<string, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
  ticket: <><path d="M4 5h16v4a3 3 0 0 0 0 6v4H4v-4a3 3 0 0 0 0-6z" /><path d="M10 5v14" strokeDasharray="2 2" /></>,
  inbox: <><path d="M3 13l3-8h12l3 8v6H3z" /><path d="M3 13h5l1 3h6l1-3h5" /></>,
  send: <><path d="M4 12h13" /><path d="M12 6l6 6-6 6" /><path d="M20 4v16" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>,
  x: <><path d="M6 6l12 12M18 6L6 18" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  arrow: <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>,
  back: <><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></>,
  reply: <><path d="M10 7L4 12l6 5" /><path d="M4 12h10a6 6 0 0 1 6 6" /></>,
  ext: <><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v6H4V6h6" /></>,
  refresh: <><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 5v6h-6" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
};
export function I({ n, size = 18 }: { n: keyof typeof P; size?: number }) {
  return <svg className="a-ic" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="square" strokeLinejoin="miter" aria-hidden>{P[n]}</svg>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="a-empty"><strong>{title}</strong>{children && <p>{children}</p>}</div>;
}
