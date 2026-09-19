import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TIPO_OCORRENCIA, gerarNumeroOcorrencia } from '@/lib/agenda';

export default function OcorrenciaForm({ ocorrencia, onSaved, onCancel }) {
  const [colaboradores, setColaboradores] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(() => ({
    titulo: ocorrencia?.titulo || '',
    descricao: ocorrencia?.descricao || '',
    tipo: ocorrencia?.tipo || 'incidente',
    gravidade: ocorrencia?.gravidade || 'media',
    responsavel_id: ocorrencia?.responsavel_id || '',
  }));

  useEffect(() => {
    base44.entities.Colaborador.filter({ status: 'ativo' }, 'nome', 500).then(setColaboradores).catch(() => {});
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const salvar = async () => {
    if (!form.titulo.trim()) return;
    setSalvando(true);
    const colab = colaboradores.find((c) => c.id === form.responsavel_id);
    const dados = {
      titulo: form.titulo.trim(),
      descricao: form.descricao,
      tipo: form.tipo,
      gravidade: form.gravidade,
      responsavel_id: form.responsavel_id || '',
      responsavel_nome: colab?.nome || '',
    };
    if (ocorrencia?.id) {
      await base44.entities.Ocorrencia.update(ocorrencia.id, dados);
    } else {
      const numero = await gerarNumeroOcorrencia();
      const me = await base44.auth.me().catch(() => null);
      await base44.entities.Ocorrencia.create({
        ...dados,
        numero,
        data_ocorrencia: new Date().toISOString(),
        registrada_por_nome: me?.full_name || me?.email || 'Sistema',
        status: 'aberta',
      });
    }
    setSalvando(false);
    onSaved?.();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Título *</Label>
        <Input value={form.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Ex: Compressor com vazamento" />
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={form.descricao} onChange={(e) => set('descricao', e.target.value)} rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo</Label>
          <Select value={form.tipo} onValueChange={(v) => set('tipo', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIPO_OCORRENCIA.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Gravidade</Label>
          <Select value={form.gravidade} onValueChange={(v) => set('gravidade', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
            </SelectContent>
          </Select>
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
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={salvar} disabled={salvando || !form.titulo.trim()}>{salvando ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </div>
  );
}