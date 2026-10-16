// Ambient motion for the showroom: rising pearl-diver bubbles and gold dust,
// a sparkle trail behind the pointer, heading word reveal and scroll reveals.

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function seaCanvas(canvas) {
  if (reducedMotion) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr, parts = [];

  const make = (fromBottom) => {
    const bubble = Math.random() < .35;
    return {
      bubble,
      x: Math.random() * w,
      y: fromBottom ? h + Math.random() * 40 : Math.random() * h,
      r: bubble ? 1.5 + Math.random() * 4.5 : .4 + Math.random() * 1.4,
      vy: bubble ? .25 + Math.random() * .55 : .08 + Math.random() * .25,
      phase: Math.random() * Math.PI * 2,
      sway: .2 + Math.random() * .6,
      a: .15 + Math.random() * .5,
    };
  };

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(90, (w * h) / 16000));
    parts = Array.from({ length: count }, () => make(false));
  };

  let t = 0, running = true;
  const frame = () => {
    if (!running) return;
    t += .016;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.y -= p.vy;
      const x = p.x + Math.sin(t * p.sway + p.phase) * 12;
      if (p.y < -10) Object.assign(p, make(true));
      if (p.bubble) {
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200, 230, 240, ${p.a * .6})`;
        ctx.lineWidth = .8;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - p.r * .35, p.y - p.r * .35, p.r * .3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.a * .7})`;
        ctx.fill();
      } else {
        const tw = .5 + .5 * Math.sin(t * 3 + p.phase);
        ctx.beginPath();
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240, 215, 156, ${p.a * tw})`;
        ctx.fill();
      }
    }
    requestAnimationFrame(frame);
  };

  resize();
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });
  requestAnimationFrame(frame);
}

export function sparkle(x, y, n = 8, spread = 60) {
  if (reducedMotion) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    const ang = Math.random() * Math.PI * 2, dist = spread * (.4 + Math.random() * .6);
    s.style.left = `${x}px`; s.style.top = `${y}px`;
    s.style.setProperty('--tx', `${Math.cos(ang) * dist}px`);
    s.style.setProperty('--ty', `${Math.sin(ang) * dist}px`);
    const size = 5 + Math.random() * 8;
    s.style.width = s.style.height = `${size}px`;
    s.style.animationDelay = `${Math.random() * .1}s`;
    document.body.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  }
}

export function pointerTrail() {
  if (reducedMotion || !matchMedia('(pointer: fine)').matches) return;
  let last = 0;
  addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - last < 70) return;
    last = now;
    sparkle(e.clientX, e.clientY, 1, 24);
  }, { passive: true });
}

export function splitWords(el) {
  let i = 0;
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType !== Node.TEXT_NODE) continue;
      const frag = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(' '); return; }
        const w = document.createElement('span');
        w.className = 'w';
        const inner = document.createElement('span');
        inner.textContent = part;
        inner.style.animationDelay = `${.15 + i++ * .09}s`;
        w.append(inner);
        frag.append(w);
      });
      child.replaceWith(frag);
    }
  };
  walk(el);
}

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' })
  : null;

export function reveal(els) {
  for (const el of els) io ? io.observe(el) : el.classList.add('in');
}

// Gentle 3D tilt plus a pointer-following highlight on product cards.
export function tilt(card) {
  if (reducedMotion || !matchMedia('(pointer: fine)').matches) return;
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    card.style.setProperty('--ry', `${(px - .5) * 8}deg`);
    card.style.setProperty('--rx', `${(.5 - py) * 8}deg`);
    card.style.setProperty('--gx', `${px * 100}%`);
    card.style.setProperty('--gy', `${py * 100}%`);
  });
  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  });
}

export function pearlParallax(pearl) {
  if (reducedMotion || !matchMedia('(pointer: fine)').matches) return;
  addEventListener('pointermove', (e) => {
    const x = (e.clientX / innerWidth - .5) * 24, y = (e.clientY / innerHeight - .5) * 24;
    pearl.style.setProperty('--mx', `${x}px`);
    pearl.style.setProperty('--my', `${y}px`);
  }, { passive: true });
}
