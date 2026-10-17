// Nirmale Convention Hall – website + admin server
// Run: npm install && npm start   (then open http://localhost:3000, admin at /admin.html)

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const PUBLIC_DIR = path.join(ROOT, 'public');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(PUBLIC_DIR, 'uploads');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const ENQUIRY_FILE = path.join(DATA_DIR, 'enquiries.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
// First-time admin password comes from the ADMIN_PASSWORD setting; if missing, a random one is printed in the logs
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------- JSON storage helpers ----------
function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJSON(file, data) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}
const uid = (p = '') => p + Date.now().toString(36) + crypto.randomBytes(3).toString('hex');

// ---------- Password hashing ----------
function hashPassword(pw, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(pw, salt, 64).toString('hex') };
}
function checkPassword(pw, user) {
  const h = crypto.scryptSync(pw, user.salt, 64);
  return crypto.timingSafeEqual(h, Buffer.from(user.hash, 'hex'));
}
if (!fs.existsSync(USERS_FILE)) {
  writeJSON(USERS_FILE, [
    { username: 'admin', name: 'Owner', ...hashPassword(DEFAULT_PASSWORD) },
    { username: 'manager', name: 'Manager', ...hashPassword(DEFAULT_PASSWORD) }
  ]);
  console.log(`Created admin users "admin" and "manager" with password: ${DEFAULT_PASSWORD}  (change it after first login)`);
}
if (!fs.existsSync(ENQUIRY_FILE)) writeJSON(ENQUIRY_FILE, []);

// ---------- Sessions (signed, in-memory) ----------
const sessions = new Map(); // token -> { username, expires }
const SESSION_MS = 1000 * 60 * 60 * 12;
function getCookie(req, name) {
  const m = (req.headers.cookie || '').match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}
function requireAuth(req, res, next) {
  const token = getCookie(req, 'nch_session');
  const s = token && sessions.get(token);
  if (!s || s.expires < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: 'Please log in again.' });
  }
  s.expires = Date.now() + SESSION_MS;
  req.user = s.username;
  next();
}

// ---------- Simple rate limiter ----------
const hits = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter(t => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  return list.length > max;
}

// ---------- Email (optional) ----------
let mailer = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  const nodemailer = require('nodemailer');
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  console.log('Email notifications enabled via', process.env.SMTP_USER);
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// ---------- Public API ----------
app.get('/api/content', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json(readJSON(CONTENT_FILE, {}));
});

const clean = (v, max = 500) => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, max);

app.post('/api/enquiry', async (req, res) => {
  if (rateLimit('enq:' + req.ip, 5, 10 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many enquiries. Please call us directly.' });
  }
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot for bots
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
  if (errors.length) return res.status(400).json({ error: 'Please check the highlighted fields.', fields: errors });

  const list = readJSON(ENQUIRY_FILE, []);
  list.unshift(e);
  writeJSON(ENQUIRY_FILE, list);

  if (mailer) {
    const site = readJSON(CONTENT_FILE, {}).site || {};
    mailer.sendMail({
      from: `"${site.name || 'Website'} Enquiry" <${process.env.SMTP_USER}>`,
      to: process.env.ENQUIRY_TO || site.email,
      replyTo: e.email || undefined,
      subject: `New booking enquiry: ${e.eventType} – ${e.name}`,
      text: `Name: ${e.name}\nMobile: ${e.phone}\nEmail: ${e.email || '-'}\nEvent: ${e.eventType}\nDate: ${e.date || '-'}\nGuests: ${e.guests || '-'}\n\n${e.message || ''}`
    }).catch(err => console.error('Email failed:', err.message));
  }
  res.json({ ok: true });
});

// ---------- Auth ----------
app.post('/api/login', (req, res) => {
  if (rateLimit('login:' + req.ip, 10, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  }
  const { username = '', password = '' } = req.body || {};
  const user = readJSON(USERS_FILE, []).find(u => u.username === String(username).toLowerCase().trim());
  if (!user || !checkPassword(String(password), user)) {
    return res.status(401).json({ error: 'Wrong username or password.' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { username: user.username, expires: Date.now() + SESSION_MS });
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  res.set('Set-Cookie', `nch_session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_MS / 1000}${secure}`);
  res.json({ ok: true, user: { username: user.username, name: user.name } });
});
app.post('/api/logout', (req, res) => {
  sessions.delete(getCookie(req, 'nch_session'));
  res.set('Set-Cookie', 'nch_session=; HttpOnly; Path=/; Max-Age=0');
  res.json({ ok: true });
});
app.get('/api/me', requireAuth, (req, res) => res.json({ username: req.user }));
app.post('/api/admin/password', requireAuth, (req, res) => {
  const { current = '', next = '' } = req.body || {};
  const users = readJSON(USERS_FILE, []);
  const user = users.find(u => u.username === req.user);
  if (!user || !checkPassword(String(current), user)) return res.status(400).json({ error: 'Current password is wrong.' });
  if (String(next).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  Object.assign(user, hashPassword(String(next)));
  writeJSON(USERS_FILE, users);
  res.json({ ok: true });
});

// ---------- Admin: content sections ----------
const EDITABLE = ['site', 'hero', 'about', 'team', 'videos', 'reviews', 'facilities', 'stats', 'events'];
app.put('/api/admin/content/:section', requireAuth, (req, res) => {
  const { section } = req.params;
  if (!EDITABLE.includes(section)) return res.status(400).json({ error: 'Unknown section' });
  const content = readJSON(CONTENT_FILE, {});
  content[section] = req.body;
  writeJSON(CONTENT_FILE, content);
  res.json({ ok: true });
});

// ---------- Admin: uploads ----------
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, uid('img-') + (file.fieldname === 'thumb' ? '-t' : '') + '.jpg')
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype))
});
const uploadPair = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'thumb', maxCount: 1 }]);
const urlOf = f => (f ? '/uploads/' + f.filename : null);

