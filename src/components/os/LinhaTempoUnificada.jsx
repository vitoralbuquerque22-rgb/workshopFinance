import React from 'react';
import { formatDateTime } from '@/lib/format';
import { etapasFluxo, etapaFluxoLabel } from '@/lib/osFluxo';
import { linhaTempoUnificada, motivoPausaLabel } from '@/lib/apontamentoHoras';
import { Circle, Clock, Users, Pause } from 'lucide-react';

// Ordem canônica do fluxo para posicionar cada etapa
const ordem = (k) => {
  const i = etapasFluxo.findIndex((e) => e.key === k);
  return i === -1 ? 999 : i;
};

export default function LinhaTempoUnificada({ os }) {
  const linhas = linhaTempoUnificada(os).sort((a, b) => ordem(a.etapa) - ordem(b.etapa));

  if (linhas.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum evento de etapa ou apontamento registrado ainda.</p>;
  }

  return (
    <div className="space-y-0">
      {linhas.map((l, i) => {
        const conf = etapasFluxo.find((e) => e.key === l.etapa);
        const Icon = conf?.icon || Circle;
        return (
          <div key={l.etapa} className="flex gap-3">
            {/* Trilho */}
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${l.temApontamento ? 'bg-emerald-100 text-emerald-700' : 'bg-primary/10 text-primary'}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              {i < linhas.length - 1 && <div className="w-0.5 flex-1 bg-border my-1" />}
            </div>

            {/* Conteúdo da etapa */}
            <div className="pb-5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm font-semibold">{etapaFluxoLabel(l.etapa)}</p>
                {l.temApontamento && (
                  <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{l.horas.toFixed(2)}h apontadas
                  </span>
                )}
              </div>

              {/* Marco da timeline (quando a etapa ocorreu) */}
              {l.marco ? (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatDateTime(l.marco.data)}{l.marco.usuario ? ` • ${l.marco.usuario}` : ''}
                  {l.marco.descricao ? ` — ${l.marco.descricao}` : ''}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-0.5 italic">Sem marco de mudança de etapa registrado</p>
              )}

              {/* Apontamento de tempo por pessoa nesta etapa */}
              {l.temApontamento && (
                <div className="mt-2 space-y-1.5">
                  {l.tecnicos.length > 0 && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />{l.tecnicos.join(', ')}
                    </p>
                  )}
                  {l.sessoes.map((s, si) => (
                    <div key={si} className="rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{s.colaborador_nome || 'Técnico'}</span>
                        <span className="text-muted-foreground shrink-0">{s.item}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDateTime(s.inicio)}{s.fim ? ` → ${formatDateTime(s.fim)}` : ' (em andamento)'}
                        {s.status === 'concluido' ? ` · ${s.horas_liquidas}h líquidas` : ''}
                      </p>
                      {(s.pausas || []).map((p, pi) => (
                        <div key={pi} className="flex items-center gap-1 text-[10px] text-amber-700 mt-0.5">
                          <Pause className="w-2.5 h-2.5" />
                          <span className="font-medium">{motivoPausaLabel(p.motivo)}</span>
                          {p.observacao && <span className="text-muted-foreground">— {p.observacao}</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                  {l.nPausas > 0 && (
                    <p className="text-[10px] text-amber-700">{l.nPausas} pausa(s) · {l.minutosPausa} min nesta etapa</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}