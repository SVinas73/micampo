// Shell.jsx - Sidebar + TopBar + Layout

const NAV = [
  { id: "inicio", label: "Inicio", icon: "dashboard", type: "single" },
  {
    id: "agronomia",
    label: "Agronomía",
    icon: "leaf",
    type: "group",
    children: [
      { id: "campo-digital", label: "Campo Digital", icon: "sprout" },
      { id: "calculadora", label: "Calculadora de Dosis", icon: "flask" },
      { id: "clima", label: "Clima", icon: "cloud" },
      { id: "plan-riego", label: "Plan de Riego", icon: "droplet" },
    ]
  },
  {
    id: "ganaderia",
    label: "Ganadería",
    icon: "cow",
    type: "group",
    children: [
      { id: "animales", label: "Animales", icon: "heart" },
      { id: "mov-tropas", label: "Mov. de Tropas", icon: "route" },
      { id: "prod-lechera", label: "Producción Lechera", icon: "droplet", disabled: true },
      { id: "engorde", label: "Engorde", icon: "scale", disabled: true },
      { id: "genetica", label: "Genética", icon: "beaker", disabled: true },
      { id: "trazabilidad", label: "Trazabilidad", icon: "tag", disabled: true },
    ]
  },
  { id: "logistica", label: "Logística e Inventario", icon: "box", type: "single", disabled: true },
  { id: "maquinaria", label: "Maquinaria y MTM", icon: "wrench", type: "single", disabled: true },
  { id: "finanzas", label: "Finanzas", icon: "dollar", type: "single", disabled: true },
  { id: "sostenibilidad", label: "Sostenibilidad", icon: "shieldCheck", type: "single", disabled: true },
  { id: "personal", label: "Personal", icon: "users", type: "single", disabled: true },
  { id: "calendario", label: "Calendario", icon: "calendar", type: "single", disabled: true },
];

// Map route → { module, tab }
const ROUTE_INFO = {
  "inicio": { group: "Inicio", crumb: ["MiCampo", "Inicio"] },
  "campo-digital": { group: "Agronomía", sub: "Campo Digital", crumb: ["Agronomía", "Campo Digital"], tabs: ["Resumen","Planificador de Siembras","Lotes","Cultivos","Detección de Enfermedades","Labores"] },
  "calculadora": { group: "Agronomía", sub: "Calculadora de Dosis", crumb: ["Agronomía", "Calculadora"], tabs: ["Inicio","Nuevo Cálculo","Historial","Preestablecidos"] },
  "clima": { group: "Agronomía", sub: "Clima", crumb: ["Agronomía", "Clima"], tabs: ["Inicio","Registro de Lluvias","Alertas","Estación"] },
  "plan-riego": { group: "Agronomía", sub: "Plan de Riego", crumb: ["Agronomía", "Plan de Riego"], tabs: ["Resumen","Programación","Sectores"] },
  "animales": { group: "Ganadería", sub: "Animales", crumb: ["Ganadería", "Animales"], tabs: ["Resumen","Ganado","Peso","Nutrición","Reproducción","Sanidad","Timeline"] },
  "mov-tropas": { group: "Ganadería", sub: "Movimiento de Tropas", crumb: ["Ganadería", "Mov. de Tropas"], tabs: ["Resumen","Gestión"] },
};

