import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/format';
import { Send } from 'lucide-react';

export default function OsComentarios({ comentarios = [], onAdd }) {
  const [texto, setTexto] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!texto.trim()) return;
    setSaving(true);
    try {
      await onAdd(texto.trim());
      setTexto('');
    } finally {
      setSaving(false);
    }
  };

  const ordered = [...comentarios].sort((a, b) => new Date(b.data) - new Date(a.data));

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} placeholder="Escreva um comentário interno..." />
        <Button onClick={handleAdd} disabled={saving || !texto.trim()} className="shrink-0 self-end">
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {ordered.length === 0 && <p className="text-sm text-muted-foreground">Nenhum comentário.</p>}
        {ordered.map((c, i) => (
          <div key={i} className="text-sm bg-muted/40 rounded-lg p-2.5">
            <p>{c.texto}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{formatDateTime(c.data)} {c.usuario ? `• ${c.usuario}` : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
}