import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { STATUS_AUDITORIA, tipoInfo } from '@/lib/auditoria';
import { formatDateTime } from '@/lib/format';
import { AlertTriangle } from 'lucide-react';

export default function AuditoriaCard({ auditoria }) {
  const st = STATUS_AUDITORIA[auditoria.status] || STATUS_AUDITORIA.aberta;
  const info = tipoInfo(auditoria.tipo);
  const Icon = info.icon;
  const pendencias = (auditoria.pendencias || []).filter((p) => !p.resolvida).length;
  const totalItens = (auditoria.itens || []).length;

  return (
    <Link to={`/auditorias/${auditoria.id}`}>
      <Card className="card-hover">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{auditoria.titulo || info.label}</p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {auditoria.numero}
              {auditoria.referencia_numero && ` · ${auditoria.referencia_numero}`}
              {` · ${formatDateTime(auditoria.created_date)}`}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm text-muted-foreground">{totalItens} {totalItens === 1 ? 'item' : 'itens'}</p>
            {pendencias > 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1 justify-end">
                <AlertTriangle className="w-3 h-3" /> {pendencias} pendência{pendencias > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}