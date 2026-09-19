import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/format';
import { calcularCurvaABC, precisaRepor, diasParaVencer } from '@/lib/estoque';
import EstoqueVisaoGeral from '@/components/estoque/EstoqueVisaoGeral';
import SugestaoCompra from '@/components/estoque/SugestaoCompra';
import DepositosTab from '@/components/estoque/DepositosTab';
import LotesTab from '@/components/estoque/LotesTab';
import TransferenciaTab from '@/components/estoque/TransferenciaTab';
import InventarioTab from '@/components/estoque/InventarioTab';
import CodigoScanner from '@/components/estoque/CodigoScanner';
import PecaForm from '@/components/pecas/PecaForm';
import { Boxes, DollarSign, ShoppingCart, CalendarClock, ScanLine, Loader2 } from 'lucide-react';

export default function Estoque() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pecas, setPecas] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [movimentos, setMovimentos] = useState([]);
  const [inventarios, setInventarios] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [scanOpen, setScanOpen] = useState(false);
  const [editPeca, setEditPeca] = useState(null);

  const carregar = async () => {
    const [pc, fn, dp, lt, mv, inv, mc] = await Promise.all([
      base44.entities.Peca.filter({ status: 'ativo' }, '-created_date', 500),
      base44.entities.Fornecedor.list(),
      base44.entities.Deposito.list(),
      base44.entities.Lote.list('-created_date', 500),
      base44.entities.MovimentoEstoque.list('-data', 300),
      base44.entities.Inventario.list('-created_date', 100),
      base44.entities.Marca.list().catch(() => []),
    ]);
    setPecas(pc); setFornecedores(fn); setDepositos(dp);
    setLotes(lt); setMovimentos(mv); setInventarios(inv); setMarcas(mc);
    setLoading(false);
  };

  const handleSavePeca = async (form) => {
    if (editPeca) {
      await base44.entities.Peca.update(editPeca.id, form);
      toast({ title: 'Peça atualizada' });
      carregar();
    }
  };

  useEffect(() => { carregar(); }, []);

  const abcMap = calcularCurvaABC(pecas);
  const fornNome = (id) => { const f = fornecedores.find((x) => x.id === id); return f ? (f.nome_fantasia || f.razao_social) : '—'; };

  const stats = {
    valor: pecas.reduce((s, p) => s + (p.estoque_atual || 0) * (p.valor_custo_medio || 0), 0),
    repor: pecas.filter(precisaRepor).length,
    vencendo: lotes.filter((l) => { const d = diasParaVencer(l.data_validade); return d !== null && d >= 0 && d <= 30; }).length,
    itensA: Object.values(abcMap).filter((c) => c === 'A').length,
  };

  const handleScan = async (codigo) => {
    const peca = pecas.find((p) => p.codigo_barras === codigo || p.qr_code === codigo || p.codigo === codigo);
    if (peca) {
      toast({ title: `Peça: ${peca.descricao}`, description: `Disponível: ${(peca.estoque_atual || 0) - (peca.estoque_reservado || 0)} ${peca.unidade}` });
    } else {
      toast({ title: 'Não encontrada', description: `Nenhuma peça com o código "${codigo}".`, variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader title="Estoque Profissional" description="Curva ABC, lotes, validade, depósitos, transferências e inventário">
        <Button variant="outline" onClick={() => setScanOpen(true)}><ScanLine className="h-4 w-4" /> Ler Código</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3"><DollarSign className="h-8 w-8 text-primary" /><div><p className="text-xs text-muted-foreground">Valor em Estoque</p><p className="text-lg font-bold">{formatCurrency(stats.valor)}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><ShoppingCart className="h-8 w-8 text-red-500" /><div><p className="text-xs text-muted-foreground">Para Repor</p><p className="text-xl font-bold">{stats.repor}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><CalendarClock className="h-8 w-8 text-amber-500" /><div><p className="text-xs text-muted-foreground">Vencendo (30d)</p><p className="text-xl font-bold">{stats.vencendo}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Boxes className="h-8 w-8 text-emerald-500" /><div><p className="text-xs text-muted-foreground">Itens Curva A</p><p className="text-xl font-bold">{stats.itensA}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="visao">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="visao">Visão Geral</TabsTrigger>
          <TabsTrigger value="sugestao">Sugestão de Compra</TabsTrigger>
          <TabsTrigger value="depositos">Depósitos</TabsTrigger>
          <TabsTrigger value="lotes">Lotes & Validade</TabsTrigger>
          <TabsTrigger value="transferencia">Transferências</TabsTrigger>
          <TabsTrigger value="inventario">Inventário</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="mt-4"><EstoqueVisaoGeral pecas={pecas} abcMap={abcMap} onRowClick={setEditPeca} /></TabsContent>
        <TabsContent value="sugestao" className="mt-4"><SugestaoCompra pecas={pecas} abcMap={abcMap} fornNome={fornNome} /></TabsContent>
        <TabsContent value="depositos" className="mt-4"><DepositosTab depositos={depositos} onChange={carregar} /></TabsContent>
        <TabsContent value="lotes" className="mt-4"><LotesTab lotes={lotes} pecas={pecas} onChange={carregar} /></TabsContent>
        <TabsContent value="transferencia" className="mt-4"><TransferenciaTab pecas={pecas} depositos={depositos} movimentos={movimentos} onChange={carregar} /></TabsContent>
        <TabsContent value="inventario" className="mt-4"><InventarioTab inventarios={inventarios} pecas={pecas} onChange={carregar} /></TabsContent>
      </Tabs>

      <CodigoScanner open={scanOpen} onClose={() => setScanOpen(false)} onDetect={handleScan} />

      <PecaForm
        open={!!editPeca}
        onClose={() => setEditPeca(null)}
        onSave={handleSavePeca}
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