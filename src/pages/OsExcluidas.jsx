import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/format';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Trash2, ShieldAlert, User } from 'lucide-react';

export default function OsExcluidas() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        const admin = me?.role === 'admin';
        setIsAdmin(admin);
        if (admin) {
          const data = await base44.entities.OsExcluida.list('-data_exclusao', 200);
          setRegistros(data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p className="font-medium">Acesso restrito</p>
        <p className="text-sm text-muted-foreground">Apenas administradores podem ver as OS excluídas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="OS Excluídas" description="Registro de auditoria de ordens de serviço excluídas" />

      {registros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Trash2 className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Nenhuma OS foi excluída até o momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {registros.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10 text-destructive shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{r.os_numero || '—'}</p>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{r.status_anterior}</span>
                    <span className="text-sm text-primary font-medium">{formatCurrency(r.valor_total)}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
                    <div><span className="font-medium text-foreground">Cliente:</span> {r.cliente_nome || '—'}</div>
                    <div><span className="font-medium text-foreground">Veículo:</span> {r.veiculo_placa || '—'}</div>
                    <div className="flex items-center gap-1"><User className="w-3 h-3" /> {r.excluido_por_nome || '—'}</div>
                  </div>
                  <div className="mt-2 rounded-md bg-muted/50 p-2 text-sm">
                    <span className="font-medium">Justificativa:</span> {r.motivo}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {r.data_exclusao ? format(parseISO(r.data_exclusao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : formatDate(r.created_date)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}