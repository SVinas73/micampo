/**
 * Catálogo agronómico de plagas, enfermedades y malezas para reportes y
 * detección. Cubre las especies relevantes para los cultivos extensivos del
 * Cono Sur (soja, maíz, trigo, girasol, sorgo, cebada, etc.).
 *
 * Estructura pensada para crecer: agregar entradas o categorías es directo.
 * La búsqueda en la UI es por nombre común o científico, sin acentos.
 */

export type CategoriaPlaga = "Insecto" | "Enfermedad" | "Maleza";

export type EntradaPlaga = {
  nombre: string; // nombre común
  cientifico: string; // nombre científico
  categoria: CategoriaPlaga;
};

export const CATALOGO_PLAGAS: EntradaPlaga[] = [
  // ===================== INSECTOS / ÁCAROS =====================
  { nombre: "Oruga cogollera", cientifico: "Spodoptera frugiperda", categoria: "Insecto" },
  { nombre: "Oruga militar tardía", cientifico: "Spodoptera cosmioides", categoria: "Insecto" },
  { nombre: "Oruga militar", cientifico: "Spodoptera eridania", categoria: "Insecto" },
  { nombre: "Oruga medidora", cientifico: "Rachiplusia nu", categoria: "Insecto" },
  { nombre: "Oruga falsa medidora", cientifico: "Chrysodeixis includens", categoria: "Insecto" },
  { nombre: "Oruga de las leguminosas", cientifico: "Anticarsia gemmatalis", categoria: "Insecto" },
  { nombre: "Oruga bolillera", cientifico: "Helicoverpa gelotopoeon", categoria: "Insecto" },
  { nombre: "Oruga del choclo", cientifico: "Helicoverpa zea", categoria: "Insecto" },
  { nombre: "Oruga bolillera (armígera)", cientifico: "Helicoverpa armigera", categoria: "Insecto" },
  { nombre: "Isoca de la alfalfa", cientifico: "Colias lesbia", categoria: "Insecto" },
  { nombre: "Gusano cortador", cientifico: "Agrotis ipsilon", categoria: "Insecto" },
  { nombre: "Gusano cortador áspero", cientifico: "Agrotis malefida", categoria: "Insecto" },
  { nombre: "Barrenador del tallo", cientifico: "Diatraea saccharalis", categoria: "Insecto" },
  { nombre: "Gusano blanco", cientifico: "Diloboderus abderus", categoria: "Insecto" },
  { nombre: "Gusano alambre", cientifico: "Conoderus spp.", categoria: "Insecto" },
  { nombre: "Chinche verde", cientifico: "Nezara viridula", categoria: "Insecto" },
  { nombre: "Chinche marrón", cientifico: "Euschistus heros", categoria: "Insecto" },
  { nombre: "Chinche de la alfalfa", cientifico: "Edessa meditabunda", categoria: "Insecto" },
  { nombre: "Chinche diminuta", cientifico: "Piezodorus guildinii", categoria: "Insecto" },
  { nombre: "Chinche de los cuernos", cientifico: "Dichelops furcatus", categoria: "Insecto" },
  { nombre: "Pulgón verde de los cereales", cientifico: "Schizaphis graminum", categoria: "Insecto" },
  { nombre: "Pulgón de la espiga", cientifico: "Sitobion avenae", categoria: "Insecto" },
  { nombre: "Pulgón ruso del trigo", cientifico: "Diuraphis noxia", categoria: "Insecto" },
  { nombre: "Pulgón amarillo del sorgo", cientifico: "Melanaphis sacchari", categoria: "Insecto" },
  { nombre: "Pulgón negro de los cereales", cientifico: "Rhopalosiphum padi", categoria: "Insecto" },
  { nombre: "Pulgón verde del duraznero", cientifico: "Myzus persicae", categoria: "Insecto" },
  { nombre: "Pulgón de la soja", cientifico: "Aphis glycines", categoria: "Insecto" },
  { nombre: "Mosca blanca", cientifico: "Bemisia tabaci", categoria: "Insecto" },
  { nombre: "Trips", cientifico: "Frankliniella spp.", categoria: "Insecto" },
  { nombre: "Trips del poroto", cientifico: "Caliothrips phaseoli", categoria: "Insecto" },
  { nombre: "Arañuela roja", cientifico: "Tetranychus urticae", categoria: "Insecto" },
  { nombre: "Vaquita de San Antonio", cientifico: "Diabrotica speciosa", categoria: "Insecto" },
  { nombre: "Astylus / Siete de oro", cientifico: "Astylus atromaculatus", categoria: "Insecto" },
  { nombre: "Bicho moro", cientifico: "Epicauta spp.", categoria: "Insecto" },
  { nombre: "Gorgojo del grano", cientifico: "Sitophilus oryzae", categoria: "Insecto" },
  { nombre: "Gorgojo del maíz", cientifico: "Sitophilus zeamais", categoria: "Insecto" },
  { nombre: "Carcoma de los granos", cientifico: "Rhyzopertha dominica", categoria: "Insecto" },
  { nombre: "Tribolio", cientifico: "Tribolium castaneum", categoria: "Insecto" },
  { nombre: "Polilla de los cereales", cientifico: "Sitotroga cerealella", categoria: "Insecto" },
  { nombre: "Grillo topo", cientifico: "Neoscapteriscus spp.", categoria: "Insecto" },
  { nombre: "Hormiga cortadora", cientifico: "Acromyrmex spp.", categoria: "Insecto" },
  { nombre: "Hormiga negra", cientifico: "Atta spp.", categoria: "Insecto" },
  { nombre: "Langosta sudamericana", cientifico: "Schistocerca cancellata", categoria: "Insecto" },
  { nombre: "Tucura quebrachera", cientifico: "Tropidacris collaris", categoria: "Insecto" },
  { nombre: "Cochinilla harinosa", cientifico: "Planococcus spp.", categoria: "Insecto" },
  { nombre: "Mosca de la fruta", cientifico: "Ceratitis capitata", categoria: "Insecto" },
  { nombre: "Mosca de los estiércoles", cientifico: "Delia platura", categoria: "Insecto" },
  { nombre: "Cascarudo", cientifico: "Cyclocephala signaticollis", categoria: "Insecto" },
  { nombre: "Babosa", cientifico: "Deroceras reticulatum", categoria: "Insecto" },
  { nombre: "Caracol", cientifico: "Helix aspersa", categoria: "Insecto" },
  { nombre: "Nematodo del quiste de la soja", cientifico: "Heterodera glycines", categoria: "Insecto" },
  { nombre: "Nematodo de las agallas", cientifico: "Meloidogyne spp.", categoria: "Insecto" },

  // ===================== ENFERMEDADES =====================
  { nombre: "Roya de la hoja del trigo", cientifico: "Puccinia triticina", categoria: "Enfermedad" },
  { nombre: "Roya amarilla / estriada", cientifico: "Puccinia striiformis", categoria: "Enfermedad" },
  { nombre: "Roya del tallo", cientifico: "Puccinia graminis", categoria: "Enfermedad" },
  { nombre: "Roya común del maíz", cientifico: "Puccinia sorghi", categoria: "Enfermedad" },
  { nombre: "Roya del sur del maíz", cientifico: "Puccinia polysora", categoria: "Enfermedad" },
  { nombre: "Roya asiática de la soja", cientifico: "Phakopsora pachyrhizi", categoria: "Enfermedad" },
  { nombre: "Roya del girasol", cientifico: "Puccinia helianthi", categoria: "Enfermedad" },
  { nombre: "Mancha de la hoja del trigo", cientifico: "Zymoseptoria tritici", categoria: "Enfermedad" },
  { nombre: "Mancha amarilla del trigo", cientifico: "Pyrenophora tritici-repentis", categoria: "Enfermedad" },
  { nombre: "Fusariosis de la espiga", cientifico: "Fusarium graminearum", categoria: "Enfermedad" },
  { nombre: "Tizón común del maíz", cientifico: "Exserohilum turcicum", categoria: "Enfermedad" },
  { nombre: "Cercospora del maíz", cientifico: "Cercospora zeae-maydis", categoria: "Enfermedad" },
  { nombre: "Mancha ojo de rana", cientifico: "Cercospora sojina", categoria: "Enfermedad" },
  { nombre: "Mancha marrón de la soja", cientifico: "Septoria glycines", categoria: "Enfermedad" },
  { nombre: "Tizón de la hoja de la soja", cientifico: "Cercospora kikuchii", categoria: "Enfermedad" },
  { nombre: "Carbón del maíz", cientifico: "Ustilago maydis", categoria: "Enfermedad" },
  { nombre: "Carbón volador de la cebada", cientifico: "Ustilago nuda", categoria: "Enfermedad" },
  { nombre: "Mildiu del girasol", cientifico: "Plasmopara halstedii", categoria: "Enfermedad" },
  { nombre: "Esclerotinia / Podredumbre húmeda", cientifico: "Sclerotinia sclerotiorum", categoria: "Enfermedad" },
  { nombre: "Podredumbre carbonosa", cientifico: "Macrophomina phaseolina", categoria: "Enfermedad" },
  { nombre: "Antracnosis", cientifico: "Colletotrichum truncatum", categoria: "Enfermedad" },
  { nombre: "Oídio / Cenicilla", cientifico: "Blumeria graminis", categoria: "Enfermedad" },
  { nombre: "Mancha en red de la cebada", cientifico: "Pyrenophora teres", categoria: "Enfermedad" },
  { nombre: "Escaldadura de la cebada", cientifico: "Rhynchosporium commune", categoria: "Enfermedad" },
  { nombre: "Podredumbre de raíz y tallo", cientifico: "Rhizoctonia solani", categoria: "Enfermedad" },
  { nombre: "Damping-off / Mal de los almácigos", cientifico: "Pythium spp.", categoria: "Enfermedad" },
  { nombre: "Podredumbre de raíz", cientifico: "Phytophthora sojae", categoria: "Enfermedad" },
  { nombre: "Cancro del tallo de la soja", cientifico: "Diaporthe phaseolorum", categoria: "Enfermedad" },
  { nombre: "Tizón del tallo / Phomopsis", cientifico: "Phomopsis longicolla", categoria: "Enfermedad" },
  { nombre: "Marchitamiento por Verticillium", cientifico: "Verticillium dahliae", categoria: "Enfermedad" },
  { nombre: "Fusariosis vascular", cientifico: "Fusarium oxysporum", categoria: "Enfermedad" },
  { nombre: "Podredumbre del tallo del maíz", cientifico: "Stenocarpella maydis", categoria: "Enfermedad" },
  { nombre: "Mancha gris de la hoja", cientifico: "Cercospora zeina", categoria: "Enfermedad" },
  { nombre: "Pústula bacteriana de la soja", cientifico: "Xanthomonas axonopodis", categoria: "Enfermedad" },
  { nombre: "Tizón bacteriano de la soja", cientifico: "Pseudomonas savastanoi", categoria: "Enfermedad" },
  { nombre: "Mal de Río Cuarto (virus)", cientifico: "Mal de Río Cuarto virus (MRCV)", categoria: "Enfermedad" },
  { nombre: "Achaparramiento del maíz", cientifico: "Spiroplasma kunkelii", categoria: "Enfermedad" },
  { nombre: "Mosaico común de la soja (virus)", cientifico: "Soybean mosaic virus (SMV)", categoria: "Enfermedad" },
  { nombre: "Virus del enanismo amarillo de la cebada", cientifico: "Barley yellow dwarf virus (BYDV)", categoria: "Enfermedad" },
  { nombre: "Tizón tardío", cientifico: "Phytophthora infestans", categoria: "Enfermedad" },
  { nombre: "Moho gris / Botritis", cientifico: "Botrytis cinerea", categoria: "Enfermedad" },
  { nombre: "Alternariosis", cientifico: "Alternaria spp.", categoria: "Enfermedad" },
  { nombre: "Podredumbre blanca del girasol", cientifico: "Sclerotinia sclerotiorum (girasol)", categoria: "Enfermedad" },
  { nombre: "Verticilosis del girasol", cientifico: "Verticillium dahliae (girasol)", categoria: "Enfermedad" },

  // ===================== MALEZAS =====================
  { nombre: "Yuyo colorado / Amaranto", cientifico: "Amaranthus hybridus", categoria: "Maleza" },
  { nombre: "Amaranto palmeri", cientifico: "Amaranthus palmeri", categoria: "Maleza" },
  { nombre: "Amaranto quitensis", cientifico: "Amaranthus quitensis", categoria: "Maleza" },
  { nombre: "Rama negra", cientifico: "Conyza bonariensis", categoria: "Maleza" },
  { nombre: "Sorgo de Alepo", cientifico: "Sorghum halepense", categoria: "Maleza" },
  { nombre: "Gramón / Pasto bermuda", cientifico: "Cynodon dactylon", categoria: "Maleza" },
  { nombre: "Capín / Pasto colorado", cientifico: "Echinochloa colona", categoria: "Maleza" },
  { nombre: "Capín arroz", cientifico: "Echinochloa crus-galli", categoria: "Maleza" },
  { nombre: "Pasto cuaresma", cientifico: "Digitaria sanguinalis", categoria: "Maleza" },
  { nombre: "Pata de gallina", cientifico: "Eleusine indica", categoria: "Maleza" },
  { nombre: "Cola de zorro", cientifico: "Setaria spp.", categoria: "Maleza" },
  { nombre: "Roseta / Cadillo", cientifico: "Cenchrus spp.", categoria: "Maleza" },
  { nombre: "Cloris / Pasto romano", cientifico: "Chloris spp.", categoria: "Maleza" },
  { nombre: "Avena guacha", cientifico: "Avena fatua", categoria: "Maleza" },
  { nombre: "Raigrás", cientifico: "Lolium multiflorum", categoria: "Maleza" },
  { nombre: "Nabo", cientifico: "Brassica rapa", categoria: "Maleza" },
  { nombre: "Mostacilla", cientifico: "Sisymbrium irio", categoria: "Maleza" },
  { nombre: "Quínoa / Quinguilla", cientifico: "Chenopodium album", categoria: "Maleza" },
  { nombre: "Cardo de Castilla", cientifico: "Cynara cardunculus", categoria: "Maleza" },
  { nombre: "Cardo ruso", cientifico: "Salsola kali", categoria: "Maleza" },
  { nombre: "Cardo negro", cientifico: "Cirsium vulgare", categoria: "Maleza" },
  { nombre: "Diente de león", cientifico: "Taraxacum officinale", categoria: "Maleza" },
  { nombre: "Verdolaga", cientifico: "Portulaca oleracea", categoria: "Maleza" },
  { nombre: "Correhuela / Enredadera", cientifico: "Convolvulus arvensis", categoria: "Maleza" },
  { nombre: "Campanilla / Bejuco", cientifico: "Ipomoea spp.", categoria: "Maleza" },
  { nombre: "Sanguinaria", cientifico: "Polygonum aviculare", categoria: "Maleza" },
  { nombre: "Cerraja", cientifico: "Sonchus oleraceus", categoria: "Maleza" },
  { nombre: "Lengua de vaca", cientifico: "Rumex crispus", categoria: "Maleza" },
  { nombre: "Malva / Anoda", cientifico: "Anoda cristata", categoria: "Maleza" },
  { nombre: "Chamico", cientifico: "Datura ferox", categoria: "Maleza" },
  { nombre: "Amor seco", cientifico: "Bidens pilosa", categoria: "Maleza" },
  { nombre: "Gomphrena", cientifico: "Gomphrena perennis", categoria: "Maleza" },
  { nombre: "Flor amarilla", cientifico: "Diplotaxis tenuifolia", categoria: "Maleza" },
  { nombre: "Bowlesia", cientifico: "Bowlesia incana", categoria: "Maleza" },
  { nombre: "Ortiga mansa", cientifico: "Lamium amplexicaule", categoria: "Maleza" },
  { nombre: "Trébol de carretilla", cientifico: "Medicago polymorpha", categoria: "Maleza" },
  { nombre: "Manzanilla", cientifico: "Matricaria chamomilla", categoria: "Maleza" },
  { nombre: "Cebadilla", cientifico: "Bromus catharticus", categoria: "Maleza" },
  { nombre: "Perejilillo", cientifico: "Bowlesia incana", categoria: "Maleza" },
  { nombre: "Apio cimarrón", cientifico: "Ammi majus", categoria: "Maleza" },
  { nombre: "Senecio / Yuyo sapo", cientifico: "Senecio spp.", categoria: "Maleza" },
  { nombre: "Crucífera silvestre", cientifico: "Raphanus sativus", categoria: "Maleza" },
  { nombre: "Viola / Pensamiento silvestre", cientifico: "Viola arvensis", categoria: "Maleza" },
];

/** Quita acentos y pasa a minúscula, para buscar sin importar tildes. */
export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Filtra el catálogo por categoría y texto (nombre común o científico). */
export function buscarPlagas(categoria: CategoriaPlaga, texto: string, limite = 50): EntradaPlaga[] {
  const q = normalizar(texto.trim());
  const base = CATALOGO_PLAGAS.filter((p) => p.categoria === categoria);
  if (!q) return base.slice(0, limite);
  return base.filter((p) => normalizar(p.nombre).includes(q) || normalizar(p.cientifico).includes(q)).slice(0, limite);
}
