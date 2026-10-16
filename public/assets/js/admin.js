/* Nirmale Convention Hall — admin panel */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CATS = ['Hall Interior', 'Exterior', 'Stage', 'Dining', 'Weddings', 'Decorations', 'Events'];
  let C = {}, enquiries = [];

  // ---------- helpers ----------
  async function api(method, url, body) {
    const opts = { method, headers: {}, credentials: 'same-origin' };
    if (body instanceof FormData) opts.body = body;
    else if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && url !== '/api/login') { showLogin(); throw new Error('Session expired – please log in again.'); }
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }
  let toastTimer;
  function toast(msg, err) {
    const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.className = 'toast', 2800);
  }
  const fail = e => toast(e.message, true);

  // Resize an image in the browser so uploads are fast and the site stays quick
  function resize(file, max, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(b => b ? resolve(b) : reject(new Error('Could not process image')), 'image/jpeg', quality);
      };
      img.onerror = () => reject(new Error(file.name + ' is not a valid image'));
      img.src = url;
    });
  }
  async function imageForm(file) {
    const fd = new FormData();
    fd.append('image', await resize(file, 1800, .82), 'image.jpg');
    fd.append('thumb', await resize(file, 720, .76), 'thumb.jpg');
    return fd;
  }
  async function uploadSingle(file) { return api('POST', '/api/admin/upload', await imageForm(file)); }
  async function saveSection(name, value, msg = 'Saved') {
    await api('PUT', '/api/admin/content/' + name, value); C[name] = value; toast(msg + ' ✓');
  }
  function pickFile(cb, multiple) {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/jpeg,image/png,image/webp'; i.multiple = !!multiple;
    i.onchange = () => i.files.length && cb(multiple ? [...i.files] : i.files[0]); i.click();
  }
  const field = (label, name, value, type = 'text', extra = '') => type === 'textarea'
    ? `<div class="field ${extra}"><label>${label}</label><textarea name="${name}">${esc(value)}</textarea></div>`
    : `<div class="field ${extra}"><label>${label}</label><input name="${name}" type="${type}" value="${esc(value)}"></div>`;
  const formData = form => Object.fromEntries(new FormData(form));

  // ---------- tabs ----------
  const TABS = [
    ['photos', 'Photo Gallery'], ['enquiries', 'Enquiries'], ['videos', 'Videos'], ['team', 'Owner & Manager'],
    ['info', 'Business Info'], ['events', 'Events'], ['facilities', 'Facilities'], ['reviews', 'Reviews & Stats'], ['account', 'Password']
  ];
  function buildTabs() {
    const html = TABS.map(([k, l]) => `<button class="tab-btn" data-tab="${k}">${l}${k === 'enquiries' ? '<span class="badge" data-new hidden></span>' : ''}</button>`).join('');
    $('#tabs').innerHTML = html; $('#mtabs').innerHTML = html + '<button class="tab-btn" id="mlogout">Log Out</button>';
    $('#mlogout').onclick = () => $('#logout').click();
    $('#panels').innerHTML = TABS.map(([k]) => `<section class="panel" id="panel-${k}"></section>`).join('');
    document.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) openTab(b.dataset.tab); });
  }
  function openTab(k) {
    $$('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === k));
    $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + k));
    RENDER[k]($('#panel-' + k));
    history.replaceState(null, '', '#' + k);
    scrollTo(0, 0);
  }

  const RENDER = {};

  // ---------- Photos ----------
  RENDER.photos = el => {
    const g = C.gallery || [];
    el.innerHTML = `
      <h1>Photo Gallery</h1><p>Upload, delete, re-order and edit captions. Photos marked ★ appear on the Home page. Drag photos to change their order.</p>
      <div class="box">
        <div class="row" style="margin-bottom:14px">
          <div class="field"><label>Category for new photos</label><select id="up-cat" class="mini">${CATS.map(c => `<option>${c}</option>`).join('')}</select></div>
          <div class="field"><label>Caption (optional)</label><input id="up-cap" class="mini" placeholder="e.g. Reception stage décor"></div>
        </div>
        <div class="drop" id="drop" tabindex="0" role="button"><b>Click to choose photos</b> or drag & drop them here<br><span class="hint">JPG, PNG or WEBP – photos are resized automatically</span></div>
        <div class="progress" id="prog"><div></div></div>
      </div>
      <div class="toolbar"><h3 style="margin:0">${g.length} photos</h3>
        <select id="filter-cat" class="mini" style="width:auto"><option value="">All categories</option>${CATS.map(c => `<option>${c}</option>`).join('')}</select></div>
      <div class="admin-grid" id="ph-grid">${g.map(photoCard).join('')}</div>`;

    const drop = $('#drop', el);
    const doUpload = async files => {
      const prog = $('#prog', el), bar = $('div', prog); prog.style.display = 'block';
      let ok = 0;
      for (let i = 0; i < files.length; i++) {
        bar.style.width = (i / files.length * 100) + '%';
        try {
          const fd = await imageForm(files[i]);
          fd.append('category', $('#up-cat', el).value); fd.append('caption', $('#up-cap', el).value);
          const p = await api('POST', '/api/admin/photos', fd); C.gallery = [p, ...(C.gallery || [])]; ok++;
        } catch (e) { fail(e); }
      }
      bar.style.width = '100%'; setTimeout(() => prog.style.display = 'none', 600);
      toast(`${ok} photo${ok === 1 ? '' : 's'} uploaded ✓`); RENDER.photos(el);
    };
    drop.onclick = () => pickFile(doUpload, true);
    drop.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); drop.click(); } };
    drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = () => drop.classList.remove('over');
    drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); const f = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/')); if (f.length) doUpload(f); };

    $('#filter-cat', el).onchange = e => $$('.ph', el).forEach(c => c.hidden = e.target.value && c.dataset.cat !== e.target.value);

    const grid = $('#ph-grid', el);
    grid.addEventListener('change', async e => {
      const card = e.target.closest('.ph'); const id = card.dataset.id; const k = e.target.name;
      try {
        const p = await api('PATCH', '/api/admin/photos/' + id, { [k]: e.target.value });
        Object.assign(C.gallery.find(x => x.id === id), p); card.dataset.cat = p.category; toast('Photo updated ✓');
      } catch (err) { fail(err); }
    });
    grid.addEventListener('click', async e => {
      const card = e.target.closest('.ph'); if (!card) return; const id = card.dataset.id; const p = C.gallery.find(x => x.id === id);
      if (e.target.closest('.star')) {
        try { await api('PATCH', '/api/admin/photos/' + id, { featured: !p.featured }); p.featured = !p.featured; e.target.closest('.star').classList.toggle('on', p.featured); e.target.closest('.star').textContent = p.featured ? '★ Home' : '☆ Home'; toast(p.featured ? 'Shown on Home page ✓' : 'Removed from Home page'); } catch (err) { fail(err); }
      }
      if (e.target.closest('[data-del]')) {
        if (!confirm('Delete this photo permanently?')) return;
        try { await api('DELETE', '/api/admin/photos/' + id); C.gallery = C.gallery.filter(x => x.id !== id); card.remove(); toast('Photo deleted'); $('.toolbar h3', el).textContent = C.gallery.length + ' photos'; } catch (err) { fail(err); }
      }
      if (e.target.closest('[data-move]')) {
        const dir = +e.target.closest('[data-move]').dataset.move; const sib = dir < 0 ? card.previousElementSibling : card.nextElementSibling;
        if (!sib) return; dir < 0 ? grid.insertBefore(card, sib) : grid.insertBefore(sib, card); saveOrder(grid);
      }
      if (e.target.closest('.ph-img img')) window.open(p.src, '_blank');
    });
    // drag to reorder
    let dragEl = null;
    grid.addEventListener('dragstart', e => { dragEl = e.target.closest('.ph'); dragEl.classList.add('dragging'); });
    grid.addEventListener('dragend', () => { dragEl && dragEl.classList.remove('dragging'); $$('.over', grid).forEach(x => x.classList.remove('over')); });
    grid.addEventListener('dragover', e => { e.preventDefault(); const t = e.target.closest('.ph'); $$('.over', grid).forEach(x => x.classList.remove('over')); if (t && t !== dragEl) t.classList.add('over'); });
    grid.addEventListener('drop', e => {
      e.preventDefault(); const t = e.target.closest('.ph'); if (!t || !dragEl || t === dragEl) return;
      const cards = $$('.ph', grid); cards.indexOf(dragEl) < cards.indexOf(t) ? t.after(dragEl) : t.before(dragEl); saveOrder(grid);
    });
  };
  async function saveOrder(grid) {
    const ids = $$('.ph', grid).map(c => c.dataset.id);
    try { await api('PUT', '/api/admin/photos/order', { ids }); const m = new Map(C.gallery.map(p => [p.id, p])); C.gallery = ids.map(i => m.get(i)); toast('Order saved ✓'); } catch (e) { fail(e); }
  }
  const photoCard = p => `
    <div class="ph" data-id="${esc(p.id)}" data-cat="${esc(p.category)}" draggable="true">
      <div class="ph-img"><img src="${esc(p.thumb || p.src)}" alt="" loading="lazy"><button class="star ${p.featured ? 'on' : ''}" title="Show on Home page">${p.featured ? '★ Home' : '☆ Home'}</button></div>
      <div class="ph-body">
        <input name="caption" value="${esc(p.caption)}" placeholder="Caption">
        <select name="category">${[...new Set([...CATS, p.category])].map(c => `<option ${c === p.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
        <div class="ph-actions"><button class="icon-btn" data-move="-1" title="Move earlier">◀</button><button class="icon-btn" data-move="1" title="Move later">▶</button><button class="icon-btn danger" data-del>Delete</button></div>
      </div>
    </div>`;

  // ---------- Enquiries ----------
  async function loadEnquiries() {
    try { enquiries = await api('GET', '/api/admin/enquiries'); } catch { enquiries = []; }
    const n = enquiries.filter(e => e.status === 'new').length;
    $$('[data-new]').forEach(b => { b.hidden = !n; b.textContent = n; });
  }
  RENDER.enquiries = async el => {
    el.innerHTML = '<h1>Booking Enquiries</h1><p>Loading…</p>';
    await loadEnquiries();
    const wa = (e) => 'https://wa.me/91' + e.phone.replace(/\D/g, '').slice(-10) + '?text=' + encodeURIComponent(`Namaste ${e.name}, thank you for your enquiry for ${e.eventType} at ${C.site.name}.`);
    el.innerHTML = `<h1>Booking Enquiries</h1><p>Enquiries sent from the website form. Call or WhatsApp the customer, then update the status.</p>
      ${enquiries.length ? `<div class="box" style="padding:10px 18px"><table><thead><tr><th>Received</th><th>Customer</th><th>Event</th><th>Message</th><th>Status</th><th></th></tr></thead><tbody>
      ${enquiries.map(e => `<tr data-id="${esc(e.id)}">
        <td><small>${new Date(e.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</small></td>
        <td><b>${esc(e.name)}</b><br><a href="tel:${esc(e.phone)}" style="color:var(--gold-2)">${esc(e.phone)}</a> · <a href="${wa(e)}" target="_blank" rel="noopener" style="color:#4fce5d">WhatsApp</a>${e.email ? `<br><small>${esc(e.email)}</small>` : ''}</td>
        <td>${esc(e.eventType)}<br><small>${e.date ? new Date(e.date).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Date flexible'} · ${e.guests ? esc(e.guests) + ' guests' : 'Guests not given'}</small></td>
        <td><small>${esc(e.message) || '—'}</small></td>
        <td><select class="status">${['new', 'contacted', 'booked', 'closed'].map(s => `<option value="${s}" ${s === e.status ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}</select></td>
        <td><button class="icon-btn danger" data-del style="padding:0 12px">Delete</button></td></tr>`).join('')}
      </tbody></table></div>` : '<div class="box"><p style="margin:0">No enquiries yet. New enquiries from the website will appear here.</p></div>'}`;
    el.onchange = async e => {
      if (!e.target.classList.contains('status')) return; const id = e.target.closest('tr').dataset.id;
      try { await api('PATCH', '/api/admin/enquiries/' + id, { status: e.target.value }); toast('Status updated ✓'); loadEnquiries(); } catch (err) { fail(err); }
    };
    el.onclick = async e => {
      if (!e.target.closest('[data-del]')) return; const tr = e.target.closest('tr');
      if (!confirm('Delete this enquiry?')) return;
      try { await api('DELETE', '/api/admin/enquiries/' + tr.dataset.id); tr.remove(); toast('Enquiry deleted'); loadEnquiries(); } catch (err) { fail(err); }
    };
  };

  // ---------- Videos ----------
  const ytId = v => { const m = String(v).match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/); return m ? m[1] : (/^[\w-]{11}$/.test(v.trim()) ? v.trim() : null); };
  RENDER.videos = el => {
    const v = C.videos || [];
    el.innerHTML = `<h1>YouTube Videos</h1><p>Paste any YouTube link. Videos stay on YouTube – nothing is stored on the website server. The first 3 also appear on the Home page.</p>
      <form class="box" id="add-video"><h3>Add a video</h3><div class="row">
        ${field('YouTube link', 'url', '', 'text')}${field('Title', 'title', '')}
        <div class="field"><label>Category</label><input name="category" value="Weddings"></div></div>
        <button class="btn btn-gold btn-sm" style="margin-top:16px">Add Video</button></form>
      <h3>${v.length} videos</h3>
      <div id="vlist">${v.map((x, i) => `<div class="list-item" data-i="${i}">
        <img src="https://i.ytimg.com/vi/${esc(x.youtubeId)}/mqdefault.jpg" alt="">
        <div class="row"><div class="field"><label>Title</label><input class="mini" data-k="title" value="${esc(x.title)}"></div><div class="field"><label>Category</label><input class="mini" data-k="category" value="${esc(x.category)}"></div></div>
        <div class="ph-actions" style="flex-direction:column"><button class="icon-btn" data-up>▲ Up</button><button class="icon-btn" data-down>▼ Down</button><a class="icon-btn" style="display:grid;place-items:center" href="https://youtu.be/${esc(x.youtubeId)}" target="_blank" rel="noopener">Watch</a><button class="icon-btn danger" data-del>Delete</button></div>
      </div>`).join('')}</div>`;
    $('#add-video', el).onsubmit = async e => {
      e.preventDefault(); const d = formData(e.target); const id = ytId(d.url);
      if (!id) return toast('That does not look like a YouTube link', true);
      const list = [...v, { id: 'v' + Date.now(), youtubeId: id, title: d.title || 'Video', category: d.category }];
      try { await saveSection('videos', list, 'Video added'); RENDER.videos(el); } catch (err) { fail(err); }
    };
    const vl = $('#vlist', el);
    vl.onchange = async e => { const i = +e.target.closest('.list-item').dataset.i; const list = [...v]; list[i] = { ...list[i], [e.target.dataset.k]: e.target.value }; try { await saveSection('videos', list); } catch (err) { fail(err); } };
    vl.onclick = async e => {
      const it = e.target.closest('.list-item'); if (!it) return; const i = +it.dataset.i; const list = [...v];
      if (e.target.closest('[data-del]')) { if (!confirm('Remove this video?')) return; list.splice(i, 1); }
      else if (e.target.closest('[data-up]') && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
      else if (e.target.closest('[data-down]') && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
      else return;
      try { await saveSection('videos', list); RENDER.videos(el); } catch (err) { fail(err); }
    };
  };

  // ---------- Team ----------
  RENDER.team = el => {
    const t = C.team || [];
    el.innerHTML = `<h1>Owner & Manager</h1><p>These profiles appear on the Home page and the About page.</p>
      ${t.map((m, i) => `<form class="box team-form" data-i="${i}"><div class="team-edit">
        <div><img src="${esc(m.photo)}" alt=""><button type="button" class="btn btn-outline btn-sm" data-photo style="width:100%;margin-top:10px">Change Photo</button></div>
        <div class="row" style="grid-template-columns:1fr 1fr">
          ${field('Name', 'name', m.name)}${field('Role', 'role', m.role)}
          ${field('Short intro (Home page)', 'summary', m.summary, 'textarea', 'full" style="grid-column:1/-1')}
          ${field('Full description (About page)', 'bio', m.bio, 'textarea', 'full" style="grid-column:1/-1')}
          ${field('Quote', 'quote', m.quote, 'textarea', 'full" style="grid-column:1/-1')}
          ${field('Key points (one per line)', 'highlights', (m.highlights || []).join('\n'), 'textarea', 'full" style="grid-column:1/-1')}
          <div><button class="btn btn-gold btn-sm">Save</button></div>
        </div></div></form>`).join('')}`;
    $$('.team-form', el).forEach(f => {
      const i = +f.dataset.i;
      f.onsubmit = async e => { e.preventDefault(); const list = [...C.team]; const d = formData(f); d.highlights = d.highlights.split('\n').map(x => x.trim()).filter(Boolean); list[i] = { ...list[i], ...d }; try { await saveSection('team', list); } catch (err) { fail(err); } };
      $('[data-photo]', f).onclick = () => pickFile(async file => {
        try { const up = await uploadSingle(file); const list = [...C.team]; list[i] = { ...list[i], photo: up.src }; await saveSection('team', list, 'Photo updated'); RENDER.team(el); } catch (err) { fail(err); }
      });
    });
  };

  // ---------- Business info ----------
  RENDER.info = el => {
    const s = C.site || {}, h = C.hero || {}, a = C.about || {};
    el.innerHTML = `<h1>Business Info</h1><p>Contact details, home page banner and About text. Changes appear on the website immediately.</p>
      <form class="box" id="f-site"><h3>Contact details</h3><div class="row">
        ${field('Hall name', 'name', s.name)}${field('Tagline', 'tagline', s.tagline)}
        ${field('Main phone', 'phone', s.phone)}${field('Other phones', 'altPhones', s.altPhones)}
        ${field('WhatsApp number', 'whatsapp', s.whatsapp)}${field('Email', 'email', s.email, 'email')}
        ${field('Full address', 'address', s.address)}${field('Google Maps search text', 'mapQuery', s.mapQuery)}
        ${field('Seating capacity (shown on About)', 'capacity', s.capacity)}${field('Visiting hours', 'hours', s.hours)}
        ${field('Google rating', 'googleRating', s.googleRating)}${field('Google reviews link', 'googleReviewsUrl', s.googleReviewsUrl, 'url')}
        ${field('Instagram link', 'instagram', s.instagram, 'url')}${field('Facebook link', 'facebook', s.facebook, 'url')}${field('YouTube channel link', 'youtube', s.youtube, 'url')}
        ${field('Location (short)', 'location', s.location)}
      </div><button class="btn btn-gold btn-sm" style="margin-top:18px">Save Contact Details</button></form>

      <form class="box" id="f-hero"><h3>Home page banner</h3><div class="team-edit">
        <div><img src="${esc(h.image)}" alt="" style="aspect-ratio:16/10"><button type="button" class="btn btn-outline btn-sm" data-img style="width:100%;margin-top:10px">Change Image</button></div>
        <div class="row" style="grid-template-columns:1fr">${field('Small heading', 'eyebrow', h.eyebrow)}${field('Main heading', 'title', h.title)}${field('Text', 'text', h.text, 'textarea')}
        <div><button class="btn btn-gold btn-sm">Save Banner</button></div></div></div></form>

      <form class="box" id="f-about"><h3>About text</h3><div class="team-edit">
        <div><img src="${esc(a.image)}" alt="" style="aspect-ratio:4/5"><button type="button" class="btn btn-outline btn-sm" data-img style="width:100%;margin-top:10px">Change Image</button></div>
        <div class="row" style="grid-template-columns:1fr">${field('Introduction', 'intro', a.intro, 'textarea')}${field('Our story', 'story', a.story, 'textarea')}${field('Our vision', 'vision', a.vision, 'textarea')}
        <div><button class="btn btn-gold btn-sm">Save About</button></div></div></div></form>`;

    $('#f-site', el).onsubmit = async e => { e.preventDefault(); try { await saveSection('site', { ...C.site, ...formData(e.target) }); } catch (err) { fail(err); } };
    $('#f-hero', el).onsubmit = async e => { e.preventDefault(); try { await saveSection('hero', { ...C.hero, ...formData(e.target) }); } catch (err) { fail(err); } };
    $('#f-about', el).onsubmit = async e => { e.preventDefault(); try { await saveSection('about', { ...C.about, ...formData(e.target) }); } catch (err) { fail(err); } };
    $('#f-hero [data-img]', el).onclick = () => pickFile(async f => { try { const up = await uploadSingle(f); await saveSection('hero', { ...C.hero, image: up.src }, 'Banner image updated'); RENDER.info(el); } catch (err) { fail(err); } });
    $('#f-about [data-img]', el).onclick = () => pickFile(async f => { try { const up = await uploadSingle(f); await saveSection('about', { ...C.about, image: up.src }, 'About image updated'); RENDER.info(el); } catch (err) { fail(err); } });
  };

  // ---------- Events ----------
  RENDER.events = el => {
    const ev = C.events || [];
    el.innerHTML = `<h1>Events</h1><p>The event types shown on the Home and Events pages.</p>
      ${ev.map((x, i) => `<form class="box ev-form" data-i="${i}"><div class="team-edit">
        <div><img src="${esc(x.image)}" alt="" style="aspect-ratio:4/3"><button type="button" class="btn btn-outline btn-sm" data-img style="width:100%;margin-top:10px">Change Image</button></div>
        <div class="row" style="grid-template-columns:1fr">${field('Event name', 'title', x.title)}${field('Description', 'text', x.text, 'textarea')}
        <div style="display:flex;gap:10px"><button class="btn btn-gold btn-sm">Save</button><button type="button" class="btn btn-outline btn-sm" data-del>Remove</button></div></div></div></form>`).join('')}
      <button class="btn btn-outline btn-sm" id="add-ev">+ Add Event Type</button>`;
    $$('.ev-form', el).forEach(f => {
      const i = +f.dataset.i;
      f.onsubmit = async e => { e.preventDefault(); const list = [...C.events]; list[i] = { ...list[i], ...formData(f) }; try { await saveSection('events', list); } catch (err) { fail(err); } };
      $('[data-img]', f).onclick = () => pickFile(async file => { try { const up = await uploadSingle(file); const list = [...C.events]; list[i] = { ...list[i], image: up.thumb }; await saveSection('events', list, 'Image updated'); RENDER.events(el); } catch (err) { fail(err); } });
      $('[data-del]', f).onclick = async () => { if (!confirm('Remove this event type?')) return; const list = C.events.filter((_, j) => j !== i); try { await saveSection('events', list, 'Removed'); RENDER.events(el); } catch (err) { fail(err); } };
    });
    $('#add-ev', el).onclick = async () => { const list = [...ev, { key: 'event-' + Date.now(), title: 'New Event', text: 'Describe this event type.', image: (C.gallery[0] || {}).thumb || '' }]; try { await saveSection('events', list, 'Added'); RENDER.events(el); } catch (err) { fail(err); } };
  };

  // ---------- Facilities ----------
  RENDER.facilities = el => {
    const f = C.facilities || [];
    el.innerHTML = `<h1>Facilities</h1><p>Only mark a facility <b>Available</b> if the hall really provides it. “Ask for details” shows it with a softer label; “Hidden” removes it from the website.</p>
      <form class="box" id="fac-form">${f.map((x, i) => `<div class="row" style="grid-template-columns:1fr 2fr 170px;padding:12px 0;border-bottom:1px solid var(--line)" data-i="${i}">
        <div class="field"><label>Facility</label><input class="mini" name="title-${i}" value="${esc(x.title)}"></div>
        <div class="field"><label>Description</label><input class="mini" name="text-${i}" value="${esc(x.text)}"></div>
        <div class="field"><label>Status</label><select class="mini" name="status-${i}">${[['available', 'Available'], ['ask', 'Ask for details'], ['hidden', 'Hidden']].map(([v, l]) => `<option value="${v}" ${x.status === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      </div>`).join('')}<button class="btn btn-gold btn-sm" style="margin-top:18px">Save Facilities</button></form>`;
    $('#fac-form', el).onsubmit = async e => {
      e.preventDefault(); const d = formData(e.target);
      const list = f.map((x, i) => ({ ...x, title: d['title-' + i], text: d['text-' + i], status: d['status-' + i] }));
      try { await saveSection('facilities', list); } catch (err) { fail(err); }
    };
  };

  // ---------- Reviews & stats ----------
  RENDER.reviews = el => {
    const r = C.reviews || [], st = C.stats || [];
    el.innerHTML = `<h1>Reviews & Highlights</h1><p>Add real reviews from your customers (for example, copied from Google with their permission).</p>
      <form class="box" id="add-rev"><h3>Add a review</h3><div class="row">
        ${field('Customer name', 'name', '')}${field('Event (e.g. Wedding, March 2026)', 'event', '')}
        <div class="field"><label>Rating</label><select name="rating" class="mini">${[5, 4, 3].map(n => `<option value="${n}">${'★'.repeat(n)}</option>`).join('')}</select></div>
        ${field('Review', 'text', '', 'textarea', 'full" style="grid-column:1/-1')}</div>
        <button class="btn btn-gold btn-sm" style="margin-top:16px">Add Review</button></form>
      ${r.map((x, i) => `<div class="list-item" style="grid-template-columns:1fr auto"><div><b>${esc(x.name)}</b> <span style="color:var(--gold)">${'★'.repeat(x.rating)}</span> <small class="hint">${esc(x.event)}</small><p style="margin:6px 0 0">${esc(x.text)}</p></div><button class="icon-btn danger" data-del="${i}" style="padding:0 14px">Delete</button></div>`).join('') || '<p class="hint">No reviews added yet – the website shows your Google rating and a “Write a review” button instead.</p>'}
      <form class="box" id="stats-form" style="margin-top:30px"><h3>Highlight numbers</h3><p class="hint">Shown on the Home and About pages. Use real numbers only.</p><div class="row">
        ${st.map((s, i) => `<div class="field"><label>Number ${i + 1}</label><input class="mini" name="v${i}" value="${esc(s.value)}"><input class="mini" name="l${i}" value="${esc(s.label)}" style="margin-top:6px"></div>`).join('')}
      </div><button class="btn btn-gold btn-sm" style="margin-top:16px">Save Highlights</button></form>`;
    $('#add-rev', el).onsubmit = async e => {
      e.preventDefault(); const d = formData(e.target); if (!d.name || !d.text) return toast('Please add a name and review text', true);
      try { await saveSection('reviews', [{ ...d, rating: +d.rating }, ...r], 'Review added'); RENDER.reviews(el); } catch (err) { fail(err); }
    };
    el.onclick = async e => { const b = e.target.closest('[data-del]'); if (!b) return; if (!confirm('Delete this review?')) return; try { await saveSection('reviews', r.filter((_, i) => i !== +b.dataset.del), 'Deleted'); RENDER.reviews(el); } catch (err) { fail(err); } };
    $('#stats-form', el).onsubmit = async e => { e.preventDefault(); const d = formData(e.target); try { await saveSection('stats', st.map((_, i) => ({ value: d['v' + i], label: d['l' + i] }))); } catch (err) { fail(err); } };
  };

  // ---------- Account ----------
  RENDER.account = el => {
    el.innerHTML = `<h1>Change Password</h1><p>Use a strong password that only the owner and manager know.</p>
      <form class="box" id="pw-form" style="max-width:460px">${field('Current password', 'current', '', 'password')}<div style="height:12px"></div>${field('New password (min 8 characters)', 'next', '', 'password')}<div style="height:12px"></div>${field('Repeat new password', 'again', '', 'password')}
      <button class="btn btn-gold btn-sm" style="margin-top:18px">Update Password</button></form>`;
    $('#pw-form', el).onsubmit = async e => {
      e.preventDefault(); const d = formData(e.target);
      if (d.next !== d.again) return toast('New passwords do not match', true);
      try { await api('POST', '/api/admin/password', d); e.target.reset(); toast('Password changed ✓'); } catch (err) { fail(err); }
    };
  };

  // ---------- Auth / boot ----------
  function showLogin() { $('#app').hidden = true; $('#login-view').hidden = false; $('#pw').focus(); }
  async function start() {
    C = await (await fetch('/api/content', { cache: 'no-store' })).json();
    $('#login-view').hidden = true; $('#app').hidden = false;
    if (!$('#tabs').children.length) buildTabs();
    const k = location.hash.slice(1); openTab(TABS.some(t => t[0] === k) ? k : 'photos');
    loadEnquiries();
  }
  $('#login-form').onsubmit = async e => {
    e.preventDefault(); const err = $('#login-err'); err.className = 'form-msg';
    try { await api('POST', '/api/login', formData(e.target)); $('#pw').value = ''; start(); }
    catch (ex) { err.className = 'form-msg error'; err.textContent = ex.message; }
  };
  $('#logout').onclick = async () => { await api('POST', '/api/logout').catch(() => {}); showLogin(); };
  fetch('/api/me', { credentials: 'same-origin' }).then(r => r.ok ? start() : showLogin()).catch(showLogin);
})();
