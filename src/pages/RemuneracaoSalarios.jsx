import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import RemuneracaoGuard from '@/components/remuneracao/RemuneracaoGuard';
import ColaboradorForm from '@/components/remuneracao/ColaboradorForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { TIPO_CONTRATACAO, MODELO_REMUNERACAO } from '@/lib/remuneracao';
import { formatCurrency } from '@/lib/format';
import { Plus, Loader2, Pencil, Trash2, Search } from 'lucide-react';

export default function RemuneracaoSalarios() {
  const [colaboradores, setColaboradores] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [regras, setRegras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [c, cg, r] = await Promise.all([
      base44.entities.Colaborador.list('-created_date', 500),
      base44.entities.Cargo.list('-created_date', 200),
      base44.entities.RegraComissao.list('-created_date', 200),
    ]);
    setColaboradores(c); setCargos(cg); setRegras(r); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    if (editing) await base44.entities.Colaborador.update(editing.id, data);
    else await base44.entities.Colaborador.create(data);
    await load();
  };
  const remove = async (id) => { await base44.entities.Colaborador.delete(id); await load(); };

  const filtrados = colaboradores.filter((c) => c.nome?.toLowerCase().includes(busca.toLowerCase()));

  return (
    <RemuneracaoGuard>
      <PageHeader title="Salários e Colaboradores" description="Cadastro financeiro, tipo de contratação e modelo de remuneração">
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="w-4 h-4" /> Novo colaborador</Button>
      </PageHeader>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar colaborador..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtrados.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Nenhum colaborador cadastrado.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtrados.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {TIPO_CONTRATACAO[c.tipo_contratacao]} · {MODELO_REMUNERACAO[c.modelo_remuneracao]}
                    {c.cargo_id && cargos.find((x) => x.id === c.cargo_id) ? ` · ${cargos.find((x) => x.id === c.cargo_id).nome}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-[11px] text-muted-foreground">Salário base</p>
                    <p className="text-sm font-semibold">{formatCurrency(c.salario_base)}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(c); setFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ColaboradorForm open={formOpen} onOpenChange={setFormOpen} onSave={save} editingItem={editing} cargos={cargos} regras={regras} />
    </RemuneracaoGuard>
  );
}