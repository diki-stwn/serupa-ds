---
"serupa-ds": patch
---

- Fixed: words some display components say were English in every language. Avatar's status ("online"), AvatarGroup's "N more", an external Link's "(opens in a new tab)" and Kbd's key names ("Up arrow") come from labels now (`avatarStatus`, `avatarMore`, `opensInNewTab`, `keyName`), in Indonesian in `idLabels`. `statusLabel` and `moreLabel` still win, and Link is still a Server Component (T1).
