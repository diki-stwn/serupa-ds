---
"serupa-ds": minor
---

Input: `showCount` adds a character count at the end of the field, and `maxLength` is now counted in characters as people see them (an emoji is one) and applied by Input, as Textarea does. Input and Textarea read the count out only near the limit: once when a few characters are left and once when it's reached (new `charactersLeft` label, English and Indonesian). Email, URL, username and one-time-code inputs turn off autocapitalize, autocorrect and spellcheck unless you set them.

Fixed: a form reset now puts Textarea's count back to the default text's.
