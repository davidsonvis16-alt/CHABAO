// All menu content, prices (KES) and business details live here — edit once, the whole site updates.

export type Tag = 'veg' | 'spicy' | 'signature' | 'new';
export type CategoryId = 'bao' | 'dimsum' | 'small' | 'fire' | 'bowls' | 'sweet';

export interface Dish {
  id: string;
  name: string;
  cn?: string;
  category: CategoryId;
  price: number;
  blurb: string;
  long: string;
  image: string;
  tags: Tag[];
  pieces?: string;
  pairsWith?: string; // tea id
}

export interface Tea {
  id: string;
  name: string;
  cn: string;
  origin: string;
  notes: string;
  tempC: number;
  steepSec: number;
  image: string;
  cupPrice: number;
  packs: { grams: number; price: number }[];
}

export const BUSINESS = {
  name: 'Cha Bao',
  tagline: 'Modern Asian Bistro',
  city: 'Nairobi, Kenya',
  address: 'Nairobi, Kenya',
  phone: '+254 700 000 000',
  whatsapp: '254700000000',
  email: 'hello@chabao.co.ke',
  instagram: 'https://www.instagram.com/chabaokenya/',
  mapQuery: 'Cha Bao Modern Asian Bistro Nairobi',
  opened: '09 · 10 · 26',
  hours: [
    { days: [1, 2, 3, 4], label: 'Mon – Thu', open: '12:00', close: '22:30' },
    { days: [5, 6], label: 'Fri – Sat', open: '12:00', close: '23:30' },
    { days: [0], label: 'Sunday', open: '12:00', close: '22:00' },
  ],
};

export const CATEGORIES: { id: CategoryId; name: string; cn: string; line: string }[] = [
  { id: 'bao', name: 'Bao', cn: '包', line: 'Pillow-soft, steamed to order' },
  { id: 'dimsum', name: 'Dim Sum', cn: '点心', line: 'Hand-folded every morning' },
  { id: 'small', name: 'Small Plates', cn: '小菜', line: 'For the middle of the table' },
  { id: 'fire', name: 'From the Fire', cn: '火', line: 'Glazed, torched, finished at the pass' },
  { id: 'bowls', name: 'Bowls & Rice', cn: '饭', line: 'The comfort course' },
  { id: 'sweet', name: 'Sweet', cn: '甜', line: 'A soft landing' },
];

