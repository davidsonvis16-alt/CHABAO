import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { animate, AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import type { Dish } from '../data/menu';
import { ksh } from '../data/menu';
import { useCart } from '../store/cart';
import { Img } from './Img';
import { Icon, Steam } from './Drawings';

/**
 * The lazy Susan: dishes sit around a turning table. Drag it, flick it, or tap a plate —
 * whichever plate comes round to the front is the one being served.
 */
export function LazySusan({ dishes, centre = '转' }: { dishes: Dish[]; centre?: string }) {
  const n = dishes.length;
  const step = 360 / n;
  const rot = useMotionValue(0);
  const counter = useTransform(rot, (v) => -v);
  const [active, setActive] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startAngle: number; startRot: number; last: number; lastT: number; vel: number; moved: boolean } | null>(null);
  const wasDrag = useRef(false);
  const { add } = useCart();

  useEffect(() => {
    rot.set(0);
    setActive(0);
  }, [dishes, rot]);

  useEffect(() => rot.on('change', (v) => {
    const i = ((Math.round(-v / step) % n) + n) % n;
    setActive((p) => (p === i ? p : i));
  }), [rot, step, n]);

  const snapTo = (target: number) => animate(rot, target, { type: 'spring', stiffness: 90, damping: 18 });
  const snapNearest = (v: number) => snapTo(Math.round(v / step) * step);

  const angleAt = (x: number, y: number) => {
    const r = tableRef.current!.getBoundingClientRect();
    return (Math.atan2(y - (r.top + r.height / 2), x - (r.left + r.width / 2)) * 180) / Math.PI;
  };

  const onDown = (e: React.PointerEvent) => {
    rot.stop();
    wasDrag.current = false;
    drag.current = { startAngle: angleAt(e.clientX, e.clientY), startRot: rot.get(), last: rot.get(), lastT: performance.now(), vel: 0, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    let delta = angleAt(e.clientX, e.clientY) - d.startAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    if (!d.moved && Math.abs(delta) > 3) {
      d.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    const v = d.startRot + delta;
    const now = performance.now();
    d.vel = (v - d.last) / Math.max(1, now - d.lastT);
    d.last = v;
    d.lastT = now;
    rot.set(v);
    // keep the start reference fresh so full spins keep working
    if (Math.abs(delta) > 150) { d.startAngle = angleAt(e.clientX, e.clientY); d.startRot = v; }
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    wasDrag.current = true;
    const fling = rot.get() + d.vel * 260; // momentum
    snapNearest(fling);
  };

  const bring = (i: number) => {
    const cur = rot.get();
    const target = -i * step;
    let diff = ((target - cur) % 360 + 540) % 360 - 180;
    snapTo(cur + diff);
  };
  const nudge = (dir: 1 | -1) => snapTo(Math.round(rot.get() / step) * step - dir * step);

  const dish = dishes[active];

  return (
    <div className="susan">
      <div className="susan-stage">
        <div className="susan-shadow" />
        <motion.div
          ref={tableRef}
          className="susan-table"
          style={{ rotate: rot }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <div className="susan-grain" />
          {dishes.map((d, i) => {
            const a = ((i * step + 90) * Math.PI) / 180;
            return (
              <div key={d.id} className="susan-slot" style={{ left: `${50 + Math.cos(a) * 37}%`, top: `${50 + Math.sin(a) * 37}%` }}>
                <motion.button
                  className={`susan-plate ${i === active ? 'is-front' : ''}`}
                  style={{ rotate: counter }}
                  onClick={(e) => { if (wasDrag.current) { e.preventDefault(); return; } bring(i); }}
                  aria-label={`Bring ${d.name} to the front`}
                >
                  <Img src={d.image} alt={d.name} />
                </motion.button>
              </div>
            );
          })}
          <motion.div className="susan-hub" style={{ rotate: counter }}>
            <span className="susan-cn">{centre}</span>
            <span className="susan-hint"><Icon.rotate /> drag to turn</span>
          </motion.div>
        </motion.div>
        <div className="susan-pointer" aria-hidden><span /></div>
        <Steam className="susan-steam" />
      </div>

      <div className="susan-panel" aria-live="polite">
        <div className="susan-nav">
          <button className="icon-btn" onClick={() => nudge(-1)} aria-label="Previous dish"><Icon.back /></button>
          <span className="susan-count">{String(active + 1).padStart(2, '0')} <i>/</i> {String(n).padStart(2, '0')}</span>
          <button className="icon-btn" onClick={() => nudge(1)} aria-label="Next dish"><Icon.arrow /></button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={dish.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
            <p className="eyebrow">{dish.pieces ?? 'To share'}{dish.tags.includes('signature') ? ' · Signature' : ''}</p>
            <h3 className="susan-name">{dish.name}{dish.cn && <span className="cn">{dish.cn}</span>}</h3>
            <p className="susan-blurb">{dish.blurb}</p>
            <div className="tag-row">{dish.tags.map((t) => <span key={t} className={`tag tag--${t}`}>{t === 'veg' ? 'Vegetarian' : t}</span>)}</div>
            <div className="susan-buy">
              <span className="price-lg">{ksh(dish.price)}</span>
              <button className="btn btn-fill" onClick={() => add({ key: dish.id, kind: 'dish', refId: dish.id, name: dish.name, image: dish.image, unit: dish.price, meta: dish.pieces })}>
                Add to table <Icon.plus />
              </button>
              <Link to={`/dish/${dish.id}`} className="link-underline">Details</Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
