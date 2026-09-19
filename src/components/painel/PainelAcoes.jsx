import { Bell, CalendarClock, PhoneCall } from 'lucide-react';
import { formatDate } from '@/lib/format';

const alertaCls = {
  danger: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function PainelAcoes({ alertas, revisoes, followUps, clienteNome, veiculoInfo }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Alertas */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-heading font-semibold text-sm">Alertas importantes</h3>
        </div>
        {alertas.length === 0 ? (
          <p className="text-xs text-muted-foreground">Tudo em ordem 🎉</p>
        ) : (
          <ul className="space-y-2">
            {alertas.map((a, i) => (
              <li key={i} className={`text-xs px-3 py-2 rounded-lg border ${alertaCls[a.tipo] || alertaCls.info}`}>{a.texto}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Próximas revisões */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-heading font-semibold text-sm">Próximas revisões</h3>
        </div>
        {revisoes.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma programada</p>
        ) : (
          <ul className="space-y-2.5">
            {revisoes.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{veiculoInfo(o.veiculo_id)}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{clienteNome(o.cliente_id)}</p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(o.data_prevista)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Follow-ups */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <PhoneCall className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-heading font-semibold text-sm">Clientes para follow-up</h3>
        </div>
        {followUps.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum para hoje</p>
        ) : (
          <ul className="space-y-2.5">
            {followUps.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{l.cliente_nome || l.placa || '—'}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{l.consultor || 'Sem consultor'}</p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(l.proximo_followup)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}