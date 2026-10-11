import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { KIND_LABEL, replyToMessage, setMessageStatus, setOrderStatus, useAdminData, type AdminOrder, type Message, type MessageKind } from '../../store/admin';
import { usePay } from './PayModal';
import { ago, clock, Empty, I, KindTag, kes, StatusPill } from './ui';

const KINDS = Object.keys(KIND_LABEL) as MessageKind[];
type View = 'open' | 'resolved' | 'all';

const TEMPLATES: Record<MessageKind, { label: string; body: (m: Message) => string }[]> = {
  cancel: [
    { label: 'Too late to cancel', body: (m) => `Hi ${first(m)}, sorry — your order is already on its way, so we can’t cancel it now. Message us if anything isn’t right when it arrives.` },
  ],
  enquiry: [
    { label: 'Added to order', body: (m) => `Hi ${first(m)}, done — we’ve added that to your order. We’ll send an M-PESA request for the difference.` },
    { label: 'Allergen answer', body: (m) => `Hi ${first(m)}, thanks for checking. I’ve asked the kitchen and will confirm in a few minutes.` },
  ],
  reservation: [
    { label: 'Confirm booking', body: (m) => `Hi ${first(m)}, you’re booked${m.meta?.Guests ? ` for ${m.meta.Guests}` : ''}${m.meta?.Date ? `, ${m.meta.Date}` : ''}${m.meta?.Time ? ` at ${m.meta.Time}` : ''}. See you then!` },
    { label: 'Fully booked', body: (m) => `Hi ${first(m)}, sorry, we’re full at that time. Could you do an hour earlier or later?` },
  ],
  delivery: [
    { label: 'Rider calling', body: (m) => `Hi ${first(m)}, sorry about that. Your rider will call you in the next couple of minutes.` },
    { label: 'Refunding item', body: (m) => `Hi ${first(m)}, really sorry. We’ve refunded the missing item to your M-PESA.` },
  ],
  feedback: [{ label: 'Thank you', body: (m) => `Thank you ${first(m)}! Passing this on to the kitchen.` }],
};
const first = (m: Message) => m.name.split(' ')[0];

