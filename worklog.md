# Worklog — Game Booster (Next.js Interactive Prototype)

پروژه: نمونه‌ساز تعاملی وب از اپلیکیشن اندروید Game Booster (نئون فارسی، RTL)
مسیرها: `src/lib/gb/**` (Model/ViewModel)، `src/components/gb/**` (View)

---
Task ID: 1
Agent: main
Task: Foundation — types, model layer, store (MVVM), i18n, design system, AppShell, HomeScreen, BoostOverlay, SessionHUD, api/ping

Work Log:
- ایجاد `src/lib/gb/types.ts` — همه انواع دامنه (Game, GameProfile, PerfState, DnsState, NetDiag, WorkJob, HistoryEntry, SessionState, Settings, DeviceInfo, BoostState, RamHog, CleanableItem)
- ایجاد `src/lib/gb/model/games.ts` — کاتالوگ ۱۲ بازی (PackageManager شبیه‌سازی‌شده) + `defaultProfile` + `gameRamNeedGB`
- ایجاد `src/lib/gb/model/dns-servers.ts` — ۱۰ سرور DNS (کلادفلر/گوگل/کواد۹/ادگارد/اوپن‌دی‌ان‌اس + شکن/رادارگیم/الکترو/بگذر/۴۰۳) با `testable` برای DoH واقعی
- ایجاد `src/lib/gb/model/storage.ts` — شبیه‌سازی DataStore روی localStorage با کلید `gb-datastore-v1` + caps
- ایجاد `src/lib/gb/model/simulator.ts` — موتور عملکرد (CPU/RAM/دما random-walk) + `detectHogs` + `detectCleanables` + `thermalState`
- ایجاد `src/lib/gb/model/diagnostics.ts` — ping واقعی به `/api/ping`، jitter/loss، تست DoH واقعی (CORS) با fallback شبیه‌سازی، `detectDevice`، `networkTypeLabel`
- ایجاد `src/lib/gb/store.ts` — Zustand store (کل ViewModel) با persist دستی
- ایجاد `src/lib/gb/i18n.ts` (dict مشترک nav/common) و `src/lib/gb/format.ts` (اعداد فارسی، زمان، بایت)
- ایجاد `src/lib/gb/viewmodel/useFrameMonitor.ts` — FPS واقعی با requestAnimationFrame
- ایجاد `src/app/api/ping/route.ts` — اندپوینت ping بدون کش
- ایجاد `src/components/gb/ui.tsx` — دیزاین‌سیستم نئون
- ایجاد `src/components/gb/AppShell.tsx` — پوسته گوشی + Status Bar + Bottom Nav + router + موتور tick یک‌ثانیه‌ای + باتری/آنلاین واقعی
- ایجاد `src/components/gb/screens/HomeScreen.tsx` (کامل)، `BoostOverlay.tsx` (کامل)، `SessionHud.tsx` (کامل)
- stub صفحات دیگر ایجاد شد (باید جایگزین شوند): LibraryScreen, MonitorScreen, SettingsScreen, DnsScreen, RamManagerScreen, WorkManagerScreen, DeviceScreen
- توکن‌های نئون به `globals.css` اضافه شد (`.gb-dark/.gb-light` + @theme gb-* + انیمیشن‌ها + scrollbar)
- layout.tsx: فونت Vazirmatn + Orbitron، dir=rtl پیش‌فرض، metadata
- lint پاک است

Stage Summary:
- قرارداد API پایین‌را رعایت کنید. هیچ subagent حق تغییر store.ts / ui.tsx / types.ts / globals.css را ندارد.
- تصویر لوگو: `public/gb-hero.png` (در حال تولید — اگر نبود صفحه باز هم کار می‌کند)

## ═══ قرارداد API برای صفحات (READ THIS) ═══

### ایمپورت store
```ts
import { useBooster } from "@/lib/gb/store";
const lang = useBooster((s) => s.settings.lang);
const navigate = useBooster((s) => s.navigate);
```

