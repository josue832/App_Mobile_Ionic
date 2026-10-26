import * as d3 from 'd3';
import { DatosGraficas } from '../services/graficas.service';

export type TipoGrafica = 'barras' | 'lineas' | 'area' | 'dona' | 'dispersion' | 'histograma';

export interface ItemLeyenda {
  nombre: string;
  color: string;
}

type Svg = d3.Selection<SVGSVGElement, unknown, null, undefined>;

const W = 340;
const H = 270;
const M = { t: 16, r: 14, b: 28, l: 40 };

const COLORES = ['#f4845f', '#7fae4a', '#d9c14f', '#6c9bd1', '#c65b3f'];
const EXCESO = '#c65b3f';
const TEXTO = '#9a9a9a';
const LINEA = '#ece7e1';

// Cada función dibuja una gráfica dentro de `el` y regresa su leyenda (si tiene)
export function dibujar(tipo: TipoGrafica, el: HTMLElement, d: DatosGraficas): ItemLeyenda[] {
  const svg = lienzo(el);
  switch (tipo) {
    case 'barras': return barras(svg, d);
    case 'lineas': return lineas(svg, d);
    case 'area': return area(svg, d);
    case 'dona': return dona(svg, d);
    case 'dispersion': return dispersion(svg, d);
    case 'histograma': return histograma(svg, d);
  }
}

// ---------- Utilidades ----------

function lienzo(el: HTMLElement): Svg {
  d3.select(el).selectAll('*').remove();
  return d3
    .select(el)
    .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', '100%')
    .style('display', 'block');
}

function estilo(g: any): void {
  g.selectAll('text').attr('fill', TEXTO).attr('font-size', 10);
  g.selectAll('.domain').attr('stroke', LINEA);
  g.selectAll('line').attr('stroke', LINEA);
}

