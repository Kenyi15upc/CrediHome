import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../models/cliente';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de todos los clientes (para el Asesor).
   * Endpoint: GET /api/clientes
   */
  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.baseUrl}/clientes`);
  }

  /**
   * Busca un perfil de cliente asociado a un ID de usuario.
   * Endpoint: GET /api/clientes/user/{userId}
   */
  getClienteByUserId(userId: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/clientes/user/${userId}`);
  }

  /**
   * Guarda la información de un nuevo cliente.
   * Endpoint: POST /api/clientes
   */
  createCliente(cliente: any): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.baseUrl}/clientes`, cliente);
  }

  /**
   * Actualiza la información de un cliente existente.
   * Endpoint: PUT /api/clientes/{id}
   */
  updateCliente(id: number, cliente: any): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.baseUrl}/clientes/${id}`, cliente);
  }
}
