// Esta es la interfaz que falta. Representa los datos que enviamos al hacer login.
export interface AuthRequest {
  username: string;
  password?: string;
}

// Esta interfaz representa la respuesta que recibimos del backend al hacer login.
export interface AuthResponse {
  jwt: string;
  roles: string[];
}

// Esta interfaz representa la información que decodificamos del token JWT.
export interface DecodedToken {
  sub: string; // Subject (ID del usuario como string)
  username: string; // Nombre de usuario
  roles: string[]; // Roles del usuario
  iat?: number; // Issued at (opcional)
  exp?: number; // Expiration time (opcional)
}
