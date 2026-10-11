import { useState } from 'react';
import { motion } from 'framer-motion';
import { TEAS, ksh, type Tea } from '../data/menu';
import { useCart } from '../store/cart';
import { PageHero, Reveal } from '../components/Chrome';
import { Img } from '../components/Img';
import { Icon } from '../components/Drawings';

/** Steep dial — temperature as an arc, time as a sweep, drawn per tea. */
function SteepDial({ tea }: { tea: Tea }) {
  const r = 46, c = 2 * Math.PI * r;
  const tempFrac = (tea.tempC - 60) / 40; // 60–100°C
  const timeFrac = tea.steepSec / 240;
  return (
    <svg className="dial" viewBox="0 0 120 120" aria-label={`${tea.tempC}°C for ${tea.steepSec} seconds`}>
      <circle cx="60" cy="60" r={r} className="dial-track" />
      <motion.circle cx="60" cy="60" r={r} className="dial-temp" strokeDasharray={c} initial={{ strokeDashoffset: c }} whileInView={{ strokeDashoffset: c * (1 - tempFrac) }} viewport={{ once: true }} transition={{ duration: 1.4 }} transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r={34} className="dial-track" />
      <motion.circle cx="60" cy="60" r={34} className="dial-time" strokeDasharray={2 * Math.PI * 34} initial={{ strokeDashoffset: 2 * Math.PI * 34 }} whileInView={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - timeFrac) }} viewport={{ once: true }} transition={{ duration: 1.4, delay: 0.2 }} transform="rotate(-90 60 60)" />
      <text x="60" y="58" className="dial-big">{tea.tempC}°</text>
      <text x="60" y="74" className="dial-small">{tea.steepSec >= 60 ? `${Math.floor(tea.steepSec / 60)}m${tea.steepSec % 60 ? ` ${tea.steepSec % 60}s` : ''}` : `${tea.steepSec}s`}</text>
    </svg>
  );
}

function TeaCard({ tea, i }: { tea: Tea; i: number }) {
  const [pack, setPack] = useState(0);
  const { add } = useCart();
  const p = tea.packs[pack];
  return (
    <Reveal delay={i * 0.08} className={`tin tin-${i % 4}`}>
      <div className="tin-top"><span className="tin-cn">{tea.cn}</span></div>
      <div className="tin-img"><Img src={tea.image} alt={`${tea.name} loose leaf`} /></div>
      <div className="tin-body">
        <p className="eyebrow">{tea.origin}</p>
        <h3>{tea.name}</h3>
        <p className="muted">{tea.notes}</p>
        <div className="tin-row">
          <SteepDial tea={tea} />
          <div className="tin-legend"><span><i className="lg-temp" />Water</span><span><i className="lg-time" />Steep</span></div>
        </div>
        <div className="pack-switch">
          {tea.packs.map((pk, k) => (
            <button key={pk.grams} className={pack === k ? 'is-on' : ''} onClick={() => setPack(k)}>{pk.grams}g</button>
          ))}
        </div>
        <div className="tin-buy">
          <span className="price-lg">{ksh(p.price)}</span>
          <button className="btn btn-fill btn-sm" onClick={() => add({ key: `tea-${tea.id}-${p.grams}`, kind: 'tea', refId: tea.id, name: `${tea.name} · ${p.grams}g`, image: tea.image, unit: p.price, meta: 'Loose leaf tin' })}>Add <Icon.plus /></button>
        </div>
      </div>
    </Reveal>
  );
}

export default function TeaShop() {
  return (
    <>
      <PageHero eyebrow="The tea shop" title={<>Take the <em>teahouse</em> home.</>} image="/images/site/tea-hero.jpg" cn="茶">
        <p className="page-hero-lede">The same leaves we pour at the table, packed in tins and delivered with your order — or on their own.</p>
      </PageHero>
      <section className="section">
        <div className="wrap tins">{TEAS.map((t, i) => <TeaCard key={t.id} tea={t} i={i} />)}</div>
      </section>
      <section className="section section-gift">
        <div className="wrap gift-grid">
          <Reveal>
            <div className="gift-card-visual">
              <div className="gift-card">
                <span className="gift-mark">CHΛ BΛO</span>
                <span className="gift-cn">礼</span>
                <span className="gift-amt">Gift of a table</span>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">Gift cards</p>
            <h2>Give someone <em>a seat at our table.</em></h2>
            <p className="muted">Digital gift cards, sent by WhatsApp or email. Use them in the bistro or online.</p>
            <div className="gift-amounts">
              {[3000, 5000, 10000].map((a) => <GiftButton key={a} amount={a} />)}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function GiftButton({ amount }: { amount: number }) {
  const { add } = useCart();
  return (
    <button className="gift-amt-btn" onClick={() => add({ key: `gift-${amount}`, kind: 'tea', refId: `gift-${amount}`, name: `Gift card · ${ksh(amount)}`, image: '/images/site/gift-card.jpg', unit: amount, meta: 'Delivered digitally' })}>
      {ksh(amount)}<span>+</span>
    </button>
  );
}
