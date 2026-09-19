import KPICard from '@/components/KPICard';
import { DollarSign, TrendingUp, Package, Percent, Receipt, Target, Wrench, AlertTriangle, Boxes, Landmark, Users, UserCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export default function BiKPIs({ kpis, comp }) {
  return (
    <div className="space-y-4">
      {/* Linha principal: resultado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Faturamento" value={formatCurrency(kpis.faturamento)} icon={DollarSign} variant="primary" trend={comp?.faturamento} trendLabel="vs anterior" />
        <KPICard title="Lucro" value={formatCurrency(kpis.lucro)} icon={TrendingUp} variant={kpis.lucro >= 0 ? 'success' : 'danger'} trend={comp?.lucro} trendLabel="vs anterior" />
        <KPICard title="CMV" value={formatCurrency(kpis.cmv)} icon={Package} variant="default" />
        <KPICard title="Markup" value={`${kpis.markup.toFixed(1)}%`} icon={Percent} variant="default" />
      </div>

      {/* Linha comercial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Ticket Médio" value={formatCurrency(kpis.ticketMedio)} icon={Receipt} variant="default" trend={comp?.ticketMedio} trendLabel="vs anterior" />
        <KPICard title="Conversão OS" value={`${kpis.conversao.toFixed(1)}%`} icon={Target} variant="default" trend={comp?.conversao} trendLabel="vs anterior" />
        <KPICard title="OS Abertas" value={kpis.osAbertas} icon={Wrench} variant="default" />
        <KPICard title="OS Atrasadas" value={kpis.osAtrasadas} icon={AlertTriangle} variant={kpis.osAtrasadas > 0 ? 'warning' : 'default'} />
      </div>

      {/* Linha operacional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Peças Vendidas" value={formatCurrency(kpis.valorPecas)} icon={Package} variant="default" />
        <KPICard title="Valor em Estoque" value={formatCurrency(kpis.valorEstoque)} icon={Boxes} variant="default" />
        <KPICard title="Saldo Financeiro" value={formatCurrency(kpis.saldoFinanceiro)} icon={Landmark} variant={kpis.saldoFinanceiro >= 0 ? 'success' : 'danger'} />
        <KPICard title="Clientes Ativos" value={kpis.clientesAtivos} icon={Users} variant="default" />
      </div>
    </div>
  );
}