import { Component, OnInit } from '@angular/core';
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

  constructor(private recetasService: RecetasService) {
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
}