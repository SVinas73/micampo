import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateEstadoResultadosPDF = (data: any) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text("Estado de Resultados", 105, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.text(`Período: ${data.periodo}`, 105, 30, { align: "center" });
  doc.text(`Generado: ${new Date().toLocaleDateString()}`, 105, 37, { align: "center" });

  // Ingresos
  let yPos = 50;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold"); // ✅ Cambiar undefined por "helvetica"
  doc.text("INGRESOS", 20, yPos);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal"); // ✅ Cambiar undefined por "helvetica"
  yPos += 10;
  
  const ingresosData = Object.entries(data.ingresosPorCategoria).map(([cat, monto]: any) => [
    cat,
    `$${monto.toFixed(2)}`,
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [["Categoría", "Monto"]],
    body: ingresosData,
    theme: "grid",
    headStyles: { fillColor: [34, 197, 94] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Total Ingresos
  doc.setFont("helvetica", "bold"); // ✅
  doc.text(`Total Ingresos: $${data.totalIngresos.toFixed(2)}`, 20, yPos);
  yPos += 15;

  // Gastos
  doc.setFontSize(14);
  doc.text("GASTOS", 20, yPos);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal"); // ✅
  yPos += 10;

  const gastosData = Object.entries(data.gastosPorCategoria).map(([cat, monto]: any) => [
    cat,
    `$${monto.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Categoría", "Monto"]],
    body: gastosData,
    theme: "grid",
    headStyles: { fillColor: [239, 68, 68] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Total Gastos
  doc.setFont("helvetica", "bold"); // ✅
  doc.text(`Total Gastos: $${data.totalGastos.toFixed(2)}`, 20, yPos);
  yPos += 10;

  // Utilidad
  const utilidad = data.totalIngresos - data.totalGastos;
  doc.setFontSize(16);
  doc.setTextColor(utilidad >= 0 ? 34 : 239, utilidad >= 0 ? 197 : 68, utilidad >= 0 ? 94 : 68);
  doc.text(`UTILIDAD NETA: $${utilidad.toFixed(2)}`, 20, yPos);

  doc.save(`estado-resultados-${Date.now()}.pdf`);
};

export const generateFlujoCajaPDF = (data: any) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text("Flujo de Caja", 105, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.text(`Período: ${data.periodo}`, 105, 30, { align: "center" });

  let yPos = 50;

  // Saldo Inicial
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold"); // ✅
  doc.text(`Saldo Inicial: $${data.saldoInicial.toFixed(2)}`, 20, yPos);
  yPos += 15;

  // Ingresos
  doc.setFontSize(12);
  doc.text("INGRESOS DE EFECTIVO", 20, yPos);
  yPos += 10;

  const ingresosData = data.ingresos.map((ing: any) => [
    ing.fecha,
    ing.concepto,
    `$${ing.monto.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Fecha", "Concepto", "Monto"]],
    body: ingresosData,
    theme: "striped",
    headStyles: { fillColor: [34, 197, 94] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Egresos
  doc.text("EGRESOS DE EFECTIVO", 20, yPos);
  yPos += 10;

  const egresosData = data.egresos.map((egr: any) => [
    egr.fecha,
    egr.concepto,
    `$${egr.monto.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Fecha", "Concepto", "Monto"]],
    body: egresosData,
    theme: "striped",
    headStyles: { fillColor: [239, 68, 68] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Saldo Final
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold"); // ✅
  doc.text(`Saldo Final: $${data.saldoFinal.toFixed(2)}`, 20, yPos);

  doc.save(`flujo-caja-${Date.now()}.pdf`);
};

export const generateBalancePDF = (data: any) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text("Balance General", 105, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.text(`Al: ${data.fecha}`, 105, 30, { align: "center" });

  let yPos = 50;

  // ACTIVOS
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold"); // ✅
  doc.text("ACTIVOS", 20, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal"); // ✅

  const activosData = [
    ["Efectivo y Bancos", `$${data.efectivo.toFixed(2)}`],
    ["Cuentas por Cobrar", `$${data.cuentasPorCobrar.toFixed(2)}`],
    ["Inventario", `$${data.inventario.toFixed(2)}`],
    ["Activos Fijos", `$${data.activosFijos.toFixed(2)}`],
  ];

  autoTable(doc, {
    startY: yPos,
    body: activosData,
    theme: "plain",
    styles: { fontSize: 11 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 5;

  doc.setFont("helvetica", "bold"); // ✅
  doc.text(`Total Activos: $${data.totalActivos.toFixed(2)}`, 20, yPos);
  yPos += 20;

  // PASIVOS
  doc.setFontSize(16);
  doc.text("PASIVOS", 20, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal"); // ✅

  const pasivosData = [
    ["Cuentas por Pagar", `$${data.cuentasPorPagar.toFixed(2)}`],
    ["Otras Obligaciones", `$${data.otrasObligaciones.toFixed(2)}`],
  ];

  autoTable(doc, {
    startY: yPos,
    body: pasivosData,
    theme: "plain",
    styles: { fontSize: 11 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 5;

  doc.setFont("helvetica", "bold"); // ✅
  doc.text(`Total Pasivos: $${data.totalPasivos.toFixed(2)}`, 20, yPos);
  yPos += 20;

  // PATRIMONIO
  doc.setFontSize(16);
  doc.text("PATRIMONIO", 20, yPos);
  yPos += 10;

  const patrimonio = data.totalActivos - data.totalPasivos;
  doc.setFontSize(14);
  doc.text(`Patrimonio Neto: $${patrimonio.toFixed(2)}`, 20, yPos);

  doc.save(`balance-general-${Date.now()}.pdf`);
};

export const exportToExcel = async (data: any[], filename: string) => {
  // Convertir a CSV simple
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) => Object.values(row).join(","));
  const csv = [headers, ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${Date.now()}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};