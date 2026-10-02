import { Injectable } from '@angular/core';

// Puerto fijo del servidor web (Apache) de la laptop
const PUERTO = 80;

// Carpeta dentro de htdocs donde viven los archivos PHP
const CARPETA_API = 'App_Mobile_Ionic';

// Clave con la que se guarda la IP en localStorage
const CLAVE_HOST = 'api_host';

// Tiempo máximo de espera de cada petición axios (ms). Sin esto, con una IP
// equivocada la app se quedaría "cargando" muchísimo tiempo.
const TIMEOUT_MS = 10000;

@Injectable({
  providedIn: 'root',
})
export class ApiConfigService {

  private host: string;

  constructor() {
    this.host = localStorage.getItem(CLAVE_HOST) ?? '';
  }

  get timeoutMs(): number {
    return TIMEOUT_MS;
  }

  // Último host guardado (ej. "192.168.0.253"), sin protocolo ni puerto
  getHost(): string {
    return this.host;
  }

  // Limpia lo que escribió la persona: acepta "192.168.0.253", "192.168.0.253:80"
  // o "http://192.168.0.253/" y se queda solo con "192.168.0.253".
  // El puerto siempre es el fijo (80), por eso se descarta cualquier puerto escrito.
  normalizar(valor: string): string {
    return (valor ?? '')
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/[\/?#].*$/, '')
      .replace(/:\d+$/, '');
  }

  // IP (192.168.0.253) o nombre de host (mi-laptop.local)
  esValido(valor: string): boolean {
    const host = this.normalizar(valor);
    return /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/.test(host);
  }

  // Guarda el host (ya normalizado) en localStorage para la próxima vez que se abra la app
  setHost(valor: string): void {
    this.host = this.normalizar(valor);
    localStorage.setItem(CLAVE_HOST, this.host);
  }

  // URL base ya armada, ej. "http://192.168.0.253:80"
  get baseUrl(): string {
    return `http://${this.host}:${PUERTO}`;
  }

  // URL completa de un archivo de la API, ej. url('Login.php')
  // => "http://192.168.0.253:80/App_Mobile_Ionic/Login.php"
  url(archivo: string): string {
    return `${this.baseUrl}/${CARPETA_API}/${archivo}`;
  }
}
