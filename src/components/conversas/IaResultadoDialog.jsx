import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Wrench } from 'lucide-react';

// Exibe o resultado da IA (resumo ou dados para gerar OS).
export default function IaResultadoDialog({ open, onOpenChange, tipo, dados, onGerarOs }) {
  const isOs = tipo === 'gerar_os';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isOs ? <Wrench className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-primary" />}
            {isOs ? 'Ordem de serviço sugerida' : 'Resumo da conversa'}
          </DialogTitle>
        </DialogHeader>

        {!isOs && (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{dados}</p>
        )}

        {isOs && dados && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Problema relatado</p>
              <p className="text-sm">{dados.descricao_problema || '—'}</p>
            </div>
            {dados.itens_sugeridos?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Itens sugeridos</p>
                <ul className="space-y-1">
                  {dados.itens_sugeridos.map((it, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{it.tipo}</span>
                      {it.descricao}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          {isOs && (
            <Button onClick={onGerarOs}><Wrench className="w-4 h-4" /> Abrir OS</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}