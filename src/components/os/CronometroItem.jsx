import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatDateTime } from '@/lib/format';
import { MOTIVOS_PAUSA, ETAPAS_APONTAVEIS, motivoPausaLabel, etapaApontavelLabel, sessaoHorasLiquidas, pausaMs } from '@/lib/apontamentoHoras';
import { Play, Pause, Square, PlayCircle, Timer, Clock } from 'lucide-react';

// Formata ms -> HH:MM:SS
const fmtDur = (msTotal) => {
  const s = Math.max(0, Math.floor(msTotal / 1000));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
};

export default function CronometroItem({ item, itemIndex, colaboradores = [], onChange }) {
  const [, setTick] = useState(0);
  const [tecnico, setTecnico] = useState('');
  const [etapa, setEtapa] = useState('execucao');
  const [pausaDialog, setPausaDialog] = useState({ open: false, sessaoIdx: null });
  const [pausaMotivo, setPausaMotivo] = useState('almoco');
  const [pausaObs, setPausaObs] = useState('');

  const sessoes = item.sessoes || [];
  const temAtiva = sessoes.some((s) => s.status !== 'concluido');

  // Re-render a cada segundo enquanto houver sessão não concluída (cronômetro vivo)
  useEffect(() => {
    if (!temAtiva) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [temAtiva]);

  const commit = (novasSessoes) => onChange(itemIndex, novasSessoes);

  const iniciar = () => {
    if (!tecnico) return;
    const nome = colaboradores.find((c) => c.id === tecnico)?.nome || '';
    commit([
      ...sessoes,
      { colaborador_id: tecnico, colaborador_nome: nome, etapa, inicio: new Date().toISOString(), fim: null, status: 'em_andamento', pausas: [], horas_liquidas: 0 },
    ]);
    setTecnico('');
  };

  const abrirPausa = (idx) => { setPausaMotivo('almoco'); setPausaObs(''); setPausaDialog({ open: true, sessaoIdx: idx }); };

  const confirmarPausa = () => {
    const idx = pausaDialog.sessaoIdx;
    const next = sessoes.map((s, i) => i === idx
      ? { ...s, status: 'pausado', pausas: [...(s.pausas || []), { motivo: pausaMotivo, observacao: pausaObs, inicio: new Date().toISOString(), fim: null }] }
      : s);
    commit(next);
    setPausaDialog({ open: false, sessaoIdx: null });
  };

  const retomar = (idx) => {
    const next = sessoes.map((s, i) => {
      if (i !== idx) return s;
      const pausas = [...(s.pausas || [])];
      const ultima = pausas[pausas.length - 1];
      if (ultima && !ultima.fim) pausas[pausas.length - 1] = { ...ultima, fim: new Date().toISOString() };
      return { ...s, status: 'em_andamento', pausas };
    });
    commit(next);
  };

  const finalizar = (idx) => {
    const next = sessoes.map((s, i) => {
      if (i !== idx) return s;
      const pausas = [...(s.pausas || [])];
      const ultima = pausas[pausas.length - 1];
      if (ultima && !ultima.fim) pausas[pausas.length - 1] = { ...ultima, fim: new Date().toISOString() };
      const encerrada = { ...s, fim: new Date().toISOString(), status: 'concluido', pausas };
      return { ...encerrada, horas_liquidas: sessaoHorasLiquidas(encerrada) };
    });
    commit(next);
  };

  return (
    <div className="mt-2 pl-2 border-l-2 border-emerald-500/30 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" /> Cronômetro por técnico</span>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <Select value={tecnico} onValueChange={setTecnico}>
          <SelectTrigger className="h-7 text-xs flex-1 min-w-[140px]"><SelectValue placeholder="Técnico..." /></SelectTrigger>
          <SelectContent>{colaboradores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={etapa} onValueChange={setEtapa}>
          <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{ETAPAS_APONTAVEIS.map((e) => <SelectItem key={e.key} value={e.key}>{e.label}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" className="h-7 text-[11px] px-2" onClick={iniciar} disabled={!tecnico}><Play className="w-3 h-3" /> Iniciar</Button>
      </div>

      {sessoes.map((s, i) => {
        const bruto = new Date(s.fim || Date.now()).getTime() - new Date(s.inicio).getTime();
        const liquidoMs = Math.max(0, bruto - pausaMs(s.pausas));
        const emPausa = s.status === 'pausado';
        return (
          <div key={i} className="rounded-md border bg-muted/30 px-2.5 py-2 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{s.colaborador_nome || 'Técnico'}</p>
                <p className="text-[10px] text-muted-foreground">{etapaApontavelLabel(s.etapa)} · início {formatDateTime(s.inicio)}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`font-mono font-semibold tabular-nums ${emPausa ? 'text-amber-600' : s.status === 'concluido' ? 'text-muted-foreground' : 'text-emerald-600'}`}>
                  <Clock className="w-3 h-3 inline mr-0.5" />{fmtDur(liquidoMs)}
                </span>
              </div>
            </div>

            {s.status !== 'concluido' && (
              <div className="flex items-center gap-1.5">
                {emPausa ? (
                  <Button size="sm" variant="outline" className="h-6 text-[11px] px-2" onClick={() => retomar(i)}><PlayCircle className="w-3 h-3" /> Retomar</Button>
                ) : (
                  <Button size="sm" variant="outline" className="h-6 text-[11px] px-2" onClick={() => abrirPausa(i)}><Pause className="w-3 h-3" /> Pausar</Button>
                )}
                <Button size="sm" variant="destructive" className="h-6 text-[11px] px-2" onClick={() => finalizar(i)}><Square className="w-3 h-3" /> Encerrar</Button>
                {emPausa && <span className="text-[10px] text-amber-600 font-medium">Em pausa</span>}
              </div>
            )}

            {s.status === 'concluido' && (
              <p className="text-[10px] text-muted-foreground">Concluído · {s.horas_liquidas}h líquidas · fim {formatDateTime(s.fim)}</p>
            )}

            {(s.pausas || []).length > 0 && (
              <div className="pt-1 border-t space-y-0.5">
                {s.pausas.map((p, pi) => (
                  <div key={pi} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Pause className="w-2.5 h-2.5" />
                    <span className="font-medium text-amber-700">{motivoPausaLabel(p.motivo)}</span>
                    {p.observacao && <span>— {p.observacao}</span>}
                    <span className="ml-auto">{formatDateTime(p.inicio)}{p.fim ? ` → ${formatDateTime(p.fim)}` : ' (aberta)'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <Dialog open={pausaDialog.open} onOpenChange={(o) => !o && setPausaDialog({ open: false, sessaoIdx: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Justificar pausa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Motivo</Label>
              <Select value={pausaMotivo} onValueChange={setPausaMotivo}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{MOTIVOS_PAUSA.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Observação (opcional)</Label>
              <Input className="mt-1" value={pausaObs} onChange={(e) => setPausaObs(e.target.value)} placeholder="Ex: peça X no fornecedor" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPausaDialog({ open: false, sessaoIdx: null })}>Cancelar</Button>
            <Button onClick={confirmarPausa}>Pausar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}