import { Card, CardContent } from '@/components/ui/card';
import { Route, Gauge, Zap, Play, Pause } from 'lucide-react';
import { formatarMinutos } from '@/lib/atendimentoExterno';

// Cartões de telemetria: distância, velocidade média/máxima, tempo em movimento e parado.
export default function TelemetriaCards({ telemetria }) {
  const t = telemetria || {};
  const cards = [
    { label: 'Distância', valor: `${(t.distancia_km || 0).toFixed(1)} km`, icon: Route, cls: 'text-blue-600 bg-blue-100' },
    { label: 'Velocidade média', valor: `${(t.velocidade_media || 0).toFixed(0)} km/h`, icon: Gauge, cls: 'text-violet-600 bg-violet-100' },
    { label: 'Velocidade máxima', valor: `${(t.velocidade_maxima || 0).toFixed(0)} km/h`, icon: Zap, cls: 'text-amber-600 bg-amber-100' },
    { label: 'Tempo em movimento', valor: formatarMinutos(t.tempo_movimento_min), icon: Play, cls: 'text-emerald-600 bg-emerald-100' },
    { label: 'Tempo parado', valor: formatarMinutos(t.tempo_parado_min), icon: Pause, cls: 'text-slate-600 bg-slate-100' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold font-heading mt-1">{c.valor}</p>
              </div>
              <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${c.cls}`}>
                <c.icon className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}