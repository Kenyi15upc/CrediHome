import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente } from '../models/cliente';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.baseUrl}/clientes`);
  }

  getClienteByUserId(userId: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/clientes/user/${userId}`);
  }

  createCliente(cliente: any): Observable<Cliente> {
    const currentUser = this.authService.currentUserValue;
    const userId = currentUser ? parseInt(currentUser.sub) : null;

    if (!userId) {
      throw new Error('No se pudo obtener el ID del usuario para crear el cliente.');
    }

    const payload = {
      ...cliente,
      userId: userId
    };

    return this.http.post<Cliente>(`${this.baseUrl}/clientes`, payload);
  }

  updateCliente(id: number, cliente: any): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.baseUrl}/clientes/${id}`, cliente);
  }
}
