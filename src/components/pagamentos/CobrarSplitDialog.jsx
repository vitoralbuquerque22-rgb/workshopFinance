import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { Loader2, SplitSquareHorizontal, QrCode, Link2, Copy, ExternalLink, AlertCircle, CheckCircle, Building2 } from 'lucide-react';

const MODALIDADE_LABEL = {
  link: { label: 'Link de pagamento', Icon: Link2 },
  qr_checkout: { label: 'QR dinâmico', Icon: QrCode },
  qr_point: { label: 'QR na maquininha (Point)', Icon: QrCode },
};

// Dialog que monta uma cobrança ÚNICA com split automático entre os CNPJs (Fase 5).
export default function CobrarSplitDialog({ open, onOpenChange, os }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [preview, setPreview] = useState(null);
  const [cobranca, setCobranca] = useState(null);
  const [copiado, setCopiado] = useState('');

  useEffect(() => {
    if (!open || !os?.id) return;
    setErro(''); setCobranca(null); setPreview(null); setLoading(true);
    base44.functions.invoke('manageSplitPagamento', { action: 'preview', ordem_servico_id: os.id })
      .then((res) => {
        if (res.data?.error) setErro(res.data.error);
        else setPreview(res.data);
      })
      .catch((e) => setErro(e.response?.data?.error || e.message))
      .finally(() => setLoading(false));
  }, [open, os?.id]);

  const cobrar = async () => {
    setLoading(true); setErro('');
    try {
      const res = await base44.functions.invoke('manageSplitPagamento', { action: 'cobrar', ordem_servico_id: os.id });
      if (res.data?.error) { setErro(res.data.error); return; }
      setCobranca(res.data);
    } catch (e) {
      setErro(e.response?.data?.error || e.message || 'Erro ao gerar cobrança');
    } finally { setLoading(false); }
  };

  const copiar = (texto, tag) => {
    navigator.clipboard.writeText(texto);
    setCopiado(tag);
    setTimeout(() => setCopiado(''), 2000);
  };

  const dados = cobranca || preview;
  const modalidade = dados?.modalidade || 'link';
  const ModInfo = MODALIDADE_LABEL[modalidade] || MODALIDADE_LABEL.link;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SplitSquareHorizontal className="w-5 h-5 text-primary" /> Cobrar com Split
          </DialogTitle>
        </DialogHeader>

        {loading && !dados && (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        )}

        {erro && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{erro}
          </div>
        )}

        {dados && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ModInfo.Icon className="w-4 h-4" /> {ModInfo.label}
              {dados.modo === 'dividido' && <span className="ml-auto rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">Dividido</span>}
            </div>

            {/* Preview do split — quanto vai pra cada CNPJ */}
            <div className="space-y-2">
              {(dados.split || []).map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.cnpj_nome || (s.grupo === 'pecas' ? 'Peças' : 'Serviços')}</p>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">{s.collector_id ? `Recebedor ${s.collector_id}` : 'Sem recebedor cadastrado'}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-primary shrink-0">{formatCurrency(s.amount)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">Cliente paga uma vez</span>
              <strong className="text-primary text-base">{formatCurrency(dados.total)}</strong>
            </div>

            {/* Cobrança gerada */}
            {cobranca ? (
              <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
                  <CheckCircle className="w-4 h-4" /> Cobrança gerada{cobranca.simulado ? ' (simulada)' : ''}
                </div>
                {cobranca.cobranca?.init_point && (
                  <div className="flex items-center gap-2">
                    <a href={cobranca.cobranca.init_point} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full"><ExternalLink className="w-3.5 h-3.5" /> Abrir link de pagamento</Button>
                    </a>
                    <Button variant="outline" size="sm" onClick={() => copiar(cobranca.cobranca.init_point, 'link')}>
                      {copiado === 'link' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                )}
                {cobranca.cobranca?.qr_code && (
                  <div className="space-y-1">
                    <p className="text-[11px] text-muted-foreground">Código QR (copia e cola)</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-[11px] bg-background border rounded px-2 py-1.5 truncate font-mono">{cobranca.cobranca.qr_code}</code>
                      <Button variant="outline" size="sm" onClick={() => copiar(cobranca.cobranca.qr_code, 'qr')}>
                        {copiado === 'qr' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">O Mercado Pago distribui o valor automaticamente entre os CNPJs quando o cliente paga.</p>
              </div>
            ) : (
              <Button onClick={cobrar} disabled={loading} className="w-full">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando cobrança...</> : <><SplitSquareHorizontal className="w-4 h-4" /> Gerar cobrança com split</>}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}