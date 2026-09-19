import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Loader2, Wrench } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/PageHeader';
import OsForm from '@/components/os/OsForm';
import OsTableRow from '@/components/os/OsTableRow';
import PedidoCompraDialog from '@/components/os/PedidoCompraDialog';
import ReprovarOsDialog from '@/components/os/ReprovarOsDialog';
import ExcluirOsDialog from '@/components/os/ExcluirOsDialog';
import FinalizarOsDialog from '@/components/os/FinalizarOsDialog';
import OsFluxoPanel from '@/components/os/OsFluxoPanel';
import { gerarLaudoTecnico } from '@/lib/laudo';
import { abrirWhatsApp } from '@/lib/whatsapp';
import { formatCurrency } from '@/lib/format';
import { useSearchParams, useNavigate } from 'react-router-dom';

// OS "em aberto" (ainda circulando na oficina) para o ordenamento de atrasadas
const ABERTAS = ['orcamento', 'aprovado', 'em_andamento'];

const ORDENACOES = [
  { value: 'atrasadas', label: 'Mais atrasadas' },
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'antigas', label: 'Mais antigas' },
];

const STATUS_TABS = [
  { value: 'all', label: 'Todas' },
  { value: 'orcamento', label: 'Orçamentos' },
  { value: 'aprovado', label: 'Aprovadas' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluídas' },
];

export default function OrdensServico() {
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [pecas, setPecas] = useState([]);
  const [maoObra, setMaoObra] = useState([]);
  const [servicosCompostos, setServicosCompostos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ordenacao, setOrdenacao] = useState('atrasadas');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [retrabalhoOrigem, setRetrabalhoOrigem] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [pedidoDialog, setPedidoDialog] = useState({ open: false, osId: null, itens: [] });
  const [reprovarOs, setReprovarOs] = useState(null);
  const [excluirOs, setExcluirOs] = useState(null);
  const [finalizarOs, setFinalizarOs] = useState(null);
  const [visao, setVisao] = useState('lista');

  const loadData = async () => {
    try {
      const [o, c, v, f, p, pe, mo, sc, col, cg] = await Promise.all([
        base44.entities.OrdemServico.list('-created_date'),
        base44.entities.Cliente.list(),
        base44.entities.Veiculo.list(),
        base44.entities.Fornecedor.list(),
        base44.entities.PedidoCompra.list('-created_date'),
        base44.entities.Peca.list(),
        base44.entities.MaoObra.list(),
        base44.entities.ServicoComposto.list(),
        base44.entities.Colaborador.filter({ status: 'ativo' }),
        base44.entities.Cargo.list().catch(() => []),
      ]);
      setOrdens(o);
      setClientes(c);
      setVeiculos(v);
      setFornecedores(f);
      setPedidos(p);
      setPecas(pe);
      setMaoObra(mo);
      setServicosCompostos(sc);
      setColaboradores(col);
      setCargos(cg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const clienteNome = (id) => clientes.find(c => c.id === id)?.nome || '—';
  const veiculoInfo = (id) => {
    const v = veiculos.find(v => v.id === id);
    return v ? `${v.placa} · ${v.marca} ${v.modelo}` : '—';
  };
  const osPedidos = (osId) => pedidos.filter(p => p.ordem_servico_id === osId);

  const filtered = ordens.filter(o => {
    const statusMatch = statusFilter === 'all' || o.status === statusFilter;
    const cliente = clienteNome(o.cliente_id).toLowerCase();
    const veiculo = veiculoInfo(o.veiculo_id).toLowerCase();
    const q = search.toLowerCase();
    const searchMatch = cliente.includes(q) || veiculo.includes(q) || (o.numero || '').includes(q) || (o.tecnico_responsavel || '').toLowerCase().includes(q);
    return statusMatch && searchMatch;
  });

  const dataAbertura = (o) => new Date(o.data_abertura || o.created_date || 0).getTime();
  const sorted = [...filtered].sort((a, b) => {
    if (ordenacao === 'recentes') return dataAbertura(b) - dataAbertura(a);
    if (ordenacao === 'antigas') return dataAbertura(a) - dataAbertura(b);
    // atrasadas: OS em aberto primeiro, e dentro delas as mais antigas no topo
    const aAberta = ABERTAS.includes(a.status);
    const bAberta = ABERTAS.includes(b.status);
    if (aAberta !== bAberta) return aAberta ? -1 : 1;
    return dataAbertura(a) - dataAbertura(b);
  });

  const handleSave = async (form) => {
    if (editingItem) {
      await base44.entities.OrdemServico.update(editingItem.id, form);
    } else {
      const numero = `OS-${String(ordens.length + 1).padStart(4, '0')}`;
      await base44.entities.OrdemServico.create({ ...form, numero, data_abertura: new Date().toISOString().split('T')[0] });
    }
    setEditingItem(null);
    await loadData();
  };

  const handleAction = async (action, osId, label) => {
    setActionLoading({ ...actionLoading, [osId + label]: true });
    try {
      await base44.functions.invoke('manageOs', { action, ordem_servico_id: osId });
      await loadData();
    } finally {
      setActionLoading({ ...actionLoading, [osId + label]: false });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ordens de Serviço" description="Gestão completa: orçamento → aprovação → execução → contas a receber">
        <Button onClick={() => { setEditingItem(null); setRetrabalhoOrigem(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4" /> Nova OS
        </Button>
      </PageHeader>

      <Tabs value={visao} onValueChange={setVisao}>
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="fluxo">Fluxo</TabsTrigger>
        </TabsList>
      </Tabs>

      {visao === 'fluxo' && (
        <OsFluxoPanel
          ordens={ordens}
          clienteNome={clienteNome}
          veiculoInfo={veiculoInfo}
          onOpen={(o) => navigate(`/ordens-servico/${o.id}`)}
        />
      )}

      {visao === 'lista' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por cliente, veículo, técnico..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList>
                {STATUS_TABS.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
              </TabsList>
            </Tabs>
            <Select value={ordenacao} onValueChange={setOrdenacao}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORDENACOES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Wrench className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Nenhuma ordem de serviço encontrada</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2 font-semibold">OS</th>
                    <th className="px-2 py-2 font-semibold">Cliente / Veículo</th>
                    <th className="px-2 py-2 font-semibold">Equipe</th>
                    <th className="px-2 py-2 font-semibold">Abertura</th>
                    <th className="px-2 py-2 font-semibold">Finalização</th>
                    <th className="px-2 py-2 font-semibold text-right">Total</th>
                    <th className="px-2 py-2 font-semibold text-right">Rentab.</th>
                    <th className="px-2 py-2 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(os => (
                    <OsTableRow
                      key={os.id}
                      os={os}
                      clienteNome={clienteNome}
                      veiculoInfo={veiculoInfo}
                      actionLoading={actionLoading}
                      onOpen={(o) => navigate(`/ordens-servico/${o.id}`)}
                      onAprovar={(o) => handleAction('aprovar_orcamento', o.id, 'approve')}
                      onFinalizar={(o) => setFinalizarOs(o)}
                      onReprovar={(o) => setReprovarOs(o)}
                      onExcluir={(o) => setExcluirOs(o)}
                      onPedido={(o) => setPedidoDialog({ open: true, osId: o.id, itens: o.itens?.filter(i => i.tipo === 'peca') || [] })}
                      onLaudo={(o) => gerarLaudoTecnico(o, clientes.find(c => c.id === o.cliente_id), veiculos.find(v => v.id === o.veiculo_id))}
                      onEditar={(o) => { setEditingItem(o); setFormOpen(true); }}
                      onRetrabalho={(o) => { setEditingItem(null); setRetrabalhoOrigem(o); setFormOpen(true); }}
                      onGps={(o) => navigate(`/gps-vendas?os=${o.id}`)}
                      onWhatsApp={(o) => {
                        const c = clientes.find(cl => cl.id === o.cliente_id);
                        const v = veiculos.find(ve => ve.id === o.veiculo_id);
                        const msg = `Olá${c?.nome ? ` ${c.nome}` : ''}! 👋 Sobre${o.numero ? ` a OS ${o.numero}` : ' a sua ordem de serviço'}${v ? ` do seu ${v.marca} ${v.modelo}` : ''}${o.valor_total ? ` (${formatCurrency(o.valor_total)})` : ''}:`;
                        abrirWhatsApp(c?.celular || c?.telefone, msg);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <OsForm open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setRetrabalhoOrigem(null); }} onSave={handleSave} editingItem={editingItem} retrabalhoOrigem={retrabalhoOrigem} clientes={clientes} veiculos={veiculos} pecas={pecas} maoObra={maoObra} servicosCompostos={servicosCompostos} colaboradores={colaboradores} cargos={cargos} fornecedores={fornecedores} onVeiculoCreated={(veiculo) => setVeiculos((prev) => [...prev, veiculo])} onClienteCreated={(cliente) => setClientes((prev) => [...prev, cliente])} />
      <PedidoCompraDialog open={pedidoDialog.open} onOpenChange={(v) => setPedidoDialog({ ...pedidoDialog, open: v })} ordemServicoId={pedidoDialog.osId} fornecedores={fornecedores} itensOs={pedidoDialog.itens} onCreated={loadData} />
      <ReprovarOsDialog open={!!reprovarOs} onOpenChange={(v) => { if (!v) setReprovarOs(null); }} os={reprovarOs} onReproved={loadData} />
      <ExcluirOsDialog open={!!excluirOs} onOpenChange={(v) => { if (!v) setExcluirOs(null); }} os={excluirOs} onDeleted={loadData} />
      <FinalizarOsDialog open={!!finalizarOs} onOpenChange={(v) => { if (!v) setFinalizarOs(null); }} os={finalizarOs} onFinalized={loadData} />
    </div>
  );
}