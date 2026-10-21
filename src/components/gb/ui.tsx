"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Game } from "@/lib/gb/types";

/* ============================== color helpers ============================== */

export type GbColor = "green" | "purple" | "cyan" | "pink" | "amber" | "red";

export const COLOR_VAR: Record<GbColor, string> = {
  green: "var(--gb-green)",
  purple: "var(--gb-purple)",
  cyan: "var(--gb-cyan)",
  pink: "var(--gb-pink)",
  amber: "var(--gb-amber)",
  red: "var(--gb-red)",
};

export const COLOR_TEXT: Record<GbColor, string> = {
  green: "text-gb-green",
  purple: "text-gb-purple",
  cyan: "text-gb-cyan",
  pink: "text-gb-pink",
  amber: "text-gb-amber",
  red: "text-gb-red",
};

/* ================================ NeonCard ================================ */

export function NeonCard({
  children,
  className,
  glow,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: GbColor | "none";
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border border-gb-border bg-gb-surface/80 backdrop-blur-sm transition-all duration-300",
        onClick && "cursor-pointer hover:border-gb-purple/40 hover:bg-gb-surface2/80 active:scale-[0.99]",
        glow === "green" && "glow-green border-gb-green/40",
        glow === "purple" && "glow-purple border-gb-purple/40",
        glow === "cyan" && "glow-cyan border-gb-cyan/40",
        glow === "none" && "shadow-none",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ============================== SectionTitle =============================== */

export function SectionTitle({
  icon,
  title,
  sub,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {icon ? (
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-gb-border bg-gb-surface2 text-gb-cyan">{icon}</span>
      ) : null}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-gb-text">{title}</h3>
        {sub ? <p className="truncate text-[11px] text-gb-dim">{sub}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ================================ GaugeRing ================================ */

export function GaugeRing({
  value, // 0..1
  label,
  sub,
  color = "green",
  size = 150,
  thickness = 10,
}: {
  value: number;
  label: React.ReactNode;
  sub?: React.ReactNode;
  color?: GbColor;
  size?: number;
  thickness?: number;
}) {
  const r = (size - thickness * 2) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const id = React.useId();
  const varColor = COLOR_VAR[color];
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={varColor} />
            <stop offset="100%" stopColor={color === "green" ? "var(--gb-cyan)" : "var(--gb-green)"} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gb-border)" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#g-${id})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)",
            filter: `drop-shadow(0 0 8px ${varColor})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-xl font-black text-gb-text">{label}</div>
          {sub ? <div className="mt-0.5 text-[10px] leading-tight text-gb-dim">{sub}</div> : null}
        </div>
      </div>
    </div>
  );
}

/* ================================ Sparkline ================================ */

export function Sparkline({
  data,
  color = "green",
  height = 48,
  fill = true,
  min,
  max,
}: {
  data: number[];
  color?: GbColor;
  height?: number;
  fill?: boolean;
  min?: number;
  max?: number;
}) {
  const w = 100;
  const pts = data.length > 1 ? data : [...data, ...data];
  const lo = min ?? Math.min(...pts) * 0.92;
  const hi = max ?? (Math.max(...pts) * 1.08 || 1);
  const span = hi - lo || 1;
  const step = w / Math.max(1, pts.length - 1);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(height - ((p - lo) / span) * height).toFixed(2)}`).join(" ");
  const area = `${d} L${w},${height} L0,${height} Z`;
  const id = React.useId();
  const vc = COLOR_VAR[color];
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`s-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={vc} stopOpacity="0.35" />
          <stop offset="100%" stopColor={vc} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill ? <path d={area} fill={`url(#s-${id})`} /> : null}
      <path d={d} fill="none" stroke={vc} strokeWidth="1.8" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 4px ${vc})` }} />
    </svg>
  );
}

/* ================================ MultiChart =============================== */

export interface ChartSeries {
  data: number[];
  color: GbColor;
  label: string;
  min?: number;
  max?: number;
}

export function MultiChart({ series, height = 130 }: { series: ChartSeries[]; height?: number }) {
  const w = 100;
  const n = Math.max(...series.map((s) => s.data.length), 2);
  const step = w / Math.max(1, n - 1);
  const gridLines = [0.25, 0.5, 0.75];
  return (
    <div>
      <div className="relative" style={{ height }}>
        {gridLines.map((g) => (
          <div key={g} className="absolute inset-x-0 border-t border-dashed border-gb-border/60" style={{ top: `${g * 100}%` }} />
        ))}
        <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {series.map((s, si) => {
            const pts = s.data;
            if (pts.length < 2) return null;
            const lo = s.min ?? Math.min(...pts) * 0.92;
            const hi = s.max ?? (Math.max(...pts) * 1.08 || 1);
            const span = hi - lo || 1;
            const d = pts
              .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(height - ((p - lo) / span) * height).toFixed(2)}`)
              .join(" ");
            const vc = COLOR_VAR[s.color];
            return (
              <path
                key={si}
                d={d}
                fill="none"
                stroke={vc}
                strokeWidth="1.8"
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 5px ${vc})` }}
              />
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-[10px] text-gb-dim">
            <span className="size-2 rounded-full" style={{ background: COLOR_VAR[s.color], boxShadow: `0 0 6px ${COLOR_VAR[s.color]}` }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ================================ StatTile ================================= */

export function StatTile({
  icon,
  title,
  value,
  sub,
  color = "cyan",
  onClick,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  color?: GbColor;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <NeonCard onClick={onClick} className={cn("p-3.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-gb-dim">{title}</span>
        {icon ? <span style={{ color: COLOR_VAR[color] }}>{icon}</span> : null}
      </div>
      <div className={cn("mt-1 text-lg font-black", COLOR_TEXT[color])}>{value}</div>
      {sub ? <div className="mt-0.5 text-[10px] leading-tight text-gb-dim">{sub}</div> : null}
    </NeonCard>
  );
}

/* ================================== Chip =================================== */

export function Chip({
  children,
  color = "cyan",
  dot = false,
  className,
}: {
  children: React.ReactNode;
  color?: GbColor;
  dot?: boolean;
  className?: string;
}) {
  const vc = COLOR_VAR[color];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold", className)}
      style={{ borderColor: `color-mix(in srgb, ${vc} 45%, transparent)`, color: vc, background: `color-mix(in srgb, ${vc} 10%, transparent)` }}
    >
      {dot ? <span className="size-1.5 rounded-full" style={{ background: vc, boxShadow: `0 0 6px ${vc}` }} /> : null}
      {children}
    </span>
  );
}

export function StatusDot({ color = "green" }: { color?: GbColor }) {
  const vc = COLOR_VAR[color];
  return (
    <span className="relative inline-flex size-2.5">
      <span className="absolute inline-flex h-full w-full rounded-full opacity-60 anim-pulse-ring" style={{ background: vc }} />
      <span className="relative inline-flex size-2.5 rounded-full" style={{ background: vc, boxShadow: `0 0 8px ${vc}` }} />
    </span>
  );
}

/* ================================ ToggleRow ================================ */

export function ToggleRow({
  icon,
  title,
  sub,
  checked,
  onChange,
  disabled,
}: {
  icon?: React.ReactNode;
  title: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-gb-border bg-gb-surface2/60 px-3.5 py-3", disabled && "opacity-50")}>
      {icon ? <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-gb-border bg-gb-surface text-gb-purple">{icon}</span> : null}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-bold text-gb-text">{title}</div>
        {sub ? <div className="mt-0.5 text-[10px] leading-relaxed text-gb-dim">{sub}</div> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} className="data-[state=checked]:bg-gb-green" />
    </div>
  );
}

/* =============================== NeonButton ================================ */

export function NeonButton({
  children,
  onClick,
  color = "purple",
  variant = "solid",
  size = "md",
  disabled,
  loading,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  color?: GbColor;
  variant?: "solid" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const vc = COLOR_VAR[color];
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-[11px]",
        size === "md" && "px-4 py-2.5 text-[13px]",
        size === "lg" && "px-5 py-3.5 text-sm",
        variant === "solid" ? "text-white" : "bg-transparent",
        className
      )}
      style={
        variant === "solid"
          ? {
              background: `linear-gradient(135deg, ${vc}, color-mix(in srgb, ${vc} 55%, #7c3aed))`,
              boxShadow: `0 0 16px color-mix(in srgb, ${vc} 45%, transparent)`,
            }
          : { border: `1px solid color-mix(in srgb, ${vc} 55%, transparent)`, color: vc }
      }
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

/* ================================= SegTabs ================================= */

export function SegTabs({
  items,
  value,
  onChange,
  className,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 rounded-xl border border-gb-border bg-gb-surface2/70 p-1", className)}>
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all duration-200",
              active ? "bg-gb-purple/25 text-gb-purple shadow-[0_0_12px_color-mix(in_srgb,var(--gb-purple)_35%,transparent)]" : "text-gb-dim hover:text-gb-text"
            )}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/* =============================== ProgressBar =============================== */

export function ProgressBar({ value, color = "green", className }: { value: number; color?: GbColor; className?: string }) {
  const vc = COLOR_VAR[color];
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-gb-border/60", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-150"
        style={{
          width: `${Math.max(0, Math.min(100, value * 100))}%`,
          background: `linear-gradient(90deg, ${vc}, color-mix(in srgb, ${vc} 60%, #fff))`,
          boxShadow: `0 0 10px ${vc}`,
        }}
      />
    </div>
  );
}

/* =============================== ScreenHeader ============================== */

export function ScreenHeader({ title, onBack, action }: { title: string; onBack?: () => void; action?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-gb-border bg-gb-bg/85 px-4 py-3 backdrop-blur-md">
      {onBack ? (
        <button onClick={onBack} className="grid size-9 place-items-center rounded-lg border border-gb-border bg-gb-surface text-gb-text transition hover:text-gb-cyan" aria-label="back">
          <ArrowRight className="size-4 rtl:rotate-180" />
        </button>
      ) : null}
      <h2 className="min-w-0 flex-1 truncate text-center text-sm font-black text-gb-text">{title}</h2>
      <div className="min-w-9">{action ?? null}</div>
    </div>
  );
}

/* ================================= LogList ================================= */

export function LogList({
  items,
  emptyText,
  maxH = "max-h-52",
}: {
  items: { id: string; at: number; message: string; ok?: boolean }[];
  emptyText: string;
  maxH?: string;
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-[11px] text-gb-dim">{emptyText}</p>;
  }
  return (
    <ul className={cn("gb-scroll space-y-1.5 overflow-y-auto pe-1", maxH)}>
      {items.map((it) => (
        <li key={it.id} className="anim-fade-up flex items-start gap-2 rounded-lg bg-gb-surface2/60 px-2.5 py-2 text-[11px]">
          {it.ok !== false ? <Check className="mt-0.5 size-3.5 shrink-0 text-gb-green" /> : null}
          <span className="flex-1 leading-relaxed text-gb-text/90">{it.message}</span>
          <TimeBadge at={it.at} />
        </li>
      ))}
    </ul>
  );
}

export function TimeBadge({ at }: { at: number }) {
  const d = new Date(at);
  const str = d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return <span className="shrink-0 font-mono text-[9px] text-gb-dim" dir="ltr">{str}</span>;
}

/* ================================= Callout ================================= */

export function Callout({ icon, children, color = "cyan" }: { icon?: React.ReactNode; children: React.ReactNode; color?: GbColor }) {
  const vc = COLOR_VAR[color];
  return (
    <div
      className="flex items-start gap-2.5 rounded-xl border px-3.5 py-3"
      style={{
        borderColor: `color-mix(in srgb, ${vc} 35%, transparent)`,
        background: `color-mix(in srgb, ${vc} 7%, transparent)`,
      }}
    >
      {icon ? <span style={{ color: vc }}>{icon}</span> : null}
      <div className="text-[11px] leading-relaxed text-gb-text/90">{children}</div>
    </div>
  );
}

/* ================================= Confirm ================================= */
/* Rendered INSIDE the phone frame via portal (#gb-phone-overlay-root) so the
   desktop device-illusion is preserved. Uses Radix primitives directly. */

export function Confirm({
  open,
  title,
  body,
  confirmText,
  cancelText,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmText: string;
  cancelText: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted || typeof document === "undefined") return null;
  const container = document.getElementById("gb-phone-overlay-root");
  if (!container) return null;
  const vc = danger ? COLOR_VAR.red : COLOR_VAR.purple;
  return (
    <AlertDialogPrimitive.Root open={open}>
      <AlertDialogPrimitive.Portal container={container}>
        <AlertDialogPrimitive.Overlay className="absolute inset-0 z-40 bg-black/60 backdrop-blur-[2px]" />
        <AlertDialogPrimitive.Content className="anim-fade-up absolute inset-x-5 top-1/2 z-50 -translate-y-1/2 rounded-2xl border border-gb-border bg-gb-surface p-5 shadow-2xl focus:outline-none">
          <AlertDialogPrimitive.Title className="text-start text-[15px] font-black text-gb-text">{title}</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-2 text-start text-[11.5px] leading-relaxed text-gb-dim">
            {body}
          </AlertDialogPrimitive.Description>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <AlertDialogPrimitive.Cancel
              onClick={onCancel}
              className="rounded-xl border border-gb-border px-4 py-2.5 text-[12px] font-bold text-gb-dim transition hover:text-gb-text"
            >
              {cancelText}
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              onClick={onConfirm}
              className="rounded-xl px-4 py-2.5 text-[12px] font-bold text-white transition active:scale-[0.97]"
              style={{ background: vc, boxShadow: `0 0 14px color-mix(in srgb, ${vc} 45%, transparent)` }}
            >
              {confirmText}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

/* ================================ TileButton =============================== */

export function TileButton({
  icon,
  title,
  sub,
  color = "cyan",
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  color?: GbColor;
  onClick: () => void;
}) {
  const vc = COLOR_VAR[color];
  return (
    <NeonCard onClick={onClick} className="flex flex-col items-center gap-1.5 p-3.5 text-center">
      <span
        className="grid size-10 place-items-center rounded-xl"
        style={{ background: `color-mix(in srgb, ${vc} 14%, transparent)`, color: vc, border: `1px solid color-mix(in srgb, ${vc} 35%, transparent)`, boxShadow: `0 0 14px color-mix(in srgb, ${vc} 25%, transparent)` }}
      >
        {icon}
      </span>
      <span className="text-[11.5px] font-bold leading-tight text-gb-text">{title}</span>
      {sub ? <span className="text-[9px] leading-tight text-gb-dim">{sub}</span> : null}
    </NeonCard>
  );
}

/* ================================= GameIcon ================================ */

export function GameIcon({ game, size = 48 }: { game: Game; size?: number }) {
  return (
    <span
      className="font-display grid shrink-0 place-items-center rounded-xl font-black text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.28,
        background: `linear-gradient(135deg, ${game.gradient[0]}, ${game.gradient[1]})`,
        boxShadow: `0 0 14px color-mix(in srgb, ${game.gradient[0]} 45%, transparent)`,
      }}
    >
      {game.initials}
    </span>
  );
}

/* ================================ LiveBadge ================================ */

export function LiveBadge({ label }: { label: string }) {
  return (
    <Chip color="green" dot>
      {label}
    </Chip>
  );
}
