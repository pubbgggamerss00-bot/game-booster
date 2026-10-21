import type { Lang } from "./types";

/** Shared dictionary (navigation + common controls).
 *  Screens keep their own co-located strings via `useLang()`. */
const DICT = {
  fa: {
    "nav.home": "خانه",
    "nav.library": "بازی‌ها",
    "nav.monitor": "آمار",
    "nav.settings": "تنظیمات",
    "common.ok": "باشه",
    "common.cancel": "انصراف",
    "common.confirm": "تأیید",
    "common.close": "بستن",
    "common.save": "ذخیره",
    "common.retry": "تلاش دوباره",
    "common.on": "فعال",
    "common.off": "غیرفعال",
    "common.never": "هرگز",
    "common.now": "همین حالا",
    "common.run": "اجرای فوری",
    "common.details": "جزئیات",
    "common.back": "بازگشت",
    "common.select": "انتخاب",
    "common.selected": "انتخاب‌شده",
    "common.search": "جست‌وجو...",
    "common.testing": "در حال تست...",
    "common.simulated": "تخمینی",
    "common.real": "واقعی",
    "quality.excellent": "عالی",
    "quality.good": "خوب",
    "quality.fair": "متوسط",
    "quality.poor": "ضعیف",
    "quality.unknown": "نامشخص",
  },
  en: {
    "nav.home": "Home",
    "nav.library": "Games",
    "nav.monitor": "Stats",
    "nav.settings": "Settings",
    "common.ok": "OK",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.close": "Close",
    "common.save": "Save",
    "common.retry": "Retry",
    "common.on": "On",
    "common.off": "Off",
    "common.never": "Never",
    "common.now": "Now",
    "common.run": "Run now",
    "common.details": "Details",
    "common.back": "Back",
    "common.select": "Select",
    "common.selected": "Selected",
    "common.search": "Search...",
    "common.testing": "Testing...",
    "common.simulated": "Estimated",
    "common.real": "Real",
    "quality.excellent": "Excellent",
    "quality.good": "Good",
    "quality.fair": "Fair",
    "quality.poor": "Poor",
    "quality.unknown": "Unknown",
  },
} as const;

export type DictKey = keyof (typeof DICT)["fa"];

export function translate(lang: Lang, key: DictKey): string {
  return DICT[lang][key] ?? DICT.fa[key] ?? key;
}
