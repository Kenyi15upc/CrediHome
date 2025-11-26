export interface PlanPago {
  numeroCuota: number;
  saldoInicial: number;
  amortizacion: number;
  interes: number;
  seguroDesgravamen: number;
  seguroInmueble: number;
  portes: number;
  cuota: number;
  saldoFinal: number;
  tipoGracia: string; // 'S', 'T', 'P'
}
