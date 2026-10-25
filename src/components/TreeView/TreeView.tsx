"use client";
import * as React from "react";
import { cn, omit, setRef, useIsoLayoutEffect } from "../../internal/cn";
import { component } from "../../internal/component";
import { isComposing } from "../../internal/ime";
import { typeahead, type Typed } from "../../internal/typeahead";
import { Icon, type IconSource } from "../Icon/Icon";
import { asIcon } from "../Icon/asIcon";
import * as icons from "../../material/builtin";

export interface TreeViewItem {
  /** Identifies the item in value and expanded. Unique in the whole tree. */
  id: string;
  /** What the row shows. */
  label: React.ReactNode;
  /** The text typing finds it by, when label isn't a string. Default: label. */
  textValue?: string;
  /** An icon before the label, such as a folder or a file. */
  icon?: IconSource;
  /** The items inside it. An item with children (even an empty array) can open and close. */
  children?: TreeViewItem[];
  /** Can be focused and read, but not picked, opened or closed. */
  disabled?: boolean;
}

export interface TreeViewProps extends Omit<React.HTMLAttributes<HTMLUListElement>, "defaultValue" | "onChange"> {
  /** The items at the top level, each with its own children. */
  items: TreeViewItem[];
  /** 'single' (default): one item is picked at a time. 'multiple': any number, toggled with Space or a click. 'none': items are only opened and closed. */
  selectionMode?: 'single' | 'multiple' | 'none';
  /** The picked items' ids (controlled). Use with onValueChange. */
  value?: string[];
  /** The picked items' ids at first (uncontrolled). */
  defaultValue?: string[];
  /** Called with the picked items' ids when they change. */
  onValueChange?: (value: string[]) => void;
  /** The open items' ids (controlled). Use with onExpandedChange. */
  expanded?: string[];
  /** The open items' ids at first (uncontrolled). */
  defaultExpanded?: string[];
  /** Called with the open items' ids when one opens or closes. */
  onExpandedChange?: (expanded: string[]) => void;
  /** What the tree holds ("Files"). Needed, unless aria-labelledby names it. */
  "aria-label"?: string;
}

interface Row { item: TreeViewItem; level: number; parent: string | null }

const textOf = (it: TreeViewItem) => it.textValue ?? (typeof it.label === "string" || typeof it.label === "number" ? String(it.label) : "");
const opens = (it: TreeViewItem) => it.children !== undefined;
const within = (item: TreeViewItem, id: string): boolean => !!item.children && item.children.some((c) => c.id === id || within(c, id));

/* TreeView: nested items that open and close, such as folders and files or a table of contents. Follows the
   WAI-ARIA tree pattern: a role="tree" list of role="treeitem"s with one Tab stop (the item used last, or else
   the first picked or first item). Up and Down move through the items in view, Right opens an item and then
   goes into it, Left closes it and then goes out to its parent (both mirrored right to left), Home and End go
   to the ends, * opens every sibling, and typing goes to the next item starting with what was typed. Enter,
   Space or a click picks; with selectionMode="multiple" they toggle, Shift with the arrows picks as it moves,
   Shift+Space or Shift+click picks a range, and Ctrl+A picks every item in view. Closed items' children aren't
   in the page. */
