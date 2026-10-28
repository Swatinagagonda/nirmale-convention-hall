// Nirmale Convention Hall – API for Cloudflare Pages (free hosting), data stored in Supabase (free).
// Handles every /api/* route with the same behaviour as server.js; the pages themselves are static files in /public.
// Settings (Cloudflare → Pages project → Settings → Variables and Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_PASSWORD   (required)
//   SESSION_SECRET                                        (optional, recommended)
//   RESEND_API_KEY, ENQUIRY_TO, EMAIL_FROM                (optional – email each enquiry)

const SESSION_MS = 1000 * 60 * 60 * 12;
const MAX_UPLOAD = 8 * 1024 * 1024;
const BUCKET = 'uploads';
const EDITABLE = ['site', 'hero', 'about', 'team', 'videos', 'reviews', 'facilities', 'stats', 'events'];
const enc = new TextEncoder();

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const fail = (status, error, extra) => json({ error, ...extra }, status);
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const uid = (p = '') => p + Date.now().toString(36) + hex(crypto.getRandomValues(new Uint8Array(3)));
const clean = (v, max = 500) => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, max);

// ---------- Supabase (REST + Storage, no SDK needed) ----------
function supabase(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY are not set');
  const base = env.SUPABASE_URL.replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_KEY;
  // Legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys only need apikey
  const auth = key.startsWith('eyJ') ? { apikey: key, Authorization: 'Bearer ' + key } : { apikey: key };
  const JSON_H = { 'Content-Type': 'application/json' };

  async function call(path, opts = {}) {
    const res = await fetch(base + path, { ...opts, headers: { ...auth, ...opts.headers } });
    const text = await res.text();
    if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}: ${text}`);
    // Writes with "return=minimal" come back empty
    return text ? JSON.parse(text) : null;
  }
  const eq = v => 'eq.' + encodeURIComponent(v);
  const publicPrefix = `${base}/storage/v1/object/public/${BUCKET}/`;

  return {
    // kv table: one row per document ("content", "users")
    get: async (k, fallback) => (await call(`/rest/v1/kv?key=${eq(k)}&select=value`))[0]?.value ?? fallback,
    set: (k, value) => call('/rest/v1/kv', {
      method: 'POST', headers: { ...JSON_H, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ key: k, value, updated_at: new Date().toISOString() })
    }),
    ping: () => call('/rest/v1/kv?select=key&limit=1'),

    // enquiries table: newest first
    enquiries: async () => (await call('/rest/v1/enquiries?select=data&order=created_at.desc')).map(r => r.data),
    enquiry: async id => (await call(`/rest/v1/enquiries?id=${eq(id)}&select=data`))[0]?.data,
    addEnquiry: e => call('/rest/v1/enquiries', {
      method: 'POST', headers: { ...JSON_H, Prefer: 'return=minimal' },
      body: JSON.stringify({ id: e.id, created_at: e.createdAt, data: e })
    }),
    saveEnquiry: e => call(`/rest/v1/enquiries?id=${eq(e.id)}`, {
      method: 'PATCH', headers: { ...JSON_H, Prefer: 'return=minimal' }, body: JSON.stringify({ data: e })
    }),
    deleteEnquiry: id => call(`/rest/v1/enquiries?id=${eq(id)}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }),

    // Storage bucket "uploads" (public read)
    upload: async (name, file) => {
      await call(`/storage/v1/object/${BUCKET}/${name}`, {
        method: 'POST', headers: { 'Content-Type': file.type || 'image/jpeg', 'Cache-Control': 'max-age=2592000' }, body: file
      });
      return publicPrefix + name;
    },
    // Photos that shipped with the site live in /public/uploads and are left alone
    removeUpload: url => url && url.startsWith(publicPrefix)
      ? call(`/storage/v1/object/${BUCKET}/${url.slice(publicPrefix.length)}`, { method: 'DELETE' }).catch(() => {})
      : Promise.resolve()
  };
}

