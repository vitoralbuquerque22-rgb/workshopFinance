import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Search, History, Pencil, Trash2, Wrench, Truck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import FrotaForm from '@/components/patrimonio/FrotaForm';
import HistoricoDialog from '@/components/patrimonio/HistoricoDialog';
import { gerarCodigoPatrimonial, carregarApoio, novoEventoHistorico, statusManutencao, STATUS_FROTA, TIPOS_FROTA } from '@/lib/patrimonio';

export default function Frota() {
  const [itens, setItens] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [fTipo, setFTipo] = useState('todos');
  const [fStatus, setFStatus] = useState('todos');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [histItem, setHistItem] = useState(null);

  const load = async () => {
    const [lista, apoio] = await Promise.all([
      base44.entities.AtivoOperacional.list('-created_date', 500),
      carregarApoio(),
    ]);
    setItens(lista);
    setColaboradores(apoio.colaboradores);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtrados = useMemo(() => itens.filter((i) => {
    const t = busca.toLowerCase();
    const matchBusca = !t || [i.nome, i.codigo_patrimonial, i.placa, i.marca, i.modelo].some((c) => String(c || '').toLowerCase().includes(t));
    const matchTipo = fTipo === 'todos' || i.tipo === fTipo;
    const matchStatus = fStatus === 'todos' || i.status === fStatus;
    return matchBusca && matchTipo && matchStatus;
  }), [itens, busca, fTipo, fStatus]);

  const handleSave = async (data) => {
    if (editing) {
      const historico = [...(editing.historico || [])];
      if (editing.status !== data.status) historico.push(novoEventoHistorico('status', `Status: ${editing.status} → ${data.status}`, '', { de: editing.status, para: data.status }));
      if (Number(editing.quilometragem) !== Number(data.quilometragem)) historico.push(novoEventoHistorico('observacao', `Km: ${editing.quilometragem} → ${data.quilometragem}`, '', { de: String(editing.quilometragem), para: String(data.quilometragem) }));
      if (editing.responsavel_nome !== data.responsavel_nome) historico.push(novoEventoHistorico('responsavel', `Responsável: ${editing.responsavel_nome || '—'} → ${data.responsavel_nome || '—'}`, '', { de: editing.responsavel_nome, para: data.responsavel_nome }));
      await base44.entities.AtivoOperacional.update(editing.id, { ...data, historico });
    } else {
      const codigo = await gerarCodigoPatrimonial(base44.entities.AtivoOperacional, 'FRT');
      await base44.entities.AtivoOperacional.create({ ...data, codigo_patrimonial: codigo, historico: [novoEventoHistorico('cadastro', 'Ativo cadastrado')] });
    }
    setFormOpen(false);
    setEditing(null);
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este ativo da frota?')) return;
    await base44.entities.AtivoOperacional.delete(id);
    await load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Frota" description="Ativos operacionais — veículos, guincho, empilhadeira, reboque e apoio">
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4" /> Novo ativo
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, placa, código..." className="pl-9" />
          </div>
          <Select value={fTipo} onValueChange={setFTipo}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {TIPOS_FROTA.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {Object.entries(STATUS_FROTA).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtrados.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum ativo cadastrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Km</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Preventiva</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((i) => {
                  const mp = statusManutencao(i);
                  const st = STATUS_FROTA[i.status] || {};
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.codigo_patrimonial}</TableCell>
                      <TableCell className="font-medium">{i.nome}{i.marca ? <span className="block text-xs text-muted-foreground">{i.marca} {i.modelo} {i.ano}</span> : null}</TableCell>
                      <TableCell className="capitalize text-sm">{i.tipo}</TableCell>
                      <TableCell className="text-sm font-mono">{i.placa || '—'}</TableCell>
                      <TableCell className="text-sm">{i.quilometragem ? i.quilometragem.toLocaleString('pt-BR') : '—'}</TableCell>
                      <TableCell className="text-sm">{i.responsavel_nome || '—'}</TableCell>
                      <TableCell>
                        {mp ? (
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${mp.tone === 'danger' ? 'bg-red-100 text-red-700' : mp.tone === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            <Wrench className="w-3 h-3" />{mp.label}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell><span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setHistItem(i)}><History className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(i); setFormOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(i.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <FrotaForm open={formOpen} onOpenChange={setFormOpen} onSave={handleSave} editing={editing} colaboradores={colaboradores} />
      <HistoricoDialog open={!!histItem} onOpenChange={(v) => !v && setHistItem(null)} item={histItem} />
    </div>
  );
}