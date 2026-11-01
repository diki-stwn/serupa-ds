/*! Serupa v__VERSION__ by Diki · debug.js */
/* Serupa debug overlay: shows which Serupa component drew what on a page, for finding why a screen looks off.
   Optional and standalone (no React, nothing else loads it). Load it on a page you're checking:

     <script src="node_modules/serupa-ds/dist/debug.js">   and the closing script tag

   It stays off until the page's address has ?serupa-debug (or &serupa-debug), or Serupa.debug.on() is called; the
   choice is kept for this tab (sessionStorage), so it survives a reload or a click to another page.
   While on:
     - every Serupa component (each element with data-component) has a dashed outline, except while it shows its own
       focus ring;
     - pointing at one draws its box and a panel with its name, its variant and size (the modifiers of its block class, such as dk-btn--primary), its state
       (data-state, aria-checked, aria-expanded, aria-selected, aria-invalid, disabled), its size in px, and the
       component tokens (--button-…, --input-…) that have a value on it, so a token your app overrides shows here;
     - Escape, or Serupa.debug.off(), turns it off.

   API (window.Serupa.debug):
     on()        turn it on, and keep it on for this tab
     off()       turn it off, and forget it for this tab
     toggle()    on if off, off if on
     isOn()      true while it's on
     inspect(el) what the panel shows for the Serupa component at or above el, as an object, or null */
