import {
  isLive, listProducts, saveProduct, deleteProduct, getSettings, saveSettings,
  currentAdmin, signIn, signOut, resetDemo, money, escapeHtml, CATEGORIES, MOVEMENTS,
  listCosts, recordMovement, listMovements, stockOf, isSoldOut, isLowStock,
} from './store.js';
import { imageSrc } from './art.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || id;
const kindLabel = (id) => MOVEMENTS.find((m) => m.id === id)?.label || id;
const DAY = 864e5;

let products = [];
let costs = {};          // product id -> cost price (admin only)
let recentMoves = [];    // last 31 days, for the home screen
let editing = null;      // product being edited, or null for a new one
let pickedFile = null;   // new photo chosen in the editor
let clearImage = false;  // admin chose artwork instead of a photo

if (!isLive) {
  $('#demoBanner').hidden = false;
  $('#loginHint').textContent = 'Demo mode: any email, password "demo".';
}
$('#resetDemo').addEventListener('click', () => {
  if (!confirm('Put the sample products back and remove your demo changes?')) return;
  resetDemo();
  location.reload();
});

boot();

async function boot() {
  try {
    const admin = await currentAdmin();
    admin ? showApp(admin) : showLogin();
  } catch (e) {
    showLogin();
    $('#loginError').textContent = 'Could not reach the database. Check your connection and the keys in config.js.';
  }
}

function showLogin() {
  $('#appView').hidden = true;
  $('#loginView').hidden = false;
  $('#loginForm').elements.email.focus();
}

async function showApp(admin) {
  $('#loginView').hidden = true;
  $('#appView').hidden = false;
  $('#whoami').textContent = admin.email;
  greet();
  await Promise.all([loadAll(), loadSettings()]);
}

function greet() {
  const h = new Date().getHours();
  $('#greeting').textContent = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  $('#today').textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ---------- auth ----------
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget, btn = f.querySelector('button[type=submit]');
  $('#loginError').textContent = '';
  btn.disabled = true;
  try {
    const admin = await signIn(f.elements.email.value.trim(), f.elements.password.value);
    f.reset();
    showApp(admin);
  } catch (err) {
    $('#loginError').textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

$('#signOut').addEventListener('click', async () => {
  await signOut();
  showLogin();
});

// ---------- tabs ----------
function showTab(name) {
  $$('.tab').forEach((x) => {
    const on = x.dataset.tab === name;
    x.classList.toggle('is-on', on);
    x.setAttribute('aria-selected', on);
    $(`#tab-${x.dataset.tab}`).hidden = !on;
  });
  if (name === 'reports') loadReport();
  scrollTo({ top: 0 });
}
$$('.tab').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));
document.addEventListener('click', (e) => {
  const go = e.target.closest('[data-goto]');
  if (go) showTab(go.dataset.goto);
  if (e.target.closest('[data-new]')) openEditor(null);
});

// ---------- data ----------
async function loadAll() {
  try {
    const now = new Date();
    [products, costs, recentMoves] = await Promise.all([
      listProducts({ includeHidden: true }),
      listCosts().catch(() => ({})),
      listMovements(new Date(now - 31 * DAY), new Date(+now + DAY)).catch(() => []),
    ]);
    renderHome();
    renderProducts();
    if (!$('#tab-reports').hidden) loadReport();
  } catch (e) {
    $('#productCards').innerHTML = `<p class="error">Could not load products: ${escapeHtml(e.message)}</p>`;
    $('#figures').innerHTML = `<p class="error">Could not load the shop data: ${escapeHtml(e.message)}</p>`;
  }
}

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const startOfWeek = (d) => { const x = startOfDay(d); x.setDate(x.getDate() - x.getDay()); return x; }; // weeks start on Sunday
const costOf = (m) => Number(m.unit_cost ?? costs[m.product_id] ?? 0);

