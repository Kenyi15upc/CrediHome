import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UnidadInmobiliaria } from '../models/unidad-inmobiliaria';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UnidadInmobiliariaService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de todas las unidades inmobiliarias.
   * Endpoint: GET /api/unidades
   */
  getUnidades(): Observable<UnidadInmobiliaria[]> {
    return this.http.get<UnidadInmobiliaria[]>(`${this.baseUrl}/unidades`);
  }

  /**
   * Guarda una nueva unidad inmobiliaria.
   * Endpoint: POST /api/unidades
   */
  createUnidad(unidad: Omit<UnidadInmobiliaria, 'idUnidad'>): Observable<UnidadInmobiliaria> {
    return this.http.post<UnidadInmobiliaria>(`${this.baseUrl}/unidades`, unidad);
  }
}
