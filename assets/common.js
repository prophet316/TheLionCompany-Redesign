/* Shared wiring for all three Lion Company directions.
   Every URL below comes from the locked Phase 1 manifest. */
window.LION = {
  give: "https://secure.subsplash.com/ui/access/RM87PQ/",
  store: "https://the-lion-company.printify.me/",
  media: "/media",
  privacy: "/privacy",
  terms: "/terms",
  email: "jonathan@thelioncompany.org",
  social: [
    ["Instagram", "https://www.instagram.com/thelioncompanyglobal/"],
    ["TikTok", "https://www.tiktok.com/@thelioncompanytx"],
    ["YouTube", "https://www.youtube.com/channel/UCEy6IknxFCGag4UBVGn4wWg"],
    ["Facebook", "https://www.facebook.com/lioncompanytx"]
  ],
  podcast: [
    ["Apple Podcasts", "https://podcasts.apple.com/us/podcast/the-lion-company-podcast/id1783214612"],
    ["Spotify", "https://open.spotify.com/show/2zvyq6wVX8sAf7qXd9KQg5"],
    ["YouTube", "https://www.youtube.com/channel/UCEy6IknxFCGag4UBVGn4wWg"],
    ["Podbean", "https://thelioncompany.podbean.com/"]
  ],
  videos: [
    ["Podcast", "What Silence Costs: Confession, Forgiveness & Real Connection", "Ep. 08", "https://www.youtube.com/watch?v=VT5XZH471c0"],
    ["Podcast", "When God's Will Doesn't Go Your Way", "Ep. 07", "https://www.youtube.com/watch?v=TOj6tefx3rI"],
    ["Podcast", "Confessions of a Truth Teller", "Ep. 06", "https://www.youtube.com/watch?v=x8s5DPF68kQ"]
  ]
};

/* Fill any element marked data-fill="social|podcast|videos" with real links. */
function lionFill(root) {
  root = root || document;
  root.querySelectorAll('[data-href]').forEach(function (a) {
    var k = a.getAttribute('data-href');
    if (LION[k]) { a.href = LION[k]; a.target = "_blank"; a.rel = "noopener"; }
  });
  root.querySelectorAll('[data-fill]').forEach(function (el) {
    var kind = el.getAttribute('data-fill'), tpl = el.querySelector('template');
    if (!tpl) return;
    (LION[kind] || []).forEach(function (row, i) {
      var html = tpl.innerHTML
        .replace(/\{name\}/g, row[0]).replace(/\{url\}/g, row[row.length - 1])
        .replace(/\{title\}/g, row[1] || "").replace(/\{ep\}/g, row[2] || "")
        .replace(/\{i\}/g, String(i + 1).padStart(2, "0"));
      el.insertAdjacentHTML('beforeend', html);
    });
    el.querySelectorAll('a').forEach(function (a) { a.target = "_blank"; a.rel = "noopener"; });
  });
  root.querySelectorAll('[data-email]').forEach(function (el) { el.textContent = LION.email; });
}

/* Forms: every form posts to /api/forms (Resend), exactly like the previous site.
   Prayer and contact email Jonathan and send the person an acknowledgment;
   the newsletter adds a pending subscriber, sends the confirm email and alerts Jonathan. */
