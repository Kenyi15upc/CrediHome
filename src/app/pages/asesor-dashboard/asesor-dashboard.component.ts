import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Cliente } from '../../models/cliente';
import { Credito } from '../../models/credito';
import { IndicadorFinanciero } from '../../models/indicador-financiero';
import { PlanPago } from '../../models/plan-pago';
import { UnidadInmobiliaria } from '../../models/unidad-inmobiliaria';
import { Asesor } from '../../models/asesor';
import { ClienteService } from '../../services/cliente.service';
import { CreditoService } from '../../services/credito.service';
import { UnidadInmobiliariaService } from '../../services/unidad-inmobiliaria.service';
import { AsesorService } from '../../services/asesor.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-asesor-dashboard',
  templateUrl: './asesor-dashboard.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe, PercentPipe],
  styleUrls: ['./asesor-dashboard.component.css']
})
export class AsesorDashboardComponent implements OnInit {

  // Estados de la UI
  showNuevoClienteForm = false;
  showNuevaUnidadForm = false;
  isLoading = true;

  // Datos
  clientes: Cliente[] = [];
  unidades: UnidadInmobiliaria[] = [];
  selectedCliente: Cliente | null = null;
  currentAsesor: Asesor | null = null;

  // --- PROPIEDADES RESTAURADAS ---
  savedCredito: Credito | null = null;
  planDePagos: PlanPago[] = [];
  indicadores: IndicadorFinanciero | null = null;

  // Formularios
  asesorForm!: FormGroup;
  clienteForm!: FormGroup;
  unidadForm!: FormGroup;
  creditoForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private creditoService: CreditoService,
    private unidadService: UnidadInmobiliariaService,
    private asesorService: AsesorService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initAsesorForm();
    this.initClienteForm();
    this.initUnidadForm();
    this.initCreditoForm();
    this.loadAsesorProfile();
  }

  loadAsesorProfile(): void {
    this.isLoading = true;
    const currentUser = this.authService.currentUserValue;

    if (currentUser && currentUser.sub) {
      this.asesorService.getAsesorByEmail(currentUser.sub).subscribe({
        next: (asesor) => {
          this.currentAsesor = asesor;
          this.loadClientes();
          this.loadUnidades();
          this.isLoading = false;
        },
        error: (err) => {
          if (err.status === 404) {
            console.log("Perfil de asesor no encontrado. Mostrando formulario de creación.");
            this.isLoading = false;
          } else {
            console.error("Error cargando el perfil del asesor:", err);
            this.isLoading = false;
          }
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  // --- MÉTODOS RESTAURADOS Y COMPLETOS ---

  initAsesorForm(): void {
    const currentUser = this.authService.currentUserValue;
    this.asesorForm = this.fb.group({
      nombreA: ['', Validators.required],
      dniA: ['', Validators.required],
      telefonoA: ['', Validators.required],
      correoA: [{ value: currentUser?.sub || '', disabled: true }, Validators.required],
      estadoA: [true]
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
      unidadInmobiliaria: [null, Validators.required],
      moneda: ['SOLES', Validators.required],
      montoPrestamo: [null, [Validators.required, Validators.min(1)]],
      plazoMeses: [null, [Validators.required, Validators.min(1)]],
      tasaInteres: [null, [Validators.required, Validators.min(0)]],
      tipoTasa: ['EFECTIVA', Validators.required],
      capitalizacion: ['MENSUAL'],
      fechaInicio: [new Date().toISOString().split('T')[0], Validators.required],
      graciaTotal: [0, Validators.required],
      graciaParcial: [0, Validators.required],
      Bono: [0]
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

  onSaveAsesor(): void {
    if (this.asesorForm.invalid) return;
    const asesorPayload = this.asesorForm.getRawValue();
    this.asesorService.createAsesor(asesorPayload).subscribe({
      next: (newAsesor) => {
        this.currentAsesor = newAsesor;
        console.log("Perfil de asesor creado con éxito.");
      },
      error: (err) => console.error("Error al crear el perfil de asesor:", err)
    });
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
    if (this.unidadForm.invalid || !this.currentAsesor) {
      console.error('Formulario de unidad inválido o el perfil del asesor no está cargado.');
      return;
    }
    const unidadPayload = { ...this.unidadForm.value, asesor: this.currentAsesor };
    this.unidadService.createUnidad(unidadPayload).subscribe({
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
      fechaInicio: new Date().toISOString().split('T')[0],
      graciaTotal: 0,
      graciaParcial: 0,
      Bono: 0
    });
  }

  onSaveCredito(): void {
    if (this.creditoForm.invalid || !this.selectedCliente) {
      return;
    }
    const formValue = this.creditoForm.value;
    const selectedUnidad = this.unidades.find(u => u.idUnidad == formValue.unidadInmobiliaria);
    if (!selectedUnidad) {
      return;
    }
    const creditoPayload: Credito = {
      ...formValue,
      cliente: this.selectedCliente,
      unidadInmobiliaria: selectedUnidad
    };
    this.creditoService.createCredito(creditoPayload).pipe(
      tap(creditoGuardado => { this.savedCredito = creditoGuardado; }),
      switchMap(creditoGuardado =>
        this.creditoService.generarPlanDePagos(creditoGuardado.idCredito, formValue.graciaTotal, formValue.graciaParcial).pipe(
          tap(plan => { this.planDePagos = plan; }),
          switchMap(plan => this.creditoService.calcularIndicadores(creditoGuardado.idCredito, plan))
        )
      )
    ).subscribe({
      next: indicadoresCalculados => { this.indicadores = indicadoresCalculados; },
      error: err => { console.error('Error en la secuencia de simulación:', err); }
    });
  }
}
