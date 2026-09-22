import { Component, OnInit } from '@angular/core';
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

// Categoría virtual (no existe en la BD): representa "sin filtro"
const CATEGORIA_TODAS: Categoria = { id: 0, nombre: 'Todas', icono: 'appsOutline' };

@Component({
  selector: 'app-recetas',
  templateUrl: './recetas.page.html',
  styleUrls: ['./recetas.page.scss'],
  imports: [IonContent, IonSearchbar, IonIcon],
})
export class RecetasPage implements OnInit {

  categorias: Categoria[] = [CATEGORIA_TODAS];
  categoriaActivaId = CATEGORIA_TODAS.id;

  recetas: Receta[] = [];
  cargando = false;

  constructor(private recetasService: RecetasService, private router: Router) {
    addIcons({
      notificationsOutline,
      starOutline,
      timeOutline,
      leafOutline,
      fishOutline,
      fastFoodOutline,
      appsOutline,
    });
  }

  ngOnInit() {
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