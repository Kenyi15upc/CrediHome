import {Cliente} from './cliente';

export interface Credito {
  idCredito: number;
  moneda: string;
  monto: number;
  plazo: number;
  tasaInteres: number;
  tipoTasa: string;
  capitalizacion: string;
  fechaDesembolso: string;
  cliente: Cliente;
}
