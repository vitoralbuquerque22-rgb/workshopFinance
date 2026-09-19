import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Megaphone, Plug, Route, BarChart3 } from 'lucide-react';

const tabs = [
  { to: '/marketing', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/marketing/leads', label: 'CRM de Leads', icon: Users },
  { to: '/marketing/campanhas', label: 'Campanhas', icon: Megaphone },
  { to: '/marketing/integracoes', label: 'Integrações', icon: Plug },
  { to: '/marketing/jornada', label: 'Jornada', icon: Route },
  { to: '/marketing/relatorios', label: 'Relatórios', icon: BarChart3 },
];

export default function MarketingNav() {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border mb-6 -mx-1 px-1">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`
          }
        >
          <t.icon className="h-4 w-4" />
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}