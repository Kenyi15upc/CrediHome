import { Routes } from '@angular/router';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

// Componentes de página
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AsesorDashboardComponent } from './pages/asesor-dashboard/asesor-dashboard.component';
import { ClienteDashboardComponent } from './pages/cliente-dashboard/cliente-dashboard.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Ruta para el dashboard del Asesor
  {
    path: 'asesor-dashboard',
    component: AsesorDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRole: 'ASESOR' }
  },

  // Ruta para el dashboard del Cliente
  {
    path: 'cliente-dashboard',
    component: ClienteDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRole: 'CLIENTE' }
  },

  // Redirección por defecto
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  // Ruta comodín para páginas no encontradas
  { path: '**', redirectTo: '/home' }
];
