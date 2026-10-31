# ADR-0010: One app-level provider instead of module-global settings

**Status:** Accepted
**Status when written:** Accepted (Diki approved analysis item B1 on 23 October 2026). Ships as a minor release; `configure()` goes in 9.0.0.
**Checked against main (31 October 2026, 11.0.0):** `SerupaProvider` carries the locale, labels and icons. `configure()` was not removed in 9.0.0: at 11.0.0 it remains and sets only `link`, the element a Button or Badge with `href` renders.
**Deciders:** Diki
**Related:** analysis items B1, F2 (`render` prop), and the queued "locale and labels" item.

## Context

Three things are set once for the whole page and live in module scope:

- `configure({ link })` in `src/internal/config.ts`: what a Button, Badge, Card or Menu item with `href` renders.
- `registerIcons()`: extra icon names.
- The toast store.

After #218 the package is one module per source file, with `"use client"` on interactive files. That breaks the module-global approach in three ways:

1. **Server and client don't share it.** A `configure()` call in a Server Component file runs in the server's module graph. The client modules never see it.
2. **Requests share it.** On the server, a per-request setting such as the locale would leak between concurrent requests. Two visitors would render with whichever locale was set last.
3. **There's no override for one part of a page.** For example, you can't have one Indonesian section, or an embedded widget with its own link component.

The queued "locale and labels" item would add a fourth global, which would make all of this worse. About 30 built-in strings are written in English inside components today (`"Choose time"`, `"Start date"`, `"Previous month"`, `"Dismiss"`, `"Loading"` and so on), and every date and time component takes its own `locale` prop.

## Decision

Add `<SerupaProvider>`, a React context, exported from the main entry:

```tsx
<SerupaProvider locale="id-ID" labels={{ dismiss: "Tutup" }} icons={{ rocket: RocketLaunch }}>
  <App />
</SerupaProvider>
```

| Prop | What it does | Read by |
|---|---|---|
| `locale` | BCP 47 tag. Sets date and time formats, the first day of the week, number formatting, and which built-in label set is used. | Calendar, DatePicker, DateRangePicker, TimePicker, NumberInput, Pagination |
| `labels` | Overrides the built-in strings by key (`labels.dismiss`, `labels.previousMonth`, ...). A typed `SerupaLabels` interface lists every key. | Every component with a built-in string |
| `icons` | Extra icon names for this subtree. Same shape as `registerIcons()`. | Icon and every icon prop |
| `dir` (later) | `ltr` or `rtl` for the subtree, for positioning and arrow keys. Not in the first release: components read the `dir` attribute from the DOM today, which already works. | Layers, Slider, Carousel, Tabs, Menu |

What each component uses is decided in this order:

1. The component's own prop (for example `locale`, or `listLabel`).
2. The nearest `SerupaProvider`.
3. Icons registered with `registerIcons()` (labels and locale never had a global).
4. The browser's locale and the English labels.

Nested providers merge: an inner provider overrides only the keys it sets.

Rules for implementing it:

- **The provider holds no state.** It's a memoized context value, so it renders on the server and wraps Server Component children. The file is `"use client"`, because it uses context, but children passed into it can still be Server Components.
- **Components read it with one `useSerupa()` hook** in `src/internal/provider.ts`. A component without a provider pays one `useContext` call and nothing else.
- **Labels live in `src/internal/labels.ts`:** English (`enLabels`, the default) and Indonesian (`idLabels`), both exported from the main entry. An unused set is dropped by tree shaking, so more languages don't grow an app's bundle.
- **Toasts stay a module store**, because a toast can be raised from outside React. `<Toaster>` reads the provider for its labels and `dir`.
- **The link component isn't a provider prop.** F2 (`render={<Link href="/settings" />}` on each instance) replaces `configure({ link })`. It works in Server Components and needs no setup. Adding a global link setting to the provider would bring back the problem F2 removes.

## Options considered

| | A: Provider (chosen) | B: Keep `configure()` and add locale and labels | C: Props only |
|---|---|---|---|
| Works across the server and client split | Yes | No | Yes |
| Safe with concurrent server requests | Yes | No | Yes |
| Override for one subtree | Yes | No | Every instance |
| Setup | One wrapper | One call | None, but repeated on every instance |

## Consequences

- **Minor release (8.x):** the provider, `useSerupa()`, label keys on every component, `enLabels` and `idLabels`. In 8.x, `configure()` and `registerIcons()` still work unchanged; the deprecation warning comes with the 9.0.0 work.
- **9.0.0:**
  - `configure()` is removed; `render` replaces `link`.
  - `registerIcons()` stays for plain pages that don't use React, and React apps use the provider's `icons` prop.
  - The migration notes and a codemod change `configure({ link: X })` into `render={<X />}` where Button, Badge, Card or Menu items have `href`, and flag any other `configure` call.
- **Tests:**
  - A contract test renders every component under `<SerupaProvider locale="id-ID" labels={pseudo}>` and fails on any visible English built-in string. This uses the same pseudo labels as the H3 stress test.
  - A server render test runs two requests at the same time with different locales and checks that neither leaks into the other.
- **The parked locale branch** (`-locale`, `configure({ locale, labels })`) gets rebuilt on top of this provider instead of being merged as it is.
