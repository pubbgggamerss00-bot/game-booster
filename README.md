# ⚡ Game Booster — Neon Persian

بواستر بازی **بدون روت** — دو بخش دارد:

1. **نمونه‌ساز تعاملی وب (Next.js)** — شبیه‌سازی کامل اپ با UI نئون فارسی/RTL
2. **اپ اندروید (Kotlin)** — نسخه v1 واقعی و قابل‌نصب، بیلد خودکار APK با GitHub Actions

---

## 📱 دانلود APK

آخرین APK به‌صورت خودکار ساخته و در بخش [**Releases**](../../releases) منتشر می‌شود:

1. به صفحه [Releases](../../releases) بروید
2. فایل `GameBooster-v1.0.0-debug.apk` را دانلود کنید
3. روی گوشی: تنظیمات ← اجازه «نصب از منابع ناشناس» برای مرورگر/فایل‌منیجر ← نصب

> APK از نوع **debug** است (برای تست). نسخه release-signed بعداً اضافه می‌شود.

### قابلیت‌های اپ اندروید (همه بدون روت)
- ⚡ **BOOST**: درخواست توقف فرایندهای پس‌زمینه غیرضروری (`killBackgroundProcesses`) — اپ‌های سیستمی هرگز لمس نمی‌شوند
- 🧠 نمایش RAM مصرفی/کل با نوار رنگی (سبز/کهربایی/قرمز)
- 🌡️ دمای باتری (اگر دستگاه پشتیبانی کند)
- 🌐 پینگ واقعی (ICMP) + زمان پاسخ DNS + یادداشت صادقانه درباره DNS و پینگ بازی
- 🎮 لیست بازی‌ها و اپ‌های نصب‌شده (PackageManager) با تگ «بازی» و اجرای یک‌ضرب
- 🌙 UI نئون تاریک + **فارسی/انگلیسی خودکار** (بر اساس زبان دستگاه)
- 🔒 حفاظت از کش Shader و داده‌های بازی

## 🤖 بیلد خودکار APK

هر push روی `main` این workflow را اجرا می‌کند: [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml)

- JDK 17 + Gradle 8.9 + AGP 8.5.2 + Kotlin 2.0.20
- خروجی: artifact + Release جدید با APK

### بیلد محلی (اختیاری)
```bash
cd android
gradle assembleDebug        # یا باز کردن پوشه android در Android Studio
# خروجی: app/build/outputs/apk/debug/app-debug.apk
```

## 🖥 نمونه‌ساز وب (Next.js)

نمونه‌ساز تعاملی کامل با ۸ صفحه: Home، Library، RAM Manager، DNS Changer (DoH/DoT)، Network Optimizer، WorkManager، Device، Settings — با MVVM (Zustand)، دوزبانه FA/EN و تم روشن/تاریک.

```bash
bun install
bun run dev
```

![Showcase](docs/showcase.png)

## 🗂 ساختار

```
├── src/                # نمونه‌ساز وب Next.js (lib/gb = Model/ViewModel، components/gb = View)
├── android/            # اپ اندروید Kotlin (minSdk 26 / targetSdk 34)
├── .github/workflows/  # بیلد خودکار APK
└── docs/               # تصاویر مستندات
```

## ⚠️ نکته فنی

این اپ طبق محدودیت‌های Android بدون روت طراحی شده است:
- هیچ اپی نمی‌تواند کش سایر برنامه‌ها را پاک کند یا RAM «اجباری» آزاد کند — فقط **درخواست** توقف فرایندهای پس‌زمینه به سیستم داده می‌شود
- تغییر DNS فقط سرعت حل نام را بهتر می‌کند و تضمینی برای کاهش پینگ داخل بازی ندارد
- کنترل فرکانس CPU/GPU توسط اپ‌های معمولی امکان‌پذیر نیست
