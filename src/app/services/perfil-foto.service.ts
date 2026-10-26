import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { parse } from 'exifr';

export interface MetadatoFoto {
  etiqueta: string;
  valor: string;
}

export interface ResultadoMetadatos {
  datos: MetadatoFoto[];
  hayExif: boolean;   // false = la foto no trae metadatos de cámara
}

// Foto de perfil del usuario. Se toma con la cámara y se guarda en el propio
// celular (Directory.Data de Capacitor), un archivo por usuario: perfil_<id>.jpeg
// No se sube al servidor. Los metadatos EXIF se leen con la librería exifr.
@Injectable({
  providedIn: 'root',
})
export class PerfilFotoService {

  private archivo(usuarioId: number): string {
    return `perfil_${usuarioId}.jpeg`;
  }

  private claveExif(usuarioId: number): string {
    return `perfil_exif_${usuarioId}`;
  }

  // Abre la cámara, guarda la foto en el celular y regresa la imagen lista para mostrar
  async tomarYGuardar(usuarioId: number): Promise<string> {
    const { base64, exifPlugin } = await this.capturar();

    await Filesystem.writeFile({
      path: this.archivo(usuarioId),
      data: base64,
      directory: Directory.Data,
    });

    // Respaldo: algunos celulares entregan el EXIF solo a través del plugin
    if (exifPlugin) {
      await Preferences.set({ key: this.claveExif(usuarioId), value: JSON.stringify(exifPlugin) });
    } else {
      await Preferences.remove({ key: this.claveExif(usuarioId) });
    }

    return `data:image/jpeg;base64,${base64}`;
  }

  // Lee la foto guardada (null si el usuario aún no tiene)
  async cargar(usuarioId: number): Promise<string | null> {
    try {
      const leido = await Filesystem.readFile({
        path: this.archivo(usuarioId),
        directory: Directory.Data,
      });
      return await this.aDataUrl(leido.data);
    } catch {
      return null;
    }
  }

  async eliminar(usuarioId: number): Promise<void> {
    try {
      await Filesystem.deleteFile({
        path: this.archivo(usuarioId),
        directory: Directory.Data,
      });
    } catch {
      // si el archivo no existe no pasa nada
    }
    await Preferences.remove({ key: this.claveExif(usuarioId) });
  }

  // ---------- Metadatos EXIF ----------

  async leerMetadatos(usuarioId: number): Promise<ResultadoMetadatos> {
    const leido = await Filesystem.readFile({
      path: this.archivo(usuarioId),
      directory: Directory.Data,
    });
    const bytes = await this.aBytes(leido.data);

    let exif: Record<string, any> | undefined;
    try {
      exif = await parse(bytes);
    } catch {
      exif = undefined;
    }

    // Si exifr no encontró nada, se usa el EXIF que entregó el plugin de cámara
    if (!exif || Object.keys(exif).length === 0) {
      const { value } = await Preferences.get({ key: this.claveExif(usuarioId) });
      if (value) {
        try { exif = JSON.parse(value); } catch { exif = undefined; }
      }
    }

    return this.formatear(exif ?? {}, bytes.byteLength, this.archivo(usuarioId));
  }

  private formatear(d: Record<string, any>, bytes: number, archivo: string): ResultadoMetadatos {
    const datos: MetadatoFoto[] = [];
    const agregar = (etiqueta: string, valor: unknown) => {
      if (valor !== undefined && valor !== null && valor !== '') {
        datos.push({ etiqueta, valor: String(valor) });
      }
    };

    agregar('Dispositivo', [d['Make'], d['Model']].filter(Boolean).join(' '));

    const fecha = d['DateTimeOriginal'] ?? d['CreateDate'] ?? d['DateTime'];
    agregar('Fecha de captura', fecha instanceof Date ? fecha.toLocaleString('es-MX') : fecha);

    const ancho = d['ExifImageWidth'] ?? d['PixelXDimension'] ?? d['ImageWidth'];
    const alto = d['ExifImageHeight'] ?? d['PixelYDimension'] ?? d['ImageHeight'];
    if (ancho && alto) {
      const mp = ((ancho * alto) / 1_000_000).toFixed(1);
      agregar('Resolución', `${ancho} × ${alto} px (${mp} MP)`);
    }

    agregar('Apertura', d['FNumber'] ? `f/${d['FNumber']}` : '');

    const t = d['ExposureTime'];
    if (typeof t === 'number' && t > 0) {
      agregar('Exposición', t >= 1 ? `${t} s` : `1/${Math.round(1 / t)} s`);
    }

    agregar('ISO', d['ISO'] ?? d['ISOSpeedRatings']);
    agregar('Distancia focal', d['FocalLength'] ? `${Math.round(d['FocalLength'] * 10) / 10} mm` : '');
    agregar('Flash', d['Flash']);
    agregar('Software', d['Software']);

    if (typeof d['latitude'] === 'number' && typeof d['longitude'] === 'number') {
      agregar('Ubicación', `${d['latitude'].toFixed(5)}, ${d['longitude'].toFixed(5)}`);
    }

    const hayExif = datos.length > 0;

    agregar('Tamaño del archivo', `${Math.round(bytes / 1024)} KB`);
    agregar('Guardada como', archivo);

    return { datos, hayExif };
  }

  // ---------- Captura ----------

  // En el celular usa la cámara; en el navegador (ionic serve) abre el selector de archivos
  private async capturar(): Promise<{ base64: string; exifPlugin?: unknown }> {
    if (Capacitor.getPlatform() === 'web') {
      return { base64: await this.elegirArchivoWeb() };
    }

    // Se pide la foto como archivo (Uri) y sin reducir ni rotar: así se conserva
    // el JPEG original con sus metadatos EXIF. Con Base64 el plugin la reconvierte
    // y los metadatos se pierden.
    const foto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100,
      correctOrientation: false,
    });

    if (!foto.path) {
      throw new Error('No se pudo obtener la foto');
    }

    const leido = await Filesystem.readFile({ path: foto.path });
    const base64 = await this.aBase64(leido.data);
    return { base64, exifPlugin: foto.exif };
  }

  private elegirArchivoWeb(): Promise<string> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.setAttribute('capture', 'user');

      input.onchange = () => {
        const archivo = input.files?.[0];
        if (!archivo) {
          reject(new Error('cancelled'));
          return;
        }
        const lector = new FileReader();
        lector.onload = () => resolve(String(lector.result).split(',')[1]);
        lector.onerror = () => reject(lector.error);
        lector.readAsDataURL(archivo);
      };
      input.oncancel = () => reject(new Error('cancelled'));
      input.click();
    });
  }

  // ---------- Conversiones ----------

  private async aBase64(data: string | Blob): Promise<string> {
    if (typeof data === 'string') {
      return data.startsWith('data:') ? data.split(',')[1] : data;
    }
    return (await this.aDataUrl(data)).split(',')[1];
  }

  private async aBytes(data: string | Blob): Promise<Uint8Array> {
    if (typeof data !== 'string') {
      return new Uint8Array(await data.arrayBuffer());
    }
    const base64 = data.startsWith('data:') ? data.split(',')[1] : data;
    const binario = atob(base64);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) {
      bytes[i] = binario.charCodeAt(i);
    }
    return bytes;
  }

  private aDataUrl(data: string | Blob): Promise<string> {
    if (typeof data === 'string') {
      return Promise.resolve(data.startsWith('data:') ? data : `data:image/jpeg;base64,${data}`);
    }
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(String(lector.result));
      lector.onerror = () => reject(lector.error);
      lector.readAsDataURL(data);
    });
  }
}