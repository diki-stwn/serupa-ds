// serupa-ds/labels/ar: every built-in word in Arabic (Modern Standard), with its six plural forms (plural()).
//   import { labels, locale } from "serupa-ds/labels/ar";
//   <SerupaProvider locale={locale} labels={labels}>   (and dir="rtl" on the page)
import type { SerupaLabels } from "../internal/labels";
import { plural } from "../internal/plural";

/** The locale the words are written for. */
export const locale = "ar";

const n = (x: number) => new Intl.NumberFormat("ar").format(x);
/** zero, one, two, few (3–10), many (11–99), other (100 and up, fractions). */
const p6 = (x: number, f: { zero: string; one: string; two: string; few: string; many: string; other: string }) => plural("ar", x, f);
const HUES: Record<string, string> = { red: "أحمر", orange: "برتقالي", yellow: "أصفر", green: "أخضر", teal: "أزرق مخضر", blue: "أزرق", purple: "بنفسجي", pink: "وردي", brown: "بني", gray: "رمادي", black: "أسود", white: "أبيض" };
const STATUS = { online: "متصل", busy: "مشغول", away: "بعيد", offline: "غير متصل" };
const ZONES = { low: "منخفض", medium: "متوسط", high: "مرتفع" };
const KINDS: Record<string, string> = { image: "صورة", video: "فيديو", "audio file": "ملفًا صوتيًا", "text file": "ملفًا نصيًا" };
const KEYS: Record<string, string> = {
  "Up arrow": "سهم لأعلى", "Down arrow": "سهم لأسفل", "Left arrow": "سهم لليسار", "Right arrow": "سهم لليمين",
  Space: "مسافة", Delete: "حذف", Backspace: "مسافة للخلف", Enter: "إدخال", Return: "إدخال", Escape: "Esc", Function: "Fn",
};
const results = (x: number) => p6(x, { zero: "لا نتائج", one: "نتيجة واحدة", two: "نتيجتان", few: "# نتائج", many: "# نتيجة", other: "# نتيجة" });
const files = (x: number) => p6(x, { zero: "لا ملفات", one: "ملف واحد", two: "ملفان", few: "# ملفات", many: "# ملفًا", other: "# ملف" });

