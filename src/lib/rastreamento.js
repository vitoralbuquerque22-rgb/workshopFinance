// Fase 10 — Rastreamento avançado: telemetria de trajeto (distância, velocidade,
// tempo parado/em movimento) a partir dos pontos GPS capturados no deslocamento.

const R = 6371; // raio da Terra em km
const LIMIAR_PARADO = 3; // km/h — abaixo disso o veículo é considerado parado

// Distância entre dois pontos (Haversine) em km.
export function distanciaKm(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const lat1 = rad(a.lat);
  const lat2 = rad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const rad = (d) => (d * Math.PI) / 180;

// Calcula a telemetria completa a partir da lista ordenada de pontos.
export function calcularTelemetria(trajeto = []) {
  const pts = (trajeto || []).filter((p) => p && p.lat != null && p.lng != null);
  if (pts.length < 2) {
    return { distancia_km: 0, velocidade_media: 0, velocidade_maxima: 0, tempo_movimento_min: 0, tempo_parado_min: 0, pontos: pts.length, calculado_em: new Date().toISOString() };
  }

  let distancia = 0;
  let segParado = 0; // segundos
  let segMovimento = 0;
  let velMax = 0;
  const velsMovimento = [];

  for (let i = 1; i < pts.length; i++) {
    const ant = pts[i - 1];
    const cur = pts[i];
    const trecho = distanciaKm(ant, cur);
    distancia += trecho;

    const dtSeg = Math.max(0, (new Date(cur.registrado_em).getTime() - new Date(ant.registrado_em).getTime()) / 1000);
    // Velocidade: usa a instantânea do ponto se houver, senão deriva do trecho/tempo.
    const vel = cur.velocidade != null && cur.velocidade > 0
      ? cur.velocidade
      : (dtSeg > 0 ? (trecho / (dtSeg / 3600)) : 0);

    velMax = Math.max(velMax, vel);
    if (vel >= LIMIAR_PARADO) { segMovimento += dtSeg; velsMovimento.push(vel); }
    else { segParado += dtSeg; }
  }

  const velMedia = velsMovimento.length ? velsMovimento.reduce((a, b) => a + b, 0) / velsMovimento.length : 0;

  return {
    distancia_km: round2(distancia),
    velocidade_media: round1(velMedia),
    velocidade_maxima: round1(velMax),
    tempo_movimento_min: Math.round(segMovimento / 60),
    tempo_parado_min: Math.round(segParado / 60),
    pontos: pts.length,
    calculado_em: new Date().toISOString(),
  };
}

const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Reúne os pontos que formam a linha do trajeto no mapa ([lat, lng]).
export function trajetoParaLinha(trajeto = []) {
  return (trajeto || []).filter((p) => p && p.lat != null && p.lng != null).map((p) => [p.lat, p.lng]);
}

// Marcos de presença como pontos no mapa (para plotar bandeiras de saída/chegada/etc).
export const MARCOS_MAPA = [
  { key: 'saida', label: 'Saída', cor: '#2563eb' },
  { key: 'chegada', label: 'Chegada', cor: '#16a34a' },
  { key: 'inicio', label: 'Início', cor: '#7c3aed' },
  { key: 'fim', label: 'Fim', cor: '#ea580c' },
  { key: 'retorno', label: 'Retorno', cor: '#0891b2' },
];

export function marcosParaMapa(geoMarcos = {}) {
  return MARCOS_MAPA
    .map((m) => ({ ...m, ponto: geoMarcos?.[m.key] }))
    .filter((m) => m.ponto && m.ponto.lat != null && m.ponto.lng != null);
}