// Sales, cost and profit from a list of stock changes. Returns take a sale back.
function summarise(moves) {
  const s = { sold: 0, returned: 0, added: 0, sales: 0, cost: 0 };
  for (const m of moves) {
    const sign = m.kind === 'sold' ? 1 : m.kind === 'returned' ? -1 : 0;
    if (m.kind === 'sold') s.sold += m.qty;
    if (m.kind === 'returned') s.returned += m.qty;
    if (m.kind === 'added') s.added += m.qty;
    s.sales += sign * m.qty * Number(m.unit_price || 0);
    s.cost += sign * m.qty * costOf(m);
  }
  s.net = s.sold - s.returned;
  s.profit = s.sales - s.cost;
  return s;
}

function stockTotals() {
  let pieces = 0, value = 0, cost = 0;
  for (const p of products) {
    const n = Math.max(0, stockOf(p));
    pieces += n;
    value += n * Number(p.price || 0);
    cost += n * Number(costs[p.id] || 0);
  }
  return { pieces, value, cost };
}

const figure = (label, value, note = '', tone = '') =>
  `<div class="figure ${tone}"><span class="f-label">${label}</span><b>${value}</b>${note ? `<span class="f-note">${note}</span>` : ''}</div>`;
const plain = (n) => money(n).replace(/^QAR\s/, '');
const when = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const changeText = (m) => (m.change > 0 ? `+${m.change}` : String(m.change));

// ---------- home ----------
function renderHome() {
  const week = summarise(recentMoves.filter((m) => new Date(m.created_at) >= startOfWeek(new Date())));
  const totals = stockTotals();
  const low = products.filter(isLowStock).sort((a, b) => stockOf(a) - stockOf(b));
  $('#figures').innerHTML = [
    figure('Pieces in stock', totals.pieces, `${products.filter((p) => !isSoldOut(p)).length} products`),
    figure('Sold this week', week.net, week.returned ? `${week.returned} returned` : 'since Sunday'),
    figure('Sales this week', plain(week.sales), 'QAR'),
    figure('Low stock', low.length, low.length ? 'see below' : 'all good', low.length ? 'warn' : ''),
  ].join('');

  $('#lowList').innerHTML = low.length ? low.slice(0, 8).map((p) => `
    <div class="low" data-id="${escapeHtml(p.id)}">
      <img src="${escapeHtml(imageSrc(p))}" alt="">
      <div><span class="sku">${escapeHtml(p.sku || '')}</span><div class="name">${escapeHtml(p.name)}</div></div>
      <span class="stock-pill ${isSoldOut(p) ? 'out' : 'low'}">${isSoldOut(p) ? 'Sold out' : `${stockOf(p)} left`}</span>
      <button class="btn sm" data-stock="${escapeHtml(p.id)}" data-kind="added">Add stock</button>
    </div>`).join('') + (low.length > 8 ? `<button class="link small" data-goto="products">and ${low.length - 8} more</button>` : '')
    : '<p class="calm">Every piece is well stocked.</p>';

  $('#recent').innerHTML = recentMoves.length ? recentMoves.slice(0, 8).map((m) => `
    <li><span class="dot ${m.kind}"></span>
      <div><b>${kindLabel(m.kind)} ${m.kind === 'corrected' ? `to ${m.qty}` : `× ${m.qty}`}</b> · ${escapeHtml(m.product_name)}
      <span class="muted small">${when(m.created_at)}${m.by_email ? ` · ${escapeHtml(m.by_email)}` : ''}</span></div></li>`).join('')
    : '<li class="calm">Nothing yet. Stock changes will appear here.</li>';
}
$('#lowList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-stock]');
  if (b) { openStock(products.find((p) => p.id === b.dataset.stock), b.dataset.kind); return; }
  const row = e.target.closest('.low');
  if (row) openEditor(products.find((p) => p.id === row.dataset.id));
});

// ---------- products ----------
function stockPill(p) {
  if (isSoldOut(p)) return '<span class="stock-pill out">Sold out</span>';
  if (isLowStock(p)) return `<span class="stock-pill low">${stockOf(p)} left</span>`;
  return `<span class="stock-pill">${stockOf(p)} in stock</span>`;
}

