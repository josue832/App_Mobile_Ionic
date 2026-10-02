import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const PREFIJO = 'cache_';

export interface EntradaCache<T> {
  data: T;
  // Fecha ISO de cuándo se guardó, para avisar "datos guardados el ..."
  guardadoEn: string;
}

// Almacenamiento temporal de respuestas de la API, para poder mostrarlas sin conexión.
// Usa Capacitor Preferences (el mismo que ya usa PhotoService), que persiste
// aunque se cierre la app.
@Injectable({
  providedIn: 'root',
})
export class CacheService {

  async guardar<T>(clave: string, data: T): Promise<void> {
    const entrada: EntradaCache<T> = { data, guardadoEn: new Date().toISOString() };
    try {
      await Preferences.set({ key: PREFIJO + clave, value: JSON.stringify(entrada) });
    } catch (e) {
      // Si falla el guardado no se rompe la app: simplemente no habrá respaldo
      console.warn('[Caché] No se pudo guardar', clave, e);
    }
  }

  async leer<T>(clave: string): Promise<EntradaCache<T> | null> {
    try {
      const { value } = await Preferences.get({ key: PREFIJO + clave });
      return value ? (JSON.parse(value) as EntradaCache<T>) : null;
    } catch (e) {
      console.warn('[Caché] No se pudo leer', clave, e);
      return null;
    }
  }

  // Borra solo lo que guardó este servicio (no toca las fotos ni otras preferencias)
  async limpiar(): Promise<void> {
    try {
      const { keys } = await Preferences.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith(PREFIJO)).map((key) => Preferences.remove({ key }))
      );
    } catch (e) {
      console.warn('[Caché] No se pudo limpiar', e);
    }
  }
}
