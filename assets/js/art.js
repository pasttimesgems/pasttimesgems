// Studio renders used for demo products and for any product that has no
// photo yet. Image references of the form "art:<kind>:<n>" resolve here.
// The images are made by tools/render.html from assets/js/jewels3d.js.

const COUNTS = { gems: 6, pearls: 4, jewellery: 4 };

export function artUrl(kind, variant = 0) {
  const k = COUNTS[kind] ? kind : 'jewellery';
  const n = COUNTS[k], i = ((Number(variant) || 0) % n + n) % n;
  return `assets/art/${k}-${i}.webp`;
}

// Turn a stored image reference into something an <img> can show.
export function imageSrc(product) {
  const ref = product?.image_url || '';
  if (ref.startsWith('art:')) {
    const [, kind, variant] = ref.split(':');
    return artUrl(kind, variant);
  }
  if (ref) return ref;
  const seed = [...String(product?.id || product?.name || '')].reduce((a, c) => a + c.charCodeAt(0), 0);
  return artUrl(product?.category, seed);
}
