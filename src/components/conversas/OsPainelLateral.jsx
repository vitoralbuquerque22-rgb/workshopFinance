import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { etapasFluxo, etapaFluxoLabel } from '@/lib/osFluxo';
import { formatCurrency } from '@/lib/format';

// Painel deslizante sobre o chat: mostra itens/valores/etapa da OS e permite
// mudar a etapa sem sair da conversa. A mudança dispara o gatilho da Fase 2.
export default function OsPainelLateral({ open, onOpenChange, ordemServico, salvando, onMudarEtapa }) {
  const navigate = useNavigate();
  const os = ordemServico;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        {os && (
          <>
            <SheetHeader className="p-4 border-b border-border space-y-1">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Wrench className="w-4 h-4 text-muted-foreground" />
                Ordem de Serviço {os.numero || ''}
              </SheetTitle>
              <p className="text-xs text-muted-foreground capitalize">{os.status}</p>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Etapa atual + mudança */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Etapa do fluxo</label>
                <Select value={os.etapa_fluxo || 'recepcao'} onValueChange={onMudarEtapa} disabled={salvando}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {etapasFluxo.map((e) => (
                      <SelectItem key={e.key} value={e.key}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {salvando && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Salvando e notificando cliente...
                  </p>
                )}
              </div>

              {/* Problema */}
              {os.descricao_problema && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Problema relatado</p>
                  <p className="text-sm">{os.descricao_problema}</p>
                </div>
              )}

              {/* Itens */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Itens</p>
                {(os.itens || []).filter((i) => i.descricao).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum item cadastrado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {(os.itens || []).filter((i) => i.descricao).map((item, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border text-sm">
                        <div className="min-w-0">
                          <p className="truncate">{item.descricao}</p>
                          <p className="text-xs text-muted-foreground">{item.quantidade || 1}x · {formatCurrency(item.valor_unitario)}</p>
                        </div>
                        <span className="font-medium shrink-0">{formatCurrency(item.valor_total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Valores */}
              <div className="space-y-1.5 rounded-lg bg-muted/50 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Peças</span>
                  <span>{formatCurrency(os.valor_pecas)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Serviços</span>
                  <span>{formatCurrency(os.valor_servicos)}</span>
                </div>
                {os.valor_desconto > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Desconto</span>
                    <span>- {formatCurrency(os.valor_desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold pt-1 border-t border-border">
                  <span>Total</span>
                  <span>{formatCurrency(os.valor_total)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border">
              <Button variant="outline" className="w-full" onClick={() => navigate(`/ordens-servico/${os.id}`)}>
                <ExternalLink className="w-4 h-4" /> Abrir OS completa
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}