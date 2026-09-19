import { Button } from '@/components/ui/button';
import { Pencil, XCircle, CalendarClock } from 'lucide-react';
import { formatDateTime } from '@/lib/format';

const STATUS_INFO = {
  pendente: { label: 'Agendada', color: 'text-amber-600 bg-amber-50' },
  enviada: { label: 'Enviada', color: 'text-emerald-600 bg-emerald-50' },
  cancelada: { label: 'Cancelada', color: 'text-slate-500 bg-slate-100' },
  falhou: { label: 'Falhou', color: 'text-red-600 bg-red-50' },
};

// Lista os agendamentos do contato: ver, editar (pendentes) ou cancelar.
export default function AgendamentosLista({ agendamentos, onEditar, onCancelar }) {
  if (!agendamentos || agendamentos.length === 0) {
    return <p className="text-xs text-muted-foreground py-1">Nenhuma mensagem agendada.</p>;
  }

  return (
    <div className="space-y-2">
      {agendamentos.map((a) => {
        const info = STATUS_INFO[a.status] || STATUS_INFO.pendente;
        const editavel = a.status === 'pendente';
        return (
          <div key={a.id} className="rounded-lg border border-border p-2.5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${info.color}`}>{info.label}</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <CalendarClock className="w-3 h-3" /> {formatDateTime(a.agendado_para)}
              </span>
            </div>
            <p className="text-xs text-foreground line-clamp-2">{a.texto}</p>
            {editavel && (
              <div className="flex items-center justify-end gap-1 mt-1.5">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onEditar(a)}>
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => onCancelar(a)}>
                  <XCircle className="w-3.5 h-3.5" /> Cancelar
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}