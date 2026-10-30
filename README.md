# Nirmale Convention Hall Website

Website for Nirmale Convention Hall, a function hall and marriage hall in Aurad (B), Bidar, Karnataka.

Live site: https://nirmaleconventionhall.in

Designed and developed by Swati Kushnoore.

## About the project

The hall needed a website where customers can see the venue, photos and events, and send a booking enquiry.
The owner and manager also needed a simple way to update photos, videos and details without any coding.
So the site has two parts:

1. A public website with six pages: Home, About, Events, Facilities, Gallery and Contact.
2. An admin panel where the owner and manager log in and manage everything.

## Features

**Website**
* Photo gallery and YouTube videos
* Booking enquiry form, with a one tap WhatsApp option
* Call, WhatsApp and Book buttons on every page
* Google Map with directions
* Works well on phones, with smaller images for faster loading
* Search friendly: page titles, sitemap, structured data for Google

**Admin panel**
* Upload, reorder, caption and delete photos
* Add and arrange YouTube videos
* View booking enquiries and mark them New, Contacted, Booked or Closed
* Edit business details, events, facilities, reviews, owner and manager info
* QR codes for the website and the hall location, ready to download, share or print
* Password change for each admin user

## Tech stack

| Part | Used |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend API | Cloudflare Pages Functions |
| Database and photo storage | Supabase (PostgreSQL) |
| Hosting | Cloudflare Pages |
| Domain | nirmaleconventionhall.in (GoDaddy, DNS on Cloudflare) |

Admin passwords are stored as PBKDF2 hashes, logins use signed cookies, and the database is only reachable through the API.

## Folder structure

```
public/            Website pages, styles, scripts and photos
functions/api/     Backend API (enquiries, login, admin actions)
supabase/          Database setup script
scripts/           Script to copy content into Supabase
.github/workflows/ Daily check that keeps the database active
```

## Running locally

1. Install Node.js 18 or newer.
2. Run `npm install`.
3. Copy `.dev.vars.example` to `.dev.vars` and fill in the Supabase details and an admin password.
4. Run `npm run cf:dev` and open the address it shows.

The admin panel is at `/admin`.

## Deployment

The site deploys to Cloudflare Pages automatically on every push to `main`.

Settings in Cloudflare Pages:
* Build command: none
* Output directory: `public`
* Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET`
* Optional email alerts: `RESEND_API_KEY`, `ENQUIRY_TO`

For a new Supabase project, run `supabase/schema.sql` in the SQL editor, then `npm run supabase:import` to load the content.

## License

This website was built for Nirmale Convention Hall. The code, photos and content are not for reuse without permission.
