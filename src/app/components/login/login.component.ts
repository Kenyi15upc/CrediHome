import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService} from '../../services/auth.service';
import { DecodedToken} from '../../models/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
        console.log('Login exitoso');
        // El servicio ya guarda el token, ahora redirigimos según el rol
        const user = this.authService.currentUserValue;
        this.redirectUser(user);
      },
      error: (err) => {
        console.error('Error en el login:', err);
        // Aquí puedes personalizar el mensaje de error basado en la respuesta del backend
        this.errorMessage = 'Usuario o contraseña incorrectos. Por favor, intente de nuevo.';
      }
    });
  }

  private redirectUser(user: DecodedToken | null): void {
    if (user) {
      if (user.roles.includes('ROLE_ASESOR')) {
        this.router.navigate(['/asesor-dashboard']);
      } else if (user.roles.includes('ROLE_CLIENTE')) {
        this.router.navigate(['/cliente-dashboard']);
      } else {
        // Fallback por si el usuario no tiene un rol esperado
        this.router.navigate(['/home']);
      }
    }
  }
}
