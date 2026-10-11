import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ksh, type Dish } from '../data/menu';
import { useCart } from '../store/cart';
import { Img } from './Img';
import { Icon } from './Drawings';

/** A dish served as a round plate with its name curving along the rim. */
export function PlateCard({ dish, index }: { dish: Dish; index: number }) {
  const { add } = useCart();
  const pathId = `rim-${dish.id}`;
  return (
    <motion.article
      className="plate-card"
      layout
      initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.04 }}
    >
      <Link to={`/dish/${dish.id}`} className="plate-link" aria-label={dish.name}>
        <svg className="plate-rim" viewBox="0 0 300 300" aria-hidden>
          <defs><path id={pathId} d="M150 150 m-132 0 a132 132 0 1 1 264 0 a132 132 0 1 1 -264 0" /></defs>
          <text><textPath href={`#${pathId}`} startOffset="2%">{`${dish.name.toUpperCase()}  ·  ${ksh(dish.price)}  ·  ${dish.blurb.toUpperCase()}`}</textPath></text>
        </svg>
        <Img src={dish.image} alt={dish.name} className="plate-img" />
        {dish.tags.includes('signature') && <span className="plate-seal">招牌</span>}
      </Link>
      <div className="plate-meta">
        <h3>{dish.name}</h3>
        <p className="muted">{dish.blurb}</p>
        <div className="plate-foot">
          <span className="price">{ksh(dish.price)}</span>
          <button className="add-dot" onClick={() => add({ key: dish.id, kind: 'dish', refId: dish.id, name: dish.name, image: dish.image, unit: dish.price, meta: dish.pieces })} aria-label={`Add ${dish.name}`}>
            <Icon.plus />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
