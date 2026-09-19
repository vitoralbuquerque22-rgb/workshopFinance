import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Barcode, RefreshCw, XCircle, Eye, Zap, Search, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import GatewayForm from '@/components/pagamentos/GatewayForm';
import BoletoDetalheDialog from '@/components/pagamentos/BoletoDetalheDialog';
import { formatCurrency, formatDate } from '@/lib/format';

const EXTERNO_LABEL = {
  PENDING: { label: 'Aguardando', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  RECEIVED: { label: 'Pago', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CONFIRMED: { label: 'Pago', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  RECEIVED_IN_CASH: { label: 'Pago', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OVERDUE: { label: 'Vencido', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const filtros = [
  { key: 'all', label: 'Todos' },
  { key: 'com_boleto', label: 'Com boleto' },
  { key: 'sem_boleto', label: 'Sem boleto' },
];

export default function Pagamentos() {
  const [gateway, setGateway] = useState(null);
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // id da conta em processamento
  const [filtro, setFiltro] = useState('all');
  const [search, setSearch] = useState('');
  const [detalhe, setDetalhe] = useState(null);
  const [erro, setErro] = useState('');

  const load = async () => {
    const [gws, cr] = await Promise.all([
      base44.entities.GatewayPagamento.filter({ ativo: true }).catch(() => []),
      base44.entities.ContaReceber.filter({ status: 'pendente' }, '-data_vencimento', 100).catch(() => []),
    ]);
    setGateway(gws[0] || null);
    setContas(cr);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const acao = async (action, conta) => {
    setBusy(conta.id); setErro('');
    try {
      const res = await base44.functions.invoke('manageBoletos', { action, conta_receber_id: conta.id });
      if (res.data?.error) { setErro(res.data.error); return; }
      await load();
      if (action === 'gerar') {
        const atualizada = await base44.entities.ContaReceber.get(conta.id).catch(() => null);
        if (atualizada) setDetalhe(atualizada);
      }
    } catch (err) {
      setErro(err.response?.data?.error || err.message || 'Erro ao processar cobrança');
    } finally { setBusy(null); }
  };

  const filtered = contas.filter((c) => {
    const temBoleto = !!c.boleto?.id_externo;
    const matchFiltro = filtro === 'all' || (filtro === 'com_boleto' ? temBoleto : !temBoleto);
    const matchSearch = !search ||
      c.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      c.cliente?.toLowerCase().includes(search.toLowerCase());
    return matchFiltro && matchSearch;
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Pagamentos & Boletos" description="Integração bancária · gere e gerencie boletos e PIX a partir das contas a receber" />

      <GatewayForm gateway={gateway} onSaved={load} />

      {!gateway?.api_key && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Nenhum token de gateway configurado — os boletos serão gerados em <strong>modo simulado</strong> para testes. Cadastre a chave de API acima para emitir cobranças reais.</span>
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex flex-wrap gap-1.5">
              {filtros.map((f) => (
                <button key={f.key} onClick={() => setFiltro(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtro === f.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 sm:w-64" />
            </div>
          </div>

          {erro && <div className="flex items-center gap-2 text-destructive text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{erro}</div>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4">Descrição</th>
                  <th className="py-2 pr-4 hidden sm:table-cell">Cliente</th>
                  <th className="py-2 pr-4">Vencimento</th>
                  <th className="py-2 pr-4 text-right">Valor</th>
                  <th className="py-2 pr-4 text-center">Cobrança</th>
                  <th className="py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Nenhuma conta a receber pendente</td></tr>
                ) : filtered.map((c) => {
                  const temBoleto = !!c.boleto?.id_externo;
                  const ext = EXTERNO_LABEL[c.boleto?.status_externo] || null;
                  return (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2.5 pr-4">
                        <p className="font-medium">{c.descricao}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{c.cliente}</p>
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground hidden sm:table-cell">{c.cliente || '—'}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{formatDate(c.data_vencimento)}</td>
                      <td className="py-2.5 pr-4 text-right font-semibold text-emerald-600">{formatCurrency(c.valor)}</td>
                      <td className="py-2.5 pr-4 text-center">
                        {temBoleto
                          ? <span className={`text-xs px-2 py-0.5 rounded-full border ${ext?.cls || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{ext?.label || c.boleto.status_externo}</span>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {!temBoleto ? (
                            <Button size="sm" variant="outline" onClick={() => acao('gerar', c)} disabled={busy === c.id}>
                              {busy === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Zap className="w-3.5 h-3.5" /> Gerar</>}
                            </Button>
                          ) : (
                            <>
                              <button onClick={() => setDetalhe(c)} title="Ver cobrança" className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => acao('sincronizar', c)} title="Sincronizar status" disabled={busy === c.id} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                                {busy === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                              </button>
                              <button onClick={() => acao('cancelar', c)} title="Cancelar boleto" disabled={busy === c.id} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><XCircle className="w-4 h-4" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <BoletoDetalheDialog open={!!detalhe} onOpenChange={(v) => !v && setDetalhe(null)} conta={detalhe} />
    </div>
  );
}