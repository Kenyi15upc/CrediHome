import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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
      username: ['', [Validators.required, Validators.minLength(3)]],
      nombre: ['', Validators.required],
      apellidos: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      role: ['ROLE_CLIENTE', Validators.required]
    }, {
      validator: MustMatch('password', 'confirmPassword')
    });
  }

  get f() { return this.registerForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;
    this.successMessage = null;

    // Validar formulario antes de enviar
    if (this.registerForm.invalid) {
      if (this.f['password'].errors?.['minlength']) {
        this.errorMessage = 'La contraseña debe tener al menos 8 caracteres.';
      } else if (this.f['username'].errors?.['required']) {
        this.errorMessage = 'El nombre de usuario es requerido.';
      } else if (this.f['password'].errors?.['required']) {
        this.errorMessage = 'La contraseña es requerida.';
      } else if (this.f['confirmPassword'].errors?.['mustMatch']) {
        this.errorMessage = 'Las contraseñas no coinciden.';
      } else {
        this.errorMessage = 'Por favor, completa todos los campos correctamente.';
      }
      return;
    }

    const selectedRole = this.f['role'].value;

    const userPayload = {
      username: this.f['username'].value,
      nombre: this.f['nombre'].value,
      apellidos: this.f['apellidos'].value || null,
      email: this.f['email'].value,
      password: this.f['password'].value,
      role: selectedRole
    };

    this.authService.register(userPayload).subscribe({
      next: () => {
        this.successMessage = '¡Usuario registrado exitosamente! Ya puedes iniciar sesión.';
        this.registerForm.reset();
        this.submitted = false;
      },
      error: (err) => {
        if (err.status === 409) {
          this.errorMessage = 'El nombre de usuario ya existe. Por favor, elige otro.';
        } else if (err.status === 400) {
          this.errorMessage = 'Datos inválidos. Asegúrate de que el usuario tenga al menos 3 caracteres y la contraseña 8.';
        } else if (err.status === 0) {
          this.errorMessage = 'No se puede conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8080';
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Ocurrió un error durante el registro. Verifica que el backend esté corriendo.';
        }
      }
    });
  }
}
