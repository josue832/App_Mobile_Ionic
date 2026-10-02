import { Component, effect, untracked } from '@angular/core';
import { IonApp, IonRouterOutlet, ToastController } from '@ionic/angular';
import { ConexionService } from './services/conexion.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {

  private toastSinConexion?: HTMLIonToastElement;
  private estabaSinConexion = false;

  // Al inyectar ConexionService aquí, la detección de red arranca junto con la app
  constructor(private conexion: ConexionService, private toastController: ToastController) {
    effect(() => {
      const online = this.conexion.online();
      untracked(() => this.avisarCambio(online));
    });
  }

  // Aviso global: se queda visible mientras no haya red y confirma cuando regresa
  private async avisarCambio(online: boolean) {
    if (!online) {
      this.estabaSinConexion = true;
      this.toastSinConexion = await this.toastController.create({
        message: 'Sin conexión. Se mostrarán los datos guardados cuando existan.',
        position: 'top',
        color: 'warning',
        buttons: [{ text: 'OK', role: 'cancel' }],
      });
      await this.toastSinConexion.present();
      // Si la red volvió mientras se creaba el aviso, se quita
      if (this.conexion.online()) {
        await this.toastSinConexion.dismiss();
      }
    } else if (this.estabaSinConexion) {
      this.estabaSinConexion = false;
      await this.toastSinConexion?.dismiss();
      const toast = await this.toastController.create({
        message: 'Conexión restablecida',
        duration: 2500,
        position: 'top',
        color: 'success',
      });
      await toast.present();
    }
  }
}