function ejes(svg: Svg, x: d3.AxisScale<any>, y: d3.ScaleLinear<number, number>): void {
  svg.append('g')
    .attr('transform', `translate(0,${H - M.b})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .call(estilo);

  svg.append('g')
    .attr('transform', `translate(${M.l},0)`)
    .call(d3.axisLeft(y).ticks(5).tickSize(-(W - M.l - M.r)))
    .call(estilo)
    .call((g: any) => g.select('.domain').remove());
}

function lineaMeta(svg: Svg, y: d3.ScaleLinear<number, number>, meta: number): void {
  svg.append('line')
    .attr('x1', M.l).attr('x2', W - M.r)
    .attr('y1', y(meta)).attr('y2', y(meta))
    .attr('stroke', '#2b2b2b').attr('stroke-width', 1.2).attr('stroke-dasharray', '4 4');
  svg.append('text')
    .attr('x', W - M.r).attr('y', y(meta) - 4)
    .attr('text-anchor', 'end').attr('font-size', 10).attr('font-weight', 600)
    .attr('fill', '#2b2b2b').text(`Meta ${meta}`);
}

function escalaKcal(d: DatosGraficas): d3.ScaleLinear<number, number> {
  const max = Math.max(d.metaKcal, d3.max(d.semana, (p) => p.kcal) ?? 0);
  return d3.scaleLinear().domain([0, max * 1.1]).nice().range([H - M.b, M.t]);
}

function escalaDias(d: DatosGraficas, margen = 0) {
  return d3.scalePoint<string>()
    .domain(d.semana.map((p) => p.dia))
    .range([M.l + margen, W - M.r - margen]);
}

// ---------- Gráficas ----------

function barras(svg: Svg, d: DatosGraficas): ItemLeyenda[] {
  const x = d3.scaleBand<string>().domain(d.semana.map((p) => p.dia)).range([M.l, W - M.r]).padding(0.3);
  const y = escalaKcal(d);
  ejes(svg, x, y);

  const rects = svg.selectAll('rect').data(d.semana).join('rect')
    .attr('x', (p) => x(p.dia)!)
    .attr('width', x.bandwidth())
    .attr('rx', 6)
    .attr('fill', (p) => (p.kcal > d.metaKcal ? EXCESO : COLORES[0]))
    .attr('y', H - M.b)
    .attr('height', 0);
  rects.append('title').text((p) => `${p.dia}: ${p.kcal} kcal`);
  rects.transition().duration(600).attr('y', (p) => y(p.kcal)).attr('height', (p) => H - M.b - y(p.kcal));

  lineaMeta(svg, y, d.metaKcal);
  return [
    { nombre: 'Dentro de la meta', color: COLORES[0] },
    { nombre: 'Sobre la meta', color: EXCESO },
  ];
}

function lineas(svg: Svg, d: DatosGraficas): ItemLeyenda[] {
  const x = escalaDias(d, 12);
  const y = escalaKcal(d);
  ejes(svg, x, y);
  lineaMeta(svg, y, d.metaKcal);

  const generador = d3.line<(typeof d.semana)[number]>()
    .x((p) => x(p.dia)!).y((p) => y(p.kcal)).curve(d3.curveMonotoneX);

  const trazo = svg.append('path')
    .datum(d.semana)
    .attr('d', generador)
    .attr('fill', 'none').attr('stroke', COLORES[0]).attr('stroke-width', 3).attr('stroke-linecap', 'round');
  const largo = (trazo.node() as SVGPathElement).getTotalLength();
  trazo.attr('stroke-dasharray', `${largo} ${largo}`).attr('stroke-dashoffset', largo)
    .transition().duration(900).attr('stroke-dashoffset', 0);

  svg.selectAll('circle').data(d.semana).join('circle')
    .attr('cx', (p) => x(p.dia)!).attr('cy', (p) => y(p.kcal)).attr('r', 4.5)
    .attr('fill', '#fff').attr('stroke', COLORES[0]).attr('stroke-width', 2.5)
    .append('title').text((p) => `${p.dia}: ${p.kcal} kcal`);

  return [{ nombre: 'Kcal por día', color: COLORES[0] }];
}

function area(svg: Svg, d: DatosGraficas): ItemLeyenda[] {
  const claves = ['proteina', 'carbohidratos', 'grasa'] as const;
  const nombres = ['Proteína', 'Carbohidratos', 'Grasa'];
  const colores = [COLORES[0], COLORES[2], COLORES[1]];

  const apilado = d3.stack<(typeof d.semana)[number]>().keys(claves)(d.semana);
  const x = escalaDias(d);
  const y = d3.scaleLinear()
    .domain([0, d3.max(apilado, (s) => d3.max(s, (v) => v[1])) ?? 0]).nice()
    .range([H - M.b, M.t]);
  ejes(svg, x, y);

  const generador = d3.area<d3.SeriesPoint<(typeof d.semana)[number]>>()
    .x((v) => x(v.data.dia)!).y0((v) => y(v[0])).y1((v) => y(v[1])).curve(d3.curveMonotoneX);

  svg.selectAll('path.capa').data(apilado).join('path')
    .attr('class', 'capa')
    .attr('d', generador)
    .attr('fill', (_, i) => colores[i]).attr('opacity', 0)
    .transition().duration(700).delay((_, i) => i * 150).attr('opacity', 0.9);

  svg.append('text').attr('x', M.l).attr('y', M.t - 4).attr('font-size', 10).attr('fill', TEXTO).text('gramos');
  return nombres.map((nombre, i) => ({ nombre, color: colores[i] }));
}

function dona(svg: Svg, d: DatosGraficas): ItemLeyenda[] {
  const total = (k: 'proteina' | 'carbohidratos' | 'grasa') => d3.sum(d.semana, (p) => p[k]);
  const partes = [
    { nombre: 'Proteína', valor: total('proteina'), color: COLORES[0] },
    { nombre: 'Carbohidratos', valor: total('carbohidratos'), color: COLORES[2] },
    { nombre: 'Grasa', valor: total('grasa'), color: COLORES[1] },
  ];
  const suma = d3.sum(partes, (p) => p.valor);

  const g = svg.append('g').attr('transform', `translate(${W / 2},${H / 2})`);
  const arcos = d3.pie<(typeof partes)[number]>().value((p) => p.valor).sort(null).padAngle(0.03)(partes);
  const arco = d3.arc<d3.PieArcDatum<(typeof partes)[number]>>().innerRadius(66).outerRadius(112).cornerRadius(5);

  const trozos = g.selectAll('path').data(arcos).join('path')
    .attr('d', arco).attr('fill', (a) => a.data.color).attr('opacity', 0);
  trozos.append('title').text((a) => `${a.data.nombre}: ${a.data.valor} g`);
  trozos.transition().duration(600).delay((_, i) => i * 150).attr('opacity', 1);

  g.selectAll('text.pct').data(arcos).join('text')
    .attr('class', 'pct')
    .attr('transform', (a) => `translate(${arco.centroid(a)})`)
    .attr('text-anchor', 'middle').attr('dy', '0.35em')
    .attr('font-size', 11).attr('font-weight', 700).attr('fill', '#fff')
    .text((a) => `${Math.round((a.data.valor / suma) * 100)}%`);

  g.append('text').attr('text-anchor', 'middle').attr('dy', '-0.2em')
    .attr('font-size', 22).attr('font-weight', 700).attr('fill', '#2b2b2b').text(suma);
  g.append('text').attr('text-anchor', 'middle').attr('dy', '1.4em')
    .attr('font-size', 10).attr('fill', TEXTO).text('g en la semana');

  return partes.map((p) => ({ nombre: p.nombre, color: p.color }));
}

function dispersion(svg: Svg, d: DatosGraficas): ItemLeyenda[] {
  const categorias = Array.from(new Set(d.recetas.map((r) => r.categoria)));
  const color = d3.scaleOrdinal<string, string>().domain(categorias).range(COLORES);

  const x = d3.scaleLinear().domain([0, (d3.max(d.recetas, (r) => r.tiempo_min) ?? 0) * 1.1]).nice().range([M.l, W - M.r]);
  const y = d3.scaleLinear().domain([0, (d3.max(d.recetas, (r) => r.kcal) ?? 0) * 1.1]).nice().range([H - M.b, M.t]);
  ejes(svg, x, y);

  const puntos = svg.selectAll('circle').data(d.recetas).join('circle')
    .attr('cx', (r) => x(r.tiempo_min)).attr('cy', (r) => y(r.kcal)).attr('r', 0)
    .attr('fill', (r) => color(r.categoria)).attr('fill-opacity', 0.85)
    .attr('stroke', '#fff').attr('stroke-width', 1.5);
  puntos.append('title').text((r) => `${r.nombre}\n${r.tiempo_min} min · ${r.kcal} kcal`);
  puntos.transition().duration(500).delay((_, i) => i * 60).attr('r', 8);

  svg.append('text').attr('x', W - M.r).attr('y', H - 4).attr('text-anchor', 'end')
    .attr('font-size', 10).attr('fill', TEXTO).text('minutos de preparación');
  svg.append('text').attr('x', M.l).attr('y', M.t - 4).attr('font-size', 10).attr('fill', TEXTO).text('kcal');

  return categorias.map((nombre) => ({ nombre, color: color(nombre) }));
}

function histograma(svg: Svg, d: DatosGraficas): ItemLeyenda[] {
  const max = d3.max(d.comidasKcal) ?? 0;
  const bins = d3.bin().domain([0, max]).thresholds(6)(d.comidasKcal);

  const x = d3.scaleLinear().domain([0, bins[bins.length - 1].x1 ?? max]).range([M.l, W - M.r]);
  const y = d3.scaleLinear().domain([0, d3.max(bins, (b) => b.length) ?? 0]).nice().range([H - M.b, M.t]);
  ejes(svg, x, y);

  const barrasBin = svg.selectAll('rect').data(bins).join('rect')
    .attr('x', (b) => x(b.x0 ?? 0) + 1)
    .attr('width', (b) => Math.max(0, x(b.x1 ?? 0) - x(b.x0 ?? 0) - 2))
    .attr('rx', 4).attr('fill', COLORES[0])
    .attr('y', H - M.b).attr('height', 0);
  barrasBin.append('title').text((b) => `${b.x0}–${b.x1} kcal: ${b.length} comidas`);
  barrasBin.transition().duration(600).attr('y', (b) => y(b.length)).attr('height', (b) => H - M.b - y(b.length));

  svg.append('text').attr('x', W - M.r).attr('y', H - 4).attr('text-anchor', 'end')
    .attr('font-size', 10).attr('fill', TEXTO).text('kcal por comida');
  svg.append('text').attr('x', M.l).attr('y', M.t - 4).attr('font-size', 10).attr('fill', TEXTO).text('comidas');

  return [];
}