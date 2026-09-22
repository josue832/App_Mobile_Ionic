import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

// Nota personal guardada localmente en el dispositivo (no se manda al servidor)
export interface NotaReceta {
  texto: string;
  actualizadoEn: string; // fecha ISO
}

const PREFIJO_CLAVE = 'nota_receta_';

@Injectable({
  providedIn: 'root',
})
export class NotasService {

  // Ionic Storage necesita "crearse" (inicializar el driver) antes de usarse;
  // esto se hace una sola vez y se reutiliza en cada llamada
  private listo: Promise<void>;

  constructor(private storage: Storage) {
    this.listo = this.storage.create().then(() => undefined);
  }

  // --- Leer (R) ---
  async obtenerNota(recetaId: number): Promise<NotaReceta | null> {
    await this.listo;
    const valor = await this.storage.get(this.clave(recetaId));
    return valor ?? null;
  }

  // --- Crear y Actualizar (C / U): mismo método, si ya existía la sobreescribe ---
  async guardarNota(recetaId: number, texto: string): Promise<NotaReceta> {
    await this.listo;
    const nota: NotaReceta = {
      texto,
      actualizadoEn: new Date().toISOString(),
    };
    await this.storage.set(this.clave(recetaId), nota);
    return nota;
  }

  // --- Eliminar (D) ---
  async eliminarNota(recetaId: number): Promise<void> {
    await this.listo;
    await this.storage.remove(this.clave(recetaId));
  }

  private clave(recetaId: number): string {
    return `${PREFIJO_CLAVE}${recetaId}`;
  }
}