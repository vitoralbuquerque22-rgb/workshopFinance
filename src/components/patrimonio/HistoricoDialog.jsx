import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/format';
import { History, ArrowRight } from 'lucide-react';

const ICONE_TIPO = {
  cadastro: 'bg-blue-100 text-blue-700',
  movimentacao: 'bg-violet-100 text-violet-700',
  manutencao: 'bg-amber-100 text-amber-700',
  responsavel: 'bg-cyan-100 text-cyan-700',
  status: 'bg-slate-100 text-slate-700',
  auditoria: 'bg-emerald-100 text-emerald-700',
  abastecimento: 'bg-orange-100 text-orange-700',
  observacao: 'bg-slate-100 text-slate-600',
};

export default function HistoricoDialog({ open, onOpenChange, item }) {
  const historico = [...(item?.historico || [])].sort((a, b) => new Date(b.data) - new Date(a.data));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" /> Histórico — {item?.nome}
          </DialogTitle>
        </DialogHeader>
        {historico.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum evento registrado ainda.</p>
        ) : (
          <div className="space-y-3">
            {historico.map((h, i) => (
              <div key={i} className="flex gap-3">
                <span className={`shrink-0 h-fit text-[10px] uppercase font-semibold px-2 py-1 rounded ${ICONE_TIPO[h.tipo] || ICONE_TIPO.observacao}`}>
                  {h.tipo}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{h.descricao}</p>
                  {(h.de || h.para) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <span>{h.de || '—'}</span> <ArrowRight className="w-3 h-3" /> <span>{h.para || '—'}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{h.usuario} · {formatDateTime(h.data)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}