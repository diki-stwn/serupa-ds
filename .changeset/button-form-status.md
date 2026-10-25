---
"serupa-ds": minor
---

- Added: a `type="submit"` Button inside a `<form action={fn}>` (React 19 form actions) now shows `loading` while that form is being sent, using React's `useFormStatus`. You don't need your own state, and a second click can't send it twice. Set `loading` yourself to override it.
