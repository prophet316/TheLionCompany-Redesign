/* Podcast section, round 3. Load after assets/common.js and layers.js-equivalent
   LION_LAYERS (both already in particles.html) and after the page's main script. */
(function(){
  var reduced = window.lionReduced;
  var LOGO = {
    "Apple Podcasts": ["assets/pod/apple-podcasts.svg", "180,70,230"],
    "Spotify":        ["assets/pod/spotify.svg",        "30,215,96"],
    "YouTube":        ["assets/pod/youtube.svg",        "255,0,0"],
    "Podbean":        ["assets/pod/podbean.svg",        "141,198,63"]
  };

  /* Platform tiles, full color, wired to the live links in LION.podcast. */
  var plat = document.getElementById('plat');
  if (plat) plat.innerHTML = LION.podcast.map(function(p){
    var l = LOGO[p[0]] || ["", "228,141,29"];
    return '<li><a href="' + p[1] + '" target="_blank" rel="noopener" style="--b:' + l[1] + '">' +
      (l[0] ? '<img src="' + l[0] + '" alt="" width="44" height="44">' : '') +
      '<span><b>' + p[0] + '</b><small>Listen now</small></span><span class="arr" aria-hidden="true">↗</span></a></li>';
  }).join('');

  var art = document.getElementById('podArt');
  if (art) art.href = LION.podcast[0][1];

  /* The cover, rebuilt from its real layers in full color. */
  var cover = document.getElementById('podCover');
  if (!cover || !window.lionCover) return;
  var L = lionCover(cover);
  /* depth per layer: newsprint stays put, lions drift a little, title more, portraits and plane most */
  var DEPTH = {1:0, 3:.25, 4:.25, 5:.5, 6:.5, 7:.15, 9:.15, 8:.9, 10:.55, 11:.6, 12:.5, 13:.65, 14:.7, 15:.75,
               16:.62, 17:.62, 18:.85, 19:.85, 20:.85, 21:.95, 22:.95, 23:1, 24:1, 25:1, 26:.95, 27:1.15};
  var tx = 0, ty = 0, cx = 0, cy = 0, hovering = false, raf = 0, last = 0;
  /* the frame tilts first; loose pieces trail it, deeper layers trail more */
  var LS = {}; for (var n0 in L) LS[n0] = { x: 0, y: 0, r: .2 - .09 * Math.min(1, DEPTH[n0] || 0) };
  function apply(h){
    h = h || 1;
    var e = 1 - Math.pow(.88, h), busy = Math.abs(tx - cx) > .001 || Math.abs(ty - cy) > .001;
    cx += (tx - cx) * e; cy += (ty - cy) * e;
    for (var n in L) {
      var d = DEPTH[n] || 0, img = L[n], s = LS[n], er = 1 - Math.pow(1 - s.r, h);
      s.x += (cx - s.x) * er; s.y += (cy - s.y) * er;
      if (d && (Math.abs(cx - s.x) > .001 || Math.abs(cy - s.y) > .001)) busy = true;
      img.style.transform = 'translate(' + (s.x * d * 2.2).toFixed(2) + '%,' + (s.y * d * 2.2).toFixed(2) + '%)' + (n == 1 ? ' scale(1.06)' : '');
    }
    cover.style.setProperty('--ry', (cx * 7).toFixed(2) + 'deg');
    cover.style.setProperty('--rx', (-cy * 7).toFixed(2) + 'deg');
    if (busy || !hovering) raf = requestAnimationFrame(loop); else { raf = 0; last = 0; }
  }
  var t0 = performance.now();
  function loop(now){
    var h = last ? Math.min(3, (now - last) / 16.67) : 1; last = now;
    if (!hovering && !reduced) { var t = (now - t0) / 1000; tx = Math.sin(t * .35) * .35; ty = Math.cos(t * .27) * .25; }
    apply(h);
  }
  for (var n in L) L[n].style.transition = 'none';
  if (reduced) { apply(); cancelAnimationFrame(raf); return; }
  art.addEventListener('pointermove', function(e){
    var r = art.getBoundingClientRect();
    hovering = true;
    tx = ((e.clientX - r.left) / r.width - .5) * 2;
    ty = ((e.clientY - r.top) / r.height - .5) * 2;
    if (!raf) raf = requestAnimationFrame(loop);
  });
  art.addEventListener('pointerleave', function(){ hovering = false; if (!raf) raf = requestAnimationFrame(loop); });
  /* only animate while the section is on screen */
  var pod = cover.closest('.pod'), liveT = 0;
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (e.isIntersecting) { if (!raf) raf = requestAnimationFrame(loop); }
      else { cancelAnimationFrame(raf); raf = 0; last = 0; }
    });
  });
  io.observe(cover);
  /* the sound bars play for a few seconds when their label comes into view (on phones it sits well below the cover) */
  var label = pod.querySelector('.pod-label') || cover;
  var io2 = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (e.isIntersecting) { pod.classList.add('live'); clearTimeout(liveT); liveT = setTimeout(function(){ pod.classList.remove('live'); }, 3300); }
      else { clearTimeout(liveT); pod.classList.remove('live'); }
    });
  }, { threshold: .6 });
  io2.observe(label);
})();
