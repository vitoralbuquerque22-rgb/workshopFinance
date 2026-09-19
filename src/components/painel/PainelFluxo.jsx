import { Car, Wrench, Clock, PackageSearch, AlertTriangle } from 'lucide-react';

const cards = [
  { key: 'entraramHoje', label: 'Entraram hoje', icon: Car, color: 'text-primary bg-primary/10' },
  { key: 'emProducao', label: 'Em produção', icon: Wrench, color: 'text-blue-600 bg-blue-50' },
  { key: 'aguardandoAprovacao', label: 'Aguardando aprovação', icon: Clock, color: 'text-amber-600 bg-amber-50' },
  { key: 'aguardandoPecas', label: 'Aguardando peças', icon: PackageSearch, color: 'text-purple-600 bg-purple-50' },
  { key: 'atrasados', label: 'Atrasados', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
];

export default function PainelFluxo({ fluxo }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <div key={key} className="bg-card rounded-xl border border-border p-4 card-hover">
          <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${color} mb-3`}>
            <Icon className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold font-heading">{fluxo[key]}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}