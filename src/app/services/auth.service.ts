import { Injectable } from '@angular/core';
import axios from 'axios';
import { ApiConfigService } from './api-config.service';
import { ApiErrorService } from './api-error.service';
import { CacheService } from './cache.service';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  usuario?: Usuario;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  constructor(
    private apiConfig: ApiConfigService,
    private apiError: ApiErrorService,
    private cache: CacheService
  ) {}

  // La URL se arma en cada llamada con la IP que se escribió en el login
  private get API_URL(): string {
    return this.apiConfig.url('Login.php');
  }

  login(email: string, password: string): Promise<LoginResponse> {
    return axios
      .post<LoginResponse>(this.API_URL, { email, password }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: this.apiConfig.timeoutMs,
      })
      .then((res) => {
        if (res.data.success && res.data.token && res.data.usuario) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
        }
        return res.data;
      })
      .catch((err) => {
        // Mensaje claro según el tipo de fallo (sin red, servidor inalcanzable, 401, 500...)
        const info = this.apiError.clasificar(err);
        return { success: false, message: info.mensaje } as LoginResponse;
      });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    // Las copias guardadas para uso sin conexión se borran al cerrar sesión
    this.cache.limpiar();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUsuario(): Usuario | null {
    const data = localStorage.getItem('usuario');
    return data ? JSON.parse(data) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
