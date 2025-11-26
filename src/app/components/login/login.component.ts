import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService} from '../../services/auth.service';
import { DecodedToken} from '../../models/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  submitted = false;
  errorMessage: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Si el usuario ya está logueado, redirigirlo fuera del login
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  // Getter para un acceso fácil a los campos del formulario
  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;

    // Detener si el formulario es inválido
    if (this.loginForm.invalid) {
      return;
    }

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('Login exitoso', response);
        console.log('JWT recibido:', response.jwt);
        console.log('Roles:', response.roles);

        // Dar tiempo para que el token se procese
        setTimeout(() => {
          const user = this.authService.currentUserValue;
          console.log('Usuario decodificado:', user);
          this.redirectUser(user);
        }, 100);
      },
      error: (err) => {
        console.error('Error en el login:', err);
        this.errorMessage = 'Usuario o contraseña incorrectos. Por favor, intente de nuevo.';
      }
    });
  }

  private redirectUser(user: DecodedToken | null): void {
    if (user) {
      console.log('Roles del usuario:', user.roles);

      // Verificar roles sin el prefijo ROLE_
      if (user.roles.includes('ASESOR') || user.roles.includes('ROLE_ASESOR')) {
        console.log('Redirigiendo a asesor-dashboard');
        this.router.navigate(['/asesor-dashboard']).then(success => {
          console.log('Navegación exitosa:', success);
        });
      } else if (user.roles.includes('CLIENTE') || user.roles.includes('ROLE_CLIENTE')) {
        console.log('Redirigiendo a cliente-dashboard');
        this.router.navigate(['/cliente-dashboard']).then(success => {
          console.log('Navegación exitosa:', success);
        });
      } else {
        // Fallback por si el usuario no tiene un rol esperado
        console.log('Sin rol reconocido, redirigiendo a home');
        this.router.navigate(['/home']);
      }
    } else {
      console.log('Usuario no autenticado, redirigiendo a home');
      this.router.navigate(['/home']);
    }
  }
}
