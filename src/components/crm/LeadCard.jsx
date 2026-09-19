import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCompact } from '@/lib/format';
import { origens } from '@/lib/crmConfig';
import { User, CalendarClock } from 'lucide-react';

export default function LeadCard({ lead, onClick, dragProps }) {
  const followupAtrasado = lead.proximo_followup && new Date(lead.proximo_followup) < new Date(new Date().toDateString());
  return (
    <Card
      onClick={onClick}
      {...dragProps}
      className="p-3 cursor-pointer hover:shadow-md transition-shadow bg-card space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="font-mono text-xs">{lead.placa || 'S/PLACA'}</Badge>
        <span className="text-xs font-semibold text-primary">{formatCompact(lead.valor_estimado)}</span>
      </div>
      <p className="text-sm font-medium leading-tight truncate">{lead.cliente_nome || 'Cliente não informado'}</p>
      {lead.servico_interesse && (
        <p className="text-xs text-muted-foreground truncate">{lead.servico_interesse}</p>
      )}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
        <span className="flex items-center gap-1 truncate"><User className="h-3 w-3" /> {lead.consultor || '-'}</span>
        <span>{origens[lead.origem] || lead.origem}</span>
      </div>
      {lead.proximo_followup && (
        <div className={`flex items-center gap-1 text-[11px] ${followupAtrasado ? 'text-rose-600 font-medium' : 'text-muted-foreground'}`}>
          <CalendarClock className="h-3 w-3" /> {new Date(lead.proximo_followup).toLocaleDateString('pt-BR')}
        </div>
      )}
    </Card>
  );
}