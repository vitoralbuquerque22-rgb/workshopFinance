import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency } from '@/lib/format';
import { somaProposta, melhorProposta } from '@/lib/compras';
import { Plus, FileText, Pencil, CheckCircle2, Trophy } from 'lucide-react';

export default function CotacoesTab({ cotacoes, onNew, onEdit, onAprovar }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={onNew}><Plus className="h-4 w-4" /> Nova Cotação</Button></div>
      {cotacoes.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center"><FileText className="w-12 h-12 text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">Nenhuma cotação</p></div>
      ) : cotacoes.map((c) => {
        const win = melhorProposta(c.propostas || []);
        return (
          <Card key={c.id}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-100 text-violet-600 shrink-0"><FileText className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{c.numero || `COT-${c.id.slice(-5)}`}</p>
                  <StatusBadge status={c.status} />
                  <span className="text-xs text-muted-foreground">{c.propostas?.length || 0} fornecedor(es) · {c.itens?.length || 0} item(ns)</span>
                </div>
                {win && (
                  <p className="text-xs mt-2 flex items-center gap-1 text-emerald-700">
                    <Trophy className="h-3.5 w-3.5" /> Melhor: <strong>{win.fornecedor_nome || '—'}</strong> · {formatCurrency(somaProposta(win).total)} · {win.prazo_entrega_dias || 0}d
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {(c.status === 'respondida' || c.status === 'aprovada') && (
                  <Button size="sm" onClick={() => onAprovar(c)}><CheckCircle2 className="h-3.5 w-3.5" /> Aprovar & Gerar</Button>
                )}
                {c.status !== 'convertida' && <Button variant="ghost" size="icon" onClick={() => onEdit(c)}><Pencil className="h-4 w-4" /></Button>}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}