### وضعیت‌های مهم store (انتخاب با selector)
- `settings: Settings` → `{ lang, theme, perfMode, bgClean, graphicsBoost, batterySaver, shaderProtect, sensitiveConfirm, permissions: { usage, vpn, notify, battery } }`
- `selectedGameId: string | null`، `favorites: string[]`، `profiles: Record<string, GameProfile>`
- `perf: PerfState` → `{ cpu, ramUsedGB, ramTotalGB, temp, points: MetricPoint[] }` — points هر ثانیه push می‌شود (t, cpu, ram%, temp)
- `fps: number | null` (واقعی، از useFrameMonitor)
- `dns: DnsState` → `{ connected, serverId, serverLabel, protocol: 'doh'|'dot', connectedAt, customIp }`
- `dnsTests: DnsTestResult[]` → `{ serverId, ms|null, source:'real'|'sim', at }` — نتیجه آخرین تست همه سرورها
- `dnsTestRunning: boolean`
- `netDiag: NetDiag` → `{ running, ping, jitter, loss, samples:number[], quality, score, at }`
- `jobs: WorkJob[]` → `{ id: 'smart_manager'|'cache_clean'|'memory_opt'|'apps_check', intervalH, enabled, lastRun }`
- `workLogs: WorkLog[]` → `{ id, jobId, at, message }`
- `history: HistoryEntry[]` → `{ id, kind:'boost'|'network'|'dns'|'session', at, data }`
- `hogs: RamHog[]` و `cleanables: CleanableItem[]` (باید `refreshHogs()`/`refreshCleanables()` هنگام mount صدا زده شود)
- `boost` و `session` — صفحه‌های دیگر دست نزنند
- `device: DeviceInfo` → `{ model, platform, isEmulator, cores, ramGB, screen, batteryLevel, batteryCharging, batterySupported, networkType, online }`
- `screen`, `prevScreen` — ناوبری
- `lastFreedMB`, `lastBoostAt`, `storeSavedAt`

### اکشن‌های store
```ts
navigate('dns' | 'ram' | 'work' | 'device' | 'home' | 'library' | 'monitor' | 'settings')
goBack()                       // دکمه بازگشت هدر
selectGame(id) / toggleFavorite(id)
setProfile(gameId, partial)    // merge می‌کند
patchSettings(partial) / setLang / setTheme / setPermission(key, val)
refreshHogs() / killOwnHogs(): number / refreshCleanables() / cleanSafeItems(): number / cleanShaderCache(): number
connectDns(serverId|'custom', label) / disconnectDns() / setDnsProtocol('doh'|'dot') / setCustomDns(ip|null)
runDnsTests(): Promise<void>   // تست همه سرورها (واقعی+تخمینی) → dnsTests + toast
applyBestDns()                 // انتخاب سریع‌ترین و اتصال
runNetDiag(): Promise<void>    // ۸ پینگ واقعی → netDiag
toggleJob(id) / runJobNow(id)  // اجرای فوری job + toast + log
saveSettingsNow() / resetAll() // resetAll بدون confirm — confirm در UI
setFps(n|null)                 // توسط useFrameMonitor
t: (key: DictKey) => string    // فقط کلیدهای dict مشترک (nav.*, common.*, quality.*)
```

### کامپوننت‌های ui.tsx (`import { ... } from "../ui"`)
```tsx
NeonCard({children, className, glow?: 'green'|'purple'|'cyan'|'none', onClick})
SectionTitle({icon, title, sub, action})          // icon = <Icon className="size-4"/>
GaugeRing({value:0..1, label, sub, color, size, thickness})
Sparkline({data:number[], color, height, fill, min, max})
MultiChart({series:{data,color,label,min?,max?}[], height})  // نمودار چندخطی + legend
StatTile({icon, title, value, sub, color, onClick, className})
Chip({children, color, dot, className})            // badge نئونی
StatusDot({color})
ToggleRow({icon, title, sub, checked, onChange, disabled})   // با Switch شاد‌کن
NeonButton({children, onClick, color, variant:'solid'|'outline', size:'sm'|'md'|'lg', disabled, loading, className})
SegTabs({items:{id,label}[], value, onChange})
ProgressBar({value:0..1, color, className})
ScreenHeader({title, onBack, action})              // هدر sticky با دکمه بازگشت
LogList({items:{id,at,message,ok?}[], emptyText, maxH})
TimeBadge({at})
Callout({icon, children, color})
Confirm({open, title, body, confirmText, cancelText, danger?, onConfirm, onCancel})  // AlertDialog شاد‌کن
TileButton({icon, title, sub, color, onClick})
GameIcon({game: Game, size})
LiveBadge({label})
COLOR_VAR / COLOR_TEXT / type GbColor = 'green'|'purple'|'cyan'|'pink'|'amber'|'red'
```

