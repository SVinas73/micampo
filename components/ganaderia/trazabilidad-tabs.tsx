"use client";

// Tabs del módulo Trazabilidad: Resumen, Identificación Electrónica,
// Documentos de Tránsito y Movimientos, Auditoría. Todo derivado de datos
// reales (/api/animales, /api/documentos-transito, /api/auditorias-trazabilidad).

import { useState } from "react";
import { KPI, Icon } from "@/components/mc";
import { AnimalRow } from "./tipos";
import { TropaAPI } from "./tropas-tipos";
import {
  ActItem,
  AuditoriaApi,
  ConfigPais,
  DTEApi,
  Incumpl,
  TernPend,
  actividadReciente,
  badgeDias,
  dteAbierto,
  dteEstadoView,
  esMismoMes,
  fmtDDMMYYYY,
  incumplimientos,
  resultadoTone,
} from "./trazabilidad-tipos";
import { ModalNuevoDTE, ModalRegistrarAplicacion, ModalRegistrarAuditoria } from "./trazabilidad-modales";

const pctIdentificados = (animales: AnimalRow[]) => {
  const activos = animales.filter((a) => a.activo);
  const conRfid = activos.filter((a) => a.rfid);
  return { total: activos.length, con: conRfid.length, sin: activos.length - conRfid.length, pct: activos.length ? Math.round((conRfid.length / activos.length) * 100) : 0 };
};

