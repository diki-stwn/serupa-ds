// src/components/PhoneInput/phone.ts
var ROWS = "US 1 - (###)_###-#### 10 10|CA 1 - (###)_###-#### 10 10|GB 44 0 ####_###### 9 10|IE 353 0 ##_###_#### 9 9|AU 61 0 ###_###_### 9 9|NZ 64 0 ##_###_#### 8 10|DE 49 0 ####_####### 6 11|FR 33 0 #_##_##_##_## 9 9|ES 34 - ###_##_##_## 9 9|IT 39 - ###_###_#### 6 11|NL 31 0 #_######## 9 9|BE 32 0 ###_##_##_## 8 9|CH 41 0 ##_###_##_## 9 9|AT 43 0 ###_####### 4 13|SE 46 0 ##-###_##_## 7 10|NO 47 - ###_##_### 8 8|DK 45 - ##_##_##_## 8 8|FI 358 0 ##_###_#### 5 12|PL 48 - ###_###_### 9 9|PT 351 - ###_###_### 9 9|GR 30 - ###_###_#### 10 10|TR 90 0 ###_###_##_## 10 10|RU 7 8 ###_###-##-## 10 10|UA 380 0 ##_###_##_## 9 9|IL 972 0 ##-###-#### 8 9|SA 966 0 ##_###_#### 9 9|AE 971 0 ##_###_#### 8 9|EG 20 0 ###_###_#### 9 10|NG 234 0 ###_###_#### 10 10|KE 254 0 ###_###### 9 9|ZA 27 0 ##_###_#### 9 9|IN 91 0 #####_##### 10 10|PK 92 0 ###_####### 10 10|BD 880 0 ####-###### 10 10|CN 86 0 ###_####_#### 11 11|HK 852 - ####_#### 8 8|TW 886 0 ###_###_### 9 9|JP 81 0 ##-####-#### 9 10|KR 82 0 ##-####-#### 9 10|SG 65 - ####_#### 8 8|MY 60 0 ##-###_#### 9 10|ID 62 0 ###-####-#### 9 12|PH 63 0 ###_###_#### 10 10|TH 66 0 ##_###_#### 8 9|VN 84 0 ###_###_### 9 10|MX 52 - ##_####_#### 10 10|BR 55 0 ##_#####-#### 10 11|AR 54 0 ##_####-#### 10 10|CL 56 - #_####_#### 9 9|CO 57 - ###_####### 10 10|PE 51 - ###_###_### 9 9|LK 94 0 ##_###_#### 9 9|NP 977 0 ###-####### 8 10|KH 855 0 ##_###_### 8 9|LA 856 0 ##_##_###_### 8 10|MO 853 - ####_#### 8 8|MN 976 - ####_#### 8 8|KZ 7 8 ###_###-##-## 10 10|UZ 998 - ##_###_##_## 9 9|AZ 994 0 ##_###_##_## 9 9|GE 995 0 ###_##_##_## 9 9|AM 374 0 ##_###### 8 8|IR 98 0 ###_###_#### 10 10|IQ 964 0 ###_###_#### 10 10|JO 962 0 #_####_#### 8 9|LB 961 0 ##_###_### 7 8|SY 963 0 ###_###_### 9 9|KW 965 - ####_#### 8 8|QA 974 - ####_#### 8 8|BH 973 - ####_#### 8 8|OM 968 - ####_#### 8 8|YE 967 0 ###_###_### 9 9|PS 970 0 ###_###_### 9 9|CY 357 - ##_###### 8 8|MT 356 - ####_#### 8 8|IS 354 - ###_#### 7 7|LU 352 - ###_###_### 4 11|EE 372 - ####_#### 7 8|LV 371 - ##_###_### 8 8|LT 370 8 ###_##### 8 8|CZ 420 - ###_###_### 9 9|SK 421 0 ###_###_### 9 9|HU 36 06 ##_###_#### 8 9|RO 40 0 ###_###_### 9 9|BG 359 0 ##_###_#### 8 9|RS 381 0 ##_###_#### 8 9|HR 385 0 ##_###_#### 8 9|SI 386 0 ##_###_### 8 8|BA 387 0 ##_###_### 8 9|ME 382 0 ##_###_### 8 8|MK 389 0 ##_###_### 8 8|AL 355 0 ##_###_#### 8 9|MD 373 0 ###_##_### 8 8|XK 383 0 ##_###_### 8 8|MC 377 - ##_##_##_## 8 9|LI 423 - ###_##_## 7 9|AD 376 - ###_### 6 9|SM 378 - ####_#### 6 10|BY 375 80 ##_###-##-## 9 9|MA 212 0 ###-###### 9 9|DZ 213 0 ###_##_##_## 8 9|TN 216 - ##_###_### 8 8|LY 218 0 ##-####### 9 9|GH 233 0 ##_###_#### 9 9|CI 225 - ##_##_##_##_## 10 10|SN 221 - ##_###_##_## 9 9|CM 237 - #_##_##_##_## 9 9|ET 251 0 ##_###_#### 9 9|TZ 255 0 ###_###_### 9 9|UG 256 0 ###_###### 9 9|RW 250 0 ###_###_### 9 9|ZM 260 0 ##_####### 9 9|ZW 263 0 ##_###_#### 9 9|MZ 258 - ##_###_#### 8 9|AO 244 - ###_###_### 9 9|NA 264 0 ##_###_#### 8 9|BW 267 - ##_###_### 7 8|MU 230 - ####_#### 7 8|SD 249 0 ##_###_#### 9 9|CD 243 0 ###_###_### 9 9|CR 506 - ####_#### 8 8|GT 502 - ####_#### 8 8|SV 503 - ####_#### 8 8|HN 504 - ####-#### 8 8|NI 505 - ####_#### 8 8|PA 507 - ####-#### 7 8|EC 593 0 ##_###_#### 8 9|BO 591 - #_###_#### 8 8|PY 595 0 ###_###_### 9 9|UY 598 0 ##_###_### 8 8|VE 58 0 ###-####### 10 10|CU 53 0 #_###_#### 8 8|FJ 679 - ###_#### 7 7|PG 675 - ###_#### 7 8|MV 960 - ###-#### 7 7|BT 975 - ##_##_##_## 7 8|BN 673 - ###_#### 7 7|TL 670 - ####_#### 7 8|AF 93 0|AW 297 -|BZ 501 -|BJ 229 -|BQ 599 -|IO 246 -|BF 226 -|BI 257 -|CV 238 -|CF 236 -|TD 235 -|CX 61 0|CC 61 0|KM 269 -|CG 242 -|CK 682 -|CW 599 -|DJ 253 -|GQ 240 -|ER 291 0|SZ 268 -|FK 500 -|FO 298 -|GF 594 0|PF 689 -|GA 241 -|GM 220 -|GI 350 -|GL 299 -|GP 590 0|GG 44 0|GN 224 -|GW 245 -|GY 592 -|HT 509 -|VA 39 -|IM 44 0|JE 44 0|KI 686 -|KP 850 0|KG 996 0|LS 266 -|LR 231 0|MG 261 0|MW 265 0|ML 223 -|MH 692 -|MQ 596 0|MR 222 -|YT 262 0|FM 691 -|NR 674 -|NC 687 -|NE 227 -|NU 683 -|NF 672 -|PW 680 -|RE 262 0|BL 590 0|SH 290 -|TA 290 -|AC 247 -|MF 590 0|PM 508 -|WS 685 -|ST 239 -|SC 248 -|SL 232 0|SB 677 -|SO 252 0|SS 211 0|SR 597 -|SJ 47 -|TJ 992 -|TG 228 -|TK 690 -|TO 676 -|TM 993 8|TV 688 -|VU 678 -|WF 681 -|EH 212 0|AX 358 0";
var AREAS = {
  CA: "204 226 236 249 250 257 263 289 306 343 354 365 367 368 382 387 403 416 418 428 431 437 438 450 460 468 474 506 514 519 548 579 581 584 587 600 604 613 622 639 647 672 683 709 742 753 778 780 782 807 819 825 867 873 879 902 905 942",
  AS: "684",
  AI: "264",
  AG: "268",
  BS: "242",
  BB: "246",
  BM: "441",
  VG: "284",
  KY: "345",
  DM: "767",
  DO: "809 829 849",
  GD: "473",
  GU: "671",
  JM: "876 658",
  MS: "664",
  MP: "670",
  PR: "787 939",
  KN: "869",
  LC: "758",
  VC: "784",
  SX: "721",
  TT: "868",
  TC: "649",
  VI: "340",
  KZ: "6 7",
  GG: "1481 7781 7839 7911",
  JE: "1534 7509 7700 7797 7829 7937",
  IM: "1624 7524 7624 7924",
  VA: "06698",
  AX: "18",
  SJ: "79",
  CX: "89164",
  CC: "89162",
  YT: "269 639",
  EH: "5288 5289"
};
var DE3 = "201 202 203 208 209 211 212 214 221 228 231 234 241 251 261 271 281 291 331 335 340 341 345 351 355 361 365 371 375 381 385 391 395 421 431 441 451 461 471 481 491 511 521 531 541 551 561 571 581 591 611 621 631 641 651 661 671 681 711 721 731 741 751 761 771 781 791 821 831 841 851 861 871 881 906 911 921 931 941 951 961 971 981 991";
var by = (keys, pattern) => Object.fromEntries(keys.split(" ").map((k) => [k, pattern]));
var PATTERNS = /* @__PURE__ */ (() => ({
  DE: { ...by("30 40 69 89", "## ########"), ...by("15 16 17 " + DE3, "### ########") },
  JP: by("3 6", "#-####-####"),
  GB: { ...by("20 23 24 28 29", "## #### ####"), ...by("113 114 115 116 117 118 121 131 141 151 161 191", "### ### ####") }
}))();
var NANP = "AS AI AG BS BB BM VG KY DM DO GD GU JM MS MP PR KN LC VC SX TT TC VI";
var PHONE_COUNTRIES = /* @__PURE__ */ (() => (ROWS + NANP.replace(/(\w+) ?/g, "|$1 1 - (###)_###-#### 10 10")).split("|").map(function(row) {
  const [code, dial, trunk, pattern, min, max] = row.split(" ");
  const c = { code, dial, trunk: trunk === "-" ? "" : trunk, pattern: pattern ? pattern.replace(/_/g, " ") : "#", min: pattern ? +min : 4, max: pattern ? +max : 15 - dial.length };
  if (AREAS[code]) c.areas = AREAS[code].split(" ");
  if (PATTERNS[code]) c.patterns = PATTERNS[code];
  return c;
}))();
var BY_CODE = /* @__PURE__ */ (() => new Map(PHONE_COUNTRIES.map((c) => [c.code, c])))();
var phoneCountry = (code) => code ? BY_CODE.get(code.toUpperCase()) : void 0;
function phonePattern(digits, country) {
  let best = "", out = country.pattern;
  for (const k in country.patterns) if (k.length > best.length && digits.startsWith(k)) {
    best = k;
    out = country.patterns[k];
  }
  return out;
}
function formatNational(digits, country) {
  let out = "", i = 0;
  for (const ch of phonePattern(digits, country)) {
    if (i >= digits.length) break;
    out += ch === "#" ? digits[i++] : ch;
  }
  return out + digits.slice(i);
}
function parsePhone(value, prefer, countries = PHONE_COUNTRIES) {
  const digits = value.trim().replace(/^00/, "+").replace(/[^\d+]/g, "");
  if (digits[0] !== "+") return void 0;
  const rest = digits.slice(1).replace(/\D/g, "");
  let dial = "";
  for (const c of countries) if (c.dial.length > dial.length && rest.startsWith(c.dial)) dial = c.dial;
  if (!dial) return void 0;
  const group = countries.filter((c) => c.dial === dial), n = rest.slice(dial.length);
  const pref = prefer && group.find((c) => c.code === prefer.toUpperCase());
  let best, area = "";
  for (const c of group) for (const a of c.areas || []) if (a.length > area.length && n.startsWith(a)) {
    best = c;
    area = a;
  }
  if (!best && pref && (!pref.areas || pref.areas.some((a) => a.startsWith(n)))) best = pref;
  best = best || group.find((c) => !c.areas) || group[0];
  return { country: best, national: stripTrunk(n, best) };
}
function stripTrunk(digits, country) {
  return country.trunk && digits.startsWith(country.trunk) ? digits.slice(country.trunk.length) : digits;
}
var toE164 = (national, country) => national ? "+" + country.dial + national : "";
var isPhoneComplete = (national, country) => national.length >= country.min && national.length <= country.max;
function formatPhone(e164, prefer) {
  const p = parsePhone(e164, prefer);
  return p ? "+" + p.country.dial + " " + formatNational(p.national, p.country) : e164;
}
export {
  PHONE_COUNTRIES,
  formatNational,
  formatPhone,
  isPhoneComplete,
  parsePhone,
  phoneCountry,
  phonePattern,
  stripTrunk,
  toE164
};
//# sourceMappingURL=phone.js.map
