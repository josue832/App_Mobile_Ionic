import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('../inicio/inicio.page').then((m) => m.InicioPage),
      },
      {
        path: 'escaneo',
        loadComponent: () => import('../escaneo/escaneo.page').then((m) => m.EscaneoPage),
      },
      {
        path: 'recetas',
        loadComponent: () => import('../recetas/recetas.page').then((m) => m.RecetasPage),
      },
      {
        path: 'recetas/:id',
        
        loadComponent: () => import('../receta.detalle/receta.detalle.page').then((m) => m.RecetaDetallePage),
      },
      {
        path: 'tab1',
        loadComponent: () => import('../tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        path: 'tab2',
        loadComponent: () => import('../tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'tab3',
        loadComponent: () => import('../tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: '',
        redirectTo: '/tabs/inicio',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/inicio',
    pathMatch: 'full',
  },
];