import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Credito } from '../models/credito';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CreditoService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  createCredito(credito: Credito): Observable<Credito> {
    return this.http.post<Credito>(`${this.baseUrl}/creditos`, credito);
  }

  getCreditos(): Observable<Credito[]> {
    return this.http.get<Credito[]>(`${this.baseUrl}/creditos`);
  }

  /**
   * Genera el plan de pagos y los indicadores para un crédito.
   * @param creditoId El ID del crédito guardado.
   * @param payload Un objeto que contiene la bandera para aplicar el bono.
   * @returns Un observable con la respuesta completa de la simulación.
   */
  generarPlanDePagos(creditoId: number, payload: { aplicarBono: boolean }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/creditos/${creditoId}/plan`, payload);
  }
}
