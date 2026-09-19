import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2, User } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import ClienteForm from '@/components/clientes/ClienteForm';
import ClienteInteligenteModal from '@/components/clientes/ClienteInteligenteModal';
import ClienteTableRow from '@/components/clientes/ClienteTableRow';
import VeiculoForm from '@/components/clientes/VeiculoForm';
import VeiculoInteligenteModal from '@/components/veiculos/VeiculoInteligenteModal';
import { abrirWhatsApp } from '@/lib/whatsapp';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [leads, setLeads] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [novoOpen, setNovoOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [veiculoFormOpen, setVeiculoFormOpen] = useState({ open: false, clienteId: null, editingItem: null });
  const [novoVeiculo, setNovoVeiculo] = useState({ open: false, clienteId: null });
  const [expanded, setExpanded] = useState({});

  const loadData = async () => {
    try {
      const [c, v, o, l, a] = await Promise.all([
        base44.entities.Cliente.list('-created_date'),
        base44.entities.Veiculo.list('-created_date'),
        base44.entities.OrdemServico.list('-created_date'),
        base44.entities.Lead.list('-created_date'),
        base44.entities.Atividade.filter({ concluida: false }),
      ]);
      setClientes(c);
      setVeiculos(v);
      setOrdens(o);
      setLeads(l);
      setAtividades(a);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = clientes.filter(c => {
    const q = search.toLowerCase();
    return c.nome?.toLowerCase().includes(q) ||
      c.cpf?.includes(q) || c.cnpj?.includes(q) ||
      c.telefone?.includes(q) || c.celular?.includes(q) || c.email?.toLowerCase().includes(q);
  });

  const handleSave = async (form) => {
    if (editingItem) {
      await base44.entities.Cliente.update(editingItem.id, form);
    } else {
      await base44.entities.Cliente.create(form);
    }
    setEditingItem(null);
    await loadData();
  };

  const handleSaveVeiculo = async (form) => {
    if (veiculoFormOpen.editingItem) {
      await base44.entities.Veiculo.update(veiculoFormOpen.editingItem.id, form);
    } else {
      await base44.entities.Veiculo.create(form);
    }
    await loadData();
  };

  const handleDelete = async (cliente) => {
    if (!window.confirm(`Excluir o cliente "${cliente.nome}"?`)) return;
    await base44.entities.Cliente.delete(cliente.id);
    await loadData();
  };

  const handleDeleteVeiculo = async (id) => {
    await base44.entities.Veiculo.delete(id);
    await loadData();
  };

  const toggleExpand = (id) => setExpanded({ ...expanded, [id]: !expanded[id] });

  const getVeiculos = (clienteId) => veiculos.filter(v => v.cliente_id === clienteId);
  const getOrdensVeiculo = (veiculoId) => ordens.filter(o => o.veiculo_id === veiculoId);

  const getStats = (clienteId) => {
    const ids = veiculos.filter(v => v.cliente_id === clienteId).map(v => v.id);
    const clienteOrdens = ordens.filter(o => ids.includes(o.veiculo_id));
    const total = clienteOrdens.reduce((sum, o) => sum + (o.valor_total || 0), 0);
    return { totalOs: clienteOrdens.length, ticketMedio: clienteOrdens.length ? total / clienteOrdens.length : 0 };
  };

  const getUltimoServico = (clienteId) => {
    const ids = veiculos.filter(v => v.cliente_id === clienteId).map(v => v.id);
    const clienteOrdens = ordens
      .filter(o => ids.includes(o.veiculo_id))
      .map(o => ({ ...o, _d: new Date(o.data_fechamento || o.data_abertura || o.created_date || 0).getTime() }))
      .sort((a, b) => b._d - a._d);
    const os = clienteOrdens[0];
    return os ? { data: os.data_fechamento || os.data_abertura || os.created_date, numero: os.numero } : null;
  };

  const getProximoContato = (clienteId) => {
    const leadIds = leads.filter(l => l.cliente_id === clienteId).map(l => l.id);
    if (leadIds.length === 0) return null;
    const agora = Date.now();
    const futuras = atividades
      .filter(a => leadIds.includes(a.lead_id) && a.data_agendada && new Date(a.data_agendada).getTime() >= agora)
      .sort((a, b) => new Date(a.data_agendada) - new Date(b.data_agendada));
    return futuras[0] || null;
  };

  const handleWhatsApp = (cliente) => {
    const msg = `Olá${cliente.nome ? ` ${cliente.nome}` : ''}! 👋`;
    abrirWhatsApp(cliente.celular || cliente.telefone, msg);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description="Cadastro de clientes, veículos e histórico de relacionamento">
        <Button onClick={() => setNovoOpen(true)}>
          <Plus className="w-4 h-4" /> Novo Cliente
        </Button>
      </PageHeader>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, CPF, CNPJ, telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <User className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Nenhum cliente cadastrado</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2 font-semibold">Cliente</th>
                <th className="px-2 py-2 font-semibold">Veículo</th>
                <th className="px-2 py-2 font-semibold text-right">Ticket médio</th>
                <th className="px-2 py-2 font-semibold">Último serviço</th>
                <th className="px-2 py-2 font-semibold">Próximo contato</th>
                <th className="px-2 py-2 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(cliente => (
                <ClienteTableRow
                  key={cliente.id}
                  cliente={cliente}
                  stats={getStats(cliente.id)}
                  veiculos={getVeiculos(cliente.id)}
                  ordensVeiculo={getOrdensVeiculo}
                  ultimoServico={getUltimoServico(cliente.id)}
                  proximoContato={getProximoContato(cliente.id)}
                  isExpanded={!!expanded[cliente.id]}
                  onToggle={() => toggleExpand(cliente.id)}
                  onEditar={(c) => { setEditingItem(c); setFormOpen(true); }}
                  onExcluir={handleDelete}
                  onNovoVeiculo={(c) => setNovoVeiculo({ open: true, clienteId: c.id })}
                  onEditarVeiculo={(v) => setVeiculoFormOpen({ open: true, clienteId: cliente.id, editingItem: v })}
                  onExcluirVeiculo={handleDeleteVeiculo}
                  onWhatsApp={handleWhatsApp}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ClienteForm open={formOpen} onOpenChange={setFormOpen} onSave={handleSave} editingItem={editingItem} />
      <ClienteInteligenteModal open={novoOpen} onOpenChange={setNovoOpen} onSaved={loadData} />
      <VeiculoForm open={veiculoFormOpen.open} onOpenChange={(v) => setVeiculoFormOpen({ ...veiculoFormOpen, open: v })} onSave={handleSaveVeiculo} editingItem={veiculoFormOpen.editingItem} clienteId={veiculoFormOpen.clienteId} />
      <VeiculoInteligenteModal open={novoVeiculo.open} onOpenChange={(v) => setNovoVeiculo({ ...novoVeiculo, open: v })} clienteId={novoVeiculo.clienteId} onSaved={loadData} />
    </div>
  );
}