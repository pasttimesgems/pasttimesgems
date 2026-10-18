// Data layer shared by the shop and the admin page.
// Uses Supabase when config.js has keys, otherwise a browser-only demo store.

import { CONFIG } from './config.js';
import { DEMO_PRODUCTS, DEMO_COSTS, demoMovements } from './demo-data.js';

const SUPABASE_ESM = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm';
const BUCKET = 'product-images';

export const isLive = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
export const CATEGORIES = [
  { id: 'jewellery', label: 'Jewellery' },
  { id: 'gems', label: 'Gems' },
  { id: 'pearls', label: 'Pearls' },
];
export const STATUSES = [
  { id: 'available', label: 'Available' },
  { id: 'reserved', label: 'Reserved' },
  { id: 'sold', label: 'Sold' },
];
export const MOVEMENTS = [
  { id: 'sold', label: 'Sold' },
  { id: 'returned', label: 'Returned' },
  { id: 'added', label: 'Added' },
  { id: 'corrected', label: 'Corrected' },
];

// A piece is sold out when none are left (or it was marked sold before stock was tracked).
export const stockOf = (p) => (p.stock == null ? (p.status === 'sold' ? 0 : 1) : Number(p.stock));
export const isSoldOut = (p) => p.status === 'sold' || stockOf(p) <= 0;
export const isLowStock = (p) => stockOf(p) <= Number(p.low_stock ?? 1);

let clientPromise;
function db() {
  clientPromise ??= import(SUPABASE_ESM).then(({ createClient }) =>
    createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey));
  return clientPromise;
}

const fail = (error) => { if (error) throw new Error(error.message || String(error)); };

// ---------- demo store (localStorage) ----------
const DEMO_KEY = 'ptg-demo-products-v3';
const DEMO_SETTINGS_KEY = 'ptg-demo-settings-v1';
const DEMO_SESSION_KEY = 'ptg-demo-admin';
const DEMO_COSTS_KEY = 'ptg-demo-costs-v1';
const DEMO_MOVES_KEY = 'ptg-demo-moves-v1';

function readJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { throw new Error('Browser storage is full. In demo mode, use smaller photos.'); }
}
const demoProducts = () => readJSON(DEMO_KEY, null) ?? DEMO_PRODUCTS;
const demoCosts = () => readJSON(DEMO_COSTS_KEY, null) ?? DEMO_COSTS;
const demoMoves = () => readJSON(DEMO_MOVES_KEY, null) ?? demoMovements();

// ---------- products ----------
const byNewest = (a, b) => (b.featured - a.featured) || String(b.created_at).localeCompare(String(a.created_at));

export async function listProducts({ includeHidden = false } = {}) {
  if (!isLive) {
    return demoProducts().filter((p) => includeHidden || p.visible !== false).sort(byNewest);
  }
  const sb = await db();
  let q = sb.from('products').select('*')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });
  if (!includeHidden) q = q.eq('visible', true);
  const { data, error } = await q;
  fail(error);
  return data;
}

// Saves a product. Stock is set only when a product is first added; after that
// it changes through recordMovement so the history always matches the count.
// `cost` (admin only) is the cost price; leave it undefined to keep the current one.
export async function saveProduct(product, imageFile, cost) {
  const row = { ...product };
  if (imageFile) row.image_url = await uploadImage(imageFile);
  row.price = Number(row.price) || 0;
  row.low_stock = Math.max(0, Math.round(Number(row.low_stock ?? 1) || 0));
  if (row.id) delete row.stock;
  else row.stock = Math.max(0, Math.round(Number(row.stock) || 0));
  delete row.sku;

  if (!isLive) {
    const all = demoProducts().slice();
    let id = row.id;
    if (id) {
      const i = all.findIndex((p) => p.id === id);
      all[i] = { ...all[i], ...row };
    } else {
      id = crypto.randomUUID();
      const next = Math.max(0, ...all.map((p) => Number(String(p.sku || '').replace(/\D/g, '')) || 0)) + 1;
      const created = { ...row, id, sku: `PTG-${String(next).padStart(4, '0')}`, created_at: new Date().toISOString() };
      all.push(created);
      if (created.stock > 0) pushDemoMove(created, 'added', created.stock, created.stock, created.stock, null);
    }
    writeJSON(DEMO_KEY, all);
    if (cost !== undefined) writeJSON(DEMO_COSTS_KEY, { ...demoCosts(), [id]: Number(cost) || 0 });
    return;
  }
  const sb = await db();
  const { id, created_at, ...fields } = row;
  let savedId = id;
  if (id) {
    const { error } = await sb.from('products').update(fields).eq('id', id);
    fail(error);
  } else {
    const { data, error } = await sb.from('products').insert(fields).select('id').single();
    fail(error);
    savedId = data.id;
  }
  if (cost !== undefined) {
    const { error } = await sb.from('product_costs').upsert({ product_id: savedId, cost_price: Number(cost) || 0 });
    fail(error);
  }
}

export async function deleteProduct(product) {
  if (!isLive) {
    writeJSON(DEMO_KEY, demoProducts().filter((p) => p.id !== product.id));
    writeJSON(DEMO_MOVES_KEY, demoMoves().map((m) => (m.product_id === product.id ? { ...m, product_id: null } : m)));
    return;
  }
  const sb = await db();
  const { error } = await sb.from('products').delete().eq('id', product.id);
  fail(error);
  const marker = `/object/public/${BUCKET}/`;
  const at = (product.image_url || '').indexOf(marker);
  if (at > -1) await sb.storage.from(BUCKET).remove([product.image_url.slice(at + marker.length)]);
}

