import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Card de configuração de uma etapa da OS: liga/desliga a notificação
// e permite editar o texto enviado ao cliente naquela etapa.
export default function EtapaNotificacaoCard({ etapa, ativa, mensagem, placeholder, onToggle, onMensagem }) {
  const Icon = etapa.icon;
  return (
    <div className={`rounded-lg border p-4 transition-colors ${ativa ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${ativa ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="text-sm font-medium truncate">{etapa.label}</span>
        </div>
        <Switch checked={ativa} onCheckedChange={onToggle} />
      </div>

      {ativa && (
        <div className="mt-3">
          <Label className="text-xs text-muted-foreground">Mensagem enviada ao cliente</Label>
          <Textarea
            value={mensagem}
            onChange={(e) => onMensagem(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="mt-1 text-sm"
          />
        </div>
      )}
    </div>
  );
}