import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cliente } from '../../models/cliente';
import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { DecodedToken} from '../../models/auth';

@Component({
  selector: 'app-cliente-dashboard',
  templateUrl: './cliente-dashboard.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: ['./cliente-dashboard.component.css']
})
export class ClienteDashboardComponent implements OnInit {
  activeTab: 'perfil-usuario' | 'mis-datos' | 'simulaciones' = 'perfil-usuario';

  perfilUsuarioForm!: FormGroup;
  clienteForm!: FormGroup;
  cliente: Cliente | null = null;
  currentUser: DecodedToken | null;
  isLoading = true;
  isEditMode = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private clienteService: ClienteService,
    private userService: UserService
  ) {
    this.currentUser = this.authService.currentUserValue;
  }

  ngOnInit(): void {
    this.initPerfilUsuarioForm();
    this.initForm();
    this.loadUserProfile();
    this.loadClienteData();
  }

  loadUserProfile(): void {
    if (this.currentUser && this.currentUser.sub) {
      this.userService.getUserProfile(parseInt(this.currentUser.sub)).subscribe({
        next: (user) => {
          this.perfilUsuarioForm.patchValue({
            nombre: user.nombre || '',
            apellidos: user.apellidos || '',
            email: user.email || ''
          });
        },
        error: (err) => console.error('Error al cargar perfil:', err)
      });
    }
  }

  initPerfilUsuarioForm(): void {
    this.perfilUsuarioForm = this.fb.group({
      username: [{ value: this.currentUser?.username || '', disabled: true }],
      nombre: [''],
      apellidos: [''],
      email: [''],
      newPassword: ['', Validators.minLength(8)],
      confirmPassword: ['']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
    const newPassword = formGroup.get('newPassword')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ mustMatch: true });
      return { mustMatch: true };
    }
    return null;
  }

  actualizarPerfilUsuario(): void {
    if (this.perfilUsuarioForm.invalid) {
      return;
    }

    const formValue = this.perfilUsuarioForm.getRawValue();

    if (!this.currentUser || !this.currentUser.sub) {
      this.errorMessage = 'No se pudo identificar el usuario';
      return;
    }

    const updateData: any = {
      nombre: formValue.nombre,
      apellidos: formValue.apellidos,
      email: formValue.email || null
    };

    if (formValue.newPassword) {
      updateData.password = formValue.newPassword;
    }

    this.userService.updateUserProfile(parseInt(this.currentUser.sub), updateData).subscribe({
      next: () => {
        this.successMessage = '¡Perfil de usuario actualizado exitosamente!';
        this.errorMessage = null;

        this.perfilUsuarioForm.patchValue({
          newPassword: '',
          confirmPassword: ''
        });

        setTimeout(() => {
          this.successMessage = null;
        }, 5000);
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.errorMessage = 'Error al actualizar el perfil de usuario';
        this.successMessage = null;
      }
    });
  }

  initForm(): void {
    // El formulario se inicializa vacío. El correo del usuario logueado se usará como referencia.
    this.clienteForm = this.fb.group({
      nombre: ['', Validators.required],
      apellidos: [''],
      dni: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8)]],
      telefono: [''],
      email: ['', Validators.email],
      correo: ['', Validators.email],
      direccion: [''],
      ocupacion: [''],
      ingresoMensual: [null, Validators.min(0)],
      gastoMensual: [null, Validators.min(0)]
    });
  }


  loadClienteData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    if (!this.currentUser) {
      this.errorMessage = "No se pudo identificar al usuario. Por favor, inicie sesión de nuevo.";
      this.isLoading = false;
      return;
    }

    // El 'sub' del token contiene el ID del usuario
    const userId = parseInt(this.currentUser.sub);

    if (isNaN(userId)) {
      this.errorMessage = "ID de usuario inválido.";
      this.isLoading = false;
      return;
    }

    this.clienteService.getClienteByUserId(userId).subscribe({
      next: (clienteEncontrado) => {
        // Si se encuentra, se cargan los datos y se pasa a modo edición
        this.cliente = clienteEncontrado;
        this.clienteForm.patchValue(this.cliente);
        this.isEditMode = true;
        this.isLoading = false;
      },
      error: (err) => {
        // Si el backend devuelve 404, significa que no tiene perfil y debe crearlo
        if (err.status === 404) {
          this.isEditMode = false;
          this.isLoading = false;
          console.log(`No se encontró perfil para el usuario ID. Mostrando formulario de creación.`);
        } else {
          // Otro tipo de error
          console.error('Error al cargar datos del cliente:', err);
          this.errorMessage = "Ocurrió un error al cargar tu información. Inténtalo más tarde.";
          this.isLoading = false;
        }
      }
    });
  }

  onSubmit(): void {
    if (this.clienteForm.invalid) {
      return;
    }

    this.successMessage = null;
    this.errorMessage = null;
    const formValue = this.clienteForm.getRawValue();

    if (this.isEditMode && this.cliente) {
      // --- MODO ACTUALIZACIÓN ---
      this.clienteService.updateCliente(this.cliente.idCliente, formValue).subscribe({
        next: (clienteActualizado) => {
          this.cliente = clienteActualizado;
          this.successMessage = "¡Tu información ha sido actualizada con éxito!";
          setTimeout(() => this.successMessage = null, 5000);
        },
        error: (err) => {
          this.errorMessage = "Ocurrió un error al guardar tus cambios.";
          console.error('Error al actualizar el cliente:', err);
        }
      });
    } else {
      // --- MODO CREACIÓN ---
      // Agregar el userId al payload
      const clienteData = {
        ...formValue,
        userId: parseInt(this.currentUser!.sub)
      };

      this.clienteService.createCliente(clienteData).subscribe({
        next: (clienteNuevo) => {
          this.cliente = clienteNuevo;
          this.isEditMode = true;
          this.successMessage = "¡Tu perfil ha sido creado con éxito!";
          setTimeout(() => this.successMessage = null, 5000);
        },
        error: (err) => {
          this.errorMessage = "Ocurrió un error al crear tu perfil.";
          console.error('Error al crear el cliente:', err);
        }
      });
    }
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}
