-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "hectareas" DECIMAL(10,2),
    "ubicacion" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacciones" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "metodoPago" TEXT,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "campoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transacciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lote" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "hectareas" DOUBLE PRECISION NOT NULL,
    "cultivo" TEXT,
    "coordenadas" TEXT,
    "centroLatitud" DOUBLE PRECISION,
    "centroLongitud" DOUBLE PRECISION,
    "perimetro" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "establecimientoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Siembra" (
    "id" TEXT NOT NULL,
    "cultivo" TEXT NOT NULL,
    "variedad" TEXT,
    "fechaSiembra" TIMESTAMP(3) NOT NULL,
    "hectareas" DOUBLE PRECISION NOT NULL,
    "loteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Siembra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cosecha" (
    "id" TEXT NOT NULL,
    "fechaCosecha" TIMESTAMP(3) NOT NULL,
    "rendimiento" DOUBLE PRECISION NOT NULL,
    "calidad" TEXT,
    "precioVenta" DOUBLE PRECISION,
    "siembraId" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cosecha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL,
    "caravana" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "raza" TEXT,
    "sexo" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "pesoNacimiento" DOUBLE PRECISION,
    "madre" TEXT,
    "padre" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoSanitario" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "producto" TEXT,
    "dosis" TEXT,
    "animalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventoSanitario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimiento" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT,
    "monto" DOUBLE PRECISION,
    "animalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "producto" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "montoTotal" DOUBLE PRECISION NOT NULL,
    "comprador" TEXT,
    "fechaContrato" TIMESTAMP(3) NOT NULL,
    "fechaEntrega" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrega" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "contratoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrecioReferencia" (
    "id" TEXT NOT NULL,
    "producto" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fuente" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrecioReferencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmisionCarbono" (
    "id" TEXT NOT NULL,
    "fuente" TEXT NOT NULL,
    "actividad" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "factorEmision" DOUBLE PRECISION NOT NULL,
    "emisionTotal" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "loteId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmisionCarbono_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticaSostenible" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "beneficio" TEXT,
    "loteId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticaSostenible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "entidadEmisora" TEXT NOT NULL,
    "numeroRegistro" TEXT,
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'Vigente',
    "documentoUrl" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Labor" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "loteId" TEXT NOT NULL,
    "superficieTrabajada" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT NOT NULL,
    "observaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Programada',
    "prioridad" TEXT NOT NULL DEFAULT 'Normal',
    "motivoBloqueo" TEXT,
    "operarios" TEXT,
    "horasTrabajadas" DOUBLE PRECISION,
    "maquinariaId" TEXT,
    "aplicadoPor" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Labor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AplicacionProducto" (
    "id" TEXT NOT NULL,
    "laborId" TEXT NOT NULL,
    "tipoProducto" TEXT NOT NULL,
    "nombreProducto" TEXT NOT NULL,
    "principioActivo" TEXT,
    "dosis" DOUBLE PRECISION NOT NULL,
    "unidadDosis" TEXT NOT NULL,
    "metodoAplicacion" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AplicacionProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoReproductivo" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "animalId" TEXT NOT NULL,
    "tipoServicio" TEXT,
    "toroId" TEXT,
    "semenId" TEXT,
    "resultado" TEXT,
    "diasGestacion" INTEGER,
    "numCrias" INTEGER,
    "condicionParto" TEXT,
    "crias" TEXT,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventoReproductivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialReproductivo" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "totalPartos" INTEGER NOT NULL DEFAULT 0,
    "totalCriasNacidas" INTEGER NOT NULL DEFAULT 0,
    "totalCriasVivas" INTEGER NOT NULL DEFAULT 0,
    "ultimoParto" TIMESTAMP(3),
    "ultimoServicio" TIMESTAMP(3),
    "ultimoDiagnostico" TIMESTAMP(3),
    "estadoActual" TEXT NOT NULL DEFAULT 'Vacía',
    "fechaEsperadaParto" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistorialReproductivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UbicacionProducto" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "loteId" TEXT,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UbicacionProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferenciaProducto" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "origenUbicacion" TEXT NOT NULL,
    "destinoUbicacion" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "responsable" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferenciaProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaClimatica" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidad" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "temperatura" DOUBLE PRECISION,
    "precipitacion" DOUBLE PRECISION,
    "viento" DOUBLE PRECISION,
    "humedad" DOUBLE PRECISION,
    "ubicacion" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "recomendacion" TEXT,
    "fuenteDatos" TEXT NOT NULL DEFAULT 'OpenMeteo',
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertaClimatica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ubicacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ciudad" TEXT,
    "provincia" TEXT,
    "pais" TEXT NOT NULL DEFAULT 'Uruguay',
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ubicacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alimento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "proteina" DOUBLE PRECISION NOT NULL,
    "energia" DOUBLE PRECISION NOT NULL,
    "fibraCruda" DOUBLE PRECISION,
    "humedad" DOUBLE PRECISION,
    "costoKg" DOUBLE PRECISION NOT NULL,
    "disponibilidad" TEXT NOT NULL DEFAULT 'Disponible',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Racion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "animalObjetivo" TEXT NOT NULL,
    "pesoObjetivo" DOUBLE PRECISION NOT NULL,
    "etapaProductiva" TEXT NOT NULL,
    "consumoDiario" DOUBLE PRECISION NOT NULL,
    "proteinaTotal" DOUBLE PRECISION NOT NULL,
    "energiaTotal" DOUBLE PRECISION NOT NULL,
    "costoTotal" DOUBLE PRECISION NOT NULL,
    "observaciones" TEXT,
    "recomendacionIA" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Racion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponenteRacion" (
    "id" TEXT NOT NULL,
    "racionId" TEXT NOT NULL,
    "alimentoId" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "porcentaje" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComponenteRacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuentaBancaria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "numeroCuenta" TEXT NOT NULL,
    "tipoCuenta" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldoLibros" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuentaBancaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractoBancario" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "referencia" TEXT,
    "debito" DOUBLE PRECISION,
    "credito" DOUBLE PRECISION,
    "saldo" DOUBLE PRECISION NOT NULL,
    "conciliado" BOOLEAN NOT NULL DEFAULT false,
    "transaccionId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractoBancario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conciliacion" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "saldoInicialBanco" DOUBLE PRECISION NOT NULL,
    "saldoFinalBanco" DOUBLE PRECISION NOT NULL,
    "saldoInicialLibros" DOUBLE PRECISION NOT NULL,
    "saldoFinalLibros" DOUBLE PRECISION NOT NULL,
    "diferencia" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "itemsConciliados" INTEGER NOT NULL DEFAULT 0,
    "itemsPendientes" INTEGER NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conciliacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiferenciaConciliacion" (
    "id" TEXT NOT NULL,
    "conciliacionId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "montoLibros" DOUBLE PRECISION,
    "montoBanco" DOUBLE PRECISION,
    "diferencia" DOUBLE PRECISION NOT NULL,
    "resuelto" BOOLEAN NOT NULL DEFAULT false,
    "observacion" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiferenciaConciliacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroLechero" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "litros" DOUBLE PRECISION NOT NULL,
    "turno" TEXT,
    "calidad" TEXT,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroLechero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostoLote" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "costoTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fecha" TIMESTAMP(3) NOT NULL,
    "laborId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostoLote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostoAnimal" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "costoTotal" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "eventoSanitarioId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostoAnimal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MargenBruto" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "referenciaId" TEXT NOT NULL,
    "referenciaNombre" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "ingresos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "margen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "porcentajeMargen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "detalles" TEXT,
    "margenPorcentaje" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MargenBruto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Arrendamiento" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "arrendatario" TEXT NOT NULL,
    "tipoContrato" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "montoFijo" DOUBLE PRECISION,
    "quintales" DOUBLE PRECISION,
    "porcentaje" DOUBLE PRECISION,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Arrendamiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaPredictiva" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidad" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "recomendacion" TEXT NOT NULL,
    "entidad" TEXT,
    "entidadId" TEXT,
    "entidadNombre" TEXT,
    "fechaDeteccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'Activa',
    "metadata" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertaPredictiva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanSiembra" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "cultivo" TEXT NOT NULL,
    "variedad" TEXT,
    "fechaSiembraRecomendada" TIMESTAMP(3) NOT NULL,
    "fechaCosechaEstimada" TIMESTAMP(3) NOT NULL,
    "hectareas" DOUBLE PRECISION NOT NULL,
    "rendimientoEstimado" DOUBLE PRECISION,
    "costoEstimado" DOUBLE PRECISION,
    "ingresoEstimado" DOUBLE PRECISION,
    "margenEstimado" DOUBLE PRECISION,
    "confianza" DOUBLE PRECISION,
    "analisisIA" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Planificado',
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanSiembra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalisisSuelo" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "fechaAnalisis" TIMESTAMP(3) NOT NULL,
    "pH" DOUBLE PRECISION,
    "materiaOrganica" DOUBLE PRECISION,
    "nitrogeno" DOUBLE PRECISION,
    "fosforo" DOUBLE PRECISION,
    "potasio" DOUBLE PRECISION,
    "observaciones" TEXT,
    "recomendaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalisisSuelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroTrazabilidad" (
    "id" TEXT NOT NULL,
    "codigoQR" TEXT NOT NULL,
    "tipoProducto" TEXT NOT NULL,
    "nombreProducto" TEXT NOT NULL,
    "loteProduccion" TEXT,
    "hashBlockchain" TEXT NOT NULL,
    "hashAnterior" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campo" TEXT,
    "ubicacion" TEXT,
    "certificaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroTrazabilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtapaTrazabilidad" (
    "id" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "etapa" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "responsable" TEXT,
    "ubicacion" TEXT,
    "datos" TEXT,
    "imagenes" TEXT,
    "documentos" TEXT,
    "hashValidacion" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EtapaTrazabilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarcadorGeorreferenciado" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagenes" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsable" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarcadorGeorreferenciado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagenSatelital" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fuente" TEXT NOT NULL,
    "tipoIndice" TEXT NOT NULL,
    "urlImagen" TEXT NOT NULL,
    "urlThumbnail" TEXT,
    "nubosidad" DOUBLE PRECISION,
    "resolucion" DOUBLE PRECISION,
    "bandas" TEXT,
    "ndviPromedio" DOUBLE PRECISION,
    "ndviMin" DOUBLE PRECISION,
    "ndviMax" DOUBLE PRECISION,
    "areaVerde" DOUBLE PRECISION,
    "areaProblema" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImagenSatelital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroPluviometrico" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "milimetros" DOUBLE PRECISION NOT NULL,
    "loteId" TEXT,
    "ubicacion" TEXT,
    "metodo" TEXT NOT NULL DEFAULT 'Manual',
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroPluviometrico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalculoDosis" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoProducto" TEXT NOT NULL,
    "nombreProducto" TEXT NOT NULL,
    "concentracion" DOUBLE PRECISION,
    "dosisObjetivo" DOUBLE PRECISION NOT NULL,
    "superficieHa" DOUBLE PRECISION NOT NULL,
    "cantidadTotal" DOUBLE PRECISION NOT NULL,
    "costoUnitario" DOUBLE PRECISION,
    "costoTotal" DOUBLE PRECISION,
    "aguaPorHa" DOUBLE PRECISION,
    "aguaTotal" DOUBLE PRECISION,
    "observaciones" TEXT,
    "loteId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalculoDosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaPlaga" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "plaga" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidad" TEXT NOT NULL,
    "confianza" DOUBLE PRECISION NOT NULL,
    "fechaDeteccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodoDeteccion" TEXT NOT NULL,
    "imagenUrl" TEXT,
    "sintomas" TEXT,
    "areaAfectada" DOUBLE PRECISION,
    "ubicacionGPS" TEXT,
    "recomendacion" TEXT NOT NULL,
    "productos" TEXT,
    "momento" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Activa',
    "fechaResolucion" TIMESTAMP(3),
    "tratamientoAplicado" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertaPlaga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanRiego" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cultivo" TEXT NOT NULL,
    "etapaFenologica" TEXT NOT NULL,
    "tipoSuelo" TEXT,
    "capacidadCampo" DOUBLE PRECISION,
    "puntoMarchitez" DOUBLE PRECISION,
    "etcDiaria" DOUBLE PRECISION NOT NULL,
    "frecuenciaRiego" INTEGER NOT NULL,
    "laminaRiego" DOUBLE PRECISION NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "diasActivoSemana" TEXT NOT NULL DEFAULT '1,2,3,4,5,6,7',
    "horaInicio" TEXT NOT NULL DEFAULT '06:00',
    "duracionMinutos" INTEGER,
    "costoMM" DOUBLE PRECISION,
    "eficienciaRiego" DOUBLE PRECISION NOT NULL DEFAULT 85,
    "modoIA" BOOLEAN NOT NULL DEFAULT false,
    "ajustesIA" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Planificado',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanRiego_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoRiego" (
    "id" TEXT NOT NULL,
    "planRiegoId" TEXT NOT NULL,
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "fechaReal" TIMESTAMP(3),
    "laminaAplicada" DOUBLE PRECISION,
    "duracionReal" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'Programado',
    "motivoCancelacion" TEXT,
    "temperatura" DOUBLE PRECISION,
    "humedadSuelo" DOUBLE PRECISION,
    "precipitacion" DOUBLE PRECISION,
    "viento" DOUBLE PRECISION,
    "costo" DOUBLE PRECISION,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventoRiego_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticoSalud" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "veterinario" TEXT,
    "motivoConsulta" TEXT NOT NULL,
    "temperatura" DOUBLE PRECISION,
    "frecuenciaCardiaca" INTEGER,
    "frecuenciaRespiratoria" INTEGER,
    "condicionCorporal" DOUBLE PRECISION,
    "diagnostico" TEXT NOT NULL,
    "sintomas" TEXT,
    "tratamiento" TEXT NOT NULL,
    "medicamentos" TEXT,
    "proximaRevision" TIMESTAMP(3),
    "observaciones" TEXT,
    "costoConsulta" DOUBLE PRECISION,
    "riesgo" TEXT,
    "recomendacionIA" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticoSalud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanNutricional" (
    "id" TEXT NOT NULL,
    "animalId" TEXT,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoriaAnimal" TEXT NOT NULL,
    "pesoActual" DOUBLE PRECISION,
    "pesoObjetivo" DOUBLE PRECISION,
    "gananciaEsperada" DOUBLE PRECISION,
    "produccionLeche" DOUBLE PRECISION,
    "energiaDiaria" DOUBLE PRECISION NOT NULL,
    "proteinaDiaria" DOUBLE PRECISION NOT NULL,
    "fibraDiaria" DOUBLE PRECISION,
    "composicionDieta" TEXT NOT NULL,
    "costoTotal" DOUBLE PRECISION,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "generadoPorIA" BOOLEAN NOT NULL DEFAULT false,
    "analisisIA" TEXT,
    "eficienciaAlimenticia" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanNutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroConsumo" (
    "id" TEXT NOT NULL,
    "planNutricionalId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "alimentoId" TEXT,
    "cantidadOfrecida" DOUBLE PRECISION NOT NULL,
    "cantidadConsumida" DOUBLE PRECISION,
    "rechazo" DOUBLE PRECISION,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroConsumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AjusteNutricional" (
    "id" TEXT NOT NULL,
    "planNutricionalId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT NOT NULL,
    "ajusteRealizado" TEXT NOT NULL,
    "datosAnteriores" TEXT,
    "datosNuevos" TEXT NOT NULL,
    "responsable" TEXT,
    "generadoPorIA" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AjusteNutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalisisReproductivo" (
    "id" TEXT NOT NULL,
    "tipoAnalisis" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "totalHembras" INTEGER NOT NULL,
    "hembrasCubiertas" INTEGER NOT NULL,
    "tasaServicio" DOUBLE PRECISION NOT NULL,
    "tasaPreniez" DOUBLE PRECISION NOT NULL,
    "tasaNatalidad" DOUBLE PRECISION NOT NULL,
    "tasaMortalidad" DOUBLE PRECISION NOT NULL,
    "intervaloPartos" DOUBLE PRECISION,
    "edadPrimerParto" DOUBLE PRECISION,
    "criasDestetadas" INTEGER,
    "pesoDestete" DOUBLE PRECISION,
    "torosUtilizados" INTEGER,
    "mejorToroId" TEXT,
    "costoTotal" DOUBLE PRECISION,
    "costoServicio" DOUBLE PRECISION,
    "costoCria" DOUBLE PRECISION,
    "recomendacionIA" TEXT,
    "areasDeRecomen" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalisisReproductivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaSanitaria" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidad" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "animalId" TEXT,
    "categoria" TEXT,
    "numeroAfectados" INTEGER NOT NULL DEFAULT 1,
    "accionRequerida" TEXT NOT NULL,
    "fechaLimite" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "deteccionIA" BOOLEAN NOT NULL DEFAULT false,
    "confianza" DOUBLE PRECISION,
    "recomendacion" TEXT,
    "fechaResolucion" TIMESTAMP(3),
    "accionTomada" TEXT,
    "responsable" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertaSanitaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RotacionCultivo" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "cultivo" TEXT NOT NULL,
    "variedad" TEXT,
    "fechaSiembra" TIMESTAMP(3) NOT NULL,
    "fechaCosecha" TIMESTAMP(3),
    "rendimiento" DOUBLE PRECISION,
    "calidadCosecha" TEXT,
    "tipoRotacion" TEXT,
    "aporteNitrogeno" DOUBLE PRECISION,
    "residuosCosecha" DOUBLE PRECISION,
    "laboreo" TEXT,
    "fertilizacion" TEXT,
    "fitosanitarios" TEXT,
    "costoTotal" DOUBLE PRECISION,
    "ingresoTotal" DOUBLE PRECISION,
    "margenBruto" DOUBLE PRECISION,
    "observaciones" TEXT,
    "analisisIA" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RotacionCultivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZonaManejo" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "coordenadas" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "potencialProductivo" TEXT NOT NULL,
    "tipoSuelo" TEXT,
    "profundidad" DOUBLE PRECISION,
    "pendiente" TEXT,
    "indiceVerde" DOUBLE PRECISION,
    "capacidadAgua" DOUBLE PRECISION,
    "phSuelo" DOUBLE PRECISION,
    "materiaOrganica" DOUBLE PRECISION,
    "dosisVariable" TEXT,
    "restricciones" TEXT,
    "rendimientoPromedio" DOUBLE PRECISION,
    "observaciones" TEXT,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZonaManejo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapaPrescripcion" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cultivo" TEXT,
    "producto" TEXT NOT NULL,
    "archivoUrl" TEXT,
    "formatoArchivo" TEXT NOT NULL DEFAULT 'Shapefile',
    "prescripcionDatos" TEXT NOT NULL,
    "dosisPromedio" DOUBLE PRECISION NOT NULL,
    "dosisMinima" DOUBLE PRECISION NOT NULL,
    "dosisMaxima" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generadoPorIA" BOOLEAN NOT NULL DEFAULT false,
    "criterios" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "fechaAplicacion" TIMESTAMP(3),
    "maquinariaUsada" TEXT,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapaPrescripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PronosticoClimatico" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "fuente" TEXT NOT NULL DEFAULT 'OpenWeatherMap',
    "temperaturaMin" DOUBLE PRECISION NOT NULL,
    "temperaturaMax" DOUBLE PRECISION NOT NULL,
    "temperaturaMedia" DOUBLE PRECISION NOT NULL,
    "humedad" DOUBLE PRECISION NOT NULL,
    "precipitacion" DOUBLE PRECISION NOT NULL,
    "probabilidadLluvia" DOUBLE PRECISION NOT NULL,
    "vientoVelocidad" DOUBLE PRECISION NOT NULL,
    "vientoDireccion" TEXT,
    "condicion" TEXT NOT NULL,
    "icono" TEXT,
    "alertas" TEXT,
    "aptoPulverizar" BOOLEAN NOT NULL DEFAULT true,
    "aptoSembrar" BOOLEAN NOT NULL DEFAULT true,
    "aptoCosechar" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PronosticoClimatico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorIoT" (
    "id" TEXT NOT NULL,
    "loteId" TEXT,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "profundidad" DOUBLE PRECISION,
    "protocolo" TEXT,
    "endpoint" TEXT,
    "apiKey" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "ultimaLectura" TIMESTAMP(3),
    "ultimoValor" DOUBLE PRECISION,
    "unidad" TEXT,
    "frecuenciaMedicion" INTEGER,
    "alertaMin" DOUBLE PRECISION,
    "alertaMax" DOUBLE PRECISION,
    "ultimaCalibracion" TIMESTAMP(3),
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SensorIoT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapaRendimiento" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "cosechaId" TEXT,
    "nombre" TEXT NOT NULL,
    "cultivo" TEXT NOT NULL,
    "fechaCosecha" TIMESTAMP(3) NOT NULL,
    "datosRendimiento" TEXT NOT NULL,
    "rendimientoPromedio" DOUBLE PRECISION NOT NULL,
    "rendimientoMinimo" DOUBLE PRECISION NOT NULL,
    "rendimientoMaximo" DOUBLE PRECISION NOT NULL,
    "coeficienteVariacion" DOUBLE PRECISION NOT NULL,
    "zonaAlta" DOUBLE PRECISION,
    "zonaMedia" DOUBLE PRECISION,
    "zonaBaja" DOUBLE PRECISION,
    "analisisIA" TEXT,
    "recomendaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MapaRendimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalisisCostoRiego" (
    "id" TEXT NOT NULL,
    "planRiegoId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "laminaTotal" DOUBLE PRECISION NOT NULL,
    "volumenTotal" DOUBLE PRECISION NOT NULL,
    "numeroRiegos" INTEGER NOT NULL,
    "horasOperacion" DOUBLE PRECISION NOT NULL,
    "energiaConsumida" DOUBLE PRECISION NOT NULL,
    "costoEnergia" DOUBLE PRECISION NOT NULL,
    "costoManoObra" DOUBLE PRECISION,
    "costoMantenimiento" DOUBLE PRECISION,
    "costoTotal" DOUBLE PRECISION NOT NULL,
    "incrementoRendimiento" DOUBLE PRECISION,
    "valorIncremento" DOUBLE PRECISION,
    "costoMM" DOUBLE PRECISION NOT NULL,
    "relacionBeneficioCosto" DOUBLE PRECISION,
    "eficienciaAplicacion" DOUBLE PRECISION,
    "uniformidadRiego" DOUBLE PRECISION,
    "analisisIA" TEXT,
    "oportunidadesMejora" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalisisCostoRiego_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroPeso" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "peso" DOUBLE PRECISION NOT NULL,
    "tipoMedicion" TEXT NOT NULL,
    "metodoMedicion" TEXT NOT NULL DEFAULT 'Balanza',
    "condicionCorporal" DOUBLE PRECISION,
    "estadoSalud" TEXT,
    "edadDias" INTEGER,
    "gananciaDesdeAnterior" DOUBLE PRECISION,
    "gananciaPromedioDiaria" DOUBLE PRECISION,
    "diasDesdeAnterior" INTEGER,
    "analisisIA" TEXT,
    "alertas" TEXT,
    "responsable" TEXT,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroPeso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoAnimal" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoMovimiento" TEXT NOT NULL,
    "origenTipo" TEXT,
    "origenId" TEXT,
    "origenNombre" TEXT,
    "destinoTipo" TEXT,
    "destinoId" TEXT,
    "destinoNombre" TEXT,
    "motivo" TEXT NOT NULL,
    "pesoMovimiento" DOUBLE PRECISION,
    "precioVenta" DOUBLE PRECISION,
    "comprador" TEXT,
    "cargaAnimalAntes" DOUBLE PRECISION,
    "cargaAnimalDespues" DOUBLE PRECISION,
    "observaciones" TEXT,
    "responsable" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimientoAnimal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProduccionLechera" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "litrosManana" DOUBLE PRECISION,
    "litrosTarde" DOUBLE PRECISION,
    "litrosTotales" DOUBLE PRECISION NOT NULL,
    "turno" TEXT,
    "grasa" DOUBLE PRECISION,
    "proteina" DOUBLE PRECISION,
    "lactosa" DOUBLE PRECISION,
    "solidosTotales" DOUBLE PRECISION,
    "scc" DOUBLE PRECISION,
    "ufc" DOUBLE PRECISION,
    "diasLactancia" INTEGER,
    "numeroLactancia" INTEGER,
    "estadoUbre" TEXT,
    "condicionAnimal" TEXT,
    "promedioUltimos7Dias" DOUBLE PRECISION,
    "variacionPorcentual" DOUBLE PRECISION,
    "alertaCaida" BOOLEAN NOT NULL DEFAULT false,
    "analisisIA" TEXT,
    "observaciones" TEXT,
    "responsable" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProduccionLechera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroGenetico" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "padreId" TEXT,
    "madreId" TEXT,
    "abueloPaternoId" TEXT,
    "abuelaPaternaId" TEXT,
    "abueloMaternoId" TEXT,
    "abuelaMaternaId" TEXT,
    "razaPura" BOOLEAN NOT NULL DEFAULT false,
    "porcentajeRaza" DOUBLE PRECISION,
    "registroGenealogia" TEXT,
    "muestraADN" TEXT,
    "fechaMuestraADN" TIMESTAMP(3),
    "laboratorio" TEXT,
    "marcadoresGeneticos" TEXT,
    "valorGeneticoEstimado" DOUBLE PRECISION,
    "facilidadParto" TEXT,
    "habilidadMaterna" TEXT,
    "temperamento" TEXT,
    "gananciaEsperada" DOUBLE PRECISION,
    "pesoAdultoEsperado" DOUBLE PRECISION,
    "produccionLecheEsperada" DOUBLE PRECISION,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroGenetico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalisisROIGenetico" (
    "id" TEXT NOT NULL,
    "reproductorId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "costoAdquisicion" DOUBLE PRECISION,
    "costoMantenimiento" DOUBLE PRECISION NOT NULL,
    "costoServicios" DOUBLE PRECISION NOT NULL,
    "inversionTotal" DOUBLE PRECISION NOT NULL,
    "numeroDescendientes" INTEGER NOT NULL,
    "numeroVendidos" INTEGER NOT NULL,
    "ingresoVentas" DOUBLE PRECISION NOT NULL,
    "valorAgregadoGenetica" DOUBLE PRECISION,
    "ingresoTotal" DOUBLE PRECISION NOT NULL,
    "beneficioNeto" DOUBLE PRECISION NOT NULL,
    "roi" DOUBLE PRECISION NOT NULL,
    "roiAnualizado" DOUBLE PRECISION NOT NULL,
    "pesoPromedioDescendientes" DOUBLE PRECISION,
    "gananciaPromedioDiaria" DOUBLE PRECISION,
    "tasaSobrevivencia" DOUBLE PRECISION,
    "superiorPromedio" DOUBLE PRECISION,
    "rankingRodeo" INTEGER,
    "analisisIA" TEXT,
    "recomendacion" TEXT,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalisisROIGenetico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlCargaAnimal" (
    "id" TEXT NOT NULL,
    "loteId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cantidadAnimales" INTEGER NOT NULL,
    "pesoPromedioAnimales" DOUBLE PRECISION NOT NULL,
    "unidadesAnimal" DOUBLE PRECISION NOT NULL,
    "cargaAnimalUA" DOUBLE PRECISION NOT NULL,
    "cargaAnimalKg" DOUBLE PRECISION NOT NULL,
    "capacidadRecomendada" DOUBLE PRECISION NOT NULL,
    "porcentajeCapacidad" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL,
    "disponibilidadForraje" DOUBLE PRECISION,
    "diasDisponibilidad" INTEGER,
    "animalesAdicionales" INTEGER,
    "animalesReducir" INTEGER,
    "analisisIA" TEXT,
    "alertas" TEXT,
    "observaciones" TEXT,
    "responsable" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlCargaAnimal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoVida" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoEvento" TEXT NOT NULL,
    "referenciaId" TEXT,
    "referenciaModelo" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "valorNumerico" DOUBLE PRECISION,
    "unidad" TEXT,
    "ubicacion" TEXT,
    "importante" BOOLEAN NOT NULL DEFAULT false,
    "alerta" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoVida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockInsumo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT,
    "stockActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockMaximo" DOUBLE PRECISION,
    "unidadMedida" TEXT NOT NULL,
    "precioUnitario" DOUBLE PRECISION,
    "valorStock" DOUBLE PRECISION,
    "alertaStockBajo" BOOLEAN NOT NULL DEFAULT false,
    "alertaVencimiento" BOOLEAN NOT NULL DEFAULT false,
    "ubicacionPrincipal" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockInsumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoteInsumo" (
    "id" TEXT NOT NULL,
    "stockInsumoId" TEXT NOT NULL,
    "numeroLote" TEXT NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "cantidadInicial" DOUBLE PRECISION NOT NULL,
    "cantidadActual" DOUBLE PRECISION NOT NULL,
    "unidadMedida" TEXT NOT NULL,
    "proveedor" TEXT,
    "numeroFactura" TEXT,
    "costoUnitario" DOUBLE PRECISION,
    "costoTotal" DOUBLE PRECISION,
    "ubicacion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Disponible',
    "observaciones" TEXT,
    "diasParaVencer" INTEGER,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoteInsumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoStock" (
    "id" TEXT NOT NULL,
    "stockInsumoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoMovimiento" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "unidadMedida" TEXT NOT NULL,
    "stockAnterior" DOUBLE PRECISION NOT NULL,
    "stockPosterior" DOUBLE PRECISION NOT NULL,
    "origen" TEXT,
    "destino" TEXT,
    "loteInsumoId" TEXT,
    "referenciaId" TEXT,
    "referenciaModelo" TEXT,
    "responsable" TEXT,
    "observaciones" TEXT,
    "costoUnitario" DOUBLE PRECISION,
    "costoTotal" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimientoStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MateriaPrima" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "stockActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unidadMedida" TEXT NOT NULL,
    "proteina" DOUBLE PRECISION,
    "energia" DOUBLE PRECISION,
    "humedad" DOUBLE PRECISION,
    "precioUnitario" DOUBLE PRECISION,
    "valorStock" DOUBLE PRECISION,
    "alertaStockBajo" BOOLEAN NOT NULL DEFAULT false,
    "ubicacion" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MateriaPrima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoMateriaPrima" (
    "id" TEXT NOT NULL,
    "materiaPrimaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoMovimiento" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "unidadMedida" TEXT NOT NULL,
    "stockAnterior" DOUBLE PRECISION NOT NULL,
    "stockPosterior" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimientoMateriaPrima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaStock" (
    "id" TEXT NOT NULL,
    "stockInsumoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "severidad" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fechaDeteccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'Activa',
    "fechaResolucion" TIMESTAMP(3),
    "stockActual" DOUBLE PRECISION,
    "stockMinimo" DOUBLE PRECISION,
    "diasVencimiento" INTEGER,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertaStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transferencia" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "subtipo" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "origenId" TEXT,
    "destino" TEXT NOT NULL,
    "destinoId" TEXT,
    "fechaSolicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaSalida" TIMESTAMP(3),
    "fechaLlegada" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "remito" TEXT,
    "documentoUrl" TEXT,
    "observaciones" TEXT,
    "responsableOrigen" TEXT,
    "responsableDestino" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transferencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleTransferencia" (
    "id" TEXT NOT NULL,
    "transferenciaId" TEXT NOT NULL,
    "tipoItem" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemNombre" TEXT NOT NULL,
    "cantidadSolicitada" DOUBLE PRECISION NOT NULL,
    "cantidadEnviada" DOUBLE PRECISION,
    "cantidadRecibida" DOUBLE PRECISION,
    "unidadMedida" TEXT NOT NULL,
    "loteNumero" TEXT,
    "estadoItem" TEXT,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetalleTransferencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroTransporte" (
    "id" TEXT NOT NULL,
    "transferenciaId" TEXT NOT NULL,
    "patente" TEXT NOT NULL,
    "tipoVehiculo" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "chofer" TEXT NOT NULL,
    "cedulaChofer" TEXT,
    "telefono" TEXT,
    "empresaTransporte" TEXT,
    "horaSalida" TIMESTAMP(3),
    "horaLlegada" TIMESTAMP(3),
    "temperatura" DOUBLE PRECISION,
    "condicionCarga" TEXT,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroTransporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repuesto" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "maquinaria" TEXT,
    "marcaCompatible" TEXT,
    "stockActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unidadMedida" TEXT NOT NULL,
    "ubicacion" TEXT,
    "precioUnitario" DOUBLE PRECISION,
    "valorStock" DOUBLE PRECISION,
    "proveedor" TEXT,
    "codigoProveedor" TEXT,
    "alertaStockBajo" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoRepuesto" (
    "id" TEXT NOT NULL,
    "repuestoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoMovimiento" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "stockAnterior" DOUBLE PRECISION NOT NULL,
    "stockPosterior" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT,
    "costoUnitario" DOUBLE PRECISION,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimientoRepuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsoRepuesto" (
    "id" TEXT NOT NULL,
    "mantenimientoId" TEXT NOT NULL,
    "repuestoId" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "costoUnitario" DOUBLE PRECISION,
    "costoTotal" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsoRepuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TanqueCombustible" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoCombustible" TEXT NOT NULL,
    "capacidadTotal" DOUBLE PRECISION NOT NULL,
    "nivelActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "porcentaje" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ubicacion" TEXT NOT NULL,
    "nivelMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alertaNivelBajo" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TanqueCombustible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CargaCombustible" (
    "id" TEXT NOT NULL,
    "tanqueId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoCarga" TEXT NOT NULL,
    "maquinariaId" TEXT,
    "litros" DOUBLE PRECISION NOT NULL,
    "nivelAnterior" DOUBLE PRECISION NOT NULL,
    "nivelPosterior" DOUBLE PRECISION NOT NULL,
    "precioLitro" DOUBLE PRECISION,
    "costoTotal" DOUBLE PRECISION,
    "horometroActual" DOUBLE PRECISION,
    "consumoLitrosHora" DOUBLE PRECISION,
    "rendimiento" DOUBLE PRECISION,
    "responsable" TEXT,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CargaCombustible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Silo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "capacidadTotal" DOUBLE PRECISION NOT NULL,
    "stockActual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "porcentaje" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tipoSilo" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "coordenadas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Disponible',
    "tieneAireacion" BOOLEAN NOT NULL DEFAULT false,
    "temperaturaMax" DOUBLE PRECISION,
    "humedadMax" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Silo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoSilo" (
    "id" TEXT NOT NULL,
    "siloId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoMovimiento" TEXT NOT NULL,
    "cultivo" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "stockAnterior" DOUBLE PRECISION NOT NULL,
    "stockPosterior" DOUBLE PRECISION NOT NULL,
    "calidadGranoId" TEXT,
    "origen" TEXT,
    "destino" TEXT,
    "ticketBalanzaId" TEXT,
    "observaciones" TEXT,
    "responsable" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimientoSilo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalidadGrano" (
    "id" TEXT NOT NULL,
    "cultivo" TEXT NOT NULL,
    "fechaAnalisis" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "humedad" DOUBLE PRECISION,
    "proteina" DOUBLE PRECISION,
    "materiaGrasa" DOUBLE PRECISION,
    "pesoHectolitro" DOUBLE PRECISION,
    "impurezas" DOUBLE PRECISION,
    "granoPartido" DOUBLE PRECISION,
    "granoDaniado" DOUBLE PRECISION,
    "grado" TEXT,
    "observaciones" TEXT,
    "laboratorio" TEXT,
    "numeroAnalisis" TEXT,
    "bonificacion" DOUBLE PRECISION,
    "castigo" DOUBLE PRECISION,
    "precioAjustado" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalidadGrano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketBalanza" (
    "id" TEXT NOT NULL,
    "numeroTicket" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipoOperacion" TEXT NOT NULL,
    "pesoEntrada" DOUBLE PRECISION,
    "pesoSalida" DOUBLE PRECISION,
    "pesoNeto" DOUBLE PRECISION NOT NULL,
    "pesoTara" DOUBLE PRECISION,
    "producto" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "patente" TEXT NOT NULL,
    "chofer" TEXT,
    "establecimiento" TEXT,
    "destinatario" TEXT,
    "humedad" DOUBLE PRECISION,
    "impurezas" DOUBLE PRECISION,
    "metodoCaptura" TEXT NOT NULL DEFAULT 'Manual',
    "imagenUrl" TEXT,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketBalanza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comprobante" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "rut" TEXT,
    "direccion" TEXT,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "iva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "archivoUrl" TEXT,
    "archivoNombre" TEXT,
    "procesadoOCR" BOOLEAN NOT NULL DEFAULT false,
    "datosOCR" TEXT,
    "confianzaOCR" DOUBLE PRECISION,
    "transaccionId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "fechaPago" TIMESTAMP(3),
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comprobante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemComprobante" (
    "id" TEXT NOT NULL,
    "comprobanteId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "iva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "categoria" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemComprobante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsignacionCosto" (
    "id" TEXT NOT NULL,
    "comprobanteId" TEXT NOT NULL,
    "tipoDestino" TEXT NOT NULL,
    "destinoId" TEXT,
    "destinoNombre" TEXT,
    "monto" DOUBLE PRECISION NOT NULL,
    "porcentaje" DOUBLE PRECISION,
    "tipoCosto" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsignacionCosto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivoFijo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "marca" TEXT,
    "modelo" TEXT,
    "anioFabricacion" INTEGER,
    "numeroSerie" TEXT,
    "valorAdquisicion" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "fechaAdquisicion" TIMESTAMP(3) NOT NULL,
    "vidaUtilAnios" INTEGER NOT NULL,
    "valorResidual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metodoDepreciacion" TEXT NOT NULL DEFAULT 'Lineal',
    "depreciacionAnual" DOUBLE PRECISION NOT NULL,
    "depreciacionMensual" DOUBLE PRECISION NOT NULL,
    "depreciacionAcumulada" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorActual" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "fechaBaja" TIMESTAMP(3),
    "motivoBaja" TEXT,
    "maquinariaId" TEXT,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivoFijo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroDepreciacion" (
    "id" TEXT NOT NULL,
    "activoFijoId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "montoDepreciacion" DOUBLE PRECISION NOT NULL,
    "depreciacionAcumulada" DOUBLE PRECISION NOT NULL,
    "valorLibros" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroDepreciacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoCambio" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monedaBase" TEXT NOT NULL DEFAULT 'USD',
    "monedaDestino" TEXT NOT NULL,
    "compra" DOUBLE PRECISION NOT NULL,
    "venta" DOUBLE PRECISION NOT NULL,
    "promedio" DOUBLE PRECISION NOT NULL,
    "fuente" TEXT NOT NULL DEFAULT 'Manual',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TipoCambio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaEmitida" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "serie" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'Factura',
    "fecha" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "clienteNombre" TEXT NOT NULL,
    "clienteRut" TEXT,
    "clienteDireccion" TEXT,
    "clienteEmail" TEXT,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "iva" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "estadoCobro" TEXT NOT NULL DEFAULT 'Pendiente',
    "montoCobrado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacturaEmitida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemFacturaEmitida" (
    "id" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "iva" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemFacturaEmitida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoRecibido" (
    "id" TEXT NOT NULL,
    "facturaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "metodoPago" TEXT NOT NULL,
    "referencia" TEXT,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoRecibido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuentaPorPagar" (
    "id" TEXT NOT NULL,
    "comprobanteId" TEXT,
    "proveedor" TEXT NOT NULL,
    "proveedorRut" TEXT,
    "concepto" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "estadoPago" TEXT NOT NULL DEFAULT 'Pendiente',
    "montoPagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuentaPorPagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoRealizado" (
    "id" TEXT NOT NULL,
    "cuentaPorPagarId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "metodoPago" TEXT NOT NULL,
    "referencia" TEXT,
    "cuentaBancariaId" TEXT,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoRealizado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empleado" (
    "id" TEXT NOT NULL,
    "legajo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "cargo" TEXT NOT NULL,
    "area" TEXT,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "fechaEgreso" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "tipoContrato" TEXT NOT NULL,
    "salarioBase" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "aguinaldo" BOOLEAN NOT NULL DEFAULT true,
    "salarioVacacional" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroHorasEmpleado" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horasRegulares" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "horasExtra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "horasNocturnas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actividad" TEXT,
    "loteId" TEXT,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroHorasEmpleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagoSalario" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "salarioBase" DOUBLE PRECISION NOT NULL,
    "horasExtra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonificaciones" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deducciones" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalBruto" DOUBLE PRECISION NOT NULL,
    "totalNeto" DOUBLE PRECISION NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "metodoPago" TEXT NOT NULL DEFAULT 'Transferencia',
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagoSalario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TareaEmpleado" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "prioridad" TEXT NOT NULL DEFAULT 'Media',
    "fechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "fechaCompletada" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "loteId" TEXT,
    "ubicacion" TEXT,
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TareaEmpleado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rol" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "permisos" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioRol" (
    "id" TEXT NOT NULL,
    "usuarioEmail" TEXT NOT NULL,
    "rolId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "fechaInvitacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAceptacion" TIMESTAMP(3),
    "restricciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioRol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contratista" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "empresa" TEXT,
    "rut" TEXT,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "especialidad" TEXT NOT NULL,
    "codigoAcceso" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contratista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrabajoContratista" (
    "id" TEXT NOT NULL,
    "contratistaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "loteId" TEXT,
    "loteNombre" TEXT,
    "hectareas" DOUBLE PRECISION,
    "fechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaInicio" TIMESTAMP(3),
    "fechaCompletada" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'Asignado',
    "archivosUrl" TEXT,
    "monto" DOUBLE PRECISION,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "estadoPago" TEXT NOT NULL DEFAULT 'Pendiente',
    "observaciones" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrabajoContratista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Establecimiento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "ciudad" TEXT,
    "provincia" TEXT,
    "pais" TEXT NOT NULL DEFAULT 'Uruguay',
    "hectareasTotales" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "cuit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Establecimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroCombustible" (
    "id" TEXT NOT NULL,
    "maquinariaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "litros" DOUBLE PRECISION NOT NULL,
    "costoLitro" DOUBLE PRECISION NOT NULL,
    "costoTotal" DOUBLE PRECISION NOT NULL,
    "horasMotor" DOUBLE PRECISION,
    "operador" TEXT,
    "estacion" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroCombustible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsoMaquinaria" (
    "id" TEXT NOT NULL,
    "maquinariaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operador" TEXT NOT NULL,
    "horasInicio" DOUBLE PRECISION NOT NULL,
    "horasFin" DOUBLE PRECISION NOT NULL,
    "horasTrabajadas" DOUBLE PRECISION NOT NULL,
    "tarea" TEXT NOT NULL,
    "loteId" TEXT,
    "loteNombre" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsoMaquinaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mantenimiento" (
    "id" TEXT NOT NULL,
    "maquinariaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horasMotor" DOUBLE PRECISION,
    "costo" DOUBLE PRECISION,
    "observaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "ordenTallerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Mantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maquinaria" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "numeroSerie" TEXT,
    "anioFabricacion" INTEGER,
    "patente" TEXT,
    "horasMotor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'Operativo',
    "capacidad" TEXT,
    "valorAdquisicion" DOUBLE PRECISION,
    "fechaAdquisicion" TIMESTAMP(3),
    "intervaloMantenimiento" DOUBLE PRECISION DEFAULT 250,
    "ultimoMantenimiento" DOUBLE PRECISION DEFAULT 0,
    "establecimientoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maquinaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelemetriaGPS" (
    "id" TEXT NOT NULL,
    "maquinariaId" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,
    "velocidad" DOUBLE PRECISION DEFAULT 0,
    "rumbo" DOUBLE PRECISION DEFAULT 0,
    "altitud" DOUBLE PRECISION,
    "precision" DOUBLE PRECISION,
    "estadoMotor" TEXT DEFAULT 'Apagado',
    "horasMotor" DOUBLE PRECISION,
    "nivelCombustible" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelemetriaGPS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EficienciaMaquinaria" (
    "id" TEXT NOT NULL,
    "maquinariaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horasTrabajando" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "horasRalenti" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "horasApagado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "horasTotales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consumoCombustible" DOUBLE PRECISION DEFAULT 0,
    "consumoPorHora" DOUBLE PRECISION DEFAULT 0,
    "distanciaRecorrida" DOUBLE PRECISION DEFAULT 0,
    "areaTrabajadasHa" DOUBLE PRECISION DEFAULT 0,
    "eficienciaScore" DOUBLE PRECISION DEFAULT 0,
    "consumoScore" DOUBLE PRECISION DEFAULT 0,
    "productividadScore" DOUBLE PRECISION DEFAULT 0,
    "scoreGeneral" DOUBLE PRECISION DEFAULT 0,
    "operador" TEXT,
    "loteId" TEXT,
    "tarea" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EficienciaMaquinaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaMantenimiento" (
    "id" TEXT NOT NULL,
    "maquinariaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "prioridad" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "horasMotorAlerta" DOUBLE PRECISION,
    "fechaAlerta" TIMESTAMP(3),
    "sensorAlerta" BOOLEAN DEFAULT false,
    "estado" TEXT NOT NULL DEFAULT 'Activa',
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaResolucion" TIMESTAMP(3),
    "resueltoPor" TEXT,
    "observaciones" TEXT,
    "ordenTallerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertaMantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorPredictivo" (
    "id" TEXT NOT NULL,
    "maquinariaId" TEXT NOT NULL,
    "codigoSensor" TEXT NOT NULL,
    "tipoSensor" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "valorActual" DOUBLE PRECISION NOT NULL,
    "valorMinimo" DOUBLE PRECISION NOT NULL,
    "valorMaximo" DOUBLE PRECISION NOT NULL,
    "umbralAlerta" DOUBLE PRECISION NOT NULL,
    "umbralCritico" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Normal',
    "ultimaLectura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SensorPredictivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LecturaSensor" (
    "id" TEXT NOT NULL,
    "sensorId" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "sensorIoTId" TEXT,

    CONSTRAINT "LecturaSensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdenTaller" (
    "id" TEXT NOT NULL,
    "numeroOrden" TEXT NOT NULL,
    "maquinariaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "prioridad" TEXT NOT NULL,
    "descripcionFalla" TEXT NOT NULL,
    "diagnostico" TEXT,
    "trabajoRealizado" TEXT,
    "fechaIngreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEstimada" TIMESTAMP(3),
    "fechaInicio" TIMESTAMP(3),
    "fechaSalida" TIMESTAMP(3),
    "mecanicoAsignado" TEXT,
    "ayudantes" TEXT[],
    "estado" TEXT NOT NULL DEFAULT 'Ingresada',
    "horasMotorIngreso" DOUBLE PRECISION,
    "costoRepuestos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoManoObra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otrosCostos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "alertaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdenTaller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepuestoUsado" (
    "id" TEXT NOT NULL,
    "ordenTallerId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "marca" TEXT,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "precioTotal" DOUBLE PRECISION NOT NULL,
    "proveedor" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepuestoUsado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManoObraTaller" (
    "id" TEXT NOT NULL,
    "ordenTallerId" TEXT NOT NULL,
    "mecanico" TEXT NOT NULL,
    "especialidad" TEXT,
    "descripcion" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "horas" DOUBLE PRECISION NOT NULL,
    "tarifaHora" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManoObraTaller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionOperador" (
    "id" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "maquinariaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duracionJornada" DOUBLE PRECISION NOT NULL,
    "velocidadPromedio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "velocidadMaxima" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "frenadosBruscos" INTEGER NOT NULL DEFAULT 0,
    "aceleracionesBruscas" INTEGER NOT NULL DEFAULT 0,
    "girosBruscos" INTEGER NOT NULL DEFAULT 0,
    "excesosVelocidad" INTEGER NOT NULL DEFAULT 0,
    "tiempoTrabajando" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tiempoRalenti" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consumoCombustible" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consumoPorHora" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usoAdecuado" BOOLEAN NOT NULL DEFAULT true,
    "mantenimientoDiario" BOOLEAN NOT NULL DEFAULT true,
    "reporteProblemas" BOOLEAN NOT NULL DEFAULT true,
    "scoreSeguridad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scoreEficiencia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scoreCuidado" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scoreGeneral" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calificacion" TEXT NOT NULL DEFAULT 'Buena',
    "observaciones" TEXT,
    "incidentes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvaluacionOperador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operador" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "licenciaConducir" TEXT,
    "categoriaLicencia" TEXT,
    "vencimientoLicencia" TIMESTAMP(3),
    "especialidades" TEXT[],
    "telefono" TEXT,
    "email" TEXT,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "totalEvaluaciones" INTEGER NOT NULL DEFAULT 0,
    "scorePromedio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistDiario" (
    "id" TEXT NOT NULL,
    "maquinariaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operador" TEXT NOT NULL,
    "turno" TEXT NOT NULL,
    "nivelAceite" BOOLEAN NOT NULL DEFAULT false,
    "nivelCombustible" BOOLEAN NOT NULL DEFAULT false,
    "nivelRefrigerante" BOOLEAN NOT NULL DEFAULT false,
    "presionNeumaticos" BOOLEAN NOT NULL DEFAULT false,
    "lucesOperativas" BOOLEAN NOT NULL DEFAULT false,
    "frenosOperativos" BOOLEAN NOT NULL DEFAULT false,
    "instrumentosOK" BOOLEAN NOT NULL DEFAULT false,
    "limpiezaGeneral" BOOLEAN NOT NULL DEFAULT false,
    "horasMotorInicio" DOUBLE PRECISION,
    "horasMotorFin" DOUBLE PRECISION,
    "kmInicio" DOUBLE PRECISION,
    "kmFin" DOUBLE PRECISION,
    "problemasDetectados" TEXT,
    "accionesTomadas" TEXT,
    "completado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistDiario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuellaCarbono" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "emisionesCombustible" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emisionesFertilizantes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emisionesAgroquimicos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emisionesGanaderia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emisionesElectricidad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emisionesTransporte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emisionesTotales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emisionesPorHectarea" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emisionesPorTonelada" DOUBLE PRECISION,
    "objetivoReduccion" DOUBLE PRECISION,
    "reduccionLograda" DOUBLE PRECISION,
    "tendencia" TEXT,
    "metodologiaCalculo" TEXT NOT NULL DEFAULT 'GHG Protocol',
    "factoresEmision" JSONB,
    "alcance1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alcance2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alcance3" DOUBLE PRECISION,
    "capturaCarbono" DOUBLE PRECISION,
    "creditosCarbono" INTEGER,
    "calculadoPor" TEXT,
    "verificadoPor" TEXT,
    "certificado" BOOLEAN NOT NULL DEFAULT false,
    "documentoCertificado" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HuellaCarbono_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecetaAgronomica" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "numeroReceta" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "ingenieroAgronomo" TEXT NOT NULL,
    "matriculaProfesional" TEXT NOT NULL,
    "telefonoProfesional" TEXT,
    "emailProfesional" TEXT,
    "firmaProfesional" TEXT,
    "loteId" TEXT,
    "cultivo" TEXT NOT NULL,
    "variedad" TEXT,
    "hectareas" DOUBLE PRECISION NOT NULL,
    "diagnostico" TEXT NOT NULL,
    "plagaEnfermedad" TEXT,
    "nivelInfestacion" TEXT,
    "estadoFenologico" TEXT,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaAplicacion" TIMESTAMP(3),
    "temperaturaMaxima" DOUBLE PRECISION,
    "humedadMinima" DOUBLE PRECISION,
    "vientoMaximo" DOUBLE PRECISION,
    "restricciones" TEXT[],
    "epp" TEXT[],
    "periodoReingreso" INTEGER,
    "periodoCarencia" INTEGER,
    "lmr" TEXT,
    "laborId" TEXT,
    "aplicadoPor" TEXT,
    "documentoPdfUrl" TEXT,
    "documentoFirmadoUrl" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecetaAgronomica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecetaProducto" (
    "id" TEXT NOT NULL,
    "recetaId" TEXT NOT NULL,
    "nombreComercial" TEXT NOT NULL,
    "ingredienteActivo" TEXT NOT NULL,
    "concentracion" TEXT NOT NULL,
    "registroSenasa" TEXT,
    "dosis" DOUBLE PRECISION NOT NULL,
    "unidadDosis" TEXT NOT NULL,
    "dosisTotal" DOUBLE PRECISION NOT NULL,
    "volumenCaldo" DOUBLE PRECISION,
    "bandaToxicologica" TEXT NOT NULL,
    "clasificacionOMS" TEXT,
    "categoriaAmbiental" TEXT,
    "tipoProducto" TEXT NOT NULL,
    "modoAccion" TEXT,
    "fabricante" TEXT,
    "distribuidor" TEXT,
    "lote" TEXT,
    "fechaVencimiento" TIMESTAMP(3),
    "restriccionesEspecificas" TEXT[],
    "intervaloAplicacion" INTEGER,
    "numeroMaximoAplicaciones" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecetaProducto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReporteAgroquimico" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "tipoReporte" TEXT NOT NULL,
    "numeroReporte" TEXT,
    "organismoDestino" TEXT,
    "totalProductos" INTEGER NOT NULL DEFAULT 0,
    "totalLitros" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalKilos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHectareas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAplicaciones" INTEGER NOT NULL DEFAULT 0,
    "productosDetalle" JSONB NOT NULL,
    "herbicidas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "insecticidas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fungicidas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fertilizantes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coadyuvantes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otros" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bandaIa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bandaIb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bandaII" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bandaIII" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bandaIV" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bandaU" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categoriaI" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categoriaII" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categoriaIII" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categoriaIV" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'Borrador',
    "fechaEnvio" TIMESTAMP(3),
    "fechaAprobacion" TIMESTAMP(3),
    "documentoPdfUrl" TEXT,
    "comprobanteEnvio" TEXT,
    "constanciaAprobacion" TEXT,
    "funcionarioReceptor" TEXT,
    "funcionarioAprobador" TEXT,
    "envasesTratados" INTEGER,
    "envasesPendientes" INTEGER,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReporteAgroquimico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificacionSostenibilidad" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "tipoCertificacion" TEXT NOT NULL,
    "esquema" TEXT,
    "alcance" TEXT[],
    "numeroCertificado" TEXT,
    "gln" TEXT,
    "estado" TEXT NOT NULL,
    "fechaSolicitud" TIMESTAMP(3),
    "fechaAuditoriaInicial" TIMESTAMP(3),
    "fechaAuditoriaFinal" TIMESTAMP(3),
    "fechaEmision" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "organismoCertificador" TEXT NOT NULL,
    "numeroAcreditacion" TEXT,
    "auditores" TEXT[],
    "noConformidadesMayores" INTEGER NOT NULL DEFAULT 0,
    "noConformidadesMenures" INTEGER NOT NULL DEFAULT 0,
    "observacionesAuditoria" TEXT,
    "accionesCorrectivas" TEXT,
    "fechaLimiteCorrecciones" TIMESTAMP(3),
    "costoAuditoria" DOUBLE PRECISION,
    "costoAnual" DOUBLE PRECISION,
    "mercadosAcceso" TEXT[],
    "premioComercial" DOUBLE PRECISION,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificacionSostenibilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistCertificacion" (
    "id" TEXT NOT NULL,
    "certificacionId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT,
    "descripcion" TEXT NOT NULL,
    "nivelRequerido" TEXT NOT NULL,
    "cumple" BOOLEAN NOT NULL DEFAULT false,
    "porcentajeCumplimiento" DOUBLE PRECISION,
    "evidencia" TEXT,
    "documentoUrl" TEXT,
    "fotoUrl" TEXT,
    "criticidad" TEXT NOT NULL,
    "esNoConformidad" BOOLEAN NOT NULL DEFAULT false,
    "tipoNoConformidad" TEXT,
    "accionCorrectiva" TEXT,
    "responsableAccion" TEXT,
    "fechaLimiteAccion" TIMESTAMP(3),
    "estadoAccion" TEXT,
    "fechaVerificacion" TIMESTAMP(3),
    "verificadoPor" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistCertificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoCertificacion" (
    "id" TEXT NOT NULL,
    "certificacionId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT,
    "archivoUrl" TEXT NOT NULL,
    "tipoArchivo" TEXT NOT NULL,
    "tamanioBytes" INTEGER NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "requisitoRelacionado" TEXT,
    "puntoControl" TEXT[],
    "fechaDocumento" TIMESTAMP(3),
    "fechaEmision" TIMESTAMP(3),
    "validoHasta" TIMESTAMP(3),
    "version" TEXT NOT NULL DEFAULT '1.0',
    "esVersionActual" BOOLEAN NOT NULL DEFAULT true,
    "versionAnteriorId" TEXT,
    "aprobadoPor" TEXT,
    "cargoAprobador" TEXT,
    "fechaAprobacion" TIMESTAMP(3),
    "etiquetas" TEXT[],
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoCertificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceEUDR" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "numeroDeclaracion" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "producto" TEXT NOT NULL,
    "codigoHS" TEXT,
    "volumenToneladas" DOUBLE PRECISION NOT NULL,
    "destinoExportacion" TEXT NOT NULL,
    "importadorUE" TEXT,
    "loteIds" TEXT[],
    "geometriaGeoJSON" JSONB NOT NULL,
    "coordenadasCentrales" TEXT NOT NULL,
    "areaHectareas" DOUBLE PRECISION NOT NULL,
    "fechaCorte" TIMESTAMP(3) NOT NULL DEFAULT '2020-12-31 00:00:00 +00:00',
    "sinDeforestacion" BOOLEAN NOT NULL DEFAULT false,
    "metodologiaAnalisis" TEXT,
    "imagenSatelital2019" TEXT,
    "imagenSatelital2020" TEXT,
    "imagenSatelitalActual" TEXT,
    "fuenteImagenes" TEXT,
    "coberturaBoscosa2019" DOUBLE PRECISION,
    "coberturaBoscosa2020" DOUBLE PRECISION,
    "coberturaBoscosaActual" DOUBLE PRECISION,
    "cambioDetectado" BOOLEAN NOT NULL DEFAULT false,
    "detallesCambio" TEXT,
    "proveedorInsumos" TEXT,
    "certificadoOrigen" TEXT,
    "trazabilidadCompleta" BOOLEAN NOT NULL DEFAULT false,
    "cumpleLegislacionLocal" BOOLEAN NOT NULL DEFAULT true,
    "permisoAmbiental" TEXT,
    "registroPropiedad" TEXT,
    "certificadoLegalidad" TEXT,
    "nivelRiesgo" TEXT,
    "factoresRiesgo" TEXT[],
    "medidasMitigacion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'En Preparación',
    "fechaDeclaracion" TIMESTAMP(3),
    "fechaVerificacion" TIMESTAMP(3),
    "verificadoPor" TEXT,
    "declaracionDueDiligence" TEXT,
    "informeRiesgo" TEXT,
    "planMitigacion" TEXT,
    "operadorNombre" TEXT,
    "operadorEORI" TEXT,
    "operadorContacto" TEXT,
    "observaciones" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceEUDR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "modelo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "transacciones_userId_idx" ON "transacciones"("userId");

-- CreateIndex
CREATE INDEX "transacciones_fecha_idx" ON "transacciones"("fecha");

-- CreateIndex
CREATE INDEX "transacciones_tipo_idx" ON "transacciones"("tipo");

-- CreateIndex
CREATE INDEX "Lote_userId_idx" ON "Lote"("userId");

-- CreateIndex
CREATE INDEX "Siembra_userId_idx" ON "Siembra"("userId");

-- CreateIndex
CREATE INDEX "Siembra_loteId_idx" ON "Siembra"("loteId");

-- CreateIndex
CREATE INDEX "Cosecha_userId_idx" ON "Cosecha"("userId");

-- CreateIndex
CREATE INDEX "Cosecha_siembraId_idx" ON "Cosecha"("siembraId");

-- CreateIndex
CREATE INDEX "Cosecha_loteId_idx" ON "Cosecha"("loteId");

-- CreateIndex
CREATE INDEX "Animal_userId_idx" ON "Animal"("userId");

-- CreateIndex
CREATE INDEX "Animal_caravana_idx" ON "Animal"("caravana");

-- CreateIndex
CREATE INDEX "EventoSanitario_userId_idx" ON "EventoSanitario"("userId");

-- CreateIndex
CREATE INDEX "EventoSanitario_animalId_idx" ON "EventoSanitario"("animalId");

-- CreateIndex
CREATE INDEX "Movimiento_userId_idx" ON "Movimiento"("userId");

-- CreateIndex
CREATE INDEX "Movimiento_animalId_idx" ON "Movimiento"("animalId");

-- CreateIndex
CREATE INDEX "Contrato_userId_idx" ON "Contrato"("userId");

-- CreateIndex
CREATE INDEX "Contrato_fechaContrato_idx" ON "Contrato"("fechaContrato");

-- CreateIndex
CREATE INDEX "Entrega_userId_idx" ON "Entrega"("userId");

-- CreateIndex
CREATE INDEX "Entrega_contratoId_idx" ON "Entrega"("contratoId");

-- CreateIndex
CREATE INDEX "PrecioReferencia_userId_idx" ON "PrecioReferencia"("userId");

-- CreateIndex
CREATE INDEX "PrecioReferencia_producto_idx" ON "PrecioReferencia"("producto");

-- CreateIndex
CREATE INDEX "PrecioReferencia_fecha_idx" ON "PrecioReferencia"("fecha");

-- CreateIndex
CREATE INDEX "EmisionCarbono_userId_idx" ON "EmisionCarbono"("userId");

-- CreateIndex
CREATE INDEX "EmisionCarbono_fecha_idx" ON "EmisionCarbono"("fecha");

-- CreateIndex
CREATE INDEX "EmisionCarbono_fuente_idx" ON "EmisionCarbono"("fuente");

-- CreateIndex
CREATE INDEX "PracticaSostenible_userId_idx" ON "PracticaSostenible"("userId");

-- CreateIndex
CREATE INDEX "PracticaSostenible_tipo_idx" ON "PracticaSostenible"("tipo");

-- CreateIndex
CREATE INDEX "Certificacion_userId_idx" ON "Certificacion"("userId");

-- CreateIndex
CREATE INDEX "Certificacion_estado_idx" ON "Certificacion"("estado");

-- CreateIndex
CREATE INDEX "Labor_userId_idx" ON "Labor"("userId");

-- CreateIndex
CREATE INDEX "Labor_loteId_idx" ON "Labor"("loteId");

-- CreateIndex
CREATE INDEX "Labor_fecha_idx" ON "Labor"("fecha");

-- CreateIndex
CREATE INDEX "AplicacionProducto_userId_idx" ON "AplicacionProducto"("userId");

-- CreateIndex
CREATE INDEX "AplicacionProducto_laborId_idx" ON "AplicacionProducto"("laborId");

-- CreateIndex
CREATE INDEX "EventoReproductivo_userId_idx" ON "EventoReproductivo"("userId");

-- CreateIndex
CREATE INDEX "EventoReproductivo_animalId_idx" ON "EventoReproductivo"("animalId");

-- CreateIndex
CREATE INDEX "EventoReproductivo_fecha_idx" ON "EventoReproductivo"("fecha");

-- CreateIndex
CREATE INDEX "EventoReproductivo_tipo_idx" ON "EventoReproductivo"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "HistorialReproductivo_animalId_key" ON "HistorialReproductivo"("animalId");

-- CreateIndex
CREATE INDEX "HistorialReproductivo_userId_idx" ON "HistorialReproductivo"("userId");

-- CreateIndex
CREATE INDEX "HistorialReproductivo_animalId_idx" ON "HistorialReproductivo"("animalId");

-- CreateIndex
CREATE INDEX "Producto_userId_idx" ON "Producto"("userId");

-- CreateIndex
CREATE INDEX "Producto_categoria_idx" ON "Producto"("categoria");

-- CreateIndex
CREATE INDEX "UbicacionProducto_userId_idx" ON "UbicacionProducto"("userId");

-- CreateIndex
CREATE INDEX "UbicacionProducto_productoId_idx" ON "UbicacionProducto"("productoId");

-- CreateIndex
CREATE INDEX "UbicacionProducto_loteId_idx" ON "UbicacionProducto"("loteId");

-- CreateIndex
CREATE INDEX "TransferenciaProducto_userId_idx" ON "TransferenciaProducto"("userId");

-- CreateIndex
CREATE INDEX "TransferenciaProducto_productoId_idx" ON "TransferenciaProducto"("productoId");

-- CreateIndex
CREATE INDEX "TransferenciaProducto_fecha_idx" ON "TransferenciaProducto"("fecha");

-- CreateIndex
CREATE INDEX "AlertaClimatica_userId_idx" ON "AlertaClimatica"("userId");

-- CreateIndex
CREATE INDEX "AlertaClimatica_fechaInicio_idx" ON "AlertaClimatica"("fechaInicio");

-- CreateIndex
CREATE INDEX "AlertaClimatica_tipo_idx" ON "AlertaClimatica"("tipo");

-- CreateIndex
CREATE INDEX "AlertaClimatica_leida_idx" ON "AlertaClimatica"("leida");

-- CreateIndex
CREATE INDEX "Ubicacion_userId_idx" ON "Ubicacion"("userId");

-- CreateIndex
CREATE INDEX "Ubicacion_esPrincipal_idx" ON "Ubicacion"("esPrincipal");

-- CreateIndex
CREATE INDEX "Alimento_userId_idx" ON "Alimento"("userId");

-- CreateIndex
CREATE INDEX "Alimento_tipo_idx" ON "Alimento"("tipo");

-- CreateIndex
CREATE INDEX "Racion_userId_idx" ON "Racion"("userId");

-- CreateIndex
CREATE INDEX "Racion_animalObjetivo_idx" ON "Racion"("animalObjetivo");

-- CreateIndex
CREATE INDEX "ComponenteRacion_userId_idx" ON "ComponenteRacion"("userId");

-- CreateIndex
CREATE INDEX "ComponenteRacion_racionId_idx" ON "ComponenteRacion"("racionId");

-- CreateIndex
CREATE INDEX "ComponenteRacion_alimentoId_idx" ON "ComponenteRacion"("alimentoId");

-- CreateIndex
CREATE INDEX "CuentaBancaria_userId_idx" ON "CuentaBancaria"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtractoBancario_transaccionId_key" ON "ExtractoBancario"("transaccionId");

-- CreateIndex
CREATE INDEX "ExtractoBancario_userId_idx" ON "ExtractoBancario"("userId");

-- CreateIndex
CREATE INDEX "ExtractoBancario_cuentaId_idx" ON "ExtractoBancario"("cuentaId");

-- CreateIndex
CREATE INDEX "ExtractoBancario_fecha_idx" ON "ExtractoBancario"("fecha");

-- CreateIndex
CREATE INDEX "ExtractoBancario_conciliado_idx" ON "ExtractoBancario"("conciliado");

-- CreateIndex
CREATE INDEX "Conciliacion_userId_idx" ON "Conciliacion"("userId");

-- CreateIndex
CREATE INDEX "Conciliacion_cuentaId_idx" ON "Conciliacion"("cuentaId");

-- CreateIndex
CREATE INDEX "Conciliacion_fechaInicio_idx" ON "Conciliacion"("fechaInicio");

-- CreateIndex
CREATE INDEX "DiferenciaConciliacion_userId_idx" ON "DiferenciaConciliacion"("userId");

-- CreateIndex
CREATE INDEX "DiferenciaConciliacion_conciliacionId_idx" ON "DiferenciaConciliacion"("conciliacionId");

-- CreateIndex
CREATE INDEX "RegistroLechero_userId_idx" ON "RegistroLechero"("userId");

-- CreateIndex
CREATE INDEX "RegistroLechero_animalId_idx" ON "RegistroLechero"("animalId");

-- CreateIndex
CREATE INDEX "RegistroLechero_fecha_idx" ON "RegistroLechero"("fecha");

-- CreateIndex
CREATE INDEX "CostoLote_userId_idx" ON "CostoLote"("userId");

-- CreateIndex
CREATE INDEX "CostoLote_loteId_idx" ON "CostoLote"("loteId");

-- CreateIndex
CREATE INDEX "CostoLote_fecha_idx" ON "CostoLote"("fecha");

-- CreateIndex
CREATE INDEX "CostoAnimal_userId_idx" ON "CostoAnimal"("userId");

-- CreateIndex
CREATE INDEX "CostoAnimal_animalId_idx" ON "CostoAnimal"("animalId");

-- CreateIndex
CREATE INDEX "CostoAnimal_fecha_idx" ON "CostoAnimal"("fecha");

-- CreateIndex
CREATE INDEX "MargenBruto_userId_idx" ON "MargenBruto"("userId");

-- CreateIndex
CREATE INDEX "MargenBruto_tipo_idx" ON "MargenBruto"("tipo");

-- CreateIndex
CREATE INDEX "MargenBruto_referenciaId_idx" ON "MargenBruto"("referenciaId");

-- CreateIndex
CREATE INDEX "MargenBruto_periodo_idx" ON "MargenBruto"("periodo");

-- CreateIndex
CREATE UNIQUE INDEX "MargenBruto_userId_tipo_referenciaId_periodo_key" ON "MargenBruto"("userId", "tipo", "referenciaId", "periodo");

-- CreateIndex
CREATE INDEX "Arrendamiento_userId_idx" ON "Arrendamiento"("userId");

-- CreateIndex
CREATE INDEX "Arrendamiento_loteId_idx" ON "Arrendamiento"("loteId");

-- CreateIndex
CREATE INDEX "Arrendamiento_activo_idx" ON "Arrendamiento"("activo");

-- CreateIndex
CREATE INDEX "AlertaPredictiva_userId_idx" ON "AlertaPredictiva"("userId");

-- CreateIndex
CREATE INDEX "AlertaPredictiva_tipo_idx" ON "AlertaPredictiva"("tipo");

-- CreateIndex
CREATE INDEX "AlertaPredictiva_severidad_idx" ON "AlertaPredictiva"("severidad");

-- CreateIndex
CREATE INDEX "AlertaPredictiva_estado_idx" ON "AlertaPredictiva"("estado");

-- CreateIndex
CREATE INDEX "AlertaPredictiva_fechaDeteccion_idx" ON "AlertaPredictiva"("fechaDeteccion");

-- CreateIndex
CREATE INDEX "PlanSiembra_userId_idx" ON "PlanSiembra"("userId");

-- CreateIndex
CREATE INDEX "PlanSiembra_loteId_idx" ON "PlanSiembra"("loteId");

-- CreateIndex
CREATE INDEX "PlanSiembra_estado_idx" ON "PlanSiembra"("estado");

-- CreateIndex
CREATE INDEX "PlanSiembra_fechaSiembraRecomendada_idx" ON "PlanSiembra"("fechaSiembraRecomendada");

-- CreateIndex
CREATE INDEX "AnalisisSuelo_userId_idx" ON "AnalisisSuelo"("userId");

-- CreateIndex
CREATE INDEX "AnalisisSuelo_loteId_idx" ON "AnalisisSuelo"("loteId");

-- CreateIndex
CREATE INDEX "AnalisisSuelo_fechaAnalisis_idx" ON "AnalisisSuelo"("fechaAnalisis");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroTrazabilidad_codigoQR_key" ON "RegistroTrazabilidad"("codigoQR");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroTrazabilidad_hashBlockchain_key" ON "RegistroTrazabilidad"("hashBlockchain");

-- CreateIndex
CREATE INDEX "RegistroTrazabilidad_userId_idx" ON "RegistroTrazabilidad"("userId");

-- CreateIndex
CREATE INDEX "RegistroTrazabilidad_codigoQR_idx" ON "RegistroTrazabilidad"("codigoQR");

-- CreateIndex
CREATE INDEX "RegistroTrazabilidad_tipoProducto_idx" ON "RegistroTrazabilidad"("tipoProducto");

-- CreateIndex
CREATE INDEX "RegistroTrazabilidad_timestamp_idx" ON "RegistroTrazabilidad"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "EtapaTrazabilidad_hashValidacion_key" ON "EtapaTrazabilidad"("hashValidacion");

-- CreateIndex
CREATE INDEX "EtapaTrazabilidad_registroId_idx" ON "EtapaTrazabilidad"("registroId");

-- CreateIndex
CREATE INDEX "EtapaTrazabilidad_userId_idx" ON "EtapaTrazabilidad"("userId");

-- CreateIndex
CREATE INDEX "EtapaTrazabilidad_fecha_idx" ON "EtapaTrazabilidad"("fecha");

-- CreateIndex
CREATE INDEX "MarcadorGeorreferenciado_loteId_idx" ON "MarcadorGeorreferenciado"("loteId");

-- CreateIndex
CREATE INDEX "MarcadorGeorreferenciado_userId_idx" ON "MarcadorGeorreferenciado"("userId");

-- CreateIndex
CREATE INDEX "MarcadorGeorreferenciado_fecha_idx" ON "MarcadorGeorreferenciado"("fecha");

-- CreateIndex
CREATE INDEX "ImagenSatelital_loteId_idx" ON "ImagenSatelital"("loteId");

-- CreateIndex
CREATE INDEX "ImagenSatelital_userId_idx" ON "ImagenSatelital"("userId");

-- CreateIndex
CREATE INDEX "ImagenSatelital_fecha_idx" ON "ImagenSatelital"("fecha");

-- CreateIndex
CREATE INDEX "ImagenSatelital_tipoIndice_idx" ON "ImagenSatelital"("tipoIndice");

-- CreateIndex
CREATE INDEX "RegistroPluviometrico_userId_idx" ON "RegistroPluviometrico"("userId");

-- CreateIndex
CREATE INDEX "RegistroPluviometrico_fecha_idx" ON "RegistroPluviometrico"("fecha");

-- CreateIndex
CREATE INDEX "RegistroPluviometrico_loteId_idx" ON "RegistroPluviometrico"("loteId");

-- CreateIndex
CREATE INDEX "CalculoDosis_userId_idx" ON "CalculoDosis"("userId");

-- CreateIndex
CREATE INDEX "CalculoDosis_loteId_idx" ON "CalculoDosis"("loteId");

-- CreateIndex
CREATE INDEX "CalculoDosis_tipoProducto_idx" ON "CalculoDosis"("tipoProducto");

-- CreateIndex
CREATE INDEX "AlertaPlaga_userId_idx" ON "AlertaPlaga"("userId");

-- CreateIndex
CREATE INDEX "AlertaPlaga_loteId_idx" ON "AlertaPlaga"("loteId");

-- CreateIndex
CREATE INDEX "AlertaPlaga_fechaDeteccion_idx" ON "AlertaPlaga"("fechaDeteccion");

-- CreateIndex
CREATE INDEX "AlertaPlaga_estado_idx" ON "AlertaPlaga"("estado");

-- CreateIndex
CREATE INDEX "AlertaPlaga_severidad_idx" ON "AlertaPlaga"("severidad");

-- CreateIndex
CREATE INDEX "PlanRiego_userId_idx" ON "PlanRiego"("userId");

-- CreateIndex
CREATE INDEX "PlanRiego_loteId_idx" ON "PlanRiego"("loteId");

-- CreateIndex
CREATE INDEX "PlanRiego_estado_idx" ON "PlanRiego"("estado");

-- CreateIndex
CREATE INDEX "PlanRiego_fechaInicio_idx" ON "PlanRiego"("fechaInicio");

-- CreateIndex
CREATE INDEX "EventoRiego_userId_idx" ON "EventoRiego"("userId");

-- CreateIndex
CREATE INDEX "EventoRiego_planRiegoId_idx" ON "EventoRiego"("planRiegoId");

-- CreateIndex
CREATE INDEX "EventoRiego_fechaProgramada_idx" ON "EventoRiego"("fechaProgramada");

-- CreateIndex
CREATE INDEX "EventoRiego_estado_idx" ON "EventoRiego"("estado");

-- CreateIndex
CREATE INDEX "DiagnosticoSalud_userId_idx" ON "DiagnosticoSalud"("userId");

-- CreateIndex
CREATE INDEX "DiagnosticoSalud_animalId_idx" ON "DiagnosticoSalud"("animalId");

-- CreateIndex
CREATE INDEX "DiagnosticoSalud_fecha_idx" ON "DiagnosticoSalud"("fecha");

-- CreateIndex
CREATE INDEX "PlanNutricional_userId_idx" ON "PlanNutricional"("userId");

-- CreateIndex
CREATE INDEX "PlanNutricional_animalId_idx" ON "PlanNutricional"("animalId");

-- CreateIndex
CREATE INDEX "PlanNutricional_estado_idx" ON "PlanNutricional"("estado");

-- CreateIndex
CREATE INDEX "RegistroConsumo_userId_idx" ON "RegistroConsumo"("userId");

-- CreateIndex
CREATE INDEX "RegistroConsumo_planNutricionalId_idx" ON "RegistroConsumo"("planNutricionalId");

-- CreateIndex
CREATE INDEX "RegistroConsumo_fecha_idx" ON "RegistroConsumo"("fecha");

-- CreateIndex
CREATE INDEX "AjusteNutricional_userId_idx" ON "AjusteNutricional"("userId");

-- CreateIndex
CREATE INDEX "AjusteNutricional_planNutricionalId_idx" ON "AjusteNutricional"("planNutricionalId");

-- CreateIndex
CREATE INDEX "AjusteNutricional_fecha_idx" ON "AjusteNutricional"("fecha");

-- CreateIndex
CREATE INDEX "AnalisisReproductivo_userId_idx" ON "AnalisisReproductivo"("userId");

-- CreateIndex
CREATE INDEX "AnalisisReproductivo_fechaInicio_idx" ON "AnalisisReproductivo"("fechaInicio");

-- CreateIndex
CREATE INDEX "AlertaSanitaria_userId_idx" ON "AlertaSanitaria"("userId");

-- CreateIndex
CREATE INDEX "AlertaSanitaria_estado_idx" ON "AlertaSanitaria"("estado");

-- CreateIndex
CREATE INDEX "AlertaSanitaria_severidad_idx" ON "AlertaSanitaria"("severidad");

-- CreateIndex
CREATE INDEX "AlertaSanitaria_tipo_idx" ON "AlertaSanitaria"("tipo");

-- CreateIndex
CREATE INDEX "RotacionCultivo_userId_idx" ON "RotacionCultivo"("userId");

-- CreateIndex
CREATE INDEX "RotacionCultivo_loteId_idx" ON "RotacionCultivo"("loteId");

-- CreateIndex
CREATE INDEX "RotacionCultivo_fechaSiembra_idx" ON "RotacionCultivo"("fechaSiembra");

-- CreateIndex
CREATE INDEX "ZonaManejo_userId_idx" ON "ZonaManejo"("userId");

-- CreateIndex
CREATE INDEX "ZonaManejo_loteId_idx" ON "ZonaManejo"("loteId");

-- CreateIndex
CREATE INDEX "MapaPrescripcion_userId_idx" ON "MapaPrescripcion"("userId");

-- CreateIndex
CREATE INDEX "MapaPrescripcion_loteId_idx" ON "MapaPrescripcion"("loteId");

-- CreateIndex
CREATE INDEX "MapaPrescripcion_tipo_idx" ON "MapaPrescripcion"("tipo");

-- CreateIndex
CREATE INDEX "MapaPrescripcion_estado_idx" ON "MapaPrescripcion"("estado");

-- CreateIndex
CREATE INDEX "PronosticoClimatico_userId_idx" ON "PronosticoClimatico"("userId");

-- CreateIndex
CREATE INDEX "PronosticoClimatico_fecha_idx" ON "PronosticoClimatico"("fecha");

-- CreateIndex
CREATE INDEX "PronosticoClimatico_ubicacion_idx" ON "PronosticoClimatico"("ubicacion");

-- CreateIndex
CREATE INDEX "SensorIoT_userId_idx" ON "SensorIoT"("userId");

-- CreateIndex
CREATE INDEX "SensorIoT_loteId_idx" ON "SensorIoT"("loteId");

-- CreateIndex
CREATE INDEX "SensorIoT_tipo_idx" ON "SensorIoT"("tipo");

-- CreateIndex
CREATE INDEX "MapaRendimiento_userId_idx" ON "MapaRendimiento"("userId");

-- CreateIndex
CREATE INDEX "MapaRendimiento_loteId_idx" ON "MapaRendimiento"("loteId");

-- CreateIndex
CREATE INDEX "MapaRendimiento_cosechaId_idx" ON "MapaRendimiento"("cosechaId");

-- CreateIndex
CREATE INDEX "MapaRendimiento_fechaCosecha_idx" ON "MapaRendimiento"("fechaCosecha");

-- CreateIndex
CREATE INDEX "AnalisisCostoRiego_userId_idx" ON "AnalisisCostoRiego"("userId");

-- CreateIndex
CREATE INDEX "AnalisisCostoRiego_planRiegoId_idx" ON "AnalisisCostoRiego"("planRiegoId");

-- CreateIndex
CREATE INDEX "AnalisisCostoRiego_fechaInicio_idx" ON "AnalisisCostoRiego"("fechaInicio");

-- CreateIndex
CREATE INDEX "RegistroPeso_userId_idx" ON "RegistroPeso"("userId");

-- CreateIndex
CREATE INDEX "RegistroPeso_animalId_idx" ON "RegistroPeso"("animalId");

-- CreateIndex
CREATE INDEX "RegistroPeso_fecha_idx" ON "RegistroPeso"("fecha");

-- CreateIndex
CREATE INDEX "MovimientoAnimal_userId_idx" ON "MovimientoAnimal"("userId");

-- CreateIndex
CREATE INDEX "MovimientoAnimal_animalId_idx" ON "MovimientoAnimal"("animalId");

-- CreateIndex
CREATE INDEX "MovimientoAnimal_fecha_idx" ON "MovimientoAnimal"("fecha");

-- CreateIndex
CREATE INDEX "MovimientoAnimal_tipoMovimiento_idx" ON "MovimientoAnimal"("tipoMovimiento");

-- CreateIndex
CREATE INDEX "ProduccionLechera_userId_idx" ON "ProduccionLechera"("userId");

-- CreateIndex
CREATE INDEX "ProduccionLechera_animalId_idx" ON "ProduccionLechera"("animalId");

-- CreateIndex
CREATE INDEX "ProduccionLechera_fecha_idx" ON "ProduccionLechera"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroGenetico_animalId_key" ON "RegistroGenetico"("animalId");

-- CreateIndex
CREATE INDEX "RegistroGenetico_userId_idx" ON "RegistroGenetico"("userId");

-- CreateIndex
CREATE INDEX "RegistroGenetico_padreId_idx" ON "RegistroGenetico"("padreId");

-- CreateIndex
CREATE INDEX "RegistroGenetico_madreId_idx" ON "RegistroGenetico"("madreId");

-- CreateIndex
CREATE INDEX "AnalisisROIGenetico_userId_idx" ON "AnalisisROIGenetico"("userId");

-- CreateIndex
CREATE INDEX "AnalisisROIGenetico_reproductorId_idx" ON "AnalisisROIGenetico"("reproductorId");

-- CreateIndex
CREATE INDEX "AnalisisROIGenetico_fechaInicio_idx" ON "AnalisisROIGenetico"("fechaInicio");

-- CreateIndex
CREATE INDEX "ControlCargaAnimal_userId_idx" ON "ControlCargaAnimal"("userId");

-- CreateIndex
CREATE INDEX "ControlCargaAnimal_loteId_idx" ON "ControlCargaAnimal"("loteId");

-- CreateIndex
CREATE INDEX "ControlCargaAnimal_fecha_idx" ON "ControlCargaAnimal"("fecha");

-- CreateIndex
CREATE INDEX "EventoVida_userId_idx" ON "EventoVida"("userId");

-- CreateIndex
CREATE INDEX "EventoVida_animalId_idx" ON "EventoVida"("animalId");

-- CreateIndex
CREATE INDEX "EventoVida_fecha_idx" ON "EventoVida"("fecha");

-- CreateIndex
CREATE INDEX "EventoVida_tipoEvento_idx" ON "EventoVida"("tipoEvento");

-- CreateIndex
CREATE UNIQUE INDEX "StockInsumo_codigo_key" ON "StockInsumo"("codigo");

-- CreateIndex
CREATE INDEX "StockInsumo_userId_idx" ON "StockInsumo"("userId");

-- CreateIndex
CREATE INDEX "StockInsumo_categoria_idx" ON "StockInsumo"("categoria");

-- CreateIndex
CREATE INDEX "StockInsumo_alertaStockBajo_idx" ON "StockInsumo"("alertaStockBajo");

-- CreateIndex
CREATE INDEX "LoteInsumo_userId_idx" ON "LoteInsumo"("userId");

-- CreateIndex
CREATE INDEX "LoteInsumo_stockInsumoId_idx" ON "LoteInsumo"("stockInsumoId");

-- CreateIndex
CREATE INDEX "LoteInsumo_fechaVencimiento_idx" ON "LoteInsumo"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "LoteInsumo_estado_idx" ON "LoteInsumo"("estado");

-- CreateIndex
CREATE INDEX "MovimientoStock_userId_idx" ON "MovimientoStock"("userId");

-- CreateIndex
CREATE INDEX "MovimientoStock_stockInsumoId_idx" ON "MovimientoStock"("stockInsumoId");

-- CreateIndex
CREATE INDEX "MovimientoStock_fecha_idx" ON "MovimientoStock"("fecha");

-- CreateIndex
CREATE INDEX "MovimientoStock_tipoMovimiento_idx" ON "MovimientoStock"("tipoMovimiento");

-- CreateIndex
CREATE INDEX "MateriaPrima_userId_idx" ON "MateriaPrima"("userId");

-- CreateIndex
CREATE INDEX "MateriaPrima_tipo_idx" ON "MateriaPrima"("tipo");

-- CreateIndex
CREATE INDEX "MateriaPrima_alertaStockBajo_idx" ON "MateriaPrima"("alertaStockBajo");

-- CreateIndex
CREATE INDEX "MovimientoMateriaPrima_userId_idx" ON "MovimientoMateriaPrima"("userId");

-- CreateIndex
CREATE INDEX "MovimientoMateriaPrima_materiaPrimaId_idx" ON "MovimientoMateriaPrima"("materiaPrimaId");

-- CreateIndex
CREATE INDEX "MovimientoMateriaPrima_fecha_idx" ON "MovimientoMateriaPrima"("fecha");

-- CreateIndex
CREATE INDEX "AlertaStock_userId_idx" ON "AlertaStock"("userId");

-- CreateIndex
CREATE INDEX "AlertaStock_stockInsumoId_idx" ON "AlertaStock"("stockInsumoId");

-- CreateIndex
CREATE INDEX "AlertaStock_estado_idx" ON "AlertaStock"("estado");

-- CreateIndex
CREATE INDEX "AlertaStock_severidad_idx" ON "AlertaStock"("severidad");

-- CreateIndex
CREATE UNIQUE INDEX "Transferencia_codigo_key" ON "Transferencia"("codigo");

-- CreateIndex
CREATE INDEX "Transferencia_userId_idx" ON "Transferencia"("userId");

-- CreateIndex
CREATE INDEX "Transferencia_tipo_idx" ON "Transferencia"("tipo");

-- CreateIndex
CREATE INDEX "Transferencia_estado_idx" ON "Transferencia"("estado");

-- CreateIndex
CREATE INDEX "Transferencia_fechaSolicitud_idx" ON "Transferencia"("fechaSolicitud");

-- CreateIndex
CREATE INDEX "DetalleTransferencia_userId_idx" ON "DetalleTransferencia"("userId");

-- CreateIndex
CREATE INDEX "DetalleTransferencia_transferenciaId_idx" ON "DetalleTransferencia"("transferenciaId");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroTransporte_transferenciaId_key" ON "RegistroTransporte"("transferenciaId");

-- CreateIndex
CREATE INDEX "RegistroTransporte_userId_idx" ON "RegistroTransporte"("userId");

-- CreateIndex
CREATE INDEX "RegistroTransporte_patente_idx" ON "RegistroTransporte"("patente");

-- CreateIndex
CREATE UNIQUE INDEX "Repuesto_codigo_key" ON "Repuesto"("codigo");

-- CreateIndex
CREATE INDEX "Repuesto_userId_idx" ON "Repuesto"("userId");

-- CreateIndex
CREATE INDEX "Repuesto_categoria_idx" ON "Repuesto"("categoria");

-- CreateIndex
CREATE INDEX "Repuesto_alertaStockBajo_idx" ON "Repuesto"("alertaStockBajo");

-- CreateIndex
CREATE INDEX "MovimientoRepuesto_userId_idx" ON "MovimientoRepuesto"("userId");

-- CreateIndex
CREATE INDEX "MovimientoRepuesto_repuestoId_idx" ON "MovimientoRepuesto"("repuestoId");

-- CreateIndex
CREATE INDEX "MovimientoRepuesto_fecha_idx" ON "MovimientoRepuesto"("fecha");

-- CreateIndex
CREATE INDEX "UsoRepuesto_userId_idx" ON "UsoRepuesto"("userId");

-- CreateIndex
CREATE INDEX "UsoRepuesto_mantenimientoId_idx" ON "UsoRepuesto"("mantenimientoId");

-- CreateIndex
CREATE INDEX "UsoRepuesto_repuestoId_idx" ON "UsoRepuesto"("repuestoId");

-- CreateIndex
CREATE INDEX "TanqueCombustible_userId_idx" ON "TanqueCombustible"("userId");

-- CreateIndex
CREATE INDEX "TanqueCombustible_alertaNivelBajo_idx" ON "TanqueCombustible"("alertaNivelBajo");

-- CreateIndex
CREATE INDEX "CargaCombustible_userId_idx" ON "CargaCombustible"("userId");

-- CreateIndex
CREATE INDEX "CargaCombustible_tanqueId_idx" ON "CargaCombustible"("tanqueId");

-- CreateIndex
CREATE INDEX "CargaCombustible_maquinariaId_idx" ON "CargaCombustible"("maquinariaId");

-- CreateIndex
CREATE INDEX "CargaCombustible_fecha_idx" ON "CargaCombustible"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Silo_codigo_key" ON "Silo"("codigo");

-- CreateIndex
CREATE INDEX "Silo_userId_idx" ON "Silo"("userId");

-- CreateIndex
CREATE INDEX "Silo_estado_idx" ON "Silo"("estado");

-- CreateIndex
CREATE INDEX "MovimientoSilo_userId_idx" ON "MovimientoSilo"("userId");

-- CreateIndex
CREATE INDEX "MovimientoSilo_siloId_idx" ON "MovimientoSilo"("siloId");

-- CreateIndex
CREATE INDEX "MovimientoSilo_fecha_idx" ON "MovimientoSilo"("fecha");

-- CreateIndex
CREATE INDEX "MovimientoSilo_cultivo_idx" ON "MovimientoSilo"("cultivo");

-- CreateIndex
CREATE INDEX "CalidadGrano_userId_idx" ON "CalidadGrano"("userId");

-- CreateIndex
CREATE INDEX "CalidadGrano_cultivo_idx" ON "CalidadGrano"("cultivo");

-- CreateIndex
CREATE INDEX "CalidadGrano_fechaAnalisis_idx" ON "CalidadGrano"("fechaAnalisis");

-- CreateIndex
CREATE UNIQUE INDEX "TicketBalanza_numeroTicket_key" ON "TicketBalanza"("numeroTicket");

-- CreateIndex
CREATE INDEX "TicketBalanza_userId_idx" ON "TicketBalanza"("userId");

-- CreateIndex
CREATE INDEX "TicketBalanza_fecha_idx" ON "TicketBalanza"("fecha");

-- CreateIndex
CREATE INDEX "TicketBalanza_numeroTicket_idx" ON "TicketBalanza"("numeroTicket");

-- CreateIndex
CREATE UNIQUE INDEX "Comprobante_transaccionId_key" ON "Comprobante"("transaccionId");

-- CreateIndex
CREATE INDEX "Comprobante_userId_idx" ON "Comprobante"("userId");

-- CreateIndex
CREATE INDEX "Comprobante_fecha_idx" ON "Comprobante"("fecha");

-- CreateIndex
CREATE INDEX "Comprobante_estado_idx" ON "Comprobante"("estado");

-- CreateIndex
CREATE INDEX "Comprobante_tipo_idx" ON "Comprobante"("tipo");

-- CreateIndex
CREATE INDEX "ItemComprobante_userId_idx" ON "ItemComprobante"("userId");

-- CreateIndex
CREATE INDEX "ItemComprobante_comprobanteId_idx" ON "ItemComprobante"("comprobanteId");

-- CreateIndex
CREATE INDEX "AsignacionCosto_userId_idx" ON "AsignacionCosto"("userId");

-- CreateIndex
CREATE INDEX "AsignacionCosto_comprobanteId_idx" ON "AsignacionCosto"("comprobanteId");

-- CreateIndex
CREATE INDEX "AsignacionCosto_destinoId_idx" ON "AsignacionCosto"("destinoId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivoFijo_codigo_key" ON "ActivoFijo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ActivoFijo_maquinariaId_key" ON "ActivoFijo"("maquinariaId");

-- CreateIndex
CREATE INDEX "ActivoFijo_userId_idx" ON "ActivoFijo"("userId");

-- CreateIndex
CREATE INDEX "ActivoFijo_estado_idx" ON "ActivoFijo"("estado");

-- CreateIndex
CREATE INDEX "ActivoFijo_tipo_idx" ON "ActivoFijo"("tipo");

-- CreateIndex
CREATE INDEX "RegistroDepreciacion_userId_idx" ON "RegistroDepreciacion"("userId");

-- CreateIndex
CREATE INDEX "RegistroDepreciacion_activoFijoId_idx" ON "RegistroDepreciacion"("activoFijoId");

-- CreateIndex
CREATE INDEX "RegistroDepreciacion_periodo_idx" ON "RegistroDepreciacion"("periodo");

-- CreateIndex
CREATE UNIQUE INDEX "RegistroDepreciacion_activoFijoId_periodo_key" ON "RegistroDepreciacion"("activoFijoId", "periodo");

-- CreateIndex
CREATE INDEX "TipoCambio_userId_idx" ON "TipoCambio"("userId");

-- CreateIndex
CREATE INDEX "TipoCambio_fecha_idx" ON "TipoCambio"("fecha");

-- CreateIndex
CREATE INDEX "TipoCambio_monedaDestino_idx" ON "TipoCambio"("monedaDestino");

-- CreateIndex
CREATE UNIQUE INDEX "TipoCambio_fecha_monedaBase_monedaDestino_userId_key" ON "TipoCambio"("fecha", "monedaBase", "monedaDestino", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FacturaEmitida_numero_key" ON "FacturaEmitida"("numero");

-- CreateIndex
CREATE INDEX "FacturaEmitida_userId_idx" ON "FacturaEmitida"("userId");

-- CreateIndex
CREATE INDEX "FacturaEmitida_fecha_idx" ON "FacturaEmitida"("fecha");

-- CreateIndex
CREATE INDEX "FacturaEmitida_estadoCobro_idx" ON "FacturaEmitida"("estadoCobro");

-- CreateIndex
CREATE INDEX "ItemFacturaEmitida_userId_idx" ON "ItemFacturaEmitida"("userId");

-- CreateIndex
CREATE INDEX "ItemFacturaEmitida_facturaId_idx" ON "ItemFacturaEmitida"("facturaId");

-- CreateIndex
CREATE INDEX "PagoRecibido_userId_idx" ON "PagoRecibido"("userId");

-- CreateIndex
CREATE INDEX "PagoRecibido_facturaId_idx" ON "PagoRecibido"("facturaId");

-- CreateIndex
CREATE INDEX "PagoRecibido_fecha_idx" ON "PagoRecibido"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "CuentaPorPagar_comprobanteId_key" ON "CuentaPorPagar"("comprobanteId");

-- CreateIndex
CREATE INDEX "CuentaPorPagar_userId_idx" ON "CuentaPorPagar"("userId");

-- CreateIndex
CREATE INDEX "CuentaPorPagar_estadoPago_idx" ON "CuentaPorPagar"("estadoPago");

-- CreateIndex
CREATE INDEX "CuentaPorPagar_fechaVencimiento_idx" ON "CuentaPorPagar"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "PagoRealizado_userId_idx" ON "PagoRealizado"("userId");

-- CreateIndex
CREATE INDEX "PagoRealizado_cuentaPorPagarId_idx" ON "PagoRealizado"("cuentaPorPagarId");

-- CreateIndex
CREATE INDEX "PagoRealizado_fecha_idx" ON "PagoRealizado"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Empleado_legajo_key" ON "Empleado"("legajo");

-- CreateIndex
CREATE INDEX "Empleado_userId_idx" ON "Empleado"("userId");

-- CreateIndex
CREATE INDEX "Empleado_estado_idx" ON "Empleado"("estado");

-- CreateIndex
CREATE INDEX "Empleado_area_idx" ON "Empleado"("area");

-- CreateIndex
CREATE INDEX "RegistroHorasEmpleado_userId_idx" ON "RegistroHorasEmpleado"("userId");

-- CreateIndex
CREATE INDEX "RegistroHorasEmpleado_empleadoId_idx" ON "RegistroHorasEmpleado"("empleadoId");

-- CreateIndex
CREATE INDEX "RegistroHorasEmpleado_fecha_idx" ON "RegistroHorasEmpleado"("fecha");

-- CreateIndex
CREATE INDEX "PagoSalario_userId_idx" ON "PagoSalario"("userId");

-- CreateIndex
CREATE INDEX "PagoSalario_empleadoId_idx" ON "PagoSalario"("empleadoId");

-- CreateIndex
CREATE INDEX "PagoSalario_periodo_idx" ON "PagoSalario"("periodo");

-- CreateIndex
CREATE UNIQUE INDEX "PagoSalario_empleadoId_periodo_key" ON "PagoSalario"("empleadoId", "periodo");

-- CreateIndex
CREATE INDEX "TareaEmpleado_userId_idx" ON "TareaEmpleado"("userId");

-- CreateIndex
CREATE INDEX "TareaEmpleado_empleadoId_idx" ON "TareaEmpleado"("empleadoId");

-- CreateIndex
CREATE INDEX "TareaEmpleado_estado_idx" ON "TareaEmpleado"("estado");

-- CreateIndex
CREATE INDEX "TareaEmpleado_fechaVencimiento_idx" ON "TareaEmpleado"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "Rol_userId_idx" ON "Rol"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_userId_nombre_key" ON "Rol"("userId", "nombre");

-- CreateIndex
CREATE INDEX "UsuarioRol_userId_idx" ON "UsuarioRol"("userId");

-- CreateIndex
CREATE INDEX "UsuarioRol_usuarioEmail_idx" ON "UsuarioRol"("usuarioEmail");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioRol_usuarioEmail_rolId_userId_key" ON "UsuarioRol"("usuarioEmail", "rolId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Contratista_email_key" ON "Contratista"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Contratista_codigoAcceso_key" ON "Contratista"("codigoAcceso");

-- CreateIndex
CREATE INDEX "Contratista_userId_idx" ON "Contratista"("userId");

-- CreateIndex
CREATE INDEX "Contratista_email_idx" ON "Contratista"("email");

-- CreateIndex
CREATE INDEX "Contratista_estado_idx" ON "Contratista"("estado");

-- CreateIndex
CREATE INDEX "TrabajoContratista_userId_idx" ON "TrabajoContratista"("userId");

-- CreateIndex
CREATE INDEX "TrabajoContratista_contratistaId_idx" ON "TrabajoContratista"("contratistaId");

-- CreateIndex
CREATE INDEX "TrabajoContratista_estado_idx" ON "TrabajoContratista"("estado");

-- CreateIndex
CREATE INDEX "Establecimiento_nombre_idx" ON "Establecimiento"("nombre");

-- CreateIndex
CREATE INDEX "Establecimiento_userId_idx" ON "Establecimiento"("userId");

-- CreateIndex
CREATE INDEX "RegistroCombustible_maquinariaId_idx" ON "RegistroCombustible"("maquinariaId");

-- CreateIndex
CREATE INDEX "RegistroCombustible_fecha_idx" ON "RegistroCombustible"("fecha");

-- CreateIndex
CREATE INDEX "UsoMaquinaria_maquinariaId_idx" ON "UsoMaquinaria"("maquinariaId");

-- CreateIndex
CREATE INDEX "UsoMaquinaria_fecha_idx" ON "UsoMaquinaria"("fecha");

-- CreateIndex
CREATE INDEX "UsoMaquinaria_operador_idx" ON "UsoMaquinaria"("operador");

-- CreateIndex
CREATE INDEX "Mantenimiento_maquinariaId_idx" ON "Mantenimiento"("maquinariaId");

-- CreateIndex
CREATE INDEX "Mantenimiento_estado_idx" ON "Mantenimiento"("estado");

-- CreateIndex
CREATE INDEX "Mantenimiento_tipo_idx" ON "Mantenimiento"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Maquinaria_codigo_key" ON "Maquinaria"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Maquinaria_numeroSerie_key" ON "Maquinaria"("numeroSerie");

-- CreateIndex
CREATE UNIQUE INDEX "Maquinaria_patente_key" ON "Maquinaria"("patente");

-- CreateIndex
CREATE INDEX "Maquinaria_establecimientoId_idx" ON "Maquinaria"("establecimientoId");

-- CreateIndex
CREATE INDEX "Maquinaria_estado_idx" ON "Maquinaria"("estado");

-- CreateIndex
CREATE INDEX "Maquinaria_tipo_idx" ON "Maquinaria"("tipo");

-- CreateIndex
CREATE INDEX "TelemetriaGPS_maquinariaId_idx" ON "TelemetriaGPS"("maquinariaId");

-- CreateIndex
CREATE INDEX "TelemetriaGPS_timestamp_idx" ON "TelemetriaGPS"("timestamp");

-- CreateIndex
CREATE INDEX "EficienciaMaquinaria_maquinariaId_idx" ON "EficienciaMaquinaria"("maquinariaId");

-- CreateIndex
CREATE INDEX "EficienciaMaquinaria_fecha_idx" ON "EficienciaMaquinaria"("fecha");

-- CreateIndex
CREATE INDEX "EficienciaMaquinaria_operador_idx" ON "EficienciaMaquinaria"("operador");

-- CreateIndex
CREATE INDEX "AlertaMantenimiento_maquinariaId_idx" ON "AlertaMantenimiento"("maquinariaId");

-- CreateIndex
CREATE INDEX "AlertaMantenimiento_estado_idx" ON "AlertaMantenimiento"("estado");

-- CreateIndex
CREATE INDEX "AlertaMantenimiento_prioridad_idx" ON "AlertaMantenimiento"("prioridad");

-- CreateIndex
CREATE INDEX "AlertaMantenimiento_tipo_idx" ON "AlertaMantenimiento"("tipo");

-- CreateIndex
CREATE INDEX "SensorPredictivo_maquinariaId_idx" ON "SensorPredictivo"("maquinariaId");

-- CreateIndex
CREATE INDEX "SensorPredictivo_estado_idx" ON "SensorPredictivo"("estado");

-- CreateIndex
CREATE INDEX "SensorPredictivo_tipoSensor_idx" ON "SensorPredictivo"("tipoSensor");

-- CreateIndex
CREATE UNIQUE INDEX "SensorPredictivo_maquinariaId_codigoSensor_key" ON "SensorPredictivo"("maquinariaId", "codigoSensor");

-- CreateIndex
CREATE INDEX "LecturaSensor_sensorId_idx" ON "LecturaSensor"("sensorId");

-- CreateIndex
CREATE INDEX "LecturaSensor_timestamp_idx" ON "LecturaSensor"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "OrdenTaller_numeroOrden_key" ON "OrdenTaller"("numeroOrden");

-- CreateIndex
CREATE INDEX "OrdenTaller_maquinariaId_idx" ON "OrdenTaller"("maquinariaId");

-- CreateIndex
CREATE INDEX "OrdenTaller_estado_idx" ON "OrdenTaller"("estado");

-- CreateIndex
CREATE INDEX "OrdenTaller_prioridad_idx" ON "OrdenTaller"("prioridad");

-- CreateIndex
CREATE INDEX "OrdenTaller_mecanicoAsignado_idx" ON "OrdenTaller"("mecanicoAsignado");

-- CreateIndex
CREATE INDEX "OrdenTaller_fechaIngreso_idx" ON "OrdenTaller"("fechaIngreso");

-- CreateIndex
CREATE INDEX "RepuestoUsado_ordenTallerId_idx" ON "RepuestoUsado"("ordenTallerId");

-- CreateIndex
CREATE INDEX "ManoObraTaller_ordenTallerId_idx" ON "ManoObraTaller"("ordenTallerId");

-- CreateIndex
CREATE INDEX "ManoObraTaller_mecanico_idx" ON "ManoObraTaller"("mecanico");

-- CreateIndex
CREATE INDEX "EvaluacionOperador_operador_idx" ON "EvaluacionOperador"("operador");

-- CreateIndex
CREATE INDEX "EvaluacionOperador_maquinariaId_idx" ON "EvaluacionOperador"("maquinariaId");

-- CreateIndex
CREATE INDEX "EvaluacionOperador_fecha_idx" ON "EvaluacionOperador"("fecha");

-- CreateIndex
CREATE INDEX "EvaluacionOperador_scoreGeneral_idx" ON "EvaluacionOperador"("scoreGeneral");

-- CreateIndex
CREATE INDEX "EvaluacionOperador_userId_idx" ON "EvaluacionOperador"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Operador_documento_key" ON "Operador"("documento");

-- CreateIndex
CREATE INDEX "Operador_estado_idx" ON "Operador"("estado");

-- CreateIndex
CREATE INDEX "Operador_scorePromedio_idx" ON "Operador"("scorePromedio");

-- CreateIndex
CREATE INDEX "ChecklistDiario_maquinariaId_idx" ON "ChecklistDiario"("maquinariaId");

-- CreateIndex
CREATE INDEX "ChecklistDiario_fecha_idx" ON "ChecklistDiario"("fecha");

-- CreateIndex
CREATE INDEX "ChecklistDiario_operador_idx" ON "ChecklistDiario"("operador");

-- CreateIndex
CREATE INDEX "HuellaCarbono_establecimientoId_idx" ON "HuellaCarbono"("establecimientoId");

-- CreateIndex
CREATE INDEX "HuellaCarbono_fechaInicio_fechaFin_idx" ON "HuellaCarbono"("fechaInicio", "fechaFin");

-- CreateIndex
CREATE UNIQUE INDEX "HuellaCarbono_establecimientoId_periodo_key" ON "HuellaCarbono"("establecimientoId", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "RecetaAgronomica_numeroReceta_key" ON "RecetaAgronomica"("numeroReceta");

-- CreateIndex
CREATE UNIQUE INDEX "RecetaAgronomica_laborId_key" ON "RecetaAgronomica"("laborId");

-- CreateIndex
CREATE INDEX "RecetaAgronomica_establecimientoId_idx" ON "RecetaAgronomica"("establecimientoId");

-- CreateIndex
CREATE INDEX "RecetaAgronomica_numeroReceta_idx" ON "RecetaAgronomica"("numeroReceta");

-- CreateIndex
CREATE INDEX "RecetaAgronomica_estado_idx" ON "RecetaAgronomica"("estado");

-- CreateIndex
CREATE INDEX "RecetaAgronomica_fechaEmision_idx" ON "RecetaAgronomica"("fechaEmision");

-- CreateIndex
CREATE INDEX "RecetaProducto_recetaId_idx" ON "RecetaProducto"("recetaId");

-- CreateIndex
CREATE UNIQUE INDEX "ReporteAgroquimico_numeroReporte_key" ON "ReporteAgroquimico"("numeroReporte");

-- CreateIndex
CREATE INDEX "ReporteAgroquimico_establecimientoId_idx" ON "ReporteAgroquimico"("establecimientoId");

-- CreateIndex
CREATE INDEX "ReporteAgroquimico_periodo_idx" ON "ReporteAgroquimico"("periodo");

-- CreateIndex
CREATE INDEX "ReporteAgroquimico_estado_idx" ON "ReporteAgroquimico"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "CertificacionSostenibilidad_numeroCertificado_key" ON "CertificacionSostenibilidad"("numeroCertificado");

-- CreateIndex
CREATE INDEX "CertificacionSostenibilidad_establecimientoId_idx" ON "CertificacionSostenibilidad"("establecimientoId");

-- CreateIndex
CREATE INDEX "CertificacionSostenibilidad_estado_idx" ON "CertificacionSostenibilidad"("estado");

-- CreateIndex
CREATE INDEX "CertificacionSostenibilidad_tipoCertificacion_idx" ON "CertificacionSostenibilidad"("tipoCertificacion");

-- CreateIndex
CREATE INDEX "ChecklistCertificacion_certificacionId_idx" ON "ChecklistCertificacion"("certificacionId");

-- CreateIndex
CREATE INDEX "ChecklistCertificacion_codigo_idx" ON "ChecklistCertificacion"("codigo");

-- CreateIndex
CREATE INDEX "DocumentoCertificacion_certificacionId_idx" ON "DocumentoCertificacion"("certificacionId");

-- CreateIndex
CREATE INDEX "DocumentoCertificacion_categoria_idx" ON "DocumentoCertificacion"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceEUDR_numeroDeclaracion_key" ON "ComplianceEUDR"("numeroDeclaracion");

-- CreateIndex
CREATE INDEX "ComplianceEUDR_establecimientoId_idx" ON "ComplianceEUDR"("establecimientoId");

-- CreateIndex
CREATE INDEX "ComplianceEUDR_numeroDeclaracion_idx" ON "ComplianceEUDR"("numeroDeclaracion");

-- CreateIndex
CREATE INDEX "ComplianceEUDR_producto_idx" ON "ComplianceEUDR"("producto");

-- CreateIndex
CREATE INDEX "ComplianceEUDR_estado_idx" ON "ComplianceEUDR"("estado");

-- CreateIndex
CREATE INDEX "Insight_userId_clave_idx" ON "Insight"("userId", "clave");

-- CreateIndex
CREATE INDEX "Insight_userId_tipo_idx" ON "Insight"("userId", "tipo");

-- AddForeignKey
ALTER TABLE "campos" ADD CONSTRAINT "campos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_campoId_fkey" FOREIGN KEY ("campoId") REFERENCES "campos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lote" ADD CONSTRAINT "Lote_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "Establecimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siembra" ADD CONSTRAINT "Siembra_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siembra" ADD CONSTRAINT "Siembra_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cosecha" ADD CONSTRAINT "Cosecha_siembraId_fkey" FOREIGN KEY ("siembraId") REFERENCES "Siembra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cosecha" ADD CONSTRAINT "Cosecha_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cosecha" ADD CONSTRAINT "Cosecha_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoSanitario" ADD CONSTRAINT "EventoSanitario_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoSanitario" ADD CONSTRAINT "EventoSanitario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecioReferencia" ADD CONSTRAINT "PrecioReferencia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmisionCarbono" ADD CONSTRAINT "EmisionCarbono_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmisionCarbono" ADD CONSTRAINT "EmisionCarbono_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticaSostenible" ADD CONSTRAINT "PracticaSostenible_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticaSostenible" ADD CONSTRAINT "PracticaSostenible_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificacion" ADD CONSTRAINT "Certificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Labor" ADD CONSTRAINT "Labor_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Labor" ADD CONSTRAINT "Labor_maquinariaId_fkey" FOREIGN KEY ("maquinariaId") REFERENCES "Maquinaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Labor" ADD CONSTRAINT "Labor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AplicacionProducto" ADD CONSTRAINT "AplicacionProducto_laborId_fkey" FOREIGN KEY ("laborId") REFERENCES "Labor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AplicacionProducto" ADD CONSTRAINT "AplicacionProducto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoReproductivo" ADD CONSTRAINT "EventoReproductivo_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoReproductivo" ADD CONSTRAINT "EventoReproductivo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialReproductivo" ADD CONSTRAINT "HistorialReproductivo_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialReproductivo" ADD CONSTRAINT "HistorialReproductivo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UbicacionProducto" ADD CONSTRAINT "UbicacionProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UbicacionProducto" ADD CONSTRAINT "UbicacionProducto_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UbicacionProducto" ADD CONSTRAINT "UbicacionProducto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaProducto" ADD CONSTRAINT "TransferenciaProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaProducto" ADD CONSTRAINT "TransferenciaProducto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaClimatica" ADD CONSTRAINT "AlertaClimatica_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ubicacion" ADD CONSTRAINT "Ubicacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alimento" ADD CONSTRAINT "Alimento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Racion" ADD CONSTRAINT "Racion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponenteRacion" ADD CONSTRAINT "ComponenteRacion_racionId_fkey" FOREIGN KEY ("racionId") REFERENCES "Racion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponenteRacion" ADD CONSTRAINT "ComponenteRacion_alimentoId_fkey" FOREIGN KEY ("alimentoId") REFERENCES "Alimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponenteRacion" ADD CONSTRAINT "ComponenteRacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaBancaria" ADD CONSTRAINT "CuentaBancaria_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractoBancario" ADD CONSTRAINT "ExtractoBancario_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaBancaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractoBancario" ADD CONSTRAINT "ExtractoBancario_transaccionId_fkey" FOREIGN KEY ("transaccionId") REFERENCES "transacciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractoBancario" ADD CONSTRAINT "ExtractoBancario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conciliacion" ADD CONSTRAINT "Conciliacion_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "CuentaBancaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conciliacion" ADD CONSTRAINT "Conciliacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiferenciaConciliacion" ADD CONSTRAINT "DiferenciaConciliacion_conciliacionId_fkey" FOREIGN KEY ("conciliacionId") REFERENCES "Conciliacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiferenciaConciliacion" ADD CONSTRAINT "DiferenciaConciliacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroLechero" ADD CONSTRAINT "RegistroLechero_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroLechero" ADD CONSTRAINT "RegistroLechero_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostoLote" ADD CONSTRAINT "CostoLote_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostoLote" ADD CONSTRAINT "CostoLote_laborId_fkey" FOREIGN KEY ("laborId") REFERENCES "Labor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostoLote" ADD CONSTRAINT "CostoLote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostoAnimal" ADD CONSTRAINT "CostoAnimal_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostoAnimal" ADD CONSTRAINT "CostoAnimal_eventoSanitarioId_fkey" FOREIGN KEY ("eventoSanitarioId") REFERENCES "EventoSanitario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostoAnimal" ADD CONSTRAINT "CostoAnimal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MargenBruto" ADD CONSTRAINT "MargenBruto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arrendamiento" ADD CONSTRAINT "Arrendamiento_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arrendamiento" ADD CONSTRAINT "Arrendamiento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaPredictiva" ADD CONSTRAINT "AlertaPredictiva_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSiembra" ADD CONSTRAINT "PlanSiembra_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSiembra" ADD CONSTRAINT "PlanSiembra_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalisisSuelo" ADD CONSTRAINT "AnalisisSuelo_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalisisSuelo" ADD CONSTRAINT "AnalisisSuelo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroTrazabilidad" ADD CONSTRAINT "RegistroTrazabilidad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaTrazabilidad" ADD CONSTRAINT "EtapaTrazabilidad_registroId_fkey" FOREIGN KEY ("registroId") REFERENCES "RegistroTrazabilidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaTrazabilidad" ADD CONSTRAINT "EtapaTrazabilidad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarcadorGeorreferenciado" ADD CONSTRAINT "MarcadorGeorreferenciado_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarcadorGeorreferenciado" ADD CONSTRAINT "MarcadorGeorreferenciado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagenSatelital" ADD CONSTRAINT "ImagenSatelital_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagenSatelital" ADD CONSTRAINT "ImagenSatelital_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroPluviometrico" ADD CONSTRAINT "RegistroPluviometrico_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroPluviometrico" ADD CONSTRAINT "RegistroPluviometrico_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculoDosis" ADD CONSTRAINT "CalculoDosis_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculoDosis" ADD CONSTRAINT "CalculoDosis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaPlaga" ADD CONSTRAINT "AlertaPlaga_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaPlaga" ADD CONSTRAINT "AlertaPlaga_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanRiego" ADD CONSTRAINT "PlanRiego_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanRiego" ADD CONSTRAINT "PlanRiego_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoRiego" ADD CONSTRAINT "EventoRiego_planRiegoId_fkey" FOREIGN KEY ("planRiegoId") REFERENCES "PlanRiego"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoRiego" ADD CONSTRAINT "EventoRiego_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticoSalud" ADD CONSTRAINT "DiagnosticoSalud_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticoSalud" ADD CONSTRAINT "DiagnosticoSalud_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanNutricional" ADD CONSTRAINT "PlanNutricional_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanNutricional" ADD CONSTRAINT "PlanNutricional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroConsumo" ADD CONSTRAINT "RegistroConsumo_planNutricionalId_fkey" FOREIGN KEY ("planNutricionalId") REFERENCES "PlanNutricional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroConsumo" ADD CONSTRAINT "RegistroConsumo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjusteNutricional" ADD CONSTRAINT "AjusteNutricional_planNutricionalId_fkey" FOREIGN KEY ("planNutricionalId") REFERENCES "PlanNutricional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjusteNutricional" ADD CONSTRAINT "AjusteNutricional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalisisReproductivo" ADD CONSTRAINT "AnalisisReproductivo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaSanitaria" ADD CONSTRAINT "AlertaSanitaria_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotacionCultivo" ADD CONSTRAINT "RotacionCultivo_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotacionCultivo" ADD CONSTRAINT "RotacionCultivo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZonaManejo" ADD CONSTRAINT "ZonaManejo_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZonaManejo" ADD CONSTRAINT "ZonaManejo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapaPrescripcion" ADD CONSTRAINT "MapaPrescripcion_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapaPrescripcion" ADD CONSTRAINT "MapaPrescripcion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PronosticoClimatico" ADD CONSTRAINT "PronosticoClimatico_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorIoT" ADD CONSTRAINT "SensorIoT_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorIoT" ADD CONSTRAINT "SensorIoT_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapaRendimiento" ADD CONSTRAINT "MapaRendimiento_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapaRendimiento" ADD CONSTRAINT "MapaRendimiento_cosechaId_fkey" FOREIGN KEY ("cosechaId") REFERENCES "Cosecha"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapaRendimiento" ADD CONSTRAINT "MapaRendimiento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalisisCostoRiego" ADD CONSTRAINT "AnalisisCostoRiego_planRiegoId_fkey" FOREIGN KEY ("planRiegoId") REFERENCES "PlanRiego"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalisisCostoRiego" ADD CONSTRAINT "AnalisisCostoRiego_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroPeso" ADD CONSTRAINT "RegistroPeso_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroPeso" ADD CONSTRAINT "RegistroPeso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoAnimal" ADD CONSTRAINT "MovimientoAnimal_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoAnimal" ADD CONSTRAINT "MovimientoAnimal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProduccionLechera" ADD CONSTRAINT "ProduccionLechera_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProduccionLechera" ADD CONSTRAINT "ProduccionLechera_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroGenetico" ADD CONSTRAINT "RegistroGenetico_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroGenetico" ADD CONSTRAINT "RegistroGenetico_padreId_fkey" FOREIGN KEY ("padreId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroGenetico" ADD CONSTRAINT "RegistroGenetico_madreId_fkey" FOREIGN KEY ("madreId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroGenetico" ADD CONSTRAINT "RegistroGenetico_abueloPaternoId_fkey" FOREIGN KEY ("abueloPaternoId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroGenetico" ADD CONSTRAINT "RegistroGenetico_abuelaPaternaId_fkey" FOREIGN KEY ("abuelaPaternaId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroGenetico" ADD CONSTRAINT "RegistroGenetico_abueloMaternoId_fkey" FOREIGN KEY ("abueloMaternoId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroGenetico" ADD CONSTRAINT "RegistroGenetico_abuelaMaternaId_fkey" FOREIGN KEY ("abuelaMaternaId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroGenetico" ADD CONSTRAINT "RegistroGenetico_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalisisROIGenetico" ADD CONSTRAINT "AnalisisROIGenetico_reproductorId_fkey" FOREIGN KEY ("reproductorId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalisisROIGenetico" ADD CONSTRAINT "AnalisisROIGenetico_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlCargaAnimal" ADD CONSTRAINT "ControlCargaAnimal_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlCargaAnimal" ADD CONSTRAINT "ControlCargaAnimal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoVida" ADD CONSTRAINT "EventoVida_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoVida" ADD CONSTRAINT "EventoVida_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockInsumo" ADD CONSTRAINT "StockInsumo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoteInsumo" ADD CONSTRAINT "LoteInsumo_stockInsumoId_fkey" FOREIGN KEY ("stockInsumoId") REFERENCES "StockInsumo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoteInsumo" ADD CONSTRAINT "LoteInsumo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoStock" ADD CONSTRAINT "MovimientoStock_stockInsumoId_fkey" FOREIGN KEY ("stockInsumoId") REFERENCES "StockInsumo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoStock" ADD CONSTRAINT "MovimientoStock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MateriaPrima" ADD CONSTRAINT "MateriaPrima_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoMateriaPrima" ADD CONSTRAINT "MovimientoMateriaPrima_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "MateriaPrima"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoMateriaPrima" ADD CONSTRAINT "MovimientoMateriaPrima_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaStock" ADD CONSTRAINT "AlertaStock_stockInsumoId_fkey" FOREIGN KEY ("stockInsumoId") REFERENCES "StockInsumo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaStock" ADD CONSTRAINT "AlertaStock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleTransferencia" ADD CONSTRAINT "DetalleTransferencia_transferenciaId_fkey" FOREIGN KEY ("transferenciaId") REFERENCES "Transferencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleTransferencia" ADD CONSTRAINT "DetalleTransferencia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroTransporte" ADD CONSTRAINT "RegistroTransporte_transferenciaId_fkey" FOREIGN KEY ("transferenciaId") REFERENCES "Transferencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroTransporte" ADD CONSTRAINT "RegistroTransporte_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repuesto" ADD CONSTRAINT "Repuesto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoRepuesto" ADD CONSTRAINT "MovimientoRepuesto_repuestoId_fkey" FOREIGN KEY ("repuestoId") REFERENCES "Repuesto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoRepuesto" ADD CONSTRAINT "MovimientoRepuesto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsoRepuesto" ADD CONSTRAINT "UsoRepuesto_mantenimientoId_fkey" FOREIGN KEY ("mantenimientoId") REFERENCES "Mantenimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsoRepuesto" ADD CONSTRAINT "UsoRepuesto_repuestoId_fkey" FOREIGN KEY ("repuestoId") REFERENCES "Repuesto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsoRepuesto" ADD CONSTRAINT "UsoRepuesto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TanqueCombustible" ADD CONSTRAINT "TanqueCombustible_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargaCombustible" ADD CONSTRAINT "CargaCombustible_tanqueId_fkey" FOREIGN KEY ("tanqueId") REFERENCES "TanqueCombustible"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargaCombustible" ADD CONSTRAINT "CargaCombustible_maquinariaId_fkey" FOREIGN KEY ("maquinariaId") REFERENCES "Maquinaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargaCombustible" ADD CONSTRAINT "CargaCombustible_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Silo" ADD CONSTRAINT "Silo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoSilo" ADD CONSTRAINT "MovimientoSilo_siloId_fkey" FOREIGN KEY ("siloId") REFERENCES "Silo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoSilo" ADD CONSTRAINT "MovimientoSilo_calidadGranoId_fkey" FOREIGN KEY ("calidadGranoId") REFERENCES "CalidadGrano"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoSilo" ADD CONSTRAINT "MovimientoSilo_ticketBalanzaId_fkey" FOREIGN KEY ("ticketBalanzaId") REFERENCES "TicketBalanza"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoSilo" ADD CONSTRAINT "MovimientoSilo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalidadGrano" ADD CONSTRAINT "CalidadGrano_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketBalanza" ADD CONSTRAINT "TicketBalanza_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_transaccionId_fkey" FOREIGN KEY ("transaccionId") REFERENCES "transacciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprobante" ADD CONSTRAINT "Comprobante_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemComprobante" ADD CONSTRAINT "ItemComprobante_comprobanteId_fkey" FOREIGN KEY ("comprobanteId") REFERENCES "Comprobante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemComprobante" ADD CONSTRAINT "ItemComprobante_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionCosto" ADD CONSTRAINT "AsignacionCosto_comprobanteId_fkey" FOREIGN KEY ("comprobanteId") REFERENCES "Comprobante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionCosto" ADD CONSTRAINT "AsignacionCosto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivoFijo" ADD CONSTRAINT "ActivoFijo_maquinariaId_fkey" FOREIGN KEY ("maquinariaId") REFERENCES "Maquinaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivoFijo" ADD CONSTRAINT "ActivoFijo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroDepreciacion" ADD CONSTRAINT "RegistroDepreciacion_activoFijoId_fkey" FOREIGN KEY ("activoFijoId") REFERENCES "ActivoFijo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroDepreciacion" ADD CONSTRAINT "RegistroDepreciacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoCambio" ADD CONSTRAINT "TipoCambio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaEmitida" ADD CONSTRAINT "FacturaEmitida_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemFacturaEmitida" ADD CONSTRAINT "ItemFacturaEmitida_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "FacturaEmitida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemFacturaEmitida" ADD CONSTRAINT "ItemFacturaEmitida_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoRecibido" ADD CONSTRAINT "PagoRecibido_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "FacturaEmitida"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoRecibido" ADD CONSTRAINT "PagoRecibido_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaPorPagar" ADD CONSTRAINT "CuentaPorPagar_comprobanteId_fkey" FOREIGN KEY ("comprobanteId") REFERENCES "Comprobante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaPorPagar" ADD CONSTRAINT "CuentaPorPagar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoRealizado" ADD CONSTRAINT "PagoRealizado_cuentaPorPagarId_fkey" FOREIGN KEY ("cuentaPorPagarId") REFERENCES "CuentaPorPagar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoRealizado" ADD CONSTRAINT "PagoRealizado_cuentaBancariaId_fkey" FOREIGN KEY ("cuentaBancariaId") REFERENCES "CuentaBancaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoRealizado" ADD CONSTRAINT "PagoRealizado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empleado" ADD CONSTRAINT "Empleado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroHorasEmpleado" ADD CONSTRAINT "RegistroHorasEmpleado_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroHorasEmpleado" ADD CONSTRAINT "RegistroHorasEmpleado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoSalario" ADD CONSTRAINT "PagoSalario_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagoSalario" ADD CONSTRAINT "PagoSalario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaEmpleado" ADD CONSTRAINT "TareaEmpleado_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "Empleado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TareaEmpleado" ADD CONSTRAINT "TareaEmpleado_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rol" ADD CONSTRAINT "Rol_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioRol" ADD CONSTRAINT "UsuarioRol_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioRol" ADD CONSTRAINT "UsuarioRol_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contratista" ADD CONSTRAINT "Contratista_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrabajoContratista" ADD CONSTRAINT "TrabajoContratista_contratistaId_fkey" FOREIGN KEY ("contratistaId") REFERENCES "Contratista"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrabajoContratista" ADD CONSTRAINT "TrabajoContratista_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Establecimiento" ADD CONSTRAINT "Establecimiento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroCombustible" ADD CONSTRAINT "RegistroCombustible_maquinariaId_fkey" FOREIGN KEY ("maquinariaId") REFERENCES "Maquinaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsoMaquinaria" ADD CONSTRAINT "UsoMaquinaria_maquinariaId_fkey" FOREIGN KEY ("maquinariaId") REFERENCES "Maquinaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mantenimiento" ADD CONSTRAINT "Mantenimiento_maquinariaId_fkey" FOREIGN KEY ("maquinariaId") REFERENCES "Maquinaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mantenimiento" ADD CONSTRAINT "Mantenimiento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maquinaria" ADD CONSTRAINT "Maquinaria_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "Establecimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelemetriaGPS" ADD CONSTRAINT "TelemetriaGPS_maquinariaId_fkey" FOREIGN KEY ("maquinariaId") REFERENCES "Maquinaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EficienciaMaquinaria" ADD CONSTRAINT "EficienciaMaquinaria_maquinariaId_fkey" FOREIGN KEY ("maquinariaId") REFERENCES "Maquinaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaMantenimiento" ADD CONSTRAINT "AlertaMantenimiento_maquinariaId_fkey" FOREIGN KEY ("maquinariaId") REFERENCES "Maquinaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensorPredictivo" ADD CONSTRAINT "SensorPredictivo_maquinariaId_fkey" FOREIGN KEY ("maquinariaId") REFERENCES "Maquinaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturaSensor" ADD CONSTRAINT "LecturaSensor_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "SensorPredictivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturaSensor" ADD CONSTRAINT "LecturaSensor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturaSensor" ADD CONSTRAINT "LecturaSensor_sensorIoTId_fkey" FOREIGN KEY ("sensorIoTId") REFERENCES "SensorIoT"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenTaller" ADD CONSTRAINT "OrdenTaller_maquinariaId_fkey" FOREIGN KEY ("maquinariaId") REFERENCES "Maquinaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepuestoUsado" ADD CONSTRAINT "RepuestoUsado_ordenTallerId_fkey" FOREIGN KEY ("ordenTallerId") REFERENCES "OrdenTaller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManoObraTaller" ADD CONSTRAINT "ManoObraTaller_ordenTallerId_fkey" FOREIGN KEY ("ordenTallerId") REFERENCES "OrdenTaller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionOperador" ADD CONSTRAINT "EvaluacionOperador_maquinariaId_fkey" FOREIGN KEY ("maquinariaId") REFERENCES "Maquinaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionOperador" ADD CONSTRAINT "EvaluacionOperador_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuellaCarbono" ADD CONSTRAINT "HuellaCarbono_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "Establecimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaAgronomica" ADD CONSTRAINT "RecetaAgronomica_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "Establecimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaAgronomica" ADD CONSTRAINT "RecetaAgronomica_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaAgronomica" ADD CONSTRAINT "RecetaAgronomica_laborId_fkey" FOREIGN KEY ("laborId") REFERENCES "Labor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaProducto" ADD CONSTRAINT "RecetaProducto_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "RecetaAgronomica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReporteAgroquimico" ADD CONSTRAINT "ReporteAgroquimico_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "Establecimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificacionSostenibilidad" ADD CONSTRAINT "CertificacionSostenibilidad_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "Establecimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistCertificacion" ADD CONSTRAINT "ChecklistCertificacion_certificacionId_fkey" FOREIGN KEY ("certificacionId") REFERENCES "CertificacionSostenibilidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoCertificacion" ADD CONSTRAINT "DocumentoCertificacion_certificacionId_fkey" FOREIGN KEY ("certificacionId") REFERENCES "CertificacionSostenibilidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceEUDR" ADD CONSTRAINT "ComplianceEUDR_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "Establecimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

