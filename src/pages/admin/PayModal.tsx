import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { confirmMpesaB2C, normaliseKePhone, refundCard, refundPaypal, sendMpesaB2C } from '../../data/payments';
import { getOrder } from '../../store/cart';
import { REASON_LABEL, recordPayout, setMessageStatus, setOrderStatus, type Payout, type PayoutMethod, type PayoutReason } from '../../store/admin';
import { I, kes } from './ui';

export interface PayDraft {
  orderId?: string;
  messageId?: string;
  name?: string;
  phone?: string;
  method?: PayoutMethod;
  amount?: number;
  reason?: PayoutReason;
  /** Also mark the linked order cancelled once the money has gone out. */
  cancelOrder?: boolean;
}

const Ctx = createContext<(d?: PayDraft) => void>(() => {});
export const usePay = () => useContext(Ctx);

type Stage = 'form' | 'confirm' | 'sending' | 'accepted' | 'done' | 'error';

export function PayProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<PayDraft | null>(null);
  return (
    <Ctx.Provider value={(d) => setDraft(d ?? {})}>
      {children}
      <AnimatePresence>{draft && <PayModal key="pay" draft={draft} onClose={() => setDraft(null)} />}</AnimatePresence>
    </Ctx.Provider>
  );
}

function PayModal({ draft, onClose }: { draft: PayDraft; onClose: () => void }) {
  const order = draft.orderId ? getOrder(draft.orderId) : undefined;
  const alreadyBack = (order as { refunded?: number } | undefined)?.refunded ?? 0;
  const maxRefund = order ? order.total - alreadyBack : undefined;

  const [name, setName] = useState(draft.name ?? order?.name ?? '');
  const [phone, setPhone] = useState(draft.phone ?? order?.phone ?? '');
  const [method, setMethod] = useState<PayoutMethod>(draft.method ?? order?.method ?? 'mpesa');
  const [reason, setReason] = useState<PayoutReason>(draft.reason ?? (order ? 'refund' : 'goodwill'));
  const [amount, setAmount] = useState(String(draft.amount ?? (order && reason === 'refund' ? maxRefund : '') ?? ''));
  const [note, setNote] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [err, setErr] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Payout | null>(null);

  useEffect(() => {
    if (order && reason === 'refund') setAmount(String(maxRefund));
  }, [reason]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && (stage === 'form' || stage === 'confirm' || stage === 'done' || stage === 'error')) onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [stage, onClose]);

  const amt = Math.round(Number(amount) || 0);
  const canOriginal = !!order && method === order.method;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Who is being paid?';
    if (method === 'mpesa' && !normaliseKePhone(phone)) e.phone = 'Needs a Safaricom number, e.g. 0712 345 678';
    if (method !== 'mpesa' && !canOriginal) e.method = 'Card and PayPal can only refund the original payment on an order';
    if (amt <= 0) e.amount = 'Enter an amount';
    else if (amt > 150_000) e.amount = 'M-PESA B2C limit is KSh 150,000 per transaction';
    else if (maxRefund !== undefined && (reason === 'refund' || reason === 'partial') && amt > maxRefund) e.amount = `Only KSh ${kes(maxRefund)} left to refund on this order`;
    setErr(e);
    return !Object.keys(e).length;
  };

  const send = async () => {
    setStage('sending');
    try {
      let reference: string;
      if (method === 'mpesa') {
        const { conversationId } = await sendMpesaB2C(normaliseKePhone(phone)!, amt);
        setStage('accepted');
        reference = (await confirmMpesaB2C(conversationId)).receipt;
      } else if (method === 'card') {
        reference = (await refundCard(order!.reference, amt)).receipt;
      } else {
        reference = (await refundPaypal(order!.reference, amt)).receipt;
      }
      const p = recordPayout({ name, phone, method, amount: amt, reason, note: note || undefined, orderId: order?.id, messageId: draft.messageId, reference });
      if (draft.cancelOrder && order) setOrderStatus(order.id, 'cancelled');
      if (draft.messageId) setMessageStatus(draft.messageId, 'resolved');
      setResult(p);
      setStage('done');
    } catch {
      setStage('error');
    }
  };

  const methodName = { mpesa: 'M-PESA', card: 'Card refund', paypal: 'PayPal refund' }[method];
  const busy = stage === 'sending' || stage === 'accepted';

  return (
    <motion.div className="a-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <motion.div className="a-modal" role="dialog" aria-modal aria-label="Send payment" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}>
        <header className="a-modal-head">
          <div>
            <span className="a-overline">{order ? `Order ${order.id}` : 'Direct payment'}</span>
            <h2>{stage === 'done' ? 'Payment sent' : 'Pay a customer'}</h2>
          </div>
          {!busy && <button className="a-iconbtn" onClick={onClose} aria-label="Close"><I n="x" /></button>}
        </header>

        {stage === 'form' && (
          <div className="a-modal-body">
            {order && (
              <div className="a-orderstrip">
                <span>Paid <b className="mono">KSh {kes(order.total)}</b> via {order.method === 'mpesa' ? 'M-PESA' : order.method === 'card' ? 'card' : 'PayPal'}</span>
                <span className="mono">{order.reference}</span>
                {alreadyBack > 0 && <span className="a-warn">KSh {kes(alreadyBack)} already refunded</span>}
              </div>
            )}

            <div className="a-seg" role="radiogroup" aria-label="Reason">
              {(Object.keys(REASON_LABEL) as PayoutReason[]).filter((r) => order || (r !== 'refund' && r !== 'partial')).map((r) => (
                <button key={r} role="radio" aria-checked={reason === r} className={reason === r ? 'on' : ''} onClick={() => setReason(r)}>{REASON_LABEL[r]}</button>
              ))}
            </div>

            <div className="a-amount">
              <label htmlFor="pay-amt">Amount</label>
              <div className={`a-amount-row ${err.amount ? 'bad' : ''}`}>
                <span>KSh</span>
                <input id="pay-amt" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))} placeholder="0" readOnly={reason === 'refund' && !!order} autoFocus={!order} />
              </div>
              {err.amount && <em className="a-err">{err.amount}</em>}
              {reason === 'partial' && maxRefund !== undefined && (
                <div className="a-quick">{[0.25, 0.5].map((f) => <button key={f} onClick={() => setAmount(String(Math.round(maxRefund * f)))}>{f * 100}% · {kes(Math.round(maxRefund * f))}</button>)}</div>
              )}
            </div>

            <div className="a-fields">
              <label className="a-field"><span>Customer</span><input value={name} onChange={(e) => setName(e.target.value)} />{err.name && <em className="a-err">{err.name}</em>}</label>
              <label className="a-field"><span>M-PESA number</span><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" disabled={method !== 'mpesa'} />{err.phone && <em className="a-err">{err.phone}</em>}</label>
            </div>

            <div className="a-methods">
              {(['mpesa', 'card', 'paypal'] as PayoutMethod[]).map((m) => (
                <button key={m} className={`a-method ${method === m ? 'on' : ''}`} onClick={() => setMethod(m)} disabled={m !== 'mpesa' && !(order && order.method === m)}>
                  <strong>{{ mpesa: 'M-PESA', card: 'Card', paypal: 'PayPal' }[m]}</strong>
                  <span>{m === 'mpesa' ? 'Send to phone (B2C)' : order && order.method === m ? 'Back to original payment' : 'Only for orders paid this way'}</span>
                </button>
              ))}
            </div>
            {err.method && <em className="a-err">{err.method}</em>}

            <label className="a-field"><span>Note for the records <i>(optional)</i></span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Cucumber salad missing" /></label>

            <footer className="a-modal-foot">
              <button className="a-btn" onClick={onClose}>Cancel</button>
              <button className="a-btn a-btn--ink" onClick={() => validate() && setStage('confirm')}>Review <I n="arrow" size={16} /></button>
            </footer>
          </div>
        )}

        {stage === 'confirm' && (
          <div className="a-modal-body">
            <div className="a-receipt">
              <div className="a-receipt-amt"><span>KSh</span>{kes(amt)}</div>
              <dl>
                <dt>To</dt><dd>{name}</dd>
                <dt>Via</dt><dd>{methodName}{method === 'mpesa' ? ` · ${phone}` : ''}</dd>
                <dt>Reason</dt><dd>{REASON_LABEL[reason]}</dd>
                {order && <><dt>Order</dt><dd className="mono">{order.id}</dd></>}
                {draft.cancelOrder && <><dt>Also</dt><dd>Mark order cancelled</dd></>}
                {note && <><dt>Note</dt><dd>{note}</dd></>}
              </dl>
              <p className="a-fine">This sends real money once payments are live. It can’t be undone from here.</p>
            </div>
            <footer className="a-modal-foot">
              <button className="a-btn" onClick={() => setStage('form')}><I n="back" size={16} /> Edit</button>
              <button className="a-btn a-btn--red" onClick={send}>Send KSh {kes(amt)}</button>
            </footer>
          </div>
        )}

        {busy && (
          <div className="a-modal-body a-progress">
            <ol>
              <li className="done"><i /><span>Request created</span></li>
              <li className={stage === 'sending' ? 'now' : 'done'}><i /><span>{method === 'mpesa' ? 'Sending to Safaricom' : 'Contacting processor'}</span></li>
              <li className={stage === 'accepted' ? 'now' : ''}><i /><span>{method === 'mpesa' ? `Crediting ${phone}` : 'Refund issued'}</span></li>
            </ol>
          </div>
        )}

        {stage === 'done' && result && (
          <div className="a-modal-body">
            <div className="a-receipt a-receipt--ok">
              <div className="a-stamp"><I n="check" size={22} /> Sent</div>
              <div className="a-receipt-amt"><span>KSh</span>{kes(result.amount)}</div>
              <dl>
                <dt>To</dt><dd>{result.name}</dd>
                <dt>Receipt</dt><dd className="mono">{result.reference}</dd>
                <dt>Time</dt><dd>{new Date(result.at).toLocaleString('en-KE')}</dd>
              </dl>
            </div>
            <footer className="a-modal-foot"><button className="a-btn a-btn--ink" onClick={onClose}>Done</button></footer>
          </div>
        )}

        {stage === 'error' && (
          <div className="a-modal-body">
            <p className="a-err">The payment didn’t go through. Nothing was recorded. Try again in a moment.</p>
            <footer className="a-modal-foot"><button className="a-btn" onClick={() => setStage('confirm')}>Try again</button></footer>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
