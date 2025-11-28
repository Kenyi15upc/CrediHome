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
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  createCredito(credito: Credito): Observable<Credito> {
    return this.http.post<Credito>(`${this.baseUrl}/creditos`, credito);
  }

  getCreditos(): Observable<Credito[]> {
    return this.http.get<Credito[]>(`${this.baseUrl}/creditos`);
  }

  generarPlanDePagos(creditoId: number, graciaTotal: number, graciaParcial: number): Observable<PlanPago[]> {
    const params = new HttpParams()
      .set('graciaTotal', graciaTotal.toString())
      .set('graciaParcial', graciaParcial.toString());

    return this.http.post<PlanPago[]>(`${this.baseUrl}/creditos/${creditoId}/plan`, null, { params });
  }

  calcularIndicadores(creditoId: number, plan: PlanPago[]): Observable<IndicadorFinanciero> {
    return this.http.post<IndicadorFinanciero>(`${this.baseUrl}/creditos/${creditoId}/indicadores`, plan);
  }
}