/* ============ RESUMEN ============ */
export function TrazaResumen({
  cfg,
  animales,
  terneros,
  dtes,
  auditorias,
  onRefresh,
}: {
  cfg: ConfigPais;
  animales: AnimalRow[];
  terneros: TernPend[];
  dtes: DTEApi[];
  auditorias: AuditoriaApi[];
  onRefresh: () => void;
}) {
  const [modalDeclarar, setModalDeclarar] = useState(false);
  const ident = pctIdentificados(animales);
  const dteAbiertos = dtes.filter(dteAbierto).length;
  const vencidos = terneros.filter((t) => t.dias < 0).length;
  const dtesVencidos = dtes.filter((d) => d.estado === "Vencido").length;
  const alertas = vencidos + dtesVencidos;

  // Plazos y vencimientos: terneros + DTE vigentes con vencimiento, ordenados por urgencia
  const [hoy] = useState(() => Date.now());
  const plazos = [
    ...terneros.map((t) => ({ tipo: "identificacion", desc: `${t.id} — vencimiento de identificación`, ref: t.cat, dias: t.dias })),
    ...dtes
      .filter((d) => d.estado === "Vigente" && d.vencimiento)
      .map((d) => ({ tipo: "dte", desc: `${cfg.documentoTransito} sin cerrar`, ref: `N° ${d.numero}`, dias: Math.round((new Date(d.vencimiento!).getTime() - hoy) / 86400000) })),
  ]
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 8);

  const actividad = actividadReciente(dtes, auditorias);

  return (
    <div className="col gap-20">
      <div className="grid g-cols-5">
        <KPI label="Identificación Electrónica" value={`${ident.pct}%`} delta={`${ident.con} de ${ident.total} con dispositivo vigente`} icon="tag" />
        <KPI label="Terneros por Identificar" value={String(terneros.length)} delta="activos sin dispositivo RFID" trend="warn" icon="alert-triangle" />
        <KPI label={`${cfg.documentoTransito} Abiertos`} value={String(dteAbiertos)} delta="pendientes de cierre" trend={dteAbiertos > 0 ? "warn" : "up"} icon="route" />
        <KPI label={`${cfg.identificadorEstablecimiento} / ${cfg.sistema}`} value={cfg.sistema} delta={`${cfg.organismo} · ${cfg.pais}`} trend="up" icon="shieldCheck" />
        <KPI label="Alertas Activas" value={String(alertas)} delta={alertas > 0 ? "vencimientos sin resolver" : "sin alertas de cumplimiento"} trend={alertas > 0 ? "down" : "up"} icon="alert" />
      </div>
      <div className="row gap-8" style={{ justifyContent: "flex-end" }}>
        <button className="mc-btn mc-btn--ghost" onClick={onRefresh}><Icon name="refresh" size={14} />Actualizar</button>
        <button className="mc-btn mc-btn--primary" onClick={() => setModalDeclarar(true)}><Icon name="plus" size={14} />Registrar Identificación</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "65fr 35fr", gap: 16, alignItems: "start" }}>
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="mc-card__head" style={{ padding: "16px 20px 10px", marginBottom: 0 }}>
            <div>
              <div className="mc-card__title">Plazos y Vencimientos</div>
              <div className="text-xs text-muted mt-2">Ordenados por urgencia, más críticos primero</div>
            </div>
          </div>
          <div className="col gap-8" style={{ padding: "12px 16px 16px" }}>
            {plazos.length === 0 && <div className="text-sm text-muted" style={{ padding: "18px 4px" }}>Sin plazos próximos — todo al día.</div>}
            {plazos.map((p, i) => {
              const b = badgeDias(p.dias);
              const icon = p.tipo === "identificacion" ? "tag" : "route";
              return (
                <div key={i} className="row gap-10" style={{ alignItems: "center", padding: "9px 10px", border: "1px solid var(--mc-line)", borderRadius: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--mc-surface-2)", color: "var(--mc-text-2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon name={icon} size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{p.desc}</div>
                    <div className="text-xs text-muted">{p.ref}</div>
                  </div>
                  <span className={`mc-badge mc-badge--${b.tone}`}>{b.label}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mc-card">
          <div className="mc-card__head">
            <div>
              <div className="mc-card__title">Actividad Reciente {cfg.sistema}</div>
              <div className="text-xs text-muted mt-2">Últimos movimientos y auditorías</div>
            </div>
          </div>
          <div className="col gap-8">
            {actividad.length === 0 && <div className="text-sm text-muted" style={{ padding: "12px 2px" }}>Sin actividad registrada aún.</div>}
            {actividad.map((a: ActItem, i) => (
              <div key={i} style={{ padding: 10, border: "1px solid var(--mc-line)", borderRadius: 8 }}>
                <div className="row gap-10">
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--mc-green-50)", color: "var(--mc-green-600)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon name={a.tipo} size={12} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{a.accion}</div>
                    <div className="text-xs text-muted">{a.fecha}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {modalDeclarar && <ModalRegistrarAplicacion cfg={cfg} terneros={terneros} onClose={() => setModalDeclarar(false)} onGuardado={onRefresh} />}
    </div>
  );
}

/* ============ IDENTIFICACIÓN ELECTRÓNICA ============ */
export function TrazaIdentificacion({
  cfg,
  animales,
  terneros,
  onRefresh,
}: {
  cfg: ConfigPais;
  animales: AnimalRow[];
  terneros: TernPend[];
  onRefresh: () => void;
}) {
  const [modalNueva, setModalNueva] = useState<TernPend | null | false>(false);
  const ident = pctIdentificados(animales);
  const vencidos = terneros.filter((t) => t.dias < 0).length;
  const proximosVencer = terneros.filter((t) => t.dias >= 0 && t.dias < 3).length;

  return (
    <div className="col gap-20">
      <div className="grid g-cols-5">
        <KPI label="Animales con Dispositivo" value={String(ident.con)} delta={`${ident.pct}% del rodeo activo`} trend="up" icon="tag" />
        <KPI label="Terneros Pendientes de Identificar" value={String(terneros.length)} delta="activos sin dispositivo RFID" trend="warn" icon="alert-triangle" />
        <KPI label="Rodeo Activo" value={String(ident.total)} delta="animales bajo trazabilidad" trend="up" icon="cow" />
        <KPI label="Vencidos sin Declarar" value={String(vencidos)} delta={vencidos > 0 ? "requieren declaración inmediata" : "sin vencidos"} trend={vencidos > 0 ? "down" : "up"} icon="alert" />
        <KPI label="Próximos a Vencer (<3 días)" value={String(proximosVencer)} delta="dentro de los próximos 3 días" trend={proximosVencer > 0 ? "warn" : "up"} icon="clock" />
      </div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--mc-ink)", fontFamily: "var(--ff-display)" }}>Identificación Electrónica</div>
          <div className="text-xs text-muted mt-4">Dispositivos RFID aplicados y pendientes de declaración ante {cfg.organismo}</div>
        </div>
        <button className="mc-btn mc-btn--primary" onClick={() => setModalNueva(null)}><Icon name="plus" size={14} />Registrar Identificación</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "65fr 35fr", gap: 16, alignItems: "start" }}>
        <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="mc-card__head" style={{ padding: "16px 20px 10px", marginBottom: 0 }}>
            <div>
              <div className="mc-card__title">Terneros Pendientes de Identificar</div>
              <div className="text-xs text-muted mt-2">Activos sin dispositivo aplicado, por urgencia</div>
            </div>
          </div>
          {terneros.length === 0 ? (
            <div className="text-sm text-muted" style={{ padding: "22px 20px" }}>No hay terneros pendientes de identificar. Todo el rodeo tiene dispositivo.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="mc-table">
                <thead>
                  <tr>
                    <th>Caravana</th><th>Categoría</th><th>Nacimiento</th>
                    <th style={{ textAlign: "right" }}>Días Restantes</th><th>Estado</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {terneros.map((t) => {
                    const b = badgeDias(t.dias);
                    const estadoTone = b.tone === "red" ? "red" : b.tone === "amber" ? "amber" : "neutral";
                    return (
                      <tr key={t.animal.dbId}>
                        <td className="mc-cell--mono">{t.id}</td>
                        <td>{t.cat}</td>
                        <td className="mc-cell--mono">{t.nacimiento}</td>
                        <td style={{ textAlign: "right" }}>
                          {t.edadDias == null ? <span className="text-xs text-muted">Sin fecha de nac.</span> : <span className={`mc-badge mc-badge--${b.tone}`}>{b.label}</span>}
                          {t.razon && t.edadDias != null && <div className="text-xs text-muted mt-2">{t.razon}</div>}
                        </td>
                        <td><span className={`mc-badge mc-badge--${estadoTone}`}>{t.estado}</span></td>
                        <td><button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => setModalNueva(t)}>Registrar →</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="mc-card">
          <div className="mc-card__head">
            <div>
              <div className="mc-card__title">Resumen de Identificación</div>
              <div className="text-xs text-muted mt-2">Cobertura de dispositivos en el rodeo</div>
            </div>
          </div>
          <div className="col gap-10">
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--mc-ink)", fontFamily: "var(--ff-display)" }}>{ident.pct}% <span style={{ fontSize: 14, fontWeight: 500, color: "var(--mc-text-3)" }}>identificado</span></div>
              <div className="text-xs text-muted mt-4">{ident.con} de {ident.total} animales activos con dispositivo</div>
            </div>
            <div style={{ height: 8, borderRadius: 6, background: "var(--mc-surface-2)", overflow: "hidden" }}>
              <div style={{ width: `${ident.pct}%`, height: "100%", background: "var(--mc-green-600)", transition: "width .3s ease" }} />
            </div>
            <div style={{ padding: "8px 10px", background: "var(--mc-surface-2)", borderRadius: 8 }}>
              <div className="text-xs text-muted">Sin dispositivo</div>
              <div className="font-semi" style={{ color: ident.sin > 0 ? "var(--mc-red)" : "var(--mc-ink)" }}>{ident.sin} animales</div>
            </div>
            <div className="text-xs text-muted">Regla {cfg.pais}: identificar antes de los {cfg.edadLimiteDias} días de edad.</div>
          </div>
        </div>
      </div>
      {modalNueva !== false && <ModalRegistrarAplicacion cfg={cfg} terneros={terneros} ternInicial={modalNueva} onClose={() => setModalNueva(false)} onGuardado={onRefresh} />}
    </div>
  );
}

/* ============ DOCUMENTOS DE TRÁNSITO Y MOVIMIENTOS ============ */
export function TrazaDTE({
  cfg,
  dtes,
  tropas,
  onRefresh,
}: {
  cfg: ConfigPais;
  dtes: DTEApi[];
  tropas: TropaAPI[];
  onRefresh: () => void;
}) {
  const [modalNuevo, setModalNuevo] = useState(false);
  const [ahora] = useState(() => new Date());

  const abiertos = dtes.filter(dteAbierto).length;
  const cerrados = dtes.filter((d) => d.estado === "Usado" && esMismoMes(d.fecha, ahora)).length;
  const animalesMovilizados = dtes.filter((d) => esMismoMes(d.fecha, ahora)).reduce((s, d) => s + (d.cabezas || 0), 0);
  const vencidos = dtes.filter((d) => d.estado === "Vencido").length;

  const cerrarDTE = async (id: string) => {
    try {
      const r = await fetch(`/api/documentos-transito/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "Usado" }),
      });
      if (r.ok) onRefresh();
    } catch {}
  };

  const eliminarDTE = async (id: string) => {
    if (!confirm("¿Eliminar este documento de tránsito?")) return;
    try {
      const r = await fetch(`/api/documentos-transito/${id}`, { method: "DELETE" });
      if (r.ok) onRefresh();
    } catch {}
  };

  return (
    <div className="col gap-20">
      <div className="grid g-cols-5">
        <KPI label={`${cfg.documentoTransito} Abiertos`} value={String(abiertos)} delta="en tránsito / sin cerrar" trend={abiertos > 0 ? "warn" : "up"} icon="route" />
        <KPI label={`${cfg.documentoTransito} Cerrados (mes)`} value={String(cerrados)} delta="movimientos completados" trend="up" icon="check" />
        <KPI label="Animales Movilizados (mes)" value={String(animalesMovilizados)} delta="cabezas movidas este mes" trend="up" icon="truck" />
        <KPI label="Vencidos" value={String(vencidos)} delta={vencidos > 0 ? "regularizar antes de repetir movimiento" : "todos vigentes"} trend={vencidos > 0 ? "down" : "up"} icon="alert" />
        <KPI label={`Identificador: ${cfg.identificadorEstablecimiento}`} value={cfg.sistema} delta="sistema de trazabilidad vigente" trend="up" icon="shieldCheck" />
      </div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--mc-ink)", fontFamily: "var(--ff-display)" }}>{cfg.documentoTransito} y Movimientos</div>
          <div className="text-xs text-muted mt-4">{cfg.documentoTransito} — obligatorios para todo movimiento de hacienda</div>
        </div>
        <button className="mc-btn mc-btn--primary" onClick={() => setModalNuevo(true)}><Icon name="plus" size={14} />Nuevo {cfg.documentoTransito}</button>
      </div>
      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        {dtes.length === 0 ? (
          <div className="text-sm text-muted" style={{ padding: "22px 20px" }}>No hay documentos de tránsito registrados. Generá el primero con “Nuevo {cfg.documentoTransito}”.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="mc-table">
              <thead>
                <tr>
                  <th>N° {cfg.documentoTransito}</th><th>Origen</th><th>Destino</th><th>Fecha</th>
                  <th className="mc-cell--num">Cabezas</th><th>Motivo</th><th>Estado</th><th></th>
                </tr>
              </thead>
              <tbody>
                {dtes.map((d) => {
                  const v = dteEstadoView(d.estado);
                  return (
                    <tr key={d.id}>
                      <td className="mc-cell--mono">{d.numero}</td>
                      <td>{d.origen || "—"}</td>
                      <td>{d.destino || "—"}</td>
                      <td className="mc-cell--mono">{fmtDDMMYYYY(new Date(d.fecha))}</td>
                      <td className="mc-cell--num">{d.cabezas ?? "—"}</td>
                      <td>{d.motivo || "—"}</td>
                      <td><span className={`mc-badge mc-badge--${v.tone}`}>{v.label}</span></td>
                      <td>
                        <div className="row gap-6" style={{ justifyContent: "flex-end" }}>
                          {dteAbierto(d) && <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => cerrarDTE(d.id)}>Cerrar</button>}
                          <button className="mc-icon-btn" style={{ width: 26, height: 26 }} onClick={() => eliminarDTE(d.id)} title="Eliminar"><Icon name="trash" size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modalNuevo && <ModalNuevoDTE cfg={cfg} tropas={tropas} onClose={() => setModalNuevo(false)} onGuardado={onRefresh} />}
    </div>
  );
}

/* ============ AUDITORÍA ============ */
export function TrazaAuditoria({
  auditorias,
  terneros,
  dtes,
  onRefresh,
}: {
  auditorias: AuditoriaApi[];
  terneros: TernPend[];
  dtes: DTEApi[];
  onRefresh: () => void;
}) {
  const [modalAuditoria, setModalAuditoria] = useState(false);
  const items: Incumpl[] = incumplimientos(terneros, dtes);
  const pendientes = items.filter((i) => i.estado === "Pendiente");
  const [ahora] = useState(() => new Date());
  const resueltos = auditorias.filter((a) => esMismoMes(a.fecha, ahora)).length;
  const ultimaAuditoria = auditorias[0] || null;
  const antiguedadProm = pendientes.length ? Math.round(pendientes.reduce((s, i) => s + (i.diasAbierto || 0), 0) / pendientes.length) : 0;

  return (
    <div className="col gap-20">
      <div className="grid g-cols-5">
        <KPI label="Incumplimientos Activos" value={String(pendientes.length)} delta="pendientes de resolución" trend={pendientes.length > 0 ? "down" : "up"} icon="alert" />
        <KPI label="Auditorías (mes)" value={String(resueltos)} delta="registradas este mes" trend="up" icon="check" />
        <KPI label="Última Auditoría" value={ultimaAuditoria ? fmtDDMMYYYY(new Date(ultimaAuditoria.fecha)).slice(0, 5) : "—"} delta={ultimaAuditoria ? `${ultimaAuditoria.organismo || ultimaAuditoria.tipo}` : "sin auditorías"} trend="up" icon="calendar" />
        <KPI label="Resultado Última Auditoría" value={ultimaAuditoria?.resultado || "—"} delta={ultimaAuditoria?.observaciones || "sin observaciones"} trend="up" icon="shieldCheck" />
        <KPI label="Antigüedad Prom. Incumplimiento" value={`${antiguedadProm} días`} delta="promedio de los pendientes activos" trend={antiguedadProm > 0 ? "warn" : "up"} icon="clock" />
      </div>
      <div className="row gap-8" style={{ justifyContent: "flex-end" }}>
        <button className="mc-btn mc-btn--primary" onClick={() => setModalAuditoria(true)}><Icon name="plus" size={14} />Registrar Auditoría</button>
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--mc-ink)", fontFamily: "var(--ff-display)" }}>Auditoría</div>
        <div className="text-xs text-muted mt-4">Historial de auditorías e incumplimientos detectados</div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "65fr 35fr", gap: 16, alignItems: "start" }}>
        <div className="mc-card">
          <div className="mc-card__head">
            <div>
              <div className="mc-card__title">Incumplimientos Detectados</div>
              <div className="text-xs text-muted mt-2">Derivados de vencimientos de identificación y tránsito</div>
            </div>
          </div>
          <div className="col gap-8">
            {items.length === 0 && <div className="text-sm text-muted" style={{ padding: "12px 2px" }}>Sin incumplimientos detectados. Todo en regla.</div>}
            {items.map((it, i) => (
              <div key={i} className="row gap-10" style={{ alignItems: "center", padding: "10px 12px", border: "1px solid var(--mc-line)", borderRadius: 10 }}>
                <span className={`mc-badge mc-badge--${it.sev}`}>{it.sev === "red" ? "Alta" : "Media"}</span>
                <div style={{ flex: 1 }}>
                  <div className="font-semi text-sm" style={{ color: "var(--mc-ink)" }}>{it.tipo}</div>
                  <div className="text-xs text-muted">{it.ref}{it.diasAbierto != null ? ` · ${it.diasAbierto} día${it.diasAbierto === 1 ? "" : "s"}` : ""}</div>
                </div>
                <span className={`mc-badge mc-badge--${it.estado === "Resuelto" ? "green" : "neutral"}`}>{it.estado}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mc-card">
          <div className="mc-card__head">
            <div>
              <div className="mc-card__title">Historial de Auditorías</div>
              <div className="text-xs text-muted mt-2">Resultados de auditorías registradas</div>
            </div>
          </div>
          <div className="col gap-8">
            {auditorias.length === 0 && <div className="text-sm text-muted" style={{ padding: "12px 2px" }}>Aún no registraste auditorías.</div>}
            {auditorias.map((a) => (
              <div key={a.id} style={{ padding: 14, border: "1px solid var(--mc-line)", borderRadius: 10, borderLeft: `3px solid ${resultadoTone(a.resultado) === "green" ? "var(--mc-green-600)" : resultadoTone(a.resultado) === "red" ? "var(--mc-red)" : "var(--mc-amber, #d19a00)"}` }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <div>
                    <div className="font-semi" style={{ color: "var(--mc-ink)" }}>Auditoría {a.organismo || a.tipo}</div>
                    <div className="text-xs text-muted">{fmtDDMMYYYY(new Date(a.fecha))}{a.tipo ? ` · ${a.tipo}` : ""}</div>
                  </div>
                  <span className={`mc-badge mc-badge--${resultadoTone(a.resultado)}`}>{a.resultado || "—"}</span>
                </div>
                {a.observaciones && <div className="text-sm text-muted mt-6">{a.observaciones}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
      {modalAuditoria && <ModalRegistrarAuditoria onClose={() => setModalAuditoria(false)} onGuardado={onRefresh} />}
    </div>
  );
}
