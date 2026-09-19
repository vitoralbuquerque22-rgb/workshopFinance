import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/StatusBadge';
import { prioridadeConfig } from '@/lib/compras';
import { formatDate } from '@/lib/format';
import { Plus, ClipboardList, Pencil } from 'lucide-react';

export default function SolicitacoesTab({ requisicoes, onNew, onEdit }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={onNew}><Plus className="h-4 w-4" /> Nova Solicitação</Button></div>
      {requisicoes.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center"><ClipboardList className="w-12 h-12 text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">Nenhuma solicitação de compra</p></div>
      ) : requisicoes.map((r) => {
        const pri = prioridadeConfig[r.prioridade] || prioridadeConfig.media;
        return (
          <Card key={r.id}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0"><ClipboardList className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{r.numero || `REQ-${r.id.slice(-5)}`}</p>
                  <StatusBadge status={r.status} />
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${pri.className}`}>{pri.label}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1 mt-2 text-xs text-muted-foreground">
                  <div><span className="font-medium text-foreground">Solicitante:</span> {r.solicitante || '—'}</div>
                  <div><span className="font-medium text-foreground">Necessidade:</span> {formatDate(r.data_necessidade) || '—'}</div>
                  <div><span className="font-medium text-foreground">Itens:</span> {r.itens?.length || 0}</div>
                  {r.os_numero && <div><span className="font-medium text-foreground">OS:</span> {r.os_numero}</div>}
                  {r.cliente_nome && <div><span className="font-medium text-foreground">Cliente:</span> {r.cliente_nome}</div>}
                </div>
                {r.itens?.length > 0 && <p className="text-xs text-muted-foreground mt-1 truncate">{r.itens.map((i) => `${i.quantidade}x ${i.descricao}`).join(', ')}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => onEdit(r)}><Pencil className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}