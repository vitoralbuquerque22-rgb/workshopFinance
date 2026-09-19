import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Check, Loader2, Clock } from 'lucide-react';
import { MARCOS, capturarPosicao, calcularTempos, novoEvento, formatarMinutos } from '@/lib/atendimentoExterno';
import { formatDateTime } from '@/lib/format';
import { base44 } from '@/api/base44Client';

// Painel de presença + geolocalização (Fase 5), integrado ao Atendimento Externo.
export default function PresencaPainel({ missao, onUpdated }) {
  const [carregando, setCarregando] = useState('');

  const registrarMarco = async (marco) => {
    setCarregando(marco.key);
    const pos = await capturarPosicao();
    const agora = new Date().toISOString();
    const geo_marcos = { ...(missao.geo_marcos || {}), [marco.geo]: pos || { registrado_em: agora } };

    const patch = {
      [marco.campo]: agora,
      geo_marcos,
      status: marco.status,
      historico: [...(missao.historico || []), novoEvento('presenca', marco.label)],
    };
    Object.assign(patch, calcularTempos({ ...missao, [marco.campo]: agora }));

    await base44.entities.MissaoOperacional.update(missao.id, patch);

    // Fase 6 — ao concluir o atendimento (retorno à oficina), gera as auditorias
    // de materiais automaticamente. O backend notifica o responsável.
    if (marco.status === 'concluido') {
      if ((missao.ferramentas || []).length > 0) {
        await base44.functions.invoke('manageAuditoria', { action: 'criar', tipo: 'ferramentas', missao_operacional_id: missao.id }).catch(() => {});
      }
      if ((missao.pecas || []).length > 0) {
        await base44.functions.invoke('manageAuditoria', { action: 'criar', tipo: 'pecas', missao_operacional_id: missao.id }).catch(() => {});
      }
    }

    setCarregando('');
    onUpdated?.();
  };

  const finalizado = missao.status === 'concluido' || missao.status === 'cancelado';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <TempoCard label="Deslocamento" min={missao.tempo_deslocamento_min} />
        <TempoCard label="Atendimento" min={missao.tempo_atendimento_min} />
        <TempoCard label="Total" min={missao.tempo_total_min} destaque />
      </div>

      <div className="space-y-2">
        {MARCOS.map((marco) => {
          const feito = !!missao[marco.campo];
          const anteriorOk = !marco.requerAnterior || !!missao[marco.requerAnterior];
          const geo = missao.geo_marcos?.[marco.geo];
          return (
            <div key={marco.key} className={`flex items-center gap-3 p-3 rounded-lg border ${feito ? 'bg-emerald-50 border-emerald-200' : 'bg-background'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${feito ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                {feito ? <Check className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{marco.label}</p>
                {feito && (
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(missao[marco.campo])}
                    {geo?.lat != null && ` · ${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}`}
                  </p>
                )}
              </div>
              {!feito && (
                <Button size="sm" disabled={!anteriorOk || finalizado || carregando === marco.key} onClick={() => registrarMarco(marco)}>
                  {carregando === marco.key ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Registrar'}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TempoCard({ label, min, destaque }) {
  return (
    <div className={`rounded-lg border p-3 ${destaque ? 'bg-primary/5 border-primary/20' : 'bg-background'}`}>
      <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {label}</p>
      <p className="text-lg font-bold font-heading mt-0.5">{formatarMinutos(min)}</p>
    </div>
  );
}