function renderProducts() {
  const q = $('#aSearch').value.trim().toLowerCase();
  const cat = $('#aFilter').value;
  const st = $('#aStock').value;
  const list = products
    .filter((p) => (cat === 'all' || p.category === cat)
      && (!q || `${p.name} ${p.name_ar || ''} ${p.sku || ''}`.toLowerCase().includes(q))
      && (st === 'all' || (st === 'out' ? isSoldOut(p) : st === 'low' ? isLowStock(p) && !isSoldOut(p) : !isSoldOut(p))))
    // Low stock first so it is the first thing you see.
    .sort((a, b) => (isLowStock(b) - isLowStock(a)) || String(b.created_at).localeCompare(String(a.created_at)));

  if (!list.length) {
    $('#productCards').innerHTML = `<div class="empty-list">${products.length ? 'Nothing matches that search.' : 'No products yet. Press “Add product” to list your first piece.'}</div>`;
    return;
  }
  $('#productCards').innerHTML = list.map((p, i) => `
    <article class="pcard${isLowStock(p) ? ' is-low' : ''}${isSoldOut(p) ? ' is-out' : ''}" data-id="${escapeHtml(p.id)}" style="--i:${Math.min(i, 12)}">
      <div class="pc-media"><img src="${escapeHtml(imageSrc(p))}" alt="" loading="lazy">${stockPill(p)}</div>
      <div class="pc-body">
        <span class="sku">${escapeHtml(p.sku || '')}${p.featured ? ' · ✦ Featured' : ''}${p.visible === false ? ' · Hidden' : ''}${p.status === 'reserved' ? ' · Reserved' : ''}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <span class="meta">${escapeHtml(catLabel(p.category))}${p.weight ? ' · ' + escapeHtml(p.weight) : ''}</span>
        <div class="pc-foot">
          <span class="price">${money(p.price)}</span>
          <div class="pc-actions">
            <button class="btn sm" data-stock="${escapeHtml(p.id)}" data-kind="sold" ${isSoldOut(p) ? 'disabled' : ''}>Sold</button>
            <button class="btn sm" data-stock="${escapeHtml(p.id)}">Stock</button>
          </div>
        </div>
      </div>
    </article>`).join('');
}

$('#aSearch').addEventListener('input', renderProducts);
$('#aFilter').addEventListener('change', renderProducts);
$('#aStock').addEventListener('change', renderProducts);
$('#productCards').addEventListener('click', (e) => {
  const b = e.target.closest('[data-stock]');
  const card = e.target.closest('.pcard');
  if (!card) return;
  const p = products.find((x) => x.id === card.dataset.id);
  b ? openStock(p, b.dataset.kind) : openEditor(p);
});

// ---------- stock dialog ----------
const stockDialog = $('#stockDialog');
const stockForm = $('#stockForm');
let stockFor = null;

function openStock(p, kind = 'sold') {
  if (!p) return;
  stockFor = p;
  stockForm.reset();
  $('#stockError').textContent = '';
  $('#stockTitle').textContent = p.name;
  $('#stockSku').textContent = `${p.sku || ''} · ${stockOf(p)} in stock`;
  stockForm.elements.kind.value = isSoldOut(p) && kind === 'sold' ? 'added' : kind || 'sold';
  syncStock();
  stockDialog.showModal();
  stockForm.elements.qty.select();
}

