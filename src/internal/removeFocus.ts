import type * as React from "react";

/* Removing an item by its own × drops focus on <body> when the × had it. Once the item is gone, focus moves to the
   next × among its siblings (the items in the same list, each maybe in its own <li>), else the one before it. A
   handler that moves focus itself, or keeps the item, is left alone. Badge's tags and Image's pictures use it. */
export function removeAndRefocus<E extends React.MouseEvent<HTMLButtonElement>>(e: E, onRemove: (e: E) => void, item: string, remove: string): void {
  const me = e.currentTarget, own = me.closest(item);
  let scope = own && own.parentElement;
  if (scope && scope.childElementCount === 1 && scope.parentElement) scope = scope.parentElement;   // each item in its own <li>
  const all = scope ? Array.from(scope.querySelectorAll<HTMLButtonElement>(remove)) : [];
  const at = all.indexOf(me);
  onRemove(e);
  setTimeout(function () {
    const active = me.ownerDocument.activeElement;
    if (me.isConnected || (active && active !== me.ownerDocument.body)) return;
    // Only a × that can take focus: one in a hidden item (a filtered list) would drop focus to the page (L8E33).
    const next = all.slice(at + 1).concat(all.slice(0, at).reverse()).find((b) => b.isConnected && !b.disabled && b.getClientRects().length > 0);
    if (next) next.focus();
  }, 0);
}
