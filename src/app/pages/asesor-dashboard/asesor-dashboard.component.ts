import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cliente } from '../../models/cliente';
import { Credito } from '../../models/credito';
import { IndicadorFinanciero } from '../../models/indicador-financiero';
import { PlanPago } from '../../models/plan-pago';
import { UnidadInmobiliaria } from '../../models/unidad-inmobiliaria';
import { ClienteService } from '../../services/cliente.service';
import { CreditoService } from '../../services/credito.service';
import { UnidadInmobiliariaService } from '../../services/unidad-inmobiliaria.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-asesor-dashboard',
  templateUrl: './asesor-dashboard.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: ['./asesor-dashboard.component.css']
})
export class AsesorDashboardComponent implements OnInit {
  activeTab: 'perfil' | 'clientes' | 'unidades' | 'simulaciones' = 'perfil';

  showNuevoClienteForm = false;
  showNuevaUnidadForm = false;
  isLoading = true;

  clientes: Cliente[] = [];
  unidades: UnidadInmobiliaria[] = [];
  selectedCliente: Cliente | null = null;
  selectedUnidad: UnidadInmobiliaria | null = null;

  savedCredito: Credito | null = null;
  planDePagos: PlanPago[] = [];
  indicadores: IndicadorFinanciero | null = null;

  perfilForm!: FormGroup;
  clienteForm!: FormGroup;
  unidadForm!: FormGroup;
  creditoForm!: FormGroup;

