/* Where people spend their time. Every part of a page marked data-track="name" is a hidden anchor:
   while it holds the middle of the screen and the visitor is active, its seconds add up.
   Google Analytics gets section_view the first time a part is reached, section_time with the seconds
   when the visitor leaves or switches tabs, and scroll_depth at 25/50/75/100% of the page.
   Nothing here reads form fields or anything about the person; it only knows which part was on screen. */
(function () {
  var secs = [].slice.call(document.querySelectorAll('[data-track]'));
  var page = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') || '/';
  var IDLE = 30000; // a tab left open with nobody there stops counting after 30 seconds
  var cur = null, lastTick = Date.now(), lastAct = Date.now(), seen = {}, time = {}, depth = 0;

  function send(name, params) { params.page_path = page; if (window.lionTrack) lionTrack(name, params); else if (typeof window.gtag === 'function') gtag('event', name, params); }

  // the part of the page crossing the middle of the screen is the one being read
  function active() {
    var mid = innerHeight / 2;
    for (var i = 0; i < secs.length; i++) { var r = secs[i].getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) return secs[i]; }
    return null;
  }

  function tick() {
    var now = Date.now();
    if (cur && document.visibilityState === 'visible' && now - lastAct < IDLE) { var k = cur.getAttribute('data-track'); time[k] = (time[k] || 0) + (now - lastTick); }
    lastTick = now;
  }

  function look() {
    tick();
    cur = active();
    if (cur) { var k = cur.getAttribute('data-track'); if (!seen[k]) { seen[k] = 1; send('section_view', { section_name: k, section_index: secs.indexOf(cur) + 1 }); } }
    var h = document.documentElement.scrollHeight - innerHeight, p = h > 0 ? (scrollY / h) * 100 : 100;
    [25, 50, 75, 100].forEach(function (m) { if (p >= m - 1 && depth < m) { depth = m; send('scroll_depth', { percent_scrolled: m }); } });
  }

  // seconds go out whenever the page is hidden (tab switch, app switch, leaving), then start again from zero
  function flush() {
    tick();
    Object.keys(time).forEach(function (k) { var s = Math.round(time[k] / 1000); if (s >= 1) send('section_time', { section_name: k, engaged_seconds: s, value: s, transport_type: 'beacon' }); });
    time = {};
  }

  var queued = false;
  function soon() { lastAct = Date.now(); if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; look(); }); }
  addEventListener('scroll', soon, { passive: true });
  addEventListener('resize', soon);
  ['pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function (e) { addEventListener(e, function () { lastAct = Date.now(); }, { passive: true }); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); else { lastTick = lastAct = Date.now(); } });
  addEventListener('pagehide', flush);
  setInterval(tick, 5000);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', look); else look();
})();
