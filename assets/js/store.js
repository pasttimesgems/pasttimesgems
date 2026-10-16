// Data layer shared by the shop and the admin page.
// Uses Supabase when config.js has keys, otherwise a browser-only demo store.

import { CONFIG } from './config.js';
import { DEMO_PRODUCTS } from './demo-data.js';

const SUPABASE_ESM = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
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

let clientPromise;
function db() {
  clientPromise ??= import(SUPABASE_ESM).then(({ createClient }) =>
    createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey));
  return clientPromise;
}

const fail = (error) => { if (error) throw new Error(error.message || String(error)); };

// ---------- demo store (localStorage) ----------
const DEMO_KEY = 'ptg-demo-products-v1';
const DEMO_SETTINGS_KEY = 'ptg-demo-settings-v1';
const DEMO_SESSION_KEY = 'ptg-demo-admin';

function readJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { throw new Error('Browser storage is full. In demo mode, use smaller photos.'); }
}
const demoProducts = () => readJSON(DEMO_KEY, null) ?? DEMO_PRODUCTS;

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

export async function saveProduct(product, imageFile) {
  const row = { ...product };
  if (imageFile) row.image_url = await uploadImage(imageFile);
  row.price = Number(row.price) || 0;

  if (!isLive) {
    const all = demoProducts().slice();
    if (row.id) {
      const i = all.findIndex((p) => p.id === row.id);
      all[i] = { ...all[i], ...row };
    } else {
      all.push({ ...row, id: crypto.randomUUID(), created_at: new Date().toISOString() });
    }
    writeJSON(DEMO_KEY, all);
    return;
  }
  const sb = await db();
  const { id, created_at, ...fields } = row;
  const { error } = id
    ? await sb.from('products').update(fields).eq('id', id)
    : await sb.from('products').insert(fields);
  fail(error);
}

export async function deleteProduct(product) {
  if (!isLive) {
    writeJSON(DEMO_KEY, demoProducts().filter((p) => p.id !== product.id));
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
  localStorage.removeItem(DEMO_KEY);
  localStorage.removeItem(DEMO_SETTINGS_KEY);
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
export const money = (n) => `${CONFIG.currency} ${qar.format(Number(n) || 0)}`;

export const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
