import { Component, OnInit, effect, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonSearchbar, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  starOutline,
  timeOutline,
  leafOutline,
  fishOutline,
  fastFoodOutline,
  appsOutline,
} from 'ionicons/icons';
import { RecetasService, Categoria, Receta } from '../services/recetas.service';
import { ConexionService } from '../services/conexion.service';
import { AvisoEstadoComponent } from '../aviso-estado/aviso-estado.component';

// Categoría virtual (no existe en la BD): representa "sin filtro"
const CATEGORIA_TODAS: Categoria = { id: 0, nombre: 'Todas', icono: 'appsOutline' };

@Component({
  selector: 'app-recetas',
  templateUrl: './recetas.page.html',
  styleUrls: ['./recetas.page.scss'],
  imports: [IonContent, IonSearchbar, IonIcon, AvisoEstadoComponent],
})
export class RecetasPage implements OnInit {

  categorias: Categoria[] = [CATEGORIA_TODAS];
  categoriaActivaId = CATEGORIA_TODAS.id;

  recetas: Receta[] = [];
  cargando = false;

  // Aviso de conexión / error (vacío = no se muestra)
  avisoTipo: 'cache' | 'error' = 'error';
  avisoMensaje = '';
  avisoFecha: string | null = null;

  constructor(
    private recetasService: RecetasService,
    private router: Router,
    private conexion: ConexionService
  ) {
    addIcons({
      notificationsOutline,
      starOutline,
      timeOutline,
      leafOutline,
      fishOutline,
      fastFoodOutline,
      appsOutline,
    });

    // Si había un aviso (error o datos guardados) y regresa la red, se recarga solo
    effect(() => {
      const online = this.conexion.online();
      if (online && this.avisoMensaje) {
        untracked(() => this.recargar());
      }
    });
  }

  ngOnInit() {
    this.cargarCategorias();
    this.cargarRecetas();
  }

  recargar() {
    this.cargarCategorias();
    this.cargarRecetas();
  }

  async cargarCategorias() {
    const res = await this.recetasService.obtenerCategorias();
    if (res.success) {
      this.categorias = [CATEGORIA_TODAS, ...res.data];
    }
  }

  async cargarRecetas() {
    this.cargando = true;
    // "Todas" tiene id 0 en el front → no se manda filtro, la API regresa todo
    const filtro = this.categoriaActivaId || undefined;
    const res = await this.recetasService.obtenerRecetas(filtro);
    this.cargando = false;

    if (res.success) {
      this.recetas = res.data;
      if (res.desdeCache) {
        // Sin conexión: se muestran las recetas guardadas y se explica por qué
        this.avisoTipo = 'cache';
        this.avisoMensaje = res.message;
        this.avisoFecha = res.guardadoEn ?? null;
      } else {
        this.avisoMensaje = '';
        this.avisoFecha = null;
      }
    } else {
      // Falló y no hay copia guardada: no se deja a la vista una lista de otra categoría
      this.recetas = [];
      this.avisoTipo = 'error';
      this.avisoMensaje = res.message;
      this.avisoFecha = null;
    }
  }

  elegirCategoria(categoria: Categoria) {
    this.categoriaActivaId = categoria.id;
    this.cargarRecetas();
  }

  // Abre la pantalla de detalle de la receta seleccionada
  verDetalle(receta: Receta) {
    this.router.navigate(['/tabs/recetas', receta.id]);
  }

  // Imagen local en assets/, nombrada por id: assets/recetas/receta-{id}.jpg
  rutaImagen(receta: Receta): string {
    return `assets/recetas/receta-${receta.id}.jpg`;
  }

  // Si la imagen no existe (404), la ocultamos y queda visible el degradado de respaldo
  ocultarImagen(evento: Event) {
    (evento.target as HTMLImageElement).style.display = 'none';
  }
}