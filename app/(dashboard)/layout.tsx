"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { Icon } from "@/components/mc/Icon";
import { Copiloto } from "@/components/Copiloto";
import OfflineSync from "@/components/OfflineSync";
import { PerfilModal, type Perfil } from "@/components/PerfilModal";
import { LoteScopeProvider, useLoteScope } from "@/components/LoteScope";

function EstablecimientoLabel() {
  const { establecimientos, establecimientoActivo, cargado } = useLoteScope();
  if (!cargado) return null;
  const txt = establecimientoActivo?.nombre || (establecimientos.length === 1 ? establecimientos[0].nombre : establecimientos.length > 1 ? `${establecimientos.length} establecimientos` : "Sin establecimiento");
  return <div className="mc-sb__estab">{txt}</div>;
}

function LoteSelectorSidebar() {
  const { establecimientos, establecimientoId, setEstablecimientoId, lotes, loteId, setLoteId } = useLoteScope();
  if (lotes.length === 0 && establecimientos.length === 0) return null;
  return (
    <div className="mc-sb__scopebox">
      {establecimientos.length > 0 && (
        <div className="mc-sb__scope">
          <Icon name="building" size={13} />
          <select value={establecimientoId} onChange={(e) => setEstablecimientoId(e.target.value)} aria-label="Establecimiento activo" title={establecimientos.find((e) => e.id === establecimientoId)?.nombre || "Todos los establecimientos"}>
            <option value="todos">Todos los establecimientos</option>
            {establecimientos.map((e) => (
              <option key={e.id} value={e.id} title={e.nombre}>{e.nombre}{e.lotesCount != null ? ` (${e.lotesCount})` : ""}</option>
            ))}
          </select>
        </div>
      )}
      {lotes.length > 0 && (
        <div className="mc-sb__scope">
          <Icon name="map" size={13} />
          <select value={loteId} onChange={(e) => setLoteId(e.target.value)} aria-label="Lote activo" title={lotes.find((l) => l.id === loteId)?.nombre || "Todos los lotes"}>
            <option value="todos">Todos los lotes</option>
            {lotes.map((l) => (
              <option key={l.id} value={l.id} title={l.nombre}>{l.nombre}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

// Etiqueta legible del módulo actual para dar contexto al copiloto
function moduloLabel(pathname: string): string {
  const hit = SEARCH_INDEX.find((s) => {
    const base = s.href.split("?")[0];
    return base !== "/dashboard" ? pathname.startsWith(base) : pathname === base;
  });
  return hit?.label || "MiCampo";
}

type NavChild = { id: string; label: string; href: string; disabled?: boolean };
type NavItem = {
  id: string;
  label: string;
  icon: string;
  type: "single" | "group";
  href?: string;
  disabled?: boolean;
  children?: NavChild[];
};

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "General",
    items: [
      { id: "inicio", label: "Inicio", icon: "dashboard", type: "single", href: "/dashboard" },
      { id: "decisiones", label: "Decisiones del día", icon: "sparkles", type: "single", href: "/decisiones" },
      { id: "establecimientos", label: "Establecimientos", icon: "building", type: "single", href: "/establecimientos" },
    ],
  },
  {
    section: "Inteligencia",
    items: [
      { id: "analitica", label: "Analítica IA", icon: "chart", type: "single", href: "/analitica" },
      { id: "vision", label: "Visión IA", icon: "camera", type: "single", href: "/vision" },
    ],
  },
  {
    section: "Producción",
    items: [
      {
        id: "agronomia",
        label: "Agronomía",
        icon: "leaf",
        type: "group",
        children: [
          { id: "campo-digital", label: "Campo Digital", href: "/campo-digital" },
          { id: "calculadora", label: "Calculadora de Dosis", href: "/calculadora-dosis" },
          { id: "clima", label: "Clima", href: "/clima" },
          { id: "plan-riego", label: "Plan de Riego", href: "/plan-riego" },
          { id: "cuaderno-campo", label: "Cuaderno de Campo", href: "/cuaderno-campo" },
        ],
      },
      {
        id: "ganaderia",
        label: "Ganadería",
        icon: "cow",
        type: "group",
        children: [
          { id: "animales", label: "Animales", href: "/animales" },
          { id: "mov-tropas", label: "Mov. de Tropas", href: "/mov-tropas" },
          { id: "prod-lechera", label: "Producción Lechera", href: "/produccion-lechera" },
          { id: "genetica", label: "Genética", href: "/ganaderia-avanzada" },
          { id: "trazabilidad", label: "Trazabilidad", href: "/trazabilidad" },
        ],
      },
    ],
  },
  {
    section: "Operaciones",
    items: [
      { id: "logistica", label: "Logística e Inventario", icon: "box", type: "single", href: "/logistica-inventario" },
      { id: "maquinaria", label: "Maquinaria y MTM", icon: "wrench", type: "single", href: "/maquinaria" },
      { id: "finanzas", label: "Finanzas", icon: "dollar", type: "single", href: "/finanzas" },
      { id: "sostenibilidad", label: "Sostenibilidad", icon: "shieldCheck", type: "single", href: "/sostenibilidad" },
      { id: "personal", label: "Personal", icon: "users", type: "single", href: "/personal" },
      { id: "calendario", label: "Calendario", icon: "calendar", type: "single", href: "/calendario" },
    ],
  },
];

// Índice de búsqueda del palette ⌘K: todas las pantallas navegables
const SEARCH_INDEX: { label: string; href: string; group: string }[] = [
  { label: "Inicio", href: "/dashboard", group: "General" },
  { label: "Establecimientos", href: "/establecimientos", group: "General" },
  { label: "Analítica IA", href: "/analitica", group: "Inteligencia" },
  { label: "Visión IA", href: "/vision", group: "Inteligencia" },
  { label: "Campo Digital", href: "/campo-digital", group: "Agronomía" },
  { label: "Lotes", href: "/campo-digital?tab=Lotes", group: "Agronomía" },
  { label: "Labores", href: "/campo-digital?tab=Labores", group: "Agronomía" },
  { label: "Cultivos", href: "/campo-digital?tab=Cultivos", group: "Agronomía" },
  { label: "Detección de Enfermedades", href: "/campo-digital?tab=Detección de Enfermedades (IA)", group: "Agronomía" },
  { label: "Calculadora de Dosis", href: "/calculadora-dosis", group: "Agronomía" },
  { label: "Clima", href: "/clima", group: "Agronomía" },
  { label: "Registro de Lluvias", href: "/clima?tab=Registro de Lluvias", group: "Agronomía" },
  { label: "Plan de Riego", href: "/plan-riego", group: "Agronomía" },
  { label: "Animales", href: "/animales", group: "Ganadería" },
  { label: "Movimiento de Tropas", href: "/mov-tropas", group: "Ganadería" },
  { label: "Producción Lechera", href: "/produccion-lechera", group: "Ganadería" },
  { label: "Genética", href: "/ganaderia-avanzada", group: "Ganadería" },
  { label: "Trazabilidad", href: "/trazabilidad", group: "Ganadería" },
  { label: "Logística e Inventario", href: "/logistica-inventario", group: "Operaciones" },
  { label: "Maquinaria y MTM", href: "/maquinaria", group: "Operaciones" },
  { label: "Finanzas", href: "/finanzas", group: "Operaciones" },
  { label: "Costos", href: "/costos", group: "Operaciones" },
  { label: "Conciliación Bancaria", href: "/conciliacion-bancaria", group: "Operaciones" },
  { label: "Comercialización", href: "/comercializacion", group: "Operaciones" },
  { label: "Arrendamientos", href: "/arrendamientos", group: "Operaciones" },
  { label: "Sostenibilidad", href: "/sostenibilidad", group: "Operaciones" },
  { label: "Personal", href: "/personal", group: "Operaciones" },
  { label: "Calendario", href: "/calendario", group: "Operaciones" },
];

// Fondo temático por módulo: cada ruta pertenece a un módulo y hereda su imagen
// de fondo (independientemente del submódulo/pestaña en la que se trabaje).
function moduloDeRuta(pathname: string): string {
  const p = pathname.split("?")[0];
  // Agricultura / Agronomía / Campo Digital → tractor en el maizal
  if (
    p.startsWith("/campo-digital") ||
    p.startsWith("/calculadora-dosis") ||
    p.startsWith("/clima") ||
    p.startsWith("/plan-riego")
  )
    return "agricultura";
  // Ganadería → vacas
  if (
    p.startsWith("/animales") ||
    p.startsWith("/mov-tropas") ||
    p.startsWith("/produccion-lechera") ||
    p.startsWith("/ganaderia-avanzada") ||
    p.startsWith("/trazabilidad")
  )
    return "ganaderia";
  // Finanzas → monedas / plantas
  if (
    p.startsWith("/finanzas") ||
    p.startsWith("/costos") ||
    p.startsWith("/conciliacion-bancaria") ||
    p.startsWith("/comercializacion") ||
    p.startsWith("/arrendamientos")
  )
    return "finanzas";
  // Maquinaria → maquinaria propia
  if (p.startsWith("/maquinaria")) return "maquinaria";
  // Logística e Inventario → logística propia
  if (p.startsWith("/logistica-inventario")) return "logistica";
  // Sostenibilidad → sostenibilidad propia
  if (p.startsWith("/sostenibilidad")) return "sostenibilidad";
  // Personal → gente / manos
  if (p.startsWith("/personal")) return "gente";
  // Inicio (dashboard) → vista aérea del campo
  if (p === "/dashboard") return "inicio";
  // Resto (Calendario): sin imagen temática (lienzo normal)
  return "general";
}

function CommandPalette({ open, onClose, onAskCopilot }: { open: boolean; onClose: () => void; onAskCopilot: (q: string) => void }) {
  const [q, setQ] = useState("");
  const router = useRouter();
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return SEARCH_INDEX;
    return SEARCH_INDEX.filter((r) => r.label.toLowerCase().includes(term) || r.group.toLowerCase().includes(term));
  }, [q]);

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  if (!open) return null;
  const term = q.trim();
  return (
    <div className="mc-modal-backdrop" style={{ alignItems: "flex-start", paddingTop: "12vh", display: "flex", justifyContent: "center" }} onClick={onClose}>
      <div className="mc-modal" style={{ width: "min(560px, 92vw)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid var(--mc-line)" }}>
          <Icon name="search" size={16} />
          <input
            autoFocus
            className="mc-input"
            style={{ border: "none", boxShadow: "none", padding: 0, fontSize: 15 }}
            placeholder="Buscar pantallas o preguntar al copiloto..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (results[0]) {
                  router.push(results[0].href);
                  onClose();
                } else if (term) {
                  onAskCopilot(term);
                  onClose();
                }
              }
              if (e.key === "Escape") onClose();
            }}
          />
          <kbd style={{ fontFamily: "var(--ff-mono)", fontSize: 10, padding: "2px 6px", background: "var(--mc-surface-2)", border: "1px solid var(--mc-line)", borderRadius: 4 }}>esc</kbd>
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto", padding: 6 }}>
          {term && (
            <button
              onClick={() => {
                onAskCopilot(term);
                onClose();
              }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, textAlign: "left", cursor: "pointer", background: "#eef1e6", marginBottom: 4 }}
            >
              <span style={{ width: 26, height: 26, borderRadius: 7, background: "#5e7733", color: "#fff", display: "grid", placeItems: "center" }}>
                <Icon name="sparkles" size={13} />
              </span>
              <span style={{ flex: 1, fontSize: 13.5, color: "var(--mc-ink)" }}>Preguntar al Copiloto: “{term}”</span>
              <span style={{ fontSize: 11, color: "var(--mc-text-3)" }}>IA</span>
            </button>
          )}
          {results.length === 0 && !term && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--mc-text-3)", fontSize: 13 }}>Sin resultados</div>
          )}
          {results.map((r) => (
            <button
              key={r.href + r.label}
              onClick={() => {
                router.push(r.href);
                onClose();
              }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, textAlign: "left", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--mc-surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ width: 26, height: 26, borderRadius: 7, background: "var(--mc-green-50)", color: "var(--mc-green-700)", display: "grid", placeItems: "center" }}>
                <Icon name="arrowRight" size={12} />
              </span>
              <span style={{ flex: 1, fontSize: 13.5, color: "var(--mc-ink)" }}>{r.label}</span>
              <span style={{ fontSize: 11, color: "var(--mc-text-3)" }}>{r.group}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TweaksPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tweaks, setTweaks] = useState({ theme: "light", palette: "natural", font: "inter", density: "compact", contrast: "normal" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("micampo:tweaks");
      if (saved) {
        const t = { contrast: "normal", ...JSON.parse(saved) };
        setTweaks(t);
        apply(t);
      }
    } catch {}
  }, []);

  const apply = (t: typeof tweaks) => {
    const r = document.documentElement;
    r.setAttribute("data-theme", t.theme);
    r.setAttribute("data-palette", t.palette);
    r.setAttribute("data-font", t.font);
    r.setAttribute("data-density", t.density);
    r.setAttribute("data-contrast", t.contrast || "normal");
  };

  const update = (k: string, v: string) => {
    const next = { ...tweaks, [k]: v };
    setTweaks(next);
    apply(next);
    try {
      localStorage.setItem("micampo:tweaks", JSON.stringify(next));
    } catch {}
  };

  if (!open) return null;

  const Row = ({ label, options, value, k }: { label: string; options: { l: string; v: string }[]; value: string; k: string }) => (
    <div className="mc-tweaks__row">
      <div className="mc-tweaks__label">{label}</div>
      <div className="mc-tweaks__opts">
        {options.map((o) => (
          <button key={o.v} className={`mc-tweaks__opt ${value === o.v ? "is-on" : ""}`} onClick={() => update(k, o.v)}>
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mc-tweaks">
      <div className="mc-tweaks__head">
        <div className="mc-tweaks__title">Preferencias</div>
        <button className="mc-icon-btn" style={{ width: 28, height: 28, border: "none" }} onClick={onClose}>
          <Icon name="x" size={14} />
        </button>
      </div>
      <div className="mc-tweaks__body">
        <Row label="Modo" k="theme" value={tweaks.theme} options={[{ l: "Claro", v: "light" }, { l: "Oscuro", v: "dark" }]} />
        <Row label="Sol (alto contraste)" k="contrast" value={tweaks.contrast} options={[{ l: "Normal", v: "normal" }, { l: "Sol", v: "sun" }]} />
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<string[]>(["agronomia"]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [perfilOpen, setPerfilOpen] = useState(false);

  useEffect(() => {
    fetch("/api/perfil").then((r) => (r.ok ? r.json() : null)).then((p) => { if (p?.id) setPerfil(p); }).catch(() => {});
  }, []);
  const [copilotoOpen, setCopilotoOpen] = useState(false);
  const [copilotoSeed, setCopilotoSeed] = useState<string | null>(null);

  const askCopilot = useCallback((q: string) => {
    setCopilotoSeed(q);
    setCopilotoOpen(true);
  }, []);

  // Abrir el grupo que contiene la ruta activa
  useEffect(() => {
    for (const section of NAV) {
      for (const item of section.items) {
        if (item.type === "group" && item.children?.some((c) => pathname.startsWith(c.href.split("?")[0]))) {
          setOpenGroups((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
        }
      }
    }
  }, [pathname]);

  // ⌘K / Ctrl+K
  const onKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setPaletteOpen((v) => !v);
    }
  }, []);
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Cerrar el drawer móvil al navegar
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // Aplicar tweaks guardados al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem("micampo:tweaks");
      if (saved) {
        const t = JSON.parse(saved);
        const r = document.documentElement;
        r.setAttribute("data-theme", t.theme || "light");
        r.setAttribute("data-palette", t.palette || "natural");
        r.setAttribute("data-font", "inter");
        r.setAttribute("data-density", t.density || "compact");
        r.setAttribute("data-contrast", t.contrast || "normal");
      }
    } catch {}
  }, []);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--mc-bg)" }}>
        <div style={{ textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MiCampo" style={{ width: 180, maxWidth: "70vw", height: "auto", objectFit: "contain", margin: "0 auto 14px", display: "block" }} />
          <p style={{ color: "var(--mc-text-2)", fontSize: 14 }}>Cargando MiCampo...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const userName = session.user?.name || "Usuario";
  const userInitials =
    userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const isActive = (href?: string) => {
    if (!href) return false;
    const path = href.split("?")[0];
    if (path === "/dashboard") return pathname === path;
    return pathname.startsWith(path);
  };

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));

  return (
    <LoteScopeProvider>
    <div className="mc-app">
      {/* Barra superior solo en móvil: abre el menú lateral */}
      <header className="mc-mbar">
        <button className="mc-mbar__btn" aria-label="Abrir menú" onClick={() => setSidebarOpen(true)}>
          <Icon name="list" size={20} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="MiCampo" className="mc-mbar__logo" />
        <span className="mc-mbar__title">{moduloLabel(pathname)}</span>
      </header>
      {sidebarOpen && <div className="mc-sb__backdrop" onClick={() => setSidebarOpen(false)} />}
      <aside className={`mc-sb ${sidebarOpen ? "is-open" : ""}`}>
        <button className="mc-sb__close" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)}>
          <Icon name="x" size={16} />
        </button>
        <div className="mc-sb__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MiCampo" className="mc-sb__logo-full" />
          <EstablecimientoLabel />
        </div>

        <div className="mc-sb__search" onClick={() => setPaletteOpen(true)}>
          <Icon name="search" size={15} />
          <span style={{ fontSize: 12.5 }}>Buscar animales, lotes...</span>
          <kbd>⌘K</kbd>
        </div>

        <LoteSelectorSidebar />

        {NAV.map((section) => (
          <div className="mc-sb__section" key={section.section}>
            <div className="mc-sb__section-label">{section.section}</div>
            {section.items.map((item) => {
              if (item.type === "single") {
                const active = isActive(item.href);
                return (
                  <div
                    key={item.id}
                    className={`mc-sb__item ${active ? "is-active" : ""} ${item.disabled ? "is-disabled" : ""}`}
                    onClick={() => !item.disabled && item.href && router.push(item.href)}
                    style={item.disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                  >
                    <span className="mc-sb__item-icon">
                      <Icon name={item.icon} size={17} />
                    </span>
                    <span>{item.label}</span>
                    {item.disabled && (
                      <span style={{ marginLeft: "auto", fontSize: 9, letterSpacing: "0.08em", color: "var(--mc-text-3)", textTransform: "uppercase" }}>
                        pronto
                      </span>
                    )}
                  </div>
                );
              }
              const isOpen = openGroups.includes(item.id);
              const childActive = item.children?.some((c) => isActive(c.href));
              return (
                <div key={item.id}>
                  <div className={`mc-sb__item ${isOpen || childActive ? "is-open" : ""}`} onClick={() => toggleGroup(item.id)}>
                    <span className="mc-sb__item-icon">
                      <Icon name={item.icon} size={17} />
                    </span>
                    <span>{item.label}</span>
                    <span className="mc-sb__item-chev">
                      <Icon name="chevRight" size={14} />
                    </span>
                  </div>
                  {isOpen && (
                    <div className="mc-sb__sub">
                      {item.children?.map((c) => (
                        <div
                          key={c.id}
                          className={`mc-sb__subitem ${isActive(c.href) ? "is-active" : ""}`}
                          onClick={() => !c.disabled && router.push(c.href)}
                          style={c.disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                        >
                          <span>{c.label}</span>
                          {c.disabled && (
                            <span style={{ marginLeft: "auto", fontSize: 9, letterSpacing: "0.08em", color: "var(--mc-text-3)", textTransform: "uppercase" }}>
                              pronto
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div className="mc-sb__foot">
          <button className="mc-sb__avatar" title="Tu perfil" onClick={() => setPerfilOpen(true)} style={{ overflow: "hidden", border: "none", cursor: "pointer", padding: 0 }}>
            {perfil?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={perfil.image} alt="Perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : userInitials}
          </button>
          <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setPerfilOpen(true)}>
            <div className="mc-sb__user-name">{perfil?.name || userName}</div>
            <div className="mc-sb__user-role">Ver perfil</div>
          </div>
          <button className="mc-icon-btn" title="Preferencias" style={{ width: 28, height: 28 }} onClick={() => setTweaksOpen(!tweaksOpen)}>
            <Icon name="settings" size={14} />
          </button>
          <button className="mc-icon-btn" title="Cerrar sesión" style={{ width: 28, height: 28 }} onClick={() => signOut({ callbackUrl: "/login" })}>
            <Icon name="logout" size={14} />
          </button>
        </div>
      </aside>

      <main className="mc-main" data-modulo={moduloDeRuta(pathname)}>{children}</main>

      <OfflineSync />
      <PerfilModal open={perfilOpen} onClose={() => setPerfilOpen(false)} perfil={perfil} onSaved={setPerfil} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onAskCopilot={askCopilot} />
      <TweaksPanel open={tweaksOpen} onClose={() => setTweaksOpen(false)} />
      <Copiloto
        open={copilotoOpen}
        setOpen={setCopilotoOpen}
        seed={copilotoSeed}
        onSeedConsumed={() => setCopilotoSeed(null)}
        modulo={moduloLabel(pathname)}
      />
    </div>
    </LoteScopeProvider>
  );
}
