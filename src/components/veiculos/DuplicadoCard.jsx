import { AlertTriangle, User, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DuplicadoCard({ veiculo, clienteNome, ultimaOs, onVincular, onUsar, vinculando, mesmoCliente }) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3">
      <div className="flex items-start gap-2 text-amber-800">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">Este veículo já está cadastrado.</p>
          <p className="text-xs text-amber-700">Evite cadastros duplicados.</p>
        </div>
      </div>

      <div className="rounded-md bg-white border border-amber-200 p-3 space-y-1.5 text-sm">
        <p className="font-semibold text-foreground">
          {veiculo.placa} · {veiculo.marca} {veiculo.modelo} {veiculo.ano ? `(${veiculo.ano})` : ''}
        </p>
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <User className="w-3.5 h-3.5" /> Cliente atual: <span className="text-foreground">{clienteNome || '—'}</span>
        </p>
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <Gauge className="w-3.5 h-3.5" /> Quilometragem: <span className="text-foreground">{(veiculo.quilometragem || 0).toLocaleString('pt-BR')} km</span>
        </p>
        {ultimaOs && (
          <p className="text-xs text-muted-foreground">
            Última OS: {ultimaOs.numero || ultimaOs.id?.slice(0, 6)} — {ultimaOs.status}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {onUsar && (
          <Button variant="outline" className="flex-1" onClick={() => onUsar(veiculo)}>
            Usar este veículo
          </Button>
        )}
        {onVincular && !mesmoCliente && (
          <Button className="flex-1" onClick={() => onVincular(veiculo)} disabled={vinculando}>
            {vinculando ? 'Vinculando...' : 'Vincular ao cliente atual'}
          </Button>
        )}
        {mesmoCliente && (
          <p className="flex-1 text-xs text-amber-700 self-center">Já vinculado a este cliente.</p>
        )}
      </div>
    </div>
  );
}