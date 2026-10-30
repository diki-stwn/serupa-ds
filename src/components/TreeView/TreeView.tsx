"use client";
import * as React from "react";
import { cn, omit, setRef, useIsoLayoutEffect } from "../../internal/cn";
import { NAME_HOW, useNameCheck } from "../../internal/nameCheck";
import { component } from "../../internal/component";
import { isComposing } from "../../internal/ime";
import { typeahead, typing, type Typed } from "../../internal/typeahead";
import { Icon, type IconSource } from "../Icon/Icon";
import { useServerStyles } from "../../internal/serverStyles";
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

/* What the rows read: open and picked ids as Sets, the Tab stop and the mode. Each row subscribes to its own part
   (open, picked, Tab stop), so a focus move or a pick redraws the rows it changes, not every row in view. */
interface Store { open: Set<string>; value: Set<string>; tab: string | null; mode: string; listeners: Set<() => void> }
interface Api { focus: (id: string) => void; press: (item: TreeViewItem, e: React.MouseEvent) => void; toggle: (item: TreeViewItem) => void }
const TreeContext = /* @__PURE__ */ React.createContext<{ store: Store; api: React.RefObject<Api> } | null>(null);

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
  const nameRef = useNameCheck("TreeView", NAME_HOW.label);   // warns when it has no accessible name
  const rest = omit(props, { items: 1, selectionMode: 1, value: 1, defaultValue: 1, onValueChange: 1, expanded: 1, defaultExpanded: 1, onExpandedChange: 1, className: 1, onKeyDown: 1 });
  const mode = props.selectionMode || "single";
  const multi = mode === "multiple";
  const [ownValue, setOwnValue] = React.useState<string[]>(props.defaultValue || []);
  const value = props.value !== undefined ? props.value : ownValue;
  const [ownOpen, setOwnOpen] = React.useState<string[]>(props.defaultExpanded || []);
  const open = props.expanded !== undefined ? props.expanded : ownOpen;
  const root = React.useRef<HTMLUListElement | null>(null);
  const styled = useServerStyles<HTMLUListElement>();   // each row's level, from server HTML under a strict CSP (GR11)
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
  const openSet = React.useMemo(() => new Set(open), [open]);
  const valueSet = React.useMemo(() => new Set(value), [value]);
  // The Tab stop: the item focused last while it's in view, else the first picked one in view, else the first.
  const firstPicked = rows.find((r) => valueSet.has(r.item.id));
  const tabStop = index(focusId) >= 0 ? focusId : firstPicked ? firstPicked.item.id : rows.length ? rows[0].item.id : null;

  useIsoLayoutEffect(function () {
    if (!moveFocus.current || !root.current) return;
    moveFocus.current = false;
    const el = focusId == null ? null : root.current.querySelector<HTMLElement>('[role=treeitem][data-id="' + CSS.escape(focusId) + '"]');
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
    const was = openSet.has(item.id);
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
      const inSpan = new Set(span);
      pick(value.filter((v) => !inSpan.has(v)).concat(span));
      return;
    }
    pick(valueSet.has(id) ? value.filter((v) => v !== id) : value.concat(id));
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
    const isOpen = openSet.has(item.id);
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
    // Space while a word is being typed is part of it ("my files"), so it goes to typeahead below.
    else if (e.key === "Enter" || (e.key === " " && !typing(typed.current))) {
      if (mode === "none") toggleOpen(item); else choose(item, multi && e.shiftKey);
    }
    else if (e.key === "*") {
      const shut = rows.filter((x) => x.parent === r.parent && opens(x.item) && !x.item.disabled && !openSet.has(x.item.id));
      if (shut.length) setOpen(open.concat(shut.map((x) => x.item.id)));
    }
    else if (multi && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") pick(rows.filter((x) => !x.item.disabled).map((x) => x.item.id));
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) to = typeahead(typed.current, e.key, rows.map((x) => textOf(x.item)), i);
    else return;
    e.preventDefault();
    if (to >= 0 && to !== i) go(rows[to].item.id);
  };

  // The rows read this through context, so none of them redraws because the tree did; see TreeRow.
  const store = React.useRef<Store | null>(null);
  if (!store.current) store.current = { open: openSet, value: valueSet, tab: tabStop, mode, listeners: new Set() };
  const st = store.current;
  st.open = openSet; st.value = valueSet; st.tab = tabStop; st.mode = mode;
  useIsoLayoutEffect(function () { st.listeners.forEach((l) => l()); }, [openSet, valueSet, tabStop, mode]);
  const api = React.useRef<Api>({ focus: () => {}, press: () => {}, toggle: () => {} });
  api.current = {
    focus: (id) => { if (focusId !== id) setFocusId(id); },
    press: (item, e) => { setFocusId(item.id); if (mode === "none") toggleOpen(item); else choose(item, multi && e.shiftKey); },
    toggle: (item) => { setFocusId(item.id); toggleOpen(item); },
  };
  const ctx = React.useMemo(() => ({ store: st, api: api }), [st]);

  return (
    <ul {...rest} ref={function (n) { root.current = n; nameRef(n); styled(n); setRef(ref, n); }} role="tree"
      aria-multiselectable={multi || undefined}
      className={cn("dk-tree-view", props.className)} data-component="tree-view" onKeyDown={onKeyDown}>
      <TreeContext.Provider value={ctx}><Rows list={props.items} level={1} /></TreeContext.Provider>
    </ul>
  );
});

