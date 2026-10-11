import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../store/cart';
import { BUSINESS, ksh, openStatus, teaById } from '../data/menu';
import { Img, Logo, PayMark } from './Img';
import { Icon } from './Drawings';

const NAV = [
  { to: '/menu', label: 'Order', cn: '点' },
  { to: '/tea', label: 'Tea Shop', cn: '茶' },
  { to: '/reserve', label: 'Reserve', cn: '席' },
  { to: '/visit', label: 'Visit', cn: '来' },
];

export function Header() {
  const { count, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => setMenu(false), [loc.pathname]);
  useEffect(() => { document.body.classList.toggle('lock', menu); }, [menu]);

  return (
    <>
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="wrap header-row">
          <Link to="/" className="brand" aria-label="Cha Bao home"><Logo small /></Link>
          <nav className="nav">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className="nav-link">
                <span className="nav-cn">{n.cn}</span>{n.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <button className="bag-btn" onClick={() => setOpen(true)} aria-label={`Open your order, ${count} items`}>
              <Icon.bag />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span key={count} className="bag-count" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>{count}</motion.span>
                )}
              </AnimatePresence>
            </button>
            <button className={`burger ${menu ? 'is-open' : ''}`} onClick={() => setMenu((m) => !m)} aria-label="Menu" aria-expanded={menu}>
              <span /><span />
            </button>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {menu && (
          <motion.div className="mobile-nav" initial={{ clipPath: 'circle(0% at 100% 0%)' }} animate={{ clipPath: 'circle(150% at 100% 0%)' }} exit={{ clipPath: 'circle(0% at 100% 0%)' }} transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}>
            <div className="wrap">
              {NAV.map((n, i) => (
                <motion.div key={n.to} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.07 }}>
                  <Link to={n.to} className="mobile-link"><span>{n.cn}</span>{n.label}</Link>
                </motion.div>
              ))}
              <p className="mobile-status">{openStatus().text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Designer credit in the footer. Set to the portfolio address to make it a link. */
const PORTFOLIO_URL = '';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-giant" aria-hidden>CHΛ BΛO</div>
      <div className="wrap footer-grid">
        <div>
          <Logo />
          <p className="muted">Modern Asian food, tea and the joy of sharing a table.</p>
          <div className="socials">
            <a href={BUSINESS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><img src="/images/brand/instagram.svg" alt="" /></a>
            <a href={`https://wa.me/${BUSINESS.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><img src="/images/brand/whatsapp.svg" alt="" /></a>
            <a href="https://www.tiktok.com/" target="_blank" rel="noreferrer" aria-label="TikTok"><img src="/images/brand/tiktok.svg" alt="" /></a>
          </div>
        </div>
        <div>
          <h4>Visit</h4>
          <p>{BUSINESS.address}</p>
          <p><a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`}>{BUSINESS.phone}</a></p>
          <p><a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></p>
        </div>
        <div>
          <h4>Hours</h4>
          <ul className="hours">
            {BUSINESS.hours.map((h) => (<li key={h.label}><span>{h.label}</span><span>{h.open} – {h.close}</span></li>))}
          </ul>
          <p className="status-pill"><i className={openStatus().open ? 'on' : ''} />{openStatus().text}</p>
        </div>
        <div>
          <h4>We accept</h4>
          <div className="pay-row">
            <PayMark name="mpesa" label="M-PESA" />
            <PayMark name="visa" label="Visa" />
            <PayMark name="mastercard" label="Mastercard" />
            <PayMark name="paypal" label="PayPal" />
          </div>
          <Link to="/menu" className="btn btn-fill btn-sm" style={{ marginTop: '1.4rem' }}>Order now <Icon.arrow /></Link>
        </div>
      </div>
      <div className="wrap footer-base">
        <span>© {new Date().getFullYear()} Cha Bao · Nairobi · Open since {BUSINESS.opened}</span>
        {PORTFOLIO_URL ? <a className="footer-credit" href={PORTFOLIO_URL} target="_blank" rel="noreferrer">Site by Eden</a> : <span>Site by Eden</span>}
      </div>
    </footer>
  );
}

