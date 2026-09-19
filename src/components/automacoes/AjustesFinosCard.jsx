import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, SlidersHorizontal } from 'lucide-react';

// Ajustes finos anti-spam / horário comercial / dedup (Fase 8).
export default function AjustesFinosCard({ config, onChange, onSalvar, salvando }) {
  const set = (campo, valor) => onChange({ ...config, [campo]: valor });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="w-4 h-4" /> Ajustes finos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Horário comercial */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Respeitar horário comercial</Label>
            <p className="text-xs text-muted-foreground">Só dispara dentro da janela abaixo; fora dela, espera.</p>
          </div>
          <Switch checked={config.respeitar_horario_comercial} onCheckedChange={(v) => set('respeitar_horario_comercial', v)} />
        </div>

        {config.respeitar_horario_comercial && (
          <div className="grid grid-cols-2 gap-3 pl-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Início</Label>
              <Input type="time" value={config.horario_inicio || '08:00'} onChange={(e) => set('horario_inicio', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fim</Label>
              <Input type="time" value={config.horario_fim || '20:00'} onChange={(e) => set('horario_fim', e.target.value)} />
            </div>
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Disparar em fins de semana</Label>
            <p className="text-xs text-muted-foreground">Se desligado, sábado e domingo ficam para segunda.</p>
          </div>
          <Switch checked={config.disparar_fim_de_semana} onCheckedChange={(v) => set('disparar_fim_de_semana', v)} />
        </div>

        <div className="border-t border-border pt-4 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Limite por contato / 24h</Label>
            <Input type="number" min="0" value={config.limite_por_contato_dia ?? 3} onChange={(e) => set('limite_por_contato_dia', Number(e.target.value))} />
            <p className="text-[11px] text-muted-foreground">Anti-spam. 0 = sem limite.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Deduplicação (horas)</Label>
            <Input type="number" min="0" value={config.dedup_horas ?? 24} onChange={(e) => set('dedup_horas', Number(e.target.value))} />
            <p className="text-[11px] text-muted-foreground">Não reenvia texto igual. 0 = desligado.</p>
          </div>
        </div>

        <Button onClick={onSalvar} disabled={salvando} className="w-full">
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar ajustes'}
        </Button>
      </CardContent>
    </Card>
  );
}