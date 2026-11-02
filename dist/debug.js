/*! Serupa v13.0.0 by Diki · debug.js */
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
     - the color pairs Serupa draws (text on each surface, button text, field borders, the focus ring …) are checked
       against WCAG 2.2 where they are, so a color token your app overrides can't quietly fail contrast: the ones
       that fail on the page are listed in the console when it turns on, and the panel lists any more that fail on
       the component you point at (from a token set on it, or on a section or card around it);
     - Escape, or Serupa.debug.off(), turns it off.

   API (window.Serupa.debug):
     on()        turn it on, and keep it on for this tab
     off()       turn it off, and forget it for this tab
     toggle()    on if off, off if on
     isOn()      true while it's on
     inspect(el) what the panel shows for the Serupa component at or above el, as an object, or null
     contrast(el) each color pair as drawn at el (default: the page), with its ratio and the ratio it needs */
(function () {
  if (window.Serupa && window.Serupa.debug) return;
  var KEY = "serupa-debug", PINK = "#db2777";
  var on = false, style = null, box = null, panel = null, current = null;
  // The pairs that fail on the page itself, named in the console when it turns on, so the panel doesn't repeat them.
  var pageLow = {};
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

  // The color pairs Serupa puts on screen, each [foreground, background, ratio it needs, what it is]: the build
  // writes them here from tools/tokens/contrast-pairs.mjs, the list tools/test/foundation.mjs checks in each theme.
  var PAIRS = [["text","surface",4.5,"Body text"],["text","surface-muted",4.5,"Body text on a muted surface"],["text","surface-raised",4.5,"Body text on a raised card"],["text","surface-overlay",4.5,"Body text in a popover or dialog"],["text-muted","surface",4.5,"Muted text"],["text-muted","surface-muted",4.5,"Muted text on a muted surface"],["text-muted","surface-raised",4.5,"Muted text on a raised card"],["text-muted","surface-overlay",4.5,"Muted text in a popover or dialog"],["text-inverse","surface-inverse",4.5,"Text on an inverse surface (Tooltip)"],["text","secondary",4.5,"Secondary button text"],["text","secondary-hover",4.5,"Secondary button text on hover"],["text","pressed",4.5,"Text on a pressed control"],["text","field",4.5,"Text in a field"],["placeholder","field",4.5,"Placeholder in a field"],["text","primary-subtle",4.5,"Text on a selected row"],["on-primary","primary",4.5,"Primary button text"],["on-primary","primary-hover",4.5,"Primary button text on hover"],["primary","surface",4.5,"Brand text, links and icons, and the secondary button"],["link-visited","surface",4.5,"A visited link (Prose)"],["link-visited","surface-muted",4.5,"A visited link on a muted surface (Prose)"],["primary-hover","primary-subtle",4.5,"Brand text on hover, on its tint"],["on-danger","danger",4.5,"Danger button text"],["on-danger","danger-hover",4.5,"Danger button text on hover"],["danger-text","surface",4.5,"Error text"],["danger-text","surface-muted",4.5,"Error text on a muted surface"],["danger-text","surface-overlay",4.5,"Error text in a popover or dialog"],["danger-text","danger-subtle",4.5,"Error text on its tint (Alert)"],["success-text","surface",4.5,"Success text"],["success-text","surface-muted",4.5,"Success text on a muted surface"],["success-text","success-subtle",4.5,"Success text on its tint"],["warning-text","surface",4.5,"Warning text"],["warning-text","surface-muted",4.5,"Warning text on a muted surface"],["warning-text","warning-subtle",4.5,"Warning text on its tint"],["info-text","surface",4.5,"Info text"],["info-text","surface-muted",4.5,"Info text on a muted surface"],["info-text","info-subtle",4.5,"Info text on its tint"],["info","surface",4.5,"Info icon"],["primary","surface-overlay",3,"Brand icons in a popover or dialog"],["danger","surface",3,"Destructive secondary button border"],["field-border","field",3,"Field border"],["field-border","surface",3,"Field border on the page"],["focus-ring","surface",3,"Focus ring"],["focus-ring","surface-overlay",3,"Focus ring in a popover or dialog"]];
  var probe = null, ctx = null;
  // A token's color at el as sRGB, drawn over `under` (and white, under everything), so a translucent color counts
  // as it looks. A custom property's computed value has its var()s filled in, so it holds up on its own.
  function paint(value, under) {
    if (!ctx) {
      var canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      ctx = canvas.getContext("2d", { willReadFrequently: true });
      probe = document.createElement("span");
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    }
    document.body.appendChild(probe);
    probe.style.color = "rgb(0, 0, 0)";
    probe.style.color = value;
    var css = getComputedStyle(probe).color;
    probe.parentNode.removeChild(probe);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 1, 1);
    if (under) { ctx.fillStyle = "rgb(" + under.join(",") + ")"; ctx.fillRect(0, 0, 1, 1); }
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    var d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  }
  function luminance(c) {
    var v = c.map(function (x) { x /= 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function contrast(el) {
    el = el || document.documentElement;
    var computed = getComputedStyle(el), out = [];
    PAIRS.forEach(function (p) {
      var fg = computed.getPropertyValue("--" + p[0]).trim(), bg = computed.getPropertyValue("--" + p[1]).trim();
      if (!fg || !bg) return;
      var back = paint(bg), a = luminance(paint(fg, back)), b = luminance(back);
      var ratio = Math.round((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) * 100) / 100;
      out.push({ foreground: "--" + p[0], background: "--" + p[1], ratio: ratio, needs: p[2], what: p[3], ok: ratio >= p[2] });
    });
    return out;
  }
  function failing(list) { return list.filter(function (r) { return !r.ok; }); }

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
    return { element: host, component: name, modifiers: modifiers, state: state, width: Math.round(r.width), height: Math.round(r.height), tokens: tokens, lowContrast: failing(contrast(host)) };
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
    // Only what fails here and not on the whole page: a token set on this component or around it.
    var low = info.lowContrast.filter(function (c) { return !pageLow[c.foreground + " " + c.background]; });
    low.slice(0, 4).forEach(function (c, i) {
      line(panel, i ? "" : "low contrast", c.foreground + " on " + c.background + " " + c.ratio + ":1, needs " + c.needs + ":1 (" + c.what + ")");
    });
    if (low.length > 4) line(panel, "", "and " + (low.length - 4) + " more: Serupa.debug.contrast(el)");
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
      var low = failing(contrast());
      pageLow = {};
      low.forEach(function (c) { pageLow[c.foreground + " " + c.background] = true; });
      if (low.length && window.console) {
        console.warn("Serupa debug: " + low.length + " color pair" + (low.length > 1 ? "s" : "") + " on this page fail WCAG contrast, most likely from a color token your app sets:\n"
          + low.map(function (c) { return "  " + c.foreground + " on " + c.background + ": " + c.ratio + ":1, needs " + c.needs + ":1 (" + c.what + ")"; }).join("\n"));
      }
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
    inspect: function (el) { var info = inspect(el); return info; },
    contrast: function (el) { return contrast(el); }
  };
  window.Serupa = window.Serupa || {};
  window.Serupa.debug = api;

  function start() { if (/[?&]serupa-debug(=|&|$)/.test(location.search) || stored()) api.on(); }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