export function resetDemo() {
  for (const k of [DEMO_KEY, DEMO_SETTINGS_KEY, DEMO_COSTS_KEY, DEMO_MOVES_KEY]) localStorage.removeItem(k);
}

// ---------- inventory (admin only) ----------
export async function listCosts() {
  if (!isLive) return { ...demoCosts() };
  const sb = await db();
  const { data, error } = await sb.from('product_costs').select('product_id, cost_price');
  fail(error);
  return Object.fromEntries(data.map((r) => [r.product_id, Number(r.cost_price)]));
}

function pushDemoMove(p, kind, qty, change, after, note) {
  const moves = demoMoves();
  moves.push({
    id: Math.max(0, ...moves.map((m) => m.id)) + 1, product_id: p.id, product_name: p.name, sku: p.sku, kind, qty, change,
    stock_after: after,
    unit_price: Number(p.price), unit_cost: kind === 'added' ? null : (demoCosts()[p.id] ?? null),
    note: note || null, by_email: readJSON(DEMO_SESSION_KEY, {})?.email || 'demo', created_at: new Date().toISOString(),
  });
  writeJSON(DEMO_MOVES_KEY, moves);
}

// Records a stock change. kind: sold | returned | added | corrected.
// For "corrected", qty is the new count. Returns the new stock.
export async function recordMovement(productId, kind, qty, note = '') {
  qty = Math.round(Number(qty));
  if (!Number.isFinite(qty) || qty < 0 || (kind !== 'corrected' && qty === 0)) throw new Error('Enter how many pieces.');
  if (!isLive) {
    const all = demoProducts().slice();
    const i = all.findIndex((p) => p.id === productId);
    if (i < 0) throw new Error('That product no longer exists.');
    const p = all[i], stock = stockOf(p);
    const change = { sold: -qty, returned: qty, added: qty, corrected: qty - stock }[kind];
    if (stock + change < 0) throw new Error(`Only ${stock} in stock.`);
    const after = stock + change;
    pushDemoMove(p, kind, qty, change, after, note);
    all[i] = { ...p, stock: after, status: after === 0 ? 'sold' : p.status === 'sold' ? 'available' : p.status };
    writeJSON(DEMO_KEY, all);
    return after;
  }
  const sb = await db();
  const { data, error } = await sb.rpc('record_movement', { p_product: productId, p_kind: kind, p_qty: qty, p_note: note || null });
  fail(error);
  return data;
}

// Stock history between two dates (Date objects), newest first.
export async function listMovements(from, to) {
  if (!isLive) {
    const a = from.toISOString(), b = to.toISOString();
    return demoMoves().filter((m) => m.created_at >= a && m.created_at < b)
      .sort((x, y) => y.created_at.localeCompare(x.created_at));
  }
  const sb = await db();
  const { data, error } = await sb.from('stock_movements').select('*')
    .gte('created_at', from.toISOString()).lt('created_at', to.toISOString())
    .order('created_at', { ascending: false }).limit(5000);
  fail(error);
  return data;
}

// Shrinks photos before upload so the free storage tier lasts and pages load fast.
export function resizeImage(file, maxSide = 1400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not read that image.'))), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file is not an image we can read.')); };
    img.src = url;
  });
}

async function uploadImage(file) {
  if (!isLive) {
    const blob = await resizeImage(file, 700, 0.75);
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(blob);
    });
  }
  const blob = await resizeImage(file);
  const sb = await db();
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.jpg`;
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
  fail(error);
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// ---------- settings ----------
const DEFAULT_SETTINGS = {
  whatsapp_number: CONFIG.whatsappNumber,
  announcement: '',
  instagram: CONFIG.instagram,
  address: CONFIG.location,
  hours: '',
  map_url: '',
};

export async function getSettings() {
  if (!isLive) return { ...DEFAULT_SETTINGS, ...readJSON(DEMO_SETTINGS_KEY, {}) };
  try {
    const sb = await db();
    const { data } = await sb.from('settings').select('*').eq('id', 1).maybeSingle();
    const merged = { ...DEFAULT_SETTINGS };
    for (const [k, v] of Object.entries(data || {})) if (v) merged[k] = v;
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings) {
  if (!isLive) { writeJSON(DEMO_SETTINGS_KEY, settings); return; }
  const sb = await db();
  const { error } = await sb.from('settings').upsert({ id: 1, ...settings });
  fail(error);
}

// ---------- admin auth ----------
export async function currentAdmin() {
  if (!isLive) return readJSON(DEMO_SESSION_KEY, null);
  const sb = await db();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const { data: ok } = await sb.rpc('is_admin');
  return ok ? { email: session.user.email } : null;
}

export async function signIn(email, password) {
  if (!isLive) {
    if (password !== 'demo') throw new Error('Demo mode: the password is "demo".');
    const admin = { email: email || 'demo@pasttimesgems' };
    writeJSON(DEMO_SESSION_KEY, admin);
    return admin;
  }
  const sb = await db();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Email or password is not correct.');
  const admin = await currentAdmin();
  if (!admin) {
    await sb.auth.signOut();
    throw new Error('This account is not on the admin list. Ask the shop owner to add it.');
  }
  return admin;
}

export async function signOut() {
  if (!isLive) { localStorage.removeItem(DEMO_SESSION_KEY); return; }
  const sb = await db();
  await sb.auth.signOut();
}

// ---------- formatting ----------
const qar = new Intl.NumberFormat('en-QA', { maximumFractionDigits: 2 });
export const money = (n) => (document.documentElement.lang === 'ar'
  ? `${qar.format(Number(n) || 0)} ر.ق`
  : `${CONFIG.currency} ${qar.format(Number(n) || 0)}`);

export const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
