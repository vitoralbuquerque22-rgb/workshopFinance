import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, Truck, Phone, Mail } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency } from '@/lib/format';

const initialForm = {
  nome_fantasia: '', razao_social: '', cnpj: '', categoria: 'pecas',
  contato_nome: '', telefone: '', email: '', endereco: '',
  condicao_pagamento: '', prazo_medio_dias: '', limite_credito: '',
};

const categoriaLabels = {
  pecas: 'Peças', servicos: 'Serviços', utilidades: 'Utilidades',
  equipamentos: 'Equipamentos', outros: 'Outros',
};

const categoriaCores = {
  pecas: 'bg-blue-50 text-blue-700 border-blue-200',
  servicos: 'bg-purple-50 text-purple-700 border-purple-200',
  utilidades: 'bg-amber-50 text-amber-700 border-amber-200',
  equipamentos: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  outros: 'bg-slate-100 text-slate-600 border-slate-200',
};

const filterTabs = [
  { key: 'all', label: 'Todos' },
  { key: 'pecas', label: 'Peças' },
  { key: 'servicos', label: 'Serviços' },
  { key: 'utilidades', label: 'Utilidades' },
  { key: 'equipamentos', label: 'Equipamentos' },
  { key: 'outros', label: 'Outros' },
];

export default function Fornecedores() {
  const [items, setItems] = useState([]);
  const [contasPagar, setContasPagar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(initialForm);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [f, cp] = await Promise.all([
        base44.entities.Fornecedor.list('-created_date'),
        base44.entities.ContaPagar.list('-data_vencimento', 200),
      ]);
      setItems(f);
      setContasPagar(cp);
    } finally { setLoading(false); }
  };

  const getFornecedorStats = (fornecedorId) => {
    const relContas = contasPagar.filter(c => c.fornecedor_id === fornecedorId);
    const total = relContas.reduce((s, c) => s + (c.valor || 0), 0);
    const pendente = relContas.filter(c => c.status === 'pendente').reduce((s, c) => s + (c.valor || 0), 0);
    return { totalCompras: total, pendente, qtdContas: relContas.length };
  };

  const openCreate = () => { setEditing(null); setForm(initialForm); setModalOpen(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      nome_fantasia: item.nome_fantasia || '',
      razao_social: item.razao_social || '',
      cnpj: item.cnpj || '',
      categoria: item.categoria || 'pecas',
      contato_nome: item.contato_nome || '',
      telefone: item.telefone || '',
      email: item.email || '',
      endereco: item.endereco || '',
      condicao_pagamento: item.condicao_pagamento || '',
      prazo_medio_dias: item.prazo_medio_dias?.toString() || '',
      limite_credito: item.limite_credito?.toString() || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      prazo_medio_dias: form.prazo_medio_dias ? parseInt(form.prazo_medio_dias) : undefined,
      limite_credito: form.limite_credito ? parseFloat(form.limite_credito) : undefined,
    };
    if (editing) {
      await base44.entities.Fornecedor.update(editing.id, payload);
    } else {
      await base44.entities.Fornecedor.create(payload);
    }
    setModalOpen(false);
    loadData();
  };

  const handleDelete = async (id) => {
    await base44.entities.Fornecedor.delete(id);
    loadData();
  };

  const toggleStatus = async (item) => {
    await base44.entities.Fornecedor.update(item.id, { status: item.status === 'ativo' ? 'inativo' : 'ativo' });
    loadData();
  };

  const filtered = items.filter(item => {
    const matchCat = filter === 'all' || item.categoria === filter;
    const matchSearch = !search ||
      item.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) ||
      item.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
      item.cnpj?.includes(search);
    return matchCat && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Fornecedores" description="Cadastro e gestão de fornecedores">
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Novo Fornecedor
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
          <Input placeholder="Buscar por nome, CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 sm:w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-card rounded-xl border border-border p-12 text-center">
            <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum fornecedor cadastrado</p>
          </div>
        ) : (
          filtered.map(item => {
            const stats = getFornecedorStats(item.id);
            return (
              <div key={item.id} className="bg-card rounded-xl border border-border p-5 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-semibold text-sm truncate">{item.nome_fantasia}</h3>
                      {item.cnpj && <p className="text-xs text-muted-foreground">{item.cnpj}</p>}
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="mb-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${categoriaCores[item.categoria] || categoriaCores.outros}`}>
                    {categoriaLabels[item.categoria] || 'Outros'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                  {item.contato_nome && <p className="font-medium text-foreground">{item.contato_nome}</p>}
                  {item.telefone && (
                    <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" />{item.telefone}</p>
                  )}
                  {item.email && (
                    <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 shrink-0" />{item.email}</p>
                  )}
                </div>

                {stats.qtdContas > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3 pt-3 border-t border-border">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Total Compras</p>
                      <p className="text-sm font-semibold">{formatCurrency(stats.totalCompras)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Pendente</p>
                      <p className={`text-sm font-semibold ${stats.pendente > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(stats.pendente)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <Button size="sm" variant="outline" onClick={() => openEdit(item)} className="flex-1">
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toggleStatus(item)}>
                    {item.status === 'ativo' ? 'Desativar' : 'Ativar'}
                  </Button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nome Fantasia *</Label>
              <Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Razão Social</Label>
                <Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoriaLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contato</Label>
                <Input value={form.contato_nome} onChange={(e) => setForm({ ...form, contato_nome: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Cond. Pagamento</Label>
                <Input value={form.condicao_pagamento} onChange={(e) => setForm({ ...form, condicao_pagamento: e.target.value })} placeholder="Ex: 30/60" />
              </div>
              <div>
                <Label>Prazo Médio (dias)</Label>
                <Input type="number" value={form.prazo_medio_dias} onChange={(e) => setForm({ ...form, prazo_medio_dias: e.target.value })} />
              </div>
              <div>
                <Label>Limite Crédito</Label>
                <Input type="number" step="0.01" value={form.limite_credito} onChange={(e) => setForm({ ...form, limite_credito: e.target.value })} />
              </div>
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