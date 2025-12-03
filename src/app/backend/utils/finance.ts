import { Credito, PlanPago } from '@prisma/client';
import { irr } from 'financial';

/**
 * Convierte una tasa de interés anual a una tasa efectiva mensual.
 * @param tasaAnual Tasa de interés anual en porcentaje (ej: 7.5 para 7.5%).
 * @param tipoTasa 'EFECTIVA' o 'NOMINAL'.
 * @param capitalizacion 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'.
 * @returns La tasa de interés efectiva mensual como decimal (ej: 0.00604).
 */
function convertirTasaMensual(tasaAnual: number, tipoTasa: string, capitalizacion: string): number {
  if (tasaAnual === 0) return 0;

  const tasaDecimal = tasaAnual / 100.0;

  if (tipoTasa.toUpperCase() === 'EFECTIVA') {
    return Math.pow(1.0 + tasaDecimal, 1.0 / 12.0) - 1.0;
  } else { // NOMINAL
    let m = 12;
    switch (capitalizacion.toUpperCase()) {
      case 'TRIMESTRAL': m = 4; break;
      case 'SEMESTRAL': m = 2; break;
      case 'ANUAL': m = 1; break;
    }
    const tasaEfectivaAnual = Math.pow(1.0 + tasaDecimal / m, m) - 1.0;
    return Math.pow(1.0 + tasaEfectivaAnual, 1.0 / 12.0) - 1.0;
  }
}

export function generarPlanPagos(credito: Credito): PlanPago[] {
  const plan: Omit<PlanPago, 'id' | 'creditoId'>[] = [];
  const { monto, plazo, graciaTotal, graciaParcial, tasaInteres, tipoTasa, capitalizacion } = credito;

  const tasaMensual = convertirTasaMensual(tasaInteres, tipoTasa, capitalizacion);
  let saldoInicial = monto;

  const tasaSeguroDesgravamenMensual = 0.035 / 100; // 0.035% sobre el saldo insoluto
  const seguroInmuebleAnual = (0.3 / 100) * monto;   // 0.3% anual sobre el valor del inmueble
  const seguroInmuebleMensual = seguroInmuebleAnual / 12;
  const portesMensuales = 5.0; // S/ 5.00 fijos por envío de estado de cuenta

  // 1. Período de Gracia Total: No se paga nada, los intereses se capitalizan.
  for (let i = 1; i <= graciaTotal; i++) {
    const interes = saldoInicial * tasaMensual;
    saldoInicial += interes;
    plan.push({
      numeroCuota: i,
      saldoInicial: saldoInicial - interes,
      interes,
      cuota: 0,
      amortizacion: 0,
      saldoFinal: saldoInicial,
      flujo: 0,
      seguroDesgrav: 0,
      seguroInmueble: 0,
      portes: 0
    });
  }

  // 2. Período de Gracia Parcial: Se pagan intereses y costos fijos.
  for (let i = 1; i <= graciaParcial; i++) {
    const interes = saldoInicial * tasaMensual;
    const seguroDesgrav = saldoInicial * tasaSeguroDesgravamenMensual;
    const cuotaTotalPagada = interes + seguroDesgrav + seguroInmuebleMensual + portesMensuales;

    plan.push({
      numeroCuota: graciaTotal + i,
      saldoInicial,
      interes,
      cuota: interes,
      amortizacion: 0,
      saldoFinal: saldoInicial,
      flujo: -cuotaTotalPagada,
      seguroDesgrav,
      seguroInmueble: seguroInmuebleMensual,
      portes: portesMensuales
    });
  }

  // 3. Período de Pago Regular (Cuotas Fijas)
  const plazoRestante = plazo - graciaTotal - graciaParcial;
  if (plazoRestante > 0) {
    const cuotaFija = (saldoInicial * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -plazoRestante));

    for (let i = 1; i <= plazoRestante; i++) {
      const interes = saldoInicial * tasaMensual;
      let amortizacion = cuotaFija - interes;
      let saldoFinal = saldoInicial - amortizacion;

      const seguroDesgrav = saldoInicial * tasaSeguroDesgravamenMensual;

      if (i === plazoRestante) {
        amortizacion = saldoInicial;
        saldoFinal = 0;
      }

      const cuotaCapitalInteres = amortizacion + interes;
      const cuotaTotalPagada = cuotaCapitalInteres + seguroDesgrav + seguroInmuebleMensual + portesMensuales;

      plan.push({
        numeroCuota: graciaTotal + graciaParcial + i,
        saldoInicial,
        interes,
        cuota: cuotaCapitalInteres,
        amortizacion,
        saldoFinal,
        flujo: -cuotaTotalPagada,
        seguroDesgrav,
        seguroInmueble: seguroInmuebleMensual,
        portes: portesMensuales
      });
      saldoInicial = saldoFinal;
    }
  }

  return plan.map(p => ({ ...p, creditoId: credito.idCredito, id: 0 }));
}

/**
 * Calcula los indicadores financieros VAN, TIR y TCEA.
 * @param credito El objeto del crédito.
 * @param planPagos El plan de pagos generado que ya incluye todos los costos.
 * @returns Un objeto con los indicadores financieros.
 */
export function calcularIndicadores(credito: Credito, planPagos: PlanPago[]) {
  const { monto } = credito;

  // Flujo para la TCEA: Incluye el desembolso inicial y TODOS los pagos del cliente (cuota + seguros + portes).
  const flujosTCEA = [monto, ...planPagos.map(p => p.flujo)];

  // Flujo para la TIR: Incluye solo el capital e intereses. Sirve para ver el costo del dinero puro.
  const flujosTIR = [monto, ...planPagos.map(p => -p.cuota)];

  // Tasa de descuento mensual (tasa de costo de oportunidad del cliente - COK)
  const tasaCostoOportunidadMensual = convertirTasaMensual(9, 'EFECTIVA', 'MENSUAL'); // Asumimos un COK del 9% TEA

  // 1. Calcular VAN: Se usa el flujo real (TCEA) y se descuenta al costo de oportunidad (COK).
  const van = flujosTCEA.reduce((acc, flujo, t) => {
    // El flujo inicial (monto) es en t=0, los pagos son en t=1, t=2, ...
    return acc + flujo / Math.pow(1 + tasaCostoOportunidadMensual, t);
  }, 0);

  // 2. Calcular TIR: Es la tasa que hace el VAN=0 para el flujo de capital e intereses.
  const tirMensual = irr(flujosTIR);
  const tirAnual = Math.pow(1 + tirMensual, 12) - 1;

  // 3. Calcular TCEA: Es la TIR del flujo que incluye TODOS los costos.
  const tceaMensual = irr(flujosTCEA);
  const tceaAnual = Math.pow(1 + tceaMensual, 12) - 1;

  return {
    van,
    tir: tirAnual * 100,
    tcea: tceaAnual * 100,
    tasaCosto: 9
  };
}
