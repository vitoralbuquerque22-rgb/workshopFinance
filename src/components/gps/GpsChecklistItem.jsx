import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GpsMediaUpload from './GpsMediaUpload';
import { ChevronDown, ChevronUp } from 'lucide-react';

const statusConfig = {
  ok: { label: 'OK', activeClass: 'bg-emerald-500 text-white', borderClass: 'border-l-emerald-500' },
  atencao: { label: 'Atenção', activeClass: 'bg-amber-500 text-white', borderClass: 'border-l-amber-500' },
  necessita_reparo: { label: 'Reparo', activeClass: 'bg-red-500 text-white', borderClass: 'border-l-red-500' },
  nao_aplicavel: { label: 'N/A', activeClass: 'bg-gray-400 text-white', borderClass: 'border-l-gray-400' },
};

const prioridades = [
  { key: 'urgente', label: 'Urgente' },
  { key: 'pode_esperar', label: 'Pode esperar' },
  { key: 'preventivo', label: 'Preventivo' },
];

export default function GpsChecklistItem({ item, resposta, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const r = resposta || { status: '', anexos: [], observacao: '', valor_estimado: 0, prioridade: '' };
  const set = (field, val) => onChange({ ...r, [field]: val });
  const needsDetail = r.status === 'necessita_reparo' || r.status === 'atencao';

  useEffect(() => {
    if (r.status === 'necessita_reparo') setExpanded(true);
  }, [r.status]);

  const borderClass = r.status ? statusConfig[r.status]?.borderClass : '';

  return (
    <Card className={borderClass ? `border-l-4 ${borderClass}` : ''}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-sm">{item.titulo}</p>
            {item.descricao && <p className="text-xs text-muted-foreground">{item.descricao}</p>}
          </div>
          {item.obrigatorio && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
        </div>

        <div className="grid grid-cols-4 gap-1">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <Button
              key={key}
              size="sm"
              className={`h-11 text-xs ${r.status === key ? cfg.activeClass : ''}`}
              variant={r.status === key ? 'default' : 'outline'}
              onClick={() => set('status', key)}
            >
              {cfg.label}
            </Button>
          ))}
        </div>

        {needsDetail && (
          <>
            <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)} className="w-full h-8">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {expanded ? 'Recolher detalhes' : 'Detalhar reparo'}
            </Button>
            {expanded && (
              <div className="space-y-2 pt-2 border-t">
                <div>
                  <Label className="text-xs">Observação técnica</Label>
                  <Textarea value={r.observacao || ''} onChange={e => set('observacao', e.target.value)} rows={2} placeholder="Ex: Pastilhas abaixo do limite mínimo..." />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Valor estimado (R$)</Label>
                    <Input type="number" step="0.01" value={r.valor_estimado || 0} onChange={e => set('valor_estimado', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-xs">Prioridade</Label>
                    <div className="flex gap-1">
                      {prioridades.map(p => (
                        <Button key={p.key} size="sm" variant={r.prioridade === p.key ? 'default' : 'outline'} onClick={() => set('prioridade', p.key)} className="text-xs flex-1 h-8">
                          {p.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <GpsMediaUpload type="foto" anexos={r.anexos || []} onChange={urls => set('anexos', urls)} />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}