/** Nested items that open and close, such as folders and files, with one item or many picked. */
export const TreeView = /* @__PURE__ */ component<HTMLUListElement, TreeViewProps>("TreeView", function TreeView(props, ref) {
  const rest = omit(props, { items: 1, selectionMode: 1, value: 1, defaultValue: 1, onValueChange: 1, expanded: 1, defaultExpanded: 1, onExpandedChange: 1, className: 1, onKeyDown: 1 });
  const mode = props.selectionMode || "single";
  const multi = mode === "multiple";
  const [ownValue, setOwnValue] = React.useState<string[]>(props.defaultValue || []);
  const value = props.value !== undefined ? props.value : ownValue;
  const [ownOpen, setOwnOpen] = React.useState<string[]>(props.defaultExpanded || []);
  const open = props.expanded !== undefined ? props.expanded : ownOpen;
  const root = React.useRef<HTMLUListElement | null>(null);
  const typed = React.useRef<Typed>({ text: "", at: 0 });
  const anchor = React.useRef<string | null>(null);   // where a Shift range starts
  const [focusId, setFocusId] = React.useState<string | null>(null);
  const moveFocus = React.useRef(false);

  // The items in view, in order: the top level, and the children of every open item.
  const rows = React.useMemo(() => {
    const out: Row[] = [];
    const isOpen = new Set(open);
    const walk = (list: TreeViewItem[], level: number, parent: string | null) => list.forEach((item) => {
      out.push({ item, level, parent });
      if (item.children && isOpen.has(item.id)) walk(item.children, level + 1, item.id);
    });
    walk(props.items, 1, null);
    return out;
  }, [props.items, open]);
  const index = (id: string | null) => id == null ? -1 : rows.findIndex((r) => r.item.id === id);
  // The Tab stop: the item focused last while it's in view, else the first picked one in view, else the first.
  const firstPicked = rows.find((r) => value.indexOf(r.item.id) >= 0);
  const tabStop = index(focusId) >= 0 ? focusId : firstPicked ? firstPicked.item.id : rows.length ? rows[0].item.id : null;

  useIsoLayoutEffect(function () {
    if (!moveFocus.current || !root.current) return;
    moveFocus.current = false;
    const el = Array.from(root.current.querySelectorAll<HTMLElement>("[role=treeitem]")).find((e) => e.dataset.id === focusId);
    if (el) el.focus();
  }, [focusId, rows]);
  const go = (id: string) => { moveFocus.current = true; setFocusId(id); };

  const pick = (next: string[]) => {
    if (props.value === undefined) setOwnValue(next);
    if (props.onValueChange) props.onValueChange(next);
  };
  const setOpen = (next: string[]) => {
    if (props.expanded === undefined) setOwnOpen(next);
    if (props.onExpandedChange) props.onExpandedChange(next);
  };
  const toggleOpen = (item: TreeViewItem) => {
    if (item.disabled || !opens(item)) return;
    const was = open.indexOf(item.id) >= 0;
    setOpen(was ? open.filter((x) => x !== item.id) : open.concat(item.id));
    // Closing an item that holds the focused one brings focus up to it.
    if (was && focusId && within(item, focusId)) go(item.id);
  };
  const choose = (item: TreeViewItem, range = false) => {
    if (item.disabled || mode === "none") return;
    const id = item.id;
    if (!multi) { if (value.length !== 1 || value[0] !== id) pick([id]); anchor.current = id; return; }
    const a = index(anchor.current);
    if (range && a >= 0) {
      const b = index(id);
      const span = rows.slice(Math.min(a, b), Math.max(a, b) + 1).filter((x) => !x.item.disabled).map((x) => x.item.id);
      pick(value.filter((v) => span.indexOf(v) < 0).concat(span));
      return;
    }
    pick(value.indexOf(id) >= 0 ? value.filter((v) => v !== id) : value.concat(id));
    anchor.current = id;
  };

  // Your onKeyDown runs first, so preventDefault() in it keeps the tree from acting on that key.
  const onKeyDown = function (e: React.KeyboardEvent<HTMLUListElement>) {
    if (props.onKeyDown) props.onKeyDown(e);
    const t = e.target instanceof HTMLElement ? e.target.closest<HTMLElement>("[role=treeitem]") : null;
    if (e.defaultPrevented || !t || !root.current || e.altKey || isComposing(e)) return;
    const i = index(t.dataset.id || null);
    if (i < 0) return;
    const r = rows[i], item = r.item;
    const rtl = getComputedStyle(root.current).direction === "rtl";
    const isOpen = open.indexOf(item.id) >= 0;
    let to = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      to = Math.min(rows.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)));
      if (multi && e.shiftKey && to !== i) choose(rows[to].item);
    }
    else if (e.key === (rtl ? "ArrowLeft" : "ArrowRight")) {
      if (opens(item) && !isOpen) toggleOpen(item);
      else if (isOpen && item.children && item.children.length) to = i + 1;
    }
    else if (e.key === (rtl ? "ArrowRight" : "ArrowLeft")) {
      if (isOpen && !item.disabled) toggleOpen(item);
      else if (r.parent != null) to = index(r.parent);
    }
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = rows.length - 1;
    else if (e.key === "Enter" || e.key === " ") {
      if (mode === "none") toggleOpen(item); else choose(item, multi && e.shiftKey);
    }
    else if (e.key === "*") {
      const shut = rows.filter((x) => x.parent === r.parent && opens(x.item) && !x.item.disabled && open.indexOf(x.item.id) < 0);
      if (shut.length) setOpen(open.concat(shut.map((x) => x.item.id)));
    }
    else if (multi && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") pick(rows.filter((x) => !x.item.disabled).map((x) => x.item.id));
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) to = typeahead(typed.current, e.key, rows.map((x) => textOf(x.item)), i);
    else return;
    e.preventDefault();
    if (to >= 0 && to !== i) go(rows[to].item.id);
  };

  const render = (list: TreeViewItem[], level: number): React.ReactNode => list.map((item, n) => {
    const isOpen = opens(item) && open.indexOf(item.id) >= 0;
    const picked = value.indexOf(item.id) >= 0;
    const icon = item.icon != null ? asIcon(item.icon) : null;
    return (
      <li key={item.id} role="treeitem" data-id={item.id} tabIndex={item.id === tabStop ? 0 : -1}
        aria-level={level} aria-posinset={n + 1} aria-setsize={list.length}
        aria-expanded={opens(item) ? isOpen : undefined}
        aria-selected={mode === "none" ? undefined : multi ? picked : picked || undefined}
        aria-disabled={item.disabled || undefined}
        className={cn("dk-tree-view__item", picked && "dk-tree-view__item--selected", item.disabled && "dk-tree-view__item--disabled")}
        onFocus={(e) => { if (e.target === e.currentTarget && focusId !== item.id) setFocusId(item.id); }}>
        <div className="dk-tree-view__row" style={{ "--dk-tree-level": level - 1 } as React.CSSProperties}
          onClick={(e) => { setFocusId(item.id); if (mode === "none") toggleOpen(item); else choose(item, multi && e.shiftKey); }}>
          <span className="dk-tree-view__toggle" aria-hidden="true"
            onClick={opens(item) ? (e) => { e.stopPropagation(); setFocusId(item.id); toggleOpen(item); } : undefined}>
            {opens(item) ? <Icon icon={icons.ChevronRight} /> : null}
          </span>
          {icon != null ? <span className="dk-tree-view__icon" aria-hidden="true">{icon}</span> : null}
          <span className="dk-tree-view__label">{item.label}</span>
        </div>
        {isOpen && item.children && item.children.length ? <ul role="group" className="dk-tree-view__group">{render(item.children, level + 1)}</ul> : null}
      </li>
    );
  });

  return (
    <ul {...rest} ref={function (n) { root.current = n; setRef(ref, n); }} role="tree"
      aria-multiselectable={multi || undefined}
      className={cn("dk-tree-view", props.className)} data-component="tree-view" onKeyDown={onKeyDown}>
      {render(props.items, 1)}
    </ul>
  );
});
