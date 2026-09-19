import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import RemuneracaoGuard from '@/components/remuneracao/RemuneracaoGuard';
import BonificacaoForm from '@/components/remuneracao/BonificacaoForm';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { CRITERIO_BONUS } from '@/lib/remuneracao';
import { formatCurrency } from '@/lib/format';
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react';

const ABR = { individual: 'Individual', equipe: 'Equipe', filial: 'Filial', global: 'Global' };

export default function RemuneracaoBonificacoes() {
  const [bonis, setBonis] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [filiais, setFiliais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [b, c, f] = await Promise.all([
      base44.entities.Bonificacao.list('-created_date', 300),
      base44.entities.Colaborador.list('-created_date', 500),
      base44.entities.Filial.list('-created_date', 100).catch(() => []),
    ]);
    setBonis(b); setColaboradores(c); setFiliais(f); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    if (editing) await base44.entities.Bonificacao.update(editing.id, data);
    else await base44.entities.Bonificacao.create(data);
    await load();
  };
  const remove = async (id) => { await base44.entities.Bonificacao.delete(id); await load(); };

  return (
    <RemuneracaoGuard>
      <PageHeader title="Bonificações" description="Campanhas de incentivo por meta de horas, faturamento, eficiência ou sem retrabalho">
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="w-4 h-4" /> Nova bonificação</Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : bonis.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Nenhuma bonificação cadastrada.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {bonis.map((b) => (
            <Card key={b.id}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{b.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {ABR[b.abrangencia]} · {CRITERIO_BONUS[b.criterio]}
                    {b.criterio !== 'sem_retrabalho' ? ` · meta ${b.meta_valor}` : ''} → {formatCurrency(b.valor_bonus)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={b.status} />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(b); setFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(b.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BonificacaoForm open={formOpen} onOpenChange={setFormOpen} onSave={save} editingItem={editing} colaboradores={colaboradores} filiais={filiais} />
    </RemuneracaoGuard>
  );
}