### توکن‌های Tailwind
`bg-gb-bg, bg-gb-surface, bg-gb-surface2, border-gb-border, text-gb-text, text-gb-dim, text-gb-green/-purple/-cyan/-pink/-amber/-red`
کلاس‌های glow: `glow-green, glow-purple, glow-cyan, text-glow-green, text-glow-purple, text-glow-cyan, anim-fade-up, anim-pulse-ring, anim-float, shimmer, gb-scroll, font-display`

### i18n الگوی هر صفحه (رشته‌های محلی همان فایل — بدون ویرایش i18n.ts)
```tsx
const S = { fa: { title: "...", ... }, en: { title: "...", ... } };
const lang = useBooster((s) => s.settings.lang);
const t = S[lang];
// اعداد: import { fmtInt, fmtOne, fmtBytesMB, fmtPct, fmtTime, fmtDateTime, fmtDuration } from "@/lib/gb/format";
// fmtInt(n, lang) اعداد فارسی/انگلیسی، fmtDateTime(ts, lang) برای تاریخچه
```

### قواعد اجباری
1. هر صفحه: `"use client"` در خط اول، `export default function XScreen()`
2. RTL: از `ps-/pe-/ms-/me-` و `text-start/end` استفاده کنید (نه pl/pr)؛ فلش بازگشت در ScreenHeader خودکار rtl می‌چرخد
3. لیست‌های بلند: `max-h-XX overflow-y-auto` + کلاس `gb-scroll`
4.padding کارت‌ها: p-3.5 یا p-4، فاصله بین بخش‌ها space-y-4، صفحه: `px-4 pb-6 pt-4` داخل ScreenHeader
5. هیچ package جدیدی نصب نشود. آیکون‌ها فقط lucide-react. toast از `import { toast } from "sonner"`
6. بازی‌ها از `import { GAMES } from "@/lib/gb/model/games"` — Game type از `@/lib/gb/types`
7. سرورهای DNS از `import { DNS_SERVERS } from "@/lib/gb/model/dns-servers"`
8. دست‌زدن به فایل‌های مشترک (store/ui/types/i18n/globals/AppShell/BoostOverlay/SessionHud/HomeScreen) ممنوع است — اگر نیاز چیزی نبود، داخل فایل صفحه حل کنید
9. صفحه حداکثر scroll داخلی phone frame — عرض محدود ~396px؛ واکنش‌گرا برای موبایل کامل هم
---
Task ID: 2-e
Agent: subagent (screens: Settings + Device)
Task: پیاده‌سازی کامل SettingsScreen.tsx و DeviceScreen.tsx (جایگزینی stubها)

Work Log:
- بازنویسی کامل `src/components/gb/screens/SettingsScreen.tsx`:
  - ScreenHeader «تنظیمات» + goBack
  - کارت «زبان» با SegTabs فارسی/English (setLang)، کارت «نمایش» با SegTabs تاریک/روشن (setTheme)
  - کارت «تنظیمات بازی» (Gamepad2): ۴ ToggleRow متصل به patchSettings — perfMode (Zap)، bgClean (Eraser)، graphicsBoost (Sparkles)، batterySaver (BatteryLow) + متن اصلاح‌شده sub
  - کارت «محافظت داده‌ها» (ShieldCheck): shaderProtect + sensitiveConfirm
  - کارت DataStore با glow purple (Database): ردیف ذخیره‌سازی خودکار + Chip فعال، آخرین ذخیره با fmtDateTime(storeSavedAt, lang) یا «هنوز ذخیره‌ای ثبت نشده»، کلیدها mono/ltr، دکمه «ذخیره تنظیمات» (saveSettingsNow) و «بازگردانی به حالت اولیه» (outline red → Confirm danger → resetAll() + toast.success)
  - کارت «مدیریت مجوزها» (KeyRound): ۴ ToggleRow متصل به setPermission (usage/vpn/notify/battery)
  - Callout سبز حریم خصوصی + کارت «درباره» (نسخه 1.0.0، معماری MVVM، وضعیت روت: بدون روت ✓ سبز، سازگاری Android 7+ نمونه‌ساز وب) + دکمه کوچک ناوبری به device
