-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "id" SERIAL NOT NULL,
    "moneda_por_defecto" VARCHAR(10) NOT NULL DEFAULT 'PEN',
    "tipo_tasa_defecto" VARCHAR(20) NOT NULL DEFAULT 'EFECTIVA',
    "capitalizacion_defecto" VARCHAR(20) NOT NULL DEFAULT 'MENSUAL',
    "gracia_total_maxima" INTEGER NOT NULL DEFAULT 12,
    "gracia_parcial_maxima" INTEGER NOT NULL DEFAULT 24,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entidades_financieras" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "tasa_minima" DOUBLE PRECISION,
    "tasa_maxima" DOUBLE PRECISION,
    "monto_minimo" DOUBLE PRECISION,
    "monto_maximo" DOUBLE PRECISION,
    "plazo_minimo" INTEGER,
    "plazo_maximo" INTEGER,
    "acepta_bono_techo_propio" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entidades_financieras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entidades_financieras_codigo_key" ON "entidades_financieras"("codigo");
