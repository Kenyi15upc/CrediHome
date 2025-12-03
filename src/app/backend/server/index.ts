import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { calcularIndicadores, generarPlanPagos } from '../utils/finance';

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

app.post('/api/authenticate', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username y password son requeridos'
      });
    }

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

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    const roles = user.roles.map(ur => ur.role.name);

    const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_cambiala_en_produccion_2024';
    const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

    const payload = {
      sub: user.id.toString(),
      username: user.username,
      roles: roles
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION } as jwt.SignOptions);

    res.status(200).json({
      jwt: token,
      username: user.username,
      roles: roles
    });
  } catch (error: any) {
    console.error('Error en autenticación:', error);
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
        nombre: req.body.nombre || null,
        apellidos: req.body.apellidos || null,
        password: hashedPassword,
        email: email || null,
        enabled: true
      },
      select: {
        id: true,
        username: true,
        nombre: true,
        apellidos: true,
        email: true,
        enabled: true,
        createdAt: true
      }
    });

    console.log('Usuario creado:', newUser.username);
    res.status(201).json(newUser);
  } catch (error: any) {
    console.error('Error al crear usuario:', error);

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

app.get('/api/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'userId debe ser un número válido' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nombre: true,
        apellidos: true,
        email: true,
        enabled: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json(user);
  } catch (error: any) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.put('/api/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { nombre, apellidos, email, password } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ message: 'userId debe ser un número válido' });
    }

    const updateData: any = {};

    if (nombre !== undefined) updateData.nombre = nombre;
    if (apellidos !== undefined) updateData.apellidos = apellidos;
    if (email !== undefined) updateData.email = email || null;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        nombre: true,
        apellidos: true,
        email: true,
        enabled: true,
        updatedAt: true
      }
    });

    console.log('Usuario actualizado:', updatedUser.username);
    res.status(200).json(updatedUser);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== ENTIDADES FINANCIERAS ====================