// ---------- Password hashing (PBKDF2 – built into Cloudflare) ----------
async function hashPassword(pw, salt = hex(crypto.getRandomValues(new Uint8Array(16)))) {
  const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, k, 256);
  return { salt, hash: hex(bits) };
}
function sameText(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function checkPassword(pw, user) {
  return !!user?.salt && sameText((await hashPassword(pw, user.salt)).hash, user.hash);
}
// First login creates "admin" and "manager" with the ADMIN_PASSWORD setting
async function getUsers(db, env) {
  const users = await db.get('users', null);
  if (users) return users;
  if (!env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD is not set');
  const fresh = [
    { username: 'admin', name: 'Owner', ...(await hashPassword(env.ADMIN_PASSWORD)) },
    { username: 'manager', name: 'Manager', ...(await hashPassword(env.ADMIN_PASSWORD)) }
  ];
  await db.set('users', fresh);
  return fresh;
}

// ---------- Sessions (signed cookie; changing the password logs out old sessions) ----------
async function sign(env, text) {
  const k = await crypto.subtle.importKey('raw', enc.encode(env.SESSION_SECRET || env.SUPABASE_SERVICE_KEY),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(text)));
}
async function sessionCookie(env, user, request) {
  const expires = Date.now() + SESSION_MS;
  const token = `${user.username}.${expires}.${await sign(env, `${user.username}.${expires}.${user.salt}`)}`;
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `nch_session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_MS / 1000}${secure}`;
}
function getCookie(request, name) {
  const m = (request.headers.get('Cookie') || '').match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}
async function currentUser(request, env, db) {
  const [username, expires, sig] = (getCookie(request, 'nch_session') || '').split('.');
  if (!sig || Number(expires) < Date.now()) return null;
  const user = (await getUsers(db, env)).find(u => u.username === username);
  if (!user || !sameText(sig, await sign(env, `${username}.${expires}.${user.salt}`))) return null;
  return user;
}

// ---------- Simple rate limiter (per Cloudflare server, best effort) ----------
const hits = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter(t => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  return list.length > max;
}

// ---------- Uploads ----------
async function readImages(request) {
  const form = await request.formData();
  const isFile = f => f && typeof f !== 'string';
  const image = form.get('image');
  const thumb = form.get('thumb');
  if (isFile(image) && image.size > MAX_UPLOAD) return { error: fail(413, 'Image is larger than 8 MB.') };
  const ok = f => isFile(f) && f.size <= MAX_UPLOAD && /^image\/(jpeg|png|webp)$/.test(f.type);
  if (!ok(image)) return { error: fail(400, 'Please choose a JPG, PNG or WEBP image under 8 MB.') };
  return { form, image, thumb: ok(thumb) ? thumb : null };
}
async function storeImages(db, { image, thumb }) {
  const src = await db.upload(uid('img-') + '.jpg', image);
  return { src, thumb: thumb ? await db.upload(uid('img-') + '-t.jpg', thumb) : src };
}
const isInUse = (content, url) => JSON.stringify(content).includes(`"${url}"`);

// ---------- Enquiry email (optional, via Resend's free plan) ----------
async function emailEnquiry(env, db, e) {
  const site = (await db.get('content', {})).site || {};
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.EMAIL_FROM || `${site.name || 'Website'} Enquiry <onboarding@resend.dev>`,
      to: env.ENQUIRY_TO || site.email,
      reply_to: e.email || undefined,
      subject: `New booking enquiry: ${e.eventType} – ${e.name}`,
      text: `Name: ${e.name}\nMobile: ${e.phone}\nEmail: ${e.email || '-'}\nEvent: ${e.eventType}\nDate: ${e.date || '-'}\nGuests: ${e.guests || '-'}\n\n${e.message || ''}`
    })
  });
  if (!res.ok) console.error('Email failed:', res.status, await res.text());
}

// ---------- Routes ----------
export async function onRequest(context) {
  const { request, env } = context;
  try {
    return await route(context, supabase(env));
  } catch (err) {
    console.error(err.message);
    return fail(500, 'Something went wrong.');
  }
}

