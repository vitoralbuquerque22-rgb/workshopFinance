import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { gargalosPorEtapa } from '@/lib/producao';
import { etapasFluxo } from '@/lib/osFluxo';

export default function GargalosPainel({ ordens }) {
  const dados = gargalosPorEtapa(ordens, etapasFluxo);
  const temDados = dados.some((d) => d.mediaHoras > 0 || d.emCurso > 0);
  if (dados.length === 0 || !temDados) {
    return (
      <Card className="p-10 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-10 h-10 text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground">Sem histórico de etapas para analisar gargalos</p>
      </Card>
    );
  }
  const maxMedia = Math.max(...dados.map((d) => d.mediaHoras), 1);
  const gargalo = dados.reduce((a, b) => (b.mediaHoras > a.mediaHoras ? b : a), dados[0]);

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center gap-3 border-amber-500/40 bg-amber-500/5">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-sm">
          Maior gargalo: <strong>{gargalo.label}</strong> — média de <strong>{gargalo.mediaHoras}h</strong> por veículo
          {gargalo.emCurso > 0 && ` · ${gargalo.emCurso} em curso`}
        </p>
      </Card>
      <Card className="p-4 space-y-3">
        <p className="text-sm font-semibold">Tempo médio por etapa do fluxo</p>
        {dados.map((d) => (
          <div key={d.etapa}>
            <div className="flex justify-between text-xs mb-1">
              <span>{d.label}{d.emCurso > 0 && <span className="text-amber-600"> · {d.emCurso} em curso</span>}</span>
              <span className="font-medium">{d.mediaHoras}h</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${d.etapa === gargalo.etapa ? 'bg-amber-500' : 'bg-primary'}`}
                style={{ width: `${(d.mediaHoras / maxMedia) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}