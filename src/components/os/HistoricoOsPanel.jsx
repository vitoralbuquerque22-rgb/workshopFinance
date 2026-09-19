import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronDown, ChevronRight, Wrench, Package, FileText, History as HistoryIcon } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';

// Painel lateral com o histórico de OS anteriores do cliente. Mantém a OS atual
// aberta — abre apenas por cima. Cada OS pode ser expandida para ver os detalhes.
export default function HistoricoOsPanel({ open, onOpenChange, clienteId, clienteNome, veiculos = [] }) {
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandida, setExpandida] = useState(null);

  useEffect(() => {
    if (!open || !clienteId) return;
    setLoading(true);
    setExpandida(null);
    base44.entities.OrdemServico.filter({ cliente_id: clienteId }, '-created_date', 100)
      .then(setOrdens)
      .catch(() => setOrdens([]))
      .finally(() => setLoading(false));
  }, [open, clienteId]);

  const veiculoInfo = (id) => {
    const v = veiculos.find((v) => v.id === id);
    return v ? `${v.placa} · ${v.marca} ${v.modelo}` : '—';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><HistoryIcon className="w-5 h-5" /> OS Anteriores</SheetTitle>
          <p className="text-sm text-muted-foreground">{clienteNome || 'Cliente'}</p>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : ordens.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma OS anterior para este cliente.</div>
          ) : (
            ordens.map((os) => {
              const aberta = expandida === os.id;
              const pecas = (os.itens || []).filter((i) => i.tipo === 'peca');
              const servicos = (os.itens || []).filter((i) => i.tipo !== 'peca');
              return (
                <div key={os.id} className="border rounded-lg">
                  <button
                    onClick={() => setExpandida(aberta ? null : os.id)}
                    className="w-full flex items-center gap-2 p-3 text-left hover:bg-accent transition-colors"
                  >
                    {aberta ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{os.numero || 'OS'}</span>
                        <StatusBadge status={os.status} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{veiculoInfo(os.veiculo_id)} · {formatDate(os.data_abertura || os.created_date)}</p>
                    </div>
                    <span className="text-sm font-medium shrink-0">{formatCurrency(os.valor_total)}</span>
                  </button>

                  {aberta && (
                    <div className="px-3 pb-3 space-y-3 border-t pt-3">
                      {os.descricao_problema && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1"><FileText className="w-3 h-3" /> Problema relatado</p>
                          <p className="text-xs">{os.descricao_problema}</p>
                        </div>
                      )}
                      {servicos.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1"><Wrench className="w-3 h-3" /> Serviços executados</p>
                          <div className="space-y-0.5">
                            {servicos.map((i, idx) => (
                              <div key={idx} className="text-xs flex justify-between gap-2">
                                <span className="truncate">{i.quantidade}× {i.descricao}</span>
                                <span className="text-muted-foreground shrink-0">{formatCurrency(i.valor_total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {pecas.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1"><Package className="w-3 h-3" /> Peças utilizadas</p>
                          <div className="space-y-0.5">
                            {pecas.map((i, idx) => (
                              <div key={idx} className="text-xs flex justify-between gap-2">
                                <span className="truncate">{i.quantidade}× {i.descricao}</span>
                                <span className="text-muted-foreground shrink-0">{formatCurrency(i.valor_total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {os.tecnico_responsavel && <p className="text-xs"><span className="text-muted-foreground">Técnico:</span> {os.tecnico_responsavel}</p>}
                      {os.observacoes && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Observações</p>
                          <p className="text-xs">{os.observacoes}</p>
                        </div>
                      )}
                      {os.timeline?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1"><HistoryIcon className="w-3 h-3" /> Histórico de atendimento</p>
                          <div className="space-y-0.5">
                            {os.timeline.slice(-6).map((t, idx) => (
                              <div key={idx} className="text-[11px] text-muted-foreground">{formatDate(t.data)} — {t.descricao || t.etapa}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}