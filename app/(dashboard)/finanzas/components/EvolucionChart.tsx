"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

type Transaccion = {
  tipo: "INGRESO" | "GASTO";
  monto: number;
  fecha: string;
};

type Props = {
  transacciones: Transaccion[];
};

export function EvolucionChart({ transacciones }: Props) {
  // Agrupar por mes
  const datosPorMes = transacciones.reduce((acc, t) => {
    const fecha = new Date(t.fecha);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    
    if (!acc[mes]) {
      acc[mes] = { mes, ingresos: 0, gastos: 0 };
    }
    
    if (t.tipo === "INGRESO") {
      acc[mes].ingresos += t.monto;
    } else {
      acc[mes].gastos += t.monto;
    }
    
    return acc;
  }, {} as Record<string, { mes: string; ingresos: number; gastos: number }>);

  // Convertir a array y ordenar por fecha
  const datos = Object.values(datosPorMes)
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map((d) => ({
      mes: new Date(d.mes + "-01").toLocaleDateString("es-UY", { month: "short", year: "numeric" }),
      Ingresos: d.ingresos,
      Gastos: d.gastos,
      Balance: d.ingresos - d.gastos,
    }));

  if (datos.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución Mensual</CardTitle>
        <CardDescription>
          Comparación de ingresos vs gastos por mes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ color: "#000" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Ingresos"
              stroke="#16a34a"
              strokeWidth={2}
              dot={{ fill: "#16a34a" }}
            />
            <Line
              type="monotone"
              dataKey="Gastos"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ fill: "#dc2626" }}
            />
            <Line
              type="monotone"
              dataKey="Balance"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ fill: "#2563eb" }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}