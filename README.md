# Nirmale Convention Hall – Website

A black & gold marketing website for **Nirmale Convention Hall, 75 Lidkar Colony, Aurad (B), Dist. Bidar, Karnataka 585326**, with an admin panel so the owner and manager can manage photos, videos and content themselves.

## Pages
| Page | File |
|---|---|
| Home | `public/index.html` |
| About (with Owner & Manager) | `public/about.html` |
| Events | `public/events.html` |
| Facilities | `public/facilities.html` |
| Gallery (30 photos + 10 YouTube videos) | `public/gallery.html` |
| Booking Enquiry & Contact (form + map) | `public/contact.html` |
| Admin panel | `public/admin.html` |

## Run on your computer
```bash
npm install
npm start
```
Open http://localhost:3000 – the admin panel is at http://localhost:3000/admin.html
(also linked as “Admin” in the footer).

## Admin login
| Username | Password (first time) |
|---|---|
| `admin` (Owner) | the `ADMIN_PASSWORD` you set on the server |
| `manager` | the same `ADMIN_PASSWORD` |

**Change both passwords after the first login** (Admin → Password).

In the admin panel you can:
- **Photo Gallery** – upload (drag & drop, auto-resized), delete, re-order, change caption/category, choose which photos show on the Home page (★).
- **Enquiries** – see every booking enquiry, call/WhatsApp the customer, mark New / Contacted / Booked / Closed.
- **Videos** – paste any YouTube link to add; edit titles, re-order, delete.
- **Owner & Manager** – edit names, descriptions, quotes and photos.
- **Business Info** – phone, WhatsApp, email, address, map, capacity, social links, home banner and About text.
- **Events / Facilities / Reviews & Stats** – edit text; mark facilities Available / Ask for details / Hidden.

## Where content lives
- `data/content.json` – all editable content (`data/content.seed.json` is the original copy for reset).
- `data/enquiries.json` – booking enquiries.
- `data/users.json` – admin logins (hashed passwords, created on first start).
- `public/uploads/` – all photos.

## Email notifications (optional)
Enquiries are always saved in the admin panel and the customer is offered a one-tap WhatsApp send.
To also receive each enquiry by email, set `SMTP_USER` and `SMTP_PASS` (a Gmail App Password) – see `.env.example`.

## Going live for free – Cloudflare Pages + Supabase
The pages are served by **Cloudflare Pages** (free, fast everywhere, never sleeps). The `/api/*` routes run as
Cloudflare Pages Functions ([functions/api/[[path]].js](functions/api/[[path]].js)) and keep content, enquiries,
admin logins and new photos in **Supabase** (free). The photos already in `public/uploads/` stay on Cloudflare.

1. **Supabase** – create a free project at https://supabase.com.
   - SQL Editor → paste [supabase/schema.sql](supabase/schema.sql) → **Run**.
   - Project Settings → API Keys: copy the **Project URL** and the **secret key** (`service_role`).
   - Copy the current content into it (from this folder, in Git Bash):
     copy `.dev.vars.example` to `.dev.vars`, fill in the two Supabase values, then run `npm run supabase:import`
2. **GitHub** – push this folder to your repository.
3. **Cloudflare** – free account at https://dash.cloudflare.com → Workers & Pages → Create → Pages →
   *Connect to Git* → choose the repository.
   - Framework preset: **None**, Build command: *(leave empty)*, Build output directory: **public**.
   - Settings → Variables and Secrets (type *Secret*): `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`,
     `ADMIN_PASSWORD`, `SESSION_SECRET` (any long random text). Then **Retry deployment**.
   - The site is live at `https://<project-name>.pages.dev`. Every push to GitHub redeploys it.
4. **Keep Supabase awake** – free Supabase projects pause after a week with no activity. In GitHub →
   Settings → Secrets and variables → Actions → *Variables*, add `SITE_URL` = your site address; the
   [daily ping](.github/workflows/keep-supabase-awake.yml) then keeps it active.
5. **Your own domain (later)** – Cloudflare Pages project → Custom domains → *Set up a domain*. If the domain is
   bought at GoDaddy, change its nameservers to the two Cloudflare gives you; Cloudflare adds the DNS record and SSL.
6. **Email for each enquiry (optional)** – free account at https://resend.com, then add `RESEND_API_KEY` and
   `ENQUIRY_TO` (the owner's email) in Cloudflare.

Test the Cloudflare version on your computer: copy `.dev.vars.example` to `.dev.vars`, fill it in, run `npm run cf:dev`.

## Other hosting
The Node.js server (`npm start`) also runs on any host with Node 18+ that keeps files on disk, for example:
- **Hostinger / any VPS** – upload the folder, `npm install`, run `npm start` with PM2.
- **Render / Railway** – deploy from GitHub; add a **persistent disk** and set `DATA_DIR` and `UPLOAD_DIR` to it so photos and edits survive restarts.

When you add your own domain, replace `nirmale-convention-hall.pages.dev` in `public/robots.txt` and `public/sitemap.xml` with it.

## Before launch – please confirm with the owner
- WhatsApp number (currently set to 98805 40333).
- Which facilities are really provided (only Stage, Lighting, Sound and Décor are marked *Available*; the rest show “Ask for details”).
- Seating capacity (Business Info → Capacity).
- The 10 videos are third-party wedding-décor videos from YouTube as placeholders – replace them with the hall's own videos when available.
- Some décor photos carry other decorators' watermarks/phone numbers; replace with the hall's own event photos over time.
