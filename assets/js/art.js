// Placeholder for pieces that have no photo yet: an engraved gold medallion
// with a line drawing of the category. Real photos uploaded in the admin page
// replace it.

import { ring, circle } from './guilloche.js';

const ICONS = {
  // A pearl with its highlight.
  pearls: '<circle r="46"/><path d="M-26 -18a32 32 0 0 1 22-20"/>',
  // A cut stone seen from the side: table, crown and pavilion facets.
  gems: '<path d="M-52 -14L-30 -40H30L52 -14L0 46Z M-52 -14H52 M-30 -40L-14 -14L0 -40L14 -14L30 -40 M-14 -14L0 46L14 -14"/>',
  // A ring with a raised stone.
  jewellery: '<ellipse cy="16" rx="44" ry="40"/><path d="M-16 -24L-8 -40H8L16 -24Z"/>',
};
const WAVES = [18, 22, 26, 30];
const cache = new Map();

export function artUrl(kind, variant = 0) {
  const k = ICONS[kind] ? kind : 'jewellery';
  const v = ((Number(variant) || 0) % WAVES.length + WAVES.length) % WAVES.length;
  const key = `${k}:${v}`;
  if (!cache.has(key)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-300 -300 600 600">
      <rect x="-300" y="-300" width="600" height="600" fill="#12110f"/>
      <g fill="none" stroke="#cfaa5f" stroke-width="1" opacity=".42">
        <path d="${circle(196) + circle(190)}"/>
        <path d="${ring({ R: 160, amp: 16, waves: WAVES[v], copies: 8, steps: 300 })}"/>
        <path d="${circle(126)}"/>
      </g>
      <g fill="none" stroke="#f4efe8" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">${ICONS[k]}</g>
    </svg>`;
    cache.set(key, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  }
  return cache.get(key);
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
