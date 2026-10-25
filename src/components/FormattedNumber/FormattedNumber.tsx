"use client";
import * as React from "react";
import { cn, omit } from "../../internal/cn";
import { component } from "../../internal/component";
import { useLocale, useOwnLang } from "../../internal/provider";
import { formatNumber, type NumberFormat } from "./formatNumber";

export { formatNumber } from "./formatNumber";
export type { FormatNumberOptions, NumberFormat } from "./formatNumber";

export interface FormattedNumberProps extends Omit<React.DataHTMLAttributes<HTMLDataElement>, 'children' | 'value'> {
  /** The number. NaN renders an empty element. */
  value: number | bigint;
  /** 'decimal' (default), 'compact' (1.2K), 'percent' (0.45 is 45%), 'currency' (with currency), 'bytes' (1.5 MB) or 'unit' (with unit). */
  format?: NumberFormat;
  /** With format="currency": an ISO 4217 code, "IDR", "USD", "EUR". */
  currency?: string;
  /** With format="unit": a unit Intl knows, "kilometer-per-hour", "celsius", "liter". */
  unit?: string;
  /** Any other Intl.NumberFormat options (maximumFractionDigits, signDisplay, currencyDisplay...); these win. */
  options?: Intl.NumberFormatOptions;
  /** A locale for this one; otherwise the SerupaProvider's, else the browser's. */
  locale?: string;
}

/* FormattedNumber: a <data value> holding the number for machines and the locale's words for people: 1.234,5 in
   Indonesian, ١٬٢٣٤٫٥ in Egyptian Arabic, "1.2K", "Rp 150.000", "45%", "1.5 MB", "50 km/h". A compact number
   carries the full one in its tooltip (title). */
/** A number written the way the reader's locale writes it: plain, compact, a percentage, money, a size or a unit. */
export const FormattedNumber = /* @__PURE__ */ component<HTMLDataElement, FormattedNumberProps>("FormattedNumber", function FormattedNumber(props, ref) {
  const rest = omit(props, { value: 1, format: 1, currency: 1, unit: 1, options: 1, locale: 1, className: 1 });
  const locale = useLocale(props.locale), lang = useOwnLang(props.locale);
  const format = props.format || "decimal";
  const text = formatNumber(props.value, locale, { format, currency: props.currency, unit: props.unit, ...props.options });
  // A compact number hides digits ("1.2K" for 1,234): the full one goes in its tooltip.
  const title = format === "compact" && text ? formatNumber(props.value, locale) : undefined;
  return <data lang={lang} {...rest} ref={ref} value={String(props.value)} title={rest.title ?? title} className={cn("dk-formatted-number", props.className)}
    data-component="formatted-number" data-format={format}>{text}</data>;
});