function syncStock() {
  const kind = stockForm.elements.kind.value;
  const qtyEl = stockForm.elements.qty;
  const now = stockOf(stockFor);
  $('#qtyLabel').textContent = { sold: 'How many were sold?', returned: 'How many came back?', added: 'How many are you adding?', corrected: 'How many are there really?' }[kind];
  qtyEl.min = kind === 'corrected' ? 0 : 1;
  if (kind === 'sold') qtyEl.max = now; else qtyEl.removeAttribute('max');
  if (kind === 'corrected' && document.activeElement !== qtyEl && qtyEl.dataset.kind !== 'corrected') qtyEl.value = now;
  if (kind !== 'corrected' && qtyEl.dataset.kind === 'corrected') qtyEl.value = 1;
  qtyEl.dataset.kind = kind;
  const n = Math.max(0, Math.round(Number(qtyEl.value) || 0));
  const after = { sold: now - n, returned: now + n, added: now + n, corrected: n }[kind];
  $('#stockPreview').innerHTML = after < 0
    ? `<span class="error">Only ${now} in stock.</span>`
    : `Stock <b>${now}</b> <span aria-hidden="true">→</span> <b>${after}</b>${after === 0 ? ' · will show “Sold out” in the shop' : ''}`;
}
stockForm.addEventListener('input', syncStock);
stockDialog.addEventListener('click', (e) => {
  if (e.target === stockDialog || e.target.closest('[data-close]')) stockDialog.close();
});

stockForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#saveStock');
  const el = stockForm.elements;
  btn.disabled = true;
  try {
    const after = await recordMovement(stockFor.id, el.kind.value, el.qty.value, el.note.value.trim());
    stockDialog.close();
    toast(`${kindLabel(el.kind.value)}: ${stockFor.name} now has ${after} in stock`);
    if (editor.open) editor.close();
    await loadAll();
  } catch (err) {
    $('#stockError').textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

// ---------- editor ----------
const editor = $('#editor');
const form = $('#productForm');
const drop = $('#drop');

function openEditor(p) {
  editing = p;
  pickedFile = null;
  clearImage = false;
  form.reset();
  $('#editorError').textContent = '';
  $('#editorTitle').textContent = p ? 'Edit product' : 'Add product';
  $('#editorSku').textContent = p?.sku ? `Item code ${p.sku}` : 'An item code is given automatically';
  $('#deleteProduct').hidden = !p;
  const v = p || { category: 'jewellery', status: 'available', visible: true, stock: 1, low_stock: 1 };
  for (const name of ['name', 'name_ar', 'category', 'price', 'description', 'description_ar', 'material', 'weight', 'origin']) {
    form.elements[name].value = v[name] ?? '';
  }
  form.elements.status.value = v.status === 'reserved' ? 'reserved' : 'available';
  form.elements.low_stock.value = v.low_stock ?? 1;
  form.elements.cost.value = p && costs[p.id] != null ? costs[p.id] : '';
  // Stock is typed in only for a new product; afterwards it changes through "Update stock".
  $('#stockField').hidden = Boolean(p);
  form.elements.stock.required = !p;
  form.elements.stock.value = v.stock ?? 1;
  $('#stockNow').hidden = !p;
  if (p) $('#stockNowN').textContent = stockOf(p);
  form.elements.featured.checked = Boolean(v.featured);
  form.elements.visible.checked = v.visible !== false;
  setPreview(p ? imageSrc(p) : '');
  editor.showModal();
  form.elements.name.focus();
}
$('#editorStock').addEventListener('click', () => openStock(editing, 'added'));

function setPreview(src) {
  $('#preview').src = src || '';
  $('#preview').hidden = !src;
  drop.classList.toggle('empty', !src);
}

function pick(file) {
  if (!file || !file.type.startsWith('image/')) return;
  pickedFile = file;
  clearImage = false;
  setPreview(URL.createObjectURL(file));
}
form.elements.image.addEventListener('change', (e) => pick(e.target.files[0]));
drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); pick(e.dataTransfer.files[0]); });
$('#clearPhoto').addEventListener('click', () => {
  pickedFile = null;
  clearImage = true;
  form.elements.image.value = '';
  setPreview(imageSrc({ category: form.elements.category.value, name: form.elements.name.value }));
});

