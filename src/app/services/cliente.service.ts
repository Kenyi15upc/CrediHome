import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../models/cliente';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private baseUrl = 'http://localhost:8080/CrediHome';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista de todos los clientes (para el Asesor).
   * Endpoint: GET /CrediHome/clientes
   */
  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.baseUrl}/clientes`);
  }

  /**
   * Busca un perfil de cliente asociado a un ID de usuario.
   * Endpoint: GET /CrediHome/cliente/usuario/{userId}
   */
  getClienteByUserId(userId: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/cliente/usuario/${userId}`);
  }

  /**
   * Guarda la información de un nuevo cliente. El backend debe asociarlo al usuario logueado.
   * Endpoint: POST /CrediHome/cliente
   */
  createCliente(cliente: Omit<Cliente, 'idCliente'>): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.baseUrl}/cliente`, cliente);
  }

  /**
   * Actualiza la información de un cliente existente.
   * Endpoint: PUT /CrediHome/cliente/modificar/{id}
   */
  updateCliente(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.baseUrl}/cliente/modificar/${id}`, cliente);
  }
}