- بازنویسی کامل `src/components/gb/screens/DeviceScreen.tsx`:
  - ScreenHeader «دستگاه و برنامه» + goBack
  - کارت «مشخصات دستگاه» (Smartphone، sub تست شبیه‌ساز): ۸ ردیف — مدل، نسخه (regex محلی /Android\s+([\d.]+)/ روی UA وگرنه «وب (نمونه‌ساز)»)، هسته‌ها (fmtInt)، رم کل (fmtOne، هم‌راستا با perf.ramTotalGB=dev0.ramGB)، صفحه (ltr)، باتری (fmtPct + ⚡ یا «API در دسترس نیست»)، شبکه (networkType + StatusDot سبز/قرمز)، شبیه‌ساز
  - دو کارت وضعیت grid-cols-2: روت (ShieldCheck سبز بزرگ، glow green، «غیرفعال (بدون روت)») و تست محیط (MonitorSmartphone، شبیه‌ساز/گوشی واقعی)
  - Callout بنفش Lightbulb درباره طراحی بدون روت
  - «راهنمای سازگاری»: آکاردئون با useState(openIndex) برای Android 7-8 تا 14-15 (Chip cyan با dir ltr + تیتر بولد + chevron چرخان + توضیح text-[10px] dim؛ تایپوی «APil» به «API» اصلاح شد)
  - «معماری MVVM» (Layers): سه باکس View/ViewModel/Model با فلش ArrowDown بین آن‌ها (font-display cyan dir ltr + توضیح fa) + پانوشت جریان داده یک‌طرفه
  - Callout cyan مدیریت خطا
- هر دو فایل: "use client" خط اول، رشته‌های محلی S={fa,en}، اعداد با fmt* از lib/gb/format، کامپوننت‌ها از ../ui، toast از sonner، بدون package جدید، RTL با ps/pe و dir ltr برای متن‌های انگلیسی
- `bun run lint` پاک است (eslint بدون خطا)؛ tsc خطایی در این دو فایل ندارد (خطاهای موجود store/model/examples از قبل بوده و خارج از scope این تسک است)

Stage Summary:
- دو صفحه تنظیمات و دستگاه و برنامه کامل شد؛ هیچ فایل مشترکی (store/ui/types/i18n/globals/AppShell) تغییر نکرد.
- Confirm بازگردانی فقط UI است (resetAll بدون confirm خودش)، بعد از reset پیام موفقیت با زبان پیش از ریست نشان داده می‌شود چون resetAll زبان را به fa برمی‌گرداند.
---
Task ID: 2-d
Agent: subagent (screens — RAM + WorkManager)
Task: پیاده‌سازی کامل RamManagerScreen و WorkManagerScreen (جایگزینی stubها)

Work Log:
- `src/components/gb/screens/RamManagerScreen.tsx` بازنویسی کامل:
  - ScreenHeader «مدیریت هوشمند RAM» + goBack؛ refreshHogs/refreshCleanables روی mount
  - کارت وضعیت حافظه: GaugeRing 120 (سبز <70 / کهربایی <85 / قرمز) + ۳ StatTile مینی (مصرفی/آزاد/کل) + Chip فشار (کم/متوسط/بالا با آستانه 60/80٪)
  - کارت «بررسی پیش از اجرای بازی» فقط با selectedGameId — GAMES + gameRamNeedGB + Callout سبز/کهربایی بر اساس freeGB >= need
  - «فعالیت‌های پرمصرف»: لیست max-h-48 gb-scroll، آیکون‌ها از رشته hog.icon (Globe/Image/RefreshCw/Activity/Database/BellOff/Music/Cloud + fallback Activity)، Chip سبز «خود برنامه» / چیپ dim «سیستمی/سایر»، دکمه refresh در SectionTitle
  - NeonButton بنفش تمام‌عرض «توقف فعالیت‌های غیرضروری خود برنامه» → killOwnHogs(): toast.success + refreshHogs در صورت آزادسازی، وگرنه toast.info «فعالیتی از خود برنامه در حال اجرا نیست» + Callout سیان سیاست بدون روت
  - «پاک‌سازی فایل‌های قابل‌دسترسی»: جمع mb با fmtBytesMB + ردیف‌ها: safe (CheckCircle سبز)، shader با settings.shaderProtect (Lock کهربایی + «محافظت‌شده» / TriangleAlert قرمز + «حساس» و قابل‌کلیک)، other-cache (Lock + «محدود»)
  - «پاک‌سازی امن» سبز: اگر sensitiveConfirm && !shaderProtect → Confirm خطرناک «تأیید پاک‌سازی حساس» → cleanSafeItems()+cleanShaderCache()، وگرنه فقط cleanSafeItems؛ دکمه outline قرمز جداگانه «حذف کش Shader (خطر لگ)» هنگام shaderProtect=false → Confirm → cleanShaderCache؛ پس از هر پاک‌سازی toast + refreshCleanables
  - فوتر Chip سبز «آخرین آزادسازی: X MB» در صورت lastFreedMB + TimeBadge (lastBoostAt) + Callout کهربایی پایانی (اولویت محافظت از داده بازی)
