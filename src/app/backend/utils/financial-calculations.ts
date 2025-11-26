/**
 * Utilidades para cálculos financieros
 * Método Francés Vencido Ordinario para créditos hipotecarios MiVivienda
 */

export interface PlanPagoCalculado {
  numeroCuota: number;
  saldoInicial: number;
  interes: number;
  cuota: number;
  amortizacion: number;
  saldoFinal: number;
  flujo: number;
  seguroDesgrav?: number;
  seguroInmueble?: number;
  portes?: number;
}

export interface CreditoParams {
  monto: number;
  plazo: number;
  tasaInteres: number;
  tipoTasa: string; // 'NOMINAL' | 'EFECTIVA'
  capitalizacion: string; // 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'
  graciaTotal: number;
  graciaParcial: number;
  seguroDesgrav?: number;
  seguroInmueble?: number;
  portes?: number;
}

/**
 * Convierte una tasa nominal a efectiva mensual
 */
export function convertirTasaNominalAEfectivaMensual(
  tasaNominal: number,
  capitalizacion: string
): number {
  const tasaDecimal = tasaNominal / 100;
  let periodosPorAno: number;

  switch (capitalizacion.toUpperCase()) {
    case 'MENSUAL':
      periodosPorAno = 12;
      break;
    case 'TRIMESTRAL':
      periodosPorAno = 4;
      break;
    case 'SEMESTRAL':
      periodosPorAno = 2;
      break;
    case 'ANUAL':
      periodosPorAno = 1;
      break;
    default:
      periodosPorAno = 12; // Por defecto mensual
  }

  // Tasa efectiva mensual = (1 + tasa_nominal/periodos)^(periodos/12) - 1
  const tasaEfectivaMensual = Math.pow(1 + tasaDecimal / periodosPorAno, periodosPorAno / 12) - 1;
  return tasaEfectivaMensual * 100;
}

/**
 * Obtiene la tasa efectiva mensual (ya sea que venga como nominal o efectiva)
 */
export function obtenerTasaEfectivaMensual(
  tasaInteres: number,
  tipoTasa: string,
  capitalizacion: string
): number {
  if (tipoTasa.toUpperCase() === 'EFECTIVA') {
    // Si ya es efectiva, asumimos que es anual y la convertimos a mensual
    const tasaDecimal = tasaInteres / 100;
    return (Math.pow(1 + tasaDecimal, 1 / 12) - 1) * 100;
  } else {
    // Si es nominal, la convertimos a efectiva mensual
    return convertirTasaNominalAEfectivaMensual(tasaInteres, capitalizacion);
  }
}

/**
 * Calcula el plan de pagos usando el método francés vencido ordinario
 * con períodos de gracia total y parcial
 */
