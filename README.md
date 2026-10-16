# Nirmale Convention Hall – Website

A black & gold marketing website for **Nirmale Convention Hall, 75 Lidkar Colony, Aurad, Karnataka 585326**, with an admin panel so the owner and manager can manage photos, videos and content themselves.

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

## Going live
This is a Node.js app (needs a host that runs Node 18+ and keeps files on disk), for example:
- **Hostinger / any VPS** – upload the folder, `npm install`, run `npm start` with PM2.
- **Render / Railway** – deploy from GitHub; add a **persistent disk** and set `DATA_DIR` and `UPLOAD_DIR` to it so photos and edits survive restarts.

After launch, replace `www.nirmaleconventionhall.in` in `public/robots.txt` and `public/sitemap.xml` with the real domain.

## Before launch – please confirm with the owner
- WhatsApp number (currently set to 98805 40333).
- Which facilities are really provided (only Stage, Lighting, Sound and Décor are marked *Available*; the rest show “Ask for details”).
- Seating capacity (Business Info → Capacity).
- The 10 videos are third-party wedding-décor videos from YouTube as placeholders – replace them with the hall's own videos when available.
- Some décor photos carry other decorators' watermarks/phone numbers; replace with the hall's own event photos over time.
