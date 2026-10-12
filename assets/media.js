/* Media library: menus, rising embers, the newest episode, search and filters, the video player.
   Load after assets/common.js (links, analytics), assets/layers.js and assets/pod/podcast.js (the podcast cover and platform tiles). */
(function () {
  var root = document.documentElement, reduced = window.lionReduced, coarse = matchMedia('(hover:none)').matches;
  root.classList.add('js');
  function track(name, params) { if (window.lionTrack) lionTrack(name, params); }

  /* ---------- the Socials and Menu sheets, as on the homepage ---------- */
  function closeAll() {
    document.querySelectorAll('.sheet.open').forEach(function (s) { s.classList.remove('open'); });
    document.querySelectorAll('.bbtn[aria-expanded]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  }
  function sheet(btnId, id) {
    var b = document.getElementById(btnId), s = document.getElementById(id);
    if (!b || !s) return;
    b.addEventListener('click', function (e) { e.stopPropagation(); var open = !s.classList.contains('open'); closeAll(); if (open) { s.classList.add('open'); b.setAttribute('aria-expanded', 'true'); } });
    s.addEventListener('click', function (e) { if (e.target.closest('a')) closeAll(); e.stopPropagation(); });
  }
  sheet('socbtn', 'socsheet'); sheet('menubtn', 'menusheet');
  document.addEventListener('click', closeAll);

  /* ---------- bold words react on their own ---------- */
  function words(el, tier) {
    el.classList.add(tier);
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 1) { if (c.tagName !== 'SMALL') walk(c); return; }
        if (c.nodeType !== 3 || !c.nodeValue.trim()) return;
        var f = document.createDocumentFragment();
        c.nodeValue.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { f.appendChild(document.createTextNode(t)); return; }
          var w = document.createElement('span'); w.className = 'w'; w.textContent = t; f.appendChild(w);
        });
        node.replaceChild(f, c);
      });
    })(el);
  }
  document.querySelectorAll('.htitle,.shelf h2,.close h2,.feature .pod h2').forEach(function (el) { words(el, 'lg'); });
  if (coarse) document.addEventListener('click', function (e) {
    var w = e.target.closest && e.target.closest('.w'); if (!w) return;
    w.classList.add('tap'); clearTimeout(w._tap); w._tap = setTimeout(function () { w.classList.remove('tap'); }, 900);
  });

  /* ---------- the newest episode, from the live podcast feed (api/latest-episode.js) ---------- */
  fetch('/api/latest-episode').then(function (r) { return r.ok ? r.json() : null; }).then(function (ep) {
    var el = document.getElementById('podNew'); if (!ep || !ep.title || !el) return;
    el.innerHTML = ''; var sm = document.createElement('small'); sm.textContent = 'Newest episode'; el.appendChild(sm);
    el.appendChild(document.createTextNode((ep.number ? 'Ep ' + ep.number + ' · ' : '') + ep.title));
  }).catch(function () {});

  /* ---------- embers: sparse, rising, flickering; slower and calmer when a device asks for less motion ---------- */
  (function () {
    var cv = document.getElementById('embers'); if (!cv || !cv.getContext) return;
    var g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0, E = [], raf = 0, last = 0, vis = true;
    var speed = reduced ? .45 : 1, scrollKick = 0, lastY = scrollY;
    function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function spawn(e, first) {
      var z = Math.random(); // depth: far ones small and dim, near ones larger and softer
      e.x = Math.random() * W; e.y = first ? Math.random() * H : H + 20 + Math.random() * 60;
      e.z = z; e.r = .6 + z * z * 2.6; e.vy = (12 + z * 34) * (.7 + Math.random() * .6); e.sw = Math.random() * 6.28; e.sf = .3 + Math.random() * .8;
      e.heat = Math.random() < .14 ? .95 + Math.random() * .2 : .35 + Math.random() * .45; e.ph = Math.random() * 100; e.life = 0;
      return e;
    }
    function count() { return Math.round(Math.min(90, Math.max(34, W * H / 22000))); }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = last ? Math.min(.05, (now - last) / 1000) : .016; last = now;
      var dy = scrollY - lastY; lastY = scrollY; scrollKick += (Math.max(-60, Math.min(60, dy)) - scrollKick) * .12;
      g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
      var t = now / 1000;
      for (var i = 0; i < E.length; i++) {
        var e = E[i]; e.life += dt;
        e.y -= (e.vy * speed + scrollKick * (reduced ? 0 : .6) * (.4 + e.z)) * dt;
        e.x += Math.sin(t * e.sf + e.sw) * (6 + e.z * 10) * dt * speed;
        if (e.y < -30) spawn(e, false);
        var fk = .62 + .38 * Math.sin(t * (3.1 + 4 * e.sf) + e.ph) * Math.sin(t * (1.3 + 2.1 * e.sf) + e.ph * .7);
        var h = e.heat * (.82 + .28 * fk), fade = Math.min(1, e.life * 1.5) * Math.min(1, (e.y + 30) / (H * .35));
        var a = Math.max(0, (.18 + .55 * e.z) * h * fade);
        var r = Math.round(150 + 105 * Math.min(1, h)), gg = Math.round(40 + 120 * Math.max(0, h - .2)), b = Math.round(10 + 90 * Math.max(0, h - .85));
        var rad = e.r * (e.z > .8 ? 3.2 : 2.2);
        var grd = g.createRadialGradient(e.x, e.y, 0, e.x, e.y, rad);
        grd.addColorStop(0, 'rgba(' + r + ',' + gg + ',' + b + ',' + a + ')');
        grd.addColorStop(.35, 'rgba(' + r + ',' + Math.round(gg * .7) + ',' + b + ',' + (a * .45) + ')');
        grd.addColorStop(1, 'rgba(' + r + ',' + gg + ',' + b + ',0)');
        g.fillStyle = grd; g.beginPath(); g.arc(e.x, e.y, rad, 0, 6.283); g.fill();
      }
    }
    function start() { if (!raf && vis) { last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { cancelAnimationFrame(raf); raf = 0; }
    size(); for (var i = 0, n = count(); i < n; i++) E.push(spawn({}, true));
    addEventListener('resize', function () { size(); var n = count(); while (E.length < n) E.push(spawn({}, true)); E.length = n; });
    document.addEventListener('visibilitychange', function () { vis = !document.hidden; if (vis) start(); else stop(); });
    start();
  })();

  /* ---------- shelves and cards rise into place ---------- */
  var rise = [].slice.call(document.querySelectorAll('.rise'));
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, sib = el.parentNode ? [].indexOf.call(el.parentNode.children, el) : 0;
        if (el.classList.contains('card')) el.style.transitionDelay = (Math.min(sib % 4, 3) * 70) + 'ms';
        el.classList.add('in'); io.unobserve(el);
        setTimeout(function () { el.style.transitionDelay = ''; }, 1400);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: .08 });
    rise.forEach(function (el) { io.observe(el); });
  } else rise.forEach(function (el) { el.classList.add('in'); });

  /* ---------- thumbnails load as they come near the screen, so the library stays quick on phones ---------- */
  var imgs = [].slice.call(document.querySelectorAll('[data-bg-image]'));
  function loadImg(el) { el.style.backgroundImage = 'url("' + el.getAttribute('data-bg-image') + '")'; el.removeAttribute('data-bg-image'); }
  if ('IntersectionObserver' in window) {
    var lio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { loadImg(e.target); lio.unobserve(e.target); } }); }, { rootMargin: '600px 0px' });
    imgs.forEach(function (el) { lio.observe(el); });
  } else imgs.forEach(loadImg);

  /* ---------- search and filters ---------- */
  var search = document.getElementById('media-search'), result = document.getElementById('media-results'), empty = document.getElementById('media-empty');
  var chips = [].slice.call(document.querySelectorAll('[data-media-filter]'));
  var shelves = [].slice.call(document.querySelectorAll('.shelf[data-media-category]'));
  var cards = [].slice.call(document.querySelectorAll('.media-card'));
  var active = 'all', ready = false;
  function update() {
    var q = (search ? search.value : '').trim().toLowerCase(), shown = 0;
    shelves.forEach(function (s) {
      var cat = s.getAttribute('data-media-category'), inCat = active === 'all' || active === cat, any = false;
      s.querySelectorAll('.media-card').forEach(function (c) {
        var ok = inCat && (!q || c.textContent.toLowerCase().indexOf(q) > -1);
        c.hidden = !ok; if (ok) { any = true; shown++; if (ready) c.classList.add('in'); }
      });
      s.hidden = !any;
    });
    if (result) result.textContent = shown === 1 ? '1 video' : shown + ' videos';
    if (empty) empty.hidden = shown > 0;
  }
  function setFilter(cat) {
    active = cat;
    chips.forEach(function (b) { var on = b.getAttribute('data-media-filter') === cat; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    update();
  }
  chips.forEach(function (b) {
    b.addEventListener('click', function () {
      setFilter(b.getAttribute('data-media-filter'));
      track('media_filter', { media_category: active });
      var lib = document.getElementById('library'); if (lib && lib.getBoundingClientRect().top < 0) lib.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });
  if (search) search.addEventListener('input', update);
  document.querySelectorAll('[data-clear]').forEach(function (b) { b.addEventListener('click', function () { if (search) search.value = ''; setFilter('all'); }); });
  // the jump links at the top pick a shelf
  document.querySelectorAll('[data-jump]').forEach(function (a) { a.addEventListener('click', function () { setFilter(a.getAttribute('data-jump')); }); });
  update(); ready = true;

  /* ---------- the player ---------- */
  var modal = document.getElementById('video-modal');
  if (!modal) return;
  var iframe = document.getElementById('video-iframe'), yt = document.getElementById('video-youtube-link'), copy = document.getElementById('video-copy-link');
  var titleEl = document.getElementById('video-modal-title'), kindEl = document.getElementById('video-modal-kind'), closeBtn = modal.querySelector('.player-x'), back = null;
  function shareUrl(id) { var u = new URL(location.href); u.hash = 'watch-' + id; return u.toString(); }
  function openVideo(card, id, push) {
    if (!id) return;
    back = document.activeElement;
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
    yt.href = 'https://www.youtube.com/watch?v=' + id;
    var t = card && card.querySelector('b'), k = card && card.querySelector('small');
    titleEl.textContent = t ? t.textContent : 'The Lion Company';
    kindEl.textContent = k ? k.textContent : 'The Lion Company';
    modal.classList.add('active'); modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (push !== false) history.replaceState(null, '', '#watch-' + id);
    if (closeBtn) closeBtn.focus();
    track('video_play', { video_id: id });
  }
  function closeVideo() {
    modal.classList.remove('active'); modal.setAttribute('aria-hidden', 'true');
    setTimeout(function () { iframe.src = ''; }, 300);
    document.body.style.overflow = '';
    if (location.hash.indexOf('#watch-') === 0) history.replaceState(null, '', location.pathname + location.search);
    if (back) back.focus();
  }
  document.querySelectorAll('.video-trigger').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault(); openVideo(a, a.getAttribute('data-video-id'));
    });
  });
  modal.querySelectorAll('.js-modal-close').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); closeVideo(); }); });
  if (copy) copy.addEventListener('click', function () {
    var m = yt.href.match(/[?&]v=([^&]+)/); if (!m) return;
    var done = function (txt) { copy.textContent = txt; setTimeout(function () { copy.textContent = 'Copy share link'; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(shareUrl(m[1])).then(function () { done('Link copied'); }, function () { done('Copy unavailable'); });
    else done('Copy unavailable');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (modal.classList.contains('active')) closeVideo(); else closeAll(); return; }
    if (e.key === 'Tab' && modal.classList.contains('active')) {
      var f = [].slice.call(modal.querySelectorAll('a[href], button:not([disabled]), iframe'));
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  var hm = location.hash.match(/^#watch-([A-Za-z0-9_-]+)$/);
  if (hm) { var c = document.querySelector('[data-video-id="' + hm[1] + '"]'); if (c) openVideo(c, hm[1], false); }
})();

/* the lion face at the top: the sketched half and the geometric half drift apart and together with the pointer,
   breathe on their own when nobody is pointing, and the geometric lines warm to orange when you point at the title */
(function () {
  var face = document.getElementById('face'); if (!face) return;
  var fs = face.querySelector('.fs'), fg = face.querySelector('.fg'), reduced = window.lionReduced;
  var tx = 0, ty = 0, cx = 0, cy = 0, t0 = performance.now(), raf = 0, on = true, pointing = false;
  var title = document.querySelector('.htitle');
  if (title) {
    title.addEventListener('pointerenter', function () { face.classList.add('warm'); });
    title.addEventListener('pointerleave', function () { face.classList.remove('warm'); });
  }
  if (reduced) return;
  addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; pointing = true; tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });
  document.addEventListener('pointerleave', function () { pointing = false; });
  function loop(now) {
    raf = on ? requestAnimationFrame(loop) : 0;
    var t = (now - t0) / 1000, breathe = (Math.sin(t * .45) + 1) / 2;
    var gx = pointing ? tx : Math.sin(t * .21) * .18, gy = pointing ? ty : Math.cos(t * .17) * .12;
    cx += (gx - cx) * .05; cy += (gy - cy) * .05;
    var part = 4 + breathe * 10 + Math.abs(cx) * 18;
    fs.style.transform = 'translate(' + (-part + cx * 10).toFixed(2) + 'px,' + (cy * 14).toFixed(2) + 'px)';
    fg.style.transform = 'translate(' + (part + cx * 26).toFixed(2) + 'px,' + (cy * 24).toFixed(2) + 'px)';
  }
  var io = new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on && !raf) raf = requestAnimationFrame(loop); });
  io.observe(face);
})();
