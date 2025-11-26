import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtiene el token de autenticación del servicio.
    const authToken = this.authService.getToken();

    // Si el token existe, clona la petición y añade la cabecera de autorización.
    if (authToken) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${authToken}`)
      });
      // Envía la petición clonada con la cabecera.
      return next.handle(authReq);
    }

    // Si no hay token, envía la petición original sin modificar.
    return next.handle(req);
  }
}
