import { Card } from '@/components/ui/card';
import { Car, Hammer, CheckCircle2, AlertTriangle, Clock, Gauge, Repeat, MoveVertical } from 'lucide-react';

function KPI({ icon: Icon, label, value, sub, tone = 'default' }) {
  const tones = {
    default: 'text-primary bg-primary/10',
    green: 'text-green-600 bg-green-500/10',
    amber: 'text-amber-600 bg-amber-500/10',
    red: 'text-red-600 bg-red-500/10',
  };
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-bold font-heading leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
      </div>
    </Card>
  );
}

export default function ProducaoKPIs({ ind }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KPI icon={Car} label="Fila de veículos" value={ind.filaTotal} sub={`${ind.emExecucao} em execução`} />
      <KPI icon={Hammer} label="Em execução" value={ind.emExecucao} sub={`${ind.nTecnicos} técnicos ativos`} />
      <KPI icon={CheckCircle2} label="Concluídas (30d)" value={ind.concluidasPeriodo} tone="green" />
      <KPI icon={AlertTriangle} label="Atrasadas" value={ind.atrasadas} tone={ind.atrasadas > 0 ? 'red' : 'default'} />
      <KPI icon={Clock} label="Tempo médio" value={`${ind.tempoMedioHoras}h`} sub="por OS concluída" />
      <KPI icon={Gauge} label="Eficiência" value={`${ind.eficienciaGlobal}%`} sub={`${ind.ociosidadeGlobal}% ociosidade`} tone={ind.eficienciaGlobal >= 70 ? 'green' : 'amber'} />
      <KPI icon={Repeat} label="Retrabalho" value={`${ind.taxaRetrabalho}%`} tone={ind.taxaRetrabalho > 10 ? 'red' : 'default'} />
      <KPI icon={MoveVertical} label="Elevadores" value={`${ind.elevadoresOcupados}/${ind.totalElevadores}`} sub={`${ind.ocupacaoElevadores}% ocupação`} tone={ind.elevadoresLivres === 0 && ind.totalElevadores > 0 ? 'red' : 'default'} />
    </div>
  );
}