import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '@/lib/format';
import { Navigation, Loader2, ClipboardCheck, AlertTriangle, Sparkles } from 'lucide-react';

const STATUS_ITEM = {
  ok: { label: 'OK', cls: 'bg-green-100 text-green-700' },
  atencao: { label: 'Atenção', cls: 'bg-amber-100 text-amber-700' },
  necessita_reparo: { label: 'Reparo', cls: 'bg-red-100 text-red-700' },
};

// Histórico de atendimentos GPS (conferência, PPV e pré-diagnóstico) de um cliente.
// Importante para CRM/pós-venda: revela oportunidades pendentes para vender ao mesmo cliente.
export default function GpsHistoricoCliente({ clienteId, veiculoId, placa }) {
  const navigate = useNavigate();
  const [atendimentos, setAtendimentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clienteId && !veiculoId) { setLoading(false); return; }
    const query = veiculoId ? { veiculo_id: veiculoId } : { cliente_id: clienteId };
    base44.entities.GpsAtendimento.filter(query, '-created_date', 20)
      .then(setAtendimentos)
      .finally(() => setLoading(false));
  }, [clienteId, veiculoId]);

  const executarGps = () => {
    const params = new URLSearchParams();
    if (veiculoId) params.set('veiculo', veiculoId);
    if (clienteId) params.set('cliente', clienteId);
    if (placa) params.set('placa', placa);
    navigate(`/gps-vendas?${params.toString()}`);
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Atendimentos GPS ({atendimentos.length})</p>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={executarGps}>
          <Navigation className="w-3 h-3" /> Executar GPS
        </Button>
      </div>

      {atendimentos.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Nenhuma inspeção registrada para este cliente ainda.</p>
      ) : (
        <div className="space-y-2">
          {atendimentos.map((atd) => {
            const reparos = (atd.respostas || []).filter((r) => r.status === 'necessita_reparo');
            const atencao = (atd.respostas || []).filter((r) => r.status === 'atencao');
            const oportunidade = reparos.length + atencao.length;
            return (
              <div key={atd.id} className="bg-background border border-border rounded-lg p-2.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium">{atd.modelo_nome || 'Inspeção'}</span>
                    <Badge variant="secondary" className="text-[10px] h-4">{atd.status}</Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{formatDateTime(atd.created_date)}</span>
                </div>
                {oportunidade > 0 && (
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {reparos.length > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_ITEM.necessita_reparo.cls}`}>{reparos.length} reparo(s)</span>}
                    {atencao.length > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_ITEM.atencao.cls}`}>{atencao.length} atenção</span>}
                    <span className="text-[10px] text-amber-600 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Oportunidade de venda</span>
                  </div>
                )}
                {(reparos.length > 0 || atencao.length > 0) && (
                  <ul className="mt-1.5 space-y-0.5">
                    {[...reparos, ...atencao].slice(0, 4).map((r, i) => (
                      <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'necessita_reparo' ? 'bg-red-500' : 'bg-amber-500'}`} />
                        {r.pergunta}{r.valor_estimado ? ` · ~R$ ${r.valor_estimado}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
                {atd.ai_analise && (
                  <p className="text-[10px] text-primary flex items-center gap-1 mt-1.5"><Sparkles className="w-3 h-3" /> Análise IA disponível</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}