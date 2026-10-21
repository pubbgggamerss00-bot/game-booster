"use client";

import * as React from "react";
import {
  BatteryLow,
  ChevronLeft,
  Database,
  Eraser,
  Gamepad2,
  Info,
  KeyRound,
  Languages,
  ShieldCheck,
  Sparkles,
  SunMoon,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useBooster } from "@/lib/gb/store";
import { fmtDateTime } from "@/lib/gb/format";
import type { Lang, ThemeMode } from "@/lib/gb/types";
import {
  Callout,
  Chip,
  Confirm,
  NeonButton,
  NeonCard,
  ScreenHeader,
  SectionTitle,
  SegTabs,
  ToggleRow,
} from "../ui";

const S = {
  fa: {
    title: "تنظیمات",
    langTitle: "زبان / Language",
    display: "نمایش",
    dark: "تاریک",
    light: "روشن",
    gameSettings: "تنظیمات بازی",
    perfMode: "حالت افزایش عملکرد",
    perfModeSub: "بهینه‌سازی در محدوده مجاز سیستم",
    bgClean: "پاک‌سازی پس‌زمینه",
    bgCleanSub: "برای افزایش عملکرد بازی‌ها",
    graphicsBoost: "بهبود گرافیک",
    graphicsBoostSub: "پیشنهاد تنظیمات گرافیکی مناسب",
    batterySaver: "حالت باتری ذخیره",
    batterySaverSub: "اولویت مصرف انرژی هنگام بازی",
    dataProtect: "محافظت داده‌ها",
    shaderProtect: "محافظت از کش Shader بازی‌ها",
    shaderProtectSub: "حذف نشدن کش برای جلوگیری از مکث و لگ",
    sensitiveConfirm: "تأیید پاک‌سازی‌های حساس",
    sensitiveConfirmSub: "درخواست تأیید کاربر پیش از حذف‌های حساس",
    dataStore: "تنظیمات ذخیره‌شده (DataStore)",
    autoSave: "ذخیره‌سازی خودکار",
    active: "فعال",
    noSaveYet: "هنوز ذخیره‌ای ثبت نشده",
    lastSave: (s: string) => `آخرین ذخیره: ${s}`,
    keysLabel: "کلیدها:",
    saveBtn: "ذخیره تنظیمات",
    resetBtn: "بازگردانی به حالت اولیه",
    resetTitle: "بازگردانی تنظیمات؟",
    resetBody: "همه تنظیمات، پروفایل بازی‌ها و تاریخچه پاک می‌شود.",
    resetConfirm: "بازگردانی",
    cancel: "انصراف",
    resetDone: "تنظیمات به حالت اولیه بازگشت ✓",
    permissions: "مدیریت مجوزها",
    permUsage: "دسترسی به آمار مصرف (Usage Access)",
    permUsageSub: "شناسایی فعالیت‌های پرمصرف — در اندروید: PACKAGE_USAGE_STATS",
    permVpn: "سرویس VPN محلی (VpnService)",
    permVpnSub: "برای اعمال DNS روی کل دستگاه",
    permNotify: "اعلان‌ها",
    permNotifySub: "نمایش وضعیت بهینه‌سازی",
    permBattery: "مستثنا از بهینه‌سازی باتری",
    permBatterySub: "اجرای پایدار در پس‌زمینه",
    privacy:
      "حریم خصوصی: همه داده‌ها فقط روی همین دستگاه ذخیره می‌شوند (localStorage به‌جای DataStore). هیچ داده شخصی ارسال نمی‌شود؛ فقط درخواست‌های تست DNS/پینگ.",
    about: "درباره",
    version: "نسخه برنامه",
    arch: "معماری",
    rootStatus: "وضعیت روت",
    noRoot: "بدون روت ✓",
    compat: "سازگاری",
    compatNote: "(نمونه‌ساز: وب)",
    openDevice: "دستگاه و برنامه",
  },
  en: {
    title: "Settings",
    langTitle: "Language / زبان",
    display: "Display",
    dark: "Dark",
    light: "Light",
    gameSettings: "Game settings",
    perfMode: "Performance boost mode",
    perfModeSub: "Boost within allowed system scope",
    bgClean: "Background cleaner",
    bgCleanSub: "To increase game performance",
    graphicsBoost: "Graphics enhancement",
    graphicsBoostSub: "Suggests suitable graphics settings",
    batterySaver: "Battery saver mode",
    batterySaverSub: "Prioritize energy use while gaming",
    dataProtect: "Data protection",
    shaderProtect: "Protect game shader cache",
    shaderProtectSub: "Keep shader cache to prevent stutters and lags",
    sensitiveConfirm: "Confirm sensitive cleanups",
    sensitiveConfirmSub: "Ask for user confirmation before sensitive deletions",
    dataStore: "Saved settings (DataStore)",
    autoSave: "Auto save",
    active: "Active",
    noSaveYet: "No save recorded yet",
    lastSave: (s: string) => `Last save: ${s}`,
    keysLabel: "Keys:",
    saveBtn: "Save settings",
    resetBtn: "Reset to defaults",
    resetTitle: "Reset settings?",
    resetBody: "All settings, game profiles and history will be cleared.",
    resetConfirm: "Reset",
    cancel: "Cancel",
    resetDone: "Settings restored to defaults ✓",
    permissions: "Permission management",
    permUsage: "Usage stats access (Usage Access)",
    permUsageSub: "Detect heavy-usage activity — Android: PACKAGE_USAGE_STATS",
    permVpn: "Local VPN service (VpnService)",
    permVpnSub: "To apply DNS to the whole device",
    permNotify: "Notifications",
    permNotifySub: "Show optimization status",
    permBattery: "Exempt from battery optimization",
    permBatterySub: "Stable background execution",
    privacy:
      "Privacy: all data is stored only on this device (localStorage instead of DataStore). No personal data is sent; only DNS/ping test requests.",
    about: "About",
    version: "App version",
    arch: "Architecture",
    rootStatus: "Root status",
    noRoot: "No root ✓",
    compat: "Compatibility",
    compatNote: "(web prototype)",
    openDevice: "Device & app",
  },
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="shrink-0 text-[11px] font-bold text-gb-dim">{label}</span>
      <span className="min-w-0 truncate text-end text-[11px] font-bold text-gb-text">{children}</span>
    </div>
  );
}

