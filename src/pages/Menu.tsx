import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { CATEGORIES, DISHES, ksh, type CategoryId, type Tag } from '../data/menu';
import { useCart } from '../store/cart';
import { PageHero } from '../components/Chrome';
import { LazySusan } from '../components/LazySusan';
import { PlateCard } from '../components/PlateCard';
import { Icon } from '../components/Drawings';

type View = 'table' | 'steamers' | 'ledger';
const VIEWS: { id: View; label: string; cn: string }[] = [
  { id: 'table', label: 'Lazy Susan', cn: '转' },
  { id: 'steamers', label: 'Plates', cn: '盘' },
  { id: 'ledger', label: 'Ledger', cn: '单' },
];
const FILTERS: { id: Tag; label: string }[] = [
  { id: 'veg', label: 'Vegetarian' },
  { id: 'spicy', label: 'Spicy' },
  { id: 'signature', label: 'Signature' },
  { id: 'new', label: 'New' },
];

export default function Menu() {
  const [params, setParams] = useSearchParams();
  const cat = (params.get('cat') as CategoryId | null) ?? 'all';
  const [view, setView] = useState<View>(() => (window.innerWidth < 700 ? 'steamers' : 'table'));
  const [filters, setFilters] = useState<Tag[]>([]);
  const [q, setQ] = useState('');
  const { add } = useCart();

  const list = useMemo(() => DISHES.filter((d) =>
    (cat === 'all' || d.category === cat) &&
    filters.every((f) => d.tags.includes(f)) &&
    (!q || (d.name + d.blurb).toLowerCase().includes(q.toLowerCase()))
  ), [cat, filters, q]);

  const toggle = (t: Tag) => setFilters((f) => (f.includes(t) ? f.filter((x) => x !== t) : [...f, t]));
  const setCat = (c: string) => { c === 'all' ? params.delete('cat') : params.set('cat', c); setParams(params, { replace: true }); };
  const catInfo = CATEGORIES.find((c) => c.id === cat);

  return (
    <>
      <PageHero eyebrow="Order online · delivery & pickup" title={<>Made to be <em>shared.</em></>} image="/images/site/menu-hero.jpg" cn="点">
        <p className="page-hero-lede">Order a few plates for the table and keep them coming.</p>
      </PageHero>

      <div className="menu-bar">
        <div className="wrap menu-bar-inner">
          <div className="cat-scroll" role="tablist">
            <button className={`cat-chip ${cat === 'all' ? 'is-on' : ''}`} onClick={() => setCat('all')}>Everything</button>
            {CATEGORIES.map((c) => (
              <button key={c.id} className={`cat-chip ${cat === c.id ? 'is-on' : ''}`} onClick={() => setCat(c.id)}><span>{c.cn}</span>{c.name}</button>
            ))}
          </div>
          <div className="view-switch" role="radiogroup" aria-label="Layout">
            <LayoutGroup id="views">
              {VIEWS.map((v) => (
                <button key={v.id} role="radio" aria-checked={view === v.id} className={view === v.id ? 'is-on' : ''} onClick={() => setView(v.id)}>
                  {view === v.id && <motion.span layoutId="view-pill" className="view-pill" />}
                  <span className="view-cn">{v.cn}</span>{v.label}
                </button>
              ))}
            </LayoutGroup>
          </div>
        </div>
      </div>

      <section className="section menu-section">
        <div className="wrap">
          <div className="menu-tools">
            <div>
              <p className="eyebrow">{catInfo ? catInfo.cn + ' · ' + catInfo.line : 'The whole menu'}</p>
              <h2 className="menu-h">{catInfo ? catInfo.name : 'Everything'} <span className="muted">({list.length})</span></h2>
            </div>
            <div className="menu-filters">
              {FILTERS.map((f) => (
                <button key={f.id} className={`filter-chip ${filters.includes(f.id) ? 'is-on' : ''}`} onClick={() => toggle(f.id)}>
                  <span className={`fdot fdot--${f.id}`} />{f.label}
                </button>
              ))}
              <label className="search">
                <svg viewBox="0 0 24 24" className="ic"><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></svg>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes" aria-label="Search dishes" />
              </label>
            </div>
          </div>

          {list.length === 0 ? (
            <div className="menu-empty">
              <span>无</span>
              <p>Nothing on the table matches that. Try fewer filters.</p>
              <button className="btn btn-ghost" onClick={() => { setFilters([]); setQ(''); setCat('all'); }}>Reset</button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={view + cat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                {view === 'table' && (list.length >= 3 ? (
                  <LazySusan dishes={list.slice(0, 10)} centre={catInfo?.cn ?? '转'} />
                ) : (
                  <p className="muted">The table needs at least three dishes to turn — showing plates instead.</p>
                ))}
                {(view === 'steamers' || (view === 'table' && list.length < 3)) && (
                  <div className="plates-grid">
                    <AnimatePresence>{list.map((d, i) => <PlateCard key={d.id} dish={d} index={i} />)}</AnimatePresence>
                  </div>
                )}
                {view === 'table' && list.length > 10 && (
                  <p className="muted center small" style={{ marginTop: '2rem' }}>The table holds ten. Pick a category or switch to Plates to see all {list.length}.</p>
                )}
                {view === 'ledger' && (
                  <div className="ledger">
                    {(cat === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.id === cat)).map((c) => {
                      const items = list.filter((d) => d.category === c.id);
                      if (!items.length) return null;
                      return (
                        <div key={c.id} className="ledger-cat">
                          <div className="ledger-side"><span className="ledger-cn">{c.cn}</span><h3>{c.name}</h3><p className="muted small">{c.line}</p></div>
                          <ul>
                            {items.map((d) => (
                              <li key={d.id} className="ledger-row">
                                <Link to={`/dish/${d.id}`} className="ledger-main">
                                  <span className="ledger-name">{d.name}{d.tags.includes('veg') && <i className="fdot fdot--veg" />}{d.tags.includes('spicy') && <i className="fdot fdot--spicy" />}</span>
                                  <span className="leader" />
                                  <span className="ledger-price">{d.price.toLocaleString()}</span>
                                </Link>
                                <p className="muted small">{d.blurb}{d.pieces ? ` · ${d.pieces}` : ''}</p>
                                <button className="ledger-add" onClick={() => add({ key: d.id, kind: 'dish', refId: d.id, name: d.name, image: d.image, unit: d.price, meta: d.pieces })} aria-label={`Add ${d.name}`}><Icon.plus /></button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                    <p className="muted small">Prices in KSh, VAT inclusive. Tell us about allergies in your order note.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      <section className="section menu-note">
        <div className="wrap center">
          <p className="eyebrow">Ordering for a crowd?</p>
          <h2>Twelve or more? <em>Let’s talk.</em></h2>
          <p className="muted">For offices and celebrations we put together full banquet steamers. Total from {ksh(15000)}.</p>
          <Link to="/reserve" className="btn btn-ghost">Enquire</Link>
        </div>
      </section>
    </>
  );
}
