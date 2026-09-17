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

  constructor() {
    addIcons({ cameraOutline });
  }
}
