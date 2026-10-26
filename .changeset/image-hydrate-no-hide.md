---
"serupa-ds": patch
---

- Fixed: a server-rendered Image still loading when the page hydrated was hidden and then faded in. A large picture that had already painted in part disappeared and came back. Pictures that hydrate from server HTML now stay shown; only ones that mount on the client fade in.
