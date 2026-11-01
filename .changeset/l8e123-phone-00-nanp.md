---
"serupa-ds": patch
---

- Fixed: PhoneInput reads "0044 20 7946 0958", typed one key at a time in a US (or any +1) field, as a UK number, as a paste of the same text already did. The first 0 used to be formatted as "(0", so the "00" never came together and the number went out as +10044207946 (GR85). A lone 0 now waits as typed in every country, so in Italy "06 1234 5678" still starts with its 0.
