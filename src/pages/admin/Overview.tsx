import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { setOrderStatus, useAdminData, type AdminOrder, type OrderStatus } from '../../store/admin';
import { ago, I, KindTag, kes } from './ui';

const BOARD: { s: OrderStatus; label: string; next?: OrderStatus; action?: string }[] = [
  { s: 'new', label: 'New', next: 'kitchen', action: 'Accept' },
  { s: 'kitchen', label: 'In kitchen', next: 'ready', action: 'Mark ready' },
  { s: 'ready', label: 'Ready', next: 'out', action: 'Hand to rider' },
  { s: 'out', label: 'On the road', next: 'done', action: 'Delivered' },
];

const startOfDay = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };

export default function Overview() {
  const { orders, messages, payouts } = useAdminData();
  const today = startOfDay();
  const todays = orders.filter((o) => o.createdAt >= today);
  const live = todays.filter((o) => o.status !== 'cancelled');
  const gross = live.reduce((t, o) => t + o.total, 0);
  const paidOut = payouts.filter((p) => p.at >= today).reduce((t, p) => t + p.amount, 0);
  const avg = live.length ? Math.round(gross / live.length) : 0;
  const open = messages.filter((m) => m.status === 'open');
  const cancels = open.filter((m) => m.kind === 'cancel');

  // Hourly takings: 14 hours from opening (or the first order, if earlier)
  const firstH = live.length ? Math.min(...live.map((o) => new Date(o.createdAt).getHours())) : 10;
  const startH = Math.max(0, Math.min(10, firstH, 23 - 13));
  const hours = Array.from({ length: 14 }, (_, i) => startH + i);
  const byHour = hours.map((h) => live.filter((o) => new Date(o.createdAt).getHours() === h).reduce((t, o) => t + o.total, 0));
  const peak = Math.max(1, ...byHour);
  const nowH = new Date().getHours();

  // Top dishes today
  const counts = new Map<string, number>();
  live.forEach((o) => o.lines.forEach((l) => counts.set(l.name, (counts.get(l.name) ?? 0) + l.qty)));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topMax = top[0]?.[1] ?? 1;

  return (
    <div className="a-page">
      <header className="a-head">
        <div>
          <span className="a-overline">{new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <h1>Today</h1>
        </div>
      </header>

      <section className="a-kpis">
        <Kpi label="Takings" value={kes(gross)} unit="KSh" sub={`${live.length} orders`} />
        <Kpi label="Average order" value={kes(avg)} unit="KSh" sub="per ticket" />
        <Kpi label="Paid out" value={kes(paidOut)} unit="KSh" sub={(() => { const n = payouts.filter((p) => p.at >= today).length; return `${n} payment${n === 1 ? '' : 's'}`; })()} tone={paidOut ? 'red' : undefined} />
        <Link to="/admin/inbox?f=cancel" className="a-kpi a-kpi--link">
          <span className="a-kpi-label">Waiting on you</span>
          <span className="a-kpi-val">{open.length}</span>
          <span className="a-kpi-sub">{cancels.length ? <b className="a-red">{cancels.length} cancellation{cancels.length > 1 ? 's' : ''}</b> : 'messages open'} <I n="arrow" size={14} /></span>
        </Link>
      </section>

      <section className="a-row">
        <div className="a-card a-chart">
          <div className="a-card-head"><h3>Takings by hour</h3><span className="a-overline">Peak KSh {kes(peak === 1 ? 0 : peak)}</span></div>
          <div className="a-bars" role="img" aria-label="Takings by hour">
            {hours.map((h, i) => (
              <div key={h} className={`a-bar ${h === nowH ? 'now' : ''} ${h > nowH ? 'future' : ''}`} title={`${h}:00 · KSh ${kes(byHour[i])}`}>
                <motion.span initial={{ scaleY: 0 }} animate={{ scaleY: byHour[i] / peak }} transition={{ delay: i * 0.03, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }} />
                <em>{h}</em>
              </div>
            ))}
          </div>
        </div>
        <div className="a-card a-top">
          <div className="a-card-head"><h3>Selling today</h3></div>
          {top.length ? (
            <ol>
              {top.map(([n, c], i) => (
                <li key={n}>
                  <span className="a-top-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="a-top-name">{n}</span>
                  <span className="a-top-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${(c / topMax) * 100}%` }} transition={{ delay: 0.2 + i * 0.05 }} /></span>
                  <span className="mono">{c}</span>
                </li>
              ))}
            </ol>
          ) : <p className="a-muted">No orders yet today.</p>}
        </div>
      </section>

      <section>
        <div className="a-section-head"><h2>Order board</h2><Link to="/admin/orders" className="a-link">All orders <I n="arrow" size={14} /></Link></div>
        <div className="a-board">
          {BOARD.map((col) => {
            const list = orders.filter((o) => o.status === col.s);
            return (
              <div key={col.s} className={`a-col a-col--${col.s}`}>
                <div className="a-col-head"><span>{col.label}</span><b>{list.length}</b></div>
                <div className="a-col-body">
                  {list.map((o) => <BoardCard key={o.id} o={o} next={col.next} action={col.action} hasMsg={messages.some((m) => m.orderId === o.id && m.status === 'open')} />)}
                  {!list.length && <div className="a-col-empty">Nothing here</div>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {open.length > 0 && (
        <section>
          <div className="a-section-head"><h2>Latest messages</h2><Link to="/admin/inbox" className="a-link">Inbox <I n="arrow" size={14} /></Link></div>
          <div className="a-card a-mini-inbox">
            {open.slice(0, 4).map((m) => (
              <Link key={m.id} to={`/admin/inbox?m=${m.id}`} className="a-mini-row">
                <KindTag k={m.kind} />
                <strong>{m.name}</strong>
                <span className="a-muted a-ellipsis">{m.subject}</span>
                <span className="a-muted mono">{ago(m.thread[m.thread.length - 1].at)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Kpi({ label, value, unit, sub, tone }: { label: string; value: string; unit?: string; sub: string; tone?: 'red' }) {
  return (
    <div className={`a-kpi ${tone ? `a-kpi--${tone}` : ''}`}>
      <span className="a-kpi-label">{label}</span>
      <span className="a-kpi-val">{unit && <small>{unit}</small>}{value}</span>
      <span className="a-kpi-sub">{sub}</span>
    </div>
  );
}

function BoardCard({ o, next, action, hasMsg }: { o: AdminOrder; next?: OrderStatus; action?: string; hasMsg: boolean }) {
  const mins = Math.floor((Date.now() - o.createdAt) / 60_000);
  const late = (o.status === 'new' && mins > 5) || (o.status === 'kitchen' && mins > 25);
  return (
    <motion.div layout layoutId={o.id} className={`a-ticket ${late ? 'late' : ''}`}>
      <div className="a-ticket-top">
        <Link to={`/admin/orders?o=${o.id}`} className="mono">{o.id}</Link>
        <span className={`a-ticket-age ${late ? 'a-red' : ''}`}>{mins}m</span>
      </div>
      <strong>{o.name}</strong>
      <ul>{o.lines.slice(0, 3).map((l) => <li key={l.key}><b>{l.qty}×</b> {l.name}</li>)}{o.lines.length > 3 && <li className="a-muted">+{o.lines.length - 3} more</li>}</ul>
      <div className="a-ticket-foot">
        <span>{o.fulfilment === 'delivery' ? o.zone : 'Pickup'}</span>
        {hasMsg && <span className="a-dot-msg" title="Customer sent a message">msg</span>}
        {next && <button className="a-btn a-btn--xs a-btn--ink" onClick={() => setOrderStatus(o.id, o.fulfilment === 'pickup' && next === 'out' ? 'done' : next)}>{o.fulfilment === 'pickup' && next === 'out' ? 'Collected' : action}</button>}
      </div>
    </motion.div>
  );
}
