import { Card, CardContent } from '@/components/ui/card';
import {
  Wrench, Truck, PackageSearch, PackageX, ClipboardCheck,
  Ban, TrendingDown, Clock, Route, DollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { formatarMinutos } from '@/lib/dashboardOperacional';

// Cada indicador é um card compacto. `tone` controla a cor do ícone/valor de alerta.
function Indicador({ label, valor, sub, icon: Icon, tone = 'slate', alerta }) {
  const tones = {
    slate: 'text-slate-600 bg-slate-100',
    blue: 'text-blue-600 bg-blue-100',
    emerald: 'text-emerald-600 bg-emerald-100',
    amber: 'text-amber-600 bg-amber-100',
    red: 'text-red-600 bg-red-100',
    violet: 'text-violet-600 bg-violet-100',
  };
  return (
    <Card className={alerta ? 'border-amber-200' : ''}>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold font-heading mt-1">{valor}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${tones[tone]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function IndicadoresGrid({ dados }) {
  const d = dados;
  const cards = [
    { label: 'Produção (OS ativas)', valor: d.producao.ativas, sub: `${d.producao.concluidas} concluídas`, icon: Wrench, tone: 'blue' },
    { label: 'Atendimentos externos', valor: d.atendimentosExternos.ativos, sub: `${d.atendimentosExternos.concluidos} concluídos`, icon: Truck, tone: 'violet' },
    { label: 'Ferramentas em uso', valor: d.ferramentasEmUso, icon: PackageSearch, tone: 'blue' },
    { label: 'Ferramentas pendentes', valor: d.ferramentasPendentes, sub: 'não devolvidas', icon: PackageX, tone: d.ferramentasPendentes > 0 ? 'amber' : 'slate', alerta: d.ferramentasPendentes > 0 },
    { label: 'Auditorias pendentes', valor: d.auditoriasPendentes, icon: ClipboardCheck, tone: d.auditoriasPendentes > 0 ? 'amber' : 'slate', alerta: d.auditoriasPendentes > 0 },
    { label: 'Equipamentos parados', valor: d.equipamentosParados, sub: 'em manutenção/baixa', icon: Ban, tone: d.equipamentosParados > 0 ? 'red' : 'slate', alerta: d.equipamentosParados > 0 },
    { label: 'Custos operacionais', valor: formatCurrency(d.custoTotal), icon: TrendingDown, tone: 'red' },
    { label: 'Tempo médio de atendimento', valor: formatarMinutos(d.tempoMedioAtendimento), icon: Clock, tone: 'slate' },
    { label: 'Tempo médio de deslocamento', valor: formatarMinutos(d.tempoMedioDeslocamento), icon: Route, tone: 'slate' },
    { label: 'Lucratividade por atendimento', valor: formatCurrency(d.lucroMedioAtendimento), sub: 'média por atendimento', icon: DollarSign, tone: d.lucroMedioAtendimento >= 0 ? 'emerald' : 'red' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => <Indicador key={c.label} {...c} />)}
    </div>
  );
}