"use client";

import * as React from "react";
import {
  CheckCircle2,
  Gauge,
  Globe,
  History,
  Info,
  Loader2,
  Server,
  TextCursorInput,
  Timer,
} from "lucide-react";
import { useBooster } from "@/lib/gb/store";
import { DNS_CUSTOM_ID, DNS_SERVERS } from "@/lib/gb/model/dns-servers";
import { fmtDuration, fmtInt } from "@/lib/gb/format";
import {
  Callout,
  Chip,
  Confirm,
  LogList,
  NeonButton,
  NeonCard,
  ProgressBar,
  ScreenHeader,
  SectionTitle,
  SegTabs,
} from "../ui";
import { cn } from "@/lib/utils";

/* ---------------------------------- i18n ---------------------------------- */

const S = {
  fa: {
    title: "تغییر DNS",
    noServer: "سروری انتخاب نشده",
    connected: "متصل",
    off: "قطع",
    statusHint: "برای شروع یک سرور انتخاب کنید",
    disconnect: "قطع اتصال",
    connect: "اتصال",
    bestBtn: "بهترین سرور",
    calloutMain:
      "DNS سرعت تبدیل نام دامنه را بهتر می‌کند و الزاماً پینگ داخل بازی را کاهش نمی‌دهد. اعمال DNS روی کل دستگاه نیازمند VpnService محلی اندروید است؛ در این حالت تداخل با VPNهای دیگر باید بررسی شود.",
    calloutNote:
      "تست واقعی DoH از مرورگر انجام می‌شود؛ سرورهای بدون DoH عمومی «تخمینی» برچسب می‌خورند.",
    protocolNote:
      "DoH تست مستقیم دارد؛ DoT در نسخه اندروید با VpnService اجرا می‌شود (در وب شبیه‌سازی).",
    regionGlobal: "جهانی",
    regionIran: "ایران",
    failed: "ناموفق",
    real: "واقعی",
    est: "تخمینی",
    serversTitle: "سرورهای DNS",
    serversSub: (n: string) => `${n} سرور عمومی`,
    vpnTitle: "مجوز VPN",
    vpnBody:
      "برای اعمال DNS روی کل دستگاه، اپ باید یک VpnService محلی اندروید اجرا کند. این سرویس ترافیک DNS را هدایت می‌کند و تضمینی برای عدم تداخل با VPNهای دیگر وجود ندارد. مجوز را اعطا می‌کنید؟",
    vpnConfirm: "اعطای مجوز",
    vpnCancel: "بعداً",
    customTitle: "DNS دلخواه",
    customSub: "یک سرور IPv4 دلخواه اعمال کنید",
    apply: "اعمال",
    invalidIp: "آدرس IPv4 معتبر نیست (هر بخش باید ۰ تا ۲۵۵ باشد)",
    currentCustom: "DNS دلخواه فعلی:",
    customName: "DNS دلخواه",
    compareTitle: "مقایسه سرورها",
    compareSub: "تأخیر واقعی DoH + تخمین بقیه",
    testAll: "تست همه سرورها",
    pickBest: "انتخاب بهترین",
    testing: "در حال تست...",
    historyTitle: "تاریخچه DNS",
    noHistory: "هنوز رویداد DNS ثبت نشده است",
  },
  en: {
    title: "DNS Changer",
    noServer: "No server selected",
    connected: "Connected",
    off: "Offline",
    statusHint: "Select a server to start",
    disconnect: "Disconnect",
    connect: "Connect",
    bestBtn: "Best server",
    calloutMain:
      "DNS improves domain-name resolution speed and does not necessarily reduce in-game ping. Applying DNS device-wide requires a local Android VpnService; in that case, possible conflicts with other VPNs must be checked.",
    calloutNote:
      "Real DoH tests run from the browser; servers without public DoH are labeled “Estimated”.",
    protocolNote:
      "DoH supports direct testing; DoT runs on Android via VpnService (simulated on web).",
    regionGlobal: "Global",
    regionIran: "Iran",
    failed: "Failed",
    real: "Real",
    est: "Estimated",
    serversTitle: "DNS Servers",
    serversSub: (n: string) => `${n} public servers`,
    vpnTitle: "VPN Permission",
    vpnBody:
      "To apply DNS device-wide, the app must start a local Android VpnService. It reroutes DNS traffic only, but cannot guarantee the absence of conflicts with other active VPNs. Grant permission?",
    vpnConfirm: "Grant permission",
    vpnCancel: "Later",
    customTitle: "Custom DNS",
    customSub: "Apply any IPv4 resolver",
    apply: "Apply",
    invalidIp: "Invalid IPv4 address (each octet must be 0–255)",
    currentCustom: "Current custom DNS:",
    customName: "Custom DNS",
    compareTitle: "Server comparison",
    compareSub: "Real DoH latency + estimates",
    testAll: "Test all servers",
    pickBest: "Pick best",
    testing: "Testing...",
    historyTitle: "DNS history",
    noHistory: "No DNS events yet",
  },
};

