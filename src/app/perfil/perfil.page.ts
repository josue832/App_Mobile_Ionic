import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonModal,
  AlertController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline, trashOutline, informationCircleOutline } from 'ionicons/icons';
import { AuthService, Usuario } from '../services/auth.service';
import { UsuariosService } from '../services/usuarios.service';
import { PerfilFotoService, MetadatoFoto } from '../services/perfil-foto.service';
import { ConexionService } from '../services/conexion.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonIcon,
    IonButton,
    IonModal,
  ],
})
export class PerfilPage {

  formulario: FormGroup;
  usuario: Usuario | null = null;
  foto: string | null = null;
  enviando = false;
  tomandoFoto = false;

  // Modal con los metadatos EXIF de la foto
  metaAbierta = false;
  metadatos: MetadatoFoto[] = [];
  hayExif = true;

  constructor(
    private fb: FormBuilder,
    private alertController: AlertController,
    private authService: AuthService,
    private usuariosService: UsuariosService,
    private perfilFoto: PerfilFotoService,
    private conexion: ConexionService,
    private router: Router
  ) {
    addIcons({ cameraOutline, trashOutline, informationCircleOutline });

    this.formulario = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
    });
  }

  get iniciales(): string {
    return (this.usuario?.nombre ?? '?').trim().charAt(0).toUpperCase();
  }

  // Se ejecuta cada vez que se entra a la pantalla
  async ionViewWillEnter() {
    this.usuario = this.authService.getUsuario();

    if (!this.usuario) {
      this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    this.formulario.reset({
      nombre: this.usuario.nombre,
      email: this.usuario.email,
      password: '',
    });
    this.foto = await this.perfilFoto.cargar(this.usuario.id);
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

  // ---------- Foto ----------
  async tomarFoto() {
    if (!this.usuario || this.tomandoFoto) return;

    this.tomandoFoto = true;
    try {
      this.foto = await this.perfilFoto.tomarYGuardar(this.usuario.id);
    } catch (err: any) {
      // Si el usuario cierra la cámara sin tomar foto no es un error
      const mensaje = String(err?.message ?? err).toLowerCase();
      if (!mensaje.includes('cancel')) {
        await this.mostrarError('No se pudo tomar la foto. Revisa que la app tenga permiso para usar la cámara.');
      }
    } finally {
      this.tomandoFoto = false;
    }
  }

  // Lee los metadatos EXIF de la foto guardada (con exifr) y abre el modal
  async verMetadatos() {
    if (!this.usuario) return;

    try {
      const res = await this.perfilFoto.leerMetadatos(this.usuario.id);
      this.metadatos = res.datos;
      this.hayExif = res.hayExif;
      this.metaAbierta = true;
    } catch {
      await this.mostrarError('No se pudieron leer los metadatos de la foto.');
    }
  }

  async quitarFoto() {
    if (!this.usuario) return;
    await this.perfilFoto.eliminar(this.usuario.id);
    this.foto = null;
  }

  // ---------- Datos del usuario ----------
  async guardar() {
    if (!this.usuario) return;

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (!this.conexion.online()) {
      await this.mostrarError('Sin conexión: no se pueden guardar los cambios hasta que vuelvas a conectarte.');
      return;
    }

    const { nombre, email, password } = this.formulario.value;
    this.enviando = true;

    // Igual que en el CRUD: contraseña vacía = no se cambia
    const res = await this.usuariosService.actualizarUsuario(this.usuario.id, { nombre, email, password });

    this.enviando = false;

    if (res.success) {
      // Se actualiza la sesión guardada para que toda la app vea los datos nuevos
      this.usuario = { id: this.usuario.id, nombre, email };
      this.authService.guardarUsuario(this.usuario);
      this.formulario.patchValue({ password: '' });
      await this.mostrarExito('Tus datos se actualizaron correctamente.');
    } else {
      await this.mostrarError(res.message);
    }
  }
}