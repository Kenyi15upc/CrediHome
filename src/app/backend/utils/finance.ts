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
    let m = 12; // Por defecto, capitalización mensual
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

  // 1. Período de Gracia Total: No se paga nada, los intereses se capitalizan.
  for (let i = 1; i <= graciaTotal; i++) {
    const interes = saldoInicial * tasaMensual;
    saldoInicial += interes; // El interés se suma al capital
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

  // 2. Período de Gracia Parcial: Solo se pagan intereses.
  for (let i = 1; i <= graciaParcial; i++) {
    const interes = saldoInicial * tasaMensual;
    plan.push({
      numeroCuota: graciaTotal + i,
      saldoInicial,
      interes,
      cuota: interes,
      amortizacion: 0,
      saldoFinal: saldoInicial,
      flujo: -interes,
      seguroDesgrav: 0,
      seguroInmueble: 0,
      portes: 0
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

      // Ajuste en la última cuota para que el saldo final sea exactamente 0
      if (i === plazoRestante) {
        amortizacion = saldoInicial;
        saldoFinal = 0;
      }

      plan.push({
        numeroCuota: graciaTotal + graciaParcial + i,
        saldoInicial,
        interes,
        cuota: amortizacion + interes,
        amortizacion,
        saldoFinal,
        flujo: -(amortizacion + interes),
        seguroDesgrav: 0,
        seguroInmueble: 0,
        portes: 0
      });
      saldoInicial = saldoFinal;
    }
  }

  return plan.map(p => ({ ...p, creditoId: credito.idCredito, id: 0 }));
}

/**
 * Calcula los indicadores financieros VAN, TIR y TCEA.
 * @param credito El objeto del crédito.
 * @param planPagos El plan de pagos generado.
 * @returns Un objeto con los indicadores financieros.
 */
export function calcularIndicadores(credito: Credito, planPagos: PlanPago[]) {
  const { monto, tasaInteres, tipoTasa, capitalizacion } = credito;

  const flujos = [monto, ...planPagos.map(p => -p.cuota)];

  // Tasa de descuento mensual (tasa de costo de oportunidad)
  const tasaCostoOportunidadMensual = convertirTasaMensual(9, 'EFECTIVA', 'MENSUAL'); // Asumimos un COK del 9% TEA

  // Calcular VAN
  const van = flujos.reduce((acc, flujo, t) => {
    return acc + flujo / Math.pow(1 + tasaCostoOportunidadMensual, t);
  }, 0);

  // Calcular TIR
  const tirMensual = irr(flujos);
  const tirAnual = Math.pow(1 + tirMensual, 12) - 1;

  // La TCEA es, en esencia, la TIR anualizada del crédito.
  const tcea = tirAnual;

  return {
    van,
    tir: tirAnual * 100, // En porcentaje
    tcea: tcea * 100, // En porcentaje
    tasaCosto: 9 // Tasa de costo de oportunidad usada
  };
}