export function calcularPlanPagosFrances(params: CreditoParams): PlanPagoCalculado[] {
  const { monto, plazo, tasaInteres, tipoTasa, capitalizacion, graciaTotal, graciaParcial } = params;

  // Obtener tasa efectiva mensual
  const tasaEfectivaMensual = obtenerTasaEfectivaMensual(tasaInteres, tipoTasa, capitalizacion);
  const tasaDecimal = tasaEfectivaMensual / 100;

  // Calcular cuota constante (método francés)
  // Cuota = Monto * [i * (1+i)^n] / [(1+i)^n - 1]
  const plazoPago = plazo - graciaTotal; // Plazo real de pago (descontando gracia total)
  const factor = Math.pow(1 + tasaDecimal, plazoPago);
  const cuotaConstante = monto * (tasaDecimal * factor) / (factor - 1);

  const plan: PlanPagoCalculado[] = [];
  let saldoInicial = monto;

  // Períodos de gracia total (no se paga nada, solo se capitaliza el interés)
  for (let i = 1; i <= graciaTotal; i++) {
    const interes = saldoInicial * tasaDecimal;
    const saldoFinal = saldoInicial + interes; // El interés se capitaliza

    plan.push({
      numeroCuota: i,
      saldoInicial,
      interes,
      cuota: 0,
      amortizacion: 0,
      saldoFinal,
      flujo: 0,
      seguroDesgrav: params.seguroDesgrav || 0,
      seguroInmueble: params.seguroInmueble || 0,
      portes: params.portes || 0
    });

    saldoInicial = saldoFinal;
  }

  // Períodos de gracia parcial (solo se paga interés, no se amortiza)
  for (let i = graciaTotal + 1; i <= graciaTotal + graciaParcial; i++) {
    const interes = saldoInicial * tasaDecimal;
    const cuota = interes; // Solo se paga el interés
    const amortizacion = 0;
    const saldoFinal = saldoInicial; // El saldo no cambia

    plan.push({
      numeroCuota: i,
      saldoInicial,
      interes,
      cuota,
      amortizacion,
      saldoFinal,
      flujo: -(cuota + (params.seguroDesgrav || 0) + (params.seguroInmueble || 0) + (params.portes || 0)),
      seguroDesgrav: params.seguroDesgrav || 0,
      seguroInmueble: params.seguroInmueble || 0,
      portes: params.portes || 0
    });

    saldoInicial = saldoFinal;
  }

  // Períodos de pago normal (método francés)
  for (let i = graciaTotal + graciaParcial + 1; i <= plazo; i++) {
    const interes = saldoInicial * tasaDecimal;
    const amortizacion = cuotaConstante - interes;
    const saldoFinal = saldoInicial - amortizacion;

    plan.push({
      numeroCuota: i,
      saldoInicial,
      interes,
      cuota: cuotaConstante,
      amortizacion,
      saldoFinal: Math.max(0, saldoFinal), // Asegurar que no sea negativo
      flujo: -(cuotaConstante + (params.seguroDesgrav || 0) + (params.seguroInmueble || 0) + (params.portes || 0)),
      seguroDesgrav: params.seguroDesgrav || 0,
      seguroInmueble: params.seguroInmueble || 0,
      portes: params.portes || 0
    });

    saldoInicial = Math.max(0, saldoFinal);
  }

  return plan;
}

/**
 * Calcula el VAN (Valor Actual Neto) usando una tasa de descuento
 */
export function calcularVAN(flujos: number[], tasaDescuento: number): number {
  const tasaDecimal = tasaDescuento / 100;
  let van = 0;

  for (let i = 0; i < flujos.length; i++) {
    van += flujos[i] / Math.pow(1 + tasaDecimal, i);
  }

  return van;
}

/**
 * Calcula la TIR (Tasa Interna de Retorno) usando el método de bisección
 */
export function calcularTIR(flujos: number[]): number {
  // La TIR es la tasa que hace que el VAN sea igual a 0
  let tasaMin = -99;
  let tasaMax = 1000;
  const tolerancia = 0.0001;
  const maxIteraciones = 100;

  for (let i = 0; i < maxIteraciones; i++) {
    const tasaMedia = (tasaMin + tasaMax) / 2;
    const van = calcularVAN(flujos, tasaMedia);

    if (Math.abs(van) < tolerancia) {
      return tasaMedia;
    }

    if (van > 0) {
      tasaMin = tasaMedia;
    } else {
      tasaMax = tasaMedia;
    }
  }

  return (tasaMin + tasaMax) / 2;
}

/**
 * Calcula la TCEA (Tasa de Costo Efectivo Anual)
 */
export function calcularTCEA(flujos: number[]): number {
  const tir = calcularTIR(flujos);
  // TCEA = (1 + TIR_mensual)^12 - 1
  const tirMensual = tir / 100;
  const tcea = (Math.pow(1 + tirMensual, 12) - 1) * 100;
  return tcea;
}

/**
 * Calcula la tasa de costo del crédito
 */
export function calcularTasaCosto(flujos: number[], montoInicial: number): number {
  const tir = calcularTIR(flujos);
  return tir;
}