editor.addEventListener('click', (e) => {
  if (e.target === editor || e.target.closest('[data-close]')) editor.close();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#saveProduct');
  const el = form.elements;
  const product = {
    ...(editing ? { id: editing.id } : { stock: el.stock.value }),
    name: el.name.value.trim(),
    category: el.category.value,
    price: el.price.value,
    low_stock: el.low_stock.value,
    name_ar: el.name_ar.value.trim(),
    description: el.description.value.trim(),
    description_ar: el.description_ar.value.trim(),
    material: el.material.value.trim(),
    weight: el.weight.value.trim(),
    origin: el.origin.value.trim(),
    status: el.status.value,
    featured: el.featured.checked,
    visible: el.visible.checked,
  };
  // A piece that was marked sold before stock was tracked stays sold until stock is added.
  if (editing && editing.status === 'sold' && stockOf(editing) <= 0) product.status = 'sold';
  if (clearImage) product.image_url = null;
  const cost = el.cost.value === '' ? undefined : el.cost.value;
  btn.disabled = true;
  btn.textContent = pickedFile ? 'Uploading photo…' : 'Saving…';
  try {
    await saveProduct(product, pickedFile, cost);
    editor.close();
    toast(editing ? 'Product updated' : 'Product added. It is live in the shop.');
    await loadAll();
  } catch (err) {
    $('#editorError').textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save product';
  }
});

$('#deleteProduct').addEventListener('click', async () => {
  if (!editing || !confirm(`Delete “${editing.name}”? This cannot be undone.\n\nTip: untick “Visible in the shop” to keep it and its history instead.`)) return;
  try {
    await deleteProduct(editing);
    editor.close();
    toast('Product deleted');
    await loadAll();
  } catch (err) {
    $('#editorError').textContent = err.message;
  }
});

// ---------- reports ----------
const report = { range: 'today', moves: [], from: null, to: null };
const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayLabel = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

function rangeDates() {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (report.range === 'week') return [startOfWeek(today), tomorrow];
  if (report.range === 'month') return [new Date(today.getFullYear(), today.getMonth(), 1), tomorrow];
  if (report.range === 'custom') {
    const from = $('#rFrom').value ? new Date(`${$('#rFrom').value}T00:00`) : today;
    const to = $('#rTo').value ? new Date(`${$('#rTo').value}T00:00`) : today;
    const [a, b] = from <= to ? [from, to] : [to, from];
    const end = new Date(b); end.setDate(b.getDate() + 1);
    return [a, end];
  }
  return [today, tomorrow];
}

$$('[data-range]').forEach((c) => c.addEventListener('click', () => {
  report.range = c.dataset.range;
  $$('[data-range]').forEach((x) => x.classList.toggle('is-on', x === c));
  $('#customRange').hidden = report.range !== 'custom';
  if (report.range === 'custom' && !$('#rFrom').value) {
    const t = new Date();
    $('#rTo').value = isoDate(t);
    $('#rFrom').value = isoDate(new Date(t.getFullYear(), t.getMonth(), 1));
  }
  loadReport();
}));
$('#rFrom').addEventListener('change', loadReport);
$('#rTo').addEventListener('change', loadReport);
$('#historyKind').addEventListener('change', renderHistory);

let reportTicket = 0;
async function loadReport() {
  const ticket = ++reportTicket;
  const [from, to] = rangeDates();
  report.from = from; report.to = to;
  const last = new Date(+to - DAY);
  const label = +last === +from ? dayLabel(from) : `${dayLabel(from)} to ${dayLabel(last)}`;
  $('#rangeLabel').textContent = label;
  $('#printRange').textContent = label;
  $('#reportFigures').innerHTML = '<p class="muted">Loading…</p>';
  try {
    const moves = await listMovements(from, to);
    if (ticket !== reportTicket) return;
    report.moves = moves;
    renderReport();
  } catch (e) {
    $('#reportFigures').innerHTML = `<p class="error">Could not load the report: ${escapeHtml(e.message)}</p>`;
  }
}