export const DISHES: Dish[] = [
  { id: 'pork-belly-bao', name: 'Sticky Pork Belly Bao', cn: '叉烧包', category: 'bao', price: 950, pieces: '2 pcs', tags: ['signature'], image: '/images/dishes/pork-belly-bao.jpg', pairsWith: 'oolong',
    blurb: 'Twelve-hour belly, hoisin, cucumber, peanut crumb.', long: 'Pork belly braised low and slow for twelve hours, lacquered in house hoisin and tucked into a steamed bao with crisp cucumber, pickled shallot and crushed roasted peanut.' },
  { id: 'chicken-bao', name: 'Crispy Chicken Bao', category: 'bao', price: 850, pieces: '2 pcs', tags: ['spicy'], image: '/images/dishes/chicken-bao.jpg', pairsWith: 'jasmine',
    blurb: 'Gochujang mayo, sesame slaw, spring onion.', long: 'Buttermilk-brined thigh fried until it shatters, brushed with gochujang mayo and stacked with a sharp sesame slaw.' },
  { id: 'mushroom-bao', name: 'Tempura Mushroom Bao', category: 'bao', price: 800, pieces: '2 pcs', tags: ['veg'], image: '/images/dishes/mushroom-bao.jpg', pairsWith: 'genmaicha',
    blurb: 'Oyster mushroom, miso aioli, pickled radish.', long: 'Oyster mushrooms in a whisper-light tempura batter, miso aioli, pickled daikon and a scatter of fresh coriander.' },
  { id: 'beef-bao', name: 'Five-Spice Beef Bao', category: 'bao', price: 950, pieces: '2 pcs', tags: ['new'], image: '/images/dishes/beef-bao.jpg', pairsWith: 'purple',
    blurb: 'Braised short rib, black vinegar, crispy shallot.', long: 'Short rib braised with star anise and cassia, finished with a glossy black vinegar reduction and crispy shallots.' },

  { id: 'har-gow', name: 'Prawn Har Gow', cn: '虾饺', category: 'dimsum', price: 1100, pieces: '4 pcs', tags: ['signature'], image: '/images/dishes/har-gow.jpg', pairsWith: 'jasmine',
    blurb: 'Translucent crystal skin, whole prawn, bamboo shoot.', long: 'The test of any dim sum kitchen: a crystal-thin wheat-starch skin, pleated by hand around sweet prawn and bamboo shoot.' },
  { id: 'siu-mai', name: 'Chicken & Ginger Siu Mai', cn: '烧卖', category: 'dimsum', price: 950, pieces: '4 pcs', tags: [], image: '/images/dishes/siu-mai.jpg', pairsWith: 'oolong',
    blurb: 'Open-top dumplings, shiitake, tobiko.', long: 'Open-topped dumplings of minced chicken, ginger and shiitake, crowned with tobiko.' },
  { id: 'edamame-dumpling', name: 'Truffle Edamame Dumplings', category: 'dimsum', price: 950, pieces: '4 pcs', tags: ['veg', 'new'], image: '/images/dishes/edamame-dumpling.jpg', pairsWith: 'genmaicha',
    blurb: 'Edamame, truffle oil, spinach skin.', long: 'A bright green spinach-dough parcel of crushed edamame and a touch of truffle — our most-photographed dumpling.' },
  { id: 'chilli-wontons', name: 'Chilli Oil Wontons', cn: '红油抄手', category: 'dimsum', price: 900, pieces: '6 pcs', tags: ['spicy'], image: '/images/dishes/chilli-wontons.jpg', pairsWith: 'purple',
    blurb: 'Pork & prawn, Sichuan chilli oil, black vinegar.', long: 'Silky wontons sitting in a pool of house Sichuan chilli oil, black vinegar and garlic. Numbing, warming, addictive.' },

  { id: 'squid', name: 'Salt & Pepper Squid', category: 'small', price: 1200, tags: ['signature'], image: '/images/dishes/squid.jpg', pairsWith: 'jasmine',
    blurb: 'Five-spice salt, fried chilli, lime.', long: 'Tender squid in a feather-light crust, tossed with five-spice salt, fried garlic and bird’s-eye chilli.' },
  { id: 'cucumber', name: 'Smashed Cucumber', category: 'small', price: 550, tags: ['veg'], image: '/images/dishes/cucumber.jpg', pairsWith: 'genmaicha',
    blurb: 'Black vinegar, garlic, toasted sesame.', long: 'Cold, crunchy and sharp — the palate reset every table needs.' },
  { id: 'cauliflower', name: 'Korean Fried Cauliflower', category: 'small', price: 750, tags: ['veg', 'spicy'], image: '/images/dishes/cauliflower.jpg', pairsWith: 'oolong',
    blurb: 'Gochujang glaze, sesame, spring onion.', long: 'Double-fried florets in a sticky, sweet-hot gochujang glaze.' },
  { id: 'tuna-tataki', name: 'Tuna Tataki', category: 'small', price: 1500, tags: ['new'], image: '/images/dishes/tuna-tataki.jpg', pairsWith: 'jasmine',
    blurb: 'Seared tuna, ponzu, crispy garlic.', long: 'Seared for seconds, sliced thin and dressed with yuzu ponzu and crisp garlic chips.' },

  { id: 'sweet-potato', name: 'Torched Sweet Potato', category: 'fire', price: 1300, tags: ['veg', 'signature'], image: '/images/dishes/torched-sweet-potato.jpg', pairsWith: 'oolong',
    blurb: 'Teriyaki glaze, wilted greens, garlic chips.', long: 'Thick rounds of sweet potato, lacquered in teriyaki and torched at the pass until the glaze blisters — served over wilted greens and garlic chips.' },
  { id: 'nile-perch', name: 'Miso-Glazed Nile Perch', category: 'fire', price: 2400, tags: ['signature'], image: '/images/dishes/nile-perch.jpg', pairsWith: 'jasmine',
    blurb: 'Lake Victoria perch, white miso, pickled ginger.', long: 'Our Nairobi answer to the classic: Lake Victoria perch marinated for two days in sweet white miso, finished under the flame.' },
  { id: 'szechuan-beef', name: 'Szechuan Pepper Beef', category: 'fire', price: 2200, tags: ['spicy'], image: '/images/dishes/szechuan-beef.jpg', pairsWith: 'purple',
    blurb: 'Wok-charred sirloin, dried chilli, peppercorn.', long: 'Sirloin seared hard in a smoking wok with dried chillies and tingling Sichuan peppercorn.' },

  { id: 'kimchi-rice', name: 'Kimchi Fried Rice', category: 'bowls', price: 1100, tags: ['spicy'], image: '/images/dishes/kimchi-rice.jpg', pairsWith: 'genmaicha',
    blurb: 'Fried egg, gochugaru, toasted seaweed.', long: 'Day-old rice, house kimchi and a runny fried egg on top. Break it, mix it, share it.' },
  { id: 'green-curry', name: 'Thai Green Curry', category: 'bowls', price: 1900, tags: [], image: '/images/dishes/green-curry.jpg', pairsWith: 'jasmine',
    blurb: 'Chicken, Thai basil, jasmine rice.', long: 'Fragrant green curry with coconut, Thai basil and tender chicken thigh. Served with jasmine rice.' },
  { id: 'dan-dan', name: 'Dan Dan Noodles', cn: '担担面', category: 'bowls', price: 1400, tags: ['spicy', 'new'], image: '/images/dishes/dan-dan.jpg', pairsWith: 'purple',
    blurb: 'Pork mince, sesame, chilli oil, pak choi.', long: 'Hand-pulled noodles in sesame-chilli sauce with crisp pork mince and blanched pak choi.' },

  { id: 'matcha-cheesecake', name: 'Matcha Basque Cheesecake', category: 'sweet', price: 850, tags: ['veg', 'signature'], image: '/images/dishes/matcha-cheesecake.jpg', pairsWith: 'genmaicha',
    blurb: 'Burnt top, molten matcha middle.', long: 'Baked hot until the top caramelises, with a soft, just-set ceremonial matcha centre.' },
  { id: 'sesame-ice-cream', name: 'Black Sesame Ice Cream', category: 'sweet', price: 650, tags: ['veg'], image: '/images/dishes/sesame-ice-cream.jpg', pairsWith: 'oolong',
    blurb: 'Toasted sesame, honey tuile.', long: 'Nutty, smoky black sesame churned in-house, with a thin honey tuile.' },
  { id: 'mango-rice', name: 'Mango Sticky Rice', category: 'sweet', price: 750, tags: ['veg'], image: '/images/dishes/mango-sticky-rice.jpg', pairsWith: 'jasmine',
    blurb: 'Coconut cream, toasted mung bean.', long: 'Ripe Kenyan mango over warm coconut sticky rice.' },
];

