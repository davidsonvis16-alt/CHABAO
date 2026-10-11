import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { PROMOS, ZONES, ksh, timeSlots } from '../data/menu';
import { saveOrder, useCart, type Order } from '../store/cart';
import { DEMO_MODE, cardBrand, chargeCard, expiryValid, luhn, normaliseKePhone, paypalCheckout, pollStkStatus, requestStkPush } from '../data/payments';
import { Img, Logo, PayMark } from '../components/Img';
import { Icon } from '../components/Drawings';

type Method = 'mpesa' | 'card' | 'paypal';
type PayState = { stage: 'idle' } | { stage: 'stk'; phase: 'sending' | 'waiting' } | { stage: 'card' } | { stage: 'paypal' } | { stage: 'done' };

const TIPS = [0, 5, 10, 15];

export default function Checkout() {
  const { lines, subtotal, clear, setQty } = useCart();
  const nav = useNavigate();

  const [fulfil, setFulfil] = useState<'delivery' | 'pickup'>('delivery');
  const [zone, setZone] = useState(ZONES[0].id);
  const [address, setAddress] = useState('');
  const [when, setWhen] = useState<'asap' | string>('asap');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tip, setTip] = useState(10);
  const [code, setCode] = useState('');
  const [promo, setPromo] = useState<string | null>(null);
  const [promoErr, setPromoErr] = useState('');
  const [method, setMethod] = useState<Method>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [card, setCard] = useState({ number: '', exp: '', cvc: '', name: '' });
  const [flip, setFlip] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pay, setPay] = useState<PayState>({ stage: 'idle' });
  const [countdown, setCountdown] = useState(60);

  const z = ZONES.find((x) => x.id === zone)!;
  const delivery = fulfil === 'delivery' ? z.fee : 0;
  const discount = promo ? Math.round(subtotal * PROMOS[promo]) : 0;
  const tipAmt = Math.round(((subtotal - discount) * tip) / 100);
  const total = subtotal - discount + delivery + tipAmt;
  const slots = useMemo(() => timeSlots(new Date(), 45), []);
  const brand = cardBrand(card.number);

  useEffect(() => { if (!phone) return; if (!mpesaPhone) setMpesaPhone(phone); }, [phone]); // eslint-disable-line
  useEffect(() => {
    if (pay.stage !== 'stk' || pay.phase !== 'waiting') return;
    setCountdown(60);
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [pay]);

  const applyPromo = () => {
    const c = code.trim().toUpperCase();
    if (PROMOS[c]) { setPromo(c); setPromoErr(''); } else { setPromo(null); setPromoErr('That code isn’t on the menu.'); }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Who’s eating?';
    if (!normaliseKePhone(phone)) e.phone = 'Enter a Kenyan number, e.g. 0712 345 678';
    if (email && !/^\S+@\S+\.\S+$/.test(email)) e.email = 'That email looks off';
    if (fulfil === 'delivery' && address.trim().length < 6) e.address = 'Building, street and any landmark, please';
    if (method === 'mpesa' && !normaliseKePhone(mpesaPhone)) e.mpesa = 'M-PESA number must be a Safaricom line';
    if (method === 'card') {
      if (!luhn(card.number)) e.cardNumber = 'Card number isn’t valid';
      if (!expiryValid(card.exp)) e.cardExp = 'MM / YY';
      if (!/^\d{3,4}$/.test(card.cvc)) e.cardCvc = '3–4 digits';
      if (!card.name.trim()) e.cardName = 'Name on card';
    }
    setErrors(e);
    if (Object.keys(e).length) {
      document.querySelector('.has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return Object.keys(e).length === 0;
  };

  const finish = (reference: string) => {
    const id = 'CB' + Date.now().toString(36).toUpperCase().slice(-6);
    const order: Order = {
      id, createdAt: Date.now(), lines, subtotal, delivery, discount, tip: tipAmt, total, fulfilment: fulfil,
      zone: fulfil === 'delivery' ? z.name : undefined, eta: fulfil === 'delivery' ? z.eta : '20–25',
      address: fulfil === 'delivery' ? address : undefined, when: when === 'asap' ? 'As soon as possible' : `Today at ${when}`,
      name, phone, method, reference,
    };
    saveOrder(order);
    setPay({ stage: 'done' });
    setTimeout(() => { clear(); nav(`/order/${id}`); }, 900);
  };

  const placeOrder = async () => {
    if (!validate()) return;
    if (method === 'mpesa') {
      setPay({ stage: 'stk', phase: 'sending' });
      const { checkoutId } = await requestStkPush(normaliseKePhone(mpesaPhone)!, total);
      setPay({ stage: 'stk', phase: 'waiting' });
      const r = await pollStkStatus(checkoutId);
      if (r.status === 'paid') finish(r.receipt!);
    } else if (method === 'card') {
      setPay({ stage: 'card' });
      const r = await chargeCard(card, total);
      finish(r.reference);
    } else {
      setPay({ stage: 'paypal' });
      const r = await paypalCheckout(total);
      finish(r.reference);
    }
  };

  if (!lines.length && pay.stage === 'idle') {
    return (
      <section className="section center checkout-empty">
        <div className="empty-plate big"><span>空</span></div>
        <h1>Your table is empty.</h1>
        <p className="muted">Add a few plates and come back.</p>
        <Link to="/menu" className="btn btn-fill">Go to the menu <Icon.arrow /></Link>
      </section>
    );
  }

  const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d; };
  const err = (k: string) => errors[k] && <span className="field-err">{errors[k]}</span>;

  return (
    <section className="checkout">
      <div className="wrap checkout-grid">
        <div className="checkout-main">
          <Link to="/menu" className="crumb"><Icon.back /> Keep ordering</Link>
          <h1 className="checkout-title">Checkout</h1>
          {DEMO_MODE && <p className="demo-flag"><span>Demo</span> Payments are simulated on this preview — no money moves.</p>}

          {/* STEP 1 */}
          <div className="step">
            <div className="step-head"><span className="step-n">一</span><h2>How would you like it?</h2></div>
            <LayoutGroup id="fulfil">
              <div className="segmented">
                {(['delivery', 'pickup'] as const).map((f) => (
                  <button key={f} className={fulfil === f ? 'is-on' : ''} onClick={() => setFulfil(f)}>
                    {fulfil === f && <motion.span layoutId="seg" className="seg-pill" />}
                    <span>{f === 'delivery' ? 'Delivery' : 'Pick up at Cha Bao'}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
            <AnimatePresence initial={false}>
              {fulfil === 'delivery' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="collapse">
                  <p className="label">Area</p>
                  <div className="zone-chips">
                    {ZONES.map((x) => (
                      <button key={x.id} className={zone === x.id ? 'is-on' : ''} onClick={() => setZone(x.id)}>
                        {x.name}<span>{ksh(x.fee)} · {x.eta}′</span>
                      </button>
                    ))}
                  </div>
                  <label className={`field ${errors.address ? 'has-error' : ''}`}>
                    <span>Address & directions</span>
                    <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Apartment, street, gate colour, landmark…" />
                    {err('address')}
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
            <p className="label">When</p>
            <div className="when-row">
              <button className={`when-chip ${when === 'asap' ? 'is-on' : ''}`} onClick={() => setWhen('asap')}>As soon as possible</button>
              {slots.slice(0, 8).map((s) => (
                <button key={s} className={`when-chip ${when === s ? 'is-on' : ''}`} onClick={() => setWhen(s)}>{s}</button>
              ))}
              {!slots.length && <span className="muted small">Kitchen’s closed for today — we’ll prepare it first thing at opening.</span>}
            </div>
          </div>

          {/* STEP 2 */}
          <div className="step">
            <div className="step-head"><span className="step-n">二</span><h2>Who’s it for?</h2></div>
            <div className="field-grid">
              <label className={`field ${errors.name ? 'has-error' : ''}`}><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />{err('name')}</label>
              <label className={`field ${errors.phone ? 'has-error' : ''}`}><span>Phone</span><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="07xx xxx xxx" />{err('phone')}</label>
              <label className={`field span-2 ${errors.email ? 'has-error' : ''}`}><span>Email for receipt <em className="muted">(optional)</em></span><input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" autoComplete="email" />{err('email')}</label>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="step">
            <div className="step-head"><span className="step-n">三</span><h2>Pay</h2></div>
            <div className="methods" role="radiogroup">
              {([
                ['mpesa', 'M-PESA', 'Pay from your phone'],
                ['card', 'Card', 'Visa · Mastercard'],
                ['paypal', 'PayPal', 'International cards'],
              ] as [Method, string, string][]).map(([m, l, s]) => (
                <button key={m} role="radio" aria-checked={method === m} className={`method ${method === m ? 'is-on' : ''}`} onClick={() => setMethod(m)}>
                  <span className="method-radio" />
                  <span className="method-logos">
                    {m === 'mpesa' && <PayMark name="mpesa" label="M-PESA" />}
                    {m === 'card' && <><PayMark name="visa" label="Visa" /><PayMark name="mastercard" label="Mastercard" /></>}
                    {m === 'paypal' && <PayMark name="paypal" label="PayPal" />}
                  </span>
                  <span className="method-text"><strong>{l}</strong><span className="muted small">{s}</span></span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {method === 'mpesa' && (
                <motion.div key="m" className="pay-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <label className={`field ${errors.mpesa ? 'has-error' : ''}`}>
                    <span>M-PESA number</span>
                    <div className="prefix-input"><span>+254</span><input value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} inputMode="tel" placeholder="7xx xxx xxx" /></div>
                    {err('mpesa')}
                  </label>
                  <p className="muted small">You’ll get a prompt on this phone to enter your M-PESA PIN. Keep it unlocked.</p>
                </motion.div>
              )}
              {method === 'card' && (
                <motion.div key="c" className="pay-panel card-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="card-3d">
                    <motion.div className="card-inner" animate={{ rotateY: flip ? 180 : 0 }} transition={{ duration: 0.7, ease: [0.3, 0.7, 0.2, 1] }}>
                      <div className="card-face front">
                        <div className="card-top"><span className="card-chip" />{brand ? <PayMark name={brand} label={brand} /> : <span className="card-brand-ph">CHΛ BΛO</span>}</div>
                        <div className="card-num">{(fmtCard(card.number) || '•••• •••• •••• ••••').padEnd(19, '•')}</div>
                        <div className="card-bot"><span>{card.name || 'YOUR NAME'}</span><span>{card.exp || 'MM / YY'}</span></div>
                      </div>
                      <div className="card-face back">
                        <div className="card-stripe" />
                        <div className="card-cvc"><span>{card.cvc ? '•'.repeat(card.cvc.length) : 'CVC'}</span></div>
                      </div>
                    </motion.div>
                  </div>
                  <div className="field-grid">
                    <label className={`field span-2 ${errors.cardNumber ? 'has-error' : ''}`}><span>Card number</span><input value={fmtCard(card.number)} onChange={(e) => setCard({ ...card, number: e.target.value })} inputMode="numeric" autoComplete="cc-number" placeholder="1234 1234 1234 1234" />{err('cardNumber')}</label>
                    <label className={`field ${errors.cardExp ? 'has-error' : ''}`}><span>Expiry</span><input value={card.exp} onChange={(e) => setCard({ ...card, exp: fmtExp(e.target.value) })} inputMode="numeric" autoComplete="cc-exp" placeholder="MM / YY" />{err('cardExp')}</label>
                    <label className={`field ${errors.cardCvc ? 'has-error' : ''}`}><span>CVC</span><input value={card.cvc} onFocus={() => setFlip(true)} onBlur={() => setFlip(false)} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} inputMode="numeric" autoComplete="cc-csc" placeholder="123" />{err('cardCvc')}</label>
                    <label className={`field span-2 ${errors.cardName ? 'has-error' : ''}`}><span>Name on card</span><input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })} autoComplete="cc-name" />{err('cardName')}</label>
                  </div>
                </motion.div>
              )}
              {method === 'paypal' && (
                <motion.div key="p" className="pay-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <p className="muted">You’ll be taken to PayPal to approve the payment, then brought back here. Charged in KSh at PayPal’s rate.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button className={`btn btn-block btn-pay ${method === 'paypal' ? 'btn-paypal' : 'btn-fill'}`} onClick={placeOrder} disabled={pay.stage !== 'idle'}>
              {method === 'paypal' ? <>Pay with <PayMark name="paypal" label="PayPal" /></> : <><Icon.lock /> Pay {ksh(total)}</>}
            </button>
            <p className="muted small center">By paying you agree to our terms. Your order goes straight to the kitchen.</p>
          </div>
        </div>

        {/* RECEIPT */}
        <aside className="receipt-wrap">
          <div className="receipt">
            <div className="receipt-head"><Logo small /><span className="muted small">Order ticket</span></div>
            <ul className="receipt-lines">
              {lines.map((l) => (
                <li key={l.key}>
                  <Img src={l.image} alt="" className="receipt-thumb" />
                  <div><strong>{l.name}</strong>{l.meta && <span className="muted small">{l.meta}</span>}
                    <span className="receipt-qty"><button onClick={() => setQty(l.key, l.qty - 1)} aria-label="Less">−</button>{l.qty}<button onClick={() => setQty(l.key, l.qty + 1)} aria-label="More">+</button></span>
                  </div>
                  <span>{(l.unit * l.qty).toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <div className="promo">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Promo code" aria-label="Promo code" onKeyDown={(e) => e.key === 'Enter' && applyPromo()} />
              <button onClick={applyPromo}>Apply</button>
            </div>
            {promoErr && <p className="field-err">{promoErr}</p>}
            {promo && <p className="promo-ok"><Icon.check /> {promo} applied</p>}
            <p className="label">Tip the team</p>
            <div className="tips">
              {TIPS.map((t) => <button key={t} className={tip === t ? 'is-on' : ''} onClick={() => setTip(t)}>{t ? `${t}%` : 'No tip'}</button>)}
            </div>
            <dl className="totals">
              <div><dt>Subtotal</dt><dd>{ksh(subtotal)}</dd></div>
              {discount > 0 && <div className="green"><dt>Discount</dt><dd>− {ksh(discount)}</dd></div>}
              <div><dt>{fulfil === 'delivery' ? `Delivery · ${z.name}` : 'Pickup'}</dt><dd>{delivery ? ksh(delivery) : 'Free'}</dd></div>
              <div><dt>Tip</dt><dd>{ksh(tipAmt)}</dd></div>
              <div className="grand"><dt>Total</dt><dd>{ksh(total)}</dd></div>
            </dl>
            <p className="receipt-foot">谢谢 · thank you</p>
          </div>
        </aside>
      </div>

      {/* PAYMENT OVERLAYS */}
      <AnimatePresence>
        {pay.stage !== 'idle' && (
          <motion.div className="pay-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="pay-modal" initial={{ scale: 0.92, y: 30 }} animate={{ scale: 1, y: 0 }}>
              {pay.stage === 'stk' && (
                <>
                  <PayMark name="mpesa" label="M-PESA" />
                  <div className="ring-wrap">
                    <svg viewBox="0 0 120 120" className="ring">
                      <circle cx="60" cy="60" r="52" className="ring-track" />
                      <circle cx="60" cy="60" r="52" className="ring-bar" strokeDasharray={327} strokeDashoffset={pay.phase === 'sending' ? 327 : 327 * (1 - countdown / 60)} transform="rotate(-90 60 60)" />
                    </svg>
                    <span className="ring-num">{pay.phase === 'sending' ? '…' : countdown}</span>
                  </div>
                  <h3>{pay.phase === 'sending' ? 'Sending the prompt…' : 'Check your phone'}</h3>
                  <p className="muted">{pay.phase === 'sending' ? `Requesting ${ksh(total)} from +${normaliseKePhone(mpesaPhone)}` : `Enter your M-PESA PIN to pay ${ksh(total)} to Cha Bao.`}</p>
                  <button className="link-underline" onClick={() => setPay({ stage: 'idle' })}>Cancel</button>
                </>
              )}
              {pay.stage === 'card' && (
                <>
                  <div className="spinner" />
                  <h3>Authorising your card…</h3>
                  <p className="muted">Your bank may ask you to confirm.</p>
                </>
              )}
              {pay.stage === 'paypal' && (
                <>
                  <PayMark name="paypal" label="PayPal" />
                  <div className="spinner" />
                  <h3>Waiting for PayPal…</h3>
                  <p className="muted">Approve the payment in the PayPal window.</p>
                </>
              )}
              {pay.stage === 'done' && (
                <>
                  <motion.div className="done-check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}><Icon.check /></motion.div>
                  <h3>Paid. To the kitchen!</h3>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
