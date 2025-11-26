-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "email" VARCHAR(100),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id_cliente" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nombre" VARCHAR(100),
    "dni" VARCHAR(20),
    "correo" VARCHAR(100),
    "ingreso_mensual" DOUBLE PRECISION,
    "gasto_mensual" DOUBLE PRECISION,
    "ocupacion" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "asesores" (
    "id_asesor" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nombres" VARCHAR(100),
    "apellidos" VARCHAR(100),
    "email" VARCHAR(100),
    "telefono" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asesores_pkey" PRIMARY KEY ("id_asesor")
);

-- CreateTable
CREATE TABLE "creditos" (
    "id_credito" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "moneda" VARCHAR(10) NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "plazo" INTEGER NOT NULL,
    "tasa_interes" DOUBLE PRECISION NOT NULL,
    "tipo_tasa" VARCHAR(50) NOT NULL,
    "capitalizacion" VARCHAR(50) NOT NULL,
    "fecha_desembolso" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creditos_pkey" PRIMARY KEY ("id_credito")
);

-- CreateTable
CREATE TABLE "plan_pagos" (
    "id" SERIAL NOT NULL,
    "credito_id" INTEGER NOT NULL,
    "numero_cuota" INTEGER NOT NULL,
    "saldo_inicial" DOUBLE PRECISION NOT NULL,
    "interes" DOUBLE PRECISION NOT NULL,
    "cuota" DOUBLE PRECISION NOT NULL,
    "amortizacion" DOUBLE PRECISION NOT NULL,
    "saldo_final" DOUBLE PRECISION NOT NULL,
    "flujo" DOUBLE PRECISION NOT NULL,
    "seguro_desgrav" DOUBLE PRECISION,
    "seguro_inmueble" DOUBLE PRECISION,
    "portes" DOUBLE PRECISION,

    CONSTRAINT "plan_pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicadores_financieros" (
    "id" SERIAL NOT NULL,
    "credito_id" INTEGER NOT NULL,
    "van" DOUBLE PRECISION NOT NULL,
    "tir" DOUBLE PRECISION NOT NULL,
    "tcea" DOUBLE PRECISION NOT NULL,
    "tasa_costo" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "indicadores_financieros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_inmobiliarias" (
    "id_unidad" SERIAL NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT,
    "direccion" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unidades_inmobiliarias_pkey" PRIMARY KEY ("id_unidad")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "username" VARCHAR(50),
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" INTEGER,
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "request_method" VARCHAR(10),
    "request_url" TEXT,
    "request_body" TEXT,
    "response_status" INTEGER,
    "error_message" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_user_id_key" ON "clientes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "asesores_user_id_key" ON "asesores"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "indicadores_financieros_credito_id_key" ON "indicadores_financieros"("credito_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asesores" ADD CONSTRAINT "asesores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditos" ADD CONSTRAINT "creditos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id_cliente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_pagos" ADD CONSTRAINT "plan_pagos_credito_id_fkey" FOREIGN KEY ("credito_id") REFERENCES "creditos"("id_credito") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicadores_financieros" ADD CONSTRAINT "indicadores_financieros_credito_id_fkey" FOREIGN KEY ("credito_id") REFERENCES "creditos"("id_credito") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
