// Motion for the showroom: the galaxy background, sliding reveals and a light hero parallax.

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

// The night sky behind the page: twinkling stars, gold dust, pearls drifting
// slowly upwards and the odd tiny gem catching the light. Kept faint and sparse
// so products and text stay easy to read. Layers move at different speeds as
// the page scrolls, and pearls drift gently towards the mouse or finger.
const GEMS = ['#3fd0a0', '#6b93ff', '#ff6d8c', '#b48cff', '#ffd062'];

function pearlSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(24, 21, 2, 32, 32, 31);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(.25, '#f7f1e8');
  grad.addColorStop(.6, '#ddd1c9');
  grad.addColorStop(.9, '#9c918d');
  grad.addColorStop(1, 'rgba(120, 110, 108, 0)');
  g.fillStyle = grad;
  g.beginPath(); g.arc(32, 32, 31, 0, Math.PI * 2); g.fill();
  const sheen = g.createLinearGradient(14, 14, 52, 52);
  sheen.addColorStop(.45, 'rgba(255, 255, 255, 0)');
  sheen.addColorStop(.65, 'rgba(200, 220, 245, .22)');
  sheen.addColorStop(.8, 'rgba(250, 210, 225, .2)');
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
  g.fillStyle = sheen;
  g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill();
  return c;
}

export function galaxy(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const pearl = pearlSprite();
  let w, h, dpr, stars = [], drift = [];

  const mote = (anywhere) => {
    const kind = Math.random();
    const isPearl = kind < .22, isGem = !isPearl && kind < .4;
    return {
      kind: isPearl ? 'pearl' : isGem ? 'gem' : 'dust',
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 20 + Math.random() * 60,
      r: isPearl ? 3 + Math.random() * 4.5 : isGem ? 1.6 + Math.random() * 1.8 : .5 + Math.random() * 1.1,
      vy: isPearl ? .12 + Math.random() * .22 : .1 + Math.random() * .3,
      depth: isPearl ? .1 + Math.random() * .25 : .05 + Math.random() * .15,
      sway: .2 + Math.random() * .5,
      phase: Math.random() * Math.PI * 2,
      color: GEMS[Math.floor(Math.random() * GEMS.length)],
      a: isPearl ? .3 + Math.random() * .35 : .2 + Math.random() * .35,
      ox: 0, oy: 0, // pull towards the pointer
    };
  };

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const area = w * h;
    stars = Array.from({ length: Math.round(Math.min(150, area / 8500)) }, () => ({
      x: Math.random() * w, y: Math.random() * h * 1.6, r: Math.random() < .9 ? .4 + Math.random() * .7 : 1.1 + Math.random() * .6,
      depth: .02 + Math.random() * .06, phase: Math.random() * Math.PI * 2, speed: .6 + Math.random() * 1.6,
    }));
    drift = Array.from({ length: Math.round(Math.min(36, area / 34000)) }, () => mote(true));
  };

  const gem = (x, y, r, color, alpha) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.shadowColor = color; ctx.shadowBlur = r * 2;
    ctx.beginPath(); // a small cut stone seen from the side: crown and pavilion
    ctx.moveTo(x - r, y - r * .2); ctx.lineTo(x - r * .55, y - r * .75); ctx.lineTo(x + r * .55, y - r * .75);
    ctx.lineTo(x + r, y - r * .2); ctx.lineTo(x, y + r); ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = alpha * .55; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(x - r * .5, y - r * .6); ctx.lineTo(x, y - r * .6); ctx.lineTo(x - r * .2, y - r * .1); ctx.closePath(); ctx.fill();
  };

  const draw = (t, scroll) => {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const y = ((s.y - scroll * s.depth) % (h * 1.6) + h * 1.6) % (h * 1.6);
      if (y > h) continue;
      const tw = .45 + .55 * Math.sin(t * s.speed + s.phase);
      ctx.globalAlpha = .15 + .4 * tw;
      ctx.fillStyle = s.r > 1.1 ? '#fff6dc' : '#ffffff';
      ctx.beginPath(); ctx.arc(s.x, y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    for (const p of drift) {
      const x = p.x + Math.sin(t * p.sway + p.phase) * 14 + p.ox;
      const y = p.y - scroll * p.depth + p.oy;
      if (y < -30 || y > h + 30) continue;
      if (p.kind === 'pearl') {
        ctx.globalAlpha = p.a;
        ctx.drawImage(pearl, x - p.r, y - p.r, p.r * 2, p.r * 2);
      } else if (p.kind === 'gem') {
        gem(x, y, p.r, p.color, p.a * (.55 + .45 * Math.sin(t * 2 + p.phase)));
      } else {
        ctx.globalAlpha = p.a * (.4 + .6 * Math.sin(t * 2.4 + p.phase) ** 2);
        ctx.fillStyle = '#ead39b';
        ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  resize();
  addEventListener('resize', resize);
  if (reducedMotion) { draw(0, 0); return; }

  // Pointer (mouse or finger) that pearls and gems lean towards.
  const pointer = { x: 0, y: 0, on: false };
  const aim = (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true; };
  addEventListener('pointermove', aim, { passive: true });
  addEventListener('pointerdown', aim, { passive: true });
  addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') pointer.on = false; }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.on = false; });
  addEventListener('blur', () => { pointer.on = false; });
  const REACH = 220, PULL = 38;

  let last = performance.now(), t = 0, running = true;
  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(now - last, 50) / 16.7; last = now; t += dt * .016;
    for (const p of drift) {
      let tx = 0, ty = 0;
      if (pointer.on && p.kind !== 'dust') {
        const px = p.x + Math.sin(t * p.sway + p.phase) * 14, py = p.y - scrollY * p.depth;
        const dx = pointer.x - px, dy = pointer.y - py, d = Math.hypot(dx, dy);
        if (d < REACH && d > 1) {
          const k = (1 - d / REACH) * PULL;
          tx = (dx / d) * Math.min(k, d * .6); ty = (dy / d) * Math.min(k, d * .6);
        }
      }
      // ease towards the target, so pearls glide over and settle back
      p.ox += (tx - p.ox) * .045 * dt; p.oy += (ty - p.oy) * .045 * dt;
      p.y -= p.vy * dt;
      if (p.y - scrollY * p.depth < -40) Object.assign(p, mote(false), { y: h + 20 + scrollY * p.depth });
      else if (p.y - scrollY * p.depth > h + 80) p.y -= h + 100;
    }
    draw(t, scrollY);
    requestAnimationFrame(frame);
  };
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(frame); }
  });
  requestAnimationFrame(frame);
}
