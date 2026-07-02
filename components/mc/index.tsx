"use client";

import React from "react";
import { motion } from "framer-motion";
import { Icon } from "./Icon";
import { AnimatedNumber } from "./AnimatedNumber";
import { Sparkline } from "./Sparkline";

export { Icon, ICONS } from "./Icon";
export type { IconName } from "./Icon";
export { AnimatedNumber } from "./AnimatedNumber";
export { Sparkline } from "./Sparkline";

/* ============ IA BADGE (Figma ✦) ============ */
export function IABadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}>
      <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
        <path d="M15,1 L16.3,7.7 L23,9 L16.3,10.3 L15,17 L13.7,10.3 L7,9 L13.7,7.7 Z" fill="#FF9D00" />
        <path d="M4,0 L4.8,3.2 L8,4 L4.8,4.8 L4,8 L3.2,4.8 L0,4 L3.2,3.2 Z" fill="#FF9D00" opacity="0.85" />
      </svg>
    </span>
  );
}

/* ============ PAGE HEADER ============ */
export function PageHeader({
  crumbs,
  title,
  subtitle,
  actions,
}: {
  crumbs: string[];
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mc-topbar">
      <div>
        <div className="mc-crumbs">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="sep">/</span>}
              {i === crumbs.length - 1 ? <strong>{c}</strong> : <span>{c}</span>}
            </React.Fragment>
          ))}
        </div>
        <h1 className="mc-title">{title}</h1>
        {subtitle && <div className="mc-subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="mc-topbar__actions">{actions}</div>}
    </div>
  );
}

/* ============ TABS ============ */
export function Tabs({
  tabs,
  active,
  onChange,
  warnTabs = [],
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
  warnTabs?: string[];
}) {
  return (
    <div className="mc-tabs">
      {tabs.map((t) => {
        const hasIA = t.endsWith("(IA)");
        const label = hasIA ? t.slice(0, -4).trim() : t;
        return (
          <div
            key={t}
            className={`mc-tab ${active === t ? "is-active" : ""}`}
            onClick={() => onChange(t)}
            style={{ display: "flex", alignItems: "center", gap: 5 }}
          >
            {label}
            {hasIA && <IABadge />}
            {warnTabs.includes(t) && <span className="mc-tab__dot" />}
          </div>
        );
      })}
    </div>
  );
}

/* ============ SUB-TABS ============ */
export function SubTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: "var(--mc-surface-2)",
        padding: 4,
        borderRadius: 10,
        alignSelf: "flex-start",
      }}
    >
      {tabs.map((t) => {
        const hasIA = t.endsWith("(IA)");
        const label = hasIA ? t.slice(0, -4).trim() : t;
        const isOn = active === t;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            style={{
              padding: "7px 16px",
              border: "none",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: isOn ? "var(--mc-surface)" : "transparent",
              color: isOn ? "var(--mc-green-700)" : "var(--mc-text-2)",
              boxShadow: isOn ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
              transition: "all 0.15s",
            }}
          >
            {label}
            {hasIA && <IABadge />}
          </button>
        );
      })}
    </div>
  );
}

