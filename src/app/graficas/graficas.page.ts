import { AfterViewInit, Component, ElementRef, ViewChild, effect, untracked } from '@angular/core';
import { IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  trendingUpOutline,
  layersOutline,
  pieChartOutline,
  radioButtonOnOutline,
  statsChartOutline,
} from 'ionicons/icons';
import { GraficasService, DatosGraficas } from '../services/graficas.service';
import { ConexionService } from '../services/conexion.service';
import { AvisoEstadoComponent } from '../aviso-estado/aviso-estado.component';
import { dibujar, ItemLeyenda, TipoGrafica } from './graficas.d3';

interface OpcionGrafica {
  tipo: TipoGrafica;
  nombre: string;
  icono: string;
  titulo: string;
  subtitulo: string;
}

interface DatoResumen {
  etiqueta: string;
  valor: string;
}

// Para agregar otra gráfica: añade su opción aquí, su función en graficas.d3.ts
// y su caso en resumen()
const OPCIONES: OpcionGrafica[] = [
  { tipo: 'barras', nombre: 'Barras', icono: 'bar-chart-outline', titulo: 'Calorías por día', subtitulo: 'Consumo de la semana contra tu meta diaria' },
  { tipo: 'lineas', nombre: 'Líneas', icono: 'trending-up-outline', titulo: 'Tendencia semanal', subtitulo: 'Cómo suben y bajan tus calorías día a día' },
  { tipo: 'area', nombre: 'Área', icono: 'layers-outline', titulo: 'Macros por día', subtitulo: 'Proteína, carbohidratos y grasa en gramos' },
  { tipo: 'dona', nombre: 'Dona', icono: 'pie-chart-outline', titulo: 'Distribución de macros', subtitulo: 'Porcentaje de cada macronutriente en la semana' },
  { tipo: 'dispersion', nombre: 'Dispersión', icono: 'radio-button-on-outline', titulo: 'Tiempo vs calorías', subtitulo: 'Cada punto es una receta, por categoría' },
  { tipo: 'histograma', nombre: 'Histograma', icono: 'stats-chart-outline', titulo: 'Calorías por comida', subtitulo: 'Cuántas comidas caen en cada rango de kcal' },
];

@Component({
  selector: 'app-graficas',
  templateUrl: './graficas.page.html',
  styleUrls: ['./graficas.page.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonIcon, AvisoEstadoComponent],
})
export class GraficasPage implements AfterViewInit {

  @ViewChild('lienzo') lienzo?: ElementRef<HTMLDivElement>;

  opciones = OPCIONES;
  tipoActivo: TipoGrafica = 'barras';

  datos: DatosGraficas | null = null;
  cargando = false;
  leyenda: ItemLeyenda[] = [];
  resumenDatos: DatoResumen[] = [];

  // Aviso de conexión / error (vacío = no se muestra)
  avisoMensaje = '';

  constructor(private graficasService: GraficasService, private conexion: ConexionService) {
    addIcons({
      barChartOutline,
      trendingUpOutline,
      layersOutline,
      pieChartOutline,
      radioButtonOnOutline,
      statsChartOutline,
    });

    // Si falló la carga y regresa la red, se vuelve a pedir sola
    effect(() => {
      const online = this.conexion.online();
      if (online && this.avisoMensaje) {
        untracked(() => this.cargarDatos());
      }
    });
  }

  get opcion(): OpcionGrafica {
    return this.opciones.find((o) => o.tipo === this.tipoActivo)!;
  }

  get esDemo(): boolean {
    return this.graficasService.esDemo;
  }

  ngAfterViewInit() {
    this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando = true;
    const res = await this.graficasService.obtenerDatos();
    this.cargando = false;

    if (res.success && res.data) {
      this.datos = res.data;
      this.avisoMensaje = '';
      this.actualizar();
    } else {
      this.datos = null;
      this.avisoMensaje = res.message;
    }
  }

  elegirTipo(tipo: TipoGrafica) {
    this.tipoActivo = tipo;
    this.actualizar();
  }

  private actualizar() {
    if (!this.datos || !this.lienzo) return;
    this.leyenda = dibujar(this.tipoActivo, this.lienzo.nativeElement, this.datos);
    this.resumenDatos = this.resumen(this.tipoActivo, this.datos);
  }

  // Tres datos rápidos que acompañan a cada gráfica
  private resumen(tipo: TipoGrafica, d: DatosGraficas): DatoResumen[] {
    const prom = (n: number[]) => (n.length ? Math.round(n.reduce((a, b) => a + b, 0) / n.length) : 0);
    const suma = (n: number[]) => n.reduce((a, b) => a + b, 0);

    switch (tipo) {
      case 'barras':
      case 'lineas': {
        const mayor = d.semana.reduce((a, b) => (b.kcal > a.kcal ? b : a), d.semana[0]);
        return [
          { etiqueta: 'Promedio diario', valor: `${prom(d.semana.map((p) => p.kcal))} kcal` },
          { etiqueta: 'Día más alto', valor: `${mayor.dia} · ${mayor.kcal}` },
          { etiqueta: 'Días sobre la meta', valor: `${d.semana.filter((p) => p.kcal > d.metaKcal).length} de ${d.semana.length}` },
        ];
      }
      case 'area':
      case 'dona':
        return [
          { etiqueta: 'Proteína', valor: `${suma(d.semana.map((p) => p.proteina))} g` },
          { etiqueta: 'Carbohidratos', valor: `${suma(d.semana.map((p) => p.carbohidratos))} g` },
          { etiqueta: 'Grasa', valor: `${suma(d.semana.map((p) => p.grasa))} g` },
        ];
      case 'dispersion': {
        const mayor = d.recetas.reduce((a, b) => (b.kcal > a.kcal ? b : a), d.recetas[0]);
        return [
          { etiqueta: 'Recetas', valor: `${d.recetas.length}` },
          { etiqueta: 'Tiempo promedio', valor: `${prom(d.recetas.map((r) => r.tiempo_min))} min` },
          { etiqueta: 'Más calórica', valor: `${mayor.kcal} kcal` },
        ];
      }
      case 'histograma':
        return [
          { etiqueta: 'Comidas', valor: `${d.comidasKcal.length}` },
          { etiqueta: 'Promedio', valor: `${prom(d.comidasKcal)} kcal` },
          { etiqueta: 'Máxima', valor: `${Math.max(...d.comidasKcal)} kcal` },
        ];
    }
  }
}