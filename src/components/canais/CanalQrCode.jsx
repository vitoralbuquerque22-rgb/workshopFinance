import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { QrCode, AlertTriangle, Loader2 } from 'lucide-react';

// Modo QR Code (não-oficial). A estrutura está pronta, mas a leitura real
// do QR depende de um provedor externo 24h — indisponível neste ambiente.
export default function CanalQrCode({ canal, canalTipo, empresaId, onSaved }) {
  const [gerando, setGerando] = useState(false);
  const [aviso, setAviso] = useState('');

  const gerar = async () => {
    setGerando(true);
    setAviso('');
    try {
      const res = await base44.functions.invoke('manageCanais', {
        action: 'gerar_qr',
        canal_id: canal?.id,
        canal: canalTipo,
        empresa_id: empresaId,
      });
      setAviso(res.data.aviso || '');
      onSaved?.(res.data.canal);
    } finally {
      setGerando(false);
    }
  };

  const temQr = canal?.qrcode?.qr_data_url;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Requer servidor externo 24h</p>
          <p className="text-xs mt-1">
            A conexão por QR Code só mantém a sessão ativa com um provedor externo rodando o tempo todo.
            Neste ambiente, a sessão só atualiza enquanto o sistema está aberto — a estrutura já está pronta
            para quando você conectar um provedor externo.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 py-6 rounded-lg border border-dashed border-border">
        {temQr ? (
          <img src={canal.qrcode.qr_data_url} alt="QR Code de conexão" className="w-48 h-48" />
        ) : (
          <div className="w-48 h-48 rounded-lg bg-muted flex items-center justify-center">
            <QrCode className="w-16 h-16 text-muted-foreground/40" />
          </div>
        )}
        <Button onClick={gerar} disabled={gerando} variant="outline">
          {gerando ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <QrCode className="w-4 h-4 mr-1" />}
          {gerando ? 'Preparando sessão...' : 'Preparar conexão por QR'}
        </Button>
        {aviso && <p className="text-xs text-muted-foreground text-center max-w-sm">{aviso}</p>}
      </div>
    </div>
  );
}