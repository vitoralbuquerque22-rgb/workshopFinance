import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, CheckCircle, AlertCircle, AlertTriangle, FileWarning, Package, Link2, UserPlus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';

// step: 'upload' | 'conferencia' | 'sucesso'
export default function NfeConferenciaDialog({ open, onOpenChange, onImported }) {
  const [step, setStep] = useState('upload');
  const [xml, setXml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analise, setAnalise] = useState(null);
  const [qtds, setQtds] = useState({});
  const [resultado, setResultado] = useState(null);

  const reset = () => {
    setStep('upload'); setXml(''); setError(''); setAnalise(null); setQtds({}); setResultado(null);
  };
  const handleClose = () => { reset(); onOpenChange(false); };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setXml(await file.text());
  };

  const analisar = async () => {
    if (!xml.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await base44.functions.invoke('processNfe', { action: 'analisar', xml });
      if (res.data?.error) { setError(res.data.error); return; }
      if (res.data?.status === 'duplicada') { setError('Esta NF-e já foi processada anteriormente.'); return; }
      setAnalise(res.data);
      const init = {};
      (res.data.itens || []).forEach((i) => { init[i.codigo] = i.quantidade; });
      setQtds(init);
      setStep('conferencia');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erro ao analisar XML');
    } finally { setLoading(false); }
  };

  const confirmar = async () => {
    setLoading(true); setError('');
    try {
      const res = await base44.functions.invoke('processNfe', {
        action: 'confirmar', xml,
        quantidades_conferidas: qtds,
        pedido_compra_id: analise.pedido?.id,
        criar_fornecedor: true,
      });
      if (res.data?.error) { setError(res.data.error); return; }
      setResultado(res.data);
      setStep('sucesso');
      onImported?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erro ao confirmar recebimento');
    } finally { setLoading(false); }
  };

  const totalAlertas = (analise?.itens || []).reduce((s, i) => s + (i.alertas?.length || 0), 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && 'Importar NF-e de Entrada'}
            {step === 'conferencia' && 'Conferência da NF-e'}
            {step === 'sucesso' && 'Recebimento Finalizado'}
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <>
            <div className="space-y-3">
              <div>
                <Label>Arquivo XML</Label>
                <Input type="file" accept=".xml" onChange={handleFile} disabled={loading} />
              </div>
              <div>
                <Label>Ou cole o XML abaixo</Label>
                <Textarea rows={7} value={xml} onChange={(e) => setXml(e.target.value)} placeholder="<nfeProc versao='4.00'>..." disabled={loading} className="font-mono text-xs" />
              </div>
              {error && <div className="flex items-center gap-2 text-destructive text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading}>Cancelar</Button>
              <Button onClick={analisar} disabled={loading || !xml.trim()}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</> : <><Upload className="w-4 h-4" /> Analisar XML</>}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'conferencia' && analise && (
          <>
            <div className="space-y-4">
              {/* Cabeçalho da nota */}
              <div className="bg-muted/50 rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Nota</p><p className="font-medium">{analise.nota.numero}/{analise.nota.serie}</p></div>
                <div><p className="text-xs text-muted-foreground">Emissão</p><p className="font-medium">{formatDate(analise.nota.data_emissao)}</p></div>
                <div><p className="text-xs text-muted-foreground">Emitente</p><p className="font-medium truncate">{analise.nota.emitente_nome}</p></div>
                <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-medium">{formatCurrency(analise.nota.valor_total)}</p></div>
              </div>

              {/* Fornecedor / Pedido */}
              <div className="flex flex-wrap gap-2 text-xs">
                {analise.fornecedor_existe ? (
                  <span className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle className="w-3.5 h-3.5" /> Fornecedor: {analise.fornecedor.nome}</span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200"><UserPlus className="w-3.5 h-3.5" /> Fornecedor será cadastrado automaticamente</span>
                )}
                {analise.pedido ? (
                  <span className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"><Link2 className="w-3.5 h-3.5" /> Pedido {analise.pedido.numero} vinculado</span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200"><FileWarning className="w-3.5 h-3.5" /> Sem pedido de compra correspondente</span>
                )}
              </div>

              {totalAlertas > 0 && (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {totalAlertas} divergência(s) encontrada(s). Revise antes de confirmar.
                </div>
              )}

              {/* Itens */}
              <div className="space-y-2">
                {analise.itens.map((item, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                          {item.descricao}
                          {!item.peca_existe && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">nova peça</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.codigo || '—'} · {formatCurrency(item.valor_unitario)}/un
                          {item.custo_medio_atual > 0 && <> · custo médio atual {formatCurrency(item.custo_medio_atual)}</>}
                          {item.pedido_pendente != null && <> · pendente no pedido: {item.pedido_pendente}</>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <Label className="text-[10px] text-muted-foreground">Nota: {item.quantidade}</Label>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Receber</span>
                          <Input type="number" className="h-8 w-20 text-right" value={qtds[item.codigo] ?? item.quantidade}
                            onChange={(e) => setQtds({ ...qtds, [item.codigo]: parseFloat(e.target.value) || 0 })} />
                        </div>
                      </div>
                    </div>
                    {item.alertas?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {item.alertas.map((a, i) => (
                          <p key={i} className="flex items-center gap-1.5 text-xs text-amber-700">
                            <AlertTriangle className="w-3 h-3 shrink-0" /> {a.msg}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {error && <div className="flex items-center gap-2 text-destructive text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('upload')} disabled={loading}>Voltar</Button>
              <Button onClick={confirmar} disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando...</> : <><CheckCircle className="w-4 h-4" /> Confirmar Recebimento</>}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'sucesso' && resultado && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" /><span className="font-medium">Recebimento finalizado com sucesso!</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
              <p><strong>Nota:</strong> {resultado.numero}/{resultado.serie} — {resultado.emitente}</p>
              <p><strong>Fornecedor:</strong> {resultado.fornecedor_criado ? 'Cadastrado automaticamente' : 'Vinculado ao existente'}</p>
              {resultado.pedido_vinculado && <p><strong>Pedido vinculado:</strong> {resultado.pedido_vinculado}</p>}
              <p><strong>Recebimento:</strong> {resultado.recebimento_completo ? 'Completo' : 'Parcial'}</p>
              <p><strong>Peças atualizadas em estoque:</strong> {resultado.pecas_processadas}</p>
              <p><strong>Contas a pagar geradas:</strong> {resultado.contas_pagar_criadas}</p>
              <p><strong>Valor total:</strong> {formatCurrency(resultado.valor_total)}</p>
            </div>
            <Button onClick={handleClose} className="w-full">Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}