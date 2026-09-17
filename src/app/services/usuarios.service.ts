import { Injectable } from '@angular/core';
import axios from 'axios';

// Cambia esto por la URL real donde tengas Usuarios.php
// (en el emulador de Android usa http://10.0.2.2/... en vez de localhost)
const API_URL = 'http://localhost/App_Mobile_Ionic/Usuarios.php';

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
}

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {

  obtenerUsuarios(): Promise<ApiResponse<Usuario[]>> {
    return axios
      .get<ApiResponse<Usuario[]>>(API_URL)
      .then((res) => res.data)
      .catch((err) => this.manejarError(err, []));
  }

  obtenerUsuario(id: number): Promise<ApiResponse<Usuario | null>> {
    return axios
      .get<ApiResponse<Usuario>>(API_URL, { params: { id } })
      .then((res) => res.data)
      .catch((err) => this.manejarError(err, null));
  }

  crearUsuario(usuario: Usuario): Promise<ApiResponse<{ id: number } | null>> {
    return axios
      .post<ApiResponse<{ id: number }>>(API_URL, usuario, {
        headers: { 'Content-Type': 'application/json' },
      })
      .then((res) => res.data)
      .catch((err) => this.manejarError(err, null));
  }

  actualizarUsuario(id: number, usuario: Usuario): Promise<ApiResponse<null>> {
    return axios
      .put<ApiResponse<null>>(API_URL, usuario, {
        params: { id },
        headers: { 'Content-Type': 'application/json' },
      })
      .then((res) => res.data)
      .catch((err) => this.manejarError(err, null));
  }

  eliminarUsuario(id: number): Promise<ApiResponse<null>> {
    return axios
      .delete<ApiResponse<null>>(API_URL, { params: { id } })
      .then((res) => res.data)
      .catch((err) => this.manejarError(err, null));
  }

  // Si el servidor respondió con un error (400, 404, 409, etc.) axios lo trae en err.response
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