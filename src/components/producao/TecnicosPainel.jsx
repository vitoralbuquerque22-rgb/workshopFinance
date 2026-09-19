import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Pause } from 'lucide-react';
import { produtividadeTecnicos, apontamentoPorTecnico } from '@/lib/producao';
import { motivoPausaLabel } from '@/lib/apontamentoHoras';
import { formatCurrency } from '@/lib/format';

export default function TecnicosPainel({ ordens }) {
  const tecnicos = produtividadeTecnicos(ordens, 30);
  const apont = apontamentoPorTecnico(ordens);
  if (tecnicos.length === 0) {
    return (
      <Card className="p-10 flex flex-col items-center justify-center text-center">
        <Users className="w-10 h-10 text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground">Nenhum técnico com produção registrada</p>
      </Card>
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {tecnicos.map((t) => (
        <Card key={t.tecnico} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm">
                {t.tecnico.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">{t.tecnico}</p>
                <p className="text-xs text-muted-foreground">{t.concluidas} concluídas · {t.emAndamento} em andamento</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold font-heading leading-none">{t.horas}h</p>
              <p className="text-[11px] text-muted-foreground">últimos 30d</p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Eficiência</span>
                <span className="font-medium">{t.eficiencia}%</span>
              </div>
              <Progress value={t.eficiencia} className="h-1.5" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div><span className="text-muted-foreground">Ociosidade:</span> <strong>{t.ociosidade}%</strong></div>
              <div><span className="text-muted-foreground">Retrabalho:</span> <strong className={t.taxaRetrabalho > 10 ? 'text-red-600' : ''}>{t.taxaRetrabalho}%</strong></div>
              <div className="text-right"><span className="text-muted-foreground">Receita:</span> <strong>{formatCurrency(t.receita)}</strong></div>
            </div>
            {apont[t.tecnico] && (
              <div className="pt-2 mt-1 border-t text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horas apontadas (cronômetro)</span>
                  <strong>{apont[t.tecnico].horasApontadas}h</strong>
                </div>
                {apont[t.tecnico].nPausas > 0 && (
                  <div className="flex items-start gap-1 text-amber-700">
                    <Pause className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>
                      {apont[t.tecnico].nPausas} pausa(s) · {apont[t.tecnico].minutosPausa} min ·{' '}
                      {Object.entries(apont[t.tecnico].pausasPorMotivo).map(([m, min]) => `${motivoPausaLabel(m)} (${Math.round(min)}min)`).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}