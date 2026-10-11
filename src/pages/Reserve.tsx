import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BUSINESS, hoursFor, timeSlots } from '../data/menu';
import { normaliseKePhone } from '../data/payments';
import { PageHero } from '../components/Chrome';
import { postMessage } from '../store/admin';
import { Img } from '../components/Img';
import { Icon } from '../components/Drawings';

const OCCASIONS = ['Just dinner', 'Birthday', 'Date night', 'Business', 'Celebration'];
const SEATS = 12;

/** Round table with chairs that light up as the party grows. */
function TableDial({ guests, setGuests }: { guests: number; setGuests: (n: number) => void }) {
  return (
    <div className="table-dial">
      <div className="table-top">
        <span className="table-n">{guests}</span>
        <span className="table-l">{guests === 1 ? 'guest' : 'guests'}</span>
      </div>
      {Array.from({ length: SEATS }, (_, i) => {
        const a = (i / SEATS) * Math.PI * 2 - Math.PI / 2;
        return (
          <button
            key={i}
            className={`chair ${i < guests ? 'on' : ''}`}
            style={{ left: `${50 + Math.cos(a) * 44}%`, top: `${50 + Math.sin(a) * 44}%`, transform: `translate(-50%,-50%) rotate(${(a * 180) / Math.PI + 90}deg)` }}
            onClick={() => setGuests(i + 1)}
            aria-label={`${i + 1} guests`}
          />
        );
      })}
    </div>
  );
}

export default function Reserve() {
  const days = useMemo(() => Array.from({ length: 21 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d; }), []);
  const [guests, setGuests] = useState(2);
  const [day, setDay] = useState(0);
  const [time, setTime] = useState('');
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<string | null>(null);

  const date = days[day];
  const slots = timeSlots(date, 60);
  const open = !!hoursFor(date.getDay());

  const submit = () => {
    const e: Record<string, string> = {};
    if (!time) e.time = 'Pick a time';
    if (!name.trim()) e.name = 'Your name';
    if (!normaliseKePhone(phone)) e.phone = 'A Kenyan number we can reach';
    setErrs(e);
    if (Object.keys(e).length) return;
    const msg = `Hello Cha Bao! I'd like to reserve a table.\n\nName: ${name}\nGuests: ${guests}\nDate: ${date.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}\nTime: ${time}\nOccasion: ${occasion}\nPhone: ${phone}${note ? `\nNote: ${note}` : ''}`;
    const url = `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(msg)}`;
    const dateLabel = date.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' });
    postMessage({ kind: 'reservation', name, phone, subject: `Table for ${guests}, ${dateLabel} ${time}`, body: note || `${occasion} — no extra notes.`, meta: { Guests: String(guests), Date: dateLabel, Time: time, Occasion: occasion } });
    setSent(url);
    window.open(url, '_blank', 'noopener');
  };

  return (
    <>
      <PageHero eyebrow="Reservations" title={<>Pull up <em>a chair.</em></>} image="/images/site/reserve-hero.jpg" cn="席" />
      <section className="section reserve">
        <div className="wrap reserve-grid">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="ok" className="reserve-done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="done-check"><Icon.check /></div>
                <h2>Almost there, <em>{name.split(' ')[0]}.</em></h2>
                <p className="muted">We’ve opened WhatsApp with your request. Hit send and we’ll confirm your table shortly.</p>
                <a className="btn btn-fill" href={sent} target="_blank" rel="noreferrer"><img src="/images/brand/whatsapp.svg" alt="" className="btn-logo" /> Open WhatsApp again</a>
                <button className="link-underline" onClick={() => setSent(null)}>Make another booking</button>
              </motion.div>
            ) : (
              <motion.div key="form" className="reserve-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="reserve-row">
                  <div>
                    <p className="label">How many?</p>
                    <TableDial guests={guests} setGuests={setGuests} />
                    {guests >= SEATS && <p className="muted small center">Twelve or more? We’ll set up a private table — mention it in the note.</p>}
                  </div>
                  <div className="reserve-when">
                    <p className="label">Which day?</p>
                    <div className="day-strip">
                      {days.map((d, i) => (
                        <button key={i} className={`day ${day === i ? 'is-on' : ''} ${!hoursFor(d.getDay()) ? 'is-closed' : ''}`} onClick={() => { setDay(i); setTime(''); }}>
                          <span>{i === 0 ? 'Today' : d.toLocaleDateString('en-KE', { weekday: 'short' })}</span>
                          <strong>{d.getDate()}</strong>
                          <span>{d.toLocaleDateString('en-KE', { month: 'short' })}</span>
                        </button>
                      ))}
                    </div>
                    <p className="label">What time?</p>
                    <div className={`time-grid ${errs.time ? 'has-error' : ''}`}>
                      {open && slots.length ? slots.map((s) => (
                        <button key={s} className={time === s ? 'is-on' : ''} onClick={() => setTime(s)}>{s}</button>
                      )) : <span className="muted small">No tables left for this day — try another.</span>}
                    </div>
                    {errs.time && <span className="field-err">{errs.time}</span>}
                    <p className="label">Occasion</p>
                    <div className="occasion-row">
                      {OCCASIONS.map((o) => <button key={o} className={`when-chip ${occasion === o ? 'is-on' : ''}`} onClick={() => setOccasion(o)}>{o}</button>)}
                    </div>
                  </div>
                </div>
                <div className="field-grid">
                  <label className={`field ${errs.name ? 'has-error' : ''}`}><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />{errs.name && <span className="field-err">{errs.name}</span>}</label>
                  <label className={`field ${errs.phone ? 'has-error' : ''}`}><span>Phone</span><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="07xx xxx xxx" />{errs.phone && <span className="field-err">{errs.phone}</span>}</label>
                  <label className="field span-2"><span>Anything we should know?</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Allergies, high chair, a window seat…" /></label>
                </div>
                <button className="btn btn-fill btn-block" onClick={submit}>Request table for {guests} <Icon.arrow /></button>
              </motion.div>
            )}
          </AnimatePresence>
          <aside className="reserve-aside">
            <div className="arch"><Img src="/images/site/table-setting.jpg" alt="A set table under the lanterns" /></div>
            <ul className="aside-notes">
              <li><strong>Tables are held for 15 minutes.</strong> Running late? Message us.</li>
              <li><strong>Walk-ins welcome</strong> at the bar, whenever there’s space.</li>
              <li><strong>Private dining</strong> for groups of twelve and over.</li>
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
