import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Gauge, ArrowDownCircle, ArrowUpCircle, Wallet, BarChart3, Target, Building2, Truck, Settings, Menu, X, Wrench, FileText, Landmark, Users, ClipboardList, ShoppingCart, Navigation, Package, Hammer, Layers, Handshake, Boxes, ShoppingBag, Factory, PieChart, Bot, DollarSign, Warehouse, Tag, ChevronDown, Receipt, Plug, Megaphone, Route, Percent, Gift, Settings2, Briefcase, Trash2, MessagesSquare, Bell, Zap, Activity, Barcode, MapPin, ClipboardCheck, CalendarDays, Coins } from 'lucide-react';

// Itens de topo (sem submenu)
const topItems = [
  { to: '/assistente-ia', label: 'Mecânico IA', icon: Bot },
  { to: '/conversas', label: 'Central de Conversas', icon: MessagesSquare },
];

// Grupos com submenus
const groups = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { to: '/executivo', label: 'Dashboard Executivo', icon: Activity },
      { to: '/painel', label: 'Painel Principal', icon: Gauge },
      { to: '/bi', label: 'BI Executivo', icon: PieChart },
    ],
  },
  {
    label: 'Vendas',
    icon: Handshake,
    items: [
      { to: '/ordens-servico', label: 'Ordens de Serviço', icon: Wrench },
      { to: '/clientes', label: 'Clientes', icon: Users },
      { to: '/gps-vendas', label: 'GPS de Vendas', icon: Navigation },
      { to: '/gps-config', label: 'Config. GPS', icon: ClipboardList },
    ],
  },
  {
    label: 'Pátio',
    icon: Factory,
    items: [
      { to: '/patio', label: 'Dashboard Operacional', icon: LayoutDashboard, exact: true },
      { to: '/producao', label: 'Produção', icon: Wrench },
      { to: '/agenda', label: 'Agenda Operacional', icon: CalendarDays },
      { to: '/atendimento-externo', label: 'Atendimento Externo', icon: MapPin },
      { to: '/rastreamento', label: 'Rastreamento', icon: Route },
      { to: '/auditorias', label: 'Auditorias', icon: ClipboardCheck },
      { to: '/custos', label: 'Custos Operacionais', icon: Coins },
      { to: '/frota', label: 'Frota', icon: Truck },
      { to: '/ferramentas', label: 'Ferramentas', icon: Hammer },
      { to: '/equipamentos', label: 'Equipamentos', icon: Barcode },
      { to: '/patrimonio', label: 'Patrimônio', icon: Boxes },
    ],
  },
  {
    label: 'Marketing',
    icon: Megaphone,
    items: [
      { to: '/marketing', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { to: '/marketing/leads', label: 'CRM de Leads', icon: Handshake },
      { to: '/marketing/campanhas', label: 'Campanhas', icon: Megaphone },
      { to: '/marketing/integracoes', label: 'Integrações', icon: Plug },
      { to: '/marketing/jornada', label: 'Jornada do Cliente', icon: Route },
      { to: '/marketing/relatorios', label: 'Relatórios', icon: PieChart },
    ],
  },
  {
    label: 'Estoque',
    icon: Warehouse,
    items: [
      { to: '/compras', label: 'Compras', icon: ShoppingBag },
      { to: '/pedidos-compra', label: 'Pedidos de Compra', icon: ShoppingCart },
      { to: '/pecas', label: 'Catálogo de Peças', icon: Package },
      { to: '/estoque', label: 'Estoque Profissional', icon: Boxes },
      { to: '/mao-obra', label: 'Mão de Obra', icon: Hammer },
      { to: '/servicos-compostos', label: 'Serviços Compostos', icon: Layers },
      { to: '/fornecedores', label: 'Fornecedores', icon: Truck },
    ],
  },
  {
    label: 'Remuneração',
    icon: Wallet,
    items: [
      { to: '/remuneracao', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { to: '/remuneracao/salarios', label: 'Salários', icon: Wallet },
      { to: '/remuneracao/comissoes', label: 'Comissões', icon: Percent },
      { to: '/remuneracao/bonificacoes', label: 'Bonificações', icon: Gift },
      { to: '/remuneracao/regras', label: 'Regras de Pagamento', icon: Settings2 },
      { to: '/remuneracao/cargos', label: 'Cargos', icon: Briefcase },
    ],
  },
  {
    label: 'Financeiro',
    icon: DollarSign,
    items: [
      { to: '/contas-pagar', label: 'Contas a Pagar', icon: ArrowDownCircle },
      { to: '/contas-receber', label: 'Contas a Receber', icon: ArrowUpCircle },
      { to: '/cobranca-automatica', label: 'Cobrança Automática', icon: Bell },
      { to: '/pagamentos', label: 'Pagamentos & Boletos', icon: Barcode },
      { to: '/caixa', label: 'Caixa', icon: Wallet },
      { to: '/dre', label: 'DRE & DFC', icon: BarChart3 },
      { to: '/relatorio-empresas', label: 'Resultado por Empresa', icon: Building2 },
      { to: '/orcamento', label: 'Orçamento', icon: Target },
      { to: '/notas-fiscais', label: 'Notas Fiscais Entrada', icon: FileText },
      { to: '/dashboard-fiscal', label: 'Dashboard Fiscal', icon: Receipt },
      { to: '/contas-bancarias', label: 'Contas Bancárias', icon: Landmark },
    ],
  },
  {
    label: 'Administração',
    icon: Settings,
    items: [
      { to: '/filiais', label: 'Filiais', icon: Building2 },
      { to: '/canais', label: 'Canais de Atendimento', icon: MessagesSquare },
      { to: '/config-notificacoes', label: 'Notificações Automáticas', icon: Bell },
      { to: '/automacoes-mensagem', label: 'Automações de Mensagem', icon: Zap },
      { to: '/painel-automacoes', label: 'Painel de Automações', icon: Activity },
      { to: '/os-excluidas', label: 'OS Excluídas', icon: Trash2 },
      { to: '/integracoes', label: 'Serviços de Consulta', icon: Plug },
      { to: '/configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Verifica se um item do menu corresponde à rota atual (respeitando rotas exatas)
  const isItemActive = (i) => (i.exact || i.to === '/' ? location.pathname === i.to : location.pathname.startsWith(i.to));

  // Grupo que contém a rota ativa (aberto por padrão)
  const activeGroup = groups.find((g) => g.items.some(isItemActive))?.label;
  const [openGroups, setOpenGroups] = useState(() => (activeGroup ? [activeGroup] : []));

  const toggleGroup = (label) =>
    setOpenGroups((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`;

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <p className="font-heading font-bold text-sm leading-tight">AutoGest Pro</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Gestão Automotiva</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {topItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)} className={linkClass}>
            <item.icon className="w-5 h-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}

        {groups.map((group) => {
          const isOpen = openGroups.includes(group.label);
          const hasActive = group.items.some(isItemActive);
          return (
            <div key={group.label} className="pt-1">
              <button
                onClick={() => toggleGroup(group.label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  hasActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <group.icon className="w-5 h-5 shrink-0" />
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="mt-1 ml-4 pl-3 border-l border-sidebar-border space-y-1">
                  {group.items.map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.exact} onClick={() => setMobileOpen(false)} className={linkClass}>
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-sidebar-border shrink-0">
        <p className="text-[10px] text-muted-foreground text-center">v1.0 — Núcleo Financeiro</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[250px] bg-sidebar border-r border-sidebar-border flex-col z-40">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[250px] bg-sidebar border-r border-sidebar-border animate-in slide-in-from-left duration-200">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="lg:pl-[250px]">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-background border-b border-border sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm">AutoGest Pro</span>
          </div>
          <div className="w-5" />
        </header>

        <main className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}