import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { AuthRequest, AuthResponse, DecodedToken } from '../models/auth';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'http://localhost:8080'; // URL de tu backend
  private currentUserSubject: BehaviorSubject<DecodedToken | null>;
  public currentUser: Observable<DecodedToken | null>;

  private readonly ROL_CLIENTE_ID = 10;

  constructor(private http: HttpClient) {
    const token = this.getToken();
    const decodedToken = token ? this.decodeToken(token) : null;
    this.currentUserSubject = new BehaviorSubject<DecodedToken | null>(decodedToken);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): DecodedToken | null {
    return this.currentUserSubject.value;
  }

  login(request: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/CrediHome/authenticate`, request).pipe(
      tap((response) => {
        if (response && response.jwt) {
          this.saveToken(response.jwt);
          const decodedToken = this.decodeToken(response.jwt);
          this.currentUserSubject.next(decodedToken);
        }
      })
    );
  }

  register(user: User): Observable<any> {
    // Flujo encadenado:
    // 1. Crear el usuario con POST /api/user
    // 2. Usar el ID del usuario devuelto para asignarle el rol con POST /api/save/{user_id}/{rol_id}
    return this.http.post<User>(`${this.baseUrl}/api/user`, user).pipe(
      switchMap((createdUser: User) => {
        if (!createdUser || !createdUser.id) {
          throw new Error('El backend no devolvió el usuario creado con su ID.');
        }
        // Ahora llamamos al segundo endpoint para asignar el rol
        return this.http.post(
          `${this.baseUrl}/api/save/${createdUser.id}/${this.ROL_CLIENTE_ID}`,
          {} // El cuerpo de la petición es vacío
        );
      })
    );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
  }

  private saveToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    const decoded = this.decodeToken(token);
    // Verificar si el token tiene exp y si está expirado
    if (decoded.exp) {
      const isExpired = decoded.exp * 1000 < Date.now();
      if (isExpired) {
        this.logout();
        return false;
      }
    }
    return true;
  }

  private decodeToken(token: string): DecodedToken {
    return jwtDecode(token);
  }

  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return !!user && user.roles.includes(role);
  }
}
