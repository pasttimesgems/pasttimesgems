// Hand-drawn SVG artwork used for demo products and for any product that has
// no photo yet. Image URLs of the form "art:<kind>:<variant>" resolve here.

const GEM_TONES = [
  ['#0f7a5a', '#38d39f', '#b9ffe4'], // emerald
  ['#163a8c', '#3f7bff', '#c8dbff'], // sapphire
  ['#8a1030', '#e0335a', '#ffc2cf'], // ruby
  ['#4b237a', '#9b5de5', '#e6d2ff'], // amethyst
  ['#8a5a00', '#f2b134', '#fff0c2'], // citrine
  ['#0d5c6e', '#34c3d9', '#cff7ff'], // aquamarine
];

const PEARL_TONES = [
  ['#fbf7ef', '#e8dfd1', '#a79c8e'], // white
  ['#fff1ea', '#f1d2c6', '#b58f84'], // rosé
  ['#fdf4dc', '#ecd8a4', '#a8894b'], // golden
  ['#e9eef2', '#b9c3cc', '#5e6a75'], // tahitian silver
];

const bg = (id, a, b) => `
  <defs>
    <radialGradient id="bg${id}" cx="50%" cy="38%" r="75%">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg${id})"/>`;

function gem(v) {
  const [d, m, l] = GEM_TONES[v % GEM_TONES.length];
  return `${bg('g', '#15333f', '#05121a')}
  <defs>
    <linearGradient id="f1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${l}"/><stop offset="1" stop-color="${m}"/></linearGradient>
    <linearGradient id="f2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m}"/><stop offset="1" stop-color="${d}"/></linearGradient>
  </defs>
  <ellipse cx="200" cy="318" rx="104" ry="14" fill="#000" opacity=".35"/>
  <g stroke="${l}" stroke-opacity=".55" stroke-width="1.2" stroke-linejoin="round">
    <polygon points="110,150 150,105 250,105 290,150 200,300" fill="url(#f2)"/>
    <polygon points="150,105 250,105 230,150 170,150" fill="url(#f1)"/>
    <polygon points="110,150 150,105 170,150" fill="${m}"/>
    <polygon points="290,150 250,105 230,150" fill="${d}"/>
    <polygon points="110,150 170,150 200,300" fill="${m}" opacity=".9"/>
    <polygon points="170,150 230,150 200,300" fill="url(#f1)" opacity=".85"/>
    <polygon points="230,150 290,150 200,300" fill="${d}"/>
  </g>
  <path d="M160 112 L182 112 L172 142 Z" fill="#fff" opacity=".7"/>
  <circle cx="262" cy="98" r="3" fill="#fff"/><path d="M262 84v28M248 98h28" stroke="#fff" stroke-width="1.2" opacity=".8"/>`;
}

function pearl(v) {
  const [l, m, d] = PEARL_TONES[v % PEARL_TONES.length];
  return `${bg('p', '#163846', '#061219')}
  <defs>
    <radialGradient id="pr" cx="36%" cy="32%" r="70%">
      <stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="${l}"/>
      <stop offset=".7" stop-color="${m}"/><stop offset="1" stop-color="${d}"/>
    </radialGradient>
    <linearGradient id="ir" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffc6e4" stop-opacity=".35"/><stop offset=".5" stop-color="#bfe6ff" stop-opacity=".25"/>
      <stop offset="1" stop-color="#d6ffd9" stop-opacity=".3"/>
    </linearGradient>
  </defs>
  <path d="M40 120 Q200 250 360 120" fill="none" stroke="#c9a45c" stroke-width="1.5" opacity=".6"/>
  ${[60, 100, 140, 180, 220, 260, 300, 340].map((x, i) => {
    const y = 120 + Math.sin((i / 7) * Math.PI) * 63;
    return `<circle cx="${x}" cy="${y}" r="12" fill="url(#pr)"/>`;
  }).join('')}
  <ellipse cx="200" cy="320" rx="80" ry="12" fill="#000" opacity=".35"/>
  <circle cx="200" cy="245" r="70" fill="url(#pr)"/>
  <circle cx="200" cy="245" r="70" fill="url(#ir)"/>
  <ellipse cx="176" cy="216" rx="18" ry="11" fill="#fff" opacity=".75" transform="rotate(-30 176 216)"/>`;
}

function jewel(v) {
  const stone = GEM_TONES[(v + 2) % GEM_TONES.length];
  return `${bg('j', '#173b45', '#061219')}
  <defs>
    <linearGradient id="gd" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff1c7"/><stop offset=".45" stop-color="#d8b06a"/><stop offset="1" stop-color="#7c5a22"/>
    </linearGradient>
  </defs>
  <ellipse cx="200" cy="320" rx="110" ry="14" fill="#000" opacity=".35"/>
  <ellipse cx="200" cy="232" rx="104" ry="78" fill="none" stroke="url(#gd)" stroke-width="18"/>
  <ellipse cx="200" cy="232" rx="104" ry="78" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
  <path d="M168 160 L180 132 L220 132 L232 160 Z" fill="url(#gd)"/>
  <polygon points="170,132 186,104 214,104 230,132 200,160" fill="${stone[1]}" stroke="${stone[2]}" stroke-width="1.2"/>
  <polygon points="186,104 214,104 206,124 194,124" fill="${stone[2]}" opacity=".8"/>
  <circle cx="232" cy="100" r="2.5" fill="#fff"/><path d="M232 88v24M220 100h24" stroke="#fff" stroke-width="1" opacity=".8"/>`;
}

const KINDS = { gems: gem, pearls: pearl, jewellery: jewel };

export function artSvg(kind, variant = 0) {
  const draw = KINDS[kind] || jewel;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">${draw(Number(variant) || 0)}</svg>`;
}

export function artUrl(kind, variant) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(artSvg(kind, variant));
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
