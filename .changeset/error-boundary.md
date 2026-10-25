---
"serupa-ds": minor
---

- New component: ErrorBoundary. It catches an error thrown while rendering anything inside it and shows a danger Alert with "Try again" in its place, so one broken widget doesn't take the page down (idea 198). Focus moves to the message when the crash took it away; `onError` reports the error, `resetKeys` clears it on a route change, and `fallback` replaces the message. New `errorTitle`, `errorDescription` and `tryAgain` labels, in English and Indonesian.
