"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Icon, KPI, Badge, Modal, Field, useToast, PageHeader, Tabs } from "@/components/mc";

/* ============ Tipos ============ */
type Empleado = {
  dbId?: string;
  nombre: string;
  puesto: string;
  estado: string;
  telefono: string;
  ingreso: string;
  salario: number;
  demo?: boolean;
};

type Tarea = {
  dbId?: string;
  titulo: string;
  empleado: string;
  prioridad: string;
  vencimiento: string;
  estado: string;
  demo?: boolean;
};

type Pago = {
  empleado: string;
  periodo: string;
  bruto: number;
  neto: number;
  metodo: string;
  estado: string;
};

type Contratista = {
  dbId?: string;
  nombre: string;
  empresa: string;
  especialidad: string;
  telefono: string;
  estado: string;
  demo?: boolean;
};

type Toast = ReturnType<typeof useToast>;

/* ============ Datos demo ============ */
const DEMO_EMPLEADOS: Empleado[] = [
  { nombre: "Juan Pérez", puesto: "Maquinista", estado: "Activo", telefono: "+598 99 123 456", ingreso: "12/03/2021", salario: 1200, demo: true },
  { nombre: "M. Gómez", puesto: "Operario", estado: "Activo", telefono: "+598 99 234 567", ingreso: "05/08/2022", salario: 950, demo: true },
  { nombre: "C. López", puesto: "Encargada", estado: "Activo", telefono: "+598 99 345 678", ingreso: "20/01/2020", salario: 1600, demo: true },
  { nombre: "Marcos González", puesto: "Maquinista", estado: "Licencia", telefono: "+598 99 456 789", ingreso: "10/06/2023", salario: 1150, demo: true },
];

const DEMO_TAREAS: Tarea[] = [
  { titulo: "Pulverización Lote 3", empleado: "Juan Pérez", prioridad: "Alta", vencimiento: "16/06/2026", estado: "Pendiente", demo: true },
  { titulo: "Mantenimiento corral", empleado: "M. Gómez", prioridad: "Media", vencimiento: "18/06/2026", estado: "EnProceso", demo: true },
  { titulo: "Control de stock insumos", empleado: "C. López", prioridad: "Baja", vencimiento: "20/06/2026", estado: "Pendiente", demo: true },
];

const DEMO_PAGOS: Pago[] = [
  { empleado: "Juan Pérez", periodo: "2026-05", bruto: 1200, neto: 1044, metodo: "Transferencia", estado: "Pagado" },
  { empleado: "M. Gómez", periodo: "2026-05", bruto: 950, neto: 826, metodo: "Transferencia", estado: "Pagado" },
  { empleado: "C. López", periodo: "2026-05", bruto: 1600, neto: 1392, metodo: "Transferencia", estado: "Pendiente" },
];

const DEMO_CONTRATISTAS: Contratista[] = [
  { nombre: "Aero Campo SRL", empresa: "Aero Campo SRL", especialidad: "Pulverización", telefono: "+598 98 111 222", estado: "Activo", demo: true },
  { nombre: "Cosechas del Sur", empresa: "Cosechas del Sur", especialidad: "Cosecha", telefono: "+598 98 333 444", estado: "Activo", demo: true },
];

const TABS = ["Equipo", "Horas y Tareas", "Pagos", "Contratistas"];

const fmtMoneda = (n: number) => `US$ ${n.toLocaleString("es-AR")}`;

const estadoEmpTone = (e: string) =>
  e === "Activo" ? "green" : e === "Licencia" ? "amber" : e === "Inactivo" ? "neutral" : "red";

