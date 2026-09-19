import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/format';
import ServicoCompostoForm from '@/components/servicos/ServicoCompostoForm';
import { Plus, Search, Pencil, Layers, Wrench, Package, Loader2 } from 'lucide-react';

function calcularValorMaoObra(item) {
  if (!item) return 0;
  if (item.tipo_cobranca === 'hora') {
    return ((Number(item.tempo_estimado_min) || 0) / 60) * (Number(item.valor_hora) || 0);
  }
  return Number(item.valor) || 0;
}

export default function ServicosCompostos() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [maoObraList, setMaoObraList] = useState([]);
  const [pecasList, setPecasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const [sc, mo, pe] = await Promise.all([
        base44.entities.ServicoComposto.list('-created_date', 500),
        base44.entities.MaoObra.list(),
        base44.entities.Peca.list(),
      ]);
      setItems(sc);
      setMaoObraList(mo);
      setPecasList(pe);
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar serviços compostos.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const filtrados = items.filter(s =>
    !search ||
    s.codigo?.toLowerCase().includes(search.toLowerCase()) ||
    s.descricao?.toLowerCase().includes(search.toLowerCase())
  );

  const getMoNome = (id) => {
    const mo = maoObraList.find(m => m.id === id);
    return mo ? `${mo.codigo} - ${mo.descricao}` : '—';
  };

  const getPecaNome = (id) => {
    const p = pecasList.find(p => p.id === id);
    return p ? `${p.codigo} - ${p.descricao}` : '—';
  };

  const calcularTotal = (sc) => {
    if (sc.tipo_valor === 'manual') return Number(sc.valor_total) || 0;
    const moTotal = (sc.itens_mao_obra || []).reduce((sum, i) => {
      const mo = maoObraList.find(m => m.id === i.mao_obra_id);
      return sum + (mo ? calcularValorMaoObra(mo) * (Number(i.quantidade) || 1) : 0);
    }, 0);
    const pecasTotal = (sc.itens_pecas_sugeridas || []).reduce((sum, i) => {
      const p = pecasList.find(p => p.id === i.peca_id);
      return sum + (p ? (Number(p.valor_venda) || 0) * (Number(i.quantidade) || 1) : 0);
    }, 0);
    return moTotal + pecasTotal;
  };

  const handleSave = async (form) => {
    try {
      if (editItem) {
        await base44.entities.ServicoComposto.update(editItem.id, form);
        toast({ title: 'Serviço composto atualizado' });
      } else {
        await base44.entities.ServicoComposto.create(form);
        toast({ title: 'Serviço composto criado' });
      }
      carregar();
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar.', variant: 'destructive' });
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditItem(null);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader title="Serviços Compostos" description="Pacotes de serviços que agrupam mão de obra e peças sugeridas">
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Layers className="h-8 w-8 text-primary" />
          <div><p className="text-xs text-muted-foreground">Total Pacotes</p><p className="text-xl font-bold">{items.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Wrench className="h-8 w-8 text-chart-2" />
          <div><p className="text-xs text-muted-foreground">Total M.O. Vinc.</p><p className="text-xl font-bold">{items.reduce((s, i) => s + (i.itens_mao_obra?.length || 0), 0)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Package className="h-8 w-8 text-chart-4" />
          <div><p className="text-xs text-muted-foreground">Total Peças Vinc.</p><p className="text-xl font-bold">{items.reduce((s, i) => s + (i.itens_pecas_sugeridas?.length || 0), 0)}</p></div>
        </CardContent></Card>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por código ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Layers className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Nenhum serviço composto encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(sc => {
            const total = calcularTotal(sc);
            return (
              <Card key={sc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{sc.codigo}</span>
                        <p className="font-semibold">{sc.descricao}</p>
                        <Badge variant={sc.tipo_valor === 'manual' ? 'default' : 'secondary'}>
                          {sc.tipo_valor === 'manual' ? 'Pacote' : 'Calculado'}
                        </Badge>
                      </div>

                      {(sc.itens_mao_obra?.length > 0 || sc.itens_pecas_sugeridas?.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          {sc.itens_mao_obra?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Wrench className="h-3 w-3" /> Mão de Obra</p>
                              <div className="space-y-0.5">
                                {sc.itens_mao_obra.map((i, idx) => (
                                  <div key={idx} className="text-xs flex justify-between">
                                    <span className="truncate">{getMoNome(i.mao_obra_id)}</span>
                                    <span className="text-muted-foreground ml-2 shrink-0">{i.quantidade}x</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {sc.itens_pecas_sugeridas?.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Package className="h-3 w-3" /> Peças Sugeridas</p>
                              <div className="space-y-0.5">
                                {sc.itens_pecas_sugeridas.map((i, idx) => (
                                  <div key={idx} className="text-xs flex justify-between">
                                    <span className="truncate">{getPecaNome(i.peca_id)}</span>
                                    <span className="text-muted-foreground ml-2 shrink-0">{i.quantidade}x</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(total)}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(sc)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ServicoCompostoForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} item={editItem} maoObraList={maoObraList} pecasList={pecasList} servicos={items} />
    </div>
  );
}