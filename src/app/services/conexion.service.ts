import { Injectable, signal } from '@angular/core';
import { Network } from '@capacitor/network';
import type { ConnectionStatus } from '@capacitor/network';

// Detecta si el dispositivo tiene red (Wi-Fi o datos móviles).
//
// OJO: esto solo dice si el celular tiene red, NO si el servidor (la laptop)
// está accesible. Con Wi-Fi puede seguir fallando si Apache está apagado o la IP
// es incorrecta; ese segundo caso lo detecta ApiErrorService a partir del error de axios.
@Injectable({
  providedIn: 'root',
})
export class ConexionService {

  // true = hay red. Es un signal para que pantallas y servicios reaccionen al cambio.
  readonly online = signal<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);

  // "wifi", "cellular", "none" o "unknown"
  readonly tipo = signal<string>('unknown');

  constructor() {
    this.iniciar();
  }

  private async iniciar(): Promise<void> {
    try {
      // Estado inicial y escucha de cambios (modo avión, se cae el Wi-Fi, etc.)
      this.aplicar(await Network.getStatus());
      await Network.addListener('networkStatusChange', (estado) => this.aplicar(estado));
    } catch {
      // Respaldo si el plugin no está disponible: eventos del navegador
      window.addEventListener('online', () => this.online.set(true));
      window.addEventListener('offline', () => this.online.set(false));
    }
  }

  private aplicar(estado: ConnectionStatus): void {
    this.online.set(estado.connected);
    this.tipo.set(estado.connectionType);
  }
}
