import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/format';
import MaoObraForm from '@/components/maoobra/MaoObraForm';
import { Plus, Search, Pencil, Clock, Wrench, Loader2 } from 'lucide-react';

const categoriaLabels = {
  mecanica: 'Mecânica', eletrica: 'Elétrica', funilaria: 'Funilaria', pintura: 'Pintura',
  alinhamento: 'Alinhamento', diagnostico: 'Diagnóstico', hidraulica: 'Hidráulica', outros: 'Outros',
};

function calcularValor(item) {
  if (!item) return 0;
  if (item.tipo_cobranca === 'hora') {
    const horas = (Number(item.tempo_estimado_min) || 0) / 60;
    return horas * (Number(item.valor_hora) || 0);
  }
  return Number(item.valor) || 0;
}

function formatTempo(min) {
  if (!min) return '-';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

export default function MaoObra() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [centrosCusto, setCentrosCusto] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const [data, cc] = await Promise.all([
        base44.entities.MaoObra.list('-created_date', 500),
        base44.entities.CentroCusto.list(),
      ]);
      setItems(data);
      setCentrosCusto(cc);
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar mão de obra.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const filtradas = items.filter(m => {
    const matchSearch = !search ||
      m.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      m.descricao?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || m.categoria === catFilter;
    return matchSearch && matchCat;
  });

  const handleSave = async (form) => {
    try {
      if (editItem) {
        await base44.entities.MaoObra.update(editItem.id, form);
        toast({ title: 'Mão de obra atualizada' });
      } else {
        await base44.entities.MaoObra.create(form);
        toast({ title: 'Mão de obra cadastrada' });
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
      <PageHeader title="Mão de Obra" description="Cadastro de serviços e tarefas de oficina — preço fixo ou por hora">
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4" />
          Nova Mão de Obra
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Wrench className="h-8 w-8 text-primary" />
          <div><p className="text-xs text-muted-foreground">Total Serviços</p><p className="text-xl font-bold">{items.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Clock className="h-8 w-8 text-chart-2" />
          <div><p className="text-xs text-muted-foreground">Ativos</p><p className="text-xl font-bold">{items.filter(i => i.status === 'ativo').length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex flex-col">
            <p className="text-xs text-muted-foreground">Valor Médio</p>
            <p className="text-xl font-bold">
              {formatCurrency(items.length > 0 ? items.reduce((s, i) => s + calcularValor(i), 0) / items.length : 0)}
            </p>
          </div>
        </CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por código ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {Object.entries(categoriaLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
            </div>
          ) : filtradas.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhum serviço encontrado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Tempo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.codigo}</TableCell>
                    <TableCell className="font-medium">{m.descricao}</TableCell>
                    <TableCell><Badge variant="outline">{categoriaLabels[m.categoria] || m.categoria}</Badge></TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{formatTempo(m.tempo_estimado_min)}</TableCell>
                    <TableCell>
                      <Badge variant={m.tipo_cobranca === 'fixo' ? 'secondary' : 'default'}>
                        {m.tipo_cobranca === 'fixo' ? 'Fixo' : 'Por Hora'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(calcularValor(m))}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <MaoObraForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} item={editItem} centrosCusto={centrosCusto} maoObras={items} />
    </div>
  );
}