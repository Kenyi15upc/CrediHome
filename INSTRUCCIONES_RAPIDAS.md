# 🚀 INSTRUCCIONES RÁPIDAS - INICIAR CREDIHOME

## ⚡ MÉTODO FÁCIL (RECOMENDADO)

### 1. Ejecuta el script de inicio:

```bash
cd /Users/jeffersoncastro/Documents/GitHub/Finanzas/CrediHome
./iniciar.sh
```

**Esto hará:**
- ✅ Detener procesos anteriores
- ✅ Verificar PostgreSQL
- ✅ Verificar base de datos
- ✅ Generar cliente Prisma
- ✅ Iniciar backend (puerto 8080)
- ✅ Iniciar frontend (puerto 4200)

**Para detener:** Presiona `Ctrl+C`

---

## 🔧 MÉTODO MANUAL (Si el script no funciona)

### Paso 1: Detener procesos anteriores

```bash
cd /Users/jeffersoncastro/Documents/GitHub/Finanzas/CrediHome
lsof -ti:4200 -ti:8080 | xargs kill -9 2>/dev/null
```

### Paso 2: Verificar PostgreSQL

```bash
# Ver si está corriendo
pg_isready -h localhost -p 5432

# Si no está corriendo, iniciarlo:
brew services start postgresql@16
# O si usas Postgres.app, ábrelo desde Aplicaciones
```

### Paso 3: Verificar base de datos

```bash
# Ver si existe
psql -U postgres -l | grep credihome_db

# Si no existe, crearla:
createdb credihome_db

# Aplicar migraciones
npx prisma migrate dev --schema=./src/app/backend/database/schema.prisma
```

### Paso 4: Generar cliente Prisma

```bash
npx prisma generate --schema=./src/app/backend/database/schema.prisma
```

### Paso 5: Iniciar Backend (Terminal 1)

```bash
cd /Users/jeffersoncastro/Documents/GitHub/Finanzas/CrediHome
npm run backend
```

**Espera a ver:**
```
✅ Conectado a PostgreSQL (credihome_db)
🚀 Servidor corriendo en http://localhost:8080
```

### Paso 6: Iniciar Frontend (Terminal 2)

```bash
cd /Users/jeffersoncastro/Documents/GitHub/Finanzas/CrediHome
npm start
```

**Espera a ver:**
```
✔ Browser application bundle generation complete.
Local: http://localhost:4200/
```

---

## 🌐 LIMPIAR CACHÉ DEL NAVEGADOR

### Chrome/Edge:

**Opción 1 - Rápida:**
```
Mac: Cmd + Shift + R
Windows: Ctrl + Shift + R
```

**Opción 2 - Completa:**
```
1. Cmd + Shift + Delete (Mac) o Ctrl + Shift + Delete (Windows)
2. Seleccionar "Caché de imágenes y archivos"
3. Rango: "Todo"
4. Click "Borrar datos"
```

**Opción 3 - Modo Incógnito (RECOMENDADO):**
```
Cmd + Shift + N (Mac) o Ctrl + Shift + N (Windows)
```

---

## ✅ VERIFICAR QUE FUNCIONA

### 1. Abrir navegador (modo incógnito)

```
http://localhost:4200
```

### 2. Login como CLIENTE

```
Usuario: cliente1
Password: 12345678
```

### 3. Verificar tabs (DEBE haber 3):

```
✅ Mi Perfil de Usuario
✅ Mis Datos Socioeconómicos
✅ Mis Simulaciones

❌ NO debe haber "Simulador de Crédito"
❌ NO debe mostrar "Resultado de la Simulación"
```

### 4. Login como ASESOR

```
Usuario: asesor1
Password: 12345678
```

### 5. Verificar tabs (DEBE haber 4):

```
✅ Mi Perfil
✅ Clientes
✅ Unidades
✅ Simulaciones  ← AQUÍ está el simulador
```

### 6. Probar moneda dinámica:

```
1. Tab "Simulaciones"
2. Seleccionar cliente y unidad
3. Cambiar moneda de "Soles" a "Dólares"
4. VERIFICAR que cambie:
   S/ 5,000.00 → $ 5,000.00 ✅
```

---

## 🐛 SI HAY PROBLEMAS

### Problema: "Puerto 4200 en uso"

```bash
lsof -ti:4200 | xargs kill -9
```

### Problema: "Puerto 8080 en uso"

```bash
lsof -ti:8080 | xargs kill -9
```

### Problema: "Cannot find module"

```bash
npm install
npx prisma generate --schema=./src/app/backend/database/schema.prisma
```

### Problema: "Sigo viendo el simulador en cliente"

```
1. Detener npm start
2. Cerrar TODAS las pestañas de localhost:4200
3. Cerrar navegador completamente
4. rm -rf .angular dist
5. npm start
6. Abrir navegador en INCÓGNITO
7. Ir a localhost:4200
```

---

## 📋 CHECKLIST ANTES DE PRESENTAR

- [ ] Backend corriendo (puerto 8080)
- [ ] Frontend corriendo (puerto 4200)
- [ ] Cliente NO tiene simulador
- [ ] Asesor SÍ tiene simulador
- [ ] Moneda dinámica funciona ($ aparece al seleccionar Dólares)
- [ ] Base de datos tiene datos (roles, entidades financieras)

---

## 🎬 COMANDOS ÚTILES

### Ver procesos corriendo:

```bash
lsof -i:4200
lsof -i:8080
```

### Verificar que Backend responde:

```bash
curl http://localhost:8080/api/health
```

### Verificar base de datos:

```bash
psql -U postgres -d credihome_db -c "SELECT * FROM roles;"
```

### Recompilar todo:

```bash
npm run build
```

---

**¡Listo! Con esto puedes reiniciar el proyecto limpiamente.** ✅

