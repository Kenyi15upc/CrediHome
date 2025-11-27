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

    if (this.loginForm.invalid) {
      return;
    }

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        setTimeout(() => {
          const user = this.authService.currentUserValue;
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
      if (user.roles.includes('ADMINISTRADOR') || user.roles.includes('ROLE_ADMINISTRADOR')) {
        this.router.navigate(['/admin-dashboard']);
      } else if (user.roles.includes('ASESOR') || user.roles.includes('ROLE_ASESOR')) {
        this.router.navigate(['/asesor-dashboard']);
      } else if (user.roles.includes('CLIENTE') || user.roles.includes('ROLE_CLIENTE')) {
        this.router.navigate(['/cliente-dashboard']);
      } else {
        this.router.navigate(['/home']);
      }
    } else {
      this.router.navigate(['/home']);
    }
  }
}
