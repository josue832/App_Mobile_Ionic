import { Injectable } from '@angular/core';
import { ConexionService } from './conexion.service';

export type TipoError =
  | 'sin-red'       // el celular no tiene red (modo avión, sin Wi-Fi)
  | 'sin-servidor'  // hay red, pero no se llega al servidor (IP mal, Apache apagado, otra red)
  | 'timeout'       // el servidor no respondió a tiempo
  | 'servidor'      // el servidor respondió con error 5xx (ej. falla la BD)
  | 'peticion'      // el servidor respondió con error 4xx (datos inválidos, no encontrado...)
  | 'desconocido';

export interface ErrorClasificado {
  tipo: TipoError;
  // Mensaje listo para mostrar a la persona usuaria
  mensaje: string;
  // true si tiene sentido mostrar datos guardados (problema de conexión o del servidor)
  usaCache: boolean;
}

// Convierte cualquier error de axios en un tipo + un mensaje claro.
// Centraliza lo que antes se repetía (con un mensaje genérico) en cada servicio.
@Injectable({
  providedIn: 'root',
})
export class ApiErrorService {

  constructor(private conexion: ConexionService) {}

  clasificar(err: any): ErrorClasificado {

    // 1) El servidor sí respondió, pero con un código de error
    if (err?.response) {
      const status: number = err.response.status;
      const datos = err.response.data;
      const mensajeServidor =
        datos && typeof datos === 'object' && typeof datos.message === 'string' ? datos.message : null;

      if (status >= 500) {
        // El detalle técnico (ej. error de MySQL) va a la consola, no a la pantalla
        console.error('[API] Error del servidor', status, datos);
        return {
          tipo: 'servidor',
          mensaje: `El servidor tuvo un problema (error ${status}). Intenta de nuevo en unos minutos.`,
          usaCache: true,
        };
      }

      if (status === 404 && !mensajeServidor) {
        return {
          tipo: 'peticion',
          mensaje: 'No se encontró el servicio (404). Verifica la IP del servidor y que la carpeta App_Mobile_Ionic esté en htdocs.',
          usaCache: false,
        };
      }

      // 4xx con mensaje de la API (ej. "Credenciales incorrectas", "Receta no encontrada")
      return {
        tipo: 'peticion',
        mensaje: mensajeServidor ?? `No se pudo procesar la solicitud (error ${status}).`,
        usaCache: false,
      };
    }

    // 2) No hubo respuesta: el celular no tiene red
    if (!this.conexion.online()) {
      return {
        tipo: 'sin-red',
        mensaje: 'Sin conexión a internet. Revisa tu Wi-Fi o tus datos móviles.',
        usaCache: true,
      };
    }

    // 3) Hay red, pero el servidor tardó demasiado
    if (err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT') {
      return {
        tipo: 'timeout',
        mensaje: 'El servidor tardó demasiado en responder. Verifica que la IP sea correcta y que estés en la misma red que la laptop.',
        usaCache: true,
      };
    }

    // 4) Hay red, pero no se llegó al servidor
    if (err?.code === 'ERR_NETWORK' || err?.request) {
      return {
        tipo: 'sin-servidor',
        mensaje: 'No se pudo llegar al servidor. Verifica la IP, que Apache esté encendido y que estés en la misma red que la laptop.',
        usaCache: true,
      };
    }

    console.error('[API] Error desconocido', err);
    return {
      tipo: 'desconocido',
      mensaje: 'Ocurrió un error inesperado. Intenta de nuevo.',
      usaCache: false,
    };
  }
}
