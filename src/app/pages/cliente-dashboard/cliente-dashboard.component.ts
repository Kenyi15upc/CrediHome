import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cliente } from '../../models/cliente';
import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
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
    private clienteService: ClienteService
  ) {
    this.currentUser = this.authService.currentUserValue;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadClienteData();
  }

  initForm(): void {
    // El formulario se inicializa vacío. El correo del usuario logueado se usará como referencia.
    this.clienteForm = this.fb.group({
      nombre: ['', Validators.required],
      dni: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      ingresoMensual: [null, [Validators.required, Validators.min(0)]],
      gastoMensual: [null, [Validators.required, Validators.min(0)]],
      ocupacion: ['', Validators.required]
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

    this.clienteService.getClienteByUserId(this.currentUser.id).subscribe({
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
      // El backend debe asociar este nuevo cliente con el ID del usuario autenticado
      this.clienteService.createCliente(formValue).subscribe({
        next: (clienteNuevo) => {
          this.cliente = clienteNuevo;
          this.isEditMode = true; // Se cambia a modo edición
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
}