/* --------------------------------- helpers -------------------------------- */

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;

function isValidIpv4(raw: string): boolean {
  const ip = raw.trim();
  if (!IPV4_RE.test(ip)) return false;
  return ip.split(".").every((o) => Number(o) <= 255);
}

interface PendingConnect {
  id: string;
  label: string;
  customIp?: string;
}

/* ---------------------------------- screen -------------------------------- */

export default function DnsScreen() {
  const lang = useBooster((s) => s.settings.lang);
  const vpnPerm = useBooster((s) => s.settings.permissions.vpn);
  const goBack = useBooster((s) => s.goBack);
  const dns = useBooster((s) => s.dns);
  const dnsTests = useBooster((s) => s.dnsTests);
  const dnsTestRunning = useBooster((s) => s.dnsTestRunning);
  const history = useBooster((s) => s.history);
  const setPermission = useBooster((s) => s.setPermission);
  const connectDns = useBooster((s) => s.connectDns);
  const disconnectDns = useBooster((s) => s.disconnectDns);
  const setDnsProtocol = useBooster((s) => s.setDnsProtocol);
  const setCustomDns = useBooster((s) => s.setCustomDns);
  const runDnsTests = useBooster((s) => s.runDnsTests);
  const applyBestDns = useBooster((s) => s.applyBestDns);

  const t = S[lang];

  const [pending, setPending] = React.useState<PendingConnect | null>(null);
  const [customValue, setCustomValue] = React.useState("");
  const [now, setNow] = React.useState<number | null>(null);

  /* live 1s ticker for uptime (mounted-safe to avoid SSR mismatch) */
  React.useEffect(() => {
    setNow(Date.now());
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const activeSrv = DNS_SERVERS.find((s) => s.id === dns.serverId) ?? null;
  const activeIps: string[] =
    dns.serverId === DNS_CUSTOM_ID
      ? (dns.customIp ? [dns.customIp] : [])
      : activeSrv
        ? (activeSrv.ip2 ? [activeSrv.ip, activeSrv.ip2] : [activeSrv.ip])
        : [];

  const elapsed =
    dns.connected && dns.connectedAt !== null && now !== null
      ? Math.max(0, now - dns.connectedAt)
      : null;

  /* ------------------------------ connect flows ----------------------------- */

  const resolveTarget = (): PendingConnect => {
    if (dns.serverId === DNS_CUSTOM_ID) {
      return { id: DNS_CUSTOM_ID, label: dns.customIp ? `Custom ${dns.customIp}` : "Custom" };
    }
    const srv = DNS_SERVERS.find((s) => s.id === dns.serverId);
    if (srv) return { id: srv.id, label: lang === "fa" ? srv.name : srv.nameEn };
    const first = DNS_SERVERS[0];
    return { id: first.id, label: lang === "fa" ? first.name : first.nameEn };
  };

  const primaryConnect = () => {
    const target = resolveTarget();
    if (!vpnPerm) setPending(target);
    else connectDns(target.id, target.label);
  };

  const selectServer = (serverId: string) => {
    const srv = DNS_SERVERS.find((s) => s.id === serverId);
    if (!srv) return;
    const label = lang === "fa" ? srv.name : srv.nameEn;
    if (!vpnPerm) setPending({ id: srv.id, label });
    else connectDns(srv.id, label);
  };

  const confirmPending = () => {
    if (!pending) return;
    setPermission("vpn", true);
    if (pending.customIp) setCustomDns(pending.customIp);
    connectDns(pending.id, pending.label);
    setPending(null);
  };

  /* ------------------------------- custom DNS ------------------------------- */

  const customValid = isValidIpv4(customValue);
  const applyCustom = () => {
    const ip = customValue.trim();
    if (!customValid) return;
    if (!vpnPerm) {
      setPending({ id: DNS_CUSTOM_ID, label: `Custom ${ip}`, customIp: ip });
      return;
    }
    setCustomDns(ip);
    connectDns(DNS_CUSTOM_ID, `Custom ${ip}`);
  };

  /* ------------------------------ speed results ----------------------------- */

  const ranked = React.useMemo(() => {
    const arr = [...dnsTests];
    arr.sort((a, b) => {
      if (a.ms === null && b.ms === null) return 0;
      if (a.ms === null) return 1;
      if (b.ms === null) return -1;
      return a.ms - b.ms;
    });
    return arr;
  }, [dnsTests]);

  const maxMs = React.useMemo(
    () => ranked.reduce((acc, r) => (r.ms !== null && r.ms > acc ? r.ms : acc), 1),
    [ranked]
  );
  const hasResults = ranked.some((r) => r.ms !== null);

  /* --------------------------------- history -------------------------------- */

  const dnsHistory = React.useMemo(() => {
    return history
      .filter((h) => h.kind === "dns")
      .slice(0, 3)
      .map((h) => {
        const data = h.data;
        const serverId = "serverId" in data ? data.serverId : "";
        const ms = "ms" in data && typeof data.ms === "number" ? data.ms : null;
        const srv = DNS_SERVERS.find((s) => s.id === serverId);
        const name = srv
          ? (lang === "fa" ? srv.name : srv.nameEn)
          : (serverId === DNS_CUSTOM_ID ? t.customName : serverId);
        const msText = ms !== null ? `${fmtInt(ms, lang)} ms` : t.failed;
        return { id: h.id, at: h.at, message: `${name} — ${msText}`, ok: ms !== null };
      });
  }, [history, lang, t]);

  /* ---------------------------------- view ---------------------------------- */

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        title={t.title}
        onBack={goBack}
        action={<Chip color="cyan">{dns.protocol === "doh" ? "DoH" : "DoT"}</Chip>}
      />

      <div className="gb-scroll flex-1 space-y-4 overflow-y-auto px-4 pb-6 pt-4">
        {/* 2 — status */}
        <NeonCard className="p-4" glow={dns.connected ? "green" : undefined}>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl border",
                dns.connected
                  ? "border-gb-green/40 bg-gb-green/10 text-gb-green"
                  : "border-gb-border bg-gb-surface2 text-gb-cyan"
              )}
            >
              <Globe className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black text-gb-text">
                {dns.serverLabel ?? t.noServer}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                {elapsed !== null ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-gb-green">
                    <Timer className="size-3" />
                    {fmtDuration(elapsed, lang)}
                  </span>
                ) : (
                  <span className="text-[10px] text-gb-dim">{t.statusHint}</span>
                )}
              </div>
            </div>
            <Chip color={dns.connected ? "green" : "amber"} dot>
              {dns.connected ? t.connected : t.off}
            </Chip>
          </div>

          {dns.connected ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gb-border/60 pt-3">
              <Chip color={dns.protocol === "doh" ? "cyan" : "purple"}>
                {dns.protocol === "doh" ? "DoH" : "DoT"}
              </Chip>
              {activeIps.length > 0 ? (
                <span dir="ltr" className="font-mono text-[10px] text-gb-dim">
                  {activeIps.join(" · ")}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2">
            {dns.connected ? (
              <NeonButton variant="outline" color="red" onClick={disconnectDns}>
                {t.disconnect}
              </NeonButton>
            ) : (
              <NeonButton color="green" onClick={primaryConnect}>
                {t.connect}
              </NeonButton>
            )}
            <NeonButton variant="outline" color="cyan" disabled={!hasResults} onClick={applyBestDns}>
              {t.bestBtn}
            </NeonButton>
          </div>
        </NeonCard>

        {/* 3 — important callout */}
        <Callout icon={<Info className="size-4 shrink-0" />} color="amber">
          <p>{t.calloutMain}</p>
          <p className="mt-1 text-[10px] text-gb-dim">{t.calloutNote}</p>
        </Callout>

        {/* 4 — protocol */}
        <NeonCard className="p-3.5">
          <SegTabs
            items={[
              { id: "doh", label: "DoH" },
              { id: "dot", label: "DoT" },
            ]}
            value={dns.protocol}
            onChange={(id) => setDnsProtocol(id === "dot" ? "dot" : "doh")}
          />
          <p className="mt-2 text-[9px] leading-relaxed text-gb-dim">{t.protocolNote}</p>
        </NeonCard>

        {/* 5 — server list */}
        <div className="space-y-2.5">
          <SectionTitle
            icon={<Server className="size-4" />}
            title={t.serversTitle}
            sub={t.serversSub(fmtInt(DNS_SERVERS.length, lang))}
          />
          <div className="gb-scroll max-h-[26rem] space-y-2 overflow-y-auto pe-1">
            {DNS_SERVERS.map((srv) => {
              const res = dnsTests.find((r) => r.serverId === srv.id);
              const selected = dns.serverId === srv.id && dns.connected;
              const name = lang === "fa" ? srv.name : srv.nameEn;
              return (
                <NeonCard
                  key={srv.id}
                  onClick={() => selectServer(srv.id)}
                  className={cn("p-3", selected && "border-gb-green/50")}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: srv.color, boxShadow: `0 0 8px ${srv.color}` }}
                    />
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-gb-text">
                      {name}
                    </span>
                    <Chip color={srv.region === "iran" ? "green" : "cyan"}>
                      {srv.region === "iran" ? t.regionIran : t.regionGlobal}
                    </Chip>
                    {selected ? <CheckCircle2 className="size-4 shrink-0 text-gb-green" /> : null}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span dir="ltr" className="truncate font-mono text-[10px] text-gb-dim">
                      {srv.ip2 ? `${srv.ip} · ${srv.ip2}` : srv.ip}
                    </span>
                    <span className="flex shrink-0 gap-1">
                      {srv.dohUrl ? <Chip color="cyan">DoH</Chip> : null}
                      {srv.dotHost ? <Chip color="purple">DoT</Chip> : null}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    {res ? (
                      <>
                        <span
                          dir="ltr"
                          className={cn(
                            "font-mono text-[10px] font-bold",
                            res.ms !== null ? "text-gb-green" : "text-gb-amber"
                          )}
                        >
                          {res.ms !== null ? `${fmtInt(res.ms, lang)} ms` : t.failed}
                        </span>
                        <Chip color={res.source === "real" ? "green" : "amber"}>
                          {res.source === "real" ? t.real : t.est}
                        </Chip>
                      </>
                    ) : (
                      <span className="text-[10px] text-gb-dim">—</span>
                    )}
                  </div>
                </NeonCard>
              );
            })}
          </div>
        </div>

        {/* 6 — custom DNS */}
        <NeonCard className="p-4">
          <SectionTitle
            icon={<TextCursorInput className="size-4" />}
            title={t.customTitle}
            sub={t.customSub}
          />
          <div className="mt-3 flex items-start gap-2">
            <input
              dir="ltr"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="1.1.1.1"
              inputMode="decimal"
              aria-label={t.customTitle}
              className={cn(
                "h-9 min-w-0 flex-1 rounded-xl border bg-gb-surface2/70 px-3 font-mono text-xs text-gb-text outline-none transition placeholder:text-gb-dim/60",
                customValue.length > 0 && !customValid
                  ? "border-gb-red/60"
                  : "border-gb-border focus:border-gb-purple/60"
              )}
            />
            <NeonButton size="sm" color="purple" disabled={!customValid} onClick={applyCustom}>
              {t.apply}
            </NeonButton>
          </div>
          {customValue.length > 0 && !customValid ? (
            <p className="mt-1.5 text-[10px] text-gb-red">{t.invalidIp}</p>
          ) : null}
          {dns.customIp ? (
            <p className="mt-1.5 text-[10px] text-gb-dim">
              {t.currentCustom}{" "}
              <span dir="ltr" className="font-mono text-gb-text/80">
                {dns.customIp}
              </span>
            </p>
          ) : null}
        </NeonCard>

        {/* 7 — speed-test comparison */}
        <NeonCard className="p-4">
          <SectionTitle
            icon={<Gauge className="size-4" />}
            title={t.compareTitle}
            sub={t.compareSub}
          />
          <div className="mt-3 flex items-center gap-2">
            <NeonButton size="sm" color="green" loading={dnsTestRunning} onClick={runDnsTests}>
              {t.testAll}
            </NeonButton>
            {dnsTests.length > 0 ? (
              <NeonButton size="sm" color="cyan" onClick={applyBestDns}>
                {t.pickBest}
              </NeonButton>
            ) : null}
          </div>

          {dnsTestRunning ? (
            <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-gb-border bg-gb-surface2/50 px-3 py-3">
              <Loader2 className="size-4 shrink-0 animate-spin text-gb-green" />
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gb-border/50 shimmer" />
              <span className="shrink-0 text-[10px] font-bold text-gb-green">{t.testing}</span>
            </div>
          ) : null}

          {!dnsTestRunning && dnsTests.length > 0 ? (
            <div className="gb-scroll mt-3 max-h-80 space-y-1.5 overflow-y-auto pe-1">
              {ranked.map((r, i) => {
                const srv = DNS_SERVERS.find((s) => s.id === r.serverId);
                const name = srv
                  ? (lang === "fa" ? srv.name : srv.nameEn)
                  : (r.serverId === DNS_CUSTOM_ID ? t.customName : r.serverId);
                const isTop = i === 0 && r.ms !== null;
                const barVal = r.ms !== null ? Math.max(0, 1 - r.ms / maxMs) : 0;
                return (
                  <div
                    key={r.serverId}
                    className={cn(
                      "anim-fade-up rounded-xl border bg-gb-surface2/50 p-2.5",
                      isTop ? "border-gb-green/40 glow-green" : "border-gb-border"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-md font-mono text-[10px] font-black",
                          isTop ? "bg-gb-green/15 text-gb-green" : "bg-gb-border/40 text-gb-dim"
                        )}
                      >
                        {fmtInt(i + 1, lang)}
                      </span>
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{
                          background: srv?.color ?? "var(--gb-cyan)",
                          boxShadow: `0 0 6px ${srv?.color ?? "var(--gb-cyan)"}`,
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-gb-text">
                        {name}
                      </span>
                      <span
                        dir="ltr"
                        className={cn(
                          "shrink-0 font-mono text-[10px] font-bold",
                          r.ms !== null ? "text-gb-green" : "text-gb-amber"
                        )}
                      >
                        {r.ms !== null ? `${fmtInt(r.ms, lang)} ms` : t.failed}
                      </span>
                      <Chip color={r.source === "real" ? "green" : "amber"}>
                        {r.source === "real" ? t.real : t.est}
                      </Chip>
                    </div>
                    <ProgressBar className="mt-2" value={barVal} color={isTop ? "green" : "cyan"} />
                  </div>
                );
              })}
            </div>
          ) : null}
        </NeonCard>

        {/* 8 — history */}
        <NeonCard className="p-4">
          <SectionTitle icon={<History className="size-4" />} title={t.historyTitle} />
          <div className="mt-2">
            <LogList items={dnsHistory} emptyText={t.noHistory} maxH="max-h-40" />
          </div>
        </NeonCard>
      </div>

      {/* VPN permission confirm */}
      <Confirm
        open={pending !== null}
        title={t.vpnTitle}
        body={t.vpnBody}
        confirmText={t.vpnConfirm}
        cancelText={t.vpnCancel}
        onConfirm={confirmPending}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
