// Sample pieces shown in demo mode (before Supabase is connected).
// Dates are relative to today so the demo reports always have recent activity.
const DAY = 864e5;
const ago = (days, hour = 11) => { const d = new Date(Date.now() - days * DAY); d.setHours(hour, 15, 0, 0); return d.toISOString(); };
const day = (n) => ago(60 - n * 2);

export const DEMO_PRODUCTS = [
  { id: 'demo-1', name: 'Gulf Natural Pearl Strand', name_ar: 'عقد لؤلؤ الخليج الطبيعي', description_ar: 'عقد من لؤلؤ طبيعي منتقى يدوياً ببريق كريمي ناعم، مع قفل ذهبي منقوش.', category: 'pearls', price: 18500, status: 'available', featured: true, visible: true,
    material: 'Natural saltwater pearls, 18k gold clasp', weight: '7–8 mm, 42 cm', origin: 'Arabian Gulf',
    description: 'A single strand of hand-matched natural pearls with a soft cream lustre, finished with an engraved gold clasp.',
    image_url: 'art:pearls:0', created_at: day(14) },
  { id: 'demo-2', name: 'Colombian Emerald, Step Cut', name_ar: 'زمرد كولومبي، قطع مدرّج', description_ar: 'أخضر عميق بتوهج مخملي، مع تقرير مختبر الأحجار الكريمة.', category: 'gems', price: 12400, status: 'available', featured: true, visible: true,
    material: 'Loose emerald', weight: '2.1 ct', origin: 'Colombia',
    description: 'Deep green with a velvety glow. Supplied with a gemmological report.',
    image_url: 'art:gems:0', created_at: day(13) },
  { id: 'demo-3', name: 'Sapphire Solitaire Ring', name_ar: 'خاتم ياقوت أزرق منفرد', description_ar: 'ياقوت أزرق صافٍ على حلقة ذهبية رفيعة. تعديل المقاس متاح عند الطلب.', category: 'jewellery', price: 9800, status: 'available', featured: true, visible: true,
    material: '18k yellow gold', weight: '1.4 ct sapphire', origin: 'Sri Lanka',
    description: 'A cornflower-blue sapphire raised on a slim gold band. Sizing available on request.',
    image_url: 'art:jewellery:0', created_at: day(12) },
  { id: 'demo-4', name: 'Rosé Baroque Pearl Drop', name_ar: 'قلادة لؤلؤة باروك وردية', description_ar: 'لؤلؤة باروك طبيعية الشكل بلمسات وردية، معلّقة بذهب وردي رقيق.', category: 'pearls', price: 2350, status: 'available', featured: false, visible: true,
    material: 'Freshwater baroque pearl, 18k rose gold', weight: '11 mm', origin: 'Cultured',
    description: 'An organic baroque pearl with pink overtones, hung from a fine rose-gold bail.',
    image_url: 'art:pearls:1', created_at: day(11) },
  { id: 'demo-5', name: 'Burmese Ruby', name_ar: 'ياقوت أحمر بورمي', description_ar: 'أحمر زاهٍ بتوهج دافئ. محجوزة حالياً، اسأل لتنضم إلى قائمة الانتظار.', category: 'gems', price: 15900, status: 'reserved', featured: false, visible: true,
    material: 'Loose ruby, oval', weight: '1.6 ct', origin: 'Myanmar',
    description: 'Vivid red with warm fluorescence. Currently reserved; ask to join the waiting list.',
    image_url: 'art:gems:2', created_at: day(10) },
  { id: 'demo-6', name: 'Amethyst Cocktail Ring', name_ar: 'خاتم جمشت فاخر', description_ar: 'حجر بنفسجي جريء في إطار من الذهب الأبيض المصقول.', category: 'jewellery', price: 3200, status: 'available', featured: false, visible: true,
    material: '18k white gold', weight: '6 ct amethyst', origin: 'Brazil',
    description: 'A bold violet centre stone framed in polished white gold.',
    image_url: 'art:jewellery:1', created_at: day(9) },
  { id: 'demo-7', name: 'Golden South Sea Pearl', name_ar: 'لؤلؤة ذهبية من البحار الجنوبية', description_ar: 'لؤلؤة ذهبية غنية ببريق كالمرآة، جاهزة لتُصاغ حسب تصميمك.', category: 'pearls', price: 6400, status: 'available', featured: false, visible: true,
    material: 'Loose South Sea pearl', weight: '13 mm', origin: 'Philippines',
    description: 'A rich golden pearl with mirror-like lustre, ready to be set to your design.',
    image_url: 'art:pearls:2', created_at: day(8) },
  { id: 'demo-8', name: 'Aquamarine, Emerald Cut', name_ar: 'أكوامارين، قطع زمردي', description_ar: 'أزرق بحري صافٍ، هادئ كالكورنيش عند الفجر.', category: 'gems', price: 4100, status: 'available', featured: false, visible: true,
    material: 'Loose aquamarine', weight: '4.3 ct', origin: 'Brazil',
    description: 'Clear sea-blue, as calm as the Corniche at dawn.',
    image_url: 'art:gems:5', created_at: day(7) },
  { id: 'demo-9', name: 'Citrine Signet', name_ar: 'خاتم سيترين بختم', description_ar: 'خاتم بطابع تراثي مع حجر سيترين بلون العسل.', category: 'jewellery', price: 2800, status: 'sold', featured: false, visible: true,
    material: '21k gold', weight: '3 ct citrine', origin: 'Brazil',
    description: 'A heritage-style signet with a honey-gold citrine.',
    image_url: 'art:jewellery:2', created_at: day(6) },
  { id: 'demo-10', name: 'Tahitian Pearl Studs', name_ar: 'أقراط لؤلؤ تاهيتي', description_ar: 'لؤلؤ رمادي فضي بلمسات كريش الطاووس، فخامة هادئة لكل يوم.', category: 'pearls', price: 3650, status: 'available', featured: false, visible: true,
    material: 'Tahitian pearls, 18k white gold posts', weight: '9 mm pair', origin: 'French Polynesia',
    description: 'Silver-grey pearls with peacock overtones, a quiet everyday luxury.',
    image_url: 'art:pearls:3', created_at: day(5) },
];

