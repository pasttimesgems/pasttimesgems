import { CONFIG } from './config.js';
import { listProducts, getSettings, money, escapeHtml } from './store.js';
import { t, getLang, setLang, applyStatic, localName, localDesc } from './i18n.js';
import { imageSrc, artUrl } from './art.js';
import { seaCanvas, pointerTrail, splitWords, reveal, tilt, sparkle, pearlParallax, reducedMotion, gemOrbit, latticeLight, playIntro } from './effects.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const catLabel = (id) => t(`cat.${id}`);

const state = { products: [], filter: 'all', query: '', sort: 'featured', settings: {} };

// ---------- bag (kept in this browser only) ----------
const BAG_KEY = 'ptg-bag-v1';
let bag = [];
try { bag = JSON.parse(localStorage.getItem(BAG_KEY)) || []; } catch { bag = []; }
const saveBag = () => { try { localStorage.setItem(BAG_KEY, JSON.stringify(bag)); } catch { /* private mode */ } };

// ---------- saved pieces (wishlist, this browser only) ----------
const SAVED_KEY = 'ptg-saved-v1';
let saved = new Set();
try { saved = new Set(JSON.parse(localStorage.getItem(SAVED_KEY)) || []); } catch { saved = new Set(); }
const persistSaved = () => { try { localStorage.setItem(SAVED_KEY, JSON.stringify([...saved])); } catch { /* private mode */ } };
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5S3 15 3 9a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 6-9 11.5-9 11.5Z"/></svg>';

// ---------- boot ----------
applyStatic();
seaCanvas($('#sea'));
pointerTrail();
pearlParallax($('#heroPearl'));
gemOrbit($('#gemOrbit'));
latticeLight($('#home'));
playIntro($('#intro')).then(() => {
  document.body.classList.add('hero-go');
  splitWords($('[data-split]'));
  reveal($$('.reveal'));
});

$('#langBtn').addEventListener('click', () => {
  setLang(getLang() === 'ar' ? 'en' : 'ar');
  splitWords($('[data-split]'));
  applySettings();
  renderCounts();
  renderSaved();
  renderSpotlight();
  renderGrid();
  renderBag();
  if (modal.open && current) openProduct(current.id);
});
$$('[data-art]').forEach((img) => { const [k, v] = img.dataset.art.split(':'); img.src = artUrl(k, v); });
$('#year').textContent = new Date().getFullYear();
$('#footLoc').textContent = CONFIG.location;

const header = $('#top');
const onScroll = () => header.classList.toggle('scrolled', scrollY > 30);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

init();

async function init() {
  const [products, settings] = await Promise.all([
    listProducts().catch((e) => { console.error(e); return null; }),
    getSettings(),
  ]);
  state.settings = settings;
  applySettings();
  if (!products) {
    $('#grid').innerHTML = `<p class="empty">${t('empty.error')}</p>`;
    return;
  }
  state.products = products;
  // Drop bag lines for pieces that were removed or sold since the visitor's last visit.
  bag = bag.filter((l) => {
    const p = products.find((x) => x.id === l.id);
    return p && p.status !== 'sold';
  });
  saveBag();
  saved = new Set([...saved].filter((id) => products.some((p) => p.id === id)));
  persistSaved();
  renderCounts();
  renderSaved();
  renderSpotlight();
  renderGrid();
  renderBag();
  openFromHash();
}

function applySettings() {
  const { announcement, instagram } = state.settings;
  if (announcement) { const a = $('#announce'); a.textContent = announcement; a.hidden = false; }
  $('#footWa').href = waLink(t('wa.hello', { shop: CONFIG.shopName }));
  if (instagram) {
    const ig = $('#footIg');
    ig.href = `https://instagram.com/${instagram.replace(/^@/, '')}`;
    ig.hidden = false;
  }
}