function salesRows() {
  const rows = new Map();
  for (const m of report.moves) {
    if (m.kind !== 'sold' && m.kind !== 'returned') continue;
    const key = m.product_id || m.sku || m.product_name;
    const r = rows.get(key) || { sku: m.sku || '', name: m.product_name, sold: 0, returned: 0, sales: 0, cost: 0 };
    const sign = m.kind === 'sold' ? 1 : -1;
    r[m.kind] += m.qty;
    r.sales += sign * m.qty * Number(m.unit_price || 0);
    r.cost += sign * m.qty * costOf(m);
    rows.set(key, r);
  }
  return [...rows.values()].sort((a, b) => b.sales - a.sales);
}

const table = (head, rows, foot) => `<table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.join('')}</tbody>${foot ? `<tfoot><tr>${foot.map((f) => `<td>${f}</td>`).join('')}</tr></tfoot>` : ''}</table>`;

function renderReport() {
  const s = summarise(report.moves);
  const totals = stockTotals();
  $('#reportFigures').innerHTML = [
    figure('Pieces sold', s.net, s.returned ? `${s.sold} sold, ${s.returned} returned` : ''),
    figure('Sales', plain(s.sales), 'QAR'),
    figure('Profit', plain(s.profit), s.sales ? `QAR · ${Math.round((s.profit / s.sales) * 100)}% margin` : 'QAR', s.profit < 0 ? 'warn' : 'good'),
    figure('Pieces added', s.added),
    figure('Stock value', plain(totals.value), `QAR at selling price · ${totals.pieces} pieces`),
    figure('Stock at cost', plain(totals.cost), 'QAR'),
  ].join('');

  const sales = salesRows();
  $('#salesTable').innerHTML = sales.length ? table(
    ['Item code', 'Piece', 'Sold', 'Returned', 'Sales', 'Profit'],
    sales.map((r) => `<tr><td class="sku">${escapeHtml(r.sku)}</td><td>${escapeHtml(r.name)}</td><td>${r.sold}</td><td>${r.returned || ''}</td><td>${money(r.sales)}</td><td>${money(r.sales - r.cost)}</td></tr>`),
    ['', 'Total', s.sold, s.returned || '', money(s.sales), money(s.profit)],
  ) : '<p class="calm">No sales in this period.</p>';

  renderHistory();

  const stock = products.slice().sort((a, b) => String(a.sku || '').localeCompare(String(b.sku || '')));
  $('#stockTable').innerHTML = stock.length ? table(
    ['Item code', 'Piece', 'Category', 'In stock', 'Alert at', 'Price', 'Cost', 'Value'],
    stock.map((p) => `<tr class="${isLowStock(p) ? 'is-low' : ''}"><td class="sku">${escapeHtml(p.sku || '')}</td><td>${escapeHtml(p.name)}</td><td>${escapeHtml(catLabel(p.category))}</td>
      <td>${isSoldOut(p) ? '<span class="stock-pill out">0</span>' : isLowStock(p) ? `<span class="stock-pill low">${stockOf(p)}</span>` : stockOf(p)}</td>
      <td>${p.low_stock ?? 1}</td><td>${money(p.price)}</td><td>${costs[p.id] != null ? money(costs[p.id]) : '–'}</td><td>${money(Math.max(0, stockOf(p)) * p.price)}</td></tr>`),
    ['', 'Total', '', totals.pieces, '', '', money(totals.cost), money(totals.value)],
  ) : '<p class="calm">No products yet.</p>';
}

function historyMoves() {
  const k = $('#historyKind').value;
  return report.moves.filter((m) => k === 'all' || m.kind === k);
}

function renderHistory() {
  const moves = historyMoves();
  $('#historyTable').innerHTML = moves.length ? table(
    ['When', 'Item code', 'Piece', 'Change', 'Stock after', 'By', 'Note'],
    moves.map((m) => `<tr><td>${when(m.created_at)}</td><td class="sku">${escapeHtml(m.sku || '')}</td><td>${escapeHtml(m.product_name)}</td>
      <td><span class="kind ${m.kind}">${m.kind === 'corrected' ? `Corrected to ${m.qty} (${changeText(m)})` : `${kindLabel(m.kind)} ${changeText(m)}`}</span></td><td>${m.stock_after}</td>
      <td class="muted">${escapeHtml(m.by_email || '')}</td><td class="muted">${escapeHtml(m.note || '')}</td></tr>`),
  ) : '<p class="calm">No stock changes in this period.</p>';
}

