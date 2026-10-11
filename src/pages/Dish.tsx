import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ADDONS, CATEGORIES, DISHES, SPICE, dishById, ksh, teaById } from '../data/menu';
import { useCart } from '../store/cart';
import { Img } from '../components/Img';
import { ChilliDots, Icon, Steam } from '../components/Drawings';
import { PlateCard } from '../components/PlateCard';

export default function DishPage() {
  const { id = '' } = useParams();
  const dish = dishById(id);
  const nav = useNavigate();
  const { add, setOpen } = useCart();
  const [spice, setSpice] = useState(1);
  const [addons, setAddons] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => { setSpice(dish?.tags.includes('spicy') ? 2 : 1); setAddons([]); setQty(1); setNote(''); window.scrollTo(0, 0); }, [id, dish]);

  if (!dish) {
    return (
      <section className="section center" style={{ paddingTop: '10rem' }}>
        <h1>That plate has left the table.</h1>
        <Link to="/menu" className="btn btn-fill" style={{ marginTop: '2rem' }}>Back to the menu</Link>
      </section>
    );
  }

  const cat = CATEGORIES.find((c) => c.id === dish.category)!;
  const tea = dish.pairsWith ? teaById(dish.pairsWith) : undefined;
  const addonTotal = ADDONS.filter((a) => addons.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const unit = dish.price + addonTotal;
  const idx = DISHES.findIndex((d) => d.id === dish.id);
  const prev = DISHES[(idx - 1 + DISHES.length) % DISHES.length];
  const next = DISHES[(idx + 1) % DISHES.length];
  const related = DISHES.filter((d) => d.category === dish.category && d.id !== dish.id).slice(0, 3);

  const submit = () => {
    const meta = [dish.pieces, `Heat: ${SPICE[spice]}`, ...ADDONS.filter((a) => addons.includes(a.id)).map((a) => a.name), note && `“${note}”`].filter(Boolean).join(' · ');
    add({ key: `${dish.id}|${spice}|${[...addons].sort().join(',')}|${note}`, kind: 'dish', refId: dish.id, name: dish.name, image: dish.image, unit, meta }, qty);
  };

  return (
    <>
      <section className="dish-hero">
        <div className="wrap dish-grid">
          <div className="dish-visual">
            <span className="dish-cn" aria-hidden>{dish.cn ?? cat.cn}</span>
            <motion.div key={dish.id} className="dish-plate" initial={{ rotate: -90, scale: 0.6, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 60, damping: 14 }}>
              <Img src={dish.image} alt={dish.name} eager />
            </motion.div>
            <Steam className="dish-steam" />
            <div className="dish-nav">
              <Link to={`/dish/${prev.id}`} className="icon-btn" aria-label={`Previous: ${prev.name}`}><Icon.back /></Link>
              <Link to={`/dish/${next.id}`} className="icon-btn" aria-label={`Next: ${next.name}`}><Icon.arrow /></Link>
            </div>
          </div>

          <motion.div className="dish-info" key={dish.id + 'i'} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <button className="crumb" onClick={() => nav(-1)}><Icon.back /> {cat.name}</button>
            <h1 className="dish-title">{dish.name}</h1>
            <div className="tag-row">{dish.tags.map((t) => <span key={t} className={`tag tag--${t}`}>{t === 'veg' ? 'Vegetarian' : t}</span>)}{dish.pieces && <span className="tag">{dish.pieces}</span>}</div>
            <p className="dish-long">{dish.long}</p>

            <div className="opt">
              <div className="opt-head"><span>Heat</span><ChilliDots level={spice} /></div>
              <div className="spice-track">
                {SPICE.map((s, i) => (
                  <button key={s} className={spice === i ? 'is-on' : ''} onClick={() => setSpice(i)}>{s}</button>
                ))}
                <motion.span className="spice-fill" animate={{ width: `${(spice / (SPICE.length - 1)) * 100}%` }} />
              </div>
            </div>

            <div className="opt">
              <div className="opt-head"><span>On the side</span></div>
              <div className="addon-list">
                {ADDONS.map((a) => {
                  const on = addons.includes(a.id);
                  return (
                    <button key={a.id} className={`addon ${on ? 'is-on' : ''}`} onClick={() => setAddons((x) => (on ? x.filter((y) => y !== a.id) : [...x, a.id]))}>
                      <span className="addon-box">{on && <Icon.check />}</span>{a.name}<span className="muted">+{ksh(a.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="field">
              <span>Note for the kitchen</span>
              <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 80))} placeholder="No coriander, please…" />
            </label>

            <div className="dish-buy">
              <div className="qty qty-lg">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Less"><Icon.minus /></button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="More"><Icon.plus /></button>
              </div>
              <button className="btn btn-fill btn-grow" onClick={submit}>Add · {ksh(unit * qty)}</button>
            </div>
            <button className="link-underline" onClick={() => { submit(); setOpen(true); }}>Add and view order</button>

            {tea && (
              <Link to="/tea" className="pairing">
                <Img src={tea.image} alt={tea.name} className="pairing-img" />
                <div><p className="eyebrow">Pairs with</p><strong>{tea.name}</strong><span className="muted small">{tea.notes}</span></div>
                <Icon.arrow />
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section">
          <div className="wrap">
            <p className="eyebrow">More {cat.name.toLowerCase()}</p>
            <h2 style={{ marginBottom: '3rem' }}>Keep the table <em>turning.</em></h2>
            <div className="plates-grid">{related.map((d, i) => <PlateCard key={d.id} dish={d} index={i} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
