import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';

// Aviso reutilizable para estados de conexión / error.
//  - tipo "cache": se están mostrando datos guardados (amarillo)
//  - tipo "error": no se pudo cargar nada (rojo)
// Si `mensaje` viene vacío, no se muestra nada.
@Component({
  selector: 'app-aviso-estado',
  templateUrl: './aviso-estado.component.html',
  styleUrls: ['./aviso-estado.component.scss'],
  imports: [DatePipe],
})
export class AvisoEstadoComponent {
  @Input() tipo: 'cache' | 'error' = 'error';
  @Input() mensaje = '';
  // Fecha ISO de los datos guardados (solo para el tipo "cache")
  @Input() fecha: string | null = null;
  @Input() conReintentar = true;
  @Output() reintentar = new EventEmitter<void>();
}