// ---------- WhatsApp ----------
function waNumber() { return String(state.settings.whatsapp_number || '').replace(/\D/g, ''); }
function waLink(text) {
  const n = waNumber();
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

// ---------- grid ----------
function visibleProducts() {
  const q = state.query.trim().toLowerCase();
  let list = state.products.filter((p) =>
    (state.filter === 'all' || p.category === state.filter || (state.filter === 'saved' && saved.has(p.id))) &&
    (!q || [p.name, p.name_ar, p.description, p.description_ar, p.material, p.origin].join(' ').toLowerCase().includes(q)));
  const sorters = {
    featured: (a, b) => (b.featured - a.featured) || ((a.status === 'sold') - (b.status === 'sold')),
    new: (a, b) => String(b.created_at).localeCompare(String(a.created_at)),
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
  };
  return list.sort(sorters[state.sort]);
}

function renderGrid() {
  const grid = $('#grid');
  const list = visibleProducts();
  if (!list.length) {
    grid.innerHTML = `<p class="empty">${!state.products.length ? t('empty.none')
      : state.filter === 'saved' ? t('empty.saved') : t('empty.search')}</p>`;
    return;
  }
  grid.innerHTML = list.map((p, i) => {
    const sold = p.status === 'sold';
    const badge = sold ? `<span class="badge sold">${t('badge.sold')}</span>`
      : p.status === 'reserved' ? `<span class="badge reserved">${t('badge.reserved')}</span>`
      : p.featured ? `<span class="badge featured">${t('badge.featured')}</span>` : '';
    const name = escapeHtml(localName(p));
    return `
    <article class="card${sold ? ' is-sold' : ''}" data-id="${escapeHtml(p.id)}" data-cat="${escapeHtml(p.category)}" tabindex="0" style="--d:${Math.min(i, 8) * 0.07}s" aria-label="${name}">
      <div class="card-media">${badge}
        <button class="heart" data-heart="${escapeHtml(p.id)}" aria-label="${t('save')} ${name}" aria-pressed="${saved.has(p.id)}">${HEART}</button>
        <img src="${escapeHtml(imageSrc(p))}" alt="${name}" loading="lazy">
        <span class="quick">${t('quick')}</span>
        <span class="glint" aria-hidden="true"></span>
      </div>
      <div class="card-body">
        <span class="card-cat">${escapeHtml(catLabel(p.category))}</span>
        <h3 class="card-name">${name}</h3>
        ${specLine(p) ? `<p class="card-spec">${escapeHtml(specLine(p))}</p>` : ''}
        <div class="card-foot">
          <span class="price">${money(p.price)}</span>
          <button class="add" data-add="${escapeHtml(p.id)}" aria-label="${t('addTo', { name })}" ${sold ? 'disabled' : ''}>+</button>
        </div>
      </div>
    </article>`;
  }).join('');
  const cards = $$('.card', grid);
  cards.forEach(tilt);
  reveal(cards);
}

function specLine(p) { return [p.weight, p.origin].filter(Boolean).join(' · '); }

function renderCounts() {
  for (const chip of $$('.chip')) {
    const f = chip.dataset.filter;
    if (f === 'saved') continue;
    const n = f === 'all' ? state.products.length : state.products.filter((p) => p.category === f).length;
    chip.dataset.count = n;
  }
}

// ---------- saved pieces ----------
function toggleSaved(id, fromEl) {
  const on = !saved.has(id);
  on ? saved.add(id) : saved.delete(id);
  persistSaved();
  $$(`[data-heart="${CSS.escape(id)}"]`).forEach((h) => h.setAttribute('aria-pressed', on));
  if (current?.id === id) $('#pmHeart').setAttribute('aria-pressed', on);
  if (on && fromEl) {
    const r = fromEl.getBoundingClientRect();
    sparkle(r.left + r.width / 2, r.top + r.height / 2, 8, 36);
  }
  renderSaved();
  if (state.filter === 'saved') renderGrid();
  const p = state.products.find((x) => x.id === id);
  toast(on ? t('toast.saved', { name: localName(p) }) : t('toast.unsaved'));
}

function renderSaved() {
  const n = saved.size;
  const c = $('#savedCount');
  c.textContent = n;
  c.classList.toggle('has', n > 0);
  const chip = $('.chip-saved');
  chip.hidden = n === 0;
  chip.dataset.count = n;
  if (!n && state.filter === 'saved') setFilter('all');
}

$('#savedBtn').addEventListener('click', () => {
  if (!saved.size) { toast(t('toast.saveHint')); return; }
  setFilter('saved');
  $('#collection').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
});

// ---------- spotlight carousel ----------
let spotIndex = 0, spotTimer = null, spotItems = [];

function renderSpotlight() {
  const featured = state.products.filter((p) => p.featured && p.status !== 'sold');
  spotItems = (featured.length ? featured : state.products.filter((p) => p.status === 'available')).slice(0, 6);
  if (spotItems.length < 2) return;
  spotIndex = 0;
  $('#spotlight').hidden = false;
  reveal($$('#spotlight .reveal'));
  $('#spotTrack').innerHTML = spotItems.map((p, i) => `
    <article class="spot${i === 0 ? ' is-on' : ''}" data-id="${escapeHtml(p.id)}" aria-hidden="${i !== 0}">
      <div class="spot-art">
        <span class="beams" aria-hidden="true"></span>
        <img src="${escapeHtml(imageSrc(p))}" alt="${escapeHtml(localName(p))}">
        <span class="pedestal" aria-hidden="true"></span>
      </div>
      <div class="spot-copy">
        <span class="card-cat">${escapeHtml(catLabel(p.category))}</span>
        <h3>${escapeHtml(localName(p))}</h3>
        <p class="spot-desc">${escapeHtml(localDesc(p))}</p>
        ${specLine(p) ? `<p class="card-spec">${escapeHtml(specLine(p))}</p>` : ''}
        <p class="price">${money(p.price)}</p>
        <div class="spot-actions">
          <button class="btn btn-gold" data-add="${escapeHtml(p.id)}">${t('add')}</button>
          <button class="btn btn-ghost" data-view="${escapeHtml(p.id)}">${t('spot.view')}</button>
        </div>
      </div>
    </article>`).join('');
  $('#spotDots').innerHTML = spotItems.map((p, i) =>
    `<button class="spot-dot${i === 0 ? ' is-on' : ''}" data-i="${i}" role="tab" aria-label="${escapeHtml(localName(p))}" aria-selected="${i === 0}"><span></span></button>`).join('');
  startSpot();
}

function showSpot(i) {
  spotIndex = (i + spotItems.length) % spotItems.length;
  $$('.spot').forEach((el, n) => { el.classList.toggle('is-on', n === spotIndex); el.setAttribute('aria-hidden', n !== spotIndex); });
  $$('.spot-dot').forEach((el, n) => { el.classList.toggle('is-on', n === spotIndex); el.setAttribute('aria-selected', n === spotIndex); });
}
function startSpot() {
  clearInterval(spotTimer);
  if (!reducedMotion) spotTimer = setInterval(() => showSpot(spotIndex + 1), 6500);
}
$('#spotPrev').addEventListener('click', () => { showSpot(spotIndex - 1); startSpot(); });
$('#spotNext').addEventListener('click', () => { showSpot(spotIndex + 1); startSpot(); });
$('#spotDots').addEventListener('click', (e) => { const d = e.target.closest('[data-i]'); if (d) { showSpot(Number(d.dataset.i)); startSpot(); } });
$('#spotStage').addEventListener('pointerenter', () => clearInterval(spotTimer));
$('#spotStage').addEventListener('pointerleave', startSpot);
$('#spotTrack').addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  if (add) { addToBag(add.dataset.add, 1, add); return; }
  const view = e.target.closest('[data-view]') || e.target.closest('.spot-art');
  if (view) openProduct(view.dataset.view || view.closest('.spot').dataset.id);
});
let touchX = null;
$('#spotTrack').addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
$('#spotTrack').addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) { showSpot(spotIndex + (dx < 0 ? 1 : -1)); startSpot(); }
  touchX = null;
});