export const TEAS: Tea[] = [
  { id: 'jasmine', name: 'Jasmine Pearls', cn: '茉莉龙珠', origin: 'Fujian, China', notes: 'Floral, honeyed, clean finish', tempC: 80, steepSec: 150, image: '/images/tea/jasmine.jpg', cupPrice: 450,
    packs: [{ grams: 50, price: 1200 }, { grams: 100, price: 2200 }] },
  { id: 'oolong', name: 'Roasted Oolong', cn: '乌龙', origin: 'Anxi, China', notes: 'Toasted nuts, stone fruit, long sweetness', tempC: 95, steepSec: 60, image: '/images/tea/oolong.jpg', cupPrice: 450,
    packs: [{ grams: 50, price: 1400 }, { grams: 100, price: 2600 }] },
  { id: 'purple', name: 'Kenyan Purple Tea', cn: '紫茶', origin: 'Nandi Hills, Kenya', notes: 'Earthy, plummy, gently astringent', tempC: 85, steepSec: 180, image: '/images/tea/purple.jpg', cupPrice: 400,
    packs: [{ grams: 50, price: 950 }, { grams: 100, price: 1750 }] },
  { id: 'genmaicha', name: 'Genmaicha', cn: '玄米茶', origin: 'Shizuoka, Japan', notes: 'Toasted rice, grassy, savoury', tempC: 80, steepSec: 90, image: '/images/tea/genmaicha.jpg', cupPrice: 400,
    packs: [{ grams: 50, price: 1100 }, { grams: 100, price: 2000 }] },
];

