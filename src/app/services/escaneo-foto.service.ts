import { Injectable, inject, signal } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import type { Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

export interface FotoEscaneo {
  filepath: string;
  webviewPath?: string;
}

// Fotos tomadas en la pantalla de Escaneo (foto del platillo a analizar).
// Se guardan en el propio teléfono (Directory.Data de Capacitor), igual que la
// galería de tab2, pero con su propia lista — así los escaneos no se mezclan
// con fotos de otros módulos.
@Injectable({
  providedIn: 'root',
})
export class EscaneoFotoService {
  public fotos = signal<FotoEscaneo[]>([]);

  private readonly STORAGE_KEY = 'escaneo_fotos';

  private platform = inject(Platform);

  // Abre la cámara, guarda la foto en el teléfono y la agrega al inicio de la lista
  public async tomarFoto(): Promise<FotoEscaneo> {
    const capturada = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 90,
    });

    const guardada = await this.guardarEnDisco(capturada);
    this.fotos.update((fotos) => [guardada, ...fotos]);

    await Preferences.set({
      key: this.STORAGE_KEY,
      value: JSON.stringify(this.fotos()),
    });

    return guardada;
  }

  // Carga la lista guardada (se llama al entrar a la pantalla)
  public async cargarGuardadas(): Promise<void> {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY });
    const fotos = (value ? JSON.parse(value) : []) as FotoEscaneo[];

    if (!this.platform.is('hybrid')) {
      for (const foto of fotos) {
        try {
          const leido = await Filesystem.readFile({ path: foto.filepath, directory: Directory.Data });
          foto.webviewPath = `data:image/jpeg;base64,${leido.data}`;
        } catch {
          // Si el archivo ya no existe en el navegador (se limpió el storage), se omite
        }
      }
    }

    this.fotos.set(fotos);
  }

  public async eliminarFoto(foto: FotoEscaneo, posicion: number): Promise<void> {
    this.fotos.update((fotos) => fotos.filter((_, i) => i !== posicion));

    await Preferences.set({
      key: this.STORAGE_KEY,
      value: JSON.stringify(this.fotos()),
    });

    const nombreArchivo = foto.filepath.slice(foto.filepath.lastIndexOf('/') + 1);
    try {
      await Filesystem.deleteFile({ path: nombreArchivo, directory: Directory.Data });
    } catch {
      // si el archivo no existe no pasa nada
    }
  }

  private async guardarEnDisco(photo: Photo): Promise<FotoEscaneo> {
    let base64Data: string | Blob;

    if (this.platform.is('hybrid')) {
      const archivo = await Filesystem.readFile({ path: photo.path! });
      base64Data = archivo.data;
    } else {
      base64Data = await this.base64DesdeRuta(photo.webPath!);
    }

    const nombreArchivo = `escaneo_${Date.now()}.jpeg`;
    const guardado = await Filesystem.writeFile({
      path: nombreArchivo,
      data: base64Data,
      directory: Directory.Data,
    });

    if (this.platform.is('hybrid')) {
      return {
        filepath: guardado.uri,
        webviewPath: Capacitor.convertFileSrc(guardado.uri),
      };
    }

    return {
      filepath: nombreArchivo,
      webviewPath: photo.webPath,
    };
  }

  private base64DesdeRuta(ruta: string): Promise<string> {
    return fetch(ruta)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const lector = new FileReader();
            lector.onerror = reject;
            lector.onload = () => {
              if (typeof lector.result === 'string') {
                resolve(lector.result);
              } else {
                reject('method did not return a string');
              }
            };
            lector.readAsDataURL(blob);
          })
      );
  }
}