(function () {
  if (window.Serupa && window.Serupa.debug) return;
  var KEY = "serupa-debug", PINK = "#db2777";
  var on = false, style = null, box = null, panel = null, current = null;
  // Each component's tokens, by prefix (button for Button), read once from the loaded style sheets.
  var tokenCache = {};

  function store(v) { try { if (v) sessionStorage.setItem(KEY, "1"); else sessionStorage.removeItem(KEY); } catch (e) { /* storage blocked */ } }
  function stored() { try { return sessionStorage.getItem(KEY) === "1"; } catch (e) { return false; } }

  // data-component is the kebab-case name (date-range-picker), which is also its tokens' prefix; kebab() covers a
  // component written as DateRangePicker too.
  function kebab(name) { return String(name).replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(); }

  function tokensFor(prefix) {
    if (tokenCache[prefix]) return tokenCache[prefix];
    var names = {}, re = new RegExp("--" + prefix + "-[a-z0-9-]+", "g");
    for (var i = 0; i < document.styleSheets.length; i++) {
      var text = "";
      try {
        var rules = document.styleSheets[i].cssRules;
        for (var j = 0; j < rules.length; j++) text += rules[j].cssText + "\n";
      } catch (e) { continue; } // a style sheet from another origin can't be read
      var m = text.match(re);
      if (m) for (var k = 0; k < m.length; k++) names[m[k]] = true;
    }
    return (tokenCache[prefix] = Object.keys(names).sort());
  }
  // The component tokens set in style attributes on el and above it: a style sheet the page can't read (another
  // origin, or a file:// page) hides its token names, but an override in a style attribute still shows.
  function inlineTokens(el, prefix) {
    var names = [];
    for (var n = el; n && n.style; n = n.parentElement) {
      for (var i = 0; i < n.style.length; i++) if (n.style[i].indexOf("--" + prefix + "-") === 0) names.push(n.style[i]);
    }
    return names;
  }

  function inspect(el) {
    var host = el && el.closest ? el.closest("[data-component]") : null;
    if (!host) return null;
    var name = host.getAttribute("data-component"), prefix = kebab(name);
    var classes = (host.getAttribute("class") || "").split(/\s+/);
    // Its block class (dk-btn for Button), then that block's modifiers: dk-btn--primary, dk-btn--size-md.
    var block = classes.filter(function (c) { return /^dk-[a-z0-9-]+$/.test(c) && c.indexOf("--") < 0; })[0];
    var modifiers = block ? classes.filter(function (c) { return c.indexOf(block + "--") === 0; }).map(function (c) { return c.slice(block.length + 2); }) : [];
    var state = {};
    ["data-state", "data-side", "aria-checked", "aria-expanded", "aria-selected", "aria-pressed", "aria-invalid", "aria-busy"].forEach(function (a) {
      var v = host.getAttribute(a);
      if (v != null) state[a] = v;
    });
    if (host.matches(":disabled, [aria-disabled='true']") || host.querySelector(":disabled")) state.disabled = "true";
    var computed = getComputedStyle(host), tokens = {};
    tokensFor(prefix).concat(inlineTokens(host, prefix)).forEach(function (t) {
      var v = computed.getPropertyValue(t).trim();
      if (v) tokens[t] = v;
    });
    var r = host.getBoundingClientRect();
    return { element: host, component: name, modifiers: modifiers, state: state, width: Math.round(r.width), height: Math.round(r.height), tokens: tokens };
  }

  function line(parent, label, value) {
    var row = document.createElement("div");
    var b = document.createElement("b");
    b.textContent = label + " ";
    row.appendChild(b);
    row.appendChild(document.createTextNode(value));
    parent.appendChild(row);
  }

  function show(info) {
    var r = info.element.getBoundingClientRect();
    box.style.cssText = "position:fixed;pointer-events:none;z-index:2147483646;border:2px solid " + PINK + ";background:rgba(219,39,119,.08);"
      + "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px;";
    panel.textContent = "";
    var title = document.createElement("div");
    title.style.cssText = "font-weight:700;font-size:13px;margin-bottom:4px";
    title.textContent = info.component;
    panel.appendChild(title);
    line(panel, "size", info.width + " × " + info.height + "px");
    if (info.modifiers.length) line(panel, "classes", info.modifiers.join(", "));
    Object.keys(info.state).forEach(function (k) { line(panel, k, info.state[k]); });
    var names = Object.keys(info.tokens);
    if (names.length) {
      line(panel, "tokens", "");
      names.slice(0, 12).forEach(function (t) { line(panel, "  " + t, info.tokens[t]); });
      if (names.length > 12) line(panel, "", "and " + (names.length - 12) + " more: Serupa.debug.inspect(el).tokens");
    }
    // Below the box, or above it when there's no room, and never past the window's edge.
    var below = r.bottom + 8, w = Math.min(360, innerWidth - 16);
    panel.style.cssText = "position:fixed;z-index:2147483647;pointer-events:none;max-width:" + w + "px;padding:8px 10px;border-radius:6px;"
      + "background:#18181b;color:#fafafa;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;box-shadow:0 4px 16px rgba(0,0,0,.3);"
      + "left:" + Math.max(8, Math.min(r.left, innerWidth - w - 8)) + "px;";
    var h = panel.offsetHeight;
    panel.style.top = (below + h < innerHeight ? below : Math.max(8, r.top - h - 8)) + "px";
  }

  function hide() { if (box) box.style.cssText = "display:none"; if (panel) panel.style.cssText = "display:none"; current = null; }

  function onMove(e) {
    var info = inspect(e.target);
    if (!info) return hide();
    current = info.element;
    show(info);
  }
  function onScroll() { if (current) { var info = inspect(current); if (info) show(info); } }
  function onKey(e) { if (e.key === "Escape" && on) api.off(); }

  var api = {
    on: function () {
      store(true);
      if (on) return;
      on = true;
      style = document.createElement("style");
      style.id = "serupa-debug";
      style.textContent = "[data-component]:not(:focus-visible){outline:1px dashed rgba(219,39,119,.7) !important;outline-offset:-1px !important}";
      document.head.appendChild(style);
      box = document.createElement("div");
      panel = document.createElement("div");
      panel.id = "serupa-debug-panel";
      box.setAttribute("aria-hidden", "true");
      hide();
      document.body.appendChild(box);
      document.body.appendChild(panel);
      document.addEventListener("mouseover", onMove, true);
      addEventListener("scroll", onScroll, true);
      addEventListener("resize", onScroll);
      document.addEventListener("keydown", onKey);
    },
    off: function () {
      store(false);
      if (!on) return;
      on = false;
      document.removeEventListener("mouseover", onMove, true);
      removeEventListener("scroll", onScroll, true);
      removeEventListener("resize", onScroll);
      document.removeEventListener("keydown", onKey);
      [style, box, panel].forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
      style = box = panel = current = null;
    },
    toggle: function () { if (on) api.off(); else api.on(); },
    isOn: function () { return on; },
    inspect: function (el) { var info = inspect(el); return info; }
  };
  window.Serupa = window.Serupa || {};
  window.Serupa.debug = api;

  function start() { if (/[?&]serupa-debug(=|&|$)/.test(location.search) || stored()) api.on(); }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
