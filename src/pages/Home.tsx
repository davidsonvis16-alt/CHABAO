import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BUSINESS, CATEGORIES, DISHES, TEAS, ZONES, ksh, openStatus } from '../data/menu';
import { Img } from '../components/Img';
import { BrushRing, Chopsticks, Icon, Steam } from '../components/Drawings';
import { Reveal } from '../components/Chrome';
import { LazySusan } from '../components/LazySusan';
import { SteamerBuilder } from '../components/SteamerBuilder';

const signatures = DISHES.filter((d) => d.tags.includes('signature'));

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '60%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const fireRef = useRef<HTMLElement>(null);
  const fire = useScroll({ target: fireRef, offset: ['start end', 'end start'] });
  const fireY = useTransform(fire.scrollYProgress, [0, 1], ['-12%', '12%']);
  const status = openStatus();

  const headline = ['Bao,', 'dim', 'sum', '&', 'tea.'];

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="hero" ref={heroRef}>
        <motion.div className="hero-bg" style={{ y: imgY }}>
          <Img src="/images/site/hero-lanterns.jpg" alt="Dim sum in bamboo steamers on a table" eager />
        </motion.div>
        <div className="hero-shade" />
        <motion.div className="wrap hero-content" style={{ y: textY, opacity: fade }}>
          <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Cha Bao, Nairobi
          </motion.p>
          <h1 className="hero-title">
            {headline.map((w, i) => (
              <span className="word" key={i}>
                <motion.span initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: 0.4 + i * 0.09, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} className={i >= 3 ? 'accent' : ''}>
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.span className="rule-line" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.1, duration: 0.8 }} />
          <motion.p className="hero-lede" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
            Bao, dim sum, noodles and loose-leaf tea. Eat in, or get it delivered anywhere in Nairobi.
          </motion.p>
          <motion.div className="hero-actions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.35 }}>
            <Link to="/menu" className="btn btn-fill">Order now <Icon.arrow /></Link>
            <Link to="/reserve" className="btn btn-ghost">Book a table</Link>
          </motion.div>
        </motion.div>
        <div className="hero-stamp">
          <span>Open since</span>
          <strong>{BUSINESS.opened}</strong>
          <em className={status.open ? 'on' : ''}>{status.text}</em>
        </div>
      </section>

      {/* ---------- LAZY SUSAN ---------- */}
      <section id="table" className="section section-susan">
        <div className="wrap">
          <Reveal className="section-head split-head">
            <div>
              <p className="eyebrow">Signatures</p>
              <h2>What people <em>come back for.</em></h2>
            </div>
            <p className="muted head-note">Spin the table. Whatever stops in front of you, you can add to your order.</p>
          </Reveal>
          <LazySusan dishes={signatures} centre="招牌" />
        </div>
      </section>

      {/* ---------- BAO STORY (asymmetric collage) ---------- */}
      <section className="section section-bao">
        <div className="wrap bao-grid">
          <Reveal className="bao-copy">
            <p className="eyebrow">Bao</p>
            <h2>Steamed <em>when you order.</em></h2>
            <p>We don’t keep buns waiting in a warmer. Each one is steamed when the ticket comes in. Fillings: pork belly braised for twelve hours, tempura mushroom, five-spice short rib.</p>
            <Chopsticks className="bao-chopsticks" />
            <ul className="facts">
              <li><strong>包</strong><span>Steamed to order, never held</span></li>
              <li><strong>手</strong><span>Dumplings folded by hand each morning</span></li>
              <li><strong>火</strong><span>Glazes finished with the torch at the pass</span></li>
            </ul>
          </Reveal>
          <div className="bao-collage">
            <Reveal className="col-a"><Img src="/images/site/bao-open.jpg" alt="Bao on a dark plate on a timber table" /></Reveal>
            <Reveal className="col-b" delay={0.15}><Img src="/images/site/steamer-stack.jpg" alt="Bamboo steamers stacked in the kitchen" /></Reveal>
            <Reveal className="col-c" delay={0.3}>
              <div className="circle-crop"><Img src="/images/site/dough-hands.jpg" alt="Hands pleating dumpling dough" /></div>
              <BrushRing className="col-ring" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- STEAMER BUILDER ---------- */}
      <section className="section section-builder">
        <div className="wrap">
          <SteamerBuilder />
        </div>
      </section>

      {/* ---------- FIRE ---------- */}
      <section className="fire" ref={fireRef}>
        <motion.div className="fire-bg" style={{ y: fireY }}>
          <Img src="/images/site/torch-sweet-potato.jpg" alt="A chef torching a teriyaki glaze on sweet potato" />
        </motion.div>
        <div className="fire-shade" />
        <div className="wrap fire-inner">
          <Reveal>
            <span className="fire-cn">火</span>
            <p className="eyebrow">From the torch</p>
            <h2>Glazed, then <em>torched.</em></h2>
            <p className="fire-copy">Teriyaki sweet potato. White miso Lake Victoria perch. Both get a blowtorch right before they go out.</p>
            <Link to="/menu?cat=fire" className="btn btn-ghost">See these dishes <Icon.arrow /></Link>
          </Reveal>
        </div>
      </section>

      {/* ---------- CATEGORY ORBIT ---------- */}
      <section className="section section-orbit">
        <div className="wrap">
          <Reveal className="section-head center">
            <p className="eyebrow">Menu</p>
            <h2>Browse by <em>section</em></h2>
          </Reveal>
          <div className="orbit">
            {CATEGORIES.map((c, i) => {
              const lead = DISHES.find((d) => d.category === c.id)!;
              return (
                <Reveal key={c.id} delay={i * 0.06} className={`orbit-item oi-${i}`}>
                  <Link to={`/menu?cat=${c.id}`} className="orbit-link">
                    <span className="orbit-plate"><Img src={lead.image} alt="" /></span>
                    <span className="orbit-cn">{c.cn}</span>
                    <span className="orbit-name">{c.name}</span>
                    <span className="orbit-line">{c.line}</span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- TEA ---------- */}
      <section className="section section-tea">
        <div className="wrap tea-grid">
          <Reveal className="tea-visual">
            <div className="tea-arch"><Img src="/images/site/tea-pour.jpg" alt="Tea being poured into a small cup" /></div>
            <Steam className="tea-steam" />
          </Reveal>
          <div>
            <Reveal>
              <p className="eyebrow">Cha · 茶</p>
              <h2>Cha means <em>tea.</em></h2>
            </Reveal>
            <ol className="ritual">
              {[
                ['Choose your leaf', 'From Fujian jasmine pearls to purple tea grown in the Nandi Hills.'],
                ['Brewed right', 'Every tea gets its own water temperature and steep time.'],
                ['Free refills', 'We top up your pot for as long as you’re eating.'],
              ].map(([t, d], i) => (
                <Reveal key={t} delay={i * 0.1}>
                  <li><span className="ritual-n">0{i + 1}</span><div><h3>{t}</h3><p className="muted">{d}</p></div></li>
                </Reveal>
              ))}
            </ol>
            <div className="tea-strip">
              {TEAS.map((t) => (
                <Link key={t.id} to="/tea" className="tea-chip"><span className="tea-chip-cn">{t.cn.slice(0, 1)}</span>{t.name}</Link>
              ))}
            </div>
            <Link to="/tea" className="btn btn-fill">Shop leaf tea <Icon.arrow /></Link>
          </div>
        </div>
      </section>

      {/* ---------- CHEF ---------- */}
      <section className="section section-chef">
        <div className="wrap chef-grid">
          <Reveal className="chef-photo"><Img src="/images/site/chef-nishant.jpg" alt="Chef Nishant Choubey at the pass" /></Reveal>
          <Reveal className="chef-copy" delay={0.1}>
            <p className="eyebrow">Head chef</p>
            <h2>Nishant <em>Choubey</em></h2>
            <p>Nishant writes the menu and runs the kitchen. A dish only goes on the menu once he’s happy with it.</p>
            <a className="link-underline" href="https://www.instagram.com/chef_nishant_choubey/" target="_blank" rel="noreferrer">Nishant on Instagram</a>
          </Reveal>
        </div>
      </section>

      {/* ---------- DELIVERY MAP-LIST ---------- */}
      <section className="section section-zones">
        <div className="wrap zones-grid">
          <Reveal>
            <p className="eyebrow">Delivery</p>
            <h2>Where we <em>deliver</em></h2>
            <p className="muted">Our own riders, insulated bags. Pay with M-PESA, card or PayPal.</p>
          </Reveal>
          <ul className="zones">
            {ZONES.map((z, i) => (
              <Reveal key={z.id} delay={i * 0.04}>
                <li><span className="zone-name">{z.name}</span><span className="zone-dash" /><span className="zone-eta">{z.eta} min</span><span className="zone-fee">{ksh(z.fee)}</span></li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- GALLERY ---------- */}
      <section className="section section-gallery">
        <div className="wrap">
          <Reveal className="section-head split-head">
            <div><p className="eyebrow">@chabaokenya</p><h2>On <em>Instagram</em></h2></div>
            <a className="btn btn-ghost" href={BUSINESS.instagram} target="_blank" rel="noreferrer"><img src="/images/brand/instagram.svg" alt="" className="btn-logo" /> Follow along</a>
          </Reveal>
          <div className="gallery">
            {[1, 2, 3, 4, 5, 6].map((n, i) => (
              <Reveal key={n} delay={i * 0.05} className={`g g-${n}`}><Img src={`/images/site/gallery-${n}.jpg`} alt={`Cha Bao, photo ${n}`} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="cta-band">
        <div className="wrap cta-inner">
          <h2>Hungry? <em>Order or book.</em></h2>
          <div className="cta-actions">
            <Link to="/reserve" className="btn btn-light">Reserve <Icon.arrow /></Link>
            <Link to="/menu" className="btn btn-ghost">Order delivery</Link>
          </div>
        </div>
      </section>
    </>
  );
}
