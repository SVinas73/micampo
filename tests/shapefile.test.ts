import { describe, it, expect } from "vitest";
import { shapefilePrescripcion, type ZonaRx } from "@/lib/shapefile";

// Extrae los archivos de un ZIP creado con método "store" (sin compresión),
// recorriendo los local file headers (firma PK\x03\x04).
function leerZipStore(zip: Buffer): Record<string, Buffer> {
  const out: Record<string, Buffer> = {};
  let i = 0;
  while (i + 4 <= zip.length && zip.readUInt32LE(i) === 0x04034b50) {
    const compSize = zip.readUInt32LE(i + 18);
    const nameLen = zip.readUInt16LE(i + 26);
    const extraLen = zip.readUInt16LE(i + 28);
    const nombre = zip.slice(i + 30, i + 30 + nameLen).toString("ascii");
    const dataOff = i + 30 + nameLen + extraLen;
    out[nombre] = zip.slice(dataOff, dataOff + compSize);
    i = dataOff + compSize;
  }
  return out;
}

const zonas: ZonaRx[] = [
  {
    // Polígono con un hueco (dona)
    anillos: [
      [[-57.63, -32.69], [-57.61, -32.69], [-57.61, -32.71], [-57.63, -32.71], [-57.63, -32.69]],
      [[-57.625, -32.695], [-57.615, -32.695], [-57.615, -32.705], [-57.625, -32.705], [-57.625, -32.695]],
    ],
    dosis: 156, zona: "Muy bajo", ndvi: 0.42, producto: "Urea (46-0-0)", unidad: "kg/ha",
  },
  {
    anillos: [[[-57.60, -32.69], [-57.58, -32.69], [-57.58, -32.71], [-57.60, -32.71], [-57.60, -32.69]]],
    dosis: 94, zona: "Muy alto", ndvi: 0.78, producto: "Urea (46-0-0)", unidad: "kg/ha",
  },
];

describe("shapefile de prescripción", () => {
  const zip = shapefilePrescripcion(zonas, "prescripcion");
  const files = leerZipStore(zip);

  it("es un ZIP con los 4 componentes del shapefile", () => {
    expect(zip.slice(0, 2).toString("ascii")).toBe("PK");
    expect(Object.keys(files).sort()).toEqual([
      "prescripcion.dbf", "prescripcion.prj", "prescripcion.shp", "prescripcion.shx",
    ]);
  });

  it(".shp tiene cabecera y tipo Polygon válidos", () => {
    const shp = files["prescripcion.shp"];
    expect(shp.readInt32BE(0)).toBe(9994);       // file code
    expect(shp.readInt32LE(32)).toBe(5);         // shape type Polygon
    expect(shp.readInt32BE(24)).toBe(shp.length / 2); // largo declarado == real (words)
  });

  it(".shp tiene un registro por zona y el primero es Polygon", () => {
    const shp = files["prescripcion.shp"];
    // Primer record: header en offset 100. Nº de registro y tipo.
    expect(shp.readInt32BE(100)).toBe(1);        // record number 1
    expect(shp.readInt32LE(108)).toBe(5);        // shape type del contenido
  });

  it(".shx indexa las 2 zonas", () => {
    const shx = files["prescripcion.shx"];
    expect(shx.readInt32BE(0)).toBe(9994);
    const registros = (shx.length - 100) / 8;
    expect(registros).toBe(zonas.length);
    expect(shx.readInt32BE(100)).toBe(50);       // primer record arranca tras el header (50 words)
  });

  it(".dbf declara los registros y campos correctos", () => {
    const dbf = files["prescripcion.dbf"];
    expect(dbf.readUInt8(0)).toBe(0x03);
    expect(dbf.readUInt32LE(4)).toBe(zonas.length); // nº de registros
    const headerSize = dbf.readUInt16LE(8);
    const nCampos = (headerSize - 32 - 1) / 32;
    expect(nCampos).toBe(5);
    // La dosis de la primera zona aparece en el .dbf
    expect(dbf.toString("ascii")).toContain("156");
    expect(dbf.toString("ascii")).toContain("Urea");
  });

  it(".prj es WGS84", () => {
    expect(files["prescripcion.prj"].toString("ascii")).toContain("WGS_1984");
  });
});
