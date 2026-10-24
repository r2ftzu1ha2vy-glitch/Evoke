(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmt = function (n) { return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : String(n); };
  var games = [], query = '';

  function fail(msg) {
    $('#spinner').hidden = true; $('#retry').hidden = false;
    $('#loading-text').innerHTML = 'Something went wrong starting Evoke.<br><span class="loading-err">' + esc(msg) + '</span>';
    $('#loading').hidden = false;
  }
  window.addEventListener('error', function (e) { fail(e.message); });

  // Future: replace with Firebase init + Realtime Database fetch.
  function getGames() { return Promise.resolve(window.EVOKE_GAMES || Promise.reject(new Error('Game data failed to load'))); }

  function thumb(g, big) {
    var bg = g.thumbnail ? '' : ' style="background:linear-gradient(135deg,' + g.colors[0] + ',' + g.colors[1] + ')"';
    var inner = g.thumbnail ? '<img src="' + esc(g.thumbnail) + '" alt="" loading="lazy">' : '<span class="thumb-letter" aria-hidden="true">' + esc(g.title[0]) + '</span>';
    return { bg: bg, inner: inner };
  }
  function card(g) {
    var t = thumb(g);
    return '<a class="card" href="#/game/' + esc(g.id) + '" aria-label="' + esc(g.title + ' by ' + g.creator + ', ' + g.players + ' playing') + '">' +
      '<div class="thumb"' + t.bg + '>' + t.inner + '</div><div class="card-body"><h3>' + esc(g.title) + '</h3><p class="muted">by ' + esc(g.creator) + '</p>' +
      '<p class="players"><span class="dot" aria-hidden="true"></span>' + fmt(g.players) + ' playing</p></div></a>';
  }
  function section(id, title, list) {
    if (!list.length) return '';
    return '<section id="' + id + '" class="section" aria-labelledby="' + id + '-h"><h2 id="' + id + '-h">' + title + '</h2><div class="grid">' + list.map(card).join('') + '</div></section>';
  }
  function message(title, note) {
    return '<section class="page-msg"><h1>' + esc(title) + '</h1><p class="muted">' + esc(note) + '</p><a href="#/" class="btn btn-ghost">Back to Home</a></section>';
  }

  function home() {
    var q = query.trim().toLowerCase(), m = function (g) { return g.title.toLowerCase().indexOf(q) !== -1; };
    var f = games.filter(function (g) { return g.section === 'featured' && m(g); });
    var p = games.filter(function (g) { return g.section === 'popular' && m(g); });
    var html = '';
    if (!q) html += '<section class="welcome"><h1>Your next world awaits.</h1><p>Discover experiences, explore new worlds, and find your next favorite game.</p><button class="btn btn-primary btn-lg" id="explore">Explore Games</button></section>';
    else html += '<p class="muted result-note">Showing results for “' + esc(query.trim()) + '”</p>';
    if (q && !f.length && !p.length) html += '<div class="empty"><h2>No games found</h2><p class="muted">Nothing matches “' + esc(query.trim()) + '”. Try a different name.</p><button class="btn btn-ghost" id="clear">Clear search</button></div>';
    else html += section('featured', 'Featured Experiences', f) + section('popular', 'Popular Right Now', p);
    return html;
  }
  function details(id) {
    var g = games.filter(function (x) { return x.id === id; })[0];
    if (!g) return message('Game not found', "We couldn't find that game.");
    var t = thumb(g);
    return '<section class="details"><div class="details-thumb"' + t.bg + '>' + t.inner + '</div><div class="details-info"><h1>' + esc(g.title) + '</h1>' +
      '<p class="muted">by ' + esc(g.creator) + ' · ' + fmt(g.players) + ' playing</p><p>' + esc(g.description) + '</p>' +
      '<div class="notice">Gameplay isn\'t implemented yet. This is a preview of the game page only.</div>' +
      '<div class="details-actions"><button class="btn btn-primary" disabled aria-disabled="true" title="Gameplay is not available yet">Play (unavailable)</button><a href="#/" class="btn btn-ghost">Back to Home</a></div></div></section>';
  }

  function route() {
    var path = (location.hash.replace(/^#/, '') || '/'), html, key = '';
    var gm = path.match(/^\/game\/(.+)$/);
    if (path === '/') { html = home(); key = 'home'; }
    else if (gm) html = details(decodeURIComponent(gm[1]));
    else if (path === '/discover') { html = message('Discover', 'Game discovery is coming in a later phase. For now, browse the games on the Home page.'); key = 'discover'; }
    else if (path === '/create') { html = message('Create', "Game creation isn't available yet. It's planned for a future phase."); key = 'create'; }
    else if (path === '/about') html = message('About Evoke', 'This page is a placeholder and has not been written yet.');
    else if (path === '/guidelines') html = message('Community Guidelines', 'This page is a placeholder and has not been written yet.');
    else if (path === '/privacy') html = message('Privacy', 'This page is a placeholder and has not been written yet.');
    else if (path === '/terms') html = message('Terms', 'This page is a placeholder and has not been written yet.');
    else html = message('Page not found', "That page doesn't exist.");
    $('#main').innerHTML = html;
    document.querySelectorAll('.nav-link').forEach(function (a) { a.classList.toggle('active', a.dataset.route === key); });
    closeMenu();
    var ex = $('#explore'); if (ex) ex.onclick = function () { $('#featured').scrollIntoView({ behavior: 'smooth' }); };
    var cl = $('#clear'); if (cl) cl.onclick = function () { $('#search-input').value = ''; query = ''; route(); };
  }
  var lastPath = null;
  window.addEventListener('hashchange', function () { route(); window.scrollTo(0, 0); });

  function closeMenu() { $('#nav-links').classList.remove('open'); $('#menu-btn').setAttribute('aria-expanded', 'false'); }

  // Auth modal: frontend only. Replace submit handler with Firebase Auth calls later.
  function openAuth(mode) {
    var su = mode === 'signup';
    $('#modal').innerHTML = '<div class="overlay" id="overlay"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">' +
      '<button class="icon-btn modal-close" id="m-close" aria-label="Close">✕</button><img src="logo.svg" alt="" width="36" height="36">' +
      '<h2 id="auth-title">' + (su ? 'Create your account' : 'Welcome back') + '</h2><form id="auth-form">' +
      (su ? '<label>Username<input name="username" autocomplete="username" required></label>' : '') +
      '<label>Email<input name="email" type="email" autocomplete="email" required></label>' +
      '<label>Password<input name="password" type="password" autocomplete="' + (su ? 'new-password' : 'current-password') + '" required minlength="6"></label>' +
      '<button class="btn btn-primary btn-block" type="submit">' + (su ? 'Sign Up' : 'Log In') + '</button></form><div id="m-note"></div>' +
      '<p class="muted small">' + (su ? 'Already have an account?' : 'New to Evoke?') + ' <button class="link" id="m-switch">' + (su ? 'Log In' : 'Sign Up') + '</button></p></div></div>';
    $('#m-close').onclick = closeAuth;
    $('#overlay').onmousedown = function (e) { if (e.target.id === 'overlay') closeAuth(); };
    $('#m-switch').onclick = function () { openAuth(su ? 'login' : 'signup'); };
    $('#auth-form').onsubmit = function (e) { e.preventDefault(); $('#m-note').innerHTML = '<p class="notice" role="alert">Accounts aren\'t available yet. Authentication is coming in a later phase, so nothing was submitted.</p>'; };
    var i = $('#auth-form input'); if (i) i.focus();
  }
  function closeAuth() { $('#modal').innerHTML = ''; }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAuth(); });

  function wire() {
    $('#year').textContent = new Date().getFullYear();
    document.querySelectorAll('[data-auth]').forEach(function (b) { b.onclick = function () { closeMenu(); openAuth(b.dataset.auth); }; });
    $('#menu-btn').onclick = function () { var o = $('#nav-links').classList.toggle('open'); this.setAttribute('aria-expanded', String(o)); };
    $('#search-toggle').onclick = function () { $('#search').classList.toggle('open'); $('#search-input').focus(); };
    $('#search').onsubmit = function (e) { e.preventDefault(); };
    $('#search-input').oninput = function () { query = this.value; if (query && location.hash.replace(/^#/, '') !== '' && location.hash !== '#/') location.hash = '#/'; else route(); };
    document.querySelectorAll('.nav-link, .footer-links a, .brand').forEach(function (a) { a.addEventListener('click', closeMenu); });
  }

  var minWait = new Promise(function (r) { setTimeout(r, 700); });
  Promise.all([getGames(), minWait]).then(function (r) {
    games = r[0]; wire(); route();
    $('#app').hidden = false; $('#loading').hidden = true;
  }).catch(function (e) { fail(e && e.message ? e.message : String(e)); });
})();