- `src/components/gb/screens/WorkManagerScreen.tsx` بازنویسی کامل:
  - ScreenHeader «کارهای پس‌زمینه» + Chip بنفش WorkManager در اکشن + Callout بنفش Doze/صرفه‌جویی + خط dim دوم (زمان‌بندی واقعی در نمونه‌ساز)
  - لیست jobs از store با متادیتای محلی (ScanLine/Trash2/Gauge/AppWindow، عنوان‌های فارسی، desc از intervalH با fmtInt)
  - هر کارت: آیکون + عنوان text-[12px] + Switch (data-[state=checked]:bg-gb-green) → toggleJob؛ ردیف «آخرین اجرا» با fmtDateTime یا t.common.never + «اجرای بعدی» با شمارش معکوس زنده (تیکر 1ثانیه‌ای محلی، remaining = lastRun + intervalH*3600e3 − now، fmtDuration یا «به‌زودی»)؛ NeonButton sm outline cyan «اجرای فوری» → runJobNow
  - «گزارش اجرا (WorkManager Logs)»: LogList از workLogs.slice(0,30)، emptyText «هنوز اجرایی ثبت نشده»، max-h-56
  - فوتر text-[10px] dim: WorkManager + PeriodicWorkRequest با قید شارژ/شبکه
- هر دو فایل: "use client"، رشته‌های محلی S={fa,en}، اعداد با fmt* و lang، بدون package جدید، toast از sonner، بدون cross-import بین دو صفحه، عدم استفاده از `??` و `||` مخلوط
- `bun run lint` پاک؛ tsc: هیچ خطایی در این دو فایل نیست (خطاهای موجود در store/model/examples از قبل بوده و خارج از حوزه این تسک است)

Stage Summary:
- هر دو stub جایگزین شد و قرارداد API (store selectors/actions، ui components، توکن‌ها، RTL، gb-scroll) رعایت شد. هیچ فایل مشترکی تغییر نکرد.

---
Task ID: 2-b
Agent: subagent (general-purpose)
Task: MonitorScreen — صفحه «آمار / پایش عملکرد» (کامل جایگزین stub)

Work Log:
- بازنویسی کامل `src/components/gb/screens/MonitorScreen.tsx` (تنها فایل تغییر یافته؛ keep default export)
- رشته‌های محلی co-located با الگوی `const S = { fa, en }` + `const lang = useBooster(s => s.settings.lang)`؛ همه اعداد با fmtInt/fmtOne/fmtBytesMB و lang
- Header: ScreenHeader «پایش عملکرد» + onBack=goBack() + اکشن LiveBadge سبز نقطه‌دار FPS واقعی (`useFrameMonitor(true)` + store.fps؛ fps===null → «FPS --»)
- SegTabs پنج‌تایی با state محلی: CPU / RAM / دما / باتری / شبکه
- تب‌های CPU/RAM/دما (لی‌اوت مشترک): GaugeRing وسط‌چین (cpu → cyan ٪، ram → purple/red>85٪ با sub «از X گیگ»، temp → green/amber≥38.5/red≥43 از thermalState با clamp((temp−28)/24)) + دو StatTile grid-cols-2 زمینه‌ای (cpu: میانگین ۳۰ ثانیه از points.slice(-30) + چیپ وضعیت خوب/بالا؛ ram: آزاد/مصرف GB با زیرنویس درصد؛ temp: چیپ عادی/گرم/داغ + معمول ۲۸–۴۳°C) + Sparkline h-56 تاریخچه همان متریک با گارد points.length<2 → placeholder dashed h-14
- کارت «نمودار عملکرد»: SectionTitle + MultiChart سه‌خطی CPU(cyan)/RAM(green)/دما(pink) از perf.points، height 130 + نکته text-[9px] «به‌روزرسانی هر ثانیه» (فقط در تب‌های متریک)
- تب باتری: اگر batterySupported → GaugeRing سطح (رنگ <20 red / <50 amber / иначе green) + StatTile شارژ (وصل است/جدا) + Callout هوشمند (charging && temp>38 → amber هشدار، وگرنه green)؛ در غیر این‌صورت → Callout amber «باتری API در دسترس نیست…» + GaugeRing 0.82 با label ٪ و sub «شبیه‌سازی»
- تب شبکه (Network Optimizer): NeonButton بزرگ green با loading=netDiag.running → runNetDiag() (۸ پینگ واقعی /api/ping) + ۳ StatTile پینگ/جیتر/افت با رنگ‌شرطی + Sparkline نمونه‌ها (cyan, h-48, گارد ≥2) + ردیف نتیجه: Chip کیفیت (excellent/good→green، fair→amber، poor→red؛ برچسب‌ها دستی در S) + امتیاز x/100 با ProgressBar + ردیف اتصال (networkType + StatusDot آنلاین/آفلاین) + «پیشنهادهای بهبود شبکه» Calloutهای شرطی (ping>90 / jitter>15 / loss>0 / !dns.connected با دکمه outline navigate('dns') / all-good سبز) + نکته text-[9px] اندازه‌گیری RTT واقعی
- کارت «تاریخچه تست‌ها» در پایین: SectionTitle با آیکون History + لیست history در max-h-56 gb-scroll overflow-y-auto؛ هر ردیف: Chip نوع (boost سبز/network cyan/dns بنفش/session کهربایی) + خلاصه بر اساس kind با narrowing دستی data (boost→نام بازی از GAMES + freedMB با fmtBytesMB؛ network→پینگ/جیتر/افت؛ dns→نام سرور از DNS_SERVERS + ms + چیپ واقعی/تخمینی؛ session→نام بازی + میانگین FPS + افت فریم) + TimeBadge؛ empty-state متنی؛ بدون Clear-history (طبق spec)
- RTL: فقط ps/pe/ms/me و text-start استفاده شد؛ هیچ package جدیدی اضافه نشد؛ آیکون‌ها فقط lucide-react؛ بدون ترکیب ?? و || بدون پرانتز
- `bun run lint` پاک ✅ + `tsc --noEmit` بدون خطا در این فایل ✅

