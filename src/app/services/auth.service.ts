import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { AuthRequest, AuthResponse, DecodedToken } from '../models/auth';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'http://localhost:8080';
  private currentUserSubject: BehaviorSubject<DecodedToken | null>;
  public currentUser: Observable<DecodedToken | null>;

  private readonly ROL_CLIENTE_ID = 10;
  private readonly ROL_ASESOR_ID = 20;
  private readonly ROL_ADMINISTRADOR_ID = 30;

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

  private getRoleId(roleName: string): number {
    switch (roleName) {
      case 'ROLE_CLIENTE':
        return this.ROL_CLIENTE_ID;
      case 'ROLE_ASESOR':
        return this.ROL_ASESOR_ID;
      case 'ROLE_ADMINISTRADOR':
        return this.ROL_ADMINISTRADOR_ID;
      default:
        return this.ROL_CLIENTE_ID;
    }
  }

  register(user: User): Observable<any> {
    const roleId = this.getRoleId(user.role || 'ROLE_CLIENTE');

    return this.http.post<User>(`${this.baseUrl}/api/user`, user).pipe(
      switchMap((createdUser: User) => {
        if (!createdUser || !createdUser.id) {
          throw new Error('El backend no devolvió el usuario creado con su ID.');
        }
        return this.http.post(
          `${this.baseUrl}/api/save/${createdUser.id}/${roleId}`,
          {}
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

