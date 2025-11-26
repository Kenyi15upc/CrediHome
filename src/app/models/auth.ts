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
  id: number; //ID del usuario, que debe estar en el token
  sub: string; // Subject (username)
  roles: string[];
  iat: number; // Issued at
  exp: number; // Expiration time
}
