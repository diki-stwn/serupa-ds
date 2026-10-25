---
"serupa-ds": minor
---

Avatar:
- The picture now loads lazily and decodes async by default, so a long list of people doesn't fetch every avatar at once. A new `imgProps` prop passes props to the `<img>`, such as `loading="eager"` for one above the fold (BJ1).
- A name of only spaces now counts as no name. The avatar is hidden like one with no name, instead of being an image named with spaces (AU1).
- Initials are one character a person sees per word, taken from its first letter, digit or pictograph: "ßen Müller" gives "SM" (it gave "SSM"), a name in quotes no longer gets a quote mark, and a joined or skin-toned emoji stays whole (CD1).
