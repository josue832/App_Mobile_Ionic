import { Injectable } from '@angular/core';
import axios from 'axios';

// Cambia esto por la URL real donde tengas login.php
// (en el emulador de Android usa http://10.0.2.2/... en vez de localhost)
const API_URL = 'http://localhost/App_Mobile_Ionic/Login.php';

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

  login(email: string, password: string): Promise<LoginResponse> {
    return axios
      .post<LoginResponse>(API_URL, { email, password }, {
        headers: { 'Content-Type': 'application/json' },
      })
      .then((res) => {
        if (res.data.success && res.data.token && res.data.usuario) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
        }
        return res.data;
      })
      .catch((err) => {
        // Si el servidor respondió con un error (401, 400, etc.) axios lo trae en err.response
        if (err.response && err.response.data) {
          return err.response.data as LoginResponse;
        }
        return {
          success: false,
          message: 'No se pudo conectar con el servidor',
        } as LoginResponse;
      });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
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
