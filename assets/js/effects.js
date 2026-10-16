// Motion for the showroom: the short opening, scroll reveals and the small
// light flashes when a piece is added or saved.

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const FLASH = ['#fff8ea', '#f1dca6', '#d9b56c'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function sparkle(x, y, n = 8, spread = 60) {
  if (reducedMotion) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    s.style.background = pick(FLASH);
    const ang = Math.random() * Math.PI * 2, dist = spread * (.4 + Math.random() * .6);
    s.style.left = `${x}px`; s.style.top = `${y}px`;
    s.style.setProperty('--tx', `${Math.cos(ang) * dist}px`);
    s.style.setProperty('--ty', `${Math.sin(ang) * dist}px`);
    const size = 4 + Math.random() * 6;
    s.style.width = s.style.height = `${size}px`;
    document.body.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  }
}

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' })
  : null;

export function reveal(els) {
  for (const el of els) io ? io.observe(el) : el.classList.add('in');
}

// Opening, once per visit and about a second long. Resolves as the page appears.
export function playIntro(intro) {
  const root = document.documentElement;
  return new Promise((resolve) => {
    if (!intro || !root.classList.contains('intro-on')) { intro?.remove(); resolve(); return; }
    try { sessionStorage.setItem('ptg-intro', '1'); } catch { /* storage blocked */ }
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      intro.classList.add('open');
      root.classList.remove('intro-on');
      resolve();
      setTimeout(() => intro.remove(), 700);
    };
    intro.addEventListener('click', finish);
    requestAnimationFrame(() => intro.classList.add('play'));
    const timer = setTimeout(finish, 1300);
  });
}
