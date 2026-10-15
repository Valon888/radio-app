// Skript klasik (jo modul): shfaq një shirit gabimi të dukshëm nëse aplikacioni nuk niset,
// me buton që pastron cache-in dhe service worker-in (pa fshirë të preferuarat).
(function () {
  var shown = false;
  function show(msg) {
    if (shown || !document.body) return;
    shown = true;
    var bar = document.createElement('div');
    bar.id = 'errorBar';
    bar.setAttribute('role', 'alert');
    var text = document.createElement('span');
    text.textContent = 'Gabim në aplikacion: ' + msg;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Rifresko plotësisht';
    btn.addEventListener('click', function () {
      var tasks = [];
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        tasks.push(navigator.serviceWorker.getRegistrations().then(function (rs) {
          return Promise.all(rs.map(function (r) { return r.unregister(); }));
        }));
      }
      if (window.caches && caches.keys) {
        tasks.push(caches.keys().then(function (ks) {
          return Promise.all(ks.map(function (k) { return caches.delete(k); }));
        }));
      }
      Promise.all(tasks).catch(function () {}).then(function () { location.reload(); });
    });
    bar.appendChild(text);
    bar.appendChild(btn);
    document.body.appendChild(bar);
  }
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t !== window && (t.tagName === 'SCRIPT' || t.tagName === 'LINK')) {
      show('nuk u ngarkua ' + (t.src || t.href));
      return;
    }
    if (e.message && /ResizeObserver/.test(e.message)) return;
    show(e.message || 'gabim i panjohur');
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    show((r && r.message) || String(r));
  });
})();
