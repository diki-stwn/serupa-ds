"use client";

// src/components/FormattedNumber/FormattedNumber.tsx
import * as React from "react";
import { cn, omit } from "../../internal/cn.js";
import { component } from "../../internal/component.js";
import { useLocale, useOwnLang } from "../../internal/provider.js";
import { formatNumber } from "./formatNumber.js";
import { formatNumber as formatNumber2 } from "./formatNumber.js";
var FormattedNumber = /* @__PURE__ */ component("FormattedNumber", function FormattedNumber2(props, ref) {
  const rest = omit(props, { value: 1, format: 1, currency: 1, unit: 1, options: 1, locale: 1, className: 1 });
  const locale = useLocale(props.locale), lang = useOwnLang(props.locale);
  const format = props.format || "decimal";
  const text = formatNumber(props.value, locale, { format, currency: props.currency, unit: props.unit, ...props.options });
  const title = format === "compact" && text ? formatNumber(props.value, locale) : void 0;
  return /* @__PURE__ */ React.createElement(
    "data",
    {
      lang,
      ...rest,
      ref,
      value: String(props.value),
      title: rest.title ?? title,
      className: cn("dk-formatted-number", props.className),
      "data-component": "formatted-number",
      "data-format": format
    },
    text
  );
});
export {
  FormattedNumber,
  formatNumber2 as formatNumber
};
//# sourceMappingURL=FormattedNumber.js.map
