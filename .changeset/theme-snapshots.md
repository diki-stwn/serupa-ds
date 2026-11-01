---
"serupa-ds": minor
---

New `serupa-ds/testing`: `forEachTheme(page, fn)` draws your page in each of the six themes, for screenshots in your own CI. It sets `data-theme`, matches the emulated color scheme, turns off transitions and waits for fonts, then puts the page back.

```js
import { forEachTheme } from "serupa-ds/testing";

await forEachTheme(page, (theme) => expect(page).toHaveScreenshot(`checkout-${theme}.png`));
```
