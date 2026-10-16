import { CONFIG } from './config.js';
import { listProducts, getSettings, money, escapeHtml, CATEGORIES } from './store.js';
import { imageSrc, artUrl } from './art.js';
import { seaCanvas, pointerTrail, splitWords, reveal, tilt, sparkle, pearlParallax, reducedMotion } from './effects.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || id;

const state = { products: [], filter: 'all', query: '', sort: 'featured', settings: {} };

// ---------- bag (kept in this browser only) ----------
const BAG_KEY = 'ptg-bag-v1';
let bag = [];
try { bag = JSON.parse(localStorage.getItem(BAG_KEY)) || []; } catch { bag = []; }
const saveBag = () => { try { localStorage.setItem(BAG_KEY, JSON.stringify(bag)); } catch { /* private mode */ } };

// ---------- boot ----------
seaCanvas($('#sea'));
pointerTrail();
splitWords($('[data-split]'));
pearlParallax($('#heroPearl'));
reveal($$('.reveal'));
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
    $('#grid').innerHTML = '<p class="empty">We could not open the collection just now. Please refresh in a moment.</p>';
    return;
  }
  state.products = products;
  // Drop bag lines for pieces that were removed or sold since the visitor's last visit.
  bag = bag.filter((l) => {
    const p = products.find((x) => x.id === l.id);
    return p && p.status !== 'sold';
  });
  saveBag();
  renderGrid();
  renderBag();
  openFromHash();
}

function applySettings() {
  const { announcement, instagram } = state.settings;
  if (announcement) { const a = $('#announce'); a.textContent = announcement; a.hidden = false; }
  $('#footWa').href = waLink(`Hello ${CONFIG.shopName}, I have a question.`);
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
    (state.filter === 'all' || p.category === state.filter) &&
    (!q || [p.name, p.description, p.material, p.origin].join(' ').toLowerCase().includes(q)));
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
    grid.innerHTML = `<p class="empty">${state.products.length ? 'No pieces match that search.' : 'New pieces are being polished. Please check back soon.'}</p>`;
    return;
  }
  grid.innerHTML = list.map((p, i) => {
    const sold = p.status === 'sold';
    const badge = sold ? '<span class="badge sold">Sold</span>'
      : p.status === 'reserved' ? '<span class="badge reserved">Reserved</span>'
      : p.featured ? '<span class="badge featured">✦ Featured</span>' : '';
    return `
    <article class="card${sold ? ' is-sold' : ''}" data-id="${escapeHtml(p.id)}" tabindex="0" style="--d:${Math.min(i, 8) * 0.07}s" aria-label="${escapeHtml(p.name)}">
      <div class="card-media">${badge}<img src="${escapeHtml(imageSrc(p))}" alt="${escapeHtml(p.name)}" loading="lazy"></div>
      <div class="card-body">
        <span class="card-cat">${escapeHtml(catLabel(p.category))}</span>
        <h3 class="card-name">${escapeHtml(p.name)}</h3>
        <div class="card-foot">
          <span class="price">${money(p.price)}</span>
          <button class="add" data-add="${escapeHtml(p.id)}" aria-label="Add ${escapeHtml(p.name)} to bag" ${sold ? 'disabled' : ''}>+</button>
        </div>
      </div>
    </article>`;
  }).join('');
  const cards = $$('.card', grid);
  cards.forEach(tilt);
  reveal(cards);
}

$('#grid').addEventListener('click', (e) => {
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
  $('#pmImg').alt = p.name;
  $('#pmCat').textContent = catLabel(p.category);
  $('#pmName').textContent = p.name;
  $('#pmPrice').textContent = money(p.price);
  $('#pmDesc').textContent = p.description || '';
  const specs = [['Material', p.material], ['Size / weight', p.weight], ['Origin', p.origin],
    ['Status', p.status === 'available' ? 'Available' : p.status === 'reserved' ? 'Reserved' : 'Sold']];
  $('#pmSpecs').innerHTML = specs.filter(([, v]) => v)
    .map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(v)}</dd>`).join('');
  $('#pmQty').textContent = qty;
  const sold = p.status === 'sold';
  $('#pmAdd').disabled = sold;
  $('#pmAdd').textContent = sold ? 'Sold' : 'Add to bag';
  $('#pmAsk').href = waLink(`Hello ${CONFIG.shopName}, I'm interested in "${p.name}" (${money(p.price)}). Is it available?\n${productUrl(p)}`);
  history.replaceState(null, '', `#piece-${p.id}`);
  modal.showModal();
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
  const q = e.target.closest('[data-q]');
  if (q) { qty = Math.max(1, Math.min(20, qty + Number(q.dataset.q))); $('#pmQty').textContent = qty; }
});
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
  toast(`${p.name} added to your bag`);
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
  $('#bagList').innerHTML = lines.map(({ p, qty: q }) => `
    <li class="bag-item" data-id="${escapeHtml(p.id)}">
      <img src="${escapeHtml(imageSrc(p))}" alt="">
      <div>
        <h3>${escapeHtml(p.name)}</h3>
        <span class="price">${money(p.price * q)}</span>
        <div><button class="remove" data-remove>Remove</button></div>
      </div>
      <div class="qty"><button data-step="-1" aria-label="Fewer">−</button><output>${q}</output><button data-step="1" aria-label="More">+</button></div>
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
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('#drawerClose').focus(), 300);
}
function closeDrawer() {
  drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); scrim.hidden = true;
  document.body.style.overflow = '';
}
$('#bagBtn').addEventListener('click', openDrawer);
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
} catch { /* nothing saved */ }

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const lines = bagLines();
  if (!lines.length) return;
  const d = Object.fromEntries(new FormData(form));
  try { localStorage.setItem(DETAILS_KEY, JSON.stringify({ name: d.name, phone: d.phone, delivery: d.delivery, address: d.address })); } catch { /* ignore */ }

  const ref = 'PTG-' + Date.now().toString(36).toUpperCase().slice(-6);
  const msg = [
    `*New order · ${CONFIG.shopName}*`,
    `Order ref: ${ref}`,
    '',
    ...lines.map((l, i) => `${i + 1}. ${l.p.name} (${catLabel(l.p.category)})\n    Qty ${l.qty} × ${money(l.p.price)} = ${money(l.p.price * l.qty)}`),
    '',
    `*Total: ${money(bagTotal())}*`,
    '',
    `Name: ${d.name}`,
    `Phone: ${d.phone}`,
    `Delivery: ${d.delivery}`,
    d.address ? `Address: ${d.address}` : null,
    d.notes ? `Notes: ${d.notes}` : null,
  ].filter((x) => x !== null).join('\n');

  if (!waNumber()) toast('The shop number is not set yet, so choose the shop in WhatsApp.');
  window.open(waLink(msg), '_blank', 'noopener');
  sparkle(innerWidth / 2, innerHeight / 2, 24, 140);
  bag = [];
  saveBag();
  renderBag();
  form.elements.notes.value = '';
  closeDrawer();
  toast(`Order ${ref} is ready in WhatsApp. Press send to place it.`);
});

// ---------- toast ----------
let toastTimer;
function toast(text) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}
