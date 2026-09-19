import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import GpsVoiceInput from './GpsVoiceInput';
import { Fuel, Gauge, AlertTriangle, Plus, X, Mic } from 'lucide-react';

const combustiveis = [
  { value: 'reserva', label: 'Reserva', icon: '⛽' },
  { value: 'um_quarto', label: '1/4', icon: '⛽' },
  { value: 'meio', label: '1/2', icon: '⛽' },
  { value: 'tres_quartos', label: '3/4', icon: '⛽' },
  { value: 'cheio', label: 'Cheio', icon: '⛽' },
];

export default function GpsStepDados({ dados, onChange }) {
  const [novoCodigo, setNovoCodigo] = useState('');
  const d = dados || {};

  const set = (field, val) => onChange({ ...d, [field]: val });

  const addCodigo = () => {
    if (!novoCodigo) return;
    set('codigos_falha', [...(d.codigos_falha || []), novoCodigo.toUpperCase()]);
    setNovoCodigo('');
  };

  const removeCodigo = (idx) => set('codigos_falha', (d.codigos_falha || []).filter((_, j) => j !== idx));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-primary" />
            <p className="font-medium text-sm">Nível de Combustível</p>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {combustiveis.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => set('combustivel_nivel', c.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                  d.combustivel_nivel === c.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                }`}
              >
                <span className="text-xl">{c.icon}</span>
                <span className="text-xs font-medium">{c.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <Label className="text-sm font-medium">Quilometragem</Label>
          </div>
          <Input type="number" min="0" value={d.quilometragem || ''} onChange={e => set('quilometragem', Number(e.target.value))} placeholder="0" className="text-lg" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <Label className="text-sm font-medium">Códigos de Falha (DTC)</Label>
          </div>
          <div className="flex gap-2">
            <Input value={novoCodigo} onChange={e => setNovoCodigo(e.target.value.toUpperCase())} placeholder="P0300" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCodigo())} />
            <Button type="button" size="icon" onClick={addCodigo}><Plus className="h-4 w-4" /></Button>
          </div>
          {d.codigos_falha?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {d.codigos_falha.map((cod, i) => (
                <Badge key={i} variant="secondary" className="font-mono gap-1">
                  {cod}
                  <button onClick={() => removeCodigo(i)}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Observações Gerais</Label>
            <GpsVoiceInput onTranscript={t => set('observacoes_gerais', ((d.observacoes_gerais || '') + ' ' + t).trim())} />
          </div>
          <Textarea value={d.observacoes_gerais || ''} onChange={e => set('observacoes_gerais', e.target.value)} rows={3} placeholder="Fale ou digite observações do atendimento..." />
        </CardContent>
      </Card>
    </div>
  );
}