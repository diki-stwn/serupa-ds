/*! Serupa v13.0.0 by Diki · theme.js */
/* Serupa theme: picks the theme for a page and keeps it in step with the visitor's light/dark setting.
   Optional and standalone (no React). Load it in <head>, before the stylesheets, so the first paint
   already has the right theme:

     <html data-brand="blue" data-mode="auto">
     <script src="node_modules/serupa-ds/dist/theme.js">   and the closing script tag

   Or paste this file's text into an inline script in <head> (with a nonce under a strict Content Security
   Policy), which saves a request: a server-rendered page then never flashes the wrong theme. So this file
   never contains a closing script tag or an HTML comment opener, either of which would end or break it.

   data-brand  blue | violet | emerald         (default: blue)
   data-mode   auto | light | dark             (default: auto = follow the operating system)
   A page with only data-theme="violet-dark" (no data-brand or data-mode) keeps that theme as its default.
   It sets data-theme (e.g. "blue-dark"), which tokens.css reads. A choice made with
   Serupa.theme.set() is remembered in this browser; without the script, set data-theme yourself.

   API (window.Serupa.theme):
     get()                       -> { brand, mode, theme }   mode is what was asked for (auto/light/dark)
     set({ brand?, mode? })      change and remember the choice
     reset()                     forget the choice and go back to the page's data-brand / data-mode
     onChange(fn)                fn({ brand, mode, theme }) after every change; returns an unsubscribe function */
(function () {
  // Loaded twice (inline and as a file): the first copy runs the page.
  if (window.Serupa && window.Serupa.theme) return;
  var BRANDS = ["blue", "violet", "emerald"], MODES = ["auto", "light", "dark"], KEY = "serupa-theme";
  var root = document.documentElement;
  var own = !root.hasAttribute("data-brand") && !root.hasAttribute("data-mode") && /^([a-z]+)-(light|dark)$/.exec(root.getAttribute("data-theme") || "");
  var page = own && BRANDS.indexOf(own[1]) >= 0 ? { brand: own[1], mode: own[2] }
    : { brand: pick(root.getAttribute("data-brand"), BRANDS, "blue"), mode: pick(root.getAttribute("data-mode"), MODES, "auto") };
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var listeners = [];
  var state = Object.assign({}, page, load());

  function pick(v, list, fallback) { return list.indexOf(v) >= 0 ? v : fallback; }
  function load() {
    try {
      // A 4.x choice ("diki-theme") moves to the new key once: kept, and reset() forgets it for good.
      var raw = localStorage.getItem(KEY);
      if (raw == null && (raw = localStorage.getItem("diki-theme")) != null) {
        localStorage.setItem(KEY, raw);
        localStorage.removeItem("diki-theme");
      }
      var s = JSON.parse(raw || "null");
      if (!s) return {};
      var o = {};
      if (BRANDS.indexOf(s.brand) >= 0) o.brand = s.brand;
      if (MODES.indexOf(s.mode) >= 0) o.mode = s.mode;
      return o;
    } catch (e) { return {}; }   // storage blocked: the page's defaults
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ brand: state.brand, mode: state.mode })); } catch (e) {} }
  function resolved() { return state.mode === "auto" ? (media && media.matches ? "dark" : "light") : state.mode; }
  function info() { return { brand: state.brand, mode: state.mode, theme: state.brand + "-" + resolved() }; }
  // <meta name="theme-color"> (a phone's bars) is the body's surface, or the token value before the CSS; a page's own stays.
  var tint;
  function chrome() {
    if (!tint) {
      if (document.querySelector('meta[name="theme-color"]')) return;
      tint = document.head.appendChild(document.createElement("meta"));
      tint.name = "theme-color";
    }
    var b = document.body ? getComputedStyle(document.body).backgroundColor : "";
    tint.content = /\d/.test(b) && !/, 0\)$/.test(b) ? b : resolved() === "dark" ? "#18181b" : "#fff";
  }
  function apply(always) {
    var i = info();
    if (root.getAttribute("data-theme") === i.theme && !always) return chrome();
    root.setAttribute("data-theme", i.theme);
    root.getAnimations({ subtree: true }).forEach(function (a) { if (/color|shadow|fill|stroke/.test(a.transitionProperty)) a.finish(); });
    chrome();
    listeners.slice().forEach(function (fn) { try { fn(i); } catch (e) { if (window.console) console.error(e); } });
  }

  if (media) {
    var onScheme = function () { if (state.mode === "auto") apply(); };
    if (media.addEventListener) media.addEventListener("change", onScheme); else if (media.addListener) media.addListener(onScheme);
  }
  // Another tab changed the choice, or cleared storage (key null): follow it. Back from the back/forward cache, that
  // storage event may not have reached this page (browsers differ): read the choice again.
  function follow(e) {
    var was = state.brand + state.mode;
    state = Object.assign({}, page, load());
    if (e.type === "storage" || was !== state.brand + state.mode) apply(true);
  }
  window.addEventListener("storage", function (e) { if (e.key === KEY || e.key === null) follow(e); });
  window.addEventListener("pageshow", function (e) { if (e.persisted) follow(e); });

  var api = {
    get: info,
    set: function (o) {
      o = o || {};
      if (o.brand != null) state.brand = pick(o.brand, BRANDS, state.brand);
      if (o.mode != null) state.mode = pick(o.mode, MODES, state.mode);
      save(); apply(true);
      return info();
    },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} state = Object.assign({}, page); apply(true); return info(); },
    onChange: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; }
  };
  window.addEventListener("load", chrome);
  window.Serupa = window.Serupa || {};
  window.Serupa.theme = api;
  if (!window.Serupa.version) window.Serupa.version = "13.0.0";
  apply();
})();
