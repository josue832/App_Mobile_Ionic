# App Móvil - Contador Calórico y Recomendación de Comidas con IA

## Descripción

Aplicación móvil desarrollada con **Ionic + Angular** para llevar el control calórico diario y recibir recomendaciones de comidas, apoyándose en IA para facilitar el registro y la sugerencia de alimentos.

## Objetivo

Ayudar al usuario a llevar un seguimiento sencillo de su alimentación diaria (calorías consumidas, macros) y ofrecerle recomendaciones de recetas acordes a sus metas, reduciendo el esfuerzo manual mediante funciones asistidas por IA (como el escaneo de alimentos).

## Funcionalidades principales

- **Login**: autenticación de usuario contra una API propia (PHP + MySQL).
- **Inicio (Dashboard)**: muestra el progreso calórico del día y las comidas registradas.
- **Escaneo**: vista para escanear alimentos y obtener su información nutricional (apoyo de IA).
- **Recetas**: catálogo de recetas recomendadas, filtrables por categoría.
- **Usuarios (CRUD)**: alta, consulta, edición y eliminación de usuarios — módulo base de cuentas.

## Tecnologías

- Ionic + Angular (componentes standalone)
- Axios para el consumo de la API
- PHP + PDO (API REST propia)
- MySQL / MariaDB

## Vistas de la aplicación

1. **Login** — autenticación de usuario.
2. **Inicio** — dashboard con resumen calórico del día.
3. **Escaneo** — escaneo de alimentos con IA (interfaz).
4. **Recetas** — listado de recetas recomendadas.
5. **Usuarios** — CRUD de usuarios.

## Cómo ejecutar el proyecto

```bash
npm install
ionic serve
```
## Autor

Josue — Ingeniería en Software.