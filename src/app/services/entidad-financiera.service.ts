import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EntidadFinanciera } from '../models/entidad-financiera';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EntidadFinancieraService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de todas las entidades financieras activas.
   */
  getEntidades(): Observable<EntidadFinanciera[]> {
    return this.http.get<EntidadFinanciera[]>(`${this.baseUrl}/entidades`);
  }
}
