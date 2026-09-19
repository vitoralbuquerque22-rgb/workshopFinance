import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { etapas, etapaLabel, tiposAtividade, origens } from '@/lib/crmConfig';
import AtividadeForm from './AtividadeForm';
import { Pencil, Trash2, Car, User } from 'lucide-react';

export default function LeadDetail({ leadId, open, onOpenChange, onEdit, onChanged }) {
  const [lead, setLead] = useState(null);
  const [atividades, setAtividades] = useState([]);

  const load = async () => {
    if (!leadId) return;
    const [l, ats] = await Promise.all([
      base44.entities.Lead.get(leadId),
      base44.entities.Atividade.filter({ lead_id: leadId }, '-created_date'),
    ]);
    setLead(l);
    setAtividades(ats);
  };

  useEffect(() => {
    if (open && leadId) load();
  }, [open, leadId]);

  const toggleAtividade = async (at) => {
    await base44.entities.Atividade.update(at.id, {
      concluida: !at.concluida,
      data_conclusao: !at.concluida ? new Date().toISOString() : null,
    });
    load();
  };

  const handleDelete = async () => {
    if (!confirm('Excluir este lead?')) return;
    await base44.entities.Lead.delete(leadId);
    onOpenChange(false);
    onChanged?.();
  };

  if (!lead) return null;
  const etapaInfo = etapas.find((e) => e.key === lead.etapa);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">{lead.placa}</Badge>
            <Badge className={etapaInfo?.color + ' border'}>{etapaLabel(lead.etapa)}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-1">
            <p className="text-lg font-semibold">{lead.cliente_nome || 'Cliente não informado'}</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(lead.valor_estimado)}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <p className="flex items-center gap-1.5 text-muted-foreground"><User className="h-4 w-4" /> {lead.consultor || '-'}</p>
            <p className="flex items-center gap-1.5 text-muted-foreground"><Car className="h-4 w-4" /> {origens[lead.origem] || lead.origem}</p>
          </div>

          {lead.servico_interesse && (
            <div className="text-sm"><span className="text-muted-foreground">Interesse: </span>{lead.servico_interesse}</div>
          )}
          {lead.observacoes && (
            <div className="text-sm bg-muted/40 rounded p-2">{lead.observacoes}</div>
          )}
          {lead.etapa === 'perdido' && lead.motivo_perda && (
            <div className="text-sm bg-rose-50 text-rose-700 rounded p-2">
              Perda: {lead.motivo_perda} {lead.motivo_perda_detalhe ? `— ${lead.motivo_perda_detalhe}` : ''}
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(lead)} className="flex-1"><Pencil className="h-4 w-4" /> Editar</Button>
            <Button size="sm" variant="outline" onClick={handleDelete} className="text-rose-600"><Trash2 className="h-4 w-4" /></Button>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm font-semibold mb-2">Registrar interação</p>
            <AtividadeForm leadId={leadId} consultor={lead.consultor} onSaved={load} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Histórico ({atividades.length})</p>
            {atividades.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma interação ainda.</p>}
            {atividades.map((at) => {
              const info = tiposAtividade[at.tipo] || tiposAtividade.nota;
              const Icon = info.icon;
              return (
                <div key={at.id} className="flex gap-2 text-sm border-l-2 border-muted pl-3 py-1">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${info.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${at.concluida ? '' : 'text-amber-700'}`}>{at.titulo}</p>
                      {(at.tipo === 'tarefa' || at.tipo === 'reuniao') && (
                        <Checkbox checked={at.concluida} onCheckedChange={() => toggleAtividade(at)} />
                      )}
                    </div>
                    {at.descricao && <p className="text-xs text-muted-foreground">{at.descricao}</p>}
                    <p className="text-[11px] text-muted-foreground">
                      {at.data_agendada ? `Agendado: ${formatDateTime(at.data_agendada)}` : formatDateTime(at.created_date)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}