import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Pencil, Trash2, ArrowRight } from 'lucide-react';
import { gatilhoInfo, atrasoLabel } from '@/lib/reguas';
import { etapaFluxoLabel } from '@/lib/osFluxo';

// Cartão-resumo de uma régua: gatilho, passos e ativar/pausar.
export default function ReguaCard({ regua, onEditar, onExcluir, onToggleAtivo }) {
  const info = gatilhoInfo(regua.evento);
  const ativa = regua.passos?.some((p) => p.ativo !== false);

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-semibold text-sm truncate">{regua.nome}</h3>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${info.cor}`}>
              {info.label}
              {regua.evento === 'os_etapa' && regua.etapa_os ? ` · ${etapaFluxoLabel(regua.etapa_os)}` : ''}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{info.descricao}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Switch checked={ativa} onCheckedChange={(v) => onToggleAtivo(regua, v)} />
        </div>
      </div>

      {/* Timeline de passos */}
      <div className="flex items-center gap-1.5 flex-wrap mt-4">
        {(regua.passos || []).map((p, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />}
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-muted text-foreground">
              {atrasoLabel(p.atraso_valor, p.atraso_unidade)}
            </span>
          </div>
        ))}
        {(!regua.passos || regua.passos.length === 0) && (
          <span className="text-xs text-muted-foreground italic">Sem passos configurados</span>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
        <Button variant="ghost" size="sm" onClick={() => onExcluir(regua)} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" /> Excluir
        </Button>
        <Button variant="outline" size="sm" onClick={() => onEditar(regua)}>
          <Pencil className="w-4 h-4" /> Editar
        </Button>
      </div>
    </div>
  );
}