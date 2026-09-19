import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import GpsVoiceInput from './GpsVoiceInput';
import GpsMediaUpload from './GpsMediaUpload';
import { Target } from 'lucide-react';

export default function GpsPerguntaCard({ item, resposta, onChange }) {
  const r = resposta || { resposta: '', anexos: [] };
  const set = (field, val) => onChange({ ...r, [field]: val });

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-medium text-sm">{item.titulo}</p>
            {item.descricao && <p className="text-xs text-muted-foreground mt-0.5">{item.descricao}</p>}
          </div>
          <div className="flex gap-1 shrink-0">
            {item.categoria && <Badge variant="outline" className="text-xs">{item.categoria}</Badge>}
            {item.obrigatorio && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
          </div>
        </div>

        {item.tipo === 'ppv' && item.justificativa && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800 space-y-0.5">
            {item.justificativa && <p className="flex items-start gap-1"><Target className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {item.justificativa}</p>}
            {item.objetivo_comercial && <p className="text-amber-700 pl-5">Objetivo: {item.objetivo_comercial}</p>}
          </div>
        )}

        {item.tipo_resposta === 'texto' && (
          <div className="space-y-1.5">
            <Textarea value={r.resposta || ''} onChange={e => set('resposta', e.target.value)} placeholder="Digite ou fale a resposta..." rows={2} />
            <div className="flex justify-end"><GpsVoiceInput onTranscript={t => set('resposta', ((r.resposta || '') + ' ' + t).trim())} /></div>
          </div>
        )}

        {item.tipo_resposta === 'sim_nao' && (
          <div className="flex gap-2">
            {['Sim', 'Não'].map(opt => (
              <Button key={opt} size="sm" variant={r.resposta === opt ? 'default' : 'outline'} onClick={() => set('resposta', opt)}>{opt}</Button>
            ))}
          </div>
        )}

        {item.tipo_resposta === 'multipla_escolha' && (
          <div className="flex flex-wrap gap-2">
            {(item.opcoes || []).map(opt => (
              <Button key={opt} size="sm" variant={r.resposta === opt ? 'default' : 'outline'} onClick={() => set('resposta', opt)}>{opt}</Button>
            ))}
          </div>
        )}

        {item.tipo_resposta === 'numero' && (
          <Input type="number" value={r.resposta || ''} onChange={e => set('resposta', e.target.value)} />
        )}

        {['foto', 'video', 'audio'].includes(item.tipo_resposta) && (
          <GpsMediaUpload type={item.tipo_resposta} anexos={r.anexos || []} onChange={urls => set('anexos', urls)} />
        )}
      </CardContent>
    </Card>
  );
}