$('#grid').addEventListener('click', (e) => {
  const heart = e.target.closest('[data-heart]');
  if (heart) { toggleSaved(heart.dataset.heart, heart); return; }
  const add = e.target.closest('[data-add]');
  if (add) { addToBag(add.dataset.add, 1, add); return; }
  const card = e.target.closest('.card');
  if (card) openProduct(card.dataset.id);
});
$('#grid').addEventListener('keydown', (e) => {
  const card = e.target.closest('.card');
  if (card && e.target === card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openProduct(card.dataset.id); }
});

function setFilter(f) {
  state.filter = f;
  $$('.chip').forEach((c) => {
    const on = c.dataset.filter === f;
    c.classList.toggle('is-on', on);
    c.setAttribute('aria-selected', on);
  });
  renderGrid();
}
$$('.chip').forEach((c) => c.addEventListener('click', () => setFilter(c.dataset.filter)));
$$('.cat').forEach((c) => c.addEventListener('click', () => {
  setFilter(c.dataset.cat);
  $('#collection').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
}));
let searchTimer;
$('#search').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.query = e.target.value; renderGrid(); }, 150);
});
$('#sort').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(); });

// ---------- product modal ----------
const modal = $('#productModal');
let current = null, qty = 1;

function openProduct(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  current = p; qty = 1;
  $('#pmImg').src = imageSrc(p);
  $('#pmImg').alt = localName(p);
  $('#pmCat').textContent = catLabel(p.category);
  $('#pmName').textContent = localName(p);
  $('#pmPrice').textContent = money(p.price);
  $('#pmDesc').textContent = localDesc(p);
  const specs = [[t('spec.material'), p.material], [t('spec.weight'), p.weight], [t('spec.origin'), p.origin],
    [t('spec.status'), t(`status.${p.status}`)]];
  $('#pmSpecs').innerHTML = specs.filter(([, v]) => v)
    .map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(v)}</dd>`).join('');
  $('#pmQty').textContent = qty;
  const sold = p.status === 'sold';
  $('#pmAdd').disabled = sold;
  $('#pmAdd').textContent = sold ? t('status.sold') : t('add');
  $('#pmAsk').href = waLink(`${t('wa.ask', { shop: CONFIG.shopName, name: localName(p), price: money(p.price) })}\n${productUrl(p)}`);
  $('#pmHeart').setAttribute('aria-pressed', saved.has(p.id));
  const more = state.products
    .filter((x) => x.id !== p.id && x.status !== 'sold')
    .sort((a, b) => (b.category === p.category) - (a.category === p.category) || Math.abs(a.price - p.price) - Math.abs(b.price - p.price))
    .slice(0, 3);
  $('#pmMore').hidden = !more.length;
  $('#pmMoreList').innerHTML = more.map((x) => `
    <button class="mini" data-open="${escapeHtml(x.id)}">
      <img src="${escapeHtml(imageSrc(x))}" alt="">
      <span class="mini-name">${escapeHtml(localName(x))}</span>
      <span class="price">${money(x.price)}</span>
    </button>`).join('');
  history.replaceState(null, '', `#piece-${p.id}`);
  if (!modal.open) modal.showModal();
  modal.scrollTop = 0;
}
function productUrl(p) { return `${location.origin}${location.pathname}#piece-${p.id}`; }
function openFromHash() {
  const m = location.hash.match(/^#piece-(.+)$/);
  if (m) openProduct(decodeURIComponent(m[1]));
}
modal.addEventListener('close', () => {
  if (location.hash.startsWith('#piece-')) history.replaceState(null, '', location.pathname + location.search);
});
modal.addEventListener('click', (e) => {
  if (e.target === modal || e.target.closest('[data-close]')) modal.close();
  const more = e.target.closest('[data-open]');
  if (more) { openProduct(more.dataset.open); return; }
  const q = e.target.closest('[data-q]');
  if (q) { qty = Math.max(1, Math.min(20, qty + Number(q.dataset.q))); $('#pmQty').textContent = qty; }
});
$('#pmHeart').addEventListener('click', (e) => { if (current) toggleSaved(current.id, e.currentTarget); });

// Magnifier: the photo follows the pointer at 2x so customers can see the detail.
const pmMedia = $('#pmMedia');
if (matchMedia('(pointer: fine)').matches) {
  pmMedia.addEventListener('pointermove', (e) => {
    const r = pmMedia.getBoundingClientRect();
    pmMedia.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    pmMedia.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
    pmMedia.classList.add('zooming');
  });
  pmMedia.addEventListener('pointerleave', () => pmMedia.classList.remove('zooming'));
} else {
  pmMedia.classList.add('no-zoom');
}

$('#pmAdd').addEventListener('click', (e) => {
  if (!current) return;
  addToBag(current.id, qty, e.currentTarget);
  setTimeout(() => modal.close(), 350);
});

// ---------- bag ----------
function addToBag(id, n, fromEl) {
  const p = state.products.find((x) => x.id === id);
  if (!p || p.status === 'sold') return;
  const line = bag.find((l) => l.id === id);
  if (line) line.qty = Math.min(20, line.qty + n); else bag.push({ id, qty: n });
  saveBag();
  renderBag();
  flyToBag(fromEl, imageSrc(p));
  toast(t('toast.added', { name: localName(p) }));
}

function flyToBag(fromEl, src) {
  const btn = $('#bagBtn');
  const end = btn.getBoundingClientRect();
  const done = () => {
    btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
    sparkle(end.left + end.width / 2, end.top + end.height / 2, 10, 50);
  };
  if (reducedMotion || !fromEl) { done(); return; }
  const start = fromEl.getBoundingClientRect();
  const img = document.createElement('img');
  img.className = 'fly'; img.src = src; img.alt = '';
  img.style.left = `${start.left + start.width / 2 - 30}px`;
  img.style.top = `${start.top + start.height / 2 - 30}px`;
  document.body.append(img);
  requestAnimationFrame(() => {
    const dx = end.left + end.width / 2 - (start.left + start.width / 2);
    const dy = end.top + end.height / 2 - (start.top + start.height / 2);
    img.style.transform = `translate(${dx}px, ${dy}px) scale(.2)`;
    img.style.opacity = '.4';
  });
  setTimeout(() => { img.remove(); done(); }, 800);
}

function bagLines() {
  return bag.map((l) => ({ ...l, p: state.products.find((x) => x.id === l.id) })).filter((l) => l.p);
}
const bagTotal = () => bagLines().reduce((s, l) => s + l.p.price * l.qty, 0);

function renderBag() {
  const lines = bagLines();
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const badge = $('#bagCount');
  badge.textContent = count;
  badge.classList.toggle('has', count > 0);
  $('#bagEmpty').hidden = lines.length > 0;
  $('#checkout').hidden = lines.length === 0;
  $('#bagTotal').textContent = money(bagTotal());
  $('#bagBar').hidden = count === 0;
  document.body.classList.toggle('has-bag', count > 0);
  $('#bagBarCount').textContent = count === 1 ? t('pieces.one') : t('pieces.many', { n: count });
  $('#bagBarTotal').textContent = money(bagTotal());
  $('#bagList').innerHTML = lines.map(({ p, qty: q }) => `
    <li class="bag-item" data-id="${escapeHtml(p.id)}">
      <img src="${escapeHtml(imageSrc(p))}" alt="">
      <div>
        <h3>${escapeHtml(localName(p))}</h3>
        <span class="price">${money(p.price * q)}</span>
        <div><button class="remove" data-remove>${t('remove')}</button></div>
      </div>
      <div class="qty"><button data-step="-1" aria-label="${t('pm.fewer')}">−</button><output>${q}</output><button data-step="1" aria-label="${t('pm.moreQty')}">+</button></div>
    </li>`).join('');
}

$('#bagList').addEventListener('click', (e) => {
  const item = e.target.closest('.bag-item');
  if (!item) return;
  const line = bag.find((l) => l.id === item.dataset.id);
  if (e.target.closest('[data-remove]')) bag = bag.filter((l) => l !== line);
  const step = e.target.closest('[data-step]');
  if (step) {
    line.qty += Number(step.dataset.step);
    if (line.qty < 1) bag = bag.filter((l) => l !== line);
    line.qty = Math.min(20, line.qty);
  }
  saveBag();
  renderBag();
});

const drawer = $('#drawer'), scrim = $('#scrim');
function openDrawer() {
  drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); scrim.hidden = false;
  document.body.classList.add('drawer-open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('#drawerClose').focus(), 300);
}
function closeDrawer() {
  drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); scrim.hidden = true;
  document.body.classList.remove('drawer-open');
  document.body.style.overflow = '';
}
$('#bagBtn').addEventListener('click', openDrawer);
$('#bagBar').addEventListener('click', openDrawer);
$('#drawerClose').addEventListener('click', closeDrawer);
scrim.addEventListener('click', closeDrawer);
drawer.addEventListener('click', (e) => { if (e.target.closest('[data-close-drawer]')) closeDrawer(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(); });

// Restore saved checkout details so returning customers don't retype them.
const DETAILS_KEY = 'ptg-details-v1';
const form = $('#checkout');
try {
  const saved = JSON.parse(localStorage.getItem(DETAILS_KEY)) || {};
  for (const [k, v] of Object.entries(saved)) if (form.elements[k] && k !== 'notes') form.elements[k].value = v;
  if (!form.elements.delivery.value) form.elements.delivery.value = 'home';
} catch { /* nothing saved */ }

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const lines = bagLines();
  if (!lines.length) return;
  const d = Object.fromEntries(new FormData(form));
  try { localStorage.setItem(DETAILS_KEY, JSON.stringify({ name: d.name, phone: d.phone, delivery: d.delivery, address: d.address })); } catch { /* ignore */ }

  const ref = 'PTG-' + Date.now().toString(36).toUpperCase().slice(-6);
  // Staff always see the English name too, so they can match the piece in the admin page.
  const itemName = (p) => (localName(p) === p.name ? p.name : `${localName(p)} (${p.name})`);
  const msg = [
    `*${t('wa.order', { shop: CONFIG.shopName })}*`,
    `${t('wa.ref')}: ${ref}`,
    '',
    ...lines.map((l, i) => `${i + 1}. ${itemName(l.p)} · ${catLabel(l.p.category)}\n    ${t('wa.qty')} ${l.qty} × ${money(l.p.price)} = ${money(l.p.price * l.qty)}`),
    '',
    `*${t('wa.total')}: ${money(bagTotal())}*`,
    '',
    `${t('wa.name')}: ${d.name}`,
    `${t('wa.phone')}: ${d.phone}`,
    `${t('wa.delivery')}: ${t(`f.${d.delivery}`)}`,
    d.address ? `${t('wa.address')}: ${d.address}` : null,
    d.notes ? `${t('wa.notes')}: ${d.notes}` : null,
  ].filter((x) => x !== null).join('\n');

  if (!waNumber()) toast(t('toast.noNumber'));
  window.open(waLink(msg), '_blank', 'noopener');
  sparkle(innerWidth / 2, innerHeight / 2, 24, 140);
  bag = [];
  saveBag();
  renderBag();
  form.elements.notes.value = '';
  closeDrawer();
  toast(t('toast.ready', { ref }));
});

// ---------- toast ----------
let toastTimer;
function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}