// Excel opens this CSV directly; the BOM keeps Arabic names readable.
$('#exportCsv').addEventListener('click', () => {
  const s = summarise(report.moves);
  const totals = stockTotals();
  const num = (n) => (Math.round(n * 100) / 100).toFixed(2);
  const rows = [
    ['Past Times Gems inventory report'], ['Period', $('#rangeLabel').textContent], [],
    ['Summary'], ['Pieces sold', s.net], ['Returned', s.returned], ['Sales (QAR)', num(s.sales)], ['Cost of pieces sold (QAR)', num(s.cost)],
    ['Profit (QAR)', num(s.profit)], ['Pieces added', s.added], ['Stock now (pieces)', totals.pieces],
    ['Stock value at selling price (QAR)', num(totals.value)], ['Stock value at cost (QAR)', num(totals.cost)], [],
    ['Sales by piece'], ['Item code', 'Piece', 'Sold', 'Returned', 'Sales (QAR)', 'Profit (QAR)'],
    ...salesRows().map((r) => [r.sku, r.name, r.sold, r.returned, num(r.sales), num(r.sales - r.cost)]), [],
    ['Stock history'], ['Date', 'Time', 'Item code', 'Piece', 'Type', 'Quantity', 'Change', 'Stock after', 'Price (QAR)', 'Cost (QAR)', 'By', 'Note'],
    ...historyMoves().map((m) => {
      const d = new Date(m.created_at);
      return [isoDate(d), d.toTimeString().slice(0, 5), m.sku || '', m.product_name, kindLabel(m.kind), m.qty, m.change, m.stock_after,
        m.unit_price ?? '', m.unit_cost ?? '', m.by_email || '', m.note || ''];
    }), [],
    ['Stock now'], ['Item code', 'Piece', 'Category', 'In stock', 'Low-stock alert at', 'Price (QAR)', 'Cost (QAR)', 'Value (QAR)'],
    ...products.map((p) => [p.sku || '', p.name, catLabel(p.category), Math.max(0, stockOf(p)), p.low_stock ?? 1, num(p.price), costs[p.id] ?? '', num(Math.max(0, stockOf(p)) * p.price)]),
  ];
  const csv = '﻿' + rows.map((r) => r.map((c) => {
    const v = String(c ?? '');
    return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `past-times-gems-report-${isoDate(report.from)}-to-${isoDate(new Date(+report.to - DAY))}.csv`;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
});
$('#printReport').addEventListener('click', () => print());

// ---------- settings ----------
const SETTINGS = ['whatsapp_number', 'announcement', 'instagram', 'address', 'hours', 'map_url'];
async function loadSettings() {
  const s = await getSettings();
  const f = $('#settingsForm');
  for (const k of SETTINGS) f.elements[k].value = s[k] || '';
}

$('#settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const number = f.elements.whatsapp_number.value.replace(/\D/g, '');
  if (number && number.length < 8) { toast('That WhatsApp number looks too short.', true); return; }
  try {
    await saveSettings({
      whatsapp_number: number,
      announcement: f.elements.announcement.value.trim(),
      instagram: f.elements.instagram.value.trim().replace(/^@/, ''),
      address: f.elements.address.value.trim(),
      hours: f.elements.hours.value.trim(),
      map_url: f.elements.map_url.value.trim(),
    });
    f.elements.whatsapp_number.value = number;
    toast('Settings saved');
  } catch (err) {
    toast(err.message, true);
  }
});

// ---------- toast ----------
let toastTimer;
function toast(text, bad = false) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.toggle('bad', bad);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}
