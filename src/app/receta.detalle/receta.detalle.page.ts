import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  timeOutline,
  flameOutline,
  listOutline,
  createOutline,
  trashOutline,
} from 'ionicons/icons';
import { RecetasService, RecetaDetalle } from '../services/recetas.service';
import { NotasService, NotaReceta } from '../services/notas.service';

@Component({
  selector: 'app-receta-detalle',
  templateUrl: './receta.detalle.page.html',
  styleUrls: ['./receta.detalle.page.scss'],
  imports: [IonContent, IonIcon, FormsModule, DatePipe],
})
export class RecetaDetallePage implements OnInit {

  receta: RecetaDetalle | null = null;
  cargando = false;

  // --- Notas personales (persistencia local, CRUD) ---
  notaGuardada: NotaReceta | null = null;
  notaTexto = '';
  editandoNota = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recetasService: RecetasService,
    private notasService: NotasService
  ) {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'time-outline': timeOutline,
      'flame-outline': flameOutline,
      'list-outline': listOutline,
      'create-outline': createOutline,
      'trash-outline': trashOutline,
    });
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.cargarReceta(id);
      this.cargarNota(id);
    }
  }

  async cargarReceta(id: number) {
    this.cargando = true;
    const res = await this.recetasService.obtenerReceta(id);
    this.cargando = false;

    if (res.success) {
      this.receta = res.data;
    }
  }

  regresar() {
    this.router.navigate(['/tabs/recetas']);
  }

  // Imagen local en assets/, nombrada por id: assets/recetas/receta-{id}.jpg
  rutaImagen(receta: RecetaDetalle): string {
    return `assets/recetas/receta-${receta.id}.jpg`;
  }

  ocultarImagen(evento: Event) {
    (evento.target as HTMLImageElement).style.display = 'none';
  }

  // --- CRUD de la nota personal (guardada en el dispositivo, no en el servidor) ---

  // Leer
  async cargarNota(recetaId: number) {
    this.notaGuardada = await this.notasService.obtenerNota(recetaId);
    this.notaTexto = this.notaGuardada?.texto ?? '';
  }

  iniciarEdicion() {
    this.editandoNota = true;
  }

  cancelarEdicion() {
    this.notaTexto = this.notaGuardada?.texto ?? '';
    this.editandoNota = false;
  }

  // Crear / Actualizar
  async guardarNota() {
    if (!this.receta || !this.notaTexto.trim()) {
      return;
    }
    this.notaGuardada = await this.notasService.guardarNota(this.receta.id, this.notaTexto.trim());
    this.editandoNota = false;
  }

  // Eliminar
  async eliminarNota() {
    if (!this.receta) {
      return;
    }
    await this.notasService.eliminarNota(this.receta.id);
    this.notaGuardada = null;
    this.notaTexto = '';
    this.editandoNota = false;
  }
}