import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DISHES, ksh, type Dish } from '../data/menu';
import { useCart } from '../store/cart';
import { Img } from './Img';
import { Icon, Steam } from './Drawings';

const SLOTS = 3;
const SAVE = 0.1;

/** Build-your-own steamer: fill a bamboo basket with three baskets' worth of dim sum & bao, save 10%. */
export function SteamerBuilder() {
  const pool = useMemo(() => DISHES.filter((d) => d.category === 'dimsum' || d.category === 'bao'), []);
  const [picked, setPicked] = useState<(Dish | null)[]>(Array(SLOTS).fill(null));
  const [lidOn, setLidOn] = useState(false);
  const { add } = useCart();

  const filled = picked.filter(Boolean) as Dish[];
  const full = filled.length === SLOTS;
  const base = filled.reduce((s, d) => s + d.price, 0);
  const price = Math.round(base * (1 - SAVE));

  const put = (d: Dish) => {
    const i = picked.findIndex((p) => !p);
    if (i === -1) return;
    const next = [...picked];
    next[i] = d;
    setPicked(next);
    setLidOn(false);
  };
  const takeOut = (i: number) => { const next = [...picked]; next[i] = null; setPicked(next); setLidOn(false); };

  const addSteamer = () => {
    if (!full) return;
    setLidOn(true);
    const ids = filled.map((d) => d.id).sort().join('+');
    setTimeout(() => {
      add({ key: `steamer:${ids}`, kind: 'steamer', refId: ids, name: 'Your Steamer', image: filled[0].image, unit: price, meta: filled.map((d) => d.name).join(' · ') });
      setPicked(Array(SLOTS).fill(null));
      setLidOn(false);
    }, 900);
  };

  return (
    <div className="builder">
      <div className="builder-basket-wrap">
        <div className={`basket ${full ? 'is-full' : ''}`}>
          <div className="basket-weave" />
          {picked.map((d, i) => (
            <div key={i} className={`basket-slot slot-${i}`}>
              <AnimatePresence>
                {d ? (
                  <motion.button key={d.id} className="basket-dish" onClick={() => takeOut(i)} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 40 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} aria-label={`Remove ${d.name}`}>
                    <Img src={d.image} alt={d.name} />
                    <span className="basket-x"><Icon.close /></span>
                  </motion.button>
                ) : (
                  <motion.span className="basket-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{i + 1}</motion.span>
                )}
              </AnimatePresence>
            </div>
          ))}
          <AnimatePresence>
            {lidOn && (
              <motion.div className="basket-lid" initial={{ y: -260, opacity: 0, rotate: -8 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 16 }}>
                <span>蒸</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {full && <Steam className="basket-steam" />}
      </div>

      <div className="builder-side">
        <p className="eyebrow">Build a steamer · save 10%</p>
        <h3 className="builder-title">Pick three. <em>We’ll steam them together.</em></h3>
        <div className="builder-pool">
          {pool.map((d) => {
            const count = filled.filter((f) => f.id === d.id).length;
            return (
              <button key={d.id} className={`pool-chip ${count ? 'is-in' : ''}`} onClick={() => put(d)} disabled={full}>
                <Img src={d.image} alt="" className="pool-thumb" />
                <span className="pool-name">{d.name}</span>
                <span className="pool-price">{ksh(d.price)}</span>
                {count > 0 && <span className="pool-count">×{count}</span>}
              </button>
            );
          })}
        </div>
        <div className="builder-total">
          <div>
            <span className="muted small">{filled.length}/{SLOTS} in the basket</span>
            <div className="builder-prices">
              {base > 0 && <s>{ksh(base)}</s>}
              <strong>{ksh(price)}</strong>
            </div>
          </div>
          <button className="btn btn-fill" disabled={!full} onClick={addSteamer}>Close the lid <Icon.arrow /></button>
        </div>
      </div>
    </div>
  );
}
