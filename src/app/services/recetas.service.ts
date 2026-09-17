import { Injectable } from '@angular/core';
import axios from 'axios';

// Cambia esto por la URL real donde tengas Recetas.php y Categorias.php
// (en el emulador de Android usa http://10.0.2.2/... en vez de localhost)
const API_URL_RECETAS = 'http://localhost/App_Mobile_Ionic/Recetas.php';
const API_URL_CATEGORIAS = 'http://localhost/App_Mobile_Ionic/Categorias.php';

export interface Categoria {
  id: number;
  nombre: string;
  icono: string | null;
}

export interface Receta {
  id: number;
  nombre: string;
  tiempo_min: number;
  dificultad: 'Fácil' | 'Media' | 'Difícil';
  kcal: number;
  imagen: string | null;
  categoria_id: number | null;
  categoria_nombre: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class RecetasService {

  obtenerCategorias(): Promise<ApiResponse<Categoria[]>> {
    return axios
      .get<ApiResponse<Categoria[]>>(API_URL_CATEGORIAS)
      .then((res) => res.data)
      .catch((err) => this.manejarError(err, []));
  }

  obtenerRecetas(categoriaId?: number): Promise<ApiResponse<Receta[]>> {
    return axios
      .get<ApiResponse<Receta[]>>(API_URL_RECETAS, {
        params: categoriaId ? { categoria_id: categoriaId } : {},
      })
      .then((res) => res.data)
      .catch((err) => this.manejarError(err, []));
  }

  obtenerReceta(id: number): Promise<ApiResponse<Receta | null>> {
    return axios
      .get<ApiResponse<Receta>>(API_URL_RECETAS, { params: { id } })
      .then((res) => res.data)
      .catch((err) => this.manejarError(err, null));
  }

  // Si el servidor respondió con un error (400, 404, 500, etc.) axios lo trae en err.response
  private manejarError<T>(err: any, dataPorDefecto: T): ApiResponse<T> {
    if (err.response && err.response.data) {
      return err.response.data as ApiResponse<T>;
    }
    return {
      success: false,
      message: 'No se pudo conectar con el servidor',
      data: dataPorDefecto,
    };
  }
}