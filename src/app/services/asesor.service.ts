import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Asesor } from '../models/asesor';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AsesorService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Busca un perfil de asesor por su correo electrónico.
   * Endpoint: GET /api/asesor/email/{email}
   */
  getAsesorByEmail(email: string): Observable<Asesor> {
    return this.http.get<Asesor>(`${this.baseUrl}/asesor/email/${email}`);
  }

  /**
   * Guarda un nuevo perfil de asesor.
   * Endpoint: POST /api/asesor
   */
  createAsesor(asesor: Omit<Asesor, 'idAsesor'>): Observable<Asesor> {
    return this.http.post<Asesor>(`${this.baseUrl}/asesor`, asesor);
  }
}
