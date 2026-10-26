"use client";

// src/components/ErrorBoundary/ErrorBoundary.tsx
import * as React from "react";
import { cn } from "../../internal/cn.js";
import { named } from "../../internal/component.js";
import { useSerupa } from "../../internal/provider.js";
import { Alert } from "../Alert/Alert.js";
import { Button } from "../Button/Button.js";
var changed = (a, b) => (a || []).length !== (b || []).length || (a || []).some((v, i) => !Object.is(v, (b || [])[i]));
var Boundary = /* @__PURE__ */ (() => class Boundary extends React.Component {
  state = { error: null, failed: false };
  box = React.createRef();
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
      const active = document.activeElement;
      if ((!active || active === document.body) && this.box.current) this.box.current.focus();
    }
  }
  reset = () => {
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
  const labels = useSerupa().labels;
  return /* @__PURE__ */ React.createElement(Boundary, { ...props, labels });
});
export {
  ErrorBoundary
};
//# sourceMappingURL=ErrorBoundary.js.map
