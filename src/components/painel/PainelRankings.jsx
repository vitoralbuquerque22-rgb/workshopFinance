import { Trophy, Award } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

function RankingLista({ titulo, icon: Icon, dados }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-amber-500" />
        <h3 className="font-heading font-semibold text-sm">{titulo}</h3>
      </div>
      {dados.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem dados hoje</p>
      ) : (
        <ul className="space-y-2.5">
          {dados.map((d, i) => (
            <li key={d.nome} className="flex items-center gap-3">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-secondary text-muted-foreground'}`}>{i + 1}</span>
              <span className="text-sm flex-1 truncate">{d.nome}</span>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{formatCurrency(d.faturamento)}</p>
                <p className="text-[11px] text-muted-foreground">{d.os} OS</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PainelRankings({ consultores, tecnicos }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <RankingLista titulo="Ranking de Consultores (hoje)" icon={Trophy} dados={consultores} />
      <RankingLista titulo="Ranking de Técnicos (hoje)" icon={Award} dados={tecnicos} />
    </div>
  );
}