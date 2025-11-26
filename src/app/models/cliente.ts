export interface Cliente {
  idCliente: number;
  userId: number;
  nombre: string;
  apellidos?: string;
  dni: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  ingresoMensual?: number;
  gastoMensual?: number;
  ocupacion?: string;
  createdAt?: Date;
}
