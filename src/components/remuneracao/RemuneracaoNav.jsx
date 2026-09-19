import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Percent, Gift, Settings2, Briefcase } from 'lucide-react';

const links = [
  { to: '/remuneracao', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/remuneracao/salarios', label: 'Salários', icon: Wallet },
  { to: '/remuneracao/comissoes', label: 'Comissões', icon: Percent },
  { to: '/remuneracao/bonificacoes', label: 'Bonificações', icon: Gift },
  { to: '/remuneracao/regras', label: 'Regras de Pagamento', icon: Settings2 },
  { to: '/remuneracao/cargos', label: 'Cargos', icon: Briefcase },
];

export default function RemuneracaoNav() {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 border-b mb-6">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            `flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm rounded-md transition-colors ${
              isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
            }`
          }
        >
          <l.icon className="w-4 h-4" /> {l.label}
        </NavLink>
      ))}
    </div>
  );
}