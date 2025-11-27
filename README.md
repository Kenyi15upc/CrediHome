# CrediHome - Sistema de Crédito MiVivienda

Sistema web para gestión de créditos hipotecarios MiVivienda desde la perspectiva de una empresa inmobiliaria.

## 📋 Descripción

CrediHome es una aplicación web que permite a una empresa inmobiliaria gestionar clientes, unidades inmobiliarias y simulaciones de crédito hipotecario utilizando el método francés. El sistema calcula automáticamente VAN, TIR, TCEA y genera planes de pago completos.

## 🎯 Características Principales

- ✅ Sistema de autenticación con JWT
- ✅ 3 roles de usuario: Cliente, Asesor, Administrador
- ✅ Registro y gestión de clientes (datos socioeconómicos)
- ✅ Registro y gestión de unidades inmobiliarias
- ✅ Simulación de créditos hipotecarios (método francés)
- ✅ Cálculo de VAN, TIR y TCEA
- ✅ Períodos de gracia total y parcial
- ✅ Auditoría completa de operaciones
- ✅ Soporte para Soles y Dólares
- ✅ Tasas efectivas y nominales

## 🏗️ Stack Tecnológico

### Frontend
- **Angular 18** - Framework principal
- **TypeScript** - Lenguaje de programación
- **Bootstrap 5** - Diseño responsivo
- **Bootstrap Icons** - Iconografía

### Backend
- **Node.js** - Entorno de ejecución
- **Express** - Framework web
- **TypeScript** - Lenguaje de programación
- **Prisma ORM** - Acceso a base de datos
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **bcrypt** - Encriptación de contraseñas

## 📁 Estructura del Proyecto

```
CrediHome/
├── src/
│   ├── app/
│   │   ├── backend/                  # Backend (Node + Express)
│   │   │   ├── config/              # Configuración y seeds
│   │   │   ├── database/            # Schema Prisma y migraciones
│   │   │   ├── server/              # Servidor Express
│   │   │   └── utils/               # Utilidades (cálculos financieros)
│   │   ├── components/              # Componentes de UI
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── navbar/
│   │   ├── pages/                   # Páginas/Dashboards
│   │   │   ├── admin-dashboard/
│   │   │   ├── asesor-dashboard/
│   │   │   └── cliente-dashboard/
│   │   ├── services/                # Servicios Angular
│   │   ├── guards/                  # Guards de rutas
│   │   ├── interceptors/            # HTTP Interceptors
│   │   └── models/                  # Interfaces TypeScript
│   └── ...
├── package.json
└── README.md
```

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tuusuario/CrediHome.git
cd CrediHome
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Base de Datos

Crear archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/credihome_db"
JWT_SECRET="tu_clave_secreta_super_segura_cambiar_en_produccion"
JWT_EXPIRATION="24h"
PORT=8080
NODE_ENV=development
```

Crear la base de datos:

```bash
createdb credihome_db
```

### 4. Ejecutar Migraciones

```bash
npx prisma migrate dev --schema=./src/app/backend/database/schema.prisma
```

### 5. Generar Cliente Prisma

```bash
npx prisma generate --schema=./src/app/backend/database/schema.prisma
```

### 6. Ejecutar Seed (Datos Iniciales)

```bash
npx ts-node --esm src/app/backend/config/seed.ts
```

Esto creará:
- ✅ Roles: CLIENTE (ID: 10), ASESOR (ID: 20), ADMINISTRADOR (ID: 30)
- ✅ Configuración del sistema
- ✅ 18 entidades financieras autorizadas

## 🎮 Ejecutar el Proyecto

### Modo Desarrollo

**Terminal 1 - Backend:**
```bash
npm run backend
```

**Terminal 2 - Frontend:**
```bash
npm start
```

El frontend estará disponible en: `http://localhost:4200`
El backend estará disponible en: `http://localhost:8080`

### Modo Producción

```bash
npm run build
```

## 👥 Roles y Permisos

### 🔵 CLIENTE
- Ver su perfil de usuario (editable)
- Ver sus datos socioeconómicos (solo lectura)
- Ver sus simulaciones de crédito

### 🟢 ASESOR
- Todas las funciones del Cliente
- Registrar clientes (con datos socioeconómicos)
- Registrar unidades inmobiliarias
- Crear simulaciones de crédito (asociando cliente + unidad)
- Ver planes de pago, VAN, TIR, TCEA

### 🔴 ADMINISTRADOR
- Todas las funciones del Asesor
- Configurar sistema (moneda, tasa, capitalización)
- Gestionar entidades financieras
- Crear usuarios (asesores)
- Ver dashboard administrativo

## 🧪 Usuarios de Prueba

Después de ejecutar el seed, puedes crear usuarios de prueba:

### Registrar un Asesor:
1. Ir a `http://localhost:4200/register`
2. Usuario: `asesor1`
3. Nombre: `María`
4. Apellidos: `López`
5. Email: `asesor@credihome.com`
6. Tipo de Usuario: **Asesor Inmobiliario**
7. Contraseña: `12345678`