export function CartDrawer() {
  const { lines, open, setOpen, setQty, subtotal, add, count } = useCart();
  const nav = useNavigate();
  useEffect(() => { document.body.classList.toggle('lock', open); }, [open]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [setOpen]);

  const hasTea = lines.some((l) => l.kind === 'tea' || l.refId.startsWith('cup-'));
  const suggestTea = teaById('jasmine')!;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="scrim" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside className="drawer" role="dialog" aria-label="Your order" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 260 }}>
            <div className="drawer-head">
              <div>
                <p className="eyebrow">Your table</p>
                <h3>{count ? `${count} ${count === 1 ? 'plate' : 'plates'}` : 'Nothing yet'}</h3>
              </div>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close"><Icon.close /></button>
            </div>

            {lines.length === 0 ? (
              <div className="drawer-empty">
                <div className="empty-plate"><span>空</span></div>
                <p>An empty table is a sad table.</p>
                <button className="btn btn-fill" onClick={() => { setOpen(false); nav('/menu'); }}>Spin the menu <Icon.arrow /></button>
              </div>
            ) : (
              <>
                <ul className="drawer-lines">
                  <AnimatePresence initial={false}>
                    {lines.map((l) => (
                      <motion.li key={l.key} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, height: 0 }}>
                        <Img src={l.image} alt={l.name} className="line-plate" />
                        <div className="line-body">
                          <strong>{l.name}</strong>
                          {l.meta && <span className="line-meta">{l.meta}</span>}
                          <div className="line-foot">
                            <div className="qty">
                              <button onClick={() => setQty(l.key, l.qty - 1)} aria-label="Less"><Icon.minus /></button>
                              <span>{l.qty}</span>
                              <button onClick={() => setQty(l.key, l.qty + 1)} aria-label="More"><Icon.plus /></button>
                            </div>
                            <span className="line-price">{ksh(l.unit * l.qty)}</span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                {!hasTea && (
                  <div className="upsell">
                    <Img src={suggestTea.image} alt={suggestTea.name} className="upsell-img" />
                    <div>
                      <p className="eyebrow">Cha means tea</p>
                      <p>Add a pot of {suggestTea.name}?</p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => add({ key: `cup-${suggestTea.id}`, kind: 'dish', refId: `cup-${suggestTea.id}`, name: `Pot of ${suggestTea.name}`, image: suggestTea.image, unit: suggestTea.cupPrice, meta: 'Serves 2' })}>
                      + {ksh(suggestTea.cupPrice)}
                    </button>
                  </div>
                )}
                <div className="drawer-foot">
                  <div className="sum-row"><span>Subtotal</span><strong>{ksh(subtotal)}</strong></div>
                  <p className="muted small">Delivery and tip are added at checkout.</p>
                  <button className="btn btn-fill btn-block" onClick={() => { setOpen(false); nav('/checkout'); }}>Checkout <Icon.arrow /></button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function Toast() {
  const { toast, setOpen } = useCart();
  return (
    <AnimatePresence>
      {toast && (
        <motion.button className="toast" onClick={() => setOpen(true)} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}>
          <span className="toast-dot" />{toast}<span className="toast-cta">View</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export function PageHero({ eyebrow, title, image, children, cn }: { eyebrow: string; title: React.ReactNode; image: string; children?: React.ReactNode; cn?: string }) {
  return (
    <section className="page-hero">
      <Img src={image} alt="" className="page-hero-img" eager />
      <div className="page-hero-shade" />
      {cn && <span className="page-hero-cn" aria-hidden>{cn}</span>}
      <div className="wrap page-hero-inner">
        <motion.p className="eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>{eyebrow}</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }}>{title}</motion.h1>
        <span className="rule-line" />
        {children}
      </div>
    </section>
  );
}

export function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.9, delay, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}