async function route({ request, env, params, waitUntil }, db) {
  const method = request.method;
  const parts = [].concat(params.path || []);
  const path = '/' + parts.join('/');
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const body = async () => { try { return await request.json(); } catch { return {}; } };
  // Public content is cached for 60 s at each Cloudflare location; admin saves clear it
  const cacheKey = new Request(new URL('/api/content', request.url).toString());
  const contentChanged = () => caches.default.delete(cacheKey).catch(() => {});

  // ----- Public -----
  if (method === 'GET' && path === '/content') {
    const cached = await caches.default.match(cacheKey).catch(() => null);
    if (cached) return cached;
    const text = JSON.stringify(await db.get('content', {}));
    const store = new Response(text, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=60' } });
    waitUntil(caches.default.put(cacheKey, store).catch(() => {}));
    return new Response(text, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' } });
  }
  if (method === 'GET' && path === '/health') {
    await db.ping();
    return json({ ok: true });
  }

  if (method === 'POST' && path === '/enquiry') {
    if (rateLimit('enq:' + ip, 5, 10 * 60 * 1000)) return fail(429, 'Too many enquiries. Please call us directly.');
    const b = await body();
    if (b.website) return json({ ok: true }); // honeypot for bots
    const e = {
      id: uid('e'),
      name: clean(b.name, 80),
      phone: clean(b.phone, 20),
      email: clean(b.email, 120),
      eventType: clean(b.eventType, 40),
      date: clean(b.date, 20),
      guests: clean(b.guests, 10),
      message: clean(b.message, 1500),
      status: 'new',
      createdAt: new Date().toISOString()
    };
    const errors = [];
    if (e.name.length < 2) errors.push('name');
    if (!/^[6-9]\d{9}$/.test(e.phone.replace(/[\s+-]/g, '').replace(/^(91|0)/, ''))) errors.push('phone');
    if (e.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email)) errors.push('email');
    if (!e.eventType) errors.push('eventType');
    if (errors.length) return fail(400, 'Please check the highlighted fields.', { fields: errors });
    await db.addEnquiry(e);
    if (env.RESEND_API_KEY) waitUntil(emailEnquiry(env, db, e).catch(err => console.error('Email failed:', err.message)));
    return json({ ok: true });
  }

  // ----- Auth -----
  if (method === 'POST' && path === '/login') {
    if (rateLimit('login:' + ip, 10, 15 * 60 * 1000)) return fail(429, 'Too many attempts. Try again in 15 minutes.');
    const { username = '', password = '' } = await body();
    const user = (await getUsers(db, env)).find(u => u.username === String(username).toLowerCase().trim());
    if (!user || !(await checkPassword(String(password), user))) return fail(401, 'Wrong username or password.');
    return json({ ok: true, user: { username: user.username, name: user.name } }, 200,
      { 'Set-Cookie': await sessionCookie(env, user, request) });
  }
  if (method === 'POST' && path === '/logout') {
    return json({ ok: true }, 200, { 'Set-Cookie': 'nch_session=; HttpOnly; Path=/; Max-Age=0' });
  }

  // ----- Everything below needs a logged-in admin -----
  const isAdmin = path === '/me' || path.startsWith('/admin/');
  if (!isAdmin) return fail(404, 'Not found');
  const user = await currentUser(request, env, db);
  if (!user) return fail(401, 'Please log in again.');

  if (method === 'GET' && path === '/me') return json({ username: user.username });

  if (method === 'POST' && path === '/admin/password') {
    const { current = '', next = '' } = await body();
    if (!(await checkPassword(String(current), user))) return fail(400, 'Current password is wrong.');
    if (String(next).length < 8) return fail(400, 'New password must be at least 8 characters.');
    const users = await getUsers(db, env);
    const me = users.find(u => u.username === user.username);
    Object.assign(me, await hashPassword(String(next)));
    await db.set('users', users);
    // Keep this browser logged in with a cookie signed for the new password
    return json({ ok: true }, 200, { 'Set-Cookie': await sessionCookie(env, me, request) });
  }

  // Content sections
  if (method === 'PUT' && parts[1] === 'content' && parts.length === 3) {
    if (!EDITABLE.includes(parts[2])) return fail(400, 'Unknown section');
    const content = await db.get('content', {});
    content[parts[2]] = await body();
    await db.set('content', content);
    await contentChanged();
    return json({ ok: true });
  }

  // Single site image (hero, about, team photo)
  if (method === 'POST' && path === '/admin/upload') {
    const files = await readImages(request);
    if (files.error) return files.error;
    return json(await storeImages(db, files));
  }

  // Gallery photos
  if (method === 'POST' && path === '/admin/photos') {
    const files = await readImages(request);
    if (files.error) return files.error;
    const urls = await storeImages(db, files);
    const content = await db.get('content', {});
    const photo = {
      id: uid('p'),
      ...urls,
      caption: clean(files.form.get('caption'), 120),
      category: clean(files.form.get('category'), 40) || 'Events',
      featured: files.form.get('featured') === 'true'
    };
    content.gallery = [photo, ...(content.gallery || [])];
    await db.set('content', content);
    await contentChanged();
    return json(photo);
  }
  if (method === 'PUT' && path === '/admin/photos/order') {
    const { ids = [] } = await body();
    const content = await db.get('content', {});
    const byId = new Map((content.gallery || []).map(p => [p.id, p]));
    const ordered = ids.map(id => byId.get(id)).filter(Boolean);
    const rest = (content.gallery || []).filter(p => !ids.includes(p.id));
    content.gallery = [...ordered, ...rest];
    await db.set('content', content);
    await contentChanged();
    return json({ ok: true });
  }
  if (parts[1] === 'photos' && parts.length === 3 && (method === 'PATCH' || method === 'DELETE')) {
    const content = await db.get('content', {});
    const p = (content.gallery || []).find(x => x.id === parts[2]);
    if (!p) return fail(404, 'Photo not found');
    if (method === 'PATCH') {
      const b = await body();
      if ('caption' in b) p.caption = clean(b.caption, 120);
      if ('category' in b) p.category = clean(b.category, 40);
      if ('featured' in b) p.featured = !!b.featured;
      await db.set('content', content);
      await contentChanged();
      return json(p);
    }
    content.gallery = content.gallery.filter(x => x.id !== p.id);
    await db.set('content', content);
    await contentChanged();
    // Only delete the files if no other part of the site still uses them
    await Promise.all([p.src, p.thumb].filter(u => !isInUse(content, u)).map(u => db.removeUpload(u)));
    return json({ ok: true });
  }

  // Enquiries
  if (method === 'GET' && path === '/admin/enquiries') return json(await db.enquiries());
  if (parts[1] === 'enquiries' && parts.length === 3) {
    if (method === 'DELETE') {
      await db.deleteEnquiry(parts[2]);
      return json({ ok: true });
    }
    if (method === 'PATCH') {
      const e = await db.enquiry(parts[2]);
      if (!e) return fail(404, 'Not found');
      const { status } = await body();
      if (['new', 'contacted', 'booked', 'closed'].includes(status)) e.status = status;
      await db.saveEnquiry(e);
      return json(e);
    }
  }

  return fail(404, 'Not found');
}
