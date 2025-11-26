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
  private baseUrl = 'http://localhost:8080/CrediHome';

  constructor(private http: HttpClient) { }

  /**
   * Guarda una nueva simulación de crédito.
   * Endpoint: POST /CrediHome/credito
   */
  createCredito(credito: Credito): Observable<Credito> {
    return this.http.post<Credito>(`${this.baseUrl}/credito`, credito);
  }

  /**
   * Obtiene todas las simulaciones de crédito.
   * Endpoint: GET /CrediHome/creditos
   */
  getCreditos(): Observable<Credito[]> {
    return this.http.get<Credito[]>(`${this.baseUrl}/creditos`);
  }

  /**
   * Llama al backend para generar el plan de pagos francés.
   * Endpoint: POST /CrediHome/{id}/plan
   */
  generarPlanDePagos(creditoId: number, graciaTotal: number, graciaParcial: number): Observable<PlanPago[]> {
    const params = new HttpParams()
      .set('graciaTotal', graciaTotal.toString())
      .set('graciaParcial', graciaParcial.toString());

    return this.http.post<PlanPago[]>(`${this.baseUrl}/${creditoId}/plan`, null, { params });
  }

  /**
   * Envía el plan de pagos generado para calcular los indicadores financieros.
   * Endpoint: POST /CrediHome/{id}/indicadores
   */
  calcularIndicadores(creditoId: number, plan: PlanPago[]): Observable<IndicadorFinanciero> {
    return this.http.post<IndicadorFinanciero>(`${this.baseUrl}/${creditoId}/indicadores`, plan);
  }
}
