import { useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import { trajetoParaLinha, marcosParaMapa } from '@/lib/rastreamento';
import 'leaflet/dist/leaflet.css';

// Mapa do trajeto: linha do percurso + marcos de presença (saída, chegada, etc).
// `missoes` = uma ou várias missões para plotar simultaneamente.
export default function MapaRota({ missoes = [], altura = 480 }) {
  const rotas = useMemo(() => {
    return missoes.map((m) => ({
      id: m.id,
      titulo: m.numero || m.titulo,
      linha: trajetoParaLinha(m.rastreamento?.trajeto),
      marcos: marcosParaMapa(m.geo_marcos),
    })).filter((r) => r.linha.length > 0 || r.marcos.length > 0);
  }, [missoes]);

  // Centro do mapa: primeiro ponto disponível, senão São Paulo.
  const centro = useMemo(() => {
    for (const r of rotas) {
      if (r.linha[0]) return r.linha[0];
      if (r.marcos[0]?.ponto) return [r.marcos[0].ponto.lat, r.marcos[0].ponto.lng];
    }
    return [-23.55, -46.63];
  }, [rotas]);

  const temDados = rotas.length > 0;

  if (!temDados) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground" style={{ height: altura }}>
        Nenhum trajeto ou marco registrado para exibir no mapa.
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border" style={{ height: altura }}>
      <MapContainer center={centro} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {rotas.map((r) => (
          <div key={r.id}>
            {r.linha.length > 1 && (
              <Polyline positions={r.linha} pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.7 }} />
            )}
            {r.marcos.map((mc) => (
              <CircleMarker
                key={mc.key}
                center={[mc.ponto.lat, mc.ponto.lng]}
                radius={8}
                pathOptions={{ color: mc.cor, fillColor: mc.cor, fillOpacity: 0.9, weight: 2 }}
              >
                <Popup>
                  <strong>{mc.label}</strong><br />{r.titulo}
                </Popup>
              </CircleMarker>
            ))}
          </div>
        ))}
      </MapContainer>
    </div>
  );
}