/**
 * Escritor de Shapefile (ESRI) comprimido en ZIP, en TypeScript puro (sin deps).
 *
 * Genera el paquete que aceptan los monitores de siembra/fertilización (John Deere,
 * Trimble, Ag Leader, etc.): prescripcion.shp + .shx + .dbf + .prj dentro de un ZIP.
 * Geometría: polígonos (tipo 5) en WGS84 (lng/lat), con la dosis y metadatos por zona
 * en la tabla .dbf. Orienta los anillos según la especificación (exterior horario,
 * huecos antihorarios).
 */

type Campo = { nombre: string; tipo: "C" | "N"; largo: number; decimales: number };
export type ZonaRx = {
  anillos: number[][][]; // [ [ [lng,lat], ... ] (exterior), ...huecos ]
  dosis: number;
  zona: string;
  ndvi: number;
  producto: string;
  unidad: string;
};

// ---- CRC32 (para el ZIP) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Área firmada (shoelace) del anillo. >0 = antihorario en coords geográficas.
function areaFirmada(ring: number[][]): number {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return a / 2;
}
function orientar(ring: number[][], horario: boolean): number[][] {
  const a = areaFirmada(ring);
  const esHorario = a < 0;
  return esHorario === horario ? ring : [...ring].reverse();
}

// Cierra el anillo (primer punto == último) para el shapefile.
function cerrar(ring: number[][]): number[][] {
  if (ring.length === 0) return ring;
  const [f, l] = [ring[0], ring[ring.length - 1]];
  return f[0] === l[0] && f[1] === l[1] ? ring : [...ring, f];
}

function bboxDe(zonas: ZonaRx[]): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  zonas.forEach((z) => z.anillos.forEach((r) => r.forEach((p) => {
    if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1];
  })));
  return [minX, minY, maxX, maxY];
}

// ---- .shp / .shx ----
function construirShpShx(zonas: ZonaRx[]): { shp: Buffer; shx: Buffer } {
  // Anillos ya orientados y cerrados por zona.
  const geoms = zonas.map((z) =>
    z.anillos.map((ring, i) => cerrar(orientar(ring, i === 0))) // exterior horario, huecos antihorarios
  );
  const [minX, minY, maxX, maxY] = bboxDe(zonas);

  const registros: Buffer[] = [];
  const shxRecords: Buffer[] = [];
  let offsetWords = 50; // el .shp arranca tras el header de 100 bytes (50 words)

  geoms.forEach((rings, idx) => {
    const numParts = rings.length;
    const numPoints = rings.reduce((s, r) => s + r.length, 0);
    const contentBytes = 4 + 32 + 4 + 4 + numParts * 4 + numPoints * 16; // tipo+box+numParts+numPoints+parts+points
    const content = Buffer.alloc(contentBytes);
    let o = 0;
    content.writeInt32LE(5, o); o += 4; // tipo Polygon
    // bbox de la zona
    let zMinX = Infinity, zMinY = Infinity, zMaxX = -Infinity, zMaxY = -Infinity;
    rings.forEach((r) => r.forEach((p) => { if (p[0] < zMinX) zMinX = p[0]; if (p[0] > zMaxX) zMaxX = p[0]; if (p[1] < zMinY) zMinY = p[1]; if (p[1] > zMaxY) zMaxY = p[1]; }));
    content.writeDoubleLE(zMinX, o); o += 8; content.writeDoubleLE(zMinY, o); o += 8;
    content.writeDoubleLE(zMaxX, o); o += 8; content.writeDoubleLE(zMaxY, o); o += 8;
    content.writeInt32LE(numParts, o); o += 4;
    content.writeInt32LE(numPoints, o); o += 4;
    let acc = 0;
    rings.forEach((r) => { content.writeInt32LE(acc, o); o += 4; acc += r.length; });
    rings.forEach((r) => r.forEach((p) => { content.writeDoubleLE(p[0], o); o += 8; content.writeDoubleLE(p[1], o); o += 8; }));

    const recHeader = Buffer.alloc(8);
    recHeader.writeInt32BE(idx + 1, 0);            // número de registro (1-based)
    recHeader.writeInt32BE(contentBytes / 2, 4);   // largo del contenido en words
    registros.push(recHeader, content);

    const shxRec = Buffer.alloc(8);
    shxRec.writeInt32BE(offsetWords, 0);
    shxRec.writeInt32BE(contentBytes / 2, 4);
    shxRecords.push(shxRec);
    offsetWords += 4 + contentBytes / 2; // 4 words de header de registro + contenido
  });

  const cuerpoShp = Buffer.concat(registros);
  const cuerpoShx = Buffer.concat(shxRecords);

  const header = (fileLenWords: number): Buffer => {
    const h = Buffer.alloc(100);
    h.writeInt32BE(9994, 0);            // file code
    h.writeInt32BE(fileLenWords, 24);  // largo total en words (16-bit)
    h.writeInt32LE(1000, 28);          // versión
    h.writeInt32LE(5, 32);             // tipo Polygon
    h.writeDoubleLE(minX, 36); h.writeDoubleLE(minY, 44);
    h.writeDoubleLE(maxX, 52); h.writeDoubleLE(maxY, 60);
    return h; // Zmin/Zmax/Mmin/Mmax quedan en 0
  };

  const shp = Buffer.concat([header(50 + cuerpoShp.length / 2), cuerpoShp]);
  const shx = Buffer.concat([header(50 + cuerpoShx.length / 2), cuerpoShx]);
  return { shp, shx };
}

