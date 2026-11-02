"use client";

// src/components/CommandPalette/CommandPalette.tsx
import * as React from "react";
import { cn, domId, omit } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useSettings } from "../../internal/provider.js";
import { announce } from "../../internal/announce.js";
import { isComposing } from "../../internal/ime.js";
import { fold } from "../../internal/fold.js";
import { announcePause } from "../../internal/timing.js";
import { asIcon } from "../Icon/asIcon.js";
import { Dialog } from "../Dialog/Dialog.js";
import { Highlight } from "../Highlight/Highlight.js";
import { Kbd } from "../Kbd/Kbd.js";
import { useShortcut } from "../KeyboardShortcuts/KeyboardShortcuts.js";
import { en as words } from "./labels.js";
function score(c, q) {
  if (!q) return 1;
  const label = fold(c.label);
  if (label.startsWith(q)) return 4;
  const at = label.indexOf(q);
  if (at > 0 && /[\s\-_/.:]/.test(label[at - 1])) return 3;
  if (at > 0) return 2;
  return (c.keywords || []).some((k) => fold(k).includes(q)) ? 1 : 0;
}
var CommandPalette = /* @__PURE__ */ component("CommandPalette", function CommandPalette2(props, ref) {
  const sds = useSettings(words), labels = sds.labels;
  const rest = omit(props, { commands: 1, onSelect: 1, hotkey: 1, placeholder: 1, emptyText: 1, limit: 1, open: 1, defaultOpen: 1, onOpenChange: 1, className: 1, closeOnBackdrop: 1, finalFocus: 1 });
  const [own, setOwn] = React.useState(!!props.defaultOpen);
  const controlled = props.open != null;
  const open = controlled ? !!props.open : own;
  const { onOpenChange } = props;
  const change = React.useCallback((next, details) => {
    if (!controlled) setOwn(next);
    if (onOpenChange) onOpenChange(next, details);
  }, [onOpenChange, controlled]);
  const keys = props.hotkey === false ? null : props.hotkey && props.hotkey.length ? props.hotkey : ["mod", "K"];
  useShortcut(keys || [], () => change(true, { reason: "trigger" }), { description: labels.commandPalette, enabled: !!keys && !open });
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const [was, setWas] = React.useState(open);
  if (was !== open) {
    setWas(open);
    if (open) {
      setQuery("");
      setActive(0);
    }
  }
  const q = fold(query.trim());
  const { commands, limit } = props;
  const rows = React.useMemo(() => {
    const all = commands.map((c, i) => ({ c, i, s: score(c, q) })).filter((r) => r.s > 0);
    if (!q) return all;
    return all.sort((a, b) => b.s - a.s || a.i - b.i).slice(0, limit && limit > 0 ? limit : 50);
  }, [commands, q, limit]);
  const groups = React.useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const r of rows) {
      const g = r.c.group || labels.otherCommands;
      m.set(g, (m.get(g) || []).concat(r));
    }
    return [...m];
  }, [rows, labels.otherCommands]);
  const usable = groups.flatMap(([, rs]) => rs).filter((r) => !r.c.disabled);
  const current = usable.length ? usable[Math.min(active, usable.length - 1)] : null;
  const base = domId("dk-cmdk", React.useId());
  const optId = (r) => base + "-opt-" + r.i;
  const list = React.useRef(null);
  const field = React.useRef(null);
  const currentId = current ? optId(current) : null;
  React.useEffect(() => {
    if (!open || !currentId || !list.current) return;
    const el = list.current.querySelector("#" + currentId);
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
  }, [open, currentId]);
  const empty = typeof props.emptyText === "string" ? props.emptyText : labels.noCommands;
  const said = !query.trim() ? "" : usable.length ? labels.commandsCount(usable.length) : empty;
  React.useEffect(() => {
    if (!open || !said) return;
    const t = setTimeout(() => announce(said), announcePause);
    return () => clearTimeout(t);
  }, [open, said, query]);
  const [chosen, setChosen] = React.useState(null);
  const done = React.useRef(props.onSelect);
  done.current = props.onSelect;
  React.useEffect(() => {
    if (!chosen) return;
    setChosen(null);
    const c = chosen.c;
    if (c.onSelect) c.onSelect();
    else if (c.href && typeof window !== "undefined") window.location.assign(c.href);
    if (done.current) done.current(c);
  }, [chosen]);
  const choose = (r) => {
    if (!r || r.c.disabled) return;
    change(false, { reason: "select" });
    setChosen({ c: r.c });
  };
  const move = (to) => {
    if (usable.length) setActive((to + usable.length) % usable.length);
  };
  const at = current ? usable.indexOf(current) : 0;
  const onKeyDown = (e) => {
    if (isComposing(e)) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(at + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(at - 1);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      move(usable.length - 1);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      move(0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(current);
    }
  };
  return /* @__PURE__ */ React.createElement(
    Dialog,
    {
      ...rest,
      ref,
      className: cn("dk-command-palette", props.className),
      "aria-label": rest["aria-label"] || labels.commandPalette,
      open,
      onOpenChange: change,
      closeButton: false,
      initialFocus: field,
      closeOnBackdrop: props.closeOnBackdrop,
      finalFocus: props.finalFocus
    },
    /* @__PURE__ */ React.createElement(
      "input",
      {
        ref: field,
        className: "dk-command-palette__field",
        type: "text",
        role: "combobox",
        "aria-expanded": "true",
        "aria-controls": base + "-list",
        "aria-autocomplete": "list",
        "aria-activedescendant": currentId || void 0,
        "aria-label": props.placeholder || labels.searchCommands,
        placeholder: props.placeholder || labels.searchCommands,
        autoComplete: "off",
        autoCorrect: "off",
        autoCapitalize: "off",
        spellCheck: false,
        value: query,
        onChange: (e) => {
          setQuery(e.currentTarget.value);
          setActive(0);
        },
        onKeyDown
      }
    ),
    /* @__PURE__ */ React.createElement("div", { ref: list, id: base + "-list", role: "listbox", "aria-label": labels.commandPalette, className: "dk-command-palette__list" }, groups.map(([name, rs], g) => /* @__PURE__ */ React.createElement("div", { key: name, role: "group", "aria-labelledby": base + "-g" + g, className: "dk-command-palette__group" }, /* @__PURE__ */ React.createElement("div", { id: base + "-g" + g, role: "presentation", className: "dk-command-palette__heading" }, name), rs.map((r) => {
      const on = current === r;
      return (
        // Focus stays in the field (a press doesn't take it); an option focused some other way, as a screen
        // reader can, is chosen with Enter or Space.
        /* @__PURE__ */ React.createElement(
          "div",
          {
            key: r.c.id,
            id: optId(r),
            role: "option",
            tabIndex: -1,
            "aria-selected": on,
            "aria-disabled": r.c.disabled || void 0,
            className: cn("dk-command-palette__option", on && "dk-command-palette__option--active", r.c.disabled && "dk-command-palette__option--disabled"),
            onMouseDown: (e) => e.preventDefault(),
            onMouseMove: () => {
              if (!r.c.disabled && !on) setActive(usable.indexOf(r));
            },
            onClick: () => choose(r),
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                choose(r);
              }
            }
          },
          r.c.icon != null ? /* @__PURE__ */ React.createElement("span", { className: "dk-command-palette__icon", "aria-hidden": true }, asIcon(r.c.icon)) : null,
          /* @__PURE__ */ React.createElement(Highlight, { className: "dk-command-palette__label", query }, r.c.label),
          r.c.shortcut && r.c.shortcut.length ? /* @__PURE__ */ React.createElement(Kbd, { className: "dk-command-palette__keys", keys: r.c.shortcut, size: "sm" }) : null
        )
      );
    })))),
    !usable.length && query.trim() ? /* @__PURE__ */ React.createElement("p", { className: "dk-command-palette__empty" }, props.emptyText != null ? props.emptyText : labels.noCommands) : null
  );
});
export {
  CommandPalette
};
//# sourceMappingURL=CommandPalette.js.map