export const ZONES = [
  { id: 'westlands', name: 'Westlands', fee: 200, eta: '25–35' },
  { id: 'parklands', name: 'Parklands', fee: 250, eta: '30–40' },
  { id: 'kilimani', name: 'Kilimani', fee: 250, eta: '30–40' },
  { id: 'lavington', name: 'Lavington', fee: 300, eta: '35–45' },
  { id: 'cbd', name: 'CBD', fee: 300, eta: '35–45' },
  { id: 'kileleshwa', name: 'Kileleshwa', fee: 300, eta: '35–45' },
  { id: 'runda', name: 'Runda / Gigiri', fee: 450, eta: '45–60' },
  { id: 'karen', name: 'Karen', fee: 550, eta: '50–65' },
];

export const PROMOS: Record<string, number> = { CHABAO10: 0.1, NEWCHAPTER: 0.15 };

export const SPICE = ['None', 'Mild', 'Hot', 'Sichuan'];
export const ADDONS = [
  { id: 'extra-bao', name: 'Extra bao bun', price: 200 },
  { id: 'chilli-oil', name: 'House chilli oil', price: 150 },
  { id: 'pickles', name: 'Pickle plate', price: 250 },
];

export const dishById = (id: string) => DISHES.find((d) => d.id === id);
export const teaById = (id: string) => TEAS.find((t) => t.id === id);
export const ksh = (n: number) => 'KSh ' + n.toLocaleString('en-KE');

export function hoursFor(day: number) {
  return BUSINESS.hours.find((h) => h.days.includes(day));
}
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function openStatus(now = new Date()) {
  const d = now.getDay(), m = now.getHours() * 60 + now.getMinutes(), h = hoursFor(d);
  if (h && m >= toMin(h.open) && m < toMin(h.close)) return { open: true, text: `Open now · until ${h.close}` };
  if (h && m < toMin(h.open)) return { open: false, text: `Opens today at ${h.open}` };
  for (let i = 1; i <= 7; i++) {
    const nd = (d + i) % 7, nh = hoursFor(nd);
    if (nh) return { open: false, text: `Closed · opens ${i === 1 ? 'tomorrow' : DAY_NAMES[nd]} at ${nh.open}` };
  }
  return { open: false, text: 'Closed' };
}
export function timeSlots(date: Date, leadMin = 45) {
  const h = hoursFor(date.getDay());
  if (!h) return [];
  const out: string[] = [];
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const nowMin = now.getHours() * 60 + now.getMinutes() + leadMin;
  for (let t = toMin(h.open); t <= toMin(h.close) - 60; t += 30) {
    if (isToday && t < nowMin) continue;
    out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
  }
  return out;
}
