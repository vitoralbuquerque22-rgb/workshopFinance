import React from 'react';
import GpsPerguntaCard from './GpsPerguntaCard';

export default function GpsStepPerguntas({ items, respostas, onChange }) {
  const sorted = [...items].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nenhuma pergunta configurada para esta etapa.</p>;
  }

  return (
    <div className="space-y-3">
      {sorted.map(item => (
        <GpsPerguntaCard
          key={item.id}
          item={item}
          resposta={respostas[item.id]}
          onChange={r => onChange(item.id, r)}
        />
      ))}
    </div>
  );
}