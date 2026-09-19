import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, monthNamesFull } from '@/lib/format';

const now = new Date();
const initialForm = {
  categoria: '', periodo_mes: (now.getMonth() + 1).toString(),
  periodo_ano: now.getFullYear().toString(), valor_orcado: '',
};

export default function Orcamento() {
  const [items, setItems] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [o, m] = await Promise.all([
        base44.entities.Orcamento.list('-periodo_ano'),
        base44.entities.MovimentoFinanceiro.list('-data', 500),
      ]);
      setItems(o);
      setMovimentos(m);
    } finally { setLoading(false); }
  };

  const calculateRealizado = (orc) => {
    return movimentos
      .filter(m => {
        if (m.categoria !== orc.categoria) return false;
        const d = new Date(m.data);
        return (d.getMonth() + 1) === orc.periodo_mes && d.getFullYear() === orc.periodo_ano;
      })
      .reduce((s, m) => s + (m.valor || 0), 0);
  };

  const openCreate = () => { setEditing(null); setForm(initialForm); setModalOpen(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      categoria: item.categoria || '',
      periodo_mes: item.periodo_mes?.toString() || '',
      periodo_ano: item.periodo_ano?.toString() || '',
      valor_orcado: item.valor_orcado?.toString() || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      periodo_mes: parseInt(form.periodo_mes),
      periodo_ano: parseInt(form.periodo_ano),
      valor_orcado: parseFloat(form.valor_orcado) || 0,
    };
    if (editing) {
      await base44.entities.Orcamento.update(editing.id, payload);
    } else {
      await base44.entities.Orcamento.create(payload);
    }
    setModalOpen(false);
    loadData();
  };

  const handleDelete = async (id) => {
    await base44.entities.Orcamento.delete(id);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalOrcado = items.reduce((s, i) => s + (i.valor_orcado || 0), 0);
  const totalRealizado = items.reduce((s, i) => s + calculateRealizado(i), 0);
  const totalPct = totalOrcado > 0 ? (totalRealizado / totalOrcado) * 100 : 0;

  return (
    <div>
      <PageHeader title="Controle Orçamentário" description="Acompanhe orçado vs. realizado">
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Novo Orçamento
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground">Total Orçado</p>
          </div>
          <p className="text-2xl font-bold font-heading">{formatCurrency(totalOrcado)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-medium text-muted-foreground">Total Realizado</p>
          </div>
          <p className="text-2xl font-bold font-heading text-emerald-600">{formatCurrency(totalRealizado)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`w-4 h-4 ${totalPct > 100 ? 'text-red-600' : 'text-amber-600'}`} />
            <p className="text-xs font-medium text-muted-foreground">Execução</p>
          </div>
          <p className={`text-2xl font-bold font-heading ${totalPct > 100 ? 'text-red-600' : 'text-amber-600'}`}>
            {totalPct.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum orçamento cadastrado</p>
          </div>
        ) : (
          items.map(item => {
            const realizado = calculateRealizado(item);
            const pct = item.valor_orcado > 0 ? (realizado / item.valor_orcado) * 100 : 0;
            const overBudget = pct > 100;
            return (
              <div key={item.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-semibold text-sm">{item.categoria}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {monthNamesFull[(item.periodo_mes - 1)] || ''} / {item.periodo_ano}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    Orçado: <span className="font-semibold text-foreground">{formatCurrency(item.valor_orcado)}</span>
                  </span>
                  <span className={overBudget ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                    Realizado: <span className="font-semibold">{formatCurrency(realizado)}</span>
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className={`text-xs mt-1.5 font-medium ${overBudget ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {pct.toFixed(1)}% executado
                </p>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Categoria *</Label>
              <Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ex: Aluguel, Energia..." required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mês *</Label>
                <Select value={form.periodo_mes} onValueChange={(v) => setForm({ ...form, periodo_mes: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {monthNamesFull.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ano *</Label>
                <Input type="number" value={form.periodo_ano} onChange={(e) => setForm({ ...form, periodo_ano: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label>Valor Orçado *</Label>
              <Input type="number" step="0.01" value={form.valor_orcado} onChange={(e) => setForm({ ...form, valor_orcado: e.target.value })} required />
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