Stage Summary:
- MonitorScreen آماده است: FPS هدر واقعی است، پینگ واقعی به /api/ping می‌رود، باتری از Battery API واقعی مرورگر (با fallback شبیه‌سازی) می‌آید و CPU/RAM/دما از موتور شبیه‌سازی store tick می‌خوانند
- تاریخچه از store.history (persist‌شده) می‌خواند و برای هر kind سوییچ می‌زند؛ هیچ فایل مشترک (store/ui/types/i18n) تغییر نکرد
---
Task ID: 2-c
Agent: subagent (DnsScreen)
Task: پیاده‌سازی کامل صفحه DNS Changer (جایگزینی stub)

Work Log:
- بازنویسی کامل `src/components/gb/screens/DnsScreen.tsx` (فقط همین فایل؛ default export حفظ شد)
- Header: ScreenHeader «تغییر DNS / DNS Changer» + onBack→goBack + Chip پروتکل (DoH/DoT cyan)
- کارت وضعیت: glow سبز هنگام اتصال، Globe + serverLabel (text-sm font-black) + Chip متصل/قطع (dot سبز/کهربایی)، تایمر uptime زنده با state محلی یک‌ثانیه‌ای (mount-safe برای عدم mismatch در SSR) → fmtDuration، Chip پروتکل + ردیف IPها (mono/ltr/dim از DNS_SERVERS یا dns.customIp برای custom)، دکمه‌ها grid-cols-2: قطع اتصال (outline قرمز→disconnectDns) / اتصال (سبز→flow مجوز VPN) + دکمه کمکی «بهترین سرور» (applyBestDns، تا نبود نتیجه تست disable)
- Callout کهربایی همیشه‌نمایان (Info): متن دقیق VpnService/تداخل VPN + خط دوم dim درباره تست واقعی DoH و برچسب «تخمینی» (fa/en)
- SegTabs پروتکل DoH|DoT → setDnsProtocol + یادداشت text-[9px] dim
- لیست ۱۰ سرور: NeonCard p-3 با dot رنگی glow، نام بر اساس زبان، Chip منطقه (جهانی cyan/ایران green)، IPها mono ltr، چیپ‌های DoH (cyan)/DoT (purple)، تأخیر از dnsTests (fmtInt ms / ناموفق / «—» قبل تست) + Chip منبع واقعی/تخمینی، حالت انتخاب‌شده border-gb-green/50 + CheckCircle2 سبز، اسکرول داخلی gb-scroll
- Flow مجوز VPN: انتخاب سرور بدون مجوز → Confirm «مجوز VPN» → onConfirm: setPermission('vpn', true) سپس connectDns؛ با مجوز → اتصال مستقیم
- DNS دلخواه: Input dir=ltr mono با اعتبارسنجی IPv4 (regex + هر اکتت ≤255)، خطای قرمز text-[10px]، دکمه «اعمال» بنفش sm → setCustomDns + connectDns('custom', `Custom ${ip}`) (با همان flow مجوز)، نمایش IP فعلی
- مقایسه سرورها: «تست همه سرورها» (loading=dnsTestRunning→runDnsTests) + «انتخاب بهترین» پس از نتایج؛ حین تست: Loader2 + نوار shimmer + «در حال تست...»؛ نتایج صعودی (nullها آخر) با رتبه، dot، نام، ms mono، ProgressBar (1-ms/maxMs)، Chip منبع، ردیف اول glow سبز
- تاریخچه: ۳ رکورد آخر history kind==='dns' با LogList + TimeBadge
- رشته‌ها co-located در S={fa,en}؛ اعداد فقط با fmtInt/fmtDuration؛ RTL با pe-/text-start؛ import ها از "../ui" و "@/lib/gb/*"؛ بدون package جدید
- `bun run lint` → پاک (exit 0)

