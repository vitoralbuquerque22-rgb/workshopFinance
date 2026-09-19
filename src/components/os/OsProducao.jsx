import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';

export default function OsProducao({ os, onUpdate }) {
  const [novoItem, setNovoItem] = useState('');
  const checklist = os.checklist_producao || [];

  const addItem = () => {
    if (!novoItem.trim()) return;
    onUpdate({ checklist_producao: [...checklist, { descricao: novoItem.trim(), concluido: false }] });
    setNovoItem('');
  };

  const toggle = (idx) => {
    const next = checklist.map((c, i) => (i === idx ? { ...c, concluido: !c.concluido } : c));
    onUpdate({ checklist_producao: next });
  };

  const remove = (idx) => onUpdate({ checklist_producao: checklist.filter((_, i) => i !== idx) });

  const concluidos = checklist.filter((c) => c.concluido).length;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Checklist de produção</p>
          {checklist.length > 0 && <span className="text-xs text-muted-foreground">{concluidos}/{checklist.length}</span>}
        </div>
        <div className="flex gap-2 mb-2">
          <Input value={novoItem} onChange={(e) => setNovoItem(e.target.value)} placeholder="Nova tarefa de produção..." onKeyDown={(e) => e.key === 'Enter' && addItem()} />
          <Button onClick={addItem} size="icon" variant="outline"><Plus className="w-4 h-4" /></Button>
        </div>
        <div className="space-y-1.5">
          {checklist.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-sm group">
              <Checkbox checked={c.concluido} onCheckedChange={() => toggle(i)} />
              <span className={c.concluido ? 'line-through text-muted-foreground flex-1' : 'flex-1'}>{c.descricao}</span>
              <button onClick={() => remove(i)} className="text-muted-foreground opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}