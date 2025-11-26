import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Primero, verificamos si el usuario está logueado
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Obtenemos el rol esperado desde la data de la ruta
    const expectedRole = route.data['expectedRole'];
    if (!expectedRole) {
      // Si no se define un rol esperado, no se debería usar este guardián.
      console.error("RoleGuard: No se ha definido 'expectedRole' en la data de la ruta.");
      this.router.navigate(['/']); // Redirigir a una página segura por defecto
      return false;
    }

    // Verificamos si el usuario tiene el rol requerido
    if (this.authService.hasRole(expectedRole)) {
      return true;
    }

    // Si el usuario no tiene el rol, lo redirigimos
    console.warn(`Acceso denegado. Se requiere el rol: ${expectedRole}`);
    this.router.navigate(['/']); // O a una página de "acceso denegado"
    return false;
  }
}
