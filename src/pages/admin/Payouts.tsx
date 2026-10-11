import { useState } from 'react';
import { Link } from 'react-router-dom';
import { REASON_LABEL, useAdminData, type PayoutReason } from '../../store/admin';
import { usePay } from './PayModal';
import { Empty, I, kes } from './ui';

export default function Payouts() {
  const { payouts, orders } = useAdminData();
  const pay = usePay();
  const [r, setR] = useState<PayoutReason | 'all'>('all');
  const shown = payouts.filter((p) => r === 'all' || p.reason === r);
  const total = shown.reduce((t, p) => t + p.amount, 0);
  const weekAgo = Date.now() - 7 * 86400_000;
  const week = payouts.filter((p) => p.at > weekAgo).reduce((t, p) => t + p.amount, 0);
  const gross = orders.filter((o) => o.createdAt > weekAgo).reduce((t, o) => t + o.total, 0);
  const pending = orders.filter((o) => o.status === 'cancelled' && o.total - o.refunded > 0);

  return (
    <div className="a-page">
      <header className="a-head">
        <div><span className="a-overline">Refunds &amp; payments to customers</span><h1>Payouts</h1></div>
        <button className="a-btn a-btn--red" onClick={() => pay()}><I n="send" size={16} /> New payment</button>
      </header>

      <section className="a-kpis a-kpis--3">
        <div className="a-kpi"><span className="a-kpi-label">Paid out · 7 days</span><span className="a-kpi-val"><small>KSh</small>{kes(week)}</span><span className="a-kpi-sub">{gross ? `${((week / gross) * 100).toFixed(1)}% of takings` : '—'}</span></div>
        <div className="a-kpi"><span className="a-kpi-label">Payments</span><span className="a-kpi-val">{payouts.length}</span><span className="a-kpi-sub">all time on this device</span></div>
        <div className={`a-kpi ${pending.length ? 'a-kpi--red' : ''}`}><span className="a-kpi-label">Cancelled, not refunded</span><span className="a-kpi-val">{pending.length}</span><span className="a-kpi-sub">{pending.length ? `KSh ${kes(pending.reduce((t, o) => t + o.total - o.refunded, 0))} owed` : 'nothing owed'}</span></div>
      </section>

      {pending.length > 0 && (
        <section className="a-card a-owed">
          <div className="a-card-head"><h3>Owed to customers</h3></div>
          {pending.map((o) => (
            <div key={o.id} className="a-owed-row">
              <Link to={`/admin/orders?o=${o.id}`} className="mono a-link">{o.id}</Link>
              <strong>{o.name}</strong>
              <span className="mono">KSh {kes(o.total - o.refunded)}</span>
              <button className="a-btn a-btn--sm a-btn--red" onClick={() => pay({ orderId: o.id, reason: o.refunded ? 'partial' : 'refund', amount: o.total - o.refunded })}>Refund now</button>
            </div>
          ))}
        </section>
      )}

      <div className="a-chips">
        {(['all', ...Object.keys(REASON_LABEL)] as (PayoutReason | 'all')[]).map((x) => (
          <button key={x} className={`a-chip ${r === x ? 'on' : ''}`} onClick={() => setR(x)}>{x === 'all' ? 'All' : REASON_LABEL[x]}<b>{x === 'all' ? payouts.length : payouts.filter((p) => p.reason === x).length}</b></button>
        ))}
      </div>

      <div className="a-ledger">
        {shown.map((p) => (
          <div key={p.id} className="a-ledger-row">
            <div className="a-ledger-date"><b>{new Date(p.at).toLocaleDateString('en-KE', { day: '2-digit' })}</b><span>{new Date(p.at).toLocaleDateString('en-KE', { month: 'short' })}</span></div>
            <div className="a-ledger-who"><strong>{p.name}</strong><span className="a-muted">{REASON_LABEL[p.reason]}{p.note ? ` · ${p.note}` : ''}</span></div>
            <div className="a-ledger-ref"><span className="mono">{p.reference}</span><span className="a-muted">{p.method === 'mpesa' ? `M-PESA · ${p.phone}` : p.method === 'card' ? 'Card refund' : 'PayPal refund'}</span></div>
            <div className="a-ledger-order">{p.orderId ? <Link className="mono a-link" to={`/admin/orders?o=${p.orderId}`}>{p.orderId}</Link> : <span className="a-muted">—</span>}</div>
            <div className="a-ledger-amt mono">−{kes(p.amount)}</div>
          </div>
        ))}
        {shown.length > 0 && <div className="a-ledger-total"><span>Total</span><span className="mono">−{kes(total)}</span></div>}
        {!shown.length && <Empty title="No payments yet">Refunds you send from an order or a cancellation show up here.</Empty>}
      </div>
    </div>
  );
}
