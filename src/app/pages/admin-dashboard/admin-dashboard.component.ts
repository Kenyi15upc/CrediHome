import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

interface ConfiguracionSistema {
  monedaPorDefecto: string;
  tipoTasaDefecto: string;
  capitalizacionDefecto: string;
  graciaTotalMaxima: number;
  graciaParcialMaxima: number;
}

interface EntidadFinanciera {
  id?: number;
  nombre: string;
  codigo: string;
  activa: boolean;
  tasaMinima?: number;
  tasaMaxima?: number;
  montoMinimo?: number;
  montoMaximo?: number;
  plazoMinimo?: number;
  plazoMaximo?: number;
  aceptaBonoTechoPropio: boolean;
}

interface Usuario {
  id: number;
  username: string;
  email?: string;
  enabled: boolean;
  roles: string[];
  createdAt: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  activeTab: 'perfil' | 'usuarios' | 'configuracion' | 'entidades' = 'perfil';

  perfilForm!: FormGroup;
  configForm!: FormGroup;
  configuracion: ConfiguracionSistema | null = null;

  // Entidades Financieras
  entidadForm!: FormGroup;
  entidades: EntidadFinanciera[] = [];
  editingEntidad: EntidadFinanciera | null = null;

  // Usuarios
  usuarioForm!: FormGroup;
  usuarios: Usuario[] = [];
  editingUsuario: Usuario | null = null;

  loading = false;
  message: { type: 'success' | 'error', text: string } | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadUserProfile();
    this.loadConfiguracion();
    this.loadEntidades();
    this.loadUsuarios();
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