// ---- .dbf (dBASE III) ----
function construirDbf(zonas: ZonaRx[], campos: Campo[]): Buffer {
  const headerSize = 32 + campos.length * 32 + 1;
  const recordSize = 1 + campos.reduce((s, c) => s + c.largo, 0);
  const header = Buffer.alloc(headerSize);
  header.writeUInt8(0x03, 0); // dBASE III sin memo
  const now = new Date();
  header.writeUInt8(now.getFullYear() - 1900, 1);
  header.writeUInt8(now.getMonth() + 1, 2);
  header.writeUInt8(now.getDate(), 3);
  header.writeUInt32LE(zonas.length, 4);
  header.writeUInt16LE(headerSize, 8);
  header.writeUInt16LE(recordSize, 10);
  campos.forEach((c, i) => {
    const off = 32 + i * 32;
    header.write(c.nombre.slice(0, 10), off, "ascii"); // nombre (11 bytes, resto en 0)
    header.write(c.tipo, off + 11, "ascii");
    header.writeUInt8(c.largo, off + 16);
    header.writeUInt8(c.decimales, off + 17);
  });
  header.writeUInt8(0x0d, headerSize - 1); // terminador de descriptores

  const registros: Buffer[] = [header];
  zonas.forEach((z) => {
    const rec = Buffer.alloc(recordSize, 0x20); // relleno con espacios
    rec.writeUInt8(0x20, 0); // registro no borrado
    let o = 1;
    campos.forEach((c) => {
      const valor = valorCampo(z, c.nombre);
      let txt: string;
      if (c.tipo === "N") {
        const num = typeof valor === "number" ? valor : Number(valor) || 0;
        txt = (c.decimales > 0 ? num.toFixed(c.decimales) : String(Math.round(num))).slice(0, c.largo);
        txt = txt.padStart(c.largo, " "); // numéricos: justificados a la derecha
      } else {
        txt = String(valor ?? "").slice(0, c.largo).padEnd(c.largo, " ");
      }
      rec.write(txt, o, "ascii");
      o += c.largo;
    });
    registros.push(rec);
  });
  registros.push(Buffer.from([0x1a])); // EOF
  return Buffer.concat(registros);
}

function valorCampo(z: ZonaRx, campo: string): string | number {
  switch (campo) {
    case "ZONA": return z.zona;
    case "DOSIS": return z.dosis;
    case "UNIDAD": return z.unidad;
    case "NDVI": return z.ndvi;
    case "PRODUCTO": return z.producto;
    default: return "";
  }
}

const PRJ_WGS84 =
  'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],' +
  'PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]';

// ---- ZIP (método store, sin compresión) ----
function zipStore(archivos: { nombre: string; datos: Buffer }[]): Buffer {
  const locales: Buffer[] = [];
  const centrales: Buffer[] = [];
  let offset = 0;
  const DOS_DATE = 0x5021; // 2020-01-01
  archivos.forEach((a) => {
    const nombre = Buffer.from(a.nombre, "ascii");
    const crc = crc32(a.datos);
    const local = Buffer.alloc(30 + nombre.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);   // versión necesaria
    local.writeUInt16LE(0, 6);    // flags
    local.writeUInt16LE(0, 8);    // método: store
    local.writeUInt16LE(0, 10);   // hora
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(a.datos.length, 18);
    local.writeUInt32LE(a.datos.length, 22);
    local.writeUInt16LE(nombre.length, 26);
    local.writeUInt16LE(0, 28);
    nombre.copy(local, 30);
    locales.push(local, a.datos);

    const central = Buffer.alloc(46 + nombre.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);  // versión creador
    central.writeUInt16LE(20, 6);  // versión necesaria
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(a.datos.length, 20);
    central.writeUInt32LE(a.datos.length, 24);
    central.writeUInt16LE(nombre.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comentario
    central.writeUInt16LE(0, 34); // disco
    central.writeUInt16LE(0, 36); // attr internos
    central.writeUInt32LE(0, 38); // attr externos
    central.writeUInt32LE(offset, 42); // offset del header local
    nombre.copy(central, 46);
    centrales.push(central);

    offset += local.length + a.datos.length;
  });

  const cd = Buffer.concat(centrales);
  const cuerpo = Buffer.concat(locales);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(archivos.length, 8);
  eocd.writeUInt16LE(archivos.length, 10);
  eocd.writeUInt32LE(cd.length, 12);
  eocd.writeUInt32LE(cuerpo.length, 16); // offset del inicio del directorio central
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([cuerpo, cd, eocd]);
}

/** Construye el ZIP del shapefile de prescripción a partir de las zonas. */
export function shapefilePrescripcion(zonas: ZonaRx[], base = "prescripcion"): Buffer {
  const campos: Campo[] = [
    { nombre: "ZONA", tipo: "C", largo: 14, decimales: 0 },
    { nombre: "DOSIS", tipo: "N", largo: 8, decimales: 1 },
    { nombre: "UNIDAD", tipo: "C", largo: 8, decimales: 0 },
    { nombre: "NDVI", tipo: "N", largo: 6, decimales: 2 },
    { nombre: "PRODUCTO", tipo: "C", largo: 20, decimales: 0 },
  ];
  const { shp, shx } = construirShpShx(zonas);
  const dbf = construirDbf(zonas, campos);
  return zipStore([
    { nombre: `${base}.shp`, datos: shp },
    { nombre: `${base}.shx`, datos: shx },
    { nombre: `${base}.dbf`, datos: dbf },
    { nombre: `${base}.prj`, datos: Buffer.from(PRJ_WGS84, "ascii") },
  ]);
}