export default function SettingsScreen() {
  const lang = useBooster((s) => s.settings.lang);
  const t = S[lang];
  const settings = useBooster((s) => s.settings);
  const storeSavedAt = useBooster((s) => s.storeSavedAt);
  const setLang = useBooster((s) => s.setLang);
  const setTheme = useBooster((s) => s.setTheme);
  const patchSettings = useBooster((s) => s.patchSettings);
  const setPermission = useBooster((s) => s.setPermission);
  const saveSettingsNow = useBooster((s) => s.saveSettingsNow);
  const resetAll = useBooster((s) => s.resetAll);
  const navigate = useBooster((s) => s.navigate);
  const goBack = useBooster((s) => s.goBack);
  const [resetOpen, setResetOpen] = React.useState(false);

  return (
    <>
      <ScreenHeader title={t.title} onBack={goBack} />
      <div className="space-y-4 px-4 pb-6 pt-4">
        {/* 2) language */}
        <NeonCard className="p-3.5">
          <SectionTitle icon={<Languages className="size-4" />} title={t.langTitle} />
          <SegTabs
            className="mt-3 w-full"
            items={[
              { id: "fa", label: "فارسی" },
              { id: "en", label: "English" },
            ]}
            value={settings.lang}
            onChange={(id) => setLang(id as Lang)}
          />
        </NeonCard>

        {/* 3) display / theme */}
        <NeonCard className="p-3.5">
          <SectionTitle icon={<SunMoon className="size-4" />} title={t.display} />
          <SegTabs
            className="mt-3 w-full"
            items={[
              { id: "dark", label: t.dark },
              { id: "light", label: t.light },
            ]}
            value={settings.theme}
            onChange={(id) => setTheme(id as ThemeMode)}
          />
        </NeonCard>

        {/* 4) game settings */}
        <NeonCard className="p-3.5">
          <SectionTitle icon={<Gamepad2 className="size-4" />} title={t.gameSettings} />
          <div className="mt-3 space-y-2">
            <ToggleRow
              icon={<Zap className="size-4" />}
              title={t.perfMode}
              sub={t.perfModeSub}
              checked={settings.perfMode}
              onChange={(v) => patchSettings({ perfMode: v })}
            />
            <ToggleRow
              icon={<Eraser className="size-4" />}
              title={t.bgClean}
              sub={t.bgCleanSub}
              checked={settings.bgClean}
              onChange={(v) => patchSettings({ bgClean: v })}
            />
            <ToggleRow
              icon={<Sparkles className="size-4" />}
              title={t.graphicsBoost}
              sub={t.graphicsBoostSub}
              checked={settings.graphicsBoost}
              onChange={(v) => patchSettings({ graphicsBoost: v })}
            />
            <ToggleRow
              icon={<BatteryLow className="size-4" />}
              title={t.batterySaver}
              sub={t.batterySaverSub}
              checked={settings.batterySaver}
              onChange={(v) => patchSettings({ batterySaver: v })}
            />
          </div>
        </NeonCard>

        {/* 5) data protection */}
        <NeonCard className="p-3.5">
          <SectionTitle icon={<ShieldCheck className="size-4" />} title={t.dataProtect} />
          <div className="mt-3 space-y-2">
            <ToggleRow
              icon={<ShieldCheck className="size-4" />}
              title={t.shaderProtect}
              sub={t.shaderProtectSub}
              checked={settings.shaderProtect}
              onChange={(v) => patchSettings({ shaderProtect: v })}
            />
            <ToggleRow
              icon={<Info className="size-4" />}
              title={t.sensitiveConfirm}
              sub={t.sensitiveConfirmSub}
              checked={settings.sensitiveConfirm}
              onChange={(v) => patchSettings({ sensitiveConfirm: v })}
            />
          </div>
        </NeonCard>

        {/* 6) DataStore */}
        <NeonCard glow="purple" className="p-3.5">
          <SectionTitle icon={<Database className="size-4" />} title={t.dataStore} />
          <div className="mt-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gb-dim">{t.autoSave}</span>
              <Chip color="green" dot>
                {t.active}
              </Chip>
            </div>
            <div className="rounded-xl border border-gb-border bg-gb-surface2/60 px-3 py-2.5">
              <div className="text-[10px] leading-relaxed text-gb-dim">
                {storeSavedAt !== null ? t.lastSave(fmtDateTime(storeSavedAt, lang)) : t.noSaveYet}
              </div>
              <div className="mt-1 text-[10px] text-gb-dim opacity-80">
                {t.keysLabel}{" "}
                <span dir="ltr" className="font-mono text-[9px]">
                  settings, profiles, favorites, dns, jobs, history
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NeonButton color="purple" onClick={saveSettingsNow}>
                {t.saveBtn}
              </NeonButton>
              <NeonButton color="red" variant="outline" onClick={() => setResetOpen(true)}>
                {t.resetBtn}
              </NeonButton>
            </div>
          </div>
        </NeonCard>

        {/* 7) permissions */}
        <NeonCard className="p-3.5">
          <SectionTitle icon={<KeyRound className="size-4" />} title={t.permissions} />
          <div className="mt-3 space-y-2">
            <ToggleRow
              icon={<KeyRound className="size-4" />}
              title={t.permUsage}
              sub={t.permUsageSub}
              checked={settings.permissions.usage}
              onChange={(v) => setPermission("usage", v)}
            />
            <ToggleRow
              icon={<ShieldCheck className="size-4" />}
              title={t.permVpn}
              sub={t.permVpnSub}
              checked={settings.permissions.vpn}
              onChange={(v) => setPermission("vpn", v)}
            />
            <ToggleRow
              icon={<Info className="size-4" />}
              title={t.permNotify}
              sub={t.permNotifySub}
              checked={settings.permissions.notify}
              onChange={(v) => setPermission("notify", v)}
            />
            <ToggleRow
              icon={<BatteryLow className="size-4" />}
              title={t.permBattery}
              sub={t.permBatterySub}
              checked={settings.permissions.battery}
              onChange={(v) => setPermission("battery", v)}
            />
          </div>
        </NeonCard>

        {/* 8) privacy callout */}
        <Callout icon={<ShieldCheck className="mt-0.5 size-4 shrink-0" />} color="green">
          {t.privacy}
        </Callout>

        {/* 9) about */}
        <NeonCard className="p-3.5">
          <SectionTitle icon={<Info className="size-4" />} title={t.about} />
          <div className="mt-1 divide-y divide-gb-border/50">
            <InfoRow label={t.version}>
              <span dir="ltr">1.0.0</span>
            </InfoRow>
            <InfoRow label={t.arch}>
              <span dir="ltr" className="font-display">
                MVVM
              </span>
            </InfoRow>
            <InfoRow label={t.rootStatus}>
              <span className="text-gb-green">{t.noRoot}</span>
            </InfoRow>
            <InfoRow label={t.compat}>
              <span dir="ltr" className="font-display">
                Android 7+{" "}
              </span>
              <span className="text-[10px] font-normal text-gb-dim">{t.compatNote}</span>
            </InfoRow>
          </div>
          <button
            onClick={() => navigate("device")}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-gb-border bg-gb-surface2/60 py-2 text-[10px] font-bold text-gb-cyan transition hover:border-gb-cyan/40"
          >
            {t.openDevice}
            <ChevronLeft className="size-3.5 ltr:rotate-180" />
          </button>
        </NeonCard>
      </div>

      {/* reset confirm */}
      <Confirm
        open={resetOpen}
        title={t.resetTitle}
        body={t.resetBody}
        confirmText={t.resetConfirm}
        cancelText={t.cancel}
        danger
        onConfirm={() => {
          setResetOpen(false);
          const doneMsg = t.resetDone;
          resetAll();
          toast.success(doneMsg);
        }}
        onCancel={() => setResetOpen(false)}
      />
    </>
  );
}
