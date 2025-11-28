import { Cliente } from './cliente';
import { UnidadInmobiliaria } from './unidad-inmobiliaria';

export interface Credito {
  idCredito: number;
  clienteId: number;
  unidadInmobiliariaId?: number;

  moneda: string;
  monto: number;
  plazo: number;
  tasaInteres: number;
  tipoTasa: string;
  capitalizacion: string;
  fechaDesembolso: string;

  graciaTotal: number;
  graciaParcial: number;

  createdAt?: Date;
  updatedAt?: Date;

  cliente?: Cliente;
  unidadInmobiliaria?: UnidadInmobiliaria;
}