### Registrar un Cliente:
1. Ir a `http://localhost:4200/register`
2. Usuario: `cliente1`
3. Nombre: `Juan`
4. Apellidos: `Pérez`
5. Email: `cliente@example.com`
6. Tipo de Usuario: **Cliente**
7. Contraseña: `12345678`

## 📊 Flujo de Trabajo

### Proceso Completo (Asesor)

1. **Registrar Cliente**
   - Tab "Clientes" → Registrar Nuevo Cliente
   - Completar datos socioeconómicos (DNI, ingresos, gastos, etc.)

2. **Registrar Unidad Inmobiliaria**
   - Tab "Unidades" → Registrar Nueva Unidad
   - Completar datos (nombre, dirección, precio, etc.)

3. **Crear Simulación**
   - Tab "Clientes" → Click en cliente → Cliente seleccionado ✅
   - Tab "Unidades" → Click en unidad → Unidad seleccionada ✅
   - Tab "Simulaciones" → Completar parámetros del crédito
   - Sistema calcula: Plan de Pagos, VAN, TIR, TCEA

### Proceso Completo (Cliente)

1. **Iniciar Sesión**
2. **Ver Perfil** - Actualizar email, cambiar contraseña
3. **Ver Datos** - Consultar información socioeconómica
4. **Ver Simulaciones** - Ver simulaciones creadas por el asesor

## 🧮 Cálculos Financieros

### Método Francés
Sistema de amortización con cuotas constantes durante todo el período.

### VAN (Valor Actual Neto)
Valor presente de los flujos de caja futuros.

### TIR (Tasa Interna de Retorno)
Tasa de descuento que hace el VAN = 0.

### TCEA (Tasa de Costo Efectivo Anual)
Incluye todos los costos del crédito (tasas, seguros, portes).

### Períodos de Gracia
- **Gracia Total**: No se paga capital ni intereses
- **Gracia Parcial**: Solo se pagan intereses

## 🗃️ Base de Datos

### Tablas Principales

- **users** - Usuarios del sistema
- **roles** - Roles (CLIENTE, ASESOR, ADMINISTRADOR)
- **user_roles** - Relación usuario-rol
- **clientes** - Información socioeconómica de clientes
- **asesores** - Información de asesores
- **unidades_inmobiliarias** - Propiedades disponibles
- **creditos** - Simulaciones de crédito
- **audit_logs** - Auditoría de operaciones
- **configuracion_sistema** - Configuración global
- **entidades_financieras** - Bancos autorizados

### Diagrama de Relaciones

```
┌──────────┐       ┌─────────────┐       ┌────────────────────┐
│  User    │──────▶│  UserRole   │◀──────│      Role          │
└──────────┘       └─────────────┘       └────────────────────┘
     │
     ├──────────▶ ┌──────────┐
     │            │ Cliente  │
     │            └──────────┘
     │                 │
     ├──────────▶ ┌──────────┐     ┌────────────────────┐
     │            │  Asesor  │     │ UnidadInmobiliaria │
     │            └──────────┘     └────────────────────┘
     │                                      │
     └──────────▶ ┌──────────┐             │
                  │AuditLog  │             │
                  └──────────┘             │
                                           │
                  ┌──────────┐             │
                  │ Credito  │◀────────────┘
                  └──────────┘
                       │
                       │ (cliente_id, unidad_id)
```

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt (salt rounds: 10)
- ✅ Autenticación JWT
- ✅ Guards de rutas (AuthGuard, RoleGuard)
- ✅ HTTP Interceptor para tokens
- ✅ Validación de inputs
- ✅ CORS configurado
- ✅ Auditoría completa de operaciones

## 📝 Scripts Disponibles

```json
{
  "start": "ng serve",                    // Frontend en desarrollo
  "backend": "ts-node-dev ...",           // Backend en desarrollo
  "build": "ng build",                    // Build de producción
  "prisma:generate": "npx prisma generate",
  "prisma:migrate": "npx prisma migrate dev",
  "seed": "npx ts-node --esm src/app/backend/config/seed.ts"
}
```

## 🐛 Troubleshooting

### Error: Puerto 8080 en uso
```bash
lsof -ti:8080 | xargs kill -9
```

### Error: Base de datos no existe
```bash
createdb credihome_db
npx prisma migrate dev --schema=./src/app/backend/database/schema.prisma
```

### Error: Cliente Prisma no generado
```bash
npx prisma generate --schema=./src/app/backend/database/schema.prisma
```

### Error: Roles no existen
```bash
npx ts-node --esm src/app/backend/config/seed.ts
```

## 📚 Documentación Adicional

- [Prisma Docs](https://www.prisma.io/docs)
- [Angular Docs](https://angular.io/docs)
- [Express Docs](https://expressjs.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## 👨‍💻 Autor

Jefferson Castro

## 📄 Licencia

Este proyecto es parte de un trabajo académico universitario.

## 🙏 Agradecimientos

- Fondo MiVivienda - Por la información sobre créditos hipotecarios
- Universidad - Por el apoyo académico

---

**Última actualización:** Noviembre 2025