// Inventory for the demo: pieces in stock, item codes, low-stock levels and cost prices.
const STOCK = { 'demo-1': 1, 'demo-2': 2, 'demo-3': 3, 'demo-4': 4, 'demo-5': 1, 'demo-6': 2, 'demo-7': 1, 'demo-8': 3, 'demo-9': 0, 'demo-10': 5 };
DEMO_PRODUCTS.forEach((p, i) => Object.assign(p, {
  stock: STOCK[p.id], low_stock: p.id === 'demo-10' ? 2 : 1, sku: `PTG-${String(i + 1).padStart(4, '0')}`,
}));
export const DEMO_COSTS = Object.fromEntries(DEMO_PRODUCTS.map((p) => [p.id, Math.round(p.price * 0.62)]));

// Sales over the last month, so the reports have something to show.
const SALES = [
  ['demo-4', 'sold', 1, 0], ['demo-10', 'sold', 2, 1], ['demo-2', 'sold', 1, 2], ['demo-6', 'sold', 1, 4],
  ['demo-9', 'sold', 1, 6], ['demo-10', 'returned', 1, 6], ['demo-3', 'sold', 1, 9], ['demo-8', 'sold', 1, 13],
  ['demo-4', 'sold', 1, 20], ['demo-1', 'sold', 1, 26], ['demo-7', 'corrected', 1, 3],
];

export function demoMovements() {
  const byId = Object.fromEntries(DEMO_PRODUCTS.map((p) => [p.id, p]));
  const change = (kind, qty) => (kind === 'sold' ? -qty : qty);
  // Work out the starting stock so the history ends at today's count.
  const start = { ...STOCK };
  for (const [id, kind, qty] of SALES) if (kind !== 'corrected') start[id] -= change(kind, qty);
  const moves = DEMO_PRODUCTS.map((p) => ({ product_id: p.id, kind: 'added', qty: start[p.id], at: p.created_at }));
  for (const [id, kind, qty, d] of SALES) moves.push({ product_id: id, kind, qty, at: ago(d, 10 + (d % 7)) });
  moves.sort((a, b) => a.at.localeCompare(b.at));
  const level = {};
  return moves.map((m, i) => {
    const p = byId[m.product_id];
    const before = level[p.id] ?? 0;
    const ch = m.kind === 'corrected' ? m.qty - before : change(m.kind, m.qty);
    level[p.id] = before + ch;
    return {
      id: i + 1, product_id: p.id, product_name: p.name, sku: p.sku, kind: m.kind, qty: m.qty, change: ch,
      stock_after: level[p.id], unit_price: p.price, unit_cost: m.kind === 'added' ? null : DEMO_COSTS[p.id],
      note: m.kind === 'corrected' ? 'Counted the tray' : null, by_email: 'demo@pasttimesgems', created_at: m.at,
    };
  });
}

