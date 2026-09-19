import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/format';
import FluxoCompras from '@/components/compras/FluxoCompras';
import SolicitacoesTab from '@/components/compras/SolicitacoesTab';
import CotacoesTab from '@/components/compras/CotacoesTab';
import PedidosCompraTab from '@/components/compras/PedidosCompraTab';
import HistoricoPrecoTab from '@/components/compras/HistoricoPrecoTab';
import RequisicaoForm from '@/components/compras/RequisicaoForm';
import CotacaoForm from '@/components/compras/CotacaoForm';
import GerarPedidoDialog from '@/components/compras/GerarPedidoDialog';
import RecebimentoDialog from '@/components/compras/RecebimentoDialog';
import { ClipboardList, FileText, ShoppingCart, Package, Loader2 } from 'lucide-react';

export default function Compras() {
  const [loading, setLoading] = useState(true);
  const [requisicoes, setRequisicoes] = useState([]);
  const [cotacoes, setCotacoes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [pecas, setPecas] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [centrosCusto, setCentrosCusto] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);

  const [reqForm, setReqForm] = useState({ open: false, item: null });
  const [cotForm, setCotForm] = useState({ open: false, item: null });
  const [gerarPedido, setGerarPedido] = useState({ open: false, item: null });
  const [receber, setReceber] = useState({ open: false, item: null });

  const carregar = async () => {
    const [rq, ct, pd, hp, pc, fn, dp, cc, us, os, cl] = await Promise.all([
      base44.entities.Requisicao.list('-created_date', 200),
      base44.entities.Cotacao.list('-created_date', 200),
      base44.entities.PedidoCompra.list('-created_date', 200),
      base44.entities.HistoricoPreco.list('-data', 500),
      base44.entities.Peca.filter({ status: 'ativo' }, '-created_date', 500),
      base44.entities.Fornecedor.list(),
      base44.entities.Deposito.list(),
      base44.entities.CentroCusto.list().catch(() => []),
      base44.entities.User.list().catch(() => []),
      base44.entities.OrdemServico.list('-created_date', 200).catch(() => []),
      base44.entities.Cliente.list('-created_date', 500).catch(() => []),
    ]);
    setRequisicoes(rq); setCotacoes(ct); setPedidos(pd); setHistorico(hp);
    setPecas(pc); setFornecedores(fn); setDepositos(dp); setCentrosCusto(cc);
    setUsuarios(us); setOrdens(os); setClientes(cl);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const fornNome = (id) => { const f = fornecedores.find((x) => x.id === id); return f ? (f.nome_fantasia || f.razao_social) : '—'; };
  const depNome = (id) => depositos.find((d) => d.id === id)?.nome || '—';

  const stats = {
    abertas: requisicoes.filter((r) => ['solicitada', 'em_cotacao'].includes(r.status)).length,
    cotacoes: cotacoes.filter((c) => ['aberta', 'respondida'].includes(c.status)).length,
    aReceber: pedidos.filter((p) => ['aberto', 'enviado', 'recebido_parcial', 'backorder'].includes(p.status)).length,
    valorAberto: pedidos.filter((p) => p.status !== 'recebido' && p.status !== 'cancelado').reduce((s, p) => s + (p.valor_total || 0), 0),
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <PageHeader title="Compras" description="Solicitação → Cotação → Aprovação → Pedido → Recebimento → NF → Estoque → Financeiro" />
      <FluxoCompras />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-4 flex items-center gap-3"><ClipboardList className="h-8 w-8 text-primary" /><div><p className="text-xs text-muted-foreground">Solicitações Abertas</p><p className="text-xl font-bold">{stats.abertas}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><FileText className="h-8 w-8 text-violet-500" /><div><p className="text-xs text-muted-foreground">Cotações em Aberto</p><p className="text-xl font-bold">{stats.cotacoes}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><ShoppingCart className="h-8 w-8 text-amber-500" /><div><p className="text-xs text-muted-foreground">Pedidos a Receber</p><p className="text-xl font-bold">{stats.aReceber}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Package className="h-8 w-8 text-emerald-500" /><div><p className="text-xs text-muted-foreground">Valor em Aberto</p><p className="text-lg font-bold">{formatCurrency(stats.valorAberto)}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="solicitacoes">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="solicitacoes">Solicitações</TabsTrigger>
          <TabsTrigger value="cotacoes">Cotações</TabsTrigger>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Preços</TabsTrigger>
        </TabsList>

        <TabsContent value="solicitacoes" className="mt-4">
          <SolicitacoesTab requisicoes={requisicoes} onNew={() => setReqForm({ open: true, item: null })} onEdit={(r) => setReqForm({ open: true, item: r })} />
        </TabsContent>
        <TabsContent value="cotacoes" className="mt-4">
          <CotacoesTab cotacoes={cotacoes} onNew={() => setCotForm({ open: true, item: null })} onEdit={(c) => setCotForm({ open: true, item: c })} onAprovar={(c) => setGerarPedido({ open: true, item: c })} />
        </TabsContent>
        <TabsContent value="pedidos" className="mt-4">
          <PedidosCompraTab pedidos={pedidos} fornNome={fornNome} depNome={depNome} onReceber={(p) => setReceber({ open: true, item: p })} onChange={carregar} />
        </TabsContent>
        <TabsContent value="historico" className="mt-4">
          <HistoricoPrecoTab historico={historico} />
        </TabsContent>
      </Tabs>

      <RequisicaoForm open={reqForm.open} requisicao={reqForm.item} pecas={pecas} usuarios={usuarios} ordens={ordens} clientes={clientes} onClose={() => setReqForm({ open: false, item: null })} onSave={() => { setReqForm({ open: false, item: null }); carregar(); }} />
      <CotacaoForm open={cotForm.open} cotacao={cotForm.item} requisicoes={requisicoes} fornecedores={fornecedores} onClose={() => setCotForm({ open: false, item: null })} onSave={() => { setCotForm({ open: false, item: null }); carregar(); }} />
      <GerarPedidoDialog open={gerarPedido.open} cotacao={gerarPedido.item} depositos={depositos} centrosCusto={centrosCusto} onClose={() => setGerarPedido({ open: false, item: null })} onDone={() => { setGerarPedido({ open: false, item: null }); carregar(); }} />
      <RecebimentoDialog open={receber.open} pedido={receber.item} onClose={() => setReceber({ open: false, item: null })} onDone={() => { setReceber({ open: false, item: null }); carregar(); }} />
    </div>
  );
}