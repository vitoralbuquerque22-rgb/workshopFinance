import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, FileText, ArrowUpCircle, Clock } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { formatCurrency } from '@/lib/format';
import { montarRelatorioEmpresas } from '@/lib/relatorioEmpresas';

// Primeiro e último dia do mês atual como período padrão
function periodoMesAtual() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { inicio: iso(inicio), fim: iso(fim) };
}

const KPI = ({ icon: Icon, label, valor, cor }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold font-heading">{valor}</p>
      </div>
    </CardContent>
  </Card>
);

export default function RelatorioEmpresas() {
  const [filiais, setFiliais] = useState([]);
  const [notas, setNotas] = useState([]);
  const [recebiveis, setRecebiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState(periodoMesAtual());
  const [filialFiltro, setFilialFiltro] = useState('todas');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [fs, nfs, crs] = await Promise.all([
        base44.entities.Filial.list(),
        base44.entities.NotaFiscal.filter({ tipo: 'saida' }, '-data_emissao', 1000),
        base44.entities.ContaReceber.list('-data_vencimento', 2000),
      ]);
      setFiliais(fs || []);
      setNotas(nfs || []);
      setRecebiveis(crs || []);
      setLoading(false);
    })();
  }, []);

  const relatorio = useMemo(
    () => montarRelatorioEmpresas({ filiais, notas, recebiveis }, periodo),
    [filiais, notas, recebiveis, periodo]
  );

  const linhasFiltradas = useMemo(() => {
    if (filialFiltro === 'todas') return relatorio.linhas;
    return relatorio.linhas.filter((l) => l.filial_id === filialFiltro);
  }, [relatorio.linhas, filialFiltro]);

  const totais = useMemo(() => {
    if (filialFiltro === 'todas') return relatorio.totais;
    return linhasFiltradas.reduce(
      (acc, l) => ({
        faturado: acc.faturado + l.faturado,
        recebido: acc.recebido + l.recebido,
        a_receber: acc.a_receber + l.a_receber,
        qtd_notas: acc.qtd_notas + l.qtd_notas,
        qtd_recebimentos: acc.qtd_recebimentos + l.qtd_recebimentos,
      }),
      { faturado: 0, recebido: 0, a_receber: 0, qtd_notas: 0, qtd_recebimentos: 0 }
    );
  }, [relatorio.totais, linhasFiltradas, filialFiltro]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faturamento e Recebimento por Empresa"
        description="Resultado separado por CNPJ: quanto cada empresa faturou (notas) e recebeu (split)."
      />

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="grid grid-cols-2 gap-3 flex-1">
            <div>
              <Label className="text-xs">Início</Label>
              <Input type="date" value={periodo.inicio} onChange={(e) => setPeriodo((p) => ({ ...p, inicio: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Fim</Label>
              <Input type="date" value={periodo.fim} onChange={(e) => setPeriodo((p) => ({ ...p, fim: e.target.value }))} />
            </div>
          </div>
          <div className="flex-1">
            <Label className="text-xs">Empresa / CNPJ</Label>
            <Select value={filialFiltro} onValueChange={setFilialFiltro}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as empresas</SelectItem>
                {filiais.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.nome}{f.tipo === 'matriz' ? ' (Matriz)' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={FileText} label="Faturado (notas)" valor={formatCurrency(totais.faturado)} cor="bg-blue-100 text-blue-700" />
        <KPI icon={ArrowUpCircle} label="Recebido" valor={formatCurrency(totais.recebido)} cor="bg-emerald-100 text-emerald-700" />
        <KPI icon={Clock} label="A receber" valor={formatCurrency(totais.a_receber)} cor="bg-amber-100 text-amber-700" />
        <KPI icon={Building2} label="Empresas ativas" valor={String(linhasFiltradas.filter((l) => l.faturado || l.recebido).length)} cor="bg-slate-100 text-slate-700" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resultado por empresa</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 flex justify-center">
              <div className="w-6 h-6 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="text-right">Faturado</TableHead>
                    <TableHead className="text-right">Peças</TableHead>
                    <TableHead className="text-right">Serviços</TableHead>
                    <TableHead className="text-center">Notas</TableHead>
                    <TableHead className="text-right">Recebido</TableHead>
                    <TableHead className="text-right">A receber</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhasFiltradas.map((l) => (
                    <TableRow key={l.filial_id || 'sem_cnpj'}>
                      <TableCell>
                        <div className="font-medium">{l.nome}{l.tipo === 'matriz' ? ' (Matriz)' : ''}</div>
                        {l.cnpj && <div className="text-xs text-muted-foreground">{l.cnpj}</div>}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(l.faturado)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(l.faturado_produtos)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(l.faturado_servicos)}</TableCell>
                      <TableCell className="text-center">{l.qtd_notas}</TableCell>
                      <TableCell className="text-right text-emerald-700 font-medium">{formatCurrency(l.recebido)}</TableCell>
                      <TableCell className={`text-right font-medium ${l.a_receber > 0 ? 'text-amber-700' : 'text-muted-foreground'}`}>{formatCurrency(l.a_receber)}</TableCell>
                    </TableRow>
                  ))}
                  {linhasFiltradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum movimento no período.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}