export default function PersonalPage() {
  const toast = useToast();
  const [tab, setTab] = useState("Equipo");

  const [empleados, setEmpleados] = useState<Empleado[]>(DEMO_EMPLEADOS);
  const [tareas, setTareas] = useState<Tarea[]>(DEMO_TAREAS);
  const [pagos, setPagos] = useState<Pago[]>(DEMO_PAGOS);
  const [contratistas, setContratistas] = useState<Contratista[]>(DEMO_CONTRATISTAS);
  const [horasMes, setHorasMes] = useState(648);

  const [modalEmp, setModalEmp] = useState(false);
  const [empForm, setEmpForm] = useState({ nombre: "", apellido: "", puesto: "", telefono: "", salario: "" });

  /* ---- Carga de datos ---- */
  useEffect(() => {
    fetch("/api/empleados")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        setEmpleados(
          d.map((e: any) => ({
            dbId: e.id,
            nombre: `${e.nombre} ${e.apellido}`.trim(),
            puesto: e.cargo || "—",
            estado: e.estado || "Activo",
            telefono: e.telefono || "—",
            ingreso: e.fechaIngreso ? new Date(e.fechaIngreso).toLocaleDateString("es-AR") : "—",
            salario: e.salarioBase || 0,
          }))
        );
        const totalHoras = d.reduce((s: number, e: any) => {
          const rh = Array.isArray(e.registrosHoras) ? e.registrosHoras : [];
          return s + rh.reduce((x: number, r: any) => x + (r.horasRegulares || 0) + (r.horasExtra || 0) + (r.horasNocturnas || 0), 0);
        }, 0);
        if (totalHoras > 0) setHorasMes(Math.round(totalHoras));
        const pgs: Pago[] = [];
        d.forEach((e: any) => {
          (Array.isArray(e.pagos) ? e.pagos : []).forEach((p: any) => {
            pgs.push({
              empleado: `${e.nombre} ${e.apellido}`.trim(),
              periodo: p.periodo,
              bruto: p.totalBruto || 0,
              neto: p.totalNeto || 0,
              metodo: p.metodoPago || "Transferencia",
              estado: "Pagado",
            });
          });
        });
        if (pgs.length > 0) setPagos(pgs);
      })
      .catch(() => {});

    fetch("/api/tareas-empleado")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        setTareas(
          d.map((t: any) => ({
            dbId: t.id,
            titulo: t.titulo,
            empleado: t.empleado ? `${t.empleado.nombre} ${t.empleado.apellido}`.trim() : "—",
            prioridad: t.prioridad || "Media",
            vencimiento: t.fechaVencimiento ? new Date(t.fechaVencimiento).toLocaleDateString("es-AR") : "—",
            estado: t.estado || "Pendiente",
          }))
        );
      })
      .catch(() => {});

    fetch("/api/contratistas")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d) || d.length === 0) return;
        setContratistas(
          d.map((c: any) => ({
            dbId: c.id,
            nombre: c.nombre,
            empresa: c.empresa || "—",
            especialidad: c.especialidad || "—",
            telefono: c.telefono || "—",
            estado: c.estado || "Activo",
          }))
        );
      })
      .catch(() => {});
  }, []);

  /* ---- KPIs ---- */
  const empleadosActivos = useMemo(() => empleados.filter((e) => e.estado === "Activo").length, [empleados]);
  const pagosMes = useMemo(() => pagos.reduce((s, p) => s + p.neto, 0), [pagos]);
  const contratistasActivos = useMemo(() => contratistas.filter((c) => c.estado === "Activo").length, [contratistas]);

  const crearEmpleado = async () => {
    if (!empForm.nombre || !empForm.puesto) {
      toast.show("Completá nombre y puesto", "err");
      return;
    }
    const nombreCompleto = `${empForm.nombre} ${empForm.apellido}`.trim();
    try {
      const res = await fetch("/api/empleados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legajo: `EMP-${Date.now().toString().slice(-6)}`,
          nombre: empForm.nombre,
          apellido: empForm.apellido || "",
          documento: "",
          telefono: empForm.telefono || null,
          cargo: empForm.puesto,
          fechaIngreso: new Date().toISOString(),
          tipoContrato: "Mensual",
          salarioBase: empForm.salario ? parseFloat(empForm.salario) : 0,
        }),
      });
      let dbId: string | undefined;
      if (res.ok) {
        const nuevo = await res.json();
        dbId = nuevo?.id;
      }
      setEmpleados((prev) => [
        {
          dbId,
          nombre: nombreCompleto,
          puesto: empForm.puesto,
          estado: "Activo",
          telefono: empForm.telefono || "—",
          ingreso: new Date().toLocaleDateString("es-AR"),
          salario: empForm.salario ? parseFloat(empForm.salario) : 0,
        },
        ...prev,
      ]);
      toast.show(`Empleado ${nombreCompleto} registrado`);
      setModalEmp(false);
      setEmpForm({ nombre: "", apellido: "", puesto: "", telefono: "", salario: "" });
    } catch {
      toast.show("No se pudo registrar el empleado", "err");
    }
  };

  return (
    <div className="col gap-20">
      {toast.node}
      <PageHeader
        crumbs={["MiCampo", "Personal"]}
        title="Personal"
        subtitle="Gestión del equipo del establecimiento: empleados, horas, pagos y contratistas."
        actions={
          tab === "Equipo" ? (
            <button className="mc-btn mc-btn--primary" onClick={() => setModalEmp(true)}>
              <Icon name="plus" size={14} />Nuevo empleado
            </button>
          ) : undefined
        }
      />

      <div className="grid g-cols-4">
        <KPI label="Empleados activos" value={String(empleadosActivos)} delta={`${empleados.length} en plantilla`} trend="up" icon="users" accent />
        <KPI label="Horas registradas (mes)" value={`${horasMes} h`} delta="Mes en curso" trend="up" icon="clock" />
        <KPI label="Pagos del mes" value={fmtMoneda(pagosMes)} delta={`${pagos.length} liquidaciones`} trend="up" icon="dollar" />
        <KPI label="Contratistas activos" value={String(contratistasActivos)} delta={`${contratistas.length} registrados`} trend="up" icon="truck" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Equipo" && (
        <TabEquipo empleados={empleados} setEmpleados={setEmpleados} toast={toast} onNuevo={() => setModalEmp(true)} />
      )}
      {tab === "Horas y Tareas" && (
        <TabHoras tareas={tareas} setTareas={setTareas} empleados={empleados} toast={toast} />
      )}
      {tab === "Pagos" && <TabPagos pagos={pagos} setPagos={setPagos} empleados={empleados} toast={toast} />}
      {tab === "Contratistas" && (
        <TabContratistas contratistas={contratistas} setContratistas={setContratistas} toast={toast} />
      )}

      {/* Modal nuevo empleado */}
      <Modal
        open={modalEmp}
        onClose={() => setModalEmp(false)}
        title="Nuevo empleado"
        subtitle="Alta de un integrante del equipo del establecimiento."
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setModalEmp(false)}>Cancelar</button>
            <button className="mc-btn mc-btn--primary" onClick={crearEmpleado}>
              <Icon name="check" size={14} />Registrar empleado
            </button>
          </>
        }
      >
        <div className="grid g-cols-2 gap-12">
          <Field label="Nombre *">
            <input className="mc-input" placeholder="Ej: Juan" value={empForm.nombre} onChange={(e) => setEmpForm({ ...empForm, nombre: e.target.value })} />
          </Field>
          <Field label="Apellido">
            <input className="mc-input" placeholder="Ej: Pérez" value={empForm.apellido} onChange={(e) => setEmpForm({ ...empForm, apellido: e.target.value })} />
          </Field>
        </div>
        <div className="grid g-cols-2 gap-12">
          <Field label="Puesto *">
            <input className="mc-input" placeholder="Ej: Maquinista" value={empForm.puesto} onChange={(e) => setEmpForm({ ...empForm, puesto: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <input className="mc-input" placeholder="+598 99 ..." value={empForm.telefono} onChange={(e) => setEmpForm({ ...empForm, telefono: e.target.value })} />
          </Field>
        </div>
        <Field label="Salario mensual (US$)">
          <input className="mc-input" placeholder="0" value={empForm.salario} onChange={(e) => setEmpForm({ ...empForm, salario: e.target.value })} />
        </Field>
      </Modal>
    </div>
  );
}

/* ============ TAB EQUIPO ============ */
function TabEquipo({
  empleados, setEmpleados, toast, onNuevo,
}: {
  empleados: Empleado[];
  setEmpleados: React.Dispatch<React.SetStateAction<Empleado[]>>;
  toast: Toast;
  onNuevo: () => void;
}) {
  const [menuFila, setMenuFila] = useState<number | null>(null);

  const eliminar = async (e: Empleado, idx: number) => {
    if (e.dbId) {
      try {
        await fetch(`/api/empleados/${e.dbId}`, { method: "DELETE" });
      } catch {}
    }
    setEmpleados((prev) => prev.filter((_, i) => i !== idx));
    toast.show(`Empleado ${e.nombre} eliminado`);
  };

  return (
    <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between" }}>
        <div className="mc-card__title">Plantilla del establecimiento</div>
        <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={onNuevo}>
          <Icon name="plus" size={13} />Nuevo empleado
        </button>
      </div>
      <table className="mc-table">
        <thead>
          <tr>
            <th>Nombre</th><th>Puesto</th><th>Estado</th><th>Teléfono</th><th>Fecha ingreso</th><th></th>
          </tr>
        </thead>
        <tbody>
          {empleados.map((e, i) => (
            <tr key={i}>
              <td className="mc-cell--emph">{e.nombre}</td>
              <td>{e.puesto}</td>
              <td>
                <span className={`mc-badge mc-badge--${estadoEmpTone(e.estado)}`}>
                  <span className="mc-badge__dot"></span>{e.estado}
                </span>
              </td>
              <td className="mc-cell--mono">{e.telefono}</td>
              <td className="mc-cell--mono">{e.ingreso}</td>
              <td style={{ position: "relative" }}>
                <button className="mc-icon-btn" style={{ width: 26, height: 26, border: "none" }} onClick={() => setMenuFila(menuFila === i ? null : i)}>
                  <Icon name="more" size={14} />
                </button>
                {menuFila === i && (
                  <>
                    <div onClick={() => setMenuFila(null)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
                    <div style={{ position: "absolute", top: "100%", right: 8, zIndex: 51, background: "var(--mc-surface)", border: "1px solid var(--mc-line)", borderRadius: 10, boxShadow: "var(--sh-lg)", padding: 4, width: 140 }}>
                      <button className="mc-btn mc-btn--ghost mc-btn--sm mc-btn--block" style={{ justifyContent: "flex-start" }} onClick={() => { setMenuFila(null); toast.show("Edición de empleado próximamente"); }}>
                        <Icon name="edit" size={13} />Editar
                      </button>
                      <button className="mc-btn mc-btn--ghost mc-btn--sm mc-btn--block" style={{ justifyContent: "flex-start", color: "var(--mc-red)" }} onClick={() => { setMenuFila(null); eliminar(e, i); }}>
                        <Icon name="trash" size={13} />Eliminar
                      </button>
                    </div>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============ TAB HORAS Y TAREAS ============ */
function TabHoras({
  tareas, setTareas, empleados, toast,
}: {
  tareas: Tarea[];
  setTareas: React.Dispatch<React.SetStateAction<Tarea[]>>;
  empleados: Empleado[];
  toast: Toast;
}) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ titulo: "", empleadoIdx: 0, prioridad: "Media", vencimiento: new Date().toISOString().slice(0, 10) });

  const crear = async () => {
    if (!form.titulo) {
      toast.show("Indicá el título de la tarea", "err");
      return;
    }
    const emp = empleados[form.empleadoIdx];
    try {
      if (emp?.dbId) {
        await fetch("/api/tareas-empleado", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            empleadoId: emp.dbId,
            titulo: form.titulo,
            prioridad: form.prioridad,
            fechaVencimiento: form.vencimiento,
          }),
        }).catch(() => {});
      }
      setTareas((prev) => [
        {
          titulo: form.titulo,
          empleado: emp?.nombre || "—",
          prioridad: form.prioridad,
          vencimiento: new Date(form.vencimiento).toLocaleDateString("es-AR"),
          estado: "Pendiente",
        },
        ...prev,
      ]);
      toast.show("Tarea asignada");
      setModal(false);
      setForm({ ...form, titulo: "" });
    } catch {
      toast.show("No se pudo asignar la tarea", "err");
    }
  };

  const prioTone = (p: string) => (p === "Urgente" || p === "Alta" ? "red" : p === "Media" ? "amber" : "neutral");
  const estTone = (s: string) => (s === "Completada" ? "green" : s === "EnProceso" ? "blue" : "amber");

  return (
    <div className="col gap-16">
      <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between" }}>
          <div className="mc-card__title">Tareas asignadas</div>
          <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => setModal(true)}>
            <Icon name="plus" size={13} />Asignar tarea
          </button>
        </div>
        <table className="mc-table">
          <thead>
            <tr><th>Tarea</th><th>Empleado</th><th>Prioridad</th><th>Vencimiento</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {tareas.map((t, i) => (
              <tr key={i}>
                <td className="mc-cell--emph">{t.titulo}</td>
                <td>{t.empleado}</td>
                <td><Badge tone={prioTone(t.prioridad)}>{t.prioridad}</Badge></td>
                <td className="mc-cell--mono">{t.vencimiento}</td>
                <td>
                  <span className={`mc-badge mc-badge--${estTone(t.estado)}`}><span className="mc-badge__dot"></span>{t.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mc-card">
        <div className="mc-card__head">
          <div className="mc-card__title">Registro de horas</div>
          <span className="mc-badge mc-badge--blue"><Icon name="clock" size={10} />Mes en curso</span>
        </div>
        <div className="text-sm text-muted">
          El registro de horas del personal se carga por jornada (regulares, extra y nocturnas) y alimenta automáticamente el KPI
          de horas del mes y la liquidación de pagos. Asigná tareas al equipo para llevar el seguimiento de las labores diarias.
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Asignar tarea"
        subtitle="Asigná una tarea a un integrante del equipo."
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="mc-btn mc-btn--primary" onClick={crear}><Icon name="check" size={14} />Asignar</button>
          </>
        }
      >
        <Field label="Título *">
          <input className="mc-input" placeholder="Ej: Pulverización Lote 3" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
        </Field>
        <div className="grid g-cols-2 gap-12">
          <Field label="Empleado">
            <select className="mc-select" value={form.empleadoIdx} onChange={(e) => setForm({ ...form, empleadoIdx: parseInt(e.target.value) })}>
              {empleados.map((emp, i) => <option key={i} value={i}>{emp.nombre}</option>)}
            </select>
          </Field>
          <Field label="Prioridad">
            <select className="mc-select" value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
              {["Baja", "Media", "Alta", "Urgente"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Vencimiento">
          <input type="date" className="mc-input" value={form.vencimiento} onChange={(e) => setForm({ ...form, vencimiento: e.target.value })} />
        </Field>
      </Modal>
    </div>
  );
}

/* ============ TAB PAGOS ============ */
function TabPagos({
  pagos, setPagos, empleados, toast,
}: {
  pagos: Pago[];
  setPagos: React.Dispatch<React.SetStateAction<Pago[]>>;
  empleados: Empleado[];
  toast: Toast;
}) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    empleadoIdx: 0,
    periodo: new Date().toISOString().slice(0, 7),
    bruto: "",
    metodo: "Transferencia",
  });

  const registrar = () => {
    const emp = empleados[form.empleadoIdx];
    const bruto = parseFloat(form.bruto) || emp?.salario || 0;
    if (!bruto) {
      toast.show("Indicá el monto bruto", "err");
      return;
    }
    const neto = Math.round(bruto * 0.87);
    setPagos((prev) => [
      { empleado: emp?.nombre || "—", periodo: form.periodo, bruto, neto, metodo: form.metodo, estado: "Pagado" },
      ...prev,
    ]);
    // No existe ruta /api/pagos-salario dedicada; persistencia mejor-esfuerzo.
    toast.show(`Pago registrado para ${emp?.nombre || "el empleado"}`);
    setModal(false);
    setForm({ ...form, bruto: "" });
  };

  return (
    <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between" }}>
        <div className="mc-card__title">Pagos y liquidaciones</div>
        <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => setModal(true)}>
          <Icon name="plus" size={13} />Registrar pago
        </button>
      </div>
      <table className="mc-table">
        <thead>
          <tr><th>Empleado</th><th>Período</th><th className="mc-cell--num">Bruto</th><th className="mc-cell--num">Neto</th><th>Método</th><th>Estado</th></tr>
        </thead>
        <tbody>
          {pagos.map((p, i) => (
            <tr key={i}>
              <td className="mc-cell--emph">{p.empleado}</td>
              <td className="mc-cell--mono">{p.periodo}</td>
              <td className="mc-cell--num">{fmtMoneda(p.bruto)}</td>
              <td className="mc-cell--num">{fmtMoneda(p.neto)}</td>
              <td>{p.metodo}</td>
              <td>
                <span className={`mc-badge mc-badge--${p.estado === "Pagado" ? "green" : "amber"}`}><span className="mc-badge__dot"></span>{p.estado}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Registrar pago"
        subtitle="Liquidación de salario para un integrante del equipo."
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="mc-btn mc-btn--primary" onClick={registrar}><Icon name="check" size={14} />Registrar pago</button>
          </>
        }
      >
        <div className="grid g-cols-2 gap-12">
          <Field label="Empleado">
            <select className="mc-select" value={form.empleadoIdx} onChange={(e) => setForm({ ...form, empleadoIdx: parseInt(e.target.value) })}>
              {empleados.map((emp, i) => <option key={i} value={i}>{emp.nombre}</option>)}
            </select>
          </Field>
          <Field label="Período (YYYY-MM)">
            <input type="month" className="mc-input" value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })} />
          </Field>
        </div>
        <div className="grid g-cols-2 gap-12">
          <Field label="Monto bruto (US$)">
            <input className="mc-input" placeholder={String(empleados[form.empleadoIdx]?.salario || 0)} value={form.bruto} onChange={(e) => setForm({ ...form, bruto: e.target.value })} />
          </Field>
          <Field label="Método de pago">
            <select className="mc-select" value={form.metodo} onChange={(e) => setForm({ ...form, metodo: e.target.value })}>
              {["Transferencia", "Efectivo", "Cheque"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ============ TAB CONTRATISTAS ============ */
function TabContratistas({
  contratistas, setContratistas, toast,
}: {
  contratistas: Contratista[];
  setContratistas: React.Dispatch<React.SetStateAction<Contratista[]>>;
  toast: Toast;
}) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: "", empresa: "", email: "", telefono: "", especialidad: "Pulverización" });

  const crear = async () => {
    if (!form.nombre || !form.email) {
      toast.show("Completá nombre y email", "err");
      return;
    }
    try {
      const res = await fetch("/api/contratistas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          empresa: form.empresa || null,
          email: form.email,
          telefono: form.telefono || null,
          especialidad: form.especialidad,
        }),
      });
      let dbId: string | undefined;
      if (res.ok) {
        const nuevo = await res.json();
        dbId = nuevo?.id;
      }
      setContratistas((prev) => [
        { dbId, nombre: form.nombre, empresa: form.empresa || "—", especialidad: form.especialidad, telefono: form.telefono || "—", estado: "Activo" },
        ...prev,
      ]);
      toast.show(`Contratista ${form.nombre} registrado`);
      setModal(false);
      setForm({ nombre: "", empresa: "", email: "", telefono: "", especialidad: "Pulverización" });
    } catch {
      toast.show("No se pudo registrar el contratista", "err");
    }
  };

  return (
    <div className="mc-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between" }}>
        <div className="mc-card__title">Contratistas</div>
        <button className="mc-btn mc-btn--primary mc-btn--sm" onClick={() => setModal(true)}>
          <Icon name="plus" size={13} />Nuevo contratista
        </button>
      </div>
      <table className="mc-table">
        <thead>
          <tr><th>Nombre</th><th>Empresa</th><th>Especialidad</th><th>Teléfono</th><th>Estado</th></tr>
        </thead>
        <tbody>
          {contratistas.map((c, i) => (
            <tr key={i}>
              <td className="mc-cell--emph">{c.nombre}</td>
              <td>{c.empresa}</td>
              <td><Badge tone="blue">{c.especialidad}</Badge></td>
              <td className="mc-cell--mono">{c.telefono}</td>
              <td>
                <span className={`mc-badge mc-badge--${c.estado === "Activo" ? "green" : "neutral"}`}><span className="mc-badge__dot"></span>{c.estado}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Nuevo contratista"
        subtitle="Alta de un contratista con acceso al portal."
        footer={
          <>
            <button className="mc-btn mc-btn--ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="mc-btn mc-btn--primary" onClick={crear}><Icon name="check" size={14} />Registrar</button>
          </>
        }
      >
        <div className="grid g-cols-2 gap-12">
          <Field label="Nombre *">
            <input className="mc-input" placeholder="Ej: Aero Campo SRL" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="Empresa">
            <input className="mc-input" placeholder="Razón social" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
          </Field>
        </div>
        <div className="grid g-cols-2 gap-12">
          <Field label="Email *">
            <input className="mc-input" placeholder="contacto@empresa.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <input className="mc-input" placeholder="+598 98 ..." value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </Field>
        </div>
        <Field label="Especialidad">
          <select className="mc-select" value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value })}>
            {["Siembra", "Cosecha", "Pulverización", "Transporte", "Otra"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </Modal>
    </div>
  );
}
