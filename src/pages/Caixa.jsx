import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Wallet, ArrowDown, ArrowUp, Lock, Unlock } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDateTime } from '@/lib/format';

const initialForm = { descricao: '', tipo: 'entrada', valor: '', categoria: '', forma_pagamento: 'dinheiro' };

export default function Caixa() {
  const [caixas, setCaixas] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entryModal, setEntryModal] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [openValue, setOpenValue] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [c, l] = await Promise.all([
        base44.entities.Caixa.list('-data_abertura'),
        base44.entities.LancamentoCaixa.list('-data', 200),
      ]);
      setCaixas(c);
      setLancamentos(l);
    } finally { setLoading(false); }
  };

  const currentCaixa = caixas.find(c => c.status === 'aberto');
  const currentLancamentos = currentCaixa
    ? lancamentos.filter(l => l.caixa_id === currentCaixa.id)
    : [];

  const totalEntradas = currentLancamentos.filter(l => l.tipo === 'entrada').reduce((s, l) => s + (l.valor || 0), 0);
  const totalSaidas = currentLancamentos.filter(l => l.tipo === 'saida').reduce((s, l) => s + (l.valor || 0), 0);
  const saldo = (currentCaixa?.valor_abertura || 0) + totalEntradas - totalSaidas;

  const handleOpenCaixa = async (e) => {
    e.preventDefault();
    await base44.entities.Caixa.create({
      valor_abertura: parseFloat(openValue) || 0,
      data_abertura: new Date().toISOString(),
      status: 'aberto',
    });
    setOpenModal(false);
    setOpenValue('');
    loadData();
  };

  const handleCloseCaixa = async () => {
    if (!currentCaixa) return;
    await base44.entities.Caixa.update(currentCaixa.id, {
      status: 'fechado',
      data_fechamento: new Date().toISOString(),
      valor_fechamento: saldo,
    });
    loadData();
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    await base44.entities.LancamentoCaixa.create({
      ...form,
      valor: parseFloat(form.valor) || 0,
      caixa_id: currentCaixa.id,
      data: new Date().toISOString(),
    });
    setEntryModal(false);
    setForm(initialForm);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Caixa" description="Controle de caixa e movimentações">
        {currentCaixa ? (
          <div className="flex gap-2">
            <Button onClick={() => setEntryModal(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Lançamento
            </Button>
            <Button onClick={handleCloseCaixa} size="sm" variant="outline">
              <Lock className="w-4 h-4 mr-1" /> Fechar
            </Button>
          </div>
        ) : (
          <Button onClick={() => setOpenModal(true)} size="sm">
            <Unlock className="w-4 h-4 mr-1" /> Abrir Caixa
          </Button>
        )}
      </PageHeader>

      {currentCaixa ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground mb-1">Abertura</p>
              <p className="text-lg font-bold font-heading">{formatCurrency(currentCaixa.valor_abertura)}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatDateTime(currentCaixa.data_abertura)}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-xs font-medium text-emerald-700">Entradas</p>
              </div>
              <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalEntradas)}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <ArrowUp className="w-3.5 h-3.5 text-red-600" />
                <p className="text-xs font-medium text-red-700">Saídas</p>
              </div>
              <p className="text-lg font-bold text-red-700">{formatCurrency(totalSaidas)}</p>
            </div>
            <div className="bg-primary text-primary-foreground rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Wallet className="w-3.5 h-3.5" />
                <p className="text-xs font-medium text-white/80">Saldo Atual</p>
              </div>
              <p className="text-lg font-bold">{formatCurrency(saldo)}</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-heading font-semibold text-sm">Movimentações</h3>
              <StatusBadge status={currentCaixa.status} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left font-medium px-4 py-3 text-muted-foreground">Descrição</th>
                    <th className="text-left font-medium px-4 py-3 text-muted-foreground hidden sm:table-cell">Categoria</th>
                    <th className="text-left font-medium px-4 py-3 text-muted-foreground hidden sm:table-cell">Data</th>
                    <th className="text-right font-medium px-4 py-3 text-muted-foreground">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLancamentos.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">Nenhuma movimentação</td></tr>
                  ) : (
                    currentLancamentos.map(l => (
                      <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
                              l.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {l.tipo === 'entrada' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                            </div>
                            <span className="font-medium">{l.descricao}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{l.categoria || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{formatDateTime(l.data)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${l.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {l.tipo === 'entrada' ? '+' : '-'}{formatCurrency(l.valor)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-secondary mx-auto mb-4">
            <Wallet className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-heading font-semibold text-lg mb-1">Caixa Fechado</h3>
          <p className="text-sm text-muted-foreground mb-4">Abra o caixa para registrar movimentações</p>
          <Button onClick={() => setOpenModal(true)}>
            <Unlock className="w-4 h-4 mr-1" /> Abrir Caixa
          </Button>
        </div>
      )}

      {/* Open caixa modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Abrir Caixa</DialogTitle></DialogHeader>
          <form onSubmit={handleOpenCaixa} className="space-y-4">
            <div>
              <Label>Valor de Abertura</Label>
              <Input type="number" step="0.01" value={openValue} onChange={(e) => setOpenValue(e.target.value)} placeholder="0,00" autoFocus />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>Cancelar</Button>
              <Button type="submit">Abrir</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add entry modal */}
      <Dialog open={entryModal} onOpenChange={setEntryModal}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
          <form onSubmit={handleAddEntry} className="space-y-4">
            <div>
              <Label>Descrição *</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor *</Label>
                <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
                <Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ex: Vendas" />
              </div>
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={form.forma_pagamento} onValueChange={(v) => setForm({ ...form, forma_pagamento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEntryModal(false)}>Cancelar</Button>
              <Button type="submit">Adicionar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}