/* ============ KPI ============ */
export function KPI({
  label,
  value,
  delta,
  trend,
  icon,
  accent,
  warn,
  ia,
  spark,
  sparkColor,
  children,
}: {
  label: string;
  value: React.ReactNode;
  delta?: React.ReactNode;
  trend?: "up" | "down" | "warn" | "flat";
  icon?: string;
  accent?: boolean;
  warn?: boolean;
  ia?: boolean;
  spark?: number[];
  sparkColor?: string;
  children?: React.ReactNode;
}) {
  const cls = accent ? "mc-kpi mc-kpi--accent" : warn ? "mc-kpi mc-kpi--warn" : "mc-kpi";
  const tcls =
    trend === "up" ? "mc-kpi__delta--up" : trend === "down" ? "mc-kpi__delta--down" : trend === "flat" ? "mc-kpi__delta--flat" : "mc-kpi__delta--warn";
  return (
    <motion.div
      className={cls}
      style={ia ? { borderColor: "#FF9D00", boxShadow: "0 0 0 1px #FF9D0044" } : undefined}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={{ y: -2 }}
    >
      {children}
      {ia ? (
        <span className="mc-kpi__glyph" style={{ background: "transparent" }}>
          <IABadge />
        </span>
      ) : (
        icon && (
          <span className="mc-kpi__glyph">
            <Icon name={icon} size={14} />
          </span>
        )
      )}
      <div className="mc-kpi__label">{label}</div>
      <div className="mc-kpi__value"><AnimatedNumber value={value} /></div>
      {delta && (
        <div className={`mc-kpi__delta ${tcls}`}>
          {trend && trend !== "flat" && <Icon name={trend === "down" ? "arrowDown" : trend === "warn" ? "alert" : "arrowUp"} size={12} />}
          {delta}
        </div>
      )}
      {spark && spark.length > 1 && (
        <div style={{ marginTop: 8 }}>
          <Sparkline data={spark} color={sparkColor || (trend === "down" ? "#c93434" : "#5e7733")} />
        </div>
      )}
    </motion.div>
  );
}

/* ============ BADGE ============ */
export function Badge({
  tone = "neutral",
  dot,
  children,
  style,
}: {
  tone?: "green" | "red" | "amber" | "orange" | "blue" | "neutral";
  dot?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span className={`mc-badge mc-badge--${tone}`} style={style}>
      {dot && <span className="mc-badge__dot"></span>}
      {children}
    </span>
  );
}

