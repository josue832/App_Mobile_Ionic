import { Injectable } from '@angular/core';
import axios from 'axios';
import { ApiConfigService } from './api-config.service';
import { ApiErrorService, TipoError } from './api-error.service';
import { CacheService } from './cache.service';

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

// Un ingrediente de una receta (tabla `receta_ingredientes`)
export interface Ingrediente {
  id: number;
  nombre: string;
  cantidad: string | null;
}

// Un paso de preparación de una receta (tabla `receta_pasos`)
export interface Paso {
  id: number;
  numero_paso: number;
  descripcion: string;
}

// Receta completa, tal como la regresa la API cuando se pide por `?id=`:
// incluye la receta base más sus ingredientes y pasos anidados
export interface RecetaDetalle extends Receta {
  ingredientes: Ingrediente[];
  pasos: Paso[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  // Campos opcionales que agrega la app (no vienen de la API)
  tipoError?: TipoError;   // qué clase de fallo fue, si success = false
  desdeCache?: boolean;    // true si los datos vienen del almacenamiento local
  guardadoEn?: string;     // fecha ISO de cuándo se guardaron esos datos
}

@Injectable({
  providedIn: 'root',
})
export class RecetasService {

  constructor(
    private apiConfig: ApiConfigService,
    private apiError: ApiErrorService,
    private cache: CacheService
  ) {}

  // Las URLs se arman en cada llamada con la IP que se escribió en el login
  private get API_URL_RECETAS(): string {
    return this.apiConfig.url('Recetas.php');
  }

  private get API_URL_CATEGORIAS(): string {
    return this.apiConfig.url('Categorias.php');
  }

  obtenerCategorias(): Promise<ApiResponse<Categoria[]>> {
    return this.conCache<Categoria[]>('categorias', [], () =>
      axios
        .get<ApiResponse<Categoria[]>>(this.API_URL_CATEGORIAS, { timeout: this.apiConfig.timeoutMs })
        .then((res) => res.data)
    );
  }

  obtenerRecetas(categoriaId?: number): Promise<ApiResponse<Receta[]>> {
    return this.conCache<Receta[]>(`recetas_${categoriaId ?? 'todas'}`, [], () =>
      axios
        .get<ApiResponse<Receta[]>>(this.API_URL_RECETAS, {
          params: categoriaId ? { categoria_id: categoriaId } : {},
          timeout: this.apiConfig.timeoutMs,
        })
        .then((res) => res.data)
    );
  }

  // Al pedir una receta por id, la API regresa también sus ingredientes y pasos anidados
  obtenerReceta(id: number): Promise<ApiResponse<RecetaDetalle | null>> {
    return this.conCache<RecetaDetalle | null>(`receta_${id}`, null, () =>
      axios
        .get<ApiResponse<RecetaDetalle>>(this.API_URL_RECETAS, { params: { id }, timeout: this.apiConfig.timeoutMs })
        .then((res) => res.data)
    );
  }

  // Estrategia "red primero, caché de respaldo":
  //  1. Se pide a la API. Si responde bien, se guarda una copia local y se devuelve.
  //  2. Si falla por conexión o por un error del servidor (5xx), se busca la copia local.
  //     Si existe, se devuelve marcada con desdeCache = true.
  //  3. Si no hay copia (o el error es de la petición, ej. 404), se devuelve el error con un mensaje claro.
  private async conCache<T>(
    clave: string,
    vacio: T,
    peticion: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
    try {
      const res = await peticion();
      if (res.success && res.data != null) {
        await this.cache.guardar(clave, res.data);
      }
      return res;
    } catch (err) {
      const info = this.apiError.clasificar(err);

      if (info.usaCache) {
        const guardado = await this.cache.leer<T>(clave);
        if (guardado) {
          return {
            success: true,
            message: info.mensaje,
            data: guardado.data,
            desdeCache: true,
            guardadoEn: guardado.guardadoEn,
          };
        }
      }

      return { success: false, message: info.mensaje, data: vacio, tipoError: info.tipo };
    }
  }
}