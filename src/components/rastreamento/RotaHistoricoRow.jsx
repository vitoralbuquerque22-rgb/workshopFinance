import { Badge } from '@/components/ui/badge';
import { MapPin, Route, Clock, ChevronRight } from 'lucide-react';
import { STATUS_MISSAO, formatarMinutos } from '@/lib/atendimentoExterno';
import { formatDateTime } from '@/lib/format';

// Linha do histórico de rotas — resume o deslocamento de uma missão.
export default function RotaHistoricoRow({ missao, selecionada, onSelect }) {
  const t = missao.rastreamento?.telemetria || {};
  const st = STATUS_MISSAO[missao.status] || STATUS_MISSAO.agendado;
  const pontos = missao.rastreamento?.trajeto?.length || 0;

  return (
    <button
      onClick={() => onSelect(missao)}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${selecionada ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{missao.numero || missao.titulo}</p>
          <p className="text-xs text-muted-foreground truncate">{missao.cliente_nome || missao.endereco || '—'}</p>
        </div>
        <ChevronRight className={`w-4 h-4 shrink-0 ${selecionada ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
        <Badge className={`${st.cls} text-[10px]`}>{st.label}</Badge>
        <span className="flex items-center gap-1"><Route className="w-3 h-3" />{(t.distancia_km || 0).toFixed(1)} km</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatarMinutos(missao.tempo_deslocamento_min)}</span>
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{pontos} pts</span>
      </div>
      {missao.saida_em && <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(missao.saida_em)}</p>}
    </button>
  );
}