/* ============ SEGMENTED ============ */
export function Seg({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mc-seg">
      {options.map((o) => (
        <button key={o} className={value === o ? "is-on" : ""} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

/* ============ MODAL ============ */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 600,
  headTone,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  headTone?: "blue" | "red" | "green";
}) {
  if (!open) return null;
  const headBg =
    headTone === "blue"
      ? "linear-gradient(135deg, #2c6bb8, #3aa6d9)"
      : headTone === "red"
        ? "linear-gradient(135deg, #b91c1c, #c93434)"
        : headTone === "green"
          ? "linear-gradient(135deg, #4a5e29, #5e7733)"
          : undefined;
  return (
    <div className="mc-modal-backdrop" onClick={onClose}>
      <div className="mc-modal" style={{ width: `min(${width}px, 94vw)` }} onClick={(e) => e.stopPropagation()}>
        <div
          className="mc-modal__head"
          style={headBg ? { background: headBg, color: "white", borderBottom: "none" } : undefined}
        >
          <div>
            <div className="mc-modal__title" style={headBg ? { color: "white" } : undefined}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 13, marginTop: 4, opacity: headBg ? 0.85 : 1, color: headBg ? "white" : "var(--mc-text-2)" }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            className="mc-icon-btn"
            style={{ width: 30, height: 30, border: "none", background: headBg ? "rgba(255,255,255,0.18)" : undefined, color: headBg ? "white" : undefined }}
            onClick={onClose}
          >
            <Icon name="x" size={15} />
          </button>
        </div>
        <div className="mc-modal__body">{children}</div>
        {footer && <div className="mc-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ============ FEED ROW ============ */
export function FeedRow({
  ic,
  tone = "",
  title,
  meta,
  time,
}: {
  ic: string;
  tone?: "" | "orange" | "blue" | "red";
  title: string;
  meta: string;
  time: string;
}) {
  return (
    <div className="mc-feed__row">
      <div className={`mc-feed__ic ${tone ? `mc-feed__ic--${tone}` : ""}`}>
        <Icon name={ic} size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="mc-feed__title">{title}</div>
        <div className="mc-feed__meta">{meta}</div>
      </div>
      <div className="mc-feed__time">{time}</div>
    </div>
  );
}

/* ============ ALERTA ============ */
export function Alerta({
  nivel,
  title,
  body,
}: {
  nivel: "red" | "orange" | "amber" | "blue";
  title: string;
  body: string;
}) {
  const map = { red: "mc-badge--red", orange: "mc-badge--orange", amber: "mc-badge--amber", blue: "mc-badge--blue" };
  const labelMap = { red: "Crítica", orange: "Alta", amber: "Media", blue: "Info" };
  return (
    <div
      style={{
        padding: "10px 12px",
        border: "1px solid var(--mc-line)",
        borderRadius: "var(--r-sm)",
        background: "var(--mc-surface-2)",
      }}
    >
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="font-semi" style={{ fontSize: 13, color: "var(--mc-ink)" }}>
          {title}
        </div>
        <span className={`mc-badge ${map[nivel]}`}>
          <span className="mc-badge__dot"></span>
          {labelMap[nivel]}
        </span>
      </div>
      <div className="text-xs text-muted mt-4">{body}</div>
    </div>
  );
}

/* ============ PROGRESS ============ */
export function Prog({ pct, tone }: { pct: number; tone?: "orange" | "red" }) {
  return (
    <div className="mc-prog">
      <div
        className={`mc-prog__bar ${tone ? `mc-prog__bar--${tone}` : ""}`}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      ></div>
    </div>
  );
}

/* ============ EMPTY STATE ============ */
export function Empty({ icon = "box", title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="mc-empty">
      <div className="mc-empty__icon">
        <Icon name={icon} size={22} />
      </div>
      <div className="font-semi" style={{ color: "var(--mc-ink)", fontSize: 14 }}>
        {title}
      </div>
      {hint && <div className="text-sm text-muted mt-4">{hint}</div>}
    </div>
  );
}

/* ============ FIELD ============ */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mc-field">
      <label className="mc-label">{label}</label>
      {children}
      {hint && <span className="mc-hint">{hint}</span>}
    </div>
  );
}

/* ============ STEPPER (wizard sidebar) ============ */
export function WizardSteps({
  steps,
  current,
  onGo,
}: {
  steps: string[];
  current: number;
  onGo?: (i: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, padding: "8px 0" }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s}>
            <div
              onClick={() => done && onGo?.(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                cursor: done ? "pointer" : "default",
                borderLeft: active ? "3px solid var(--mc-green-600)" : "3px solid transparent",
                background: active ? "var(--mc-green-50)" : "transparent",
                borderRadius: "0 8px 8px 0",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                  background: done ? "var(--mc-green-600)" : active ? "var(--mc-green-50)" : "var(--mc-surface-3)",
                  color: done ? "white" : active ? "var(--mc-green-700)" : "var(--mc-text-3)",
                  border: active ? "1px solid var(--mc-green-500)" : "1px solid var(--mc-line)",
                }}
              >
                {done ? <Icon name="check" size={12} /> : i + 1}
              </span>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? "var(--mc-ink)" : done ? "var(--mc-green-700)" : "var(--mc-text-3)",
                  }}
                >
                  {s}
                </div>
                {done && (
                  <div style={{ fontSize: 10, color: "var(--mc-green-600)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="check" size={10} /> Completado</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============ TOAST (simple inline) ============ */
export function useToast() {
  const [toast, setToast] = React.useState<{ msg: string; tone: "ok" | "err" } | null>(null);
  const show = React.useCallback((msg: string, tone: "ok" | "err" = "ok") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3500);
  }, []);
  const node = toast ? (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 500,
        padding: "12px 20px",
        borderRadius: 12,
        background: toast.tone === "ok" ? "var(--mc-green-700)" : "var(--mc-red)",
        color: "white",
        fontSize: 13.5,
        fontWeight: 600,
        boxShadow: "var(--sh-lg)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Icon name={toast.tone === "ok" ? "check" : "alert"} size={15} />
      {toast.msg}
    </div>
  ) : null;
  return { show, node };
}
