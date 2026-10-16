// Motion for the showroom: sections slide in, the hero has a light parallax and product images get a jeweller's loupe.

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' })
  : null;

export function reveal(els) {
  for (const el of els) io ? io.observe(el) : el.classList.add('in');
}

// Hero parallax: layers marked data-speed drift at their own pace and the
// hero copy eases out as the page scrolls past it.
export function parallax(hero) {
  if (!hero || reducedMotion) return;
  const layers = [...hero.querySelectorAll('[data-speed]')];
  const inner = hero.querySelector('.hero-inner');
  let queued = false;
  const paint = () => {
    queued = false;
    const y = scrollY, h = hero.offsetHeight;
    if (y > h * 1.2) return;
    for (const el of layers) el.style.transform = `translate3d(0, ${(y * el.dataset.speed).toFixed(1)}px, 0)`;
    if (inner) {
      const p = Math.min(y / h, 1);
      inner.style.transform = `translate3d(0, ${(y * .28).toFixed(1)}px, 0)`;
      inner.style.opacity = (1 - p * 1.25).toFixed(3);
    }
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
  paint();
}

// Jeweller's loupe: on a mouse, a gold-rimmed lens follows the pointer over
// product images and shows the piece magnified.
export function loupe(selector) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const lens = document.createElement('div');
  lens.className = 'loupe';
  lens.setAttribute('aria-hidden', 'true');
  document.body.append(lens);
  const ZOOM = 2.4, SIZE = 170;
  let img = null;
  addEventListener('pointermove', (e) => {
    const hit = e.target.closest?.(selector);
    const el = hit && (hit.tagName === 'IMG' ? hit : hit.querySelector('img'));
    if (!el || !el.complete) { if (img) { img = null; lens.classList.remove('on'); } return; }
    const r = el.getBoundingClientRect();
    if (img !== el) {
      img = el;
      lens.style.backgroundImage = `url("${el.currentSrc || el.src}")`;
      lens.style.backgroundSize = `${r.width * ZOOM}px ${r.height * ZOOM}px`;
      lens.classList.add('on');
    }
    const x = e.clientX - r.left, y = e.clientY - r.top;
    lens.style.transform = `translate3d(${e.clientX - SIZE / 2}px, ${e.clientY - SIZE / 2}px, 0)`;
    lens.style.backgroundPosition = `${SIZE / 2 - x * ZOOM}px ${SIZE / 2 - y * ZOOM}px`;
  }, { passive: true });
  addEventListener('scroll', () => { img = null; lens.classList.remove('on'); }, { passive: true });
}
