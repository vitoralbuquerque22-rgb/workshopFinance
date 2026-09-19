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
import PecaForm from '@/components/pecas/PecaForm';
import { Plus, Search, Pencil, PackageX, AlertTriangle, Package, Loader2 } from 'lucide-react';

const categoriaLabels = {
  motor: 'Motor', freio: 'Freio', suspensao: 'Suspensão', eletrica: 'Elétrica',
  transmissao: 'Transmissão', carroceria: 'Carroceria', acessorios: 'Acessórios',
  fluidos: 'Fluidos', outros: 'Outros',
};

export default function Pecas() {
  const { toast } = useToast();
  const [pecas, setPecas] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editPeca, setEditPeca] = useState(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const [pecasData, fornData, marcasData] = await Promise.all([
        base44.entities.Peca.list('-created_date', 500),
        base44.entities.Fornecedor.list(),
        base44.entities.Marca.list().catch(() => []),
      ]);
      setPecas(pecasData);
      setFornecedores(fornData);
      setMarcas(marcasData);
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar peças.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const fornNome = (id) => {
    const f = fornecedores.find(f => f.id === id);
    return f ? (f.nome_fantasia || f.razao_social) : '-';
  };

  const filtradas = pecas.filter(p => {
    const matchSearch = !search ||
      p.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      p.marca?.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.categoria === catFilter;
    const matchStock = stockFilter === 'all' ||
      (stockFilter === 'baixo' && (p.estoque_atual || 0) <= (p.estoque_minimo || 0)) ||
      (stockFilter === 'zero' && (p.estoque_atual || 0) === 0);
    return matchSearch && matchCat && matchStock;
  });

  const stats = {
    total: pecas.length,
    baixoEstoque: pecas.filter(p => (p.estoque_atual || 0) <= (p.estoque_minimo || 0) && (p.estoque_atual || 0) > 0).length,
    semEstoque: pecas.filter(p => (p.estoque_atual || 0) === 0).length,
    valorEstoque: pecas.reduce((sum, p) => sum + (p.estoque_atual || 0) * (p.valor_custo_medio || 0), 0),
  };

  const handleSave = async (form) => {
    try {
      if (editPeca) {
        await base44.entities.Peca.update(editPeca.id, form);
        toast({ title: 'Peça atualizada' });
      } else {
        await base44.entities.Peca.create(form);
        toast({ title: 'Peça cadastrada' });
      }
      carregar();
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar peça.', variant: 'destructive' });
    }
  };

  const handleEdit = (peca) => {
    setEditPeca(peca);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditPeca(null);
    setFormOpen(true);
  };

  return (
    <div>
      <PageHeader title="Catálogo de Peças" description="Produtos e insumos — cadastro automático via NF-e de entrada">
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4" />
          Nova Peça
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Package className="h-8 w-8 text-primary" />
          <div><p className="text-xs text-muted-foreground">Total Peças</p><p className="text-xl font-bold">{stats.total}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <div><p className="text-xs text-muted-foreground">Estoque Baixo</p><p className="text-xl font-bold">{stats.baixoEstoque}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <PackageX className="h-8 w-8 text-red-500" />
          <div><p className="text-xs text-muted-foreground">Sem Estoque</p><p className="text-xl font-bold">{stats.semEstoque}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex flex-col">
            <p className="text-xs text-muted-foreground">Valor Estoque</p>
            <p className="text-xl font-bold">{formatCurrency(stats.valorEstoque)}</p>
          </div>
        </CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por código, descrição ou marca..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {Object.entries(categoriaLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Estoque" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo estoque</SelectItem>
            <SelectItem value="baixo">Estoque baixo</SelectItem>
            <SelectItem value="zero">Sem estoque</SelectItem>
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
            <div className="py-12 text-center text-muted-foreground">Nenhuma peça encontrada.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Custo Médio</TableHead>
                  <TableHead className="text-right">Venda</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((p) => {
                  const estoqueBaixo = (p.estoque_atual || 0) <= (p.estoque_minimo || 0);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.codigo}</TableCell>
                      <TableCell>
                        <div className="font-medium">{p.descricao}</div>
                        {p.marca && <div className="text-xs text-muted-foreground">{p.marca}</div>}
                      </TableCell>
                      <TableCell><Badge variant="outline">{categoriaLabels[p.categoria] || p.categoria}</Badge></TableCell>
                      <TableCell className="text-right">
                        <span className={estoqueBaixo ? 'text-red-600 font-semibold' : ''}>{p.estoque_atual || 0}</span>
                        <span className="text-xs text-muted-foreground"> {p.unidade}</span>
                        {estoqueBaixo && <AlertTriangle className="inline h-3 w-3 text-red-500 ml-1" />}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(p.valor_custo_medio)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.valor_venda)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fornNome(p.fornecedor_principal_id)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PecaForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        peca={editPeca}
        fornecedores={fornecedores}
        pecas={pecas}
        marcas={marcas}
        onMarcaCreated={(m) => setMarcas((prev) => [...prev, m])}
        onFornecedorCreated={(f) => setFornecedores((prev) => [...prev, f])}
      />
    </div>
  );
}