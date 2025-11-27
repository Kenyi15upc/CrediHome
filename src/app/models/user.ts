export interface User {
  id?: number;
  username: string;
  nombre?: string;
  apellidos?: string;
  password?: string;
  email?: string | null;
  enabled?: boolean;
  role?: string;
}

