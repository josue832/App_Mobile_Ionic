import { Component, OnInit, inject } from '@angular/core';
import { IonContent, IonIcon, ActionSheetController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline, trash, close } from 'ionicons/icons';
import { EscaneoFotoService, FotoEscaneo } from '../services/escaneo-foto.service';

@Component({
  selector: 'app-escaneo',
  templateUrl: './escaneo.page.html',
  styleUrls: ['./escaneo.page.scss'],
  imports: [IonContent, IonIcon],
})
export class EscaneoPage implements OnInit {

  private escaneoFoto = inject(EscaneoFotoService);
  private alertController = inject(AlertController);
  private actionSheetController = inject(ActionSheetController);

  // Globos de calorías de ejemplo — vendrán del análisis de IA más adelante.
  // Solo se muestran sobre la foto de demostración, nunca sobre una foto real
  // (todavía no hay análisis real que los respalde).
  globos = [
    { kcal: 170, top: '18%', left: '20%' },
    { kcal: 110, top: '14%', left: '72%' },
    { kcal: 90, top: '34%', left: '48%' },
  ];

  // Foto de ejemplo (assets/escaneo/demo-plato.jpg) mostrando qué puede escanear el
  // usuario. En cuanto toma una foto real, esta se reemplaza por la suya.
  imagenDemo = 'assets/escaneo/demo-plato.jpg';

  // Foto real que acaba de tomar el usuario (null = sigue viendo la demo)
  fotoActual: string | null = null;
  tomandoFoto = false;

  get fotos(): FotoEscaneo[] {
    return this.escaneoFoto.fotos();
  }

  constructor() {
    addIcons({ cameraOutline, trash, close });
  }

  async ngOnInit() {
    await this.escaneoFoto.cargarGuardadas();
    const ultima = this.fotos[0];
    if (ultima) {
      this.fotoActual = ultima.webviewPath ?? null;
    }
  }

  // Abre la cámara, guarda la foto en el teléfono y la muestra en la pantalla
  async escanear() {
    if (this.tomandoFoto) return;

    this.tomandoFoto = true;
    try {
      const foto = await this.escaneoFoto.tomarFoto();
      this.fotoActual = foto.webviewPath ?? null;
    } catch (err: any) {
      // Si la persona cierra la cámara sin tomar foto, no es un error real
      const mensaje = String(err?.message ?? err).toLowerCase();
      if (!mensaje.includes('cancel')) {
        await this.mostrarError('No se pudo tomar la foto. Revisa que la app tenga permiso para usar la cámara.');
      }
    } finally {
      this.tomandoFoto = false;
    }
  }

  // Volver a ver una foto anterior de la galería como la foto principal
  verFoto(foto: FotoEscaneo) {
    this.fotoActual = foto.webviewPath ?? null;
  }

  async opcionesFoto(foto: FotoEscaneo, posicion: number) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Foto escaneada',
      buttons: [
        {
          text: 'Eliminar',
          role: 'destructive',
          icon: 'trash',
          handler: async () => {
            await this.escaneoFoto.eliminarFoto(foto, posicion);
            if (this.fotoActual === foto.webviewPath) {
              this.fotoActual = this.fotos[0]?.webviewPath ?? null;
            }
          },
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
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

  // Si la imagen demo no existe (404), la ocultamos y queda visible el degradado de respaldo
  ocultarImagen(evento: Event) {
    (evento.target as HTMLImageElement).style.display = 'none';
  }
}