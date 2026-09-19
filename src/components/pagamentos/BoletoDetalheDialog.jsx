import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink, QrCode, Barcode } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

function CopyRow({ label, value, icon: Icon }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs break-all font-mono">{value}</code>
        <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
}

export default function BoletoDetalheDialog({ open, onOpenChange, conta }) {
  const boleto = conta?.boleto;
  if (!boleto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Cobrança · {conta.descricao}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Valor</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(conta.valor)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Vencimento</span>
            <span className="font-medium">{formatDate(conta.data_vencimento)}</span>
          </div>

          {boleto.pix_qr_url && (
            <div className="flex justify-center py-2">
              <img src={boleto.pix_qr_url} alt="QR Code PIX" className="w-40 h-40 rounded-lg border border-border" />
            </div>
          )}

          <CopyRow label="PIX Copia e Cola" value={boleto.pix_copia_cola} icon={QrCode} />
          <CopyRow label="Linha Digitável" value={boleto.linha_digitavel} icon={Barcode} />
          <CopyRow label="Código de Barras" value={boleto.codigo_barras} icon={Barcode} />

          {boleto.url_boleto && (
            <Button variant="outline" className="w-full" asChild>
              <a href={boleto.url_boleto} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" /> Abrir boleto completo
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}