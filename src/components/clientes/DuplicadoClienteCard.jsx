import { Button } from '@/components/ui/button';
import { AlertTriangle, User, Loader2, Car, Calendar, FileText } from 'lucide-react';
import { formatDate } from '@/lib/format';

// Card exibido quando já existe um cliente semelhante na base.
export default function DuplicadoClienteCard({ cliente, info, usando, onUsar }) {
  const doc = cliente.cnpj || cliente.cpf || '—';
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-4 space-y-3">
      <div className="flex items-center gap-2 text-amber-800">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <span className="font-semibold">Este cliente já existe no sistema</span>
      </div>

      <div className="bg-background rounded-md border border-border p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0"><User className="w-4 h-4" /></div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{cliente.nome}</p>
            <p className="text-xs text-muted-foreground">{cliente.tipo_pessoa === 'fisica' ? 'CPF' : 'CNPJ'}: {doc}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground pt-1 border-t border-border">
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Última OS: {info.ultimaOs ? (info.ultimaOs.numero || `#${info.ultimaOs.id.slice(-6)}`) : '—'}</span>
          <span className="flex items-center gap-1"><Car className="w-3 h-3" /> Último veículo: {info.ultimoVeiculo?.placa || '—'}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Última visita: {info.ultimaOs ? formatDate(info.ultimaOs.created_date) : '—'}</span>
        </div>
      </div>

      <p className="text-sm text-amber-800">Deseja utilizar este cadastro existente?</p>
      <Button onClick={() => onUsar(cliente)} disabled={usando} className="w-full">
        {usando ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <User className="w-4 h-4 mr-1" />}
        Utilizar este cliente
      </Button>
    </div>
  );
}