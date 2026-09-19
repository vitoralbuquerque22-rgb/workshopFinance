import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { TIPO_TAREFA, FREQUENCIAS, DIAS_SEMANA, hojeISO, proximaData } from '@/lib/agenda';

export default function TarefaForm({ tarefa, isRotina, onSaved, onCancel }) {
  const [colaboradores, setColaboradores] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(() => ({
    titulo: tarefa?.titulo || '',
    descricao: tarefa?.descricao || '',
    tipo: tarefa?.tipo || 'tarefa',
    prioridade: tarefa?.prioridade || 'media',
    data_prevista: tarefa?.data_prevista || hojeISO(),
    hora_prevista: tarefa?.hora_prevista || '',
    responsavel_id: tarefa?.responsavel_id || '',
    checklist: tarefa?.checklist || [],
    recorrencia: tarefa?.recorrencia || { ativa: !!isRotina, frequencia: 'semanal', intervalo: 1, dias_semana: [] },
  }));

  useEffect(() => {
    base44.entities.Colaborador.filter({ status: 'ativo' }, 'nome', 500).then(setColaboradores).catch(() => {});
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setRec = (k, v) => setForm((f) => ({ ...f, recorrencia: { ...f.recorrencia, [k]: v } }));

  const addChecklist = () => set('checklist', [...form.checklist, { descricao: '', concluido: false }]);
  const updChecklist = (i, v) => set('checklist', form.checklist.map((c, idx) => (idx === i ? { ...c, descricao: v } : c)));
  const rmChecklist = (i) => set('checklist', form.checklist.filter((_, idx) => idx !== i));

  const toggleDia = (d) => {
    const atuais = form.recorrencia.dias_semana || [];
    setRec('dias_semana', atuais.includes(d) ? atuais.filter((x) => x !== d) : [...atuais, d]);
  };

  const salvar = async () => {
    if (!form.titulo.trim()) return;
    setSalvando(true);
    const colab = colaboradores.find((c) => c.id === form.responsavel_id);
    const rec = { ...form.recorrencia };
    if (rec.ativa && !rec.proxima_geracao) rec.proxima_geracao = form.data_prevista;
    const dados = {
      titulo: form.titulo.trim(),
      descricao: form.descricao,
      tipo: form.tipo,
      prioridade: form.prioridade,
      data_prevista: form.data_prevista,
      hora_prevista: form.hora_prevista,
      responsavel_id: form.responsavel_id || '',
      responsavel_nome: colab?.nome || '',
      checklist: form.checklist.filter((c) => c.descricao.trim()),
      recorrencia: rec,
    };
    if (tarefa?.id) await base44.entities.TarefaOperacional.update(tarefa.id, dados);
    else await base44.entities.TarefaOperacional.create({ ...dados, status: 'pendente' });
    setSalvando(false);
    onSaved?.();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Título *</Label>
        <Input value={form.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Ex: Limpeza da bancada" />
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={form.descricao} onChange={(e) => set('descricao', e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo</Label>
          <Select value={form.tipo} onValueChange={(v) => set('tipo', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPO_TAREFA.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Prioridade</Label>
          <Select value={form.prioridade} onValueChange={(v) => set('prioridade', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{form.recorrencia.ativa ? 'Início da rotina' : 'Data prevista'}</Label>
          <Input type="date" value={form.data_prevista} onChange={(e) => set('data_prevista', e.target.value)} />
        </div>
        <div>
          <Label>Hora (opcional)</Label>
          <Input type="time" value={form.hora_prevista} onChange={(e) => set('hora_prevista', e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Responsável</Label>
        <Select value={form.responsavel_id || 'nenhum'} onValueChange={(v) => set('responsavel_id', v === 'nenhum' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="nenhum">Sem responsável</SelectItem>
            {colaboradores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Checklist */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Checklist</Label>
          <Button type="button" variant="ghost" size="sm" onClick={addChecklist}><Plus className="w-4 h-4 mr-1" />Item</Button>
        </div>
        <div className="space-y-2">
          {form.checklist.map((c, i) => (
            <div key={i} className="flex gap-2">
              <Input value={c.descricao} onChange={(e) => updChecklist(i, e.target.value)} placeholder={`Item ${i + 1}`} />
              <Button type="button" variant="ghost" size="icon" onClick={() => rmChecklist(i)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
            </div>
          ))}
          {form.checklist.length === 0 && <p className="text-xs text-muted-foreground">Nenhum item de verificação.</p>}
        </div>
      </div>

      {/* Recorrência */}
      <div className="rounded-lg border p-3 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="cursor-pointer">Recorrência (rotina)</Label>
          <Switch checked={form.recorrencia.ativa} onCheckedChange={(v) => setRec('ativa', v)} />
        </div>
        {form.recorrencia.ativa && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Frequência</Label>
                <Select value={form.recorrencia.frequencia} onValueChange={(v) => setRec('frequencia', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIAS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>A cada</Label>
                <Input type="number" min={1} value={form.recorrencia.intervalo} onChange={(e) => setRec('intervalo', Number(e.target.value))} />
              </div>
            </div>
            {form.recorrencia.frequencia === 'semanal' && (
              <div>
                <Label className="text-xs">Dias da semana (opcional)</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {DIAS_SEMANA.map((d) => (
                    <button key={d.value} type="button" onClick={() => toggleDia(d.value)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium ${(form.recorrencia.dias_semana || []).includes(d.value) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Ao gerar a agenda, o sistema cria as ocorrências desta rotina automaticamente.</p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={salvar} disabled={salvando || !form.titulo.trim()}>{salvando ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </div>
  );
}