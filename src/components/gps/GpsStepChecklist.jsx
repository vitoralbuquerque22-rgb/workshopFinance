import React, { useState } from 'react';
import GpsChecklistItem from './GpsChecklistItem';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function GpsStepChecklist({ items, respostas, onChange }) {
  const [filtro, setFiltro] = useState('');
  const sorted = [...items].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const categorias = [...new Set(sorted.map(i => i.categoria).filter(Boolean))];

  const filtered = filtro
    ? sorted.filter(i =>
        i.titulo.toLowerCase().includes(filtro.toLowerCase()) ||
        (i.categoria || '').toLowerCase().includes(filtro.toLowerCase())
      )
    : sorted;

  const total = sorted.length;
  const respondidos = sorted.filter(i => respostas[i.id]?.status).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar item..." value={filtro} onChange={e => setFiltro(e.target.value)} />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{respondidos}/{total}</span>
      </div>

      {categorias.map(cat => {
        const catItems = filtered.filter(i => i.categoria === cat);
        if (catItems.length === 0) return null;
        return (
          <div key={cat}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 mt-3">{cat}</p>
            <div className="space-y-2">
              {catItems.map(item => (
                <GpsChecklistItem key={item.id} item={item} resposta={respostas[item.id]} onChange={r => onChange(item.id, r)} />
              ))}
            </div>
          </div>
        );
      })}

      {filtered.filter(i => !i.categoria).map(item => (
        <GpsChecklistItem key={item.id} item={item} resposta={respostas[item.id]} onChange={r => onChange(item.id, r)} />
      ))}

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum item encontrado.</p>
      )}
    </div>
  );
}