Stage Summary:
- صفحه DNS طبق قرارداد store/ui کامل شد؛ هیچ فایل مشترکی تغییر نکرد. دکمه دوم grid-cols-2 کارت وضعیت «بهترین سرور» (applyBestDns) است تا گرید دوستونه معنا داشته باشد.

---
Task ID: 2-a
Agent: subagent (Library screen + profile sheet)
Task: LibraryScreen کامل + GameProfileSheet (بات‌شیت پروفایل بازی)

Work Log:
- بازنویسی کامل `src/components/gb/screens/LibraryScreen.tsx` — حذف stub؛ رشته‌های محلی co-located (`const S = { fa, en }` + `lang = useBooster(s => s.settings.lang)`)
- ScreenHeader با عنوان «بازی‌های نصب‌شده» + `onBack → goBack()` + Chip بنفش کوچک "PackageManager" (dir ltr, font-mono)
- جست‌وجو: Input شاد‌کن (`@/components/ui/input`) با آیکون Search داخل wrapper نسبتی (ps-9)؛ فیلتر case-insensitive روی name یا packageId
- SegTabs فیلتر «همه / موردعلاقه» (موردعلاقه از `store.favorites`) + خط نکته PackageManager با text-[10px] text-gb-dim
- گرید `grid grid-cols-2 gap-3`: کارت NeonCard p-3 با GameIcon(44)، name (truncate 12px bold)، fmtBytesMB(sizeMB, lang)، Chip دسته (نبرد/موبا/استراتژی/مسابقه/سندباکس/ورزشی — cyan)
- دکمه ستاره absolute با کلاس منطقی `end-2 top-2` + `e.stopPropagation()` + `toggleFavorite(id)`؛ پر بودن با fill-gb-amber/text-gb-amber
- حالت انتخاب: glow="green" + Chip «انتخاب‌شده» (سبز) overlay پایین کارت؛ کارت انتخاب‌نشده در کلیک: `selectGame(id)` + `toast.success` دوزبانه + باز شدن شیت پروفایل همان بازی
- Empty state: Gamepad2 وسط‌چین + متن جدا برای «جست‌وجو بی‌نتیجه» و «موردعلاقه خالی»
- نوار اجرای بازی انتخاب‌شده: sticky bottom-0 (pinned بالای انتهای محتوا) با NeonCard glow بنفش + GameIcon + NeonButton سبز «اجرای بازی» (Play) → `startBoost(selectedGameId)`؛ بدون انتخاب مخفی
- فایل جدید `src/components/gb/GameProfileSheet.tsx` — Sheet شاد‌کن side="bottom" با wrapper استایل‌شده (bg-gb-bg border-gb-border text-gb-text rounded-t-3xl max-h-[85vh] + dir داینامیک) و بدنه gb-scroll overflow-y-auto؛ state محلی `profileGame: Game | null` در LibraryScreen
- شیت: هدر (GameIcon 52 + name + packageId mono/ltr + سایز + Chip رمDemand بالا/متوسط/کم با قرمز/کهربایی/سبز)، SectionTitle «پروفایل اختصاصی بازی» با دو SegTabs گرافیک/اولویت + ToggleRow اولویت شبکه → ذخیره با `setProfile(game.id, {...})`؛ مقدار اولیه `store.profiles[game.id] ?? (defaultProfile(game))`
- «پیشنهادهای بهینه‌سازی»: ۳ Callout محاسبه‌شده از ramDemand (X = `gameRamNeedGB(game, perf.ramTotalGB)`) + پروفایل + یک Callout کهربایی ثابت محافظت کش Shader
- «نتایج تست‌های قبلی»: فیلتر history روی kind boost/session با `"gameId" in data` (narrowing تایپ‌سیف)؛ ردیف Chip سبز بهینه‌سازی / بنفش جلسه + fmtInt(freedMB | avgFps+drops) + fmtDateTime(at, lang)؛ لیست max-h-40 gb-scroll؛ خالی → «تست ثبت نشده»
- فوتر grid-cols-2: NeonButton سبز «اجرای بازی» (startBoost + بستن شیت) و outline بنفش «بستن»
- محدودیت radix: X بستن پیش‌فرض SheetContent فیزیکی top-right است؛ برای جلوگیری از همپوشانی در RTL به هدر شیت `ps-9` (fa) / `pe-9` (en) داده شد — بدون تغییر sheet.tsx
- برای حفظ انیمیشن بستن شیت، آخرین game غیر-null در state محلی (`shown`) نگه داشته می‌شود
- lint پاک (`bun run lint`) + tsc روی دو فایل من بدون خطا (خطاهای از پیش موجود store/model/examples دست‌نخورده ماند)

