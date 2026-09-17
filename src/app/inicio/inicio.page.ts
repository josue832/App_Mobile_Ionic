import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, notificationsOutline, addOutline, createOutline } from 'ionicons/icons';

interface Comida {
  nombre: string;
  hora: string;
  kcal: number;
  porcentajeMeta: number;
  proteina: number;
  carbohidratos: number;
  grasa: number;
}

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonIcon],
})
export class InicioPage {

  fecha = '20 Ago';
  metaKcal = 2000;
  consumidoKcal = 1250;

  get porcentaje(): number {
    return Math.round((this.consumidoKcal / this.metaKcal) * 100);
  }

  // Datos de ejemplo — se conectarán a la API más adelante
  comidas: Comida[] = [
    { nombre: 'Almuerzo', hora: '02:30 PM', kcal: 693, porcentajeMeta: 35, proteina: 48, carbohidratos: 83, grasa: 25 },
    { nombre: 'Desayuno', hora: '11:30 AM', kcal: 500, porcentajeMeta: 25, proteina: 36, carbohidratos: 57, grasa: 14 },
  ];

  constructor() {
    addIcons({ calendarOutline, notificationsOutline, addOutline, createOutline });
  }
}
