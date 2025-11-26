import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { routes } from './app.routes';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { AuthInterceptor } from './services/auth.interceptor'; // Importamos el interceptor basado en clase

export const appConfig: ApplicationConfig = {
  providers: [
    // Configuración de la aplicación
    provideZoneChangeDetection({ eventCoalescing: true }),

    // 1. Configuración de Rutas
    provideRouter(routes),

    // 2. Configuración para HttpClient y el Interceptor
    // Esta es la forma de registrar un interceptor basado en clase
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },

    // 3. Importar proveedores para los formularios
    importProvidersFrom(FormsModule, ReactiveFormsModule),

    // 4. Proveer los Guards
    AuthGuard,
    RoleGuard
  ]
};
