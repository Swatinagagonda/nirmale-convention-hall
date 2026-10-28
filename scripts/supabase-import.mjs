// Copies the current site content (and any saved enquiries) from data/ into Supabase.
// Run once after supabase/schema.sql:  npm run supabase:import
// Reads SUPABASE_URL and SUPABASE_SERVICE_KEY from .dev.vars (or from the environment).
// Admin logins are not copied – they are created on the first login from the ADMIN_PASSWORD setting.

import { readFileSync, existsSync } from 'node:fs';

const devVars = existsSync('.dev.vars')
  ? Object.fromEntries(readFileSync('.dev.vars', 'utf8').split(/\r?\n/)
      .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)).filter(Boolean).map(m => [m[1], m[2].replace(/^["']|["']$/g, '')]))
  : {};
const SUPABASE_URL = process.env.SUPABASE_URL || devVars.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || devVars.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY first.');
  process.exit(1);
}
const base = SUPABASE_URL.replace(/\/+$/, '');
const headers = {
  apikey: key,
  ...(key.startsWith('eyJ') ? { Authorization: 'Bearer ' + key } : {}),
  'Content-Type': 'application/json',
  Prefer: 'resolution=merge-duplicates,return=minimal'
};
const readJSON = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback);

async function post(table, rows) {
  const res = await fetch(`${base}/rest/v1/${table}`, { method: 'POST', headers, body: JSON.stringify(rows) });
  if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
}

const content = readJSON('data/content.json', null) || readJSON('data/content.seed.json', {});
await post('kv', [{ key: 'content', value: content, updated_at: new Date().toISOString() }]);
console.log(`Content copied (${(content.gallery || []).length} gallery photos).`);

const enquiries = readJSON('data/enquiries.json', []);
if (enquiries.length) {
  await post('enquiries', enquiries.map(e => ({ id: e.id, created_at: e.createdAt, data: e })));
}
console.log(`Enquiries copied: ${enquiries.length}.`);
