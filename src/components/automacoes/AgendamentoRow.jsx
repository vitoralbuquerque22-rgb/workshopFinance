import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/format';

const STATUS = {
  pendente: { label: 'Agendada', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  enviada: { label: 'Enviada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  falhou: { label: 'Falhou', cls: 'bg-red-50 text-red-700 border-red-200' },
  cancelada: { label: 'Cancelada', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const EVENTO_LABEL = {
  os_finalizada: 'OS finalizada',
  orcamento_enviado: 'Orçamento enviado',
  so_perguntou: 'Só perguntou',
  os_etapa: 'Etapa da OS',
  lead_novo: 'Lead novo',
  pos_venda: 'Pós-venda',
  lembrete_retorno: 'Lembrete',
  manual: 'Manual',
};

export default function AgendamentoRow({ ag, onCancelar }) {
  const st = STATUS[ag.status] || STATUS.pendente;
  const quando = ag.status === 'enviada' ? ag.enviado_em : ag.agendado_para;
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30">
      <td className="py-2.5 px-3">
        <Badge variant="outline" className={`text-[11px] ${st.cls}`}>{st.label}</Badge>
      </td>
      <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
        {EVENTO_LABEL[ag.evento] || ag.evento || '—'}
      </td>
      <td className="py-2.5 px-3 max-w-md">
        <p className="text-sm truncate">{ag.texto || (ag.midia_url ? '[mídia]' : '—')}</p>
        {ag.status === 'falhou' && ag.erro_detalhe && (
          <p className="text-[11px] text-red-600 truncate">{ag.erro_detalhe}</p>
        )}
      </td>
      <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(quando)}</td>
      <td className="py-2.5 px-3 text-right">
        {ag.status === 'pendente' && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700" onClick={() => onCancelar(ag)}>
            <XCircle className="w-3.5 h-3.5" /> Cancelar
          </Button>
        )}
      </td>
    </tr>
  );
}