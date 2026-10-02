import { Component, OnInit, effect, untracked } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  AlertController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  phonePortraitOutline,
  mailOutline,
  trashOutline,
  createOutline,
  logOutOutline,
} from 'ionicons/icons';
import { UsuariosService, Usuario } from '../services/usuarios.service';
import { AuthService } from '../services/auth.service';
import { ConexionService } from '../services/conexion.service';
import { AvisoEstadoComponent } from '../aviso-estado/aviso-estado.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    AvisoEstadoComponent,
  ],
})
export class Tab1Page implements OnInit {

  formulario: FormGroup;
  usuarios: Usuario[] = [];
  enviando = false;

  // Aviso inline cuando no se pudo cargar la lista (vacío = no se muestra)
  avisoMensaje = '';

  // Para el buscador "obtener uno por id"
  idBuscado: number | null = null;

  // Si hay un id aquí, "enviar" hace PUT (editar) en vez de POST (crear)
  idEditando: number | null = null;
  get editando(): boolean {
    return this.idEditando !== null;
  }

  constructor(
    private fb: FormBuilder,
    private alertController: AlertController,
    private usuariosService: UsuariosService,
    private authService: AuthService,
    private router: Router,
    private conexion: ConexionService
  ) {
    addIcons({
      locationOutline,
      phonePortraitOutline,
      mailOutline,
      trashOutline,
      createOutline,
      logOutOutline,
    });

    this.formulario = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
    });

    // Si la lista no pudo cargar y regresa la red, se vuelve a pedir sola
    effect(() => {
      const online = this.conexion.online();
      if (online && this.avisoMensaje) {
        untracked(() => this.cargarUsuarios());
      }
    });
  }

  ngOnInit() {
    this.cargarUsuarios();
  }

  // ---------- Modales ----------
  private async mostrarExito(mensaje: string) {
    const alert = await this.alertController.create({
      header: 'Éxito',
      message: mensaje,
      cssClass: 'alerta-exito',
      buttons: ['Aceptar'],
    });
    await alert.present();
  }

  private async mostrarError(mensaje: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: mensaje,
      cssClass: 'alerta-error',
      buttons: ['Aceptar'],
    });
    await alert.present();
  }

  private confirmarEliminacion(): Promise<boolean> {
    return new Promise((resolve) => {
      this.alertController
        .create({
          header: 'Confirmar',
          message: '¿Seguro que quieres eliminar este usuario? Esta acción no se puede deshacer.',
          buttons: [
            { text: 'Cancelar', role: 'cancel', handler: () => resolve(false) },
            { text: 'Eliminar', role: 'destructive', handler: () => resolve(true) },
          ],
        })
        .then((alert) => alert.present());
    });
  }

  // ---------- CRUD (todo pasa por UsuariosService) ----------

  async cargarUsuarios() {
    const res = await this.usuariosService.obtenerUsuarios();
    if (res.success) {
      this.usuarios = res.data;
      this.avisoMensaje = '';
    } else {
      // Aviso dentro de la pantalla (con botón Reintentar) en vez de una alerta al abrir la pestaña
      this.avisoMensaje = res.message;
    }
  }

  async buscarPorId() {
    if (!this.idBuscado) {
      await this.mostrarError('Escribe un id para buscar.');
      return;
    }

    const res = await this.usuariosService.obtenerUsuario(this.idBuscado);

    if (res.success && res.data) {
      const u = res.data;
      await this.mostrarExito(
        `Nombre: ${u.nombre}<br>Email: ${u.email}<br>Creado: ${u.creado_en ?? '—'}`
      );
    } else {
      await this.mostrarError(res.message);
    }
  }

  async enviar() {
    const { nombre, email, password } = this.formulario.value;

    // La contraseña solo es obligatoria al crear; al editar puede dejarse vacía
    if (this.formulario.invalid || (!this.editando && !password)) {
      this.formulario.markAllAsTouched();
      return;
    }

    // Guardar requiere servidor: sin conexión se avisa en lugar de intentar y fallar
    if (!this.conexion.online()) {
      await this.mostrarError('Sin conexión: no se pueden guardar usuarios hasta que vuelvas a conectarte.');
      return;
    }

    this.enviando = true;

    const res = this.editando
      ? await this.usuariosService.actualizarUsuario(this.idEditando as number, { nombre, email, password })
      : await this.usuariosService.crearUsuario({ nombre, email, password });

    this.enviando = false;

    if (res.success) {
      await this.mostrarExito(res.message);
      this.cancelarEdicion();
      await this.cargarUsuarios();
    } else {
      await this.mostrarError(res.message);
    }
  }

  editar(usuario: Usuario) {
    this.idEditando = usuario.id ?? null;
    this.formulario.patchValue({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
    });
  }

  cancelarEdicion() {
    this.idEditando = null;
    this.formulario.reset({ nombre: '', email: '', password: '' });
  }

  async eliminar(id: number | undefined) {
    if (!id) return;

    if (!this.conexion.online()) {
      await this.mostrarError('Sin conexión: no se pueden eliminar usuarios hasta que vuelvas a conectarte.');
      return;
    }

    const confirmado = await this.confirmarEliminacion();
    if (!confirmado) return;

    const res = await this.usuariosService.eliminarUsuario(id);

    if (res.success) {
      await this.mostrarExito(res.message);
      if (this.idEditando === id) {
        this.cancelarEdicion();
      }
      await this.cargarUsuarios();
    } else {
      await this.mostrarError(res.message);
    }
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}