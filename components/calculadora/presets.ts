import type { ConfigCalculo, Preset } from "./types";

export const CONFIG_VACIA: ConfigCalculo = {
  loteNombre: "",
  loteId: null,
  area: 85,
  caldo: 150,
  tanque: 3000,
  tipoAplicacion: "Terrestre",
  productos: [],
};

export const PRESETS: Preset[] = [
  {
    nombre: "Glifosato barbecho",
    tipo: "Herbicida",
    dosis: "3.0 L/Ha",
    caldo: "150 L/Ha",
    productos: 1,
    color: "var(--mc-green-600)",
    config: {
      ...CONFIG_VACIA,
      area: 85,
      caldo: 150,
      productos: [{ tipo: "Herbicida", nombre: "Glifosato 48%", costoUnitario: "5.5", dosis: "3.0", unidad: "Lt/Ha", concentracion: "48", carencia: "15" }],
    },
  },
  {
    nombre: "Control chinche soja",
    tipo: "Insecticida",
    dosis: "0.3 L/Ha",
    caldo: "100 L/Ha",
    productos: 2,
    color: "var(--mc-orange-600)",
    config: {
      ...CONFIG_VACIA,
      area: 60,
      caldo: 100,
      productos: [
        { tipo: "Insecticida", nombre: "Cipermetrina 25%", costoUnitario: "8.0", dosis: "0.3", unidad: "Lt/Ha", concentracion: "25", carencia: "21" },
        { tipo: "Insecticida", nombre: "Lambdacialotrina", costoUnitario: "12.0", dosis: "0.15", unidad: "Lt/Ha", concentracion: "5", carencia: "14" },
      ],
    },
  },
  {
    nombre: "Fungicida preventivo maíz",
    tipo: "Fungicida",
    dosis: "0.4 L/Ha",
    caldo: "120 L/Ha",
    productos: 1,
    color: "var(--mc-blue)",
    config: {
      ...CONFIG_VACIA,
      area: 110,
      caldo: 120,
      productos: [{ tipo: "Fungicida", nombre: "Tebuconazole", costoUnitario: "14.0", dosis: "0.4", unidad: "Lt/Ha", concentracion: "25", carencia: "30" }],
    },
  },
  {
    nombre: "Pre-siembra trigo",
    tipo: "Mezcla",
    dosis: "2.5 L/Ha + 0.5 L/Ha",
    caldo: "130 L/Ha",
    productos: 3,
    color: "var(--mc-green-700)",
    config: {
      ...CONFIG_VACIA,
      area: 95,
      caldo: 130,
      productos: [
        { tipo: "Herbicida", nombre: "Atrazina", costoUnitario: "4.5", dosis: "2.5", unidad: "Lt/Ha", concentracion: "50", carencia: "0" },
        { tipo: "Herbicida", nombre: "2,4-D Amina", costoUnitario: "3.8", dosis: "0.5", unidad: "Lt/Ha", concentracion: "48", carencia: "0" },
        { tipo: "Nutrición", nombre: "Fertilizante foliar", costoUnitario: "6.0", dosis: "1.0", unidad: "Lt/Ha", concentracion: "", carencia: "0" },
      ],
    },
  },
];

export const HISTORIAL_DEMO = [
  { fecha: "15/04/2026", producto: "Glifosato 48%", lote: "Norte 1", ha: 85, dosis: "3.0 L/Ha", total: "255 L", costo: "$412,500", usuario: "J. Rodríguez" },
  { fecha: "12/04/2026", producto: "2,4-D Amina", lote: "Norte 2", ha: 72, dosis: "0.5 L/Ha", total: "36 L", costo: "$48,600", usuario: "J. Rodríguez" },
  { fecha: "08/04/2026", producto: "Atrazina", lote: "Este 1", ha: 110, dosis: "2.5 L/Ha", total: "275 L", costo: "$357,500", usuario: "C. Martínez" },
  { fecha: "02/04/2026", producto: "Cipermetrina", lote: "Sur 2", ha: 42, dosis: "0.3 L/Ha", total: "12.6 L", costo: "$28,350", usuario: "C. Martínez" },
  { fecha: "28/03/2026", producto: "Tebuconazole", lote: "Sur 1", ha: 64, dosis: "0.4 L/Ha", total: "25.6 L", costo: "$89,600", usuario: "J. Rodríguez" },
];
