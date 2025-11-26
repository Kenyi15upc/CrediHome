import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService} from '../../services/auth.service';
import { CommonModule } from '@angular/common';

function MustMatch(controlName: string, matchingControlName: string) {
  return (formGroup: FormGroup) => {
    const control = formGroup.controls[controlName];
    const matchingControl = formGroup.controls[matchingControlName];

    if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
      return;
    }

    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ mustMatch: true });
    } else {
      matchingControl.setErrors(null);
    }
  };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  submitted = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['CLIENTE', Validators.required]
    }, {
      validator: MustMatch('password', 'confirmPassword')
    });
  }

  get f() { return this.registerForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;
    this.successMessage = null;

    if (this.registerForm.invalid) {
      return;
    }

    const userPayload = {
      id: 0,
      username: this.f['username'].value,
      password: this.f['password'].value,
      roles: [
        {
          id: 0,
          name: this.f['role'].value
        }
      ]
    };

    this.authService.register(userPayload).subscribe({
      next: () => {
        this.successMessage = '¡Registro exitoso! Ahora puedes iniciar sesión.';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        console.error('Error en el registro:', err);
        if (err.status === 409 || (err.error && err.error.message && err.error.message.includes('constraint'))) {
          this.errorMessage = 'El nombre de usuario ya existe. Por favor, elige otro.';
        } else if (err.status === 403) {
          this.errorMessage = 'Acción prohibida. Verifica que los datos enviados son correctos.';
        } else {
          this.errorMessage = 'Ocurrió un error durante el registro. Por favor, intenta de nuevo.';
        }
      }
    });
  }
}
