import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { GRAVIDADE_OCORRENCIA, STATUS_OCORRENCIA, TIPO_OCORRENCIA } from '@/lib/agenda';
import { formatDateTime } from '@/lib/format';

export default function OcorrenciaCard({ ocorrencia, onResolver, onEditar }) {
  const grav = GRAVIDADE_OCORRENCIA[ocorrencia.gravidade] || GRAVIDADE_OCORRENCIA.media;
  const status = STATUS_OCORRENCIA[ocorrencia.status] || STATUS_OCORRENCIA.aberta;
  const tipo = TIPO_OCORRENCIA.find((t) => t.value === ocorrencia.tipo)?.label || ocorrencia.tipo;
  const resolvida = ocorrencia.status === 'resolvida' || ocorrencia.status === 'cancelada';

  return (
    <div className="rounded-lg border p-3 card-hover">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onEditar?.(ocorrencia)}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 shrink-0 ${ocorrencia.gravidade === 'critica' ? 'text-red-500' : 'text-amber-500'}`} />
            <p className="font-medium text-sm truncate">{ocorrencia.titulo}</p>
          </div>
          {ocorrencia.descricao && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{ocorrencia.descricao}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            {ocorrencia.numero && <span className="font-mono">{ocorrencia.numero}</span>}
            <Badge variant="outline" className="text-[10px]">{tipo}</Badge>
            {ocorrencia.data_ocorrencia && <span>{formatDateTime(ocorrencia.data_ocorrencia)}</span>}
            {ocorrencia.responsavel_nome && <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />{ocorrencia.responsavel_nome}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex gap-1.5">
            <Badge className={`${grav.cls} text-[10px]`}>{grav.label}</Badge>
            <Badge className={`${status.cls} text-[10px]`}>{status.label}</Badge>
          </div>
          {!resolvida && onResolver && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600" onClick={() => onResolver(ocorrencia)}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Resolver
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}