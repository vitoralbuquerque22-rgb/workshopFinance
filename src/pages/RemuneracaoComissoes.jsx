import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import RemuneracaoGuard from '@/components/remuneracao/RemuneracaoGuard';
import RegraComissaoForm from '@/components/remuneracao/RegraComissaoForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { Plus, Loader2, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { getConfig } from '@/lib/remuneracao';

const ESCOPO_LABEL = { global: 'Global', colaborador: 'Colaborador', cargo: 'Cargo', categoria: 'Categoria' };

export default function RemuneracaoComissoes() {
  const [regras, setRegras] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [r, c, cg, cfg] = await Promise.all([
      base44.entities.RegraComissao.list('-prioridade', 300),
      base44.entities.Colaborador.list('-created_date', 500),
      base44.entities.Cargo.list('-created_date', 200),
      base44.entities.ConfigRemuneracao.list('-created_date', 1),
    ]);
    setRegras(r); setColaboradores(c); setCargos(cg); setConfig(cfg[0] || null); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const salvarConfig = async (patch) => {
    const atual = getConfig(config);
    const novo = { ...atual, ...patch };
    if (config?.id) await base44.entities.ConfigRemuneracao.update(config.id, novo);
    else { const criado = await base44.entities.ConfigRemuneracao.create(novo); novo.id = criado.id; }
    setConfig(novo);
  };

  const save = async (data) => {
    if (editing) await base44.entities.RegraComissao.update(editing.id, data);
    else await base44.entities.RegraComissao.create(data);
    await load();
  };
  const remove = async (id) => { await base44.entities.RegraComissao.delete(id); await load(); };

  const alvo = (r) => {
    if (r.escopo === 'colaborador') return colaboradores.find((c) => c.id === r.colaborador_id)?.nome || '—';
    if (r.escopo === 'cargo') return cargos.find((c) => c.id === r.cargo_id)?.nome || '—';
    if (r.escopo === 'categoria') return r.categoria || '—';
    return 'Todos';
  };

  return (
    <RemuneracaoGuard>
      <PageHeader title="Regras de Comissão" description="Configure comissões por mão de obra, peças, margem, categoria ou colaborador — sem código">
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="w-4 h-4" /> Nova regra</Button>
      </PageHeader>

      {!loading && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><RotateCcw className="w-4 h-4 text-muted-foreground" /> Comissão em retrabalho</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="text-sm">Descontar em retrabalho interno (falha nossa)</Label>
                <p className="text-xs text-muted-foreground">OS marcada como falha da oficina não gera comissão para o técnico.</p>
              </div>
              <Switch checked={getConfig(config).descontar_retrabalho_interno !== false} onCheckedChange={(v) => salvarConfig({ descontar_retrabalho_interno: v })} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="text-sm">Descontar em retorno do cliente (item recusado)</Label>
                <p className="text-xs text-muted-foreground">Por padrão desligado — item que o cliente recusou não é culpa do técnico.</p>
              </div>
              <Switch checked={getConfig(config).descontar_retorno_cliente === true} onCheckedChange={(v) => salvarConfig({ descontar_retorno_cliente: v })} />
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : regras.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Nenhuma regra cadastrada. Crie ao menos uma regra global.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {regras.map((r) => (
            <Card key={r.id}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {ESCOPO_LABEL[r.escopo]}: {alvo(r)} · Mão de obra {r.comissao_mao_obra_percentual}% · Peças {r.comissao_peca_percentual}%
                    {r.usar_margem ? ` · Margem >${r.margem_minima}% → ${r.comissao_por_margem_percentual}%` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(r); setFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RegraComissaoForm open={formOpen} onOpenChange={setFormOpen} onSave={save} editingItem={editing} colaboradores={colaboradores} cargos={cargos} />
    </RemuneracaoGuard>
  );
}