  successMessage: string | null = null;
  errorMessage: string | null = null;
  currencySymbol: string = 'PEN'; // Código de moneda dinámico (PEN o USD)

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private creditoService: CreditoService,
    private unidadService: UnidadInmobiliariaService,
    private authService: AuthService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.initPerfilForm();
    this.initClienteForm();
    this.initUnidadForm();
    this.initCreditoForm();
    this.loadUserProfile();
    this.loadClientes();
    this.loadUnidades();
    this.isLoading = false;
  }

  get currencyLabel(): string {
    return this.currencySymbol === 'USD' ? '$' : 'S/';
  }

  loadUserProfile(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.sub) {
      this.userService.getUserProfile(parseInt(currentUser.sub)).subscribe({
        next: (user) => {
          this.perfilForm.patchValue({
            nombre: user.nombre || '',
            apellidos: user.apellidos || '',
            email: user.email || ''
          });
        },
        error: (err) => console.error('Error al cargar perfil:', err)
      });
    }
  }

  initPerfilForm(): void {
    const currentUser = this.authService.currentUserValue;

    this.perfilForm = this.fb.group({
      username: [{ value: currentUser?.username || '', disabled: true }],
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

  actualizarPerfil(): void {
    if (this.perfilForm.invalid) {
      return;
    }

    const formValue = this.perfilForm.getRawValue();
    const currentUser = this.authService.currentUserValue;

    if (!currentUser || !currentUser.sub) {
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

    this.userService.updateUserProfile(parseInt(currentUser.sub), updateData).subscribe({
      next: () => {
        this.successMessage = '¡Perfil actualizado exitosamente!';
        this.errorMessage = null;
        this.perfilForm.patchValue({
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          this.successMessage = null;
        }, 5000);
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.errorMessage = 'Error al actualizar el perfil';
        this.successMessage = null;
      }
    });
  }


  initClienteForm(): void {
    this.clienteForm = this.fb.group({
      nombre: ['', Validators.required],
      dni: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      ingresoMensual: [null, Validators.required],
      gastoMensual: [null, Validators.required],
      ocupacion: ['', Validators.required]
    });
  }

  initUnidadForm(): void {
    this.unidadForm = this.fb.group({
      nombre: ['', Validators.required],
      direccion: ['', Validators.required],
      precio: [null, [Validators.required, Validators.min(1)]],
      moneda: ['SOLES', Validators.required],
      estadoU: [true, Validators.required]
    });
  }

  initCreditoForm(): void {
    this.creditoForm = this.fb.group({
      monto: [null, [Validators.required, Validators.min(1)]],
      plazo: [null, [Validators.required, Validators.min(1)]],
      tasaInteres: [null, [Validators.required, Validators.min(0)]],
      tipoTasa: ['EFECTIVA', Validators.required],
      capitalizacion: ['MENSUAL', Validators.required],
      moneda: ['PEN', Validators.required],
      graciaTotal: [0, [Validators.required, Validators.min(0)]],
      graciaParcial: [0, [Validators.required, Validators.min(0)]]
    });

    // Escuchar cambios en el campo moneda
    this.creditoForm.get('moneda')?.valueChanges.subscribe(moneda => {
      this.currencySymbol = moneda; // 'USD' o 'PEN'
    });
  }

  loadClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: (data) => this.clientes = data,
      error: (err) => console.error('Error al cargar clientes:', err)
    });
  }

  loadUnidades(): void {
    this.unidadService.getUnidades().subscribe({
      next: (data) => this.unidades = data,
      error: (err) => console.error('Error al cargar unidades inmobiliarias:', err)
    });
  }

  toggleNuevoClienteForm(): void {
    this.showNuevoClienteForm = !this.showNuevoClienteForm;
    this.clienteForm.reset();
  }

  toggleNuevaUnidadForm(): void {
    this.showNuevaUnidadForm = !this.showNuevaUnidadForm;
    this.unidadForm.reset({ moneda: 'SOLES', estadoU: true });
  }

  onSaveCliente(): void {
    if (this.clienteForm.invalid) return;
    this.clienteService.createCliente(this.clienteForm.value).subscribe({
      next: () => {
        this.loadClientes();
        this.toggleNuevoClienteForm();
      },
      error: (err) => console.error('Error al guardar cliente:', err)
    });
  }

  onSaveUnidad(): void {
    if (this.unidadForm.invalid) {
      console.error('Formulario de unidad inválido.');
      return;
    }
    this.unidadService.createUnidad(this.unidadForm.value).subscribe({
      next: () => {
        this.loadUnidades();
        this.toggleNuevaUnidadForm();
      },
      error: (err) => console.error('Error al guardar la unidad inmobiliaria:', err)
    });
  }

  onSelectCliente(cliente: Cliente): void {
    this.selectedCliente = cliente;
    this.planDePagos = [];
    this.indicadores = null;
    this.savedCredito = null;
    this.creditoForm.reset({
      unidadInmobiliaria: null,
      moneda: 'SOLES',
      tipoTasa: 'EFECTIVA',
      capitalizacion: 'MENSUAL',
      graciaTotal: 0,
      graciaParcial: 0,
      Bono: 0
    });
  }

  onSelectUnidad(unidad: UnidadInmobiliaria): void {
    this.selectedUnidad = unidad;
    if (this.creditoForm) {
      this.creditoForm.patchValue({
        monto: unidad.precio
      });
    }
  }

  onSaveCredito(): void {
    if (this.creditoForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos correctamente';
      return;
    }

    if (!this.selectedCliente) {
      this.errorMessage = 'Debes seleccionar un cliente primero';
      return;
    }

    if (!this.selectedUnidad) {
      this.errorMessage = 'Debes seleccionar una unidad inmobiliaria primero';
      return;
    }

    const formValue = this.creditoForm.value;

    const creditoPayload = {
      clienteId: this.selectedCliente.idCliente,
      unidadInmobiliariaId: this.selectedUnidad.idUnidad,
      moneda: formValue.moneda,
      monto: formValue.monto,
      plazo: formValue.plazo,
      tasaInteres: formValue.tasaInteres,
      tipoTasa: formValue.tipoTasa,
      capitalizacion: formValue.capitalizacion,
      fechaDesembolso: new Date().toISOString().split('T')[0],
      graciaTotal: formValue.graciaTotal || 0,
      graciaParcial: formValue.graciaParcial || 0
    };

    console.log('Guardando crédito:', creditoPayload);

    this.successMessage = '¡Simulación de crédito creada exitosamente! Cliente: ' +
                          this.selectedCliente.nombre + ' - Unidad: ' + this.selectedUnidad.nombre;
    this.errorMessage = null;

    setTimeout(() => {
      this.successMessage = null;
    }, 5000);
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}
