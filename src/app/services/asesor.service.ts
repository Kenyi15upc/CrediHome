import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Asesor } from '../models/asesor';

@Injectable({
  providedIn: 'root'
})
export class AsesorService {
  private baseUrl = 'http://localhost:8080/CrediHome';

  constructor(private http: HttpClient) { }

  /**
   * Busca un perfil de asesor por su correo electrónico.
   * Asumimos que tienes un endpoint GET /CrediHome/asesor/email/{email} en el backend.
   */
  getAsesorByEmail(email: string): Observable<Asesor> {
    return this.http.get<Asesor>(`${this.baseUrl}/asesor/email/${email}`);
  }

  /**
   * Guarda un nuevo perfil de asesor.
   * Endpoint: POST /CrediHome/asesor
   */
  createAsesor(asesor: Omit<Asesor, 'idAsesor'>): Observable<Asesor> {
    return this.http.post<Asesor>(`${this.baseUrl}/asesor`, asesor);
  }
}
