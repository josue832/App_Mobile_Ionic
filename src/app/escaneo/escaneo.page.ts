import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline } from 'ionicons/icons';

@Component({
  selector: 'app-escaneo',
  templateUrl: './escaneo.page.html',
  styleUrls: ['./escaneo.page.scss'],
  imports: [IonContent, IonIcon],
})
export class EscaneoPage {

  // Globos de calorías de ejemplo — vendrán del análisis de IA / foto real más adelante
  globos = [
    { kcal: 170, top: '18%', left: '20%' },
    { kcal: 110, top: '14%', left: '72%' },
    { kcal: 90, top: '34%', left: '48%' },
  ];

  // Foto de ejemplo (assets/escaneo/demo-plato.jpg) mostrando qué puede escanear el
  // usuario. Cuando se conecte la cámara real, esta imagen se reemplaza por la
  // foto que el usuario tome (esta pantalla es solo la vista de bienvenida/demo).
  imagenDemo = 'assets/escaneo/demo-plato.jpg';

  constructor() {
    addIcons({ cameraOutline });
  }

  // Si la imagen no existe (404), la ocultamos y queda visible el degradado de respaldo
  ocultarImagen(evento: Event) {
    (evento.target as HTMLImageElement).style.display = 'none';
  }
}