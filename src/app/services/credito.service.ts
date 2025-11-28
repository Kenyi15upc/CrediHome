import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Credito } from '../models/credito';
import { PlanPago } from '../models/plan-pago';
import { IndicadorFinanciero } from '../models/indicador-financiero';

@Injectable({
  providedIn: 'root'
})
export class CreditoService {
  // Estandarizar la URL base a /api como los otros servicios
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  /**
   * Guarda una nueva simulación de crédito.
   * Endpoint: POST /api/creditos
   */
  createCredito(credito: Credito): Observable<Credito> {
    // Usar el endpoint RESTful estándar
    return this.http.post<Credito>(`${this.baseUrl}/creditos`, credito);
  }

  /**
   * Obtiene todas las simulaciones de crédito.
   * Endpoint: GET /api/creditos
   */
  getCreditos(): Observable<Credito[]> {
    return this.http.get<Credito[]>(`${this.baseUrl}/creditos`);
  }

  /**
   * Llama al backend para generar el plan de pagos francés.
   * Endpoint: POST /api/creditos/{id}/plan
   */
  generarPlanDePagos(creditoId: number, graciaTotal: number, graciaParcial: number): Observable<PlanPago[]> {
    const params = new HttpParams()
      .set('graciaTotal', graciaTotal.toString())
      .set('graciaParcial', graciaParcial.toString());

    return this.http.post<PlanPago[]>(`${this.baseUrl}/creditos/${creditoId}/plan`, null, { params });
  }

  /**
   * Envía el plan de pagos generado para calcular los indicadores financieros.
   * Endpoint: POST /api/creditos/{id}/indicadores
   */
  calcularIndicadores(creditoId: number, plan: PlanPago[]): Observable<IndicadorFinanciero> {
    return this.http.post<IndicadorFinanciero>(`${this.baseUrl}/creditos/${creditoId}/indicadores`, plan);
  }
}