  initForms(): void {
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

    this.configForm = this.fb.group({
      monedaPorDefecto: ['PEN', Validators.required],
      tipoTasaDefecto: ['EFECTIVA', Validators.required],
      capitalizacionDefecto: ['MENSUAL', Validators.required],
      graciaTotalMaxima: [12, [Validators.required, Validators.min(0)]],
      graciaParcialMaxima: [24, [Validators.required, Validators.min(0)]]
    });

    this.entidadForm = this.fb.group({
      nombre: ['', Validators.required],
      codigo: ['', Validators.required],
      activa: [true],
      tasaMinima: [null, Validators.min(0)],
      tasaMaxima: [null, Validators.min(0)],
      montoMinimo: [null, Validators.min(0)],
      montoMaximo: [null, Validators.min(0)],
      plazoMinimo: [null, Validators.min(0)],
      plazoMaximo: [null, Validators.min(0)],
      aceptaBonoTechoPropio: [true]
    });

    this.usuarioForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.minLength(8)]],
      email: ['', Validators.email],
      role: ['ROLE_ASESOR', Validators.required],
      enabled: [true]
    });
  }

  // ==================== CONFIGURACIÓN ====================

  loadConfiguracion(): void {
    // TODO: Implementar servicio para obtener configuración
    this.configuracion = {
      monedaPorDefecto: 'PEN',
      tipoTasaDefecto: 'EFECTIVA',
      capitalizacionDefecto: 'MENSUAL',
      graciaTotalMaxima: 12,
      graciaParcialMaxima: 24
    };
    this.configForm.patchValue(this.configuracion);
  }

  saveConfiguracion(): void {
    if (this.configForm.invalid) {
      this.showMessage('error', 'Por favor, completa todos los campos correctamente');
      return;
    }

    this.loading = true;
    // TODO: Implementar servicio para guardar configuración
    setTimeout(() => {
      this.configuracion = this.configForm.value;
      this.showMessage('success', 'Configuración guardada exitosamente');
      this.loading = false;
    }, 500);
  }

  // ==================== ENTIDADES FINANCIERAS ====================

  loadEntidades(): void {
    // TODO: Implementar servicio para obtener entidades
    this.entidades = [
      {
        id: 1,
        codigo: 'BCP',
        nombre: 'Banco de Crédito del Perú',
        activa: true,
        tasaMinima: 6.5,
        tasaMaxima: 12.0,
        montoMinimo: 50000,
        montoMaximo: 500000,
        plazoMinimo: 60,
        plazoMaximo: 240,
        aceptaBonoTechoPropio: true
      }
    ];
  }

  editEntidad(entidad: EntidadFinanciera): void {
    this.editingEntidad = entidad;
    this.entidadForm.patchValue(entidad);
  }

  cancelEditEntidad(): void {
    this.editingEntidad = null;
    this.entidadForm.reset({
      activa: true,
      aceptaBonoTechoPropio: true
    });
  }

  saveEntidad(): void {
    if (this.entidadForm.invalid) {
      this.showMessage('error', 'Por favor, completa todos los campos requeridos');
      return;
    }

    this.loading = true;
    // TODO: Implementar servicio para guardar entidad
    setTimeout(() => {
      if (this.editingEntidad) {
        const index = this.entidades.findIndex(e => e.id === this.editingEntidad!.id);
        if (index !== -1) {
          this.entidades[index] = { ...this.editingEntidad, ...this.entidadForm.value };
        }
        this.showMessage('success', 'Entidad actualizada exitosamente');
      } else {
        const newEntidad: EntidadFinanciera = {
          id: this.entidades.length + 1,
          ...this.entidadForm.value
        };
        this.entidades.push(newEntidad);
        this.showMessage('success', 'Entidad creada exitosamente');
      }
      this.cancelEditEntidad();
      this.loading = false;
    }, 500);
  }

  deleteEntidad(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta entidad?')) {
      this.loading = true;
      // TODO: Implementar servicio para eliminar entidad
      setTimeout(() => {
        this.entidades = this.entidades.filter(e => e.id !== id);
        this.showMessage('success', 'Entidad eliminada exitosamente');
        this.loading = false;
      }, 500);
    }
  }

  // ==================== USUARIOS ====================

  loadUsuarios(): void {
    // TODO: Implementar servicio para obtener usuarios
    this.usuarios = [];
  }

  editUsuario(usuario: Usuario): void {
    this.editingUsuario = usuario;
    this.usuarioForm.patchValue({
      username: usuario.username,
      email: usuario.email,
      role: usuario.roles[0] || 'ROLE_ASESOR',
      enabled: usuario.enabled
    });
    // No establecer password al editar
    this.usuarioForm.get('password')?.clearValidators();
    this.usuarioForm.get('password')?.updateValueAndValidity();
  }

  cancelEditUsuario(): void {
    this.editingUsuario = null;
    this.usuarioForm.reset({
      role: 'ROLE_ASESOR',
      enabled: true
    });
    // Restaurar validación de password
    this.usuarioForm.get('password')?.setValidators([Validators.minLength(8)]);
    this.usuarioForm.get('password')?.updateValueAndValidity();
  }

  saveUsuario(): void {
    if (this.usuarioForm.invalid) {
      this.showMessage('error', 'Por favor, completa todos los campos correctamente');
      return;
    }

    this.loading = true;
    const formValue = this.usuarioForm.value;

    if (this.editingUsuario) {
      // TODO: Implementar servicio para actualizar usuario
      setTimeout(() => {
        const index = this.usuarios.findIndex(u => u.id === this.editingUsuario!.id);
        if (index !== -1) {
          this.usuarios[index] = {
            ...this.usuarios[index],
            username: formValue.username,
            email: formValue.email,
            enabled: formValue.enabled,
            roles: [formValue.role]
          };
        }
        this.showMessage('success', 'Usuario actualizado exitosamente');
        this.cancelEditUsuario();
        this.loading = false;
      }, 500);
    } else {
      // TODO: Implementar servicio para crear usuario
      setTimeout(() => {
        const newUsuario: Usuario = {
          id: this.usuarios.length + 1,
          username: formValue.username,
          email: formValue.email,
          enabled: formValue.enabled,
          roles: [formValue.role],
          createdAt: new Date().toISOString()
        };
        this.usuarios.push(newUsuario);
        this.showMessage('success', 'Usuario creado exitosamente');
        this.cancelEditUsuario();
        this.loading = false;
      }, 500);
    }
  }

  toggleUsuarioEstado(usuario: Usuario): void {
    if (confirm(`¿Deseas ${usuario.enabled ? 'deshabilitar' : 'habilitar'} este usuario?`)) {
      this.loading = true;
      // TODO: Implementar servicio para cambiar estado
      setTimeout(() => {
        const index = this.usuarios.findIndex(u => u.id === usuario.id);
        if (index !== -1) {
          this.usuarios[index].enabled = !this.usuarios[index].enabled;
        }
        this.showMessage('success', `Usuario ${usuario.enabled ? 'habilitado' : 'deshabilitado'} exitosamente`);
        this.loading = false;
      }, 500);
    }
  }

  deleteUsuario(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.loading = true;
      // TODO: Implementar servicio para eliminar usuario
      setTimeout(() => {
        this.usuarios = this.usuarios.filter(u => u.id !== id);
        this.showMessage('success', 'Usuario eliminado exitosamente');
        this.loading = false;
      }, 500);
    }
  }

  // ==================== UTILIDADES ====================

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

    this.loading = true;
    const formValue = this.perfilForm.getRawValue();
    const currentUser = this.authService.currentUserValue;

    if (!currentUser || !currentUser.sub) {
      this.showMessage('error', 'No se pudo identificar el usuario');
      this.loading = false;
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
        this.showMessage('success', '¡Perfil actualizado exitosamente!');
        this.perfilForm.patchValue({
          newPassword: '',
          confirmPassword: ''
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.showMessage('error', 'Error al actualizar el perfil');
        this.loading = false;
      }
    });
  }

  showMessage(type: 'success' | 'error', text: string): void {
    this.message = { type, text };
    setTimeout(() => {
      this.message = null;
    }, 5000);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