const Rows = /* @__PURE__ */ React.memo(function Rows(props: { list: TreeViewItem[]; level: number }) {
  return <>{props.list.map((item, n) => <TreeRow key={item.id} item={item} level={props.level} pos={n + 1} size={props.list.length} />)}</>;
});

/* One treeitem and, while it's open, its children. Memoised on the item and its place, and subscribed to just its
   own open, picked and Tab-stop state, so a change elsewhere in the tree leaves it alone. */
const TreeRow = /* @__PURE__ */ React.memo(function TreeRow(props: { item: TreeViewItem; level: number; pos: number; size: number }) {
  const { store, api } = React.useContext(TreeContext)!;
  const { item, level } = props, id = item.id;
  const subscribe = React.useCallback((l: () => void) => { store.listeners.add(l); return () => { store.listeners.delete(l); }; }, [store]);
  // One string, so React compares a primitive: open, picked, Tab stop, mode.
  const snap = () => (store.open.has(id) ? "o" : "-") + (store.value.has(id) ? "p" : "-") + (store.tab === id ? "t" : "-") + store.mode;
  const key = React.useSyncExternalStore(subscribe, snap, snap);
  const canOpen = opens(item), isOpen = canOpen && key[0] === "o", picked = key[1] === "p", mode = key.slice(3);
  const icon = item.icon != null ? asIcon(item.icon) : null;
  return (
    <li role="treeitem" data-id={id} tabIndex={key[2] === "t" ? 0 : -1}
      aria-level={level} aria-posinset={props.pos} aria-setsize={props.size}
      aria-expanded={canOpen ? isOpen : undefined}
      aria-selected={mode === "none" ? undefined : mode === "multiple" ? picked : picked || undefined}
      aria-disabled={item.disabled || undefined}
      className={cn("dk-tree-view__item", picked && "dk-tree-view__item--selected", item.disabled && "dk-tree-view__item--disabled")}
      onFocus={(e) => { if (e.target === e.currentTarget) api.current.focus(id); }}>
      <div className="dk-tree-view__row" style={{ "--dk-tree-level": level - 1 } as React.CSSProperties}
        onClick={(e) => api.current.press(item, e)}>
        <span className="dk-tree-view__toggle" aria-hidden="true"
          onClick={canOpen ? (e) => { e.stopPropagation(); api.current.toggle(item); } : undefined}>
          {canOpen ? <Icon icon={icons.ChevronRight} mirror={false} /> : null}
        </span>
        {icon != null ? <span className="dk-tree-view__icon" aria-hidden="true">{icon}</span> : null}
        <span className="dk-tree-view__label">{item.label}</span>
      </div>
      {isOpen && item.children && item.children.length ? <ul role="group" className="dk-tree-view__group"><Rows list={item.children} level={level + 1} /></ul> : null}
    </li>
  );
});
