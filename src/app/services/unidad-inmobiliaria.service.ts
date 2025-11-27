﻿import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UnidadInmobiliaria } from '../models/unidad-inmobiliaria';

@Injectable({
  providedIn: 'root'
})
export class UnidadInmobiliariaService {
  private baseUrl = 'http://localhost:8080/CrediHome';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de todas las unidades inmobiliarias.
   * Endpoint: GET /CrediHome/unidades
   */
  getUnidades(): Observable<UnidadInmobiliaria[]> {
    return this.http.get<UnidadInmobiliaria[]>(`${this.baseUrl}/unidades`);
  }

  /**
   * Guarda una nueva unidad inmobiliaria.
   * Endpoint: POST /CrediHome/unidades
   */
  createUnidad(unidad: Omit<UnidadInmobiliaria, 'idUnidad'>): Observable<UnidadInmobiliaria> {
    return this.http.post<UnidadInmobiliaria>(`${this.baseUrl}/unidades`, unidad);
  }
}
