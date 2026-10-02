# App Móvil de Recetas (Ionic) · Versión 1.0

Aplicación móvil hecha con **Ionic + Angular + Capacitor** que consume una API en **PHP + MySQL** (XAMPP). Permite consultar recetas, administrar usuarios y seguir funcionando de forma básica sin conexión.

- **Autor:** [Tu nombre]
- **Grupo / materia:** [Tu grupo y materia]
- **Repositorio:** [URL de tu repositorio]

## Funcionalidades

| Requisito de la actividad | Cómo se cumple |
|---|---|
| Proyecto Ionic funcional | App Ionic/Angular que corre en navegador (`ionic serve`) y en Android |
| Navegación | Pestañas (Inicio, Escaneo, Recetas, Usuarios, Photos), pantalla de login con guard de sesión y detalle de receta |
| Modelo de datos | 5 tablas MySQL (`usuarios`, `categorias`, `recetas`, `receta_ingredientes`, `receta_pasos`) y modelos TypeScript (`Usuario`, `Receta`, `Categoria`, `RecetaDetalle`) |
| CRUD | Usuarios: crear, listar, buscar por ID, editar y eliminar, vía API con axios. Notas en cada receta |
| Persistencia | MySQL en el servidor; en el dispositivo, sesión, caché de datos, notas y fotos |
| Manejo de errores | Clasificación de errores (sin red, servidor inalcanzable, tiempo agotado, 4xx, 5xx) con mensajes claros y botón Reintentar |
| Operación offline básica | Detección de red con `@capacitor/network` y caché "red primero, caché de respaldo" para categorías, recetas y detalle |
| Bitácora asistida por IA | `docs/Bitacora_conexion_cache.docx` |

## Estructura del repositorio

```
src/app/            Código de la app (pantallas, servicios, guards)
  services/         ApiConfigService, ConexionService, ApiErrorService, CacheService, etc.
  aviso-estado/     Componente de avisos de conexión y error
backend/App_Mobile_Ionic/   API en PHP (Login, Usuarios, Recetas, Categorias, db.php)
database/database.sql       Script de la base de datos
docs/                       Bitácora de desarrollo asistido por IA
android/                    Proyecto nativo de Capacitor
```

## Requisitos

- Node.js y npm
- Ionic CLI: `npm install -g @ionic/cli`
- XAMPP (Apache y MySQL)
- Android Studio (solo para generar o ejecutar la app en Android)

## Puesta en marcha

### 1. Backend (XAMPP)

1. Copia la carpeta `backend/App_Mobile_Ionic` a `C:\xampp\htdocs\`.
2. Inicia **Apache** y **MySQL** desde el panel de XAMPP.
3. En phpMyAdmin, crea la base `app_mobile_ionic` e importa `database/database.sql`.
4. Revisa `db.php`: usuario `root`, contraseña vacía y **puerto de MySQL** (por defecto `3306`; cámbialo si tu instalación usa otro).
5. Comprueba que responda: `http://localhost/App_Mobile_Ionic/Categorias.php` debe devolver JSON.

### 2. App en el navegador

```bash
npm install
ionic serve
```

### 3. App en Android

```bash
ionic build
ionic cap sync android
ionic cap open android
```

En Android Studio, conecta el celular con depuración USB y presiona **Run**. Para generar el APK: **Build → Build Bundle(s) / APK(s) → Build APK(s)**; queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

> La app usa `http://` (no HTTPS), por eso `capacitor.config.ts` y `AndroidManifest.xml` permiten tráfico sin cifrar (`cleartext`).

## Cómo conectar la app a tu servidor

En la pantalla de **login** hay un campo **Servidor**: escribe la IP de la laptop donde corre XAMPP, por ejemplo `192.168.0.253`. El puerto es siempre el 80 y la app lo agrega sola. La IP se guarda para la próxima vez.

- Averigua la IP con `ipconfig` en la laptop (la app **no** la detecta sola; si cambias de red, cámbiala).
- Celular y laptop deben estar en la **misma red Wi-Fi**.
- Si no conecta, permite el puerto 80 de Apache en el firewall de Windows (red privada).

## Manejo de errores y modo sin conexión

| Situación | Qué hace la app |
|---|---|
| El dispositivo no tiene red | Aviso "Sin conexión" y muestra los datos guardados |
| Hay red pero el servidor no responde (IP incorrecta, Apache apagado) | Mensaje claro, con datos guardados si existen, y botón Reintentar |
| Error 5xx del servidor (por ejemplo, MySQL apagado) | Mensaje genérico en pantalla; el detalle técnico queda solo en la consola |
| Error 4xx (credenciales, recurso no encontrado) | Muestra el mensaje de la API; no usa caché |

Notas de diseño:

- **Usuarios no se guarda en caché**, por ser datos personales. Sin conexión, guardar y eliminar se bloquean con un aviso.
- El **detalle de una receta** está disponible sin conexión solo si ya se abrió antes con el servidor encendido.
- Al cerrar sesión se borra la caché.

## Documentación y uso de IA

El desarrollo se apoyó en un asistente de IA (Claude). Los problemas encontrados, sus soluciones y las pruebas sin conexión están en [`docs/Bitacora_conexion_cache.docx`](docs/Bitacora_conexion_cache.docx).