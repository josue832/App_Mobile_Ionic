import { Injectable } from '@angular/core';
import axios from 'axios';
import { ApiConfigService } from './api-config.service';
import { ApiErrorService } from './api-error.service';
import { ApiResponse } from './recetas.service';

// Un día de la semana con lo consumido (tabla `comidas`, sumado por fecha)
export interface PuntoDia {
  dia: string;
  kcal: number;
  proteina: number;
  carbohidratos: number;
  grasa: number;
}

// Una receta (tabla `recetas` + nombre de `categorias`)
export interface PuntoReceta {
  nombre: string;
  tiempo_min: number;
  kcal: number;
  categoria: string;
}

// Todo lo que necesita la vista de gráficas en una sola respuesta
export interface DatosGraficas {
  semana: PuntoDia[];        // kcal y macros por día
  metaKcal: number;          // usuarios.meta_kcal
  recetas: PuntoReceta[];    // recetas con tiempo, kcal y categoría
  comidasKcal: number[];     // kcal de cada comida registrada (para el histograma)
}

// true  = datos de ejemplo (todavía no existe el endpoint)
// false = pide los datos a Graficas.php en el servidor
const USAR_DATOS_DEMO = false;

@Injectable({
  providedIn: 'root',
})
export class GraficasService {

  constructor(
    private apiConfig: ApiConfigService,
    private apiError: ApiErrorService
  ) {}

  get esDemo(): boolean {
    return USAR_DATOS_DEMO;
  }

  async obtenerDatos(): Promise<ApiResponse<DatosGraficas | null>> {
    if (USAR_DATOS_DEMO) {
      return { success: true, message: 'Datos de ejemplo', data: this.datosDemo() };
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<ApiResponse<DatosGraficas>>(this.apiConfig.url('Graficas.php'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: this.apiConfig.timeoutMs,
      });
      return res.data;
    } catch (err) {
      const info = this.apiError.clasificar(err);
      return { success: false, message: info.mensaje, data: null, tipoError: info.tipo };
    }
  }

  // Datos de ejemplo con la misma forma que devolverá la API
  private datosDemo(): DatosGraficas {
    return {
      metaKcal: 2000,
      semana: [
        { dia: 'Lun', kcal: 1850, proteina: 95, carbohidratos: 220, grasa: 62 },
        { dia: 'Mar', kcal: 2100, proteina: 110, carbohidratos: 240, grasa: 70 },
        { dia: 'Mié', kcal: 1700, proteina: 88, carbohidratos: 195, grasa: 55 },
        { dia: 'Jue', kcal: 2300, proteina: 120, carbohidratos: 270, grasa: 78 },
        { dia: 'Vie', kcal: 1950, proteina: 100, carbohidratos: 225, grasa: 66 },
        { dia: 'Sáb', kcal: 2450, proteina: 105, carbohidratos: 300, grasa: 85 },
        { dia: 'Dom', kcal: 1600, proteina: 80, carbohidratos: 185, grasa: 50 },
      ],
      recetas: [
        { nombre: 'Bowl de Quinoa y Vegetales', tiempo_min: 45, kcal: 750, categoria: 'Vegano' },
        { nombre: 'Ensalada de Pollo y Aguacate', tiempo_min: 20, kcal: 480, categoria: 'Proteína' },
        { nombre: 'Tacos de lentejas', tiempo_min: 30, kcal: 520, categoria: 'Vegano' },
        { nombre: 'Salmón al horno', tiempo_min: 35, kcal: 610, categoria: 'Proteína' },
        { nombre: 'Barras de avena', tiempo_min: 15, kcal: 220, categoria: 'Snacks' },
        { nombre: 'Hummus con crudités', tiempo_min: 10, kcal: 180, categoria: 'Snacks' },
        { nombre: 'Pechuga a la plancha', tiempo_min: 25, kcal: 420, categoria: 'Proteína' },
        { nombre: 'Curry de garbanzo', tiempo_min: 50, kcal: 680, categoria: 'Vegano' },
        { nombre: 'Palomitas caseras', tiempo_min: 8, kcal: 150, categoria: 'Snacks' },
      ],
      comidasKcal: [
        180, 220, 250, 310, 350, 380, 420, 450, 480, 500, 520, 540, 560, 600, 620,
        650, 680, 693, 720, 750, 780, 820, 860, 900, 950, 1020, 1100, 410, 470, 590,
      ],
    };
  }
}