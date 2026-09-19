import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/format';
import { Link } from 'react-router-dom';
import { FileClock, Loader2, Receipt, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

const formasPagamento = [
  { value: 'pix', label: 'PIX (baixa automática)' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência' },
];

export default function EmissaoEmMassa({ onEmitido }) {
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState({});
  const [loading, setLoading] = useState(true);
  const [selecionadas, setSelecionadas] = useState([]);
  const [forma, setForma] = useState('pix');
  const [emitindo, setEmitindo] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    // OS finalizadas, aguardando faturamento, sem nota emitida
    const os = await base44.entities.OrdemServico.filter({ etapa_fluxo: 'aguardando_faturamento' }, '-data_fechamento', 200);
    const aptas = os.filter((o) => !o.nota_fiscal_id && (o.itens || []).length > 0);
    setOrdens(aptas);
    const ids = [...new Set(aptas.map((o) => o.cliente_id).filter(Boolean))];
    const mapa = {};
    for (const id of ids) {
      const c = await base44.entities.Cliente.get(id).catch(() => null);
      if (c) mapa[id] = c;
    }
    setClientes(mapa);
    setSelecionadas([]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = (id) => setSelecionadas((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const toggleAll = () => setSelecionadas((s) => s.length === ordens.length ? [] : ordens.map((o) => o.id));

  const emitir = async () => {
    setEmitindo(true); setError(''); setResultado(null);
    try {
      const res = await base44.functions.invoke('manageNfeSaida', {
        action: 'emitir_lote', ordens_servico_ids: selecionadas, forma_pagamento: forma,
      });
      if (res.data?.error) { setError(res.data.error); return; }
      setResultado(res.data);
      await load();
      onEmitido?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erro na emissão em massa');
    } finally { setEmitindo(false); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-sm flex items-center gap-2"><FileClock className="w-4 h-4 text-amber-600" /> Emissão em Massa — OS Aguardando Faturamento</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={forma} onValueChange={setForma}>
            <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {formasPagamento.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={emitir} disabled={emitindo || selecionadas.length === 0}>
            {emitindo ? <><Loader2 className="w-4 h-4 animate-spin" /> Emitindo...</> : <><Receipt className="w-4 h-4" /> Emitir {selecionadas.length || ''} Nota(s)</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {resultado && (
          <div className="mx-4 mt-1 mb-3 flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{resultado.emitidas} de {resultado.total} nota(s) emitida(s)</p>
              {resultado.falhas > 0 && <p className="text-xs text-rose-600 mt-0.5">{resultado.falhas} falha(s): {resultado.resultados.filter((r) => !r.sucesso).map((r) => r.error).join('; ')}</p>}
            </div>
          </div>
        )}
        {error && <div className="mx-4 mb-3 flex items-center gap-2 text-destructive text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : ordens.length === 0 ? (
          <p className="text-sm text-muted-foreground px-4 py-8 text-center">Nenhuma OS aguardando faturamento no momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3 w-8"><Checkbox checked={selecionadas.length === ordens.length && ordens.length > 0} onCheckedChange={toggleAll} /></th>
                  <th className="text-left px-4 py-3 font-medium">OS</th>
                  <th className="text-left px-4 py-3 font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">CPF/CNPJ</th>
                  <th className="text-right px-4 py-3 font-medium">Valor</th>
                  <th className="text-center px-4 py-3 font-medium">Abrir</th>
                </tr>
              </thead>
              <tbody>
                {ordens.map((o) => {
                  const c = clientes[o.cliente_id];
                  const sel = selecionadas.includes(o.id);
                  return (
                    <tr key={o.id} className={`border-b last:border-0 hover:bg-muted/40 ${sel ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-3"><Checkbox checked={sel} onCheckedChange={() => toggle(o.id)} /></td>
                      <td className="px-4 py-3 font-medium">{o.numero || o.id.slice(-6)}</td>
                      <td className="px-4 py-3 truncate max-w-[180px]">{c?.nome || c?.razao_social || '—'}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{c?.cnpj || c?.cpf || <span className="text-amber-600">sem doc.</span>}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.valor_total)}</td>
                      <td className="px-4 py-3 text-center">
                        <Link to={`/ordens-servico/${o.id}`} className="text-primary hover:underline inline-flex items-center gap-1 text-xs"><ExternalLink className="w-3 h-3" /></Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}