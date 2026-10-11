import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { setOrderStatus, STATUS_LABEL, useAdminData, type AdminOrder, type OrderStatus } from '../../store/admin';
import { usePay } from './PayModal';
import { ago, clock, Empty, I, KindTag, kes, StatusPill } from './ui';

const FILTERS: ('all' | OrderStatus)[] = ['all', 'new', 'kitchen', 'ready', 'out', 'done', 'cancelled'];
const FLOW: OrderStatus[] = ['new', 'kitchen', 'ready', 'out', 'done'];

export default function Orders() {
  const { orders, messages, payouts } = useAdminData();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const f = (params.get('f') as 'all' | OrderStatus) || 'all';
  const sel = params.get('o');

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders.filter((o) => (f === 'all' || o.status === f) && (!term || [o.id, o.name, o.phone, o.reference].some((x) => x.toLowerCase().includes(term))));
  }, [orders, f, q]);

  const set = (k: string, v: string | null) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p, { replace: true }); };
  const current = orders.find((o) => o.id === sel);

  return (
    <div className="a-page">
      <header className="a-head">
        <div><span className="a-overline">{orders.length} on record</span><h1>Orders</h1></div>
        <label className="a-search"><I n="search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone, order or receipt no." /></label>
      </header>

      <div className="a-chips">
        {FILTERS.map((x) => {
          const n = x === 'all' ? orders.length : orders.filter((o) => o.status === x).length;
          return <button key={x} className={`a-chip ${f === x ? 'on' : ''}`} onClick={() => set('f', x === 'all' ? null : x)}>{x === 'all' ? 'All' : STATUS_LABEL[x]}<b>{n}</b></button>;
        })}
      </div>

      <div className="a-table-wrap">
        <table className="a-table">
          <thead><tr><th>Order</th><th>Customer</th><th className="hide-sm">Items</th><th className="hide-sm">Type</th><th>Status</th><th className="num">Total</th><th className="hide-sm">Time</th></tr></thead>
          <tbody>
            {shown.map((o) => {
              const msg = messages.some((m) => m.orderId === o.id && m.status === 'open');
              return (
                <tr key={o.id} className={sel === o.id ? 'sel' : ''} onClick={() => set('o', o.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && set('o', o.id)}>
                  <td className="mono">{o.id}{msg && <span className="a-dot-msg">msg</span>}</td>
                  <td><strong>{o.name}</strong><span className="a-sub">{o.phone}</span></td>
                  <td className="hide-sm a-ellipsis">{o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}</td>
                  <td className="hide-sm">{o.fulfilment === 'delivery' ? o.zone : 'Pickup'}</td>
                  <td><StatusPill s={o.status} /></td>
                  <td className="num mono">{kes(o.total)}{o.refunded > 0 && <span className="a-sub a-red">−{kes(o.refunded)}</span>}</td>
                  <td className="hide-sm a-muted">{clock(o.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!shown.length && <Empty title="No orders match">Try another filter or search.</Empty>}
      </div>

      <AnimatePresence>
        {current && <OrderDrawer key={current.id} o={current} onClose={() => set('o', null)} messages={messages.filter((m) => m.orderId === current.id)} paid={payouts.filter((p) => p.orderId === current.id)} />}
      </AnimatePresence>
    </div>
  );
}

function OrderDrawer({ o, onClose, messages, paid }: { o: AdminOrder; onClose: () => void; messages: ReturnType<typeof useAdminData>['messages']; paid: ReturnType<typeof useAdminData>['payouts'] }) {
  const pay = usePay();
  const step = FLOW.indexOf(o.status);
  const left = o.total - o.refunded;
  return (
    <>
      <motion.div className="a-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside className="a-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 280 }} aria-label={`Order ${o.id}`}>
        <header className="a-drawer-head">
          <div><span className="a-overline">{ago(o.createdAt)} · {o.method === 'mpesa' ? 'M-PESA' : o.method === 'card' ? 'Card' : 'PayPal'}</span><h2 className="mono">{o.id}</h2></div>
          <button className="a-iconbtn" onClick={onClose} aria-label="Close"><I n="x" /></button>
        </header>

        <div className="a-drawer-body">
          {o.status === 'cancelled' ? <div className="a-banner a-banner--red">Cancelled{o.refunded ? ` · KSh ${kes(o.refunded)} refunded` : left > 0 ? ' · not refunded yet' : ''}</div> : (
            <div className="a-steps">
              {FLOW.filter((s) => o.fulfilment === 'delivery' || s !== 'out').map((s) => {
                const i = FLOW.indexOf(s);
                return <button key={s} className={`${i < step ? 'done' : ''} ${i === step ? 'now' : ''}`} onClick={() => setOrderStatus(o.id, s)}><i />{STATUS_LABEL[s]}</button>;
              })}
            </div>
          )}

          <section className="a-block">
            <h4>Customer</h4>
            <p><strong>{o.name}</strong></p>
            <p className="a-inline"><a href={`tel:${o.phone}`} className="a-link"><I n="phone" size={14} /> {o.phone}</a></p>
            {o.address && <p className="a-muted">{o.address}</p>}
            <p className="a-muted">{o.when}</p>
          </section>

          <section className="a-block">
            <h4>Items</h4>
            <ul className="a-lines">
              {o.lines.map((l) => <li key={l.key}><b>{l.qty}×</b><span>{l.name}{l.meta && <em>{l.meta}</em>}</span><span className="mono">{kes(l.unit * l.qty)}</span></li>)}
            </ul>
            <dl className="a-sums">
              <dt>Subtotal</dt><dd className="mono">{kes(o.subtotal)}</dd>
              {o.delivery > 0 && <><dt>Delivery</dt><dd className="mono">{kes(o.delivery)}</dd></>}
              {o.discount > 0 && <><dt>Discount</dt><dd className="mono">−{kes(o.discount)}</dd></>}
              {o.tip > 0 && <><dt>Tip</dt><dd className="mono">{kes(o.tip)}</dd></>}
              <dt className="tot">Paid</dt><dd className="tot mono">KSh {kes(o.total)}</dd>
              {o.refunded > 0 && <><dt className="a-red">Refunded</dt><dd className="mono a-red">−{kes(o.refunded)}</dd></>}
            </dl>
            <p className="a-muted mono small">Ref {o.reference}</p>
          </section>

          {(messages.length > 0 || paid.length > 0) && (
            <section className="a-block">
              <h4>History</h4>
              <ul className="a-history">
                {messages.map((m) => <li key={m.id}><Link to={`/admin/inbox?m=${m.id}`}><KindTag k={m.kind} /> {m.subject}</Link><span className="a-muted">{ago(m.createdAt)}</span></li>)}
                {paid.map((p) => <li key={p.id}><span>Paid out <b className="mono">KSh {kes(p.amount)}</b> · {p.reference}</span><span className="a-muted">{ago(p.at)}</span></li>)}
              </ul>
            </section>
          )}
        </div>

        <footer className="a-drawer-foot">
          {o.status !== 'cancelled' && (left > 0
            ? <button className="a-btn" onClick={() => pay({ orderId: o.id, reason: 'refund', cancelOrder: true })}>Cancel &amp; refund</button>
            : <button className="a-btn" onClick={() => setOrderStatus(o.id, 'cancelled')}>Mark cancelled</button>)}
          <button className="a-btn a-btn--red" onClick={() => pay({ orderId: o.id, reason: left < o.total ? 'partial' : 'refund' })} disabled={left <= 0}>{left <= 0 ? 'Fully refunded' : 'Refund / pay'}</button>
        </footer>
      </motion.aside>
    </>
  );
}
