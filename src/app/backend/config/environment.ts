// Variables de entorno para el backend
export const ENV = {
  // Puerto del servidor
  PORT: process.env.PORT || 8080,

  // Entorno de ejecución
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Base de datos
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:12345678@localhost:5432/credihome_db?schema=public',

  // JWT (JSON Web Tokens)
  JWT_SECRET: process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_cambiala_en_produccion_2024',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '24h',

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:4200',
};

// Constantes de la aplicación
export const CONSTANTS = {
  // IDs de roles
  ROLE_CLIENTE_ID: 10,
  ROLE_ASESOR_ID: 20,

  // Configuración de bcrypt
  BCRYPT_SALT_ROUNDS: 10,

  // Mensajes
  MESSAGES: {
    LOGIN_SUCCESS: 'Login exitoso',
    REGISTER_SUCCESS: 'Usuario registrado exitosamente',
    UNAUTHORIZED: 'No autorizado',
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    USER_EXISTS: 'El usuario ya existe',
    SERVER_ERROR: 'Error en el servidor',
  },
};

