import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import RemuneracaoGuard from '@/components/remuneracao/RemuneracaoGuard';
import CargoForm from '@/components/remuneracao/CargoForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { MODELO_REMUNERACAO } from '@/lib/remuneracao';
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react';

const AREA = { tecnica: 'Técnica', comercial: 'Comercial', administrativa: 'Administrativa', gestao: 'Gestão', outros: 'Outros' };

export default function RemuneracaoCargos() {
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const c = await base44.entities.Cargo.list('-created_date', 300);
    setCargos(c); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    if (editing) await base44.entities.Cargo.update(editing.id, data);
    else await base44.entities.Cargo.create(data);
    await load();
  };
  const remove = async (id) => { await base44.entities.Cargo.delete(id); await load(); };

  return (
    <RemuneracaoGuard>
      <PageHeader title="Cargos" description="Estrutura de cargos e modelo de remuneração padrão por função">
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="w-4 h-4" /> Novo cargo</Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : cargos.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">Nenhum cargo cadastrado.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {cargos.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">{AREA[c.area]} · {MODELO_REMUNERACAO[c.modelo_remuneracao_padrao]}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditing(c); setFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CargoForm open={formOpen} onOpenChange={setFormOpen} onSave={save} editingItem={editing} />
    </RemuneracaoGuard>
  );
}