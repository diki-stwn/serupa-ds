"use client";

// src/components/ErrorBoundary/ErrorBoundary.tsx
import * as React from "react";
import { cn } from "../../internal/cn.js";
import { deepActive } from "../../internal/root.js";
import { named } from "../../internal/component.js";
import { useSettings } from "../../internal/provider.js";
import { Alert } from "../Alert/Alert.js";
import { Button } from "../Button/Button.js";
import { en as words } from "./labels.js";
var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
var spot = (el) => {
  const out = [];
  for (let n = el; n && n !== document.body; n = n.parentNode) out.push({ node: n, before: n.previousSibling, after: n.nextSibling });
  return out;
};
var reach = (el) => el.tabIndex >= 0 && !el.matches(":disabled") && el.getClientRects().length > 0;
function recovered(was) {
  const i = was.findIndex((x) => x.node.isConnected);
  if (i <= 0) return null;
  const gone = was[i - 1], parent = was[i].node;
  const from = gone.before && gone.before.parentNode === parent ? gone.before.nextSibling : parent.firstChild;
  const to = gone.after && gone.after.parentNode === parent ? gone.after : null;
  let first = null;
  for (let n = from; n && n !== to; n = n.nextSibling) {
    if (!(n instanceof HTMLElement)) continue;
    if (n.matches(FOCUSABLE) && reach(n)) return n;
    const inner = Array.from(n.querySelectorAll(FOCUSABLE)).find(reach);
    if (inner) return inner;
    if (!first) first = n;
  }
  if (first && !first.hasAttribute("tabindex")) {
    first.tabIndex = -1;
    first.addEventListener("blur", () => first.removeAttribute("tabindex"), { once: true });
  }
  return first;
}
var changed = (a, b) => (a || []).length !== (b || []).length || (a || []).some((v, i) => !Object.is(v, (b || [])[i]));
var Boundary = /* @__PURE__ */ (() => class Boundary extends React.Component {
  state = { error: null, failed: false };
  box = React.createRef();
  // Set when the error is cleared while focus is on the page: where it was, to find the recovered content by.
  was = null;
  static getDerivedStateFromError(error) {
    return { error, failed: true };
  }
  componentDidCatch(error, info) {
    if (this.props.onError) this.props.onError(error, info);
  }
  componentDidUpdate(prev, was) {
    if (this.state.failed && was.failed && changed(prev.resetKeys, this.props.resetKeys)) {
      this.reset();
      return;
    }
    if (this.state.failed && !was.failed) {
      const active = deepActive();
      if ((!active || active === document.body) && this.box.current) this.box.current.focus();
    }
    if (!this.state.failed && was.failed && this.was) {
      const at = this.was;
      this.was = null;
      const active = deepActive();
      if (!active || active === document.body) {
        const t = recovered(at);
        if (t) t.focus();
      }
    }
  }
  // Focus is read through shadow roots, so inside one it's the focused element, not the host (GR95).
  reset = () => {
    const active = deepActive();
    this.was = active && active !== document.body ? spot(active) : null;
    this.setState({ error: null, failed: false });
    if (this.props.onReset) this.props.onReset();
  };
  render() {
    if (!this.state.failed) return this.props.children;
    const p = this.props;
    if (typeof p.fallback === "function") return p.fallback({ error: this.state.error, reset: this.reset });
    if (p.fallback !== void 0) return p.fallback;
    return /* @__PURE__ */ React.createElement("div", { ref: this.box, tabIndex: -1, className: cn("dk-error-boundary", p.className), "data-component": "error-boundary" }, /* @__PURE__ */ React.createElement(
      Alert,
      {
        tone: "danger",
        title: p.title ?? p.labels.errorTitle,
        actions: /* @__PURE__ */ React.createElement(Button, { size: "sm", variant: "outline", onClick: this.reset }, p.labels.tryAgain)
      },
      p.description ?? p.labels.errorDescription
    ));
  }
})();
var ErrorBoundary = /* @__PURE__ */ named("ErrorBoundary", function ErrorBoundary2(props) {
  const labels = useSettings(words).labels;
  return /* @__PURE__ */ React.createElement(Boundary, { ...props, labels });
});
export {
  ErrorBoundary
};
//# sourceMappingURL=ErrorBoundary.js.map
