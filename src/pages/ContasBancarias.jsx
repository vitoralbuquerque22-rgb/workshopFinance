import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Landmark, Plus, RefreshCw, Loader2, Upload, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import ContaBancariaForm from '@/components/contas/ContaBancariaForm';
import DdaSyncDialog from '@/components/contas/DdaSyncDialog';
import { formatDateTime } from '@/lib/format';

export default function ContasBancarias() {
  const [contas, setContas] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [syncDialog, setSyncDialog] = useState({ open: false, contaId: null });

  const loadData = async () => {
    try {
      const [c, l] = await Promise.all([
        base44.entities.ContaBancaria.list('-created_date'),
        base44.entities.IntegracaoLog.list('-data_sync', 20),
      ]);
      setContas(c);
      setLogs(l);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (form) => {
    if (editingItem) {
      await base44.entities.ContaBancaria.update(editingItem.id, form);
    } else {
      await base44.entities.ContaBancaria.create(form);
    }
    setEditingItem(null);
    await loadData();
  };

  const handleDelete = async (id) => {
    await base44.entities.ContaBancaria.delete(id);
    await loadData();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Contas Bancárias & DDA" description="Gestão de contas bancárias e sincronização automática de boletos (Débito Direto Autorizado)">
        <Button onClick={() => { setEditingItem(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4" /> Nova Conta
        </Button>
      </PageHeader>

      <Tabs defaultValue="contas">
        <TabsList>
          <TabsTrigger value="contas">Contas Bancárias</TabsTrigger>
          <TabsTrigger value="logs">Logs de Sincronização</TabsTrigger>
        </TabsList>

        <TabsContent value="contas" className="mt-4">
          {contas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Landmark className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Nenhuma conta bancária cadastrada</p>
              <p className="text-xs text-muted-foreground mt-1">Cadastre uma conta para sincronizar boletos via DDA</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contas.map(conta => (
                <div key={conta.id} className="bg-card border border-border rounded-lg p-5 space-y-3 card-hover">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{conta.banco_nome || `Banco ${conta.banco_codigo}`}</p>
                        <p className="text-xs text-muted-foreground">Ag: {conta.agencia} · CC: {conta.conta}</p>
                      </div>
                    </div>
                    <StatusBadge status={conta.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-muted">{conta.tipo_integracao}</span>
                    {conta.ultimo_sync && <span>Último sync: {formatDateTime(conta.ultimo_sync)}</span>}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="flex-1" onClick={() => setSyncDialog({ open: true, contaId: conta.id })}>
                      <RefreshCw className="w-3.5 h-3.5" /> Sincronizar DDA
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingItem(conta); setFormOpen(true); }}>Editar</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(conta.id)}>Excluir</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Nenhuma sincronização registrada</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Data</th>
                      <th className="text-left px-4 py-3 font-medium">Tipo</th>
                      <th className="text-center px-4 py-3 font-medium">Boletos</th>
                      <th className="text-center px-4 py-3 font-medium">Criados</th>
                      <th className="text-center px-4 py-3 font-medium">Match</th>
                      <th className="text-center px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">{formatDateTime(log.data_sync)}</td>
                        <td className="px-4 py-3 uppercase text-xs">{log.tipo_integracao}</td>
                        <td className="px-4 py-3 text-center">{log.boletos_encontrados || 0}</td>
                        <td className="px-4 py-3 text-center">{log.boletos_criados || 0}</td>
                        <td className="px-4 py-3 text-center">{log.boletos_match || 0}</td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={log.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ContaBancariaForm open={formOpen} onOpenChange={setFormOpen} onSave={handleSave} editingItem={editingItem} />
      <DdaSyncDialog open={syncDialog.open} onOpenChange={(v) => setSyncDialog({ ...syncDialog, open: v })} contaBancariaId={syncDialog.contaId} onSynced={loadData} />
    </div>
  );
}