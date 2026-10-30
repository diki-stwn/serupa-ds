---
"serupa-ds": patch
---

Input: the box can now be narrower than the native field's own width (about 244px, more with a prefix, suffix or count), so in a grid cell or a flex row it takes the room it's given instead of pushing the page sideways (GR23). The same holds for the fields built on it: Combobox, NumberInput, SearchInput, PasswordInput, PhoneInput, DatePicker and TimePicker. Beside a button in a flex row, give it `className="flex-1"` so it takes what the button leaves.
