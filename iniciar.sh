#!/bin/bash

echo "🚀 Iniciando CrediHome..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Detener procesos anteriores
echo "🛑 Deteniendo procesos anteriores..."
lsof -ti:4200 -ti:8080 | xargs kill -9 2>/dev/null
sleep 1

# Verificar que PostgreSQL esté corriendo
echo ""
echo "🔍 Verificando PostgreSQL..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL no está corriendo${NC}"
    echo "Inicia PostgreSQL con: brew services start postgresql@16"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL está corriendo${NC}"

# Verificar base de datos
echo ""
echo "🔍 Verificando base de datos..."
if ! psql -U postgres -lqt | cut -d \| -f 1 | grep -qw credihome_db; then
    echo -e "${RED}❌ Base de datos 'credihome_db' no existe${NC}"
    echo "Créala con: createdb credihome_db"
    exit 1
fi
echo -e "${GREEN}✅ Base de datos existe${NC}"

# Generar cliente Prisma
echo ""
echo "🔧 Generando cliente Prisma..."
npx prisma generate --schema=./src/app/backend/database/schema.prisma > /dev/null 2>&1
echo -e "${GREEN}✅ Cliente Prisma generado${NC}"

# Iniciar backend en background
echo ""
echo -e "${BLUE}🚀 Iniciando Backend en puerto 8080...${NC}"
npm run backend > backend.log 2>&1 &
BACKEND_PID=$!

# Esperar a que el backend esté listo
echo "⏳ Esperando que el backend inicie..."
for i in {1..30}; do
    if lsof -i:8080 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend corriendo en http://localhost:8080${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend no pudo iniciar. Ver backend.log para detalles${NC}"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
done

# Iniciar frontend
echo ""
echo -e "${BLUE}🌐 Iniciando Frontend en puerto 4200...${NC}"
echo ""
npm run dev

# Cleanup al cerrar
trap "echo ''; echo '🛑 Deteniendo servidores...'; kill $BACKEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

