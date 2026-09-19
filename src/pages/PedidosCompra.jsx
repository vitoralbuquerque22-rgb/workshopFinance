import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2, ShoppingCart, CheckCircle2, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/format';

const STATUS_TABS = [
  { value: 'all', label: 'Todos' },
  { value: 'aberto', label: 'Abertos' },
  { value: 'enviado', label: 'Enviados' },
  { value: 'recebido', label: 'Recebidos' },
];

export default function PedidosCompra() {
  const [pedidos, setPedidos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});

  const loadData = async () => {
    try {
      const [p, f, o] = await Promise.all([
        base44.entities.PedidoCompra.list('-created_date'),
        base44.entities.Fornecedor.list(),
        base44.entities.OrdemServico.list(),
      ]);
      setPedidos(p);
      setFornecedores(f);
      setOrdens(o);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const fornecedorNome = (id) => fornecedores.find(f => f.id === id)?.nome_fantasia || '—';
  const osNumero = (id) => ordens.find(o => o.id === id)?.numero || '—';

  const filtered = pedidos.filter(p => {
    const statusMatch = statusFilter === 'all' || p.status === statusFilter;
    const q = search.toLowerCase();
    const searchMatch = fornecedorNome(p.fornecedor_id).toLowerCase().includes(q) || (p.numero || '').toLowerCase().includes(q);
    return statusMatch && searchMatch;
  });

  const handleReceive = async (id) => {
    setActionLoading({ ...actionLoading, [id]: true });
    try {
      const pedido = pedidos.find((p) => p.id === id);
      // Recebe todos os itens integralmente pelo módulo de compras (dá entrada no estoque + histórico + conta a pagar)
      const itens_recebidos = (pedido?.itens || []).map((i) => ({
        descricao: i.descricao,
        quantidade: (i.quantidade || 0) - (i.quantidade_recebida || 0),
      })).filter((i) => i.quantidade > 0);
      await base44.functions.invoke('manageCompras', { action: 'receber_pedido', pedido_compra_id: id, itens_recebidos });
      await loadData();
    } finally {
      setActionLoading({ ...actionLoading, [id]: false });
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.PedidoCompra.delete(id);
    await loadData();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pedidos de Compra" description="Pedidos gerados das ordens de serviço — recebimento gera conta a pagar automaticamente" />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por fornecedor, número..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            {STATUS_TABS.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Nenhum pedido de compra encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">Pedidos são criados a partir de Ordens de Serviço</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{p.numero || `PC-${p.id.slice(-6)}`}</p>
                    <StatusBadge status={p.status} />
                    {p.conta_pagar_id && <span className="text-xs text-green-600">Conta a pagar gerada</span>}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-muted-foreground">
                    <div><span className="font-medium text-foreground">Fornecedor:</span> {fornecedorNome(p.fornecedor_id)}</div>
                    <div><span className="font-medium text-foreground">OS:</span> {osNumero(p.ordem_servico_id)}</div>
                    <div><span className="font-medium text-foreground">Emissão:</span> {formatDate(p.data_emissao)}</div>
                    <div><span className="font-medium text-foreground">Entrega:</span> {formatDate(p.data_prevista_entrega) || '—'}</div>
                  </div>
                  {p.itens?.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {p.itens.length} item(ns) · {p.itens.map(i => i.descricao).join(', ').slice(0, 80)}
                    </div>
                  )}
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Total: <strong className="text-primary">{formatCurrency(p.valor_total)}</strong></span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {(p.status === 'aberto' || p.status === 'enviado') && (
                    <Button size="sm" onClick={() => handleReceive(p.id)} disabled={actionLoading[p.id]}>
                      {actionLoading[p.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Receber
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}