import { useEffect, useState } from 'react';
import { listMessages, postMessage, type MessageKind } from '../store/admin';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getOrder } from '../store/cart';
import { BUSINESS, ksh } from '../data/menu';
import { Img, PayMark } from '../components/Img';
import { Icon, Steam } from '../components/Drawings';

const STAGES_DELIVERY = [
  { cn: '收', label: 'Order received', note: 'The kitchen has your ticket.' },
  { cn: '包', label: 'Folding & glazing', note: 'Dumplings pleated, glazes on.' },
  { cn: '蒸', label: 'In the steamer', note: 'Lids on, steam rising.' },
  { cn: '走', label: 'With your rider', note: 'Packed warm and on the road.' },
  { cn: '到', label: 'At your door', note: 'Enjoy — share everything.' },
];
const STAGES_PICKUP = [...STAGES_DELIVERY.slice(0, 3), { cn: '好', label: 'Ready at the pass', note: 'Ask for your order by name.' }];

export default function OrderPage() {
  const { id = '' } = useParams();
  const order = getOrder(id);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  if (!order) {
    return (
      <section className="section center" style={{ paddingTop: '10rem' }}>
        <h1>We can’t find that ticket.</h1>
        <p className="muted">Orders are kept on the device they were placed from.</p>
        <Link to="/menu" className="btn btn-fill" style={{ marginTop: '2rem' }}>Start a new order</Link>
      </section>
    );
  }

  const stages = order.fulfilment === 'delivery' ? STAGES_DELIVERY : STAGES_PICKUP;
  // Demo progression: one stage every 20s so the tracker visibly moves.
  const step = Math.min(stages.length - 1, Math.floor((now - order.createdAt) / 20000));
  const progress = step / (stages.length - 1);
  const methodLabel = { mpesa: 'M-PESA', card: 'Card', paypal: 'PayPal' }[order.method];

  return (
    <section className="order">
      <div className="wrap">
        <div className="order-head">
          <p className="eyebrow">Ticket #{order.id}</p>
          <h1>Thank you, <em>{order.name.split(' ')[0]}.</em></h1>
          <p className="muted">{order.fulfilment === 'delivery' ? `Arriving in about ${order.eta} minutes to ${order.zone}.` : `Ready for pickup in about ${order.eta} minutes.`} {order.when !== 'As soon as possible' && `Scheduled: ${order.when}.`}</p>
        </div>

        <div className="tracker">
          <div className="tracker-line"><motion.span animate={{ width: `${progress * 100}%` }} transition={{ duration: 1.2 }} /></div>
          <ol>
            {stages.map((s, i) => (
              <li key={s.label} className={i < step ? 'done' : i === step ? 'now' : ''}>
                <span className="tracker-dot">{s.cn}{i === step && <Steam className="tracker-steam" />}</span>
                <strong>{s.label}</strong>
                <span className="muted small">{s.note}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="order-grid">
          <div className="receipt receipt--flat">
            <h3>Your order</h3>
            <ul className="receipt-lines">
              {order.lines.map((l) => (
                <li key={l.key}>
                  <Img src={l.image} alt="" className="receipt-thumb" />
                  <div><strong>{l.qty} × {l.name}</strong>{l.meta && <span className="muted small">{l.meta}</span>}</div>
                  <span>{(l.unit * l.qty).toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <dl className="totals">
              <div><dt>Subtotal</dt><dd>{ksh(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="green"><dt>Discount</dt><dd>− {ksh(order.discount)}</dd></div>}
              <div><dt>{order.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}</dt><dd>{order.delivery ? ksh(order.delivery) : 'Free'}</dd></div>
              <div><dt>Tip</dt><dd>{ksh(order.tip)}</dd></div>
              <div className="grand"><dt>Paid</dt><dd>{ksh(order.total)}</dd></div>
            </dl>
          </div>
          <div className="order-side">
            <div className="order-card">
              <p className="eyebrow">Payment</p>
              <div className="order-pay"><PayMark name={order.method === 'card' ? 'visa' : order.method} label={methodLabel} /><span>{methodLabel}</span></div>
              <p className="mono">Ref {order.reference}</p>
            </div>
            {order.address && (
              <div className="order-card">
                <p className="eyebrow">Delivering to</p>
                <p>{order.address}</p>
                <p className="muted small">{order.zone}</p>
              </div>
            )}
            <OrderHelp orderId={order.id} name={order.name} phone={order.phone} />
            <Link to="/menu" className="link-underline">Order something else <Icon.arrow /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Lets the customer ask to cancel or ask about the order; lands in the admin inbox. */
function OrderHelp({ orderId, name, phone }: { orderId: string; name: string; phone: string }) {
  const [kind, setKind] = useState<MessageKind | null>(null);
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(() => listMessages().find((m) => m.orderId === orderId && m.status === 'open')?.kind ?? null);

  const submit = () => {
    if (!kind || !body.trim()) return;
    postMessage({ kind, orderId, name, phone, subject: kind === 'cancel' ? 'Cancel my order' : 'Question about my order', body: body.trim() });
    setSent(kind);
    setKind(null);
    setBody('');
  };

  return (
    <div className="order-card">
      <p className="eyebrow">Need to change something?</p>
      {sent && !kind ? (
        <p className="small">{sent === 'cancel' ? 'Cancellation request sent. If we can stop it in time we’ll refund you to the same account.' : 'Message sent. We’ll get back to you on ' + phone + '.'}</p>
      ) : kind ? (
        <div className="help-form">
          <label className="field"><span>{kind === 'cancel' ? 'Why are you cancelling?' : 'Your question'}</span>
            <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder={kind === 'cancel' ? 'e.g. Ordered twice by mistake' : 'e.g. Can I add another bao?'} autoFocus />
          </label>
          <div className="help-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setKind(null)}>Back</button>
            <button className="btn btn-fill btn-sm" onClick={submit} disabled={!body.trim()}>Send</button>
          </div>
        </div>
      ) : (
        <div className="help-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => { setKind('enquiry'); setBody(''); }}>Ask about order</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setKind('cancel'); setBody(''); }}>Cancel order</button>
        </div>
      )}
      <a className="link-underline small help-wa" href={`https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(`Hi Cha Bao, about order #${orderId}…`)}`} target="_blank" rel="noreferrer">Or WhatsApp us</a>
    </div>
  );
}