export default function Inbox() {
  const { messages, orders } = useAdminData();
  const [params, setParams] = useSearchParams();
  const kind = (params.get('f') as MessageKind | null) ?? null;
  const view = (params.get('v') as View) || 'open';
  const sel = params.get('m');
  const set = (k: string, v: string | null) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p, { replace: true }); };

  const inView = messages.filter((m) => view === 'all' || m.status === view);
  const shown = inView.filter((m) => !kind || m.kind === kind);
  const current = messages.find((m) => m.id === sel);

  return (
    <div className="a-page a-page--inbox">
      <header className="a-head">
        <div><span className="a-overline">{messages.filter((m) => m.status === 'open').length} open</span><h1>Inbox</h1></div>
        <div className="a-seg a-seg--sm">
          {(['open', 'resolved', 'all'] as View[]).map((v) => <button key={v} className={view === v ? 'on' : ''} onClick={() => set('v', v === 'open' ? null : v)}>{v[0].toUpperCase() + v.slice(1)}</button>)}
        </div>
      </header>

      <div className={`a-inbox ${current ? 'has-sel' : ''}`}>
        <nav className="a-filters" aria-label="Message type">
          <button className={!kind ? 'on' : ''} onClick={() => set('f', null)}><span>Everything</span><b>{inView.length}</b></button>
          {KINDS.map((k) => {
            const n = inView.filter((m) => m.kind === k).length;
            return <button key={k} className={`${kind === k ? 'on' : ''} a-f--${k}`} onClick={() => set('f', k)}><i /><span>{KIND_LABEL[k]}</span><b>{n}</b></button>;
          })}
        </nav>

        <div className="a-list">
          {shown.map((m) => {
            const lastE = m.thread[m.thread.length - 1];
            return (
              <button key={m.id} className={`a-msg ${sel === m.id ? 'sel' : ''} ${m.status === 'resolved' ? 'done' : ''} ${lastE.from === 'customer' && m.status === 'open' ? 'unread' : ''}`} onClick={() => set('m', m.id)}>
                <div className="a-msg-top"><KindTag k={m.kind} /><span className="mono">{ago(lastE.at)}</span></div>
                <strong>{m.name}</strong>
                <span className="a-msg-subj">{m.subject}</span>
                <span className="a-msg-prev">{lastE.from === 'staff' ? 'You: ' : ''}{lastE.body}</span>
              </button>
            );
          })}
          {!shown.length && <Empty title={view === 'open' ? 'All caught up' : 'Nothing here'}>{view === 'open' ? 'No open messages of this type.' : undefined}</Empty>}
        </div>

        <AnimatePresence mode="wait">
          {current ? <Thread key={current.id} m={current} order={orders.find((o) => o.id === current.orderId)} onBack={() => set('m', null)} /> : <div className="a-thread a-thread--empty"><Empty title="Pick a message">Cancellations come with a one-click cancel &amp; refund.</Empty></div>}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Thread({ m, order, onBack }: { m: Message; order?: AdminOrder; onBack: () => void }) {
  const pay = usePay();
  const [draft, setDraft] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [m.thread.length]);
  const wa = useMemo(() => `https://wa.me/${m.phone.replace(/\D/g, '').replace(/^0/, '254')}?text=${encodeURIComponent(draft || `Hi ${first(m)}, `)}`, [m, draft]);

  const send = () => { if (!draft.trim()) return; replyToMessage(m.id, draft.trim()); setDraft(''); };
  const left = order ? order.total - order.refunded : 0;

  return (
    <motion.section className="a-thread" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <header className="a-thread-head">
        <button className="a-iconbtn a-only-sm" onClick={onBack} aria-label="Back"><I n="back" /></button>
        <div>
          <KindTag k={m.kind} />
          <h2>{m.subject}</h2>
          <p className="a-muted">{m.name} · <a className="a-link" href={`tel:${m.phone}`}>{m.phone}</a> · {new Date(m.createdAt).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        {m.status === 'open'
          ? <button className="a-btn a-btn--sm" onClick={() => setMessageStatus(m.id, 'resolved')}><I n="check" size={14} /> Resolve</button>
          : <button className="a-btn a-btn--sm" onClick={() => setMessageStatus(m.id, 'open')}>Reopen</button>}
      </header>

      {/* Context: the order this is about, with the actions that fit the message type */}
      {order && (
        <div className={`a-context a-context--${m.kind}`}>
          <div className="a-context-main">
            <Link to={`/admin/orders?o=${order.id}`} className="mono a-link">{order.id}</Link>
            <StatusPill s={order.status} />
            <span className="a-muted">{order.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}</span>
            <span className="mono">KSh {kes(order.total)}{order.refunded > 0 && <em className="a-red"> · −{kes(order.refunded)}</em>}</span>
          </div>
          <div className="a-context-actions">
            {m.kind === 'cancel' && order.status !== 'cancelled' && left > 0 && (
              <button className="a-btn a-btn--red a-btn--sm" onClick={() => pay({ orderId: order.id, messageId: m.id, reason: 'refund', cancelOrder: true })}>Approve · cancel &amp; refund KSh {kes(left)}</button>
            )}
            {m.kind === 'cancel' && order.status !== 'cancelled' && left <= 0 && (
              <button className="a-btn a-btn--sm" onClick={() => { setOrderStatus(order.id, 'cancelled'); setMessageStatus(m.id, 'resolved'); }}>Mark cancelled</button>
            )}
            {(m.kind === 'delivery' || m.kind === 'feedback' || m.kind === 'enquiry') && left > 0 && (
              <button className="a-btn a-btn--sm" onClick={() => pay({ orderId: order.id, messageId: m.id, reason: 'partial' })}>Partial refund</button>
            )}
            {order.status === 'cancelled' && <span className="a-muted small">Order cancelled{order.refunded ? `, KSh ${kes(order.refunded)} refunded` : ''}.</span>}
          </div>
        </div>
      )}
      {m.meta && <dl className="a-meta">{Object.entries(m.meta).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}

      <div className="a-convo">
        {m.thread.map((e, i) => (
          <div key={i} className={`a-bubble a-bubble--${e.from}`}>
            <p>{e.body}</p>
            <span>{e.from === 'staff' ? 'You' : first(m)} · {clock(e.at)}</span>
          </div>
        ))}
        <div ref={end} />
      </div>

      <div className="a-compose">
        <div className="a-templates">
          {TEMPLATES[m.kind].map((t) => <button key={t.label} onClick={() => setDraft(t.body(m))}>{t.label}</button>)}
        </div>
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Reply to ${first(m)}…`} rows={3} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }} />
        <div className="a-compose-foot">
          <a className="a-btn a-btn--sm" href={wa} target="_blank" rel="noreferrer">WhatsApp <I n="ext" size={14} /></a>
          <button className="a-btn a-btn--ink a-btn--sm" onClick={send} disabled={!draft.trim()}><I n="reply" size={14} /> Save reply</button>
        </div>
      </div>
    </motion.section>
  );
}