export const labels: SerupaLabels = {
  expandAll: "توسيع الكل",
  collapseAll: "طي الكل",
  avatarStatus: (status) => STATUS[status],
  avatarMore: (count) => "و" + n(count) + " آخرون",
  breadcrumb: "مسار التنقل",
  showHiddenPages: "عرض كل الصفحات",
  morePages: "صفحات أخرى",
  previousMonth: "الشهر السابق",
  nextMonth: "الشهر التالي",
  month: "الشهر",
  year: "السنة",
  previousSlide: "الشريحة السابقة",
  nextSlide: "الشريحة التالية",
  slideOf: (slide, total) => slide + " من " + total,
  slidesOf: (first, last, total) => first + "–" + last + " من " + total,
  carouselRole: "عرض دوّار",
  slideRole: "شريحة",
  selectAtLeastOne: "اختر خيارًا واحدًا على الأقل.",
  commandPalette: "لوحة الأوامر",
  searchCommands: "ابحث في الأوامر والصفحات",
  noCommands: "لا توجد أوامر مطابقة",
  commandsCount: (count) => p6(count, { zero: "لا أوامر", one: "أمر واحد", two: "أمران", few: "# أوامر", many: "# أمرًا", other: "# أمر" }),
  otherCommands: "الأوامر",
  colorName: (hue, tone) => HUES[hue] + (tone === "light" ? " فاتح" : tone === "dark" ? " داكن" : ""),
  customColor: "لون مخصص",
  hexCode: "الرمز السداسي العشري",
  contrast: (ratio) => "التباين " + ratio + ":1",
  lowContrast: (min) => "أقل من " + min + ":1، وقد يصعب قراءته",
  loadingResults: "جارٍ التحميل…",
  loadFailed: "تعذّر تحميل الخيارات. اكتب لإعادة المحاولة.",
  noResults: "لا نتائج",
  resultsCount: (count) => results(count),
  moreResults: (count) => "تابع الكتابة لتضييق " + n(count) + " أخرى",
  showOptions: "عرض الخيارات",
  clearValue: (label) => (label ? "مسح " + label : "مسح"),
  valueAdded: (label) => "تمت إضافة " + label,
  valueRemoved: (label) => "تمت إزالة " + label,
  copied: "تم النسخ",
  copyFailed: "تعذّر النسخ. حدّد النص وانسخه بنفسك.",
  discardTitle: "تجاهل التغييرات؟",
  discardDescription: "لم تُحفظ التغييرات التي أجريتها هنا.",
  discard: "تجاهل",
  keepEditing: "متابعة التعديل",
  chooseDate: "اختر تاريخًا",
  inputNotAccepted: (text) => `لم يُقبل «${text}»، فبقيت القيمة السابقة.`,
  formatHint: (pattern) => "التنسيق: " + pattern,
  chooseDates: "اختر التواريخ",
  startDate: "تاريخ البدء",
  endDate: "تاريخ الانتهاء",
  chooseStartDate: "اختر تاريخ البدء",
  chooseEndDate: "اختر تاريخ الانتهاء",
  didYouMean: "هل تقصد:",
  clearFilters: "مسح عوامل التصفية",
  errorTitle: "حدث خطأ ما",
  errorDescription: "تعذّر تحميل هذا الجزء من الصفحة.",
  tryAgain: "إعادة المحاولة",
  errorSummaryTitle: (count) => p6(count, { zero: "لا توجد مشكلات", one: "توجد مشكلة واحدة", two: "توجد مشكلتان", few: "توجد # مشكلات", many: "توجد # مشكلة", other: "توجد # مشكلة" }),
  fieldOptional: "(اختياري)",
  dragFiles: "اسحب الملفات إلى هنا",
  dragFile: "اسحب ملفًا إلى هنا",
  chooseFiles: "اختر ملفات",
  chooseFile: "اختر ملفًا",
  chosenFiles: "الملفات المختارة",
  chosenFile: "الملف المختار",
  fileWrongType: (name, types) => (types
    ? `${name} ليس ${new Intl.ListFormat("ar", { type: "disjunction" }).format(types.map((t) => KINDS[t] || t))}.`
    : `${name}: هذا النوع من الملفات غير مقبول.`),
  fileTooLarge: (name, limit) => `${name} أكبر من ${limit}.`,
  fileTooMany: (name, max) => `لم تتم إضافة ${name}: الحد الأقصى ${files(max)}.`,
  fileOnlyOne: (name) => `لم تتم إضافة ${name}: ملف واحد فقط.`,
  fileMissing: (multiple) => (multiple ? "اختر ملفًا واحدًا على الأقل." : "اختر ملفًا."),
  fileFolder: (name) => `${name} مجلد: اختر الملفات التي بداخله.`,
  fileAlreadyAdded: (name) => `${name} مضاف بالفعل.`,
  filesAdded: (names) => (names.length === 1 ? `تمت إضافة ${names[0]}.` : `تمت إضافة ${files(names.length)}.`),
  fileRemoved: (name) => `تمت إزالة ${name}.`,
  viewImage: "عرض الصورة",
  removeImage: "إزالة الصورة",
  edit: "تعديل",
  charactersLeft: (left) => (left === 0 ? "بلغت الحد الأقصى للأحرف." : "الأحرف المتبقية: " + n(left) + "."),
  invalidValue: (p) => {
    switch (p.reason) {
      case "valueMissing": return "املأ هذا الحقل.";
      case "typeMismatch": return p.type === "email" ? "أدخل عنوان بريد إلكتروني صحيحًا." : p.type === "url" ? "أدخل عنوان URL صحيحًا." : "أدخل قيمة صحيحة.";
      case "badInput": return "أدخل رقمًا.";
      case "tooShort": return "الحد الأدنى " + p.minLength + " أحرف (الآن " + p.length + ").";
      case "tooLong": return "الحد الأقصى " + p.maxLength + " أحرف (الآن " + p.length + ").";
      case "rangeUnderflow": return "يجب أن تكون القيمة " + p.min + " أو أكثر.";
      case "rangeOverflow": return "يجب أن تكون القيمة " + p.max + " أو أقل.";
      case "stepMismatch": return "أدخل مضاعفًا لـ " + p.step + ".";
      case "patternMismatch": return "اتبع التنسيق المطلوب." + (p.title ? " " + p.title : "");
      default: return "";
    }
  },
  keyName: (name) => KEYS[name] || name,
  keyboardShortcuts: "اختصارات لوحة المفاتيح",
  generalShortcuts: "عام",
  showShortcuts: "عرض اختصارات لوحة المفاتيح",
  opensInNewTab: "(يُفتح في علامة تبويب جديدة)",
  loadMore: "تحميل المزيد",
  showingOf: (shown, total) => `عرض ${shown} من ${total}`,
  loadedMore: (added) => `تم تحميل ${added} أخرى`,
  moreLoaded: "تم تحميل المزيد",
  allLoaded: "وصلت إلى النهاية",
  meterZone: (value, zone) => value + "، " + ZONES[zone],
  notificationCenter: "الإشعارات",
  noNotifications: "لا إشعارات بعد",
  unreadNotification: "غير مقروء",
  markRead: "تعليم كمقروء",
  markAllRead: "تعليم الكل كمقروء",
  clearNotifications: "مسح الكل",
  decrease: "إنقاص",
  increase: "زيادة",
  pagination: "ترقيم الصفحات",
  previousPage: "الصفحة السابقة",
  nextPage: "الصفحة التالية",
  itemsOf: (first, last, total) => (first === last ? first : first + "–" + last) + " من " + total,
  perPage: "العناصر في كل صفحة",
  showPassword: "إظهار كلمة المرور",
  capsLockOn: "مفتاح Caps Lock مفعّل",
  country: "البلد",
  progressComplete: (name) => (name ? name + ": اكتمل" : "اكتمل"),
  ratingStars: (value) => p6(value, { zero: "لا نجوم", one: "نجمة واحدة", two: "نجمتان", few: "# نجوم", many: "# نجمة", other: "# نجمة" }),
  ratingValue: (value, max) => n(value) + " من " + n(max),
  saving: "جارٍ الحفظ…",
  saved: "تم الحفظ",
  saveFailed: "تعذّر الحفظ",
  retrySave: "إعادة المحاولة",
  searching: "جارٍ البحث",
  clearSearch: "مسح البحث",
  sliderMinimum: "الحد الأدنى",
  sliderMaximum: "الحد الأقصى",
  reorder: "إعادة الترتيب",
  reorderInstructions: "اضغط مسافة لالتقاطه، والأسهم لتحريكه، ومسافة مرة أخرى لإفلاته، أو Esc للإلغاء.",
  reorderGrabbed: (item, p, total) => "تم التقاط " + item + "، الموضع " + p + " من " + total + ".",
  reorderMoved: (item, p, total) => item + "، الموضع " + p + " من " + total + ".",
  reorderDropped: (item, p, total) => "تم إفلات " + item + " في الموضع " + p + " من " + total + ".",
  reorderCancelled: (item, p, total) => "تم الإلغاء. عاد " + item + " إلى الموضع " + p + " من " + total + ".",
  resizePanes: "تغيير حجم الأجزاء",
  splitterPlace: "اضغط حيث يجب أن يكون المقبض، أو اضغط المقبض مرة أخرى للإلغاء.",
  skipToContent: "الانتقال إلى المحتوى",
  completed: "مكتمل",
  hasError: "به خطأ",
  hasWarning: "يحتاج إلى انتباه",
  stepOf: (step, total) => "الخطوة " + step + " من " + total,
  table: "جدول",
  tableSorted: (column, direction) => "مرتب حسب " + column + "، " + (direction === "ascending" ? "تصاعديًا" : "تنازليًا") + ".",
  tableSelected: (count) => "المحدد: " + n(count),
  clearSelection: "مسح التحديد",
  chooseTime: "اختر وقتًا",
  notifications: "الإشعارات",
  toastShortcut: (key) => "اضغط " + key + " للوصول إليه.",
  moreToasts: (count) => "+" + n(count) + " أخرى",
  toastRepeated: (count) => p6(count, { zero: "لا مرات", one: "مرة واحدة", two: "مرتان", few: "# مرات", many: "# مرة", other: "# مرة" }),
  undo: "تراجع",
  typeToConfirm: "للتأكيد، اكتب",
  typePhraseFirst: (phrase) => "اكتب «" + phrase + "» أولًا",
  close: "إغلاق",
  dismiss: "تجاهل",
  loading: "جارٍ التحميل…",
  copy: "نسخ",
  remove: "إزالة",
  image: "صورة",
  page: (p) => "الصفحة " + p,
  progress: "التقدم",
  optional: "اختياري",
  mainNavigation: "الرئيسية",
  menu: "القائمة",
  required: "مطلوب",
};
