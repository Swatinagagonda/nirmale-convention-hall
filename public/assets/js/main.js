/* Nirmale Convention Hall — site script
   Renders header/footer, loads editable content from /api/content and builds each page. */
(function () {
  'use strict';

  // ---------- Icons ----------
  const P = {
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    wa: '<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    left: '<path d="M15 18l-6-6 6-6"/>',
    right: '<path d="M9 18l6-6-6-6"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    play: '<path d="M7 4v16l13-8z" fill="currentColor"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
    sparkle: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    stage: '<path d="M2 20h20M4 20V9h16v11M4 9l2-5h12l2 5M9 13h6v7H9z"/>',
    light: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
    sound: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    flower: '<circle cx="12" cy="12" r="3"/><path d="M12 9c0-3 1-6 0-6s-2 3 0 6M12 15c0 3-1 6 0 6s2-3 0-6M9 12c-3 0-6-1-6 0s3 2 6 0M15 12c3 0 6 1 6 0s-3-2-6 0"/>',
    ac: '<path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1 19.1 4.9M9 3l3 3 3-3M9 21l3-3 3 3"/>',
    car: '<path d="M5 17h14v-5l-2-5H7l-2 5zM5 12h14"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/>',
    dining: '<path d="M3 2v7a3 3 0 0 0 6 0V2M6 2v20M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7"/>',
    catering: '<path d="M3 18h18M5 18a7 7 0 0 1 14 0M12 8V6M10 6h4"/>',
    power: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    restroom: '<circle cx="7" cy="4" r="2"/><circle cx="17" cy="4" r="2"/><path d="M5 22V13l-1-5h6l-1 5v9M15 22v-6h-2l2-8h4l2 8h-2v6M12 2v20"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
    access: '<circle cx="12" cy="4" r="2"/><path d="M19 13v-2a7 7 0 0 1-7-2M9 9v5h6l3 7M7 13a5 5 0 1 0 6 6"/>',
    insta: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/>',
    fb: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    yt: '<path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/>',
    google: '<path d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5z"/><path d="M12 22c2.7 0 5-.9 6.8-2.4l-3.3-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.8v2.7A10 10 0 0 0 12 22z"/><path d="M6.2 13.7a6 6 0 0 1 0-3.4V7.6H2.8a10 10 0 0 0 0 8.8z"/><path d="M12 6c1.5 0 2.9.5 4 1.5l3-3A10 10 0 0 0 2.8 7.6l3.4 2.7C7 7.8 9.3 6 12 6z"/>',
    direction: '<path d="m3 11 19-9-9 19-2-8z"/>',
    building: '<path d="M3 21h18M5 21V5l7-3 7 3v16M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4"/>',
    vip: '<path d="M3 18h18M4 18 3 7l5 4 4-7 4 7 5-4-1 11"/><circle cx="12" cy="14" r="1.2"/>',
    lift: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 2v20M8.5 8 7 10h3zM15.5 10 17 8h-3z"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
  };
  const I = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.sparkle}</svg>`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const LOGO = `<svg class="brand-logo" viewBox="0 0 212 56" role="img" aria-label="Nirmale Convention Hall"><defs><linearGradient id="lgh" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="212" y2="56"><stop offset="0" stop-color="#f7e3a4"/><stop offset=".35" stop-color="#dcb560"/><stop offset=".65" stop-color="#b08a3e"/><stop offset="1" stop-color="#f0d38a"/></linearGradient></defs><text x="106" y="30" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="29" font-weight="600" textLength="208" lengthAdjust="spacingAndGlyphs" fill="url(#lgh)">NIRMALE</text><g stroke="url(#lgh)" stroke-width=".8"><path d="M2 44h20M190 44h20"/></g><path d="M24.5 44l1.5-1.5 1.5 1.5-1.5 1.5zM184.5 44l1.5-1.5 1.5 1.5-1.5 1.5z" fill="url(#lgh)"/><text x="106" y="47.8" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="10" font-weight="600" textLength="146" lengthAdjust="spacing" fill="url(#lgh)">CONVENTION HALL</text></svg>`;
  const LOGO_STACKED = `<svg class="brand-logo-stacked" viewBox="0 0 260 178" role="img" aria-label="Nirmale Convention Hall"><defs><linearGradient id="lgs" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="260" y2="178"><stop offset="0" stop-color="#f7e3a4"/><stop offset=".35" stop-color="#dcb560"/><stop offset=".65" stop-color="#b08a3e"/><stop offset="1" stop-color="#f0d38a"/></linearGradient></defs><g transform="translate(130 36)"><g fill="none" stroke="url(#lgs)" stroke-linecap="round"><path stroke-width="3.2" d="M-24 34 C-34 30 -38 18 -33 6 C-31 16 -27 24 -21 27"/><path stroke-width="2.2" d="M-24 40 C-38 44 -52 38 -60 28 C-66 20 -76 20 -79 27 C-81 33 -74 36 -71 31"/><path stroke-width="1.4" d="M-36 22 C-46 14 -58 14 -64 20"/><path stroke-width="1.4" d="M-62 22 C-70 12 -84 14 -86 22 C-87 27 -81 29 -80 25"/><path stroke-width="1.2" d="M-58 36 C-70 44 -88 44 -100 38"/></g><path d="M-40 26 C-44 22 -44 17 -40 14 C-41 19 -39 23 -40 26 Z" fill="url(#lgs)"/><circle cx="-100" cy="38" r="1.6" fill="url(#lgs)"/><g transform="scale(-1 1)"><g fill="none" stroke="url(#lgs)" stroke-linecap="round"><path stroke-width="3.2" d="M-24 34 C-34 30 -38 18 -33 6 C-31 16 -27 24 -21 27"/><path stroke-width="2.2" d="M-24 40 C-38 44 -52 38 -60 28 C-66 20 -76 20 -79 27 C-81 33 -74 36 -71 31"/><path stroke-width="1.4" d="M-36 22 C-46 14 -58 14 -64 20"/><path stroke-width="1.4" d="M-62 22 C-70 12 -84 14 -86 22 C-87 27 -81 29 -80 25"/><path stroke-width="1.2" d="M-58 36 C-70 44 -88 44 -100 38"/></g><path d="M-40 26 C-44 22 -44 17 -40 14 C-41 19 -39 23 -40 26 Z" fill="url(#lgs)"/><circle cx="-100" cy="38" r="1.6" fill="url(#lgs)"/></g><g transform="translate(0 -17)"><path d="M-15 8 L-17 -8 L-8 -1 L0 -12 L8 -1 L17 -8 L15 8 Z" fill="url(#lgs)"/><rect x="-16" y="9.5" width="32" height="3.4" rx="1" fill="url(#lgs)"/><circle cx="-17.5" cy="-10" r="2.1" fill="url(#lgs)"/><circle cx="0" cy="-14.5" r="2.3" fill="url(#lgs)"/><circle cx="17.5" cy="-10" r="2.1" fill="url(#lgs)"/><circle cx="-7" cy="3.5" r="1.1" fill="#0a0907"/><circle cx="0" cy="2.5" r="1.3" fill="#0a0907"/><circle cx="7" cy="3.5" r="1.1" fill="#0a0907"/></g><path d="M-19 0 H19 V20 C19 33 10 40 0 45 C-10 40 -19 33 -19 20 Z" fill="#0a0907" stroke="url(#lgs)" stroke-width="2.4" stroke-linejoin="round"/><path d="M-14.5 4.5 H14.5 V20 C14.5 30 7.5 35.5 0 39.6 C-7.5 35.5 -14.5 30 -14.5 20 Z" fill="none" stroke="url(#lgs)" stroke-width=".9" opacity=".75"/><text x="0" y="29" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="25" font-weight="700" fill="url(#lgs)">N</text></g><path d="M22 86 H238" stroke="url(#lgs)" stroke-width="1"/><text x="130" y="124" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="33" font-weight="600" textLength="232" lengthAdjust="spacingAndGlyphs" fill="url(#lgs)">NIRMALE</text><text x="130" y="146" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="13" font-weight="600" textLength="196" lengthAdjust="spacing" fill="url(#lgs)">CONVENTION HALL</text><g transform="translate(130 164)"><path d="M-96 0 H-16 M16 0 H96" stroke="url(#lgs)" stroke-width="1"/><path d="M0 -5 C4 -2 8 0 14 0 C8 0 4 2 0 5 C-4 2 -8 0 -14 0 C-8 0 -4 -2 0 -5 Z" fill="url(#lgs)"/><circle cx="0" cy="0" r="1.3" fill="#0a0907"/></g></svg>`;

  const PAGES = [['index.html', 'Home'], ['about.html', 'About'], ['events.html', 'Events'], ['facilities.html', 'Facilities'], ['gallery.html', 'Gallery'], ['contact.html', 'Booking & Contact']];
  const page = document.body.dataset.page || 'home';
  const current = (location.pathname.split('/').pop() || 'index.html').replace(/^$/, 'index.html');

  // Default content so the page still renders if the API is unavailable
  let C = { site: {
    name: 'Nirmale Convention Hall', tagline: 'Convention & Celebrations', address: 'NH 161A, Bidar Road, Opposite to HP Petrol Bunk, Aurad (B)',
    phone: '98805 40333', whatsapp: '9880540333', email: 'nirmaleconventionhall@gmail.com', googleRating: '5.0',
    mapQuery: 'Nirmale Function Hall, NH 161A, Bidar Road, Aurad, Karnataka 585326' } };

  const digits = s => String(s || '').replace(/\D/g, '');
  const tel = num => 'tel:+91' + digits(num || C.site.phone).replace(/^(91|0)/, '').slice(-10);
  const wa = (text, num) => 'https://wa.me/91' + digits(num || C.site.whatsapp || C.site.phone).replace(/^(91|0)/, '').slice(-10) +
    '?text=' + encodeURIComponent(text || `Hello ${C.site.name}, I would like to enquire about booking the hall.`);
  const mail = () => 'mailto:' + C.site.email + '?subject=' + encodeURIComponent('Booking enquiry – ' + C.site.name);
  const mapLink = () => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(C.site.mapQuery || C.site.address);

  // ---------- Chrome: header, footer, floating bar, lightbox ----------
  function renderChrome() {
    const nav = PAGES.map(([href, label]) => `<a href="${href}" class="${href === current ? 'active' : ''}" ${href === current ? 'aria-current="page"' : ''}>${label}</a>`).join('');
    const header = document.createElement('header');
    header.className = 'site-header' + (page === 'home' ? '' : ' solid');
    header.innerHTML = `
      <div class="header-inner">
        <a class="brand" href="index.html" aria-label="Nirmale Convention Hall – Home">${LOGO}</a>
        <nav class="nav" id="site-nav" aria-label="Main">${nav}</nav>
        <div class="header-cta">
          <a class="header-phone" data-href="tel">${I('phone')}<span data-bind="site.phone">98805 40333</span></a>
          <a class="btn btn-gold btn-sm" href="contact.html#enquiry">Enquire Now</a>
          <button class="menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="site-nav"><span></span></button>
        </div>
      </div>`;
    document.body.prepend(header);
    const skip = document.createElement('a'); skip.className = 'skip-link'; skip.href = '#main'; skip.textContent = 'Skip to content';
    document.body.prepend(skip);

    const year = new Date().getFullYear();
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div>
            <a class="brand" href="index.html" aria-label="Nirmale Convention Hall – Home">${LOGO_STACKED}</a>
            <p style="margin-top:22px;max-width:40ch">A grand and welcoming venue in Aurad for weddings, receptions, engagements, birthdays, naming ceremonies, corporate and family functions.</p>
            <div class="socials" id="socials"></div>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul class="footer-links">${PAGES.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul>
          </div>
          <div>
            <h4>Contact</h4>
            <div class="footer-contact">
              <div>${I('phone')}<p><a data-href="tel" data-bind="site.phone">98805 40333</a><br><span data-bind="site.altPhones"></span></p></div>
              <div>${I('wa')}<a data-href="wa">WhatsApp: Message us</a></div>
              <div>${I('mail')}<a data-href="mail" data-bind="site.email">nirmaleconventionhall@gmail.com</a></div>
              <div>${I('pin')}<a data-href="map" data-bind="site.address">NH 161A, Bidar Road, Opposite to HP Petrol Bunk, Aurad (B)</a></div>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${year} <span data-bind="site.name">Nirmale Convention Hall</span>. All Rights Reserved.</span>
          <a href="admin.html" rel="nofollow" style="display:inline-flex;gap:6px;align-items:center">${I('lock').replace('<svg', '<svg width="14" height="14"')}Admin</a>
        </div>
      </div>`;
    document.body.append(footer);

    const bar = document.createElement('div');
    bar.className = 'float-bar';
    bar.innerHTML = `<a class="book" href="contact.html#enquiry" data-label="Book / Enquire" aria-label="Book or enquire">${I('cal')}Book</a><a class="wa" data-href="wa" target="_blank" rel="noopener" data-label="WhatsApp us" aria-label="WhatsApp">${I('wa')}WhatsApp</a><a class="call" data-href="tel" data-label="Call ${esc(C.site.phone)}" aria-label="Call now">${I('phone')}Call</a>`;
    document.body.append(bar);

    const lb = document.createElement('div');
    lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML = `<span class="lb-count"></span><figure><img alt=""><figcaption></figcaption></figure>
      <button class="lb-btn lb-close" aria-label="Close">${I('close')}</button>
      <button class="lb-btn lb-prev" aria-label="Previous photo">${I('left')}</button>
      <button class="lb-btn lb-next" aria-label="Next photo">${I('right')}</button>`;
    document.body.append(lb);

    // Header behaviour
    const toggle = $('.menu-toggle');
    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('#site-nav a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('nav-open'); document.body.style.overflow = ''; }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('nav-open')) toggle.click(); });
    const onScroll = () => {
      header.classList.toggle('scrolled', scrollY > 40);
      bar.classList.toggle('show', scrollY > 300 || page !== 'home');
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  // ---------- Bindings ----------
  function applyBindings(root = document) {
    $$('[data-bind]', root).forEach(el => {
      const v = el.dataset.bind.split('.').reduce((o, k) => (o || {})[k], C);
      if (v !== undefined && v !== null && v !== '') el.textContent = v;
      else if (el.dataset.bind === 'site.altPhones') el.textContent = '';
    });
    const hrefs = { tel, wa: () => wa(), mail, map: mapLink };
    $$('[data-href]', root).forEach(el => {
      el.href = hrefs[el.dataset.href]();
      if (el.dataset.href !== 'tel' && el.dataset.href !== 'mail') { el.target = '_blank'; el.rel = 'noopener'; }
    });
    const so = $('#socials');
    if (so) {
      const links = [['instagram', 'insta', 'Instagram'], ['facebook', 'fb', 'Facebook'], ['youtube', 'yt', 'YouTube']];
      so.innerHTML = links.map(([k, ic, label]) => `<a href="${esc(C.site[k] || '#')}" ${C.site[k] ? 'target="_blank" rel="noopener"' : ''} aria-label="${label}">${I(ic)}</a>`).join('') +
        `<a href="${esc(C.site.googleReviewsUrl || '#')}" target="_blank" rel="noopener" aria-label="Google reviews">${I('google')}</a>`;
    }
  }

  // ---------- Reveal on scroll ----------
  let io;
  function observeReveals(root = document) {
    if (!('IntersectionObserver' in window)) { $$('.reveal', root).forEach(e => e.classList.add('in')); return; }
    io = io || new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    $$('.reveal:not(.in)', root).forEach(e => {
      const r = e.getBoundingClientRect();
      if (!userScrolled && r.top < innerHeight && r.bottom > 0) {
        e.style.transition = 'none'; e.classList.add('in');
        requestAnimationFrame(() => requestAnimationFrame(() => { e.style.transition = ''; }));
      } else io.observe(e);
    });
  }
  let userScrolled = false;
  addEventListener('scroll', () => { if (scrollY > 10) userScrolled = true; }, { passive: true });

  // ---------- Lightbox ----------
  let lbList = [], lbIdx = 0, lastFocus = null;
  function openLightbox(list, i) {
    lbList = list; lbIdx = i; lastFocus = document.activeElement;
    $('.lightbox').classList.add('open'); document.body.style.overflow = 'hidden';
    showLb(); $('.lb-close').focus();
  }
  function showLb() {
    const p = lbList[lbIdx]; const lb = $('.lightbox');
    $('img', lb).src = p.src; $('img', lb).alt = p.caption || 'Hall photo';
    $('figcaption', lb).innerHTML = `<b>${esc(p.caption || '')}</b>${esc(p.category || '')}`;
    $('.lb-count', lb).textContent = `${lbIdx + 1} / ${lbList.length}`;
    [lbList[lbIdx + 1], lbList[lbIdx - 1]].forEach(n => { if (n) new Image().src = n.src; });
  }
  function closeLb() { $('.lightbox').classList.remove('open'); document.body.style.overflow = ''; lastFocus && lastFocus.focus(); }
  function lbStep(d) { lbIdx = (lbIdx + d + lbList.length) % lbList.length; showLb(); }
  function bindLightbox() {
    const lb = $('.lightbox');
    $('.lb-close', lb).onclick = closeLb;
    $('.lb-prev', lb).onclick = () => lbStep(-1);
    $('.lb-next', lb).onclick = () => lbStep(1);
    lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') lbStep(-1); if (e.key === 'ArrowRight') lbStep(1);
    });
    let x0 = null;
    lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) lbStep(dx < 0 ? 1 : -1); x0 = null; });
  }

  const photoBtn = (p, i) => `<button class="g-item reveal" data-i="${i}" data-cat="${esc(p.category)}" aria-label="View photo: ${esc(p.caption || p.category)}">
      <img src="${esc(p.thumb || p.src)}" alt="${esc(p.caption || 'Nirmale Convention Hall photo')}" loading="lazy" decoding="async">
      <span class="g-cap"><b>${esc(p.caption)}</b><span>${esc(p.category)}</span></span></button>`;

  // ---------- Videos (lite embed: thumbnail first, iframe on click) ----------
  function videoCard(v) {
    const id = esc(v.youtubeId);
    return `<article class="video-card reveal">
      <div class="video-frame">
        <button class="video-play" data-yt="${id}" aria-label="Play video: ${esc(v.title)}">
          <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy">
          <span class="play-icon">${I('play')}</span>
        </button>
      </div>
      <div class="video-body"><span>${esc(v.category || 'Video')}</span><h3>${esc(v.title)}</h3></div>
    </article>`;
  }
  function bindVideos(root) {
    root.addEventListener('click', e => {
      const b = e.target.closest('.video-play'); if (!b) return;
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0`;
      f.title = b.getAttribute('aria-label'); f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      f.allowFullscreen = true; f.loading = 'lazy';
      b.replaceWith(f);
    });
  }

  // ---------- Section renderers ----------
  const R = {};

  R.hero = el => {
    const h = C.hero || {};
    if (h.image) { const img = $('.hero-bg img', el); if (img) img.src = h.image; }
    if (h.title) {
      const words = h.title.split(' '); const tail = words.splice(-2).join(' ');
      $('h1', el).innerHTML = `${esc(words.join(' '))} <span class="gold-text">${esc(tail)}</span>`;
    }
    if (h.text) $('.lead', el).textContent = h.text;
    if (h.eyebrow) $('.eyebrow', el).textContent = h.eyebrow;
  };

  R.about = el => {
    const a = C.about || {};
    $$('[data-about]', el).forEach(n => { const k = n.dataset.about; if (a[k]) n.tagName === 'IMG' ? (n.src = a[k]) : (n.textContent = a[k]); });
  };

  R.stats = el => {
    el.innerHTML = (C.stats || []).map((s, i) => `<div class="stat reveal reveal-d${i % 4}"><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`).join('');
  };

  R.eventsPreview = el => {
    el.innerHTML = (C.events || []).map((e, i) => `
      <a class="event-card reveal reveal-d${i % 4}" href="events.html#${esc(e.key)}">
        <img src="${esc(e.image)}" alt="${esc(e.title)} at ${esc(C.site.name)}" loading="lazy">
        <span class="event-num">${String(i + 1).padStart(2, '0')}</span>
        <div class="event-body"><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p><span class="link-gold">Enquire Now ${I('arrow')}</span></div>
      </a>`).join('');
  };

  const EVENT_TAGS = {
    weddings: ['Hindu weddings', 'Muhurtham', 'Mandap décor', 'Large families'],
    receptions: ['Evening receptions', 'Couple stage', 'Lighting', 'Photo backdrops'],
    engagements: ['Ring ceremony', 'Nischitartha', 'Floral stage'],
    haldi: ['Haldi', 'Mehendi', 'Sangeet', 'Marigold themes'],
    birthdays: ['First birthday', 'Milestone birthdays', 'Theme décor'],
    naming: ['Naming ceremony', 'Cradle ceremony', 'Baby shower', 'Seemantham'],
    corporate: ['Corporate meetings', 'Product launches', 'Company functions', 'Annual events'],
    conferences: ['Conferences', 'Seminars', 'Workshops', 'Training programmes'],
    cultural: ['Cultural programmes', 'Community events', 'Award ceremonies', 'Pooja functions'],
    shawlhalfsaree: ['Shawl ceremony', 'Half saree', 'Or both together', 'Family rituals'],
    nightparty: ['Evening parties', 'Festive lighting', 'Music', 'Get-togethers']
  };
  R.eventsFull = el => {
    el.innerHTML = (C.events || []).map((e, i) => `
      <article class="event-row" id="${esc(e.key)}">
        <div class="event-row-media reveal"><img src="${esc(e.image.replace('-t.jpg', '.jpg'))}" alt="${esc(e.title)} at ${esc(C.site.name)}" loading="lazy"></div>
        <div class="reveal reveal-d1">
          <span class="event-index">${String(i + 1).padStart(2, '0')} — EVENT</span>
          <h2>${esc(e.title)}</h2>
          <p class="lead">${esc(e.text)}</p>
          <ul class="tags">${(EVENT_TAGS[e.key] || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
          <div class="btn-row"><a class="btn btn-gold" href="contact.html?event=${encodeURIComponent(e.title)}#enquiry">Enquire Now ${I('arrow')}</a>
          <a class="btn btn-outline" data-wa-event="${esc(e.title)}">${I('wa')} WhatsApp</a></div>
        </div>
      </article>`).join('');
    $$('[data-wa-event]', el).forEach(a => { a.href = wa(`Hello, I would like to enquire about booking ${C.site.name} for ${a.dataset.waEvent}.`); a.target = '_blank'; a.rel = 'noopener'; });
  };

  R.facilities = el => {
    const limit = Number(el.dataset.limit) || 99;
    const all = (C.facilities || []).filter(f => f.status !== 'hidden');
    // Home preview: always include VIP Facilities, keeping the total at the limit
    const pinned = el.dataset.limit ? all.filter(f => f.key === 'vip') : [];
    const list = all.filter(f => !pinned.includes(f)).slice(0, limit - pinned.length).concat(pinned);
    el.innerHTML = list.map((f, i) => `
      <div class="fac reveal reveal-d${i % 4}">
        <div class="fac-icon">${I(f.icon)}</div>
        <h3>${esc(f.title)}</h3><p>${esc(f.text)}</p>
        <span class="chip ${f.status === 'available' ? '' : 'ask'}">${f.status === 'available' ? 'Available' : 'Ask for details'}</span>
      </div>`).join('');
  };

  R.galleryPreview = el => {
    const all = C.gallery || [];
    let list = all.filter(p => p.featured);
    if (list.length < 8) list = list.concat(all.filter(p => !p.featured)).slice(0, 8);
    list = list.slice(0, 8);
    el.innerHTML = list.map(photoBtn).join('');
    el.addEventListener('click', e => { const b = e.target.closest('.g-item'); if (b) openLightbox(list, +b.dataset.i); });
  };

  R.galleryFull = el => {
    const list = C.gallery || [];
    const cats = ['Hall Interior', 'Exterior', 'Stage', 'Dining', 'Weddings', 'Decorations', 'Events'];
    list.forEach(p => { if (p.category && !cats.includes(p.category)) cats.push(p.category); });
    const counts = c => list.filter(p => p.category === c).length;
    const filters = $('#gallery-filters');
    filters.innerHTML = `<button class="filter-btn active" data-f="all" aria-pressed="true">All <small>${list.length}</small></button>` +
      cats.filter(counts).map(c => `<button class="filter-btn" data-f="${esc(c)}" aria-pressed="false">${esc(c)} <small>${counts(c)}</small></button>`).join('');
    el.innerHTML = list.map(photoBtn).join('') || '<p class="center">Photos coming soon.</p>';
    let visible = list;
    filters.addEventListener('click', e => {
      const b = e.target.closest('.filter-btn'); if (!b) return;
      $$('.filter-btn', filters).forEach(x => { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b); });
      const f = b.dataset.f;
      $$('.g-item', el).forEach(item => item.classList.toggle('hide', f !== 'all' && item.dataset.cat !== f));
      visible = f === 'all' ? list : list.filter(p => p.category === f);
      $$('.g-item:not(.hide)', el).forEach(i => i.classList.add('in'));
    });
    el.addEventListener('click', e => {
      const b = e.target.closest('.g-item'); if (!b) return;
      const p = list[+b.dataset.i]; openLightbox(visible, visible.indexOf(p));
    });
  };

  R.videos = el => {
    const limit = Number(el.dataset.limit) || 99;
    el.innerHTML = (C.videos || []).slice(0, limit).map(videoCard).join('') || '<p>Videos coming soon.</p>';
    bindVideos(el);
  };

  R.team = el => {
    const compact = el.dataset.variant === 'compact';
    el.innerHTML = (C.team || []).map((t, i) => {
      const first = t.name.replace(/^(Mr|Mrs|Ms|Dr)\.?\s+/i, '').split(' ')[0];
      const hl = (t.highlights || []).filter(Boolean);
      // Each person can have their own numbers (Admin → Owner & Manager); otherwise the hall's main number is used
      const phone = t.phone || C.site.phone;
      const whatsapp = t.whatsapp || t.phone;
      return `
      <article class="team-card reveal reveal-d${i}">
        <div class="team-photo"><img src="${esc(t.photo)}" alt="${esc(t.name)}, ${esc(t.role)} of ${esc(C.site.name)}" loading="lazy"></div>
        <div class="team-body">
          <span class="team-role">${esc(t.role)}</span>
          <h3>${esc(t.name)}</h3>
          <p>${esc(compact ? (t.summary || t.bio) : t.bio)}</p>
          ${hl.length ? `<ul class="team-hl">${hl.map(h => `<li>${I('check')}${esc(h)}</li>`).join('')}</ul>` : ''}
          ${!compact && t.quote ? `<p class="team-quote">“${esc(t.quote)}”</p>` : ''}
          <div class="team-actions">
            <a class="btn btn-gold btn-sm" href="${tel(phone)}">${I('phone')} Call</a>
            <a class="btn btn-outline btn-sm" href="${wa(`Hello ${t.name}, I would like to enquire about booking ${C.site.name}.`, whatsapp)}" target="_blank" rel="noopener">${I('wa')} WhatsApp ${esc(first)}</a>
          </div>
        </div>
      </article>`;
    }).join('');
  };

  R.reviews = el => {
    const r = C.reviews || [];
    const rating = C.site.googleRating || '5.0';
    const stars = n => '★★★★★'.slice(0, Math.round(n)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(n));
    el.innerHTML = `
      <div class="rating-card reveal">
        ${I('google').replace('<svg', '<svg width="34" height="34" style="color:var(--gold);margin-bottom:12px"')}
        <div class="big">${esc(rating)}</div>
        <div class="stars" aria-label="${esc(rating)} out of 5 stars">${stars(parseFloat(rating) || 5)}</div>
        <p>Rated by families on Google</p>
        <a class="btn btn-outline btn-sm" href="${esc(C.site.googleReviewsUrl || '#')}" target="_blank" rel="noopener">Read Google Reviews</a>
      </div>
      <div class="review-list">${r.length ? r.map((x, i) => `
        <article class="review reveal reveal-d${i % 3}">
          <div class="stars" aria-label="${x.rating} stars">${stars(x.rating || 5)}</div>
          <p>“${esc(x.text)}”</p>
          <b>${esc(x.name)}</b><small>${esc(x.event || '')}</small>
        </article>`).join('') : `
        <div class="review-empty reveal">
          <h3>Celebrated here? <span class="gold-text">Share your story.</span></h3>
          <p>Your kind words help other families choose with confidence. Leave us a review on Google – it takes less than a minute.</p>
          <div class="btn-row"><a class="btn btn-gold btn-sm" href="${esc(C.site.googleReviewsUrl || '#')}" target="_blank" rel="noopener">Write a Review</a></div>
        </div>`}</div>`;
  };

  R.contactInfo = el => {
    const s = C.site;
    el.innerHTML = `
      <div class="info-card reveal"><span class="ic">${I('phone')}</span><div><h4>Call Us</h4><a href="${tel()}">${esc(s.phone)}</a>${s.altPhones ? `<small>Also: ${esc(s.altPhones)}</small>` : ''}</div></div>
      <div class="info-card reveal"><span class="ic">${I('wa')}</span><div><h4>WhatsApp</h4><a href="${wa()}" target="_blank" rel="noopener">${esc(s.whatsapp ? s.whatsapp.replace(/(\d{5})(\d{5})$/, '$1 $2') : s.phone)}</a><small>Quick replies on WhatsApp</small></div></div>
      <div class="info-card reveal"><span class="ic">${I('mail')}</span><div><h4>Email</h4><a href="${mail()}">${esc(s.email)}</a></div></div>
      <div class="info-card reveal"><span class="ic">${I('pin')}</span><div><h4>Address</h4><p>${esc(s.address)}</p>${s.hours ? `<small>${esc(s.hours)}</small>` : ''}</div></div>
      <div class="quick-btns reveal">
        <a class="btn btn-gold btn-sm" href="${tel()}">${I('phone')} Call Now</a>
        <a class="btn btn-outline btn-sm" href="${wa()}" target="_blank" rel="noopener">${I('wa')} WhatsApp</a>
        <a class="btn btn-outline btn-sm" href="${mail()}">${I('mail')} Email</a>
      </div>`;
  };

  R.map = el => {
    const q = encodeURIComponent(C.site.mapQuery || C.site.address);
    const iframe = $('iframe', el);
    iframe.src = `https://maps.google.com/maps?q=${q}&z=16&output=embed`;
    $('[data-map-dir]', el).href = mapLink();
  };

  // ---------- Enquiry form ----------
  function bindForm(form) {
    const params = new URLSearchParams(location.search);
    const ev = params.get('event');
    if (ev) {
      const map = { 'Wedding Receptions': 'Reception', 'Weddings': 'Wedding', 'Engagements': 'Engagement', 'Birthday Celebrations': 'Birthday', 'Corporate Events': 'Corporate Event', 'Conferences & Seminars': 'Conference', 'Haldi & Mehendi': 'Haldi / Mehendi', 'Naming Ceremonies': 'Naming Ceremony', 'Shawl & Half Saree Ceremony': 'Shawl & Half Saree (both)', 'Night Parties': 'Night Party' };
      const v = map[ev] || 'Other'; const sel = form.eventType; if ([...sel.options].some(o => o.value === v)) sel.value = v;
    }
    const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    form.date.min = today.toISOString().slice(0, 10);

    const rules = {
      name: v => v.trim().length >= 2 || 'Please enter your full name.',
      phone: v => /^[6-9]\d{9}$/.test(v.replace(/[\s+-]/g, '').replace(/^(91|0)/, '')) || 'Please enter a valid 10-digit mobile number.',
      email: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Please enter a valid email address.',
      eventType: v => !!v || 'Please choose the type of event.',
      guests: v => !v || (+v > 0 && +v < 100000) || 'Please enter a valid number of guests.'
    };
    const check = name => {
      const f = form[name]; const r = rules[name](f.value); const wrap = f.closest('.field');
      wrap.classList.toggle('invalid', r !== true); $('.err', wrap).textContent = r === true ? '' : r;
      f.setAttribute('aria-invalid', r !== true);
      return r === true;
    };
    Object.keys(rules).forEach(n => form[n].addEventListener('blur', () => check(n)));
    Object.keys(rules).forEach(n => form[n].addEventListener('input', () => form[n].closest('.field').classList.contains('invalid') && check(n)));

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const msg = $('.form-msg', form); msg.className = 'form-msg';
      const ok = Object.keys(rules).map(check).every(Boolean);
      if (!ok) { $('.invalid input, .invalid select', form)?.focus(); return; }
      const data = Object.fromEntries(new FormData(form));
      const btn = $('button[type=submit]', form); btn.disabled = true; const label = btn.innerHTML; btn.textContent = 'Sending…';
      try {
        const res = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const out = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(out.error || 'Could not send right now.');
        showSuccess(data);
      } catch (err) {
        msg.className = 'form-msg error';
        msg.innerHTML = `${esc(err.message)} You can also <a href="${wa(enquiryText(data))}" target="_blank" rel="noopener" style="color:var(--gold-2);text-decoration:underline">send it on WhatsApp</a> or call <a href="${tel()}" style="color:var(--gold-2)">${esc(C.site.phone)}</a>.`;
      } finally { btn.disabled = false; btn.innerHTML = label; }
    });

    function enquiryText(d) {
      return `Hello ${C.site.name}, I would like to enquire about a booking.\n\nName: ${d.name}\nMobile: ${d.phone}\nEvent: ${d.eventType}\nDate: ${d.date || 'Flexible'}\nGuests: ${d.guests || '-'}\n${d.message ? '\n' + d.message : ''}`;
    }
    function showSuccess(d) {
      form.hidden = true;
      const s = $('#enquiry-success');
      $('[data-s-name]', s).textContent = d.name.split(' ')[0];
      $('[data-s-wa]', s).href = wa(enquiryText(d));
      s.classList.add('show'); s.scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('[data-s-again]', s).onclick = () => { form.reset(); form.hidden = false; s.classList.remove('show'); };
    }
  }

  // ---------- SEO: structured data ----------
  function addSchema() {
    const s = C.site;
    const ld = {
      '@context': 'https://schema.org', '@type': 'EventVenue', name: s.name, telephone: '+91' + digits(s.phone).slice(-10), email: s.email,
      address: { '@type': 'PostalAddress', streetAddress: 'NH 161A, Bidar Road, Opposite to HP Petrol Bunk', addressLocality: 'Aurad (B), Bidar', addressRegion: 'Karnataka', postalCode: '585326', addressCountry: 'IN' },
      image: location.origin + ((C.hero && C.hero.image) || ''), url: location.origin + '/',
      maximumAttendeeCapacity: 1500,
      aggregateRating: s.googleRating ? { '@type': 'AggregateRating', ratingValue: s.googleRating, bestRating: '5' } : undefined
    };
    const tag = document.createElement('script'); tag.type = 'application/ld+json'; tag.textContent = JSON.stringify(ld);
    document.head.append(tag);
  }

  // ---------- Boot ----------
  renderChrome();
  bindLightbox();
  applyBindings();
  observeReveals();

  fetch('/api/content').then(r => r.ok ? r.json() : Promise.reject()).then(data => {
    C = Object.assign(C, data); C.site = Object.assign({}, C.site, data.site || {});
  }).catch(() => console.warn('Content API unavailable – showing defaults')).finally(() => {
    $$('[data-crest]').forEach((el, i) => { el.innerHTML = LOGO_STACKED.split('lgs').join('crest' + i); });
    $$('[data-render]').forEach(el => { const fn = R[el.dataset.render]; if (fn) { try { fn(el); } catch (e) { console.error(e); } } });
    applyBindings();
    observeReveals();
    const form = $('#enquiry-form'); if (form) bindForm(form);
    if (page === 'home') addSchema();
    if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(() => t.scrollIntoView(), 120); }
  });
})();