function lionTrack(name, params) { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); }
function lionForms(root) {
  var ids = {
    prayer: { firstName: 'q-pf', lastName: 'q-pl', email: 'q-pe', phone: 'q-pp', message: 'q-pr' },
    contact: { firstName: 'q-cf', lastName: 'q-cl', email: 'q-ce', message: 'q-cm' },
    newsletter: { email: 'q-ne' }
  };
  // the "Also send me the monthly letter" box on the prayer and contact forms
  var optIn = { prayer: 'q-pn', contact: 'q-cn' };
  var done = {
    prayer: "Thank you. Your request has been received, and we are praying. Check your inbox for a note from us.",
    contact: "Thank you. Your message has been sent, and we will be in touch soon.",
    newsletter: "Almost there. Check your inbox and confirm your email to join."
  };
  (root || document).querySelectorAll('form[data-form]').forEach(function (f) {
    var kind = f.getAttribute('data-form');
    // spam trap: people never see or fill this field
    var trap = document.createElement('input');
    trap.type = 'text'; trap.name = 'lion_hp_x'; trap.tabIndex = -1; trap.autocomplete = 'off';
    trap.setAttribute('aria-hidden', 'true');
    trap.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    f.appendChild(trap);
    // screen readers hear the result: a live region that is always in the page (the visible note starts hidden, so it can't announce itself)
    var live = document.createElement('p'); live.className = 'sr-only'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); live.setAttribute('aria-atomic', 'true'); f.appendChild(live);
    // time trap: the server quietly drops a form sent faster than a person could fill it
    var startedAt = Date.now();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var blank = [].slice.call(f.querySelectorAll('[required]')).filter(function (el) { return !el.value.trim(); })[0];
      if (blank) { blank.value = ''; blank.reportValidity(); return; } // spaces alone don't count as an answer
      if (f.dataset.busy) return; // one request at a time, so a double click sends once
      var map = ids[kind] || {}, payload = { type: kind, lion_hp_x: trap.value, elapsed: Date.now() - startedAt };
      Object.keys(map).forEach(function (k) { var el = document.getElementById(map[k]); payload[k] = el ? el.value.trim() : ''; });
      var box = optIn[kind] && document.getElementById(optIn[kind]); if (box && box.checked) payload.joinNewsletter = true;
      var out = f.querySelector('.form-note'), btn = f.querySelector('button[type="submit"]'), label = btn ? btn.textContent : '';
      function note(msg, bad) { if (out) { out.textContent = msg; out.hidden = false; out.classList.toggle('err', !!bad); } live.setAttribute('role', bad ? 'alert' : 'status'); live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 60); }
      // busy, not disabled: a disabled button would drop keyboard focus to the top of the page
      f.dataset.busy = '1';
      if (btn) { btn.setAttribute('aria-disabled', 'true'); btn.textContent = 'Sending…'; }
      var send = payload.lion_hp_x ? Promise.resolve({ ok: true, json: function () { return {}; } })
        : fetch('/api/forms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      send.then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'failed'); });
      }).then(function () {
        var joined = payload.joinNewsletter;
        f.reset(); note((done[kind] || 'Thank you.') + (joined ? ' To get the monthly letter, confirm the separate email we just sent.' : '')); f.classList.add('sent');
        lionTrack('form_submission_success', { form_type: kind });
        if (joined) lionTrack('newsletter_optin', { form_type: kind });
        if (window.onLionForm) window.onLionForm(kind, f);
      }).catch(function () {
        note('We could not send that just now. Please email Jonathan@TheLionCompany.org.', true);
        lionTrack('form_submission_error', { form_type: kind });
      }).then(function () { delete f.dataset.busy; if (btn) { btn.removeAttribute('aria-disabled'); btn.textContent = label; } });
    });
  });
}

/* Analytics: the same click events the previous site sent to Google Analytics. */
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
  var href = a.href || '';
  var plat = (LION.podcast || []).filter(function (p) { return href === p[1]; })[0];
  if (plat && a.closest('#podcast,.pod,[data-fill="podcast"]')) lionTrack('podcast_platform_click', { platform: plat[0], link_url: href });
  else if (href === LION.give) { var f = a.querySelector('b'); lionTrack('give_click', { link_url: href, fund: f ? f.textContent : 'top band' }); }
  else if (a.hostname && a.hostname !== location.hostname) lionTrack('outbound_click', { link_url: href, link_domain: a.hostname });
}, true);

/* Build the podcast cover from its real layers inside `el` (aspect 1:1).
   opts.skip: layer numbers to leave out. Returns {n: img}. */
function lionCover(el, opts) {
  opts = opts || {};
  var skip = opts.skip || [], map = {};
  LION_LAYERS.forEach(function (l) {
    if (skip.indexOf(l.n) > -1) return;
    var img = new Image();
    // the cover sits far below the fold, so its layers load as it comes near
    img.loading = "lazy"; img.fetchPriority = "low";
    img.src = l.src; img.alt = l.text || ""; img.decoding = "async"; img.draggable = false;
    img.className = "ly ly" + l.n;
    var s = img.style;
    s.position = "absolute";
    s.left = (l.x / 30) + "%"; s.top = (l.y / 30) + "%";
    s.width = (l.w / 30) + "%"; s.height = (l.h / 30) + "%";
    s.opacity = l.op; s.maxWidth = "none";
    img.dataset.n = l.n;
    el.appendChild(img);
    map[l.n] = img;
  });
  return map;
}

var lionReduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
document.addEventListener('DOMContentLoaded', function () { lionFill(); lionForms(); });
