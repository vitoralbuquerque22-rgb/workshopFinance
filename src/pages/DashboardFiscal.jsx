import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/StatusBadge';
import EmissaoEmMassa from '@/components/fiscal/EmissaoEmMassa';
import { formatCurrency, formatDate } from '@/lib/format';
import { Link } from 'react-router-dom';
import { Receipt, XCircle, Clock, FileWarning, DollarSign, Percent, Users, Wrench, Package, Loader2 } from 'lucide-react';

function isHoje(dateStr) {
  if (!dateStr) return false;
  const hoje = new Date().toISOString().split('T')[0];
  return String(dateStr).split('T')[0] === hoje;
}

export default function DashboardFiscal() {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    const saidas = await base44.entities.NotaFiscal.filter({ tipo: 'saida' }, '-data_emissao', 500);
    setNotas(saidas);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const autorizadas = notas.filter((n) => n.status === 'autorizada');
  const emitidasHoje = notas.filter((n) => isHoje(n.data_emissao) && n.status !== 'cancelada');
  const canceladas = notas.filter((n) => n.status === 'cancelada');
  const pendentes = notas.filter((n) => n.status === 'rascunho' || n.status === 'erro');
  const xmlPendentes = autorizadas.filter((n) => !n.xml_url);

  const valorFaturado = autorizadas.reduce((s, n) => s + (Number(n.valor_total) || 0), 0);
  const totalImpostos = autorizadas.reduce((s, n) => s + (Number(n.valor_tributos) || 0), 0);
  const totalServicos = autorizadas.reduce((s, n) => s + (Number(n.valor_servicos) || 0), 0);
  const totalPecas = autorizadas.reduce((s, n) => s + (Number(n.valor_produtos) || 0), 0);
  const clientesUnicos = new Set(autorizadas.map((n) => n.cliente_id).filter(Boolean)).size;
  const cargaTributaria = valorFaturado > 0 ? (totalImpostos / valorFaturado) * 100 : 0;

  const kpis = [
    { label: 'Emitidas hoje', value: emitidasHoje.length, icon: Receipt, color: 'text-blue-600 bg-blue-50' },
    { label: 'Canceladas', value: canceladas.length, icon: XCircle, color: 'text-rose-600 bg-rose-50' },
    { label: 'Pendentes', value: pendentes.length, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'XML pendentes', value: xmlPendentes.length, icon: FileWarning, color: 'text-orange-600 bg-orange-50' },
    { label: 'Valor faturado', value: formatCurrency(valorFaturado), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Impostos', value: formatCurrency(totalImpostos), icon: Percent, color: 'text-violet-600 bg-violet-50' },
    { label: 'Clientes', value: clientesUnicos, icon: Users, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Serviços', value: formatCurrency(totalServicos), icon: Wrench, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Peças', value: formatCurrency(totalPecas), icon: Package, color: 'text-teal-600 bg-teal-50' },
    { label: 'Carga tributária', value: `${cargaTributaria.toFixed(1)}%`, icon: Percent, color: 'text-fuchsia-600 bg-fuchsia-50' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Módulo Fiscal" description="Emissão, monitoramento e controle centralizado das notas fiscais de saída" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="py-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${k.color}`}>
                <k.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground truncate">{k.label}</p>
                <p className="text-base font-bold truncate">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <EmissaoEmMassa onEmitido={carregar} />

      <Card>
        <CardHeader><CardTitle className="text-sm">Notas fiscais de saída recentes</CardTitle></CardHeader>
        <CardContent className="p-0">
          {notas.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 py-8 text-center">Nenhuma nota de saída emitida ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Número</th>
                    <th className="text-left px-4 py-3 font-medium">Destinatário</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Emissão</th>
                    <th className="text-right px-4 py-3 font-medium">Valor</th>
                    <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Tributos</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="text-center px-4 py-3 font-medium">OS</th>
                  </tr>
                </thead>
                <tbody>
                  {notas.slice(0, 50).map((n) => (
                    <tr key={n.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{n.numero}/{n.serie}</td>
                      <td className="px-4 py-3 truncate max-w-[180px]">{n.destinatario_nome || '—'}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">{formatDate(n.data_emissao)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(n.valor_total)}</td>
                      <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">{formatCurrency(n.valor_tributos)}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={n.status} /></td>
                      <td className="px-4 py-3 text-center">
                        {n.ordem_servico_id ? (
                          <Link to={`/ordens-servico/${n.ordem_servico_id}`} className="text-primary hover:underline text-xs">Abrir</Link>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}