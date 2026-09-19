import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Search, History, Pencil, Trash2, Wrench } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PatrimonioForm from './PatrimonioForm';
import HistoricoDialog from './HistoricoDialog';
import { formatCurrency } from '@/lib/format';
import { gerarCodigoPatrimonial, carregarApoio, novoEventoHistorico, statusManutencao, depreciacao, STATUS_PATRIMONIO, TIPOS_PATRIMONIO } from '@/lib/patrimonio';

// Lista genérica de Patrimônio. Se tipoFixo for passado (ferramenta/equipamento),
// filtra e trava o tipo — usado pelas telas Ferramentas e Equipamentos.
export default function PatrimonioLista({ tipoFixo, titulo, descricao }) {
  const [itens, setItens] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [fTipo, setFTipo] = useState('todos');
  const [fStatus, setFStatus] = useState('todos');
  const [fCategoria, setFCategoria] = useState('todas');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [histItem, setHistItem] = useState(null);

  const load = async () => {
    const [lista, apoio] = await Promise.all([
      tipoFixo ? base44.entities.Patrimonio.filter({ tipo: tipoFixo }, '-created_date', 500) : base44.entities.Patrimonio.list('-created_date', 500),
      carregarApoio(),
    ]);
    setItens(lista);
    setColaboradores(apoio.colaboradores);
    setLoading(false);
  };

  useEffect(() => { setLoading(true); load(); /* eslint-disable-next-line */ }, [tipoFixo]);

  const categorias = useMemo(() => [...new Set(itens.map((i) => i.categoria).filter(Boolean))], [itens]);

  const filtrados = useMemo(() => itens.filter((i) => {
    const t = busca.toLowerCase();
    const matchBusca = !t || [i.nome, i.codigo_patrimonial, i.marca, i.modelo, i.numero_serie, i.localizacao].some((c) => String(c || '').toLowerCase().includes(t));
    const matchTipo = fTipo === 'todos' || i.tipo === fTipo;
    const matchStatus = fStatus === 'todos' || i.status === fStatus;
    const matchCat = fCategoria === 'todas' || i.categoria === fCategoria;
    return matchBusca && matchTipo && matchStatus && matchCat;
  }), [itens, busca, fTipo, fStatus, fCategoria]);

  const handleSave = async (data) => {
    if (editing) {
      const historico = [...(editing.historico || [])];
      if (editing.status !== data.status) historico.push(novoEventoHistorico('status', `Status: ${editing.status} → ${data.status}`, '', { de: editing.status, para: data.status }));
      if (editing.localizacao !== data.localizacao) historico.push(novoEventoHistorico('movimentacao', `Local: ${editing.localizacao || '—'} → ${data.localizacao || '—'}`, '', { de: editing.localizacao, para: data.localizacao }));
      if (editing.responsavel_nome !== data.responsavel_nome) historico.push(novoEventoHistorico('responsavel', `Responsável: ${editing.responsavel_nome || '—'} → ${data.responsavel_nome || '—'}`, '', { de: editing.responsavel_nome, para: data.responsavel_nome }));
      await base44.entities.Patrimonio.update(editing.id, { ...data, historico });
    } else {
      const codigo = await gerarCodigoPatrimonial(base44.entities.Patrimonio, 'PAT');
      await base44.entities.Patrimonio.create({ ...data, codigo_patrimonial: codigo, historico: [novoEventoHistorico('cadastro', 'Patrimônio cadastrado')] });
    }
    setFormOpen(false);
    setEditing(null);
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este patrimônio?')) return;
    await base44.entities.Patrimonio.delete(id);
    await load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title={titulo} description={descricao}>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4" /> Novo
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, código, série..." className="pl-9" />
          </div>
          {!tipoFixo && (
            <Select value={fTipo} onValueChange={setFTipo}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {TIPOS_PATRIMONIO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {Object.entries(STATUS_PATRIMONIO).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {categorias.length > 0 && (
            <Select value={fCategoria} onValueChange={setFCategoria}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas categorias</SelectItem>
                {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtrados.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Nenhum item encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  {!tipoFixo && <TableHead>Tipo</TableHead>}
                  <TableHead>Categoria</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Valor atual</TableHead>
                  <TableHead>Preventiva</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((i) => {
                  const mp = statusManutencao(i);
                  const dep = depreciacao(i);
                  const st = STATUS_PATRIMONIO[i.status] || {};
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.codigo_patrimonial}</TableCell>
                      <TableCell className="font-medium">{i.nome}{i.marca ? <span className="block text-xs text-muted-foreground">{i.marca} {i.modelo}</span> : null}</TableCell>
                      {!tipoFixo && <TableCell className="capitalize text-sm">{i.tipo}</TableCell>}
                      <TableCell className="text-sm">{i.categoria || '—'}</TableCell>
                      <TableCell className="text-sm">{i.responsavel_nome || '—'}</TableCell>
                      <TableCell className="text-sm">{i.localizacao || '—'}</TableCell>
                      <TableCell className="text-sm">{i.valor_compra ? formatCurrency(dep.valorAtual) : '—'}</TableCell>
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

      <PatrimonioForm open={formOpen} onOpenChange={setFormOpen} onSave={handleSave} editing={editing} colaboradores={colaboradores} tipoFixo={tipoFixo} />
      <HistoricoDialog open={!!histItem} onOpenChange={(v) => !v && setHistItem(null)} item={histItem} />
    </div>
  );
}