function removeUpload(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const file = path.join(UPLOAD_DIR, path.basename(url));
  fs.promises.unlink(file).catch(() => {});
}
function isInUse(content, url) {
  return JSON.stringify(content).includes(`"${url}"`);
}

// Upload a single site image (hero, about, team photo)
app.post('/api/admin/upload', requireAuth, uploadPair, (req, res) => {
  const img = req.files?.image?.[0];
  if (!img) return res.status(400).json({ error: 'Please choose a JPG, PNG or WEBP image under 8 MB.' });
  res.json({ src: urlOf(img), thumb: urlOf(req.files?.thumb?.[0]) || urlOf(img) });
});

// Gallery photos
app.post('/api/admin/photos', requireAuth, uploadPair, (req, res) => {
  const img = req.files?.image?.[0];
  if (!img) return res.status(400).json({ error: 'Please choose a JPG, PNG or WEBP image under 8 MB.' });
  const content = readJSON(CONTENT_FILE, {});
  const photo = {
    id: uid('p'),
    src: urlOf(img),
    thumb: urlOf(req.files?.thumb?.[0]) || urlOf(img),
    caption: clean(req.body.caption, 120),
    category: clean(req.body.category, 40) || 'Events',
    featured: req.body.featured === 'true'
  };
  content.gallery = [photo, ...(content.gallery || [])];
  writeJSON(CONTENT_FILE, content);
  res.json(photo);
});
app.patch('/api/admin/photos/:id', requireAuth, (req, res) => {
  const content = readJSON(CONTENT_FILE, {});
  const p = (content.gallery || []).find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Photo not found' });
  if ('caption' in req.body) p.caption = clean(req.body.caption, 120);
  if ('category' in req.body) p.category = clean(req.body.category, 40);
  if ('featured' in req.body) p.featured = !!req.body.featured;
  writeJSON(CONTENT_FILE, content);
  res.json(p);
});
app.delete('/api/admin/photos/:id', requireAuth, (req, res) => {
  const content = readJSON(CONTENT_FILE, {});
  const p = (content.gallery || []).find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Photo not found' });
  content.gallery = content.gallery.filter(x => x.id !== p.id);
  writeJSON(CONTENT_FILE, content);
  // Only delete the files if no other part of the site still uses them
  [p.src, p.thumb].forEach(u => { if (!isInUse(content, u)) removeUpload(u); });
  res.json({ ok: true });
});
app.put('/api/admin/photos/order', requireAuth, (req, res) => {
  const ids = req.body?.ids || [];
  const content = readJSON(CONTENT_FILE, {});
  const byId = new Map((content.gallery || []).map(p => [p.id, p]));
  const ordered = ids.map(id => byId.get(id)).filter(Boolean);
  const rest = (content.gallery || []).filter(p => !ids.includes(p.id));
  content.gallery = [...ordered, ...rest];
  writeJSON(CONTENT_FILE, content);
  res.json({ ok: true });
});

// ---------- Admin: enquiries ----------
app.get('/api/admin/enquiries', requireAuth, (req, res) => res.json(readJSON(ENQUIRY_FILE, [])));
app.patch('/api/admin/enquiries/:id', requireAuth, (req, res) => {
  const list = readJSON(ENQUIRY_FILE, []);
  const e = list.find(x => x.id === req.params.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  if (['new', 'contacted', 'booked', 'closed'].includes(req.body.status)) e.status = req.body.status;
  writeJSON(ENQUIRY_FILE, list);
  res.json(e);
});
app.delete('/api/admin/enquiries/:id', requireAuth, (req, res) => {
  writeJSON(ENQUIRY_FILE, readJSON(ENQUIRY_FILE, []).filter(x => x.id !== req.params.id));
  res.json({ ok: true });
});

// ---------- Static site ----------
// Friendly shortcuts so common admin addresses all reach the login page
app.get(['/admin/', '/admin/login', '/login', '/admin-login', '/dashboard', '/wp-admin'], (req, res) => res.redirect(301, '/admin.html'));
// Remove trailing slashes, e.g. /about/ -> /about
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.length > 1 && req.path.endsWith('/')) {
    return res.redirect(301, req.path.replace(/\/+$/, '') + (req.url.slice(req.path.length) || ''));
  }
  next();
});
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d' }));
// Pages, styles and scripts are re-checked on every visit so design updates show up immediately
app.use(express.static(PUBLIC_DIR, { extensions: ['html'], maxAge: 0, setHeaders: res => res.setHeader('Cache-Control', 'no-cache') }));
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 500).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Image is larger than 8 MB.' : 'Something went wrong.' });
});
app.use((req, res) => res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html')));

app.listen(PORT, () => console.log(`Nirmale Convention Hall website running at http://localhost:${PORT}`));
