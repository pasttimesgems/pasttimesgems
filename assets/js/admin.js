import {
  isLive, listProducts, saveProduct, deleteProduct, getSettings, saveSettings,
  currentAdmin, signIn, signOut, resetDemo, money, escapeHtml, CATEGORIES,
} from './store.js';
import { imageSrc } from './art.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || id;

let products = [];
let editing = null;     // product being edited, or null for a new one
let pickedFile = null;  // new photo chosen in the editor
let clearImage = false; // admin chose artwork instead of a photo

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
  await Promise.all([loadProducts(), loadSettings()]);
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
$$('.tab').forEach((t) => t.addEventListener('click', () => {
  $$('.tab').forEach((x) => {
    const on = x === t;
    x.classList.toggle('is-on', on);
    x.setAttribute('aria-selected', on);
    $(`#tab-${x.dataset.tab}`).hidden = !on;
  });
}));

// ---------- products ----------
async function loadProducts() {
  try {
    products = await listProducts({ includeHidden: true });
    renderProducts();
  } catch (e) {
    $('#productTable').innerHTML = `<p class="error">Could not load products: ${escapeHtml(e.message)}</p>`;
  }
}

function renderProducts() {
  const counts = {
    total: products.length,
    available: products.filter((p) => p.status === 'available' && p.visible !== false).length,
    sold: products.filter((p) => p.status === 'sold').length,
    value: products.filter((p) => p.status !== 'sold').reduce((s, p) => s + Number(p.price), 0),
  };
  $('#stats').innerHTML = `
    <div class="stat"><b>${counts.total}</b><span>Products</span></div>
    <div class="stat"><b>${counts.available}</b><span>On sale now</span></div>
    <div class="stat"><b>${counts.sold}</b><span>Sold</span></div>
    <div class="stat"><b>${money(counts.value).replace('QAR ', '')}</b><span>Stock value (QAR)</span></div>`;

  const q = $('#aSearch').value.trim().toLowerCase();
  const cat = $('#aFilter').value;
  const list = products.filter((p) => (cat === 'all' || p.category === cat) && (!q || p.name.toLowerCase().includes(q)));

  if (!list.length) {
    $('#productTable').innerHTML = `<div class="empty-list">${products.length ? 'Nothing matches that search.' : 'No products yet. Press “Add product” to list your first piece.'}</div>`;
    return;
  }
  $('#productTable').innerHTML = list.map((p, i) => `
    <div class="row" data-id="${escapeHtml(p.id)}" style="animation-delay:${Math.min(i, 12) * 30}ms">
      <img src="${escapeHtml(imageSrc(p))}" alt="">
      <div>
        <div class="name">${escapeHtml(p.name)}${p.featured ? ' <span title="Featured">✦</span>' : ''}</div>
        <div class="meta">${escapeHtml(catLabel(p.category))}${p.weight ? ' · ' + escapeHtml(p.weight) : ''}</div>
      </div>
      <div class="pills">
        <span class="pill ${escapeHtml(p.status)}">${escapeHtml(p.status)}</span>
        ${p.visible === false ? '<span class="pill hidden">Hidden</span>' : ''}
      </div>
      <span class="price">${money(p.price)}</span>
      <div class="row-actions"><button class="btn sm" data-edit>Edit</button></div>
    </div>`).join('');
}

$('#aSearch').addEventListener('input', renderProducts);
$('#aFilter').addEventListener('change', renderProducts);
$('#productTable').addEventListener('click', (e) => {
  const row = e.target.closest('.row');
  if (row) openEditor(products.find((p) => p.id === row.dataset.id));
});
$('#newProduct').addEventListener('click', () => openEditor(null));

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
  $('#deleteProduct').hidden = !p;
  const v = p || { category: 'jewellery', status: 'available', visible: true };
  for (const name of ['name', 'category', 'price', 'description', 'material', 'weight', 'origin', 'status']) {
    form.elements[name].value = v[name] ?? '';
  }
  form.elements.featured.checked = Boolean(v.featured);
  form.elements.visible.checked = v.visible !== false;
  setPreview(p ? imageSrc(p) : '');
  editor.showModal();
  form.elements.name.focus();
}

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
    ...(editing ? { id: editing.id } : {}),
    name: el.name.value.trim(),
    category: el.category.value,
    price: el.price.value,
    description: el.description.value.trim(),
    material: el.material.value.trim(),
    weight: el.weight.value.trim(),
    origin: el.origin.value.trim(),
    status: el.status.value,
    featured: el.featured.checked,
    visible: el.visible.checked,
  };
  if (clearImage) product.image_url = null;
  btn.disabled = true;
  btn.textContent = pickedFile ? 'Uploading photo…' : 'Saving…';
  try {
    await saveProduct(product, pickedFile);
    editor.close();
    toast(editing ? 'Product updated' : 'Product added. It is live in the shop.');
    await loadProducts();
  } catch (err) {
    $('#editorError').textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save product';
  }
});

$('#deleteProduct').addEventListener('click', async () => {
  if (!editing || !confirm(`Delete “${editing.name}”? This cannot be undone.\n\nTip: set it to Sold or untick Visible to keep a record instead.`)) return;
  try {
    await deleteProduct(editing);
    editor.close();
    toast('Product deleted');
    await loadProducts();
  } catch (err) {
    $('#editorError').textContent = err.message;
  }
});

// ---------- settings ----------
async function loadSettings() {
  const s = await getSettings();
  const f = $('#settingsForm');
  for (const k of ['whatsapp_number', 'announcement', 'instagram']) f.elements[k].value = s[k] || '';
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
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}
