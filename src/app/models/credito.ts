import { Cliente } from './cliente';
import { UnidadInmobiliaria } from './unidad-inmobiliaria';

export interface Credito {
  idCredito: number;
  clienteId: number;
  unidadInmobiliariaId?: number;

  moneda: string;           // 'PEN' | 'USD' (ejemplo)
  monto: number;
  plazo: number;            // en meses
  tasaInteres: number;      // tasa en porcentaje (ej. 7.5)
  tipoTasa: string;         // 'EFECTIVA' | 'NOMINAL'
  capitalizacion: string;   // 'MENSUAL' | 'ANUAL' | etc.
  fechaDesembolso: string;

  graciaTotal: number;
  graciaParcial: number;

  createdAt?: Date;
  updatedAt?: Date;

  // Relaciones (opcionales en frontend)
  cliente?: Cliente;
  unidadInmobiliaria?: UnidadInmobiliaria;

  // Campos adicionales que el frontend puede recibir del backend
  planPagos?: any[];           // listado de cuota/plan de pagos (PlanPago)
  indicadores?: any;           // VAN, TIR, TCEA, etc.
}
