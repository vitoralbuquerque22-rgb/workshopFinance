import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { Car, Loader2, Play, CheckCircle2 } from 'lucide-react';
import { filaVeiculos, diasParaEntrega } from '@/lib/producao';
import { formatDate } from '@/lib/format';

function EntregaBadge({ os }) {
  const d = diasParaEntrega(os);
  if (d === null) return <span className="text-xs text-muted-foreground">Sem prazo</span>;
  if (d < 0) return <span className="text-xs font-medium text-red-600">Atrasado {Math.abs(d)}d</span>;
  if (d === 0) return <span className="text-xs font-medium text-amber-600">Entrega hoje</span>;
  return <span className="text-xs text-muted-foreground">Faltam {d}d</span>;
}

export default function FilaVeiculos({ ordens, clienteNome, veiculoInfo, onIniciar, onFinalizar, actionLoading }) {
  const fila = filaVeiculos(ordens);
  if (fila.length === 0) {
    return (
      <Card className="p-10 flex flex-col items-center justify-center text-center">
        <Car className="w-10 h-10 text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground">Nenhum veículo na fila de produção</p>
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {fila.map((os, idx) => (
        <Card key={os.id} className="p-3 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold shrink-0">{idx + 1}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{os.numero || `OS-${os.id.slice(-6)}`}</p>
              <StatusBadge status={os.status} />
              <EntregaBadge os={os} />
            </div>
            <p className="text-xs text-muted-foreground truncate">{veiculoInfo(os.veiculo_id)} · {clienteNome(os.cliente_id)}</p>
            <p className="text-xs text-muted-foreground">Técnico: {os.tecnico_responsavel || '—'} · Prevista: {formatDate(os.data_prevista)}</p>
          </div>
          <div className="shrink-0">
            {os.status === 'aprovado' && (
              <Button size="sm" onClick={() => onIniciar(os)} disabled={actionLoading[os.id + 'ini']}>
                {actionLoading[os.id + 'ini'] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Iniciar
              </Button>
            )}
            {os.status === 'em_andamento' && (
              <Button size="sm" variant="outline" onClick={() => onFinalizar(os)} disabled={actionLoading[os.id + 'fim']}>
                {actionLoading[os.id + 'fim'] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Concluir
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}