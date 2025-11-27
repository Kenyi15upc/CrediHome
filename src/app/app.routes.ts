import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AsesorDashboardComponent } from './pages/asesor-dashboard/asesor-dashboard.component';
import { ClienteDashboardComponent } from './pages/cliente-dashboard/cliente-dashboard.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'asesor-dashboard',
    component: AsesorDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRole: 'ASESOR' }
  },
  {
    path: 'cliente-dashboard',
    component: ClienteDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRole: 'CLIENTE' }
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRole: 'ADMINISTRADOR' }
  },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];
