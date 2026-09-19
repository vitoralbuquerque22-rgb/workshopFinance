import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import RemuneracaoGuard from '@/components/remuneracao/RemuneracaoGuard';
import KPICard from '@/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { loadRemuneracaoData, simularColaborador, ordensDoPeriodo } from '@/lib/remuneracao';
import { formatCurrency } from '@/lib/format';
import { Wallet, Percent, Gift, Clock, TrendingUp, Loader2, Users } from 'lucide-react';

function inicioMes() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; }
function fimMes() { const d = new Date(); const l = new Date(d.getFullYear(), d.getMonth() + 1, 0); return `${l.getFullYear()}-${String(l.getMonth() + 1).padStart(2, '0')}-${String(l.getDate()).padStart(2, '0')}`; }

export default function Remuneracao() {
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState({ salario: 0, comissao: 0, bonus: 0, horasProd: 0, horasVend: 0, valorProd: 0, linhas: [] });

  useEffect(() => {
    (async () => {
      const base = await loadRemuneracaoData();
      const ordens = ordensDoPeriodo(await base44.entities.OrdemServico.list('-created_date', 1000), inicioMes(), fimMes());
      const ativos = base.colaboradores.filter((c) => c.status === 'ativo');
      let salario = 0, comissao = 0, bonus = 0, horasProd = 0, horasVend = 0, valorProd = 0;
      const linhas = ativos.map((c) => {
        const r = simularColaborador({ colaborador: c, ordens, regras: base.regras, bonificacoes: base.bonificacoes, config: base.config });
        salario += r.salario; comissao += r.comissao; bonus += r.bonificacao;
        horasProd += r.horasProduzidas; horasVend += r.horasVendidas; valorProd += r.valorProduzido;
        return { nome: c.nome, ...r };
      }).sort((a, b) => b.totalLiquido - a.totalLiquido);
      setResumo({ salario, comissao, bonus, horasProd, horasVend, valorProd, linhas, total: ativos.length });
      setLoading(false);
    })();
  }, []);

  const eficiencia = resumo.horasVend > 0 ? (resumo.horasProd / resumo.horasVend) * 100 : 0;

  return (
    <RemuneracaoGuard>
      <PageHeader title="Remuneração" description="Painel consolidado do mês atual — motor de regras de remuneração" />
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard title="Folha salarial" value={formatCurrency(resumo.salario)} icon={Wallet} />
            <KPICard title="Comissões" value={formatCurrency(resumo.comissao)} icon={Percent} />
            <KPICard title="Bonificações" value={formatCurrency(resumo.bonus)} icon={Gift} />
            <KPICard title="Custo total" value={formatCurrency(resumo.salario + resumo.comissao + resumo.bonus)} icon={TrendingUp} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KPICard title="Colaboradores ativos" value={resumo.total} icon={Users} />
            <KPICard title="Horas produzidas" value={`${resumo.horasProd.toFixed(1)}h`} icon={Clock} />
            <KPICard title="Horas vendidas" value={`${resumo.horasVend.toFixed(1)}h`} icon={Clock} />
            <KPICard title="Eficiência" value={`${eficiencia.toFixed(0)}%`} icon={TrendingUp} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Ranking de remuneração (mês)</CardTitle></CardHeader>
            <CardContent>
              {resumo.linhas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Cadastre colaboradores para ver o painel.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground border-b">
                      <tr>
                        <th className="text-left py-2">Colaborador</th>
                        <th className="text-right">Salário</th>
                        <th className="text-right">Comissão</th>
                        <th className="text-right">Bônus</th>
                        <th className="text-right">Horas prod.</th>
                        <th className="text-right">Líquido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumo.linhas.map((l, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 font-medium">{l.nome}</td>
                          <td className="text-right">{formatCurrency(l.salario)}</td>
                          <td className="text-right text-primary">{formatCurrency(l.comissao)}</td>
                          <td className="text-right">{formatCurrency(l.bonificacao)}</td>
                          <td className="text-right">{l.horasProduzidas.toFixed(1)}h</td>
                          <td className="text-right font-semibold">{formatCurrency(l.totalLiquido)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </RemuneracaoGuard>
  );
}