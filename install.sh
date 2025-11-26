#!/bin/bash

# Script de instalación automática para CrediHome
# Proyecto Académico ABET - Semana 15

echo "🏦 CrediHome - Instalación Automática"
echo "======================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "Por favor instala Node.js desde: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) detectado${NC}"

# Verificar si PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL no detectado${NC}"
    echo "Instalando PostgreSQL con Homebrew..."
    brew install postgresql@16
    brew services start postgresql@16
fi

echo -e "${GREEN}✅ PostgreSQL detectado${NC}"

# Crear base de datos si no existe
echo ""
echo "📊 Creando base de datos..."
createdb credihome_db 2>/dev/null || echo -e "${YELLOW}⚠️  Base de datos 'credihome_db' ya existe${NC}"

# Instalar dependencias del BACKEND
echo ""
echo "📦 Instalando dependencias del backend..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error instalando dependencias del backend${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencias del backend instaladas${NC}"

# Generar cliente Prisma
echo ""
echo "🔧 Generando cliente Prisma..."
npm run prisma:generate

# Ejecutar migraciones
echo ""
echo "🗄️  Ejecutando migraciones de base de datos..."
npm run prisma:migrate

# Cargar datos iniciales
echo ""
echo "🌱 Cargando datos iniciales (seed)..."
npm run db:seed

echo -e "${GREEN}✅ Backend configurado exitosamente${NC}"

# Volver a la raíz
cd ..

# Instalar dependencias del FRONTEND
echo ""
echo "📦 Instalando dependencias del frontend..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error instalando dependencias del frontend${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencias del frontend instaladas${NC}"

# Resumen final
echo ""
echo "======================================"
echo -e "${GREEN}🎉 ¡Instalación completada exitosamente!${NC}"
echo "======================================"
echo ""
echo "📋 Usuarios de prueba creados:"
echo "   👤 Cliente: cliente1 / cliente123"
echo "   👔 Asesor:  asesor1 / asesor123"
echo ""
echo "🚀 Para iniciar el proyecto:"
echo ""
echo "   1. En una terminal, iniciar el BACKEND:"
echo "      cd backend"
echo "      npm run dev"
echo ""
echo "   2. En OTRA terminal, iniciar el FRONTEND:"
echo "      npm start"
echo ""
echo "   3. Abrir el navegador en: http://localhost:4200"
echo ""
echo "📊 Para ver la base de datos (Prisma Studio):"
echo "      cd backend"
echo "      npm run prisma:studio"
echo ""
echo "======================================"

