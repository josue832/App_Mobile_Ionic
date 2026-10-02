import { Injectable } from '@angular/core';
import axios from 'axios';
import { ApiConfigService } from './api-config.service';
import { ApiErrorService, TipoError } from './api-error.service';

export interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  password?: string;
  creado_en?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  tipoError?: TipoError;   // qué clase de fallo fue, si success = false
}

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {

  constructor(private apiConfig: ApiConfigService, private apiError: ApiErrorService) {}

  // La URL se arma en cada llamada con la IP que se escribió en el login
  private get API_URL(): string {
    return this.apiConfig.url('Usuarios.php');
  }

  obtenerUsuarios(): Promise<ApiResponse<Usuario[]>> {
    return axios
      .get<ApiResponse<Usuario[]>>(this.API_URL, { timeout: this.apiConfig.timeoutMs })
      .then((res) => res.data)
      .catch((err) => this.manejarError(err, []));
  }

  obtenerUsuario(id: number): Promise<ApiResponse<Usuario | null>> {
    return axios
      .get<ApiResponse<Usuario>>(this.API_URL, { params: { id }, timeout: this.apiConfig.timeoutMs })
      .then((res) => res.data)
      .catch((err) => this.manejarError(err, null));
  }

  crearUsuario(usuario: Usuario): Promise<ApiResponse<{ id: number } | null>> {
    return axios
      .post<ApiResponse<{ id: number }>>(this.API_URL, usuario, {
        headers: { 'Content-Type': 'application/json' },
        timeout: this.apiConfig.timeoutMs,
      })
      .then((res) => res.data)
      .catch((err) => this.manejarError(err, null));
  }

  actualizarUsuario(id: number, usuario: Usuario): Promise<ApiResponse<null>> {
    return axios
      .put<ApiResponse<null>>(this.API_URL, usuario, {
        params: { id },
        headers: { 'Content-Type': 'application/json' },
        timeout: this.apiConfig.timeoutMs,
      })
      .then((res) => res.data)
      .catch((err) => this.manejarError(err, null));
  }

  eliminarUsuario(id: number): Promise<ApiResponse<null>> {
    return axios
      .delete<ApiResponse<null>>(this.API_URL, { params: { id }, timeout: this.apiConfig.timeoutMs })
      .then((res) => res.data)
      .catch((err) => this.manejarError(err, null));
  }

  // Clasifica el error (sin red, servidor inalcanzable, timeout, 4xx, 5xx) y devuelve
  // un mensaje claro. Los usuarios NO se guardan en caché: son datos personales.
  private manejarError<T>(err: any, dataPorDefecto: T): ApiResponse<T> {
    const info = this.apiError.clasificar(err);
    return {
      success: false,
      message: info.mensaje,
      data: dataPorDefecto,
      tipoError: info.tipo,
    };
  }
}