Stage Summary:
- قرارداد store/ui/i18n/format دقیقاً رعایت شد؛ هیچ فایل مشترکی تغییر نکرد
- GameProfileSheet از LibraryScreen ایمپورت می‌شود (`../GameProfileSheet`) و props آن `{ game: Game | null; onClose: () => void }` است
- اعداد همه‌جا با fmtInt/fmtOne/fmtBytesMB/fmtDateTime با lang؛ آیکون‌ها فقط lucide-react؛ toast از sonner

---
Task ID: 6
Agent: main (integration)
Task: یکپارچه‌سازی نهایی، رفع باگ‌ها، پایداری DataStore، تأیید مرورگر

Work Log:
- رفع خطاهای TS فoundation: ایمپورت‌های ./types → ../types در model/*، پارامتر auto در runJobNow، فیلد platform در device، منطق sensitiveAllowed در boost flow
- رفع خطای پارس `?? x || y` در ui.tsx (Sparkline/MultiChart) با پرانتز
- رفع hydration mismatch: gate پس از mount با اسپلش نئونی در AppShell (persist + detectDevice + clock همه client-only)
- رفع پس‌زمینه سفید صفحه: افزودن bg-gb-bg به ریشه AppShell
- GameProfileSheet: جایگزینی shadcn Sheet (portal به body) با باتم‌شیت داخل قاب گوشی از طریق createPortal به #gb-phone-overlay-root
- Confirm در ui.tsx بازنویسی شد با Radix primitives + Portal container داخل قاب (دیاگرام مجوز VPN، تأیید پاک‌سازی حساس، reset)
- SessionHud: خلاصه جلسه اکنون قبل از endSession نمایش داده می‌شود (قبلاً HUD بلافاصله unmount می‌شد)
- diagnostics: ping گرم‌کننده (warm-up) قبل از اندازه‌گیری — jitter از ۲۲۹ms به ۱۰ms واقعی رسید
- پایداری DataStore گسترش یافت: dns.connected/connectedAt + lastFreedMB/lastBoostAt اکنون persist می‌شوند و پس از reload باقی می‌مانند
- تولید و جایگذاری public/gb-hero.png (لوگوی گیم‌پد نئونی) با z-ai-web-dev-sdk
- تأیید کامل با Agent Browser: BOOST ۵ مرحله‌ای (پینگ واقعی /api/ping)، SessionHUD با FPS واقعی ۶۰، خلاصه جلسه، تست DoH واقعی (کلادفلر ۳۶ms)، جریان مجوز VPN، RAM manager (+۲۱۷MB)، WorkManager اجرای فوری + لاگ، شبکه (عالی ۸۵/۱۰۰)، دوزبانگی کامل FA/EN با RTL/LTR، موبایل iPhone 14، دسکتاپ ۱۴۴۰، پایداری پس از reload
- lint: پاک | tsc: پاک | کنسول مرورگر: صفر خطا | dev.log: بدون خطای فعال

Stage Summary:
- همه ۸ صفحه + ۳ اورلی (Boost/Session/Sheet) + ۲ دیالوگ درون‌قاب کامل و تست‌شده
- قرارداد اولیه حفظ شد؛ تغییری در API صفحات نیاز نشد
- وضعیت نهایی: آماده ارائه