app.get('/api/entidades', async (req: Request, res: Response) => {
  try {
    const entidades = await prisma.entidadFinanciera.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' }
    });
    res.status(200).json(entidades);
  } catch (error: any) {
    console.error('❌ Error al obtener entidades financieras:', error);
    res.status(500).json({
      message: 'Error al obtener entidades financieras',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== CRUD UNIDADES INMOBILIARIAS ====================

app.get('/api/unidades', async (req: Request, res: Response) => {
  try {
    const unidades = await prisma.unidadInmobiliaria.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Mapear al formato esperado por el frontend
    const response = unidades.map(u => ({
      idUnidad: u.idUnidad,
      nombre: u.tipo,
      tipo: u.tipo,
      precio: u.precio,
      descripcion: u.descripcion,
      direccion: u.direccion,
      moneda: 'SOLES', // Por defecto, ya que no está en la BD
      estadoU: true, // Por defecto, ya que no está en la BD
      fechaRegistro: u.createdAt.toISOString()
    }));

    res.status(200).json(response);
  } catch (error: any) {
    console.error('❌ Error al obtener unidades:', error);
    res.status(500).json({
      message: 'Error al obtener unidades inmobiliarias',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/unidades/:id', async (req: Request, res: Response) => {
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

app.post('/api/unidades', async (req: Request, res: Response) => {
  try {
    const { nombre, tipo, precio, descripcion, direccion, moneda, estadoU } = req.body;
    const tipoUnidad = tipo || nombre;

    if (!tipoUnidad || !precio) {
      return res.status(400).json({ message: 'nombre/tipo y precio son requeridos' });
    }

    const unidad = await prisma.unidadInmobiliaria.create({
      data: {
        tipo: tipoUnidad,
        precio: parseFloat(precio),
        descripcion: descripcion || null,
        direccion: direccion || null
      }
    });

    const response = {
      idUnidad: unidad.idUnidad,
      nombre: unidad.tipo,
      tipo: unidad.tipo,
      precio: unidad.precio,
      descripcion: unidad.descripcion,
      direccion: unidad.direccion,
      moneda: moneda || 'SOLES',
      estadoU: estadoU !== undefined ? estadoU : true,
      fechaRegistro: unidad.createdAt.toISOString()
    };

    console.log('✅ Unidad inmobiliaria creada:', unidad.tipo);
    res.status(201).json(response);
  } catch (error: any) {
    console.error('❌ Error al crear unidad:', error);
    res.status(500).json({
      message: 'Error al crear unidad inmobiliaria',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.put('/api/unidades/:id', async (req: Request, res: Response) => {
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

app.delete('/api/unidades/:id', async (req: Request, res: Response) => {
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
app.post('/api/creditos', async (req: Request, res: Response) => {
  try {
    const {
      clienteId,
      unidadInmobiliariaId,
      entidadFinancieraCodigo,
      moneda,
      monto,
      plazo,
      tasaInteres,
      tipoTasa,
      capitalizacion,
      fechaDesembolso,
      graciaTotal,
      graciaParcial
    } = req.body;

    if (!clienteId || !monto || !plazo || !tasaInteres || !entidadFinancieraCodigo) {
      return res.status(400).json({ message: 'Faltan campos requeridos para crear el crédito.' });
    }

    const nuevoCredito = await prisma.credito.create({
      data: {
        clienteId: parseInt(clienteId),
        unidadInmobiliariaId: unidadInmobiliariaId ? parseInt(unidadInmobiliariaId) : null,
        entidadFinancieraCodigo,
        moneda,
        monto: parseFloat(monto),
        plazo: parseInt(plazo),
        tasaInteres: parseFloat(tasaInteres),
        tipoTasa,
        capitalizacion,
        fechaDesembolso,
        graciaTotal: parseInt(graciaTotal) || 0,
        graciaParcial: parseInt(graciaParcial) || 0
      }
    });

    console.log(`✅ Crédito creado con ID: ${nuevoCredito.idCredito}`);
    res.status(201).json(nuevoCredito);
  } catch (error: any) {
    console.error('❌ Error al crear el crédito:', error);
    if (error.code === 'P2003') {
      return res.status(404).json({
        message: `No se pudo crear el crédito. El cliente, la unidad o la entidad financiera no existen.`,
        field: error.meta?.field_name
      });
    }
    res.status(500).json({
      message: 'Error interno del servidor al crear el crédito.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.post('/api/creditos/:id/plan', async (req: Request, res: Response) => {
  try {
    const creditoId = parseInt(req.params.id);
    const { aplicarBono } = req.body;

    const credito = await prisma.credito.findUnique({
      where: { idCredito: creditoId },
      include: { entidadFinanciera: true }
    });

    if (!credito) {
      return res.status(404).json({ message: 'Crédito no encontrado' });
    }

    if (credito.graciaTotal > credito.entidadFinanciera.graciaTotalMaxima) {
      return res.status(400).json({ message: `El período de gracia total (${credito.graciaTotal}) excede el máximo de ${credito.entidadFinanciera.graciaTotalMaxima} meses permitido por ${credito.entidadFinanciera.nombre}.` });
    }
    if (credito.graciaParcial > credito.entidadFinanciera.graciaParcialMaxima) {
      return res.status(400).json({ message: `El período de gracia parcial (${credito.graciaParcial}) excede el máximo de ${credito.entidadFinanciera.graciaParcialMaxima} meses permitido por ${credito.entidadFinanciera.nombre}.` });
    }

    const creditoParaSimulacion = { ...credito };
    let bonoAplicadoInfo = { aplicado: false, monto: 0, mensaje: '' };
    const MONTO_BONO_TECHO_PROPIO = 43312.50;
    const INGRESO_MAXIMO_BONO = 3715.00;
    const PRECIO_MIN_MIVIVIENDA = 58800;
    const PRECIO_MAX_MIVIVIENDA = 419600;

    if (aplicarBono) {
      const cliente = await prisma.cliente.findUnique({ where: { idCliente: credito.clienteId } });
      const unidad = await prisma.unidadInmobiliaria.findUnique({ where: { idUnidad: credito.unidadInmobiliariaId! } });

      if (!cliente || !unidad) {
        return res.status(404).json({ message: 'No se encontró el cliente o la unidad inmobiliaria para el crédito.' });
      }

      const esIngresoValido = cliente.ingresoMensual && cliente.ingresoMensual <= INGRESO_MAXIMO_BONO;
      const esPrecioValido = unidad.precio >= PRECIO_MIN_MIVIVIENDA && unidad.precio <= PRECIO_MAX_MIVIVIENDA;

      if (esIngresoValido && esPrecioValido) {
        creditoParaSimulacion.monto -= MONTO_BONO_TECHO_PROPIO;
        bonoAplicadoInfo = { aplicado: true, monto: MONTO_BONO_TECHO_PROPIO, mensaje: 'Bono Techo Propio aplicado exitosamente.' };
      } else {
        let mensajeFallo = 'El bono no fue aplicado. Razones:';
        if (!esIngresoValido) {
          mensajeFallo += ` El ingreso mensual del cliente (S/ ${cliente.ingresoMensual}) excede el límite de S/ ${INGRESO_MAXIMO_BONO}.`;
        }
        if (!esPrecioValido) {
          mensajeFallo += ` El precio de la vivienda (S/ ${unidad.precio}) está fuera del rango permitido (S/ ${PRECIO_MIN_MIVIVIENDA} - S/ ${PRECIO_MAX_MIVIVIENDA}).`;
        }
        bonoAplicadoInfo.mensaje = mensajeFallo;
      }
    }

    const planPagosData = generarPlanPagos(creditoParaSimulacion);

    await prisma.planPago.deleteMany({ where: { creditoId } });
    await prisma.planPago.createMany({ data: planPagosData.map(p => ({ ...p, id: undefined })) });
    const planLeido = await prisma.planPago.findMany({ where: { creditoId }, orderBy: { numeroCuota: 'asc' } });

    const indicadoresData = calcularIndicadores(creditoParaSimulacion, planLeido);

    await prisma.indicadorFinanciero.deleteMany({ where: { creditoId } });
    const indicadorGuardado = await prisma.indicadorFinanciero.create({
      data: {
        creditoId: creditoId,
        van: indicadoresData.van,
        tir: indicadoresData.tir,
        tcea: indicadoresData.tcea,
        tasaCosto: indicadoresData.tasaCosto
      }
    });

    res.status(201).json({
      planDePagos: planLeido,
      indicadores: indicadorGuardado,
      bono: bonoAplicadoInfo
    });

  } catch (error: any) {
    console.error('❌ Error fatal al generar el plan de pagos:', error);
    res.status(500).json({
      message: 'Error interno del servidor al generar el plan de pagos.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// ==================== FIN CRÉDITOS ====================

// ==================== ENDPOINTS DE CLIENTES ====================

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
      return res.status(404).json({ message: 'Cliente no encontrado para este usuario' });
    }

    res.status(200).json(cliente);
  } catch (error: any) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.post('/api/clientes', async (req: Request, res: Response) => {
  try {
    const { userId, dni, nombre, apellidos, telefono, direccion, email, correo, ingresoMensual, gastoMensual, ocupacion } = req.body;

    if (!userId || !dni || !nombre) {
      return res.status(400).json({ message: 'userId, dni y nombre son requeridos' });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

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
        apellidos: apellidos || null,
        telefono: telefono || null,
        direccion: direccion || null,
        email: email || null,
        correo: correo || null,
        ingresoMensual: ingresoMensual ? parseFloat(ingresoMensual) : null,
        gastoMensual: gastoMensual ? parseFloat(gastoMensual) : null,
        ocupacion: ocupacion || null
      }
    });

    console.log(`Cliente creado: ${nuevoCliente.nombre} ${nuevoCliente.apellidos || ''}`);
    res.status(201).json(nuevoCliente);
  } catch (error: any) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.put('/api/clientes/:id', async (req: Request, res: Response) => {
  try {
    const clienteId = parseInt(req.params.id);
    const { dni, nombre, apellidos, telefono, direccion, email, correo, ingresoMensual, gastoMensual, ocupacion } = req.body;

    if (isNaN(clienteId)) {
      return res.status(400).json({ message: 'ID de cliente inválido' });
    }

    const clienteActualizado = await prisma.cliente.update({
      where: { idCliente: clienteId },
      data: {
        dni,
        nombre,
        apellidos: apellidos || null,
        telefono: telefono || null,
        direccion: direccion || null,
        email: email || null,
        correo: correo || null,
        ingresoMensual: ingresoMensual ? parseFloat(ingresoMensual) : null,
        gastoMensual: gastoMensual ? parseFloat(gastoMensual) : null,
        ocupacion: ocupacion || null
      }
    });

    console.log(`Cliente actualizado: ${clienteActualizado.nombre} ${clienteActualizado.apellidos || ''}`);
    res.status(200).json(clienteActualizado);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

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
    console.error('Error al listar clientes:', error);
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
      console.error('   Verifica que PostgreSQL esté corriendo.');
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
