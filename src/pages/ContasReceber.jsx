import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Check, Search } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';

const initialForm = {
  descricao: '', cliente: '', categoria: '', valor: '',
  data_vencimento: '', forma_recebimento: 'pix', origem: 'manual', observacoes: '',
};

const filterTabs = [
  { key: 'all', label: 'Todas' },
  { key: 'pendente', label: 'Pendentes' },
  { key: 'recebido', label: 'Recebidas' },
  { key: 'cancelado', label: 'Canceladas' },
];

export default function ContasReceber() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(initialForm);

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      const data = await base44.entities.ContaReceber.list('-data_vencimento');
      setItems(data);
    } finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setForm(initialForm); setModalOpen(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      descricao: item.descricao || '', cliente: item.cliente || '',
      categoria: item.categoria || '', valor: item.valor?.toString() || '',
      data_vencimento: item.data_vencimento || '', forma_recebimento: item.forma_recebimento || 'pix',
      origem: item.origem || 'manual', observacoes: item.observacoes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, valor: parseFloat(form.valor) || 0 };
    if (editing) {
      await base44.entities.ContaReceber.update(editing.id, payload);
    } else {
      await base44.entities.ContaReceber.create(payload);
    }
    setModalOpen(false);
    loadItems();
  };

  const handleDelete = async (id) => {
    await base44.entities.ContaReceber.delete(id);
    loadItems();
  };

  const handleMarkReceived = async (item) => {
    await base44.entities.ContaReceber.update(item.id, {
      status: 'recebido',
      data_recebimento: new Date().toISOString().split('T')[0],
    });
    // Cliente pagou → cancela os disparos de cobrança pendentes desta conta.
    if (item.cobranca_agendada) {
      base44.functions.invoke('cadenciaCobranca', { acao: 'cancelar', conta_receber_id: item.id }).catch(() => {});
    }
    loadItems();
  };

  const filtered = items.filter(item => {
    const matchStatus = filter === 'all' || item.status === filter;
    const matchSearch = !search ||
      item.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      item.cliente?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPendente = items.filter(i => i.status === 'pendente').reduce((s, i) => s + (i.valor || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Contas a Receber" description="Gerencie seus recebimentos">
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Nova Conta
        </Button>
      </PageHeader>

      <div className="bg-card rounded-xl border border-border p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === tab.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 sm:w-64" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Descrição</th>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground hidden sm:table-cell">Cliente</th>
                <th className="text-left font-medium px-4 py-3 text-muted-foreground">Vencimento</th>
                <th className="text-right font-medium px-4 py-3 text-muted-foreground">Valor</th>
                <th className="text-center font-medium px-4 py-3 text-muted-foreground">Status</th>
                <th className="text-right font-medium px-4 py-3 text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Nenhuma conta encontrada</td></tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.descricao}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">{item.cliente}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{item.cliente || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(item.data_vencimento)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatCurrency(item.valor)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {item.status === 'pendente' && (
                          <button onClick={() => handleMarkReceived(item)} title="Marcar como recebido" className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openEdit(item)} title="Editar" className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} title="Excluir" className="p-1.5 rounded-lg hover:bg-red-50 text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filter !== 'cancelado' && (
        <div className="mt-4 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <span className="text-sm font-medium text-emerald-800">Total a Receber</span>
          <span className="text-lg font-bold text-emerald-900">{formatCurrency(totalPendente)}</span>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Conta a Receber' : 'Nova Conta a Receber'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Descrição *</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required />
            </div>
            <div>
              <Label>Cliente</Label>
              <Input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ex: Serviço" />
              </div>
              <div>
                <Label>Valor *</Label>
                <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vencimento *</Label>
                <Input type="date" value={form.data_vencimento} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} required />
              </div>
              <div>
                <Label>Forma de Recebimento</Label>
                <Select value={form.forma_recebimento} onValueChange={(v) => setForm({ ...form, forma_recebimento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="promissoria">Promissória</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Origem</Label>
              <Select value={form.origem} onValueChange={(v) => setForm({ ...form, origem: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="os">Ordem de Serviço</SelectItem>
                  <SelectItem value="venda">Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}