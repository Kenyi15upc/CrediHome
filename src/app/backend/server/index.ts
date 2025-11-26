import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8080', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

const app: Application = express();
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'CrediHome API',
    version: '1.0.0',
    status: 'running'
  });
});

// Endpoint de autenticación (login)
app.post('/CrediHome/authenticate', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username y password son requeridos'
      });
    }

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    if (!user.enabled) {
      return res.status(401).json({
        message: 'Usuario deshabilitado'
      });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    // Obtener los roles del usuario
    const roles = user.roles.map(ur => ur.role.name);

    // Generar JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_cambiala_en_produccion_2024';
    const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

    const payload = {
      sub: user.id.toString(),
      username: user.username,
      roles: roles
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION } as jwt.SignOptions);

    console.log(`✅ Usuario autenticado: ${user.username} (Roles: ${roles.join(', ')})`);

    res.status(200).json({
      jwt: token,
      username: user.username,
      roles: roles
    });
  } catch (error: any) {
    console.error('❌ Error en autenticación:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.post('/api/user', async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username y password son requeridos'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        message: 'El username debe tener al menos 3 caracteres'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          ...(email ? [{ email }] : [])
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'El usuario o email ya existe'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email: email || null,
        enabled: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        enabled: true,
        createdAt: true
      }
    });

    console.log('✅ Usuario creado en PostgreSQL:', newUser.username);
    res.status(201).json(newUser);
  } catch (error: any) {
    console.error('❌ Error al crear usuario:', error);

    // Manejar errores específicos de conexión
    if (error.code === 'P1001' || error.message?.includes('Can\'t reach database')) {
      return res.status(503).json({
        message: 'No se puede conectar a la base de datos. Verifica que PostgreSQL esté corriendo.'
      });
    }

    if (error.code === 'P1003' || error.message?.includes('does not exist')) {
      return res.status(503).json({
        message: 'La base de datos no existe. Ejecuta: npm run prisma:migrate'
      });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'El usuario o email ya existe'
      });
    }

    res.status(500).json({
      message: 'Error al crear usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.post('/api/save/:userId/:roleId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const roleId = parseInt(req.params.roleId);

    if (isNaN(userId) || isNaN(roleId)) {
      return res.status(400).json({
        message: 'userId y roleId deben ser números válidos'
      });
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que el rol existe
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return res.status(404).json({
        message: `Rol con ID ${roleId} no encontrado. Roles disponibles: 10 (CLIENTE), 20 (ASESOR)`
      });
    }

    // Verificar si ya tiene el rol asignado
    const existingRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    if (existingRole) {
      return res.status(200).json({
        message: 'El rol ya estaba asignado',
        userId,
        roleId
      });
    }

    // Asignar el rol
    await prisma.userRole.create({
      data: {
        userId,
        roleId
      }
    });

    console.log(`✅ Rol ${role.name} (${roleId}) asignado al usuario ${user.username} (${userId})`);

    res.status(200).json({
      message: 'Rol asignado exitosamente',
      userId,
      roleId,
      roleName: role.name
    });
  } catch (error: any) {
    console.error('❌ Error al asignar rol:', error);

    // Manejar error de clave foránea
    if (error.code === 'P2003') {
      return res.status(400).json({
        message: 'El rol especificado no existe. Ejecuta: npm run db:seed'
      });
    }

    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== CRUD CLIENTES ====================
// Los endpoints de clientes están en la sección "ENDPOINTS DE CLIENTES" más abajo
// usando la ruta /api/clientes

// ==================== CRUD UNIDADES INMOBILIARIAS ====================

// GET /CrediHome/unidades - Obtener todas las unidades inmobiliarias
app.get('/CrediHome/unidades', async (req: Request, res: Response) => {
  try {
    const unidades = await prisma.unidadInmobiliaria.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json(unidades);
  } catch (error: any) {
    console.error('❌ Error al obtener unidades:', error);
    res.status(500).json({
      message: 'Error al obtener unidades inmobiliarias',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /CrediHome/unidades/:id - Obtener una unidad por ID
app.get('/CrediHome/unidades/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const unidad = await prisma.unidadInmobiliaria.findUnique({
      where: { idUnidad: id }
    });

    if (!unidad) {
      return res.status(404).json({ message: 'Unidad inmobiliaria no encontrada' });
    }

    res.status(200).json(unidad);
  } catch (error: any) {
    console.error('❌ Error al obtener unidad:', error);
    res.status(500).json({
      message: 'Error al obtener unidad inmobiliaria',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /CrediHome/unidades - Crear una nueva unidad inmobiliaria
app.post('/CrediHome/unidades', async (req: Request, res: Response) => {
  try {
    const { tipo, precio, descripcion, direccion } = req.body;

    if (!tipo || !precio) {
      return res.status(400).json({ message: 'tipo y precio son requeridos' });
    }

    const unidad = await prisma.unidadInmobiliaria.create({
      data: {
        tipo,
        precio: parseFloat(precio),
        descripcion,
        direccion
      }
    });

    console.log('✅ Unidad inmobiliaria creada:', unidad.tipo);
    res.status(201).json(unidad);
  } catch (error: any) {
    console.error('❌ Error al crear unidad:', error);
    res.status(500).json({
      message: 'Error al crear unidad inmobiliaria',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /CrediHome/unidades/:id - Actualizar una unidad inmobiliaria
app.put('/CrediHome/unidades/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { tipo, precio, descripcion, direccion } = req.body;

    const unidad = await prisma.unidadInmobiliaria.update({
      where: { idUnidad: id },
      data: {
        tipo,
        precio: precio ? parseFloat(precio) : undefined,
        descripcion,
        direccion
      }
    });

    console.log('✅ Unidad inmobiliaria actualizada:', unidad.tipo);
    res.status(200).json(unidad);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Unidad inmobiliaria no encontrada' });
    }
    console.error('❌ Error al actualizar unidad:', error);
    res.status(500).json({
      message: 'Error al actualizar unidad inmobiliaria',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /CrediHome/unidades/:id - Eliminar una unidad inmobiliaria
app.delete('/CrediHome/unidades/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.unidadInmobiliaria.delete({
      where: { idUnidad: id }
    });

    console.log('✅ Unidad inmobiliaria eliminada:', id);
    res.status(200).json({ message: 'Unidad inmobiliaria eliminada exitosamente' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Unidad inmobiliaria no encontrada' });
    }
    console.error('❌ Error al eliminar unidad:', error);
    res.status(500).json({
      message: 'Error al eliminar unidad inmobiliaria',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== CRÉDITOS ====================
// TODO: Implementar endpoints de créditos después de actualizar el schema
// Los endpoints requeridos son:
// - POST /CrediHome/credito - Crear crédito
// - GET /CrediHome/creditos - Listar créditos
// - GET /CrediHome/credito/:id - Obtener crédito por ID
// - PUT /CrediHome/credito/:id - Actualizar crédito
// - POST /CrediHome/:id/plan - Generar plan de pagos (requiere calcularPlanPagosFrances)
// - POST /CrediHome/:id/indicadores - Calcular indicadores (requiere calcularVAN, TIR, TCEA)
// ==================== FIN CRÉDITOS ====================

// ==================== ENDPOINTS DE CLIENTES ====================

// GET: Obtener cliente por user ID
app.get('/api/clientes/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'userId debe ser un número válido' });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { userId }
    });

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.status(200).json(cliente);
  } catch (error: any) {
    console.error('❌ Error al obtener cliente:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST: Crear cliente
app.post('/api/clientes', async (req: Request, res: Response) => {
  try {
    const { userId, dni, nombre, apellidos, telefono, direccion, email, ingresoMensual } = req.body;

    if (!userId || !dni || !nombre) {
      return res.status(400).json({ message: 'userId, dni y nombre son requeridos' });
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que no exista ya un cliente para este usuario
    const existingCliente = await prisma.cliente.findUnique({
      where: { userId: parseInt(userId) }
    });

    if (existingCliente) {
      return res.status(409).json({ message: 'Ya existe un cliente para este usuario' });
    }

    const nuevoCliente = await prisma.cliente.create({
      data: {
        userId: parseInt(userId),
        dni,
        nombre,
        apellidos,
        telefono,
        direccion,
        email,
        ingresoMensual: ingresoMensual ? parseFloat(ingresoMensual) : null
      }
    });

    console.log(`✅ Cliente creado: ${nuevoCliente.nombre} ${nuevoCliente.apellidos}`);
    res.status(201).json(nuevoCliente);
  } catch (error: any) {
    console.error('❌ Error al crear cliente:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT: Actualizar cliente
app.put('/api/clientes/:id', async (req: Request, res: Response) => {
  try {
    const clienteId = parseInt(req.params.id);
    const { dni, nombre, apellidos, telefono, direccion, email, ingresoMensual } = req.body;

    if (isNaN(clienteId)) {
      return res.status(400).json({ message: 'ID de cliente inválido' });
    }

    const clienteActualizado = await prisma.cliente.update({
      where: { idCliente: clienteId },
      data: {
        dni,
        nombre,
        apellidos,
        telefono,
        direccion,
        email,
        ingresoMensual: ingresoMensual ? parseFloat(ingresoMensual) : null
      }
    });

    console.log(`✅ Cliente actualizado: ${clienteActualizado.nombre} ${clienteActualizado.apellidos}`);
    res.status(200).json(clienteActualizado);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    console.error('❌ Error al actualizar cliente:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET: Listar todos los clientes
app.get('/api/clientes', async (req: Request, res: Response) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        user: {
          select: {
            username: true,
            enabled: true
          }
        }
      }
    });

    res.status(200).json(clientes);
  } catch (error: any) {
    console.error('❌ Error al listar clientes:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== FIN ENDPOINTS CLIENTES ====================

process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando conexión a PostgreSQL...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// ==================== ENDPOINTS DE CLIENTES ====================

// GET: Obtener cliente por user ID
app.get('/api/clientes/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'userId debe ser un número válido' });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { userId }
    });

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.status(200).json(cliente);
  } catch (error: any) {
    console.error('❌ Error al obtener cliente:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST: Crear cliente
app.post('/api/clientes', async (req: Request, res: Response) => {
  try {
    const { userId, dni, nombre, apellidos, telefono, direccion, email, ingresoMensual } = req.body;

    if (!userId || !dni || !nombre) {
      return res.status(400).json({ message: 'userId, dni y nombre son requeridos' });
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que no exista ya un cliente para este usuario
    const existingCliente = await prisma.cliente.findUnique({
      where: { userId: parseInt(userId) }
    });

    if (existingCliente) {
      return res.status(409).json({ message: 'Ya existe un cliente para este usuario' });
    }

    const nuevoCliente = await prisma.cliente.create({
      data: {
        userId: parseInt(userId),
        dni,
        nombre,
        apellidos,
        telefono,
        direccion,
        email,
        ingresoMensual: ingresoMensual ? parseFloat(ingresoMensual) : null
      }
    });

    console.log(`✅ Cliente creado: ${nuevoCliente.nombre} ${nuevoCliente.apellidos || ''}`);
    res.status(201).json(nuevoCliente);
  } catch (error: any) {
    console.error('❌ Error al crear cliente:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT: Actualizar cliente
app.put('/api/clientes/:id', async (req: Request, res: Response) => {
  try {
    const clienteId = parseInt(req.params.id);
    const { dni, nombre, apellidos, telefono, direccion, email, ingresoMensual } = req.body;

    if (isNaN(clienteId)) {
      return res.status(400).json({ message: 'ID de cliente inválido' });
    }

    const clienteActualizado = await prisma.cliente.update({
      where: { idCliente: clienteId },
      data: {
        dni,
        nombre,
        apellidos,
        telefono,
        direccion,
        email,
        ingresoMensual: ingresoMensual ? parseFloat(ingresoMensual) : null
      }
    });

    console.log(`✅ Cliente actualizado: ${clienteActualizado.nombre} ${clienteActualizado.apellidos || ''}`);
    res.status(200).json(clienteActualizado);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    console.error('❌ Error al actualizar cliente:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET: Listar todos los clientes
app.get('/api/clientes', async (req: Request, res: Response) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        user: {
          select: {
            username: true,
            enabled: true
          }
        }
      }
    });

    res.status(200).json(clientes);
  } catch (error: any) {
    console.error('❌ Error al listar clientes:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== FIN ENDPOINTS CLIENTES ====================

async function startServer() {
  try {
    // Conectar a la base de datos
    await prisma.$connect();
    console.log('✅ Conectado a PostgreSQL');

    // Verificar conexión con una consulta simple
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Verificación de conexión exitosa');

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║   CrediHome API - Backend Iniciado             ║
║   Puerto: ${PORT}                                ║
║   Frontend: ${FRONTEND_URL}                     ║
║   Base de Datos: PostgreSQL (credihome_db)     ║
╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error: any) {
    console.error('❌ Error al conectar con PostgreSQL:', error.message);

    if (error.message?.includes('P1001') || error.message?.includes('Can\'t reach database')) {
      console.error('\n📋 El servidor PostgreSQL no está accesible.');
      console.error('   Verifica que PostgreSQL esté corriendo:');
      console.error('   brew services start postgresql@16');
    } else if (error.message?.includes('P1003') || error.message?.includes('does not exist')) {
      console.error('\n📋 La base de datos no existe.');
      console.error('   Crea la base de datos: createdb credihome_db');
    } else if (error.message?.includes('P1000') || error.message?.includes('Authentication failed')) {
      console.error('\n📋 Error de autenticación.');
      console.error('   Verifica la contraseña en DATABASE_URL del archivo .env');
    } else if (error.message?.includes('PrismaClient') || error.message?.includes('Cannot find module')) {
      console.error('\n📋 Cliente Prisma no generado.');
      console.error('   Ejecuta: npm run prisma:generate');
    } else {
      console.error('\n📋 Verifica la configuración de la base de datos en el archivo .env');
    }

    process.exit(1);
  }
}

startServer();

export default app;