function SidebarItem({ item, active, openGroup, onNav, onToggle, variant }) {
  if (item.type === "single") {
    return (
      <div
        className={`mc-sb__item ${active === item.id ? "is-active" : ""} ${item.disabled ? "is-disabled" : ""}`}
        onClick={() => !item.disabled && onNav(item.id)}
        style={item.disabled ? { opacity: 0.5, cursor: "not-allowed" } : null}
      >
        <span className="mc-sb__item-icon"><Icon name={item.icon} size={17} /></span>
        <span>{item.label}</span>
        {item.disabled && <span style={{ marginLeft: "auto", fontSize: 9, letterSpacing: "0.08em", color: "var(--mc-text-3)", textTransform: "uppercase" }}>pronto</span>}
      </div>
    );
  }
  const isOpen = openGroup === item.id;
  const childActive = item.children?.some(c => c.id === active);
  return (
    <>
      <div
        className={`mc-sb__item ${isOpen || childActive ? "is-open" : ""}`}
        onClick={() => onToggle(item.id)}
      >
        <span className="mc-sb__item-icon"><Icon name={item.icon} size={17} /></span>
        <span>{item.label}</span>
        <span className="mc-sb__item-chev"><Icon name="chevRight" size={14} /></span>
      </div>
      {isOpen && (
        <div className="mc-sb__sub">
          {item.children.map(c => (
            <div
              key={c.id}
              className={`mc-sb__subitem ${active === c.id ? "is-active" : ""}`}
              onClick={() => !c.disabled && onNav(c.id)}
              style={c.disabled ? { opacity: 0.5, cursor: "not-allowed" } : null}
            >
              <span>{c.label}</span>
              {c.disabled && <span style={{ marginLeft: "auto", fontSize: 9, letterSpacing: "0.08em", color: "var(--mc-text-3)", textTransform: "uppercase" }}>pronto</span>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Sidebar({ active, onNav, variant }) {
  const { useState } = React;
  const initialGroup = React.useMemo(() => {
    const g = NAV.find(n => n.type === "group" && n.children?.some(c => c.id === active));
    return g?.id || "agronomia";
  }, [active]);
  const [openGroup, setOpenGroup] = useState(initialGroup);

  React.useEffect(() => {
    const g = NAV.find(n => n.type === "group" && n.children?.some(c => c.id === active));
    if (g) setOpenGroup(g.id);
  }, [active]);

  return (
    <aside className="mc-sb">
      <div className="mc-sb__brand">
        <div className="mc-sb__logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3c-3 4-4 8-4 11a4 4 0 0 0 8 0c0-3-1-7-4-11z"/>
            <path d="M12 14v7"/>
          </svg>
        </div>
        <div>
          <div className="mc-sb__brand-name">MiCampo</div>
          <div className="mc-sb__brand-sub">Est. Don Ramón</div>
        </div>
      </div>

      <div className="mc-sb__search">
        <Icon name="search" size={15} />
        <span style={{ fontSize: 12.5 }}>Buscar animales, lotes...</span>
        <kbd>⌘K</kbd>
      </div>

      <div className="mc-sb__section">
        <div className="mc-sb__section-label">General</div>
        {NAV.slice(0, 1).map(item => (
          <SidebarItem key={item.id} item={item} active={active} openGroup={openGroup} onNav={onNav} onToggle={g => setOpenGroup(openGroup === g ? null : g)} variant={variant} />
        ))}
      </div>

      <div className="mc-sb__section">
        <div className="mc-sb__section-label">Producción</div>
        {NAV.slice(1, 3).map(item => (
          <SidebarItem key={item.id} item={item} active={active} openGroup={openGroup} onNav={onNav} onToggle={g => setOpenGroup(openGroup === g ? null : g)} variant={variant} />
        ))}
      </div>

      <div className="mc-sb__section">
        <div className="mc-sb__section-label">Operaciones</div>
        {NAV.slice(3).map(item => (
          <SidebarItem key={item.id} item={item} active={active} openGroup={openGroup} onNav={onNav} onToggle={g => setOpenGroup(openGroup === g ? null : g)} variant={variant} />
        ))}
      </div>

      <div className="mc-sb__foot">
        <div className="mc-sb__avatar">JR</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="mc-sb__user-name">Juan Rodríguez</div>
          <div className="mc-sb__user-role">Administrador · Don Ramón</div>
        </div>
        <button className="mc-icon-btn" title="Configuración" style={{ width: 28, height: 28 }}>
          <Icon name="settings" size={14} />
        </button>
      </div>
    </aside>
  );
}

function PageHeader({ crumbs, title, subtitle, actions }) {
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

function Tabs({ tabs, active, onChange, warnTabs = [] }) {
  return (
    <div className="mc-tabs">
      {tabs.map(t => {
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
            {hasIA && <IABadge/>}
            {warnTabs.includes(t) && <span className="mc-tab__dot" />}
          </div>
        );
      })}
    </div>
  );
}

function SubTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, background: "var(--mc-surface-2)", padding: 4, borderRadius: 10, alignSelf: "flex-start" }}>
      {tabs.map(t => {
        const hasIA = t.endsWith("(IA)");
        const label = hasIA ? t.slice(0, -4).trim() : t;
        const isOn = active === t;
        return (
          <button key={t}
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
            }}>
            {label}
            {hasIA && <IABadge/>}
          </button>
        );
      })}
    </div>
  );
}

function IABadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}>
      <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
        {/* Main large star */}
        <path d="M15,1 L16.3,7.7 L23,9 L16.3,10.3 L15,17 L13.7,10.3 L7,9 L13.7,7.7 Z" fill="#FF9D00"/>
        {/* Small accent star top-left */}
        <path d="M4,0 L4.8,3.2 L8,4 L4.8,4.8 L4,8 L3.2,4.8 L0,4 L3.2,3.2 Z" fill="#FF9D00" opacity="0.85"/>
      </svg>
    </span>
  );
}

window.Sidebar = Sidebar;
window.PageHeader = PageHeader;
window.Tabs = Tabs;
window.SubTabs = SubTabs;
window.IABadge = IABadge;
window.NAV = NAV;
window.ROUTE_INFO = ROUTE_INFO;
