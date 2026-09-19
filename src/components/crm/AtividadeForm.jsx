import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { tiposAtividade } from '@/lib/crmConfig';
import { Plus } from 'lucide-react';

export default function AtividadeForm({ leadId, consultor, onSaved }) {
  const [tipo, setTipo] = useState('nota');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataAgendada, setDataAgendada] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!titulo.trim()) return;
    setSaving(true);
    try {
      const isTarefa = tipo === 'tarefa' || tipo === 'reuniao';
      await base44.entities.Atividade.create({
        lead_id: leadId,
        tipo,
        titulo,
        descricao,
        consultor,
        data_agendada: dataAgendada ? new Date(dataAgendada).toISOString() : undefined,
        concluida: !isTarefa,
        data_conclusao: !isTarefa ? new Date().toISOString() : undefined,
      });
      setTitulo('');
      setDescricao('');
      setDataAgendada('');
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
      <div className="flex gap-2">
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(tiposAtividade).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Resumo da interação..." />
      </div>
      <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} placeholder="Detalhes (opcional)" />
      {(tipo === 'tarefa' || tipo === 'reuniao') && (
        <Input type="datetime-local" value={dataAgendada} onChange={(e) => setDataAgendada(e.target.value)} />
      )}
      <Button size="sm" onClick={handleAdd} disabled={saving || !titulo.trim()} className="w-full">
        <Plus className="h-4 w-4" /> {saving ? 'Registrando...' : 'Registrar'}
      </Button>
    </div>
  );
}