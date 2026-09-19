import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import StatusBadge from '@/components/StatusBadge';
import FiscalValidacao from '@/components/os/FiscalValidacao';
import CobrarSplitDialog from '@/components/pagamentos/CobrarSplitDialog';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { Receipt, Loader2, CheckCircle, AlertCircle, FileText, KeyRound, ShieldCheck, XCircle, CreditCard, Sparkles, Printer, Mail, ExternalLink, SplitSquareHorizontal } from 'lucide-react';

const formasPagamento = [
  { value: 'pix', label: 'PIX (baixa automática)' },
  { value: 'cartao', label: 'Cartão (recebimento imediato)' },
  { value: 'dinheiro', label: 'Dinheiro (recebimento imediato)' },
  { value: 'boleto', label: 'Boleto (gera título)' },
  { value: 'transferencia', label: 'Transferência (gera título)' },
  { value: 'parcelado', label: 'Parcelado (gera parcelas)' },
];

export default function OsNotaFiscal({ os, cliente, veiculo, onUpdate }) {
  const [nota, setNota] = useState(null);
  const [notasOs, setNotasOs] = useState([]);
  const [loadingNota, setLoadingNota] = useState(true);
  const [emitindo, setEmitindo] = useState(false);
  const [error, setError] = useState('');
  const [forma, setForma] = useState('pix');
  const [parcelas, setParcelas] = useState(2);
  const [herdouCondicao, setHerdouCondicao] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [motivoCancel, setMotivoCancel] = useState('');
  const [cancelando, setCancelando] = useState(false);
  const [validando, setValidando] = useState(false);
  const [validacao, setValidacao] = useState(null);
  const [splitOpen, setSplitOpen] = useState(false);

  const validar = async () => {
    setValidando(true); setError(''); setValidacao(null);
    try {
      const res = await base44.functions.invoke('manageNfeSaida', { action: 'validar', ordem_servico_id: os.id });
      if (res.data?.error) { setError(res.data.error); return; }
      setValidacao(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erro ao validar nota');
    } finally { setValidando(false); }
  };

  const loadNota = async () => {
    setLoadingNota(true);
    // Busca todas as notas da OS (no modo dividido são 2: NF-e produto + NFS-e serviço)
    const todas = await base44.entities.NotaFiscal.filter({ ordem_servico_id: os.id }).catch(() => []);
    const ativas = (todas || []).filter((n) => n.status !== 'cancelada');
    setNotasOs(ativas);
    // "nota" principal (para cancelamento/reenvio via card único quando há só 1)
    if (ativas.length > 0) {
      setNota(ativas[0]);
    } else if (os.nota_fiscal_id) {
      const n = await base44.entities.NotaFiscal.get(os.nota_fiscal_id).catch(() => null);
      setNota(n);
    } else {
      setNota(null);
    }
    setLoadingNota(false);
  };

  useEffect(() => { loadNota(); }, [os.nota_fiscal_id, os.id]);

  // Herda a forma de pagamento e nº de parcelas negociados na OS, para que a
  // emissão pela tela de detalhe respeite o que foi acordado (não sobrepõe com "pix").
  useEffect(() => {
    const cond = os.condicao_pagamento;
    if (!cond?.forma) return;
    // 'promissoria' não é opção do seletor de emissão; cai para boleto (mesma cadência de cobrança).
    const formaValida = cond.forma === 'promissoria' ? 'boleto' : cond.forma;
    setForma(formaValida);
    if (cond.forma === 'parcelado' && Number(cond.numero_parcelas) > 1) {
      setParcelas(Number(cond.numero_parcelas));
    }
    setHerdouCondicao(true);
  }, [os.condicao_pagamento]);

  const emitir = async () => {
    setEmitindo(true); setError('');
    try {
      const res = await base44.functions.invoke('manageNfeSaida', {
        action: 'faturar', ordem_servico_id: os.id, forma_pagamento: forma, numero_parcelas: parcelas,
      });
      if (res.data?.error) { setError(res.data.error); return; }
      await loadNota();
      onUpdate?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erro ao emitir nota');
    } finally { setEmitindo(false); }
  };

  const cancelar = async () => {
    setCancelando(true); setError('');
    try {
      const res = await base44.functions.invoke('manageNfeSaida', {
        action: 'cancelar', nota_fiscal_id: nota.id, motivo: motivoCancel,
      });
      if (res.data?.error) { setError(res.data.error); return; }
      setCancelOpen(false); setMotivoCancel('');
      await loadNota();
      onUpdate?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erro ao cancelar nota');
    } finally { setCancelando(false); }
  };

  const [reenviando, setReenviando] = useState(false);
  const [reenviado, setReenviado] = useState('');
  const reenviarDanfe = async () => {
    setReenviando(true); setError(''); setReenviado('');
    try {
      const res = await base44.functions.invoke('manageNfeSaida', { action: 'reenviar_danfe', nota_fiscal_id: nota.id });
      if (res.data?.error) { setError(res.data.error); return; }
      setReenviado(res.data.email);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erro ao reenviar DANFE');
    } finally { setReenviando(false); }
  };

  if (loadingNota) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  const modoDividido = os.distribuicao_faturamento?.modo === 'dividido';

  const cancelada = nota?.status === 'cancelada';
  const notaAtiva = nota && !cancelada;

  // === Nota emitida (revisão / dados SEFAZ) ===
  if (notaAtiva) {
    return (
      <div className="space-y-4">
        {notasOs.length > 1 && (
          <div className="flex items-center gap-2 text-sm bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-3 py-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Faturamento dividido: {notasOs.length} notas emitidas em CNPJs diferentes.
          </div>
        )}
        {notasOs.length > 1 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {notasOs.map((n) => (
              <div key={n.id} className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{n.valor_produtos > 0 && n.valor_servicos === 0 ? 'NF-e (Produtos)' : n.valor_produtos === 0 ? 'NFS-e (Serviços)' : 'NF-e'} {n.numero}/{n.serie}</span>
                  <StatusBadge status="autorizada" />
                </div>
                <p className="text-xs text-muted-foreground">Emitente: {n.emitente_nome || '—'}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{n.emitente_cnpj || '—'}</p>
                <p className="text-sm font-medium text-primary">{formatCurrency(n.valor_total)}</p>
                {n.pdf_url && (
                  <a href={n.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink className="w-3 h-3" /> DANFE</a>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-medium">NF-e {nota.numero}/{nota.serie} autorizada</span>
            <StatusBadge status="autorizada" />
          </div>
          <div className="flex flex-wrap gap-2">
            {nota.pdf_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={nota.pdf_url} target="_blank" rel="noopener noreferrer"><Printer className="w-4 h-4" /> Visualizar DANFE</a>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={reenviarDanfe} disabled={reenviando}>
              {reenviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Reenviar DANFE
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}>
              <XCircle className="w-4 h-4" /> Cancelar Nota
            </Button>
          </div>
        </div>

        {reenviado && <div className="flex items-center gap-2 text-emerald-600 text-sm"><CheckCircle className="w-4 h-4 shrink-0" /> DANFE enviada para {reenviado}</div>}
        {error && <div className="flex items-center gap-2 text-destructive text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <Field label="Número / Série" value={`${nota.numero} / ${nota.serie}`} />
          <Field label="Data de Emissão" value={formatDate(nota.data_emissao)} />
          <Field label="Natureza da Operação" value={nota.natureza_operacao} />
          <Field label="CFOP" value={nota.cfop} />
          <Field label="Destinatário" value={nota.destinatario_nome} />
          <Field label="CPF/CNPJ" value={nota.destinatario_cnpj || '—'} />
          <Field label="Forma de Pagamento" value={nota.forma_pagamento} />
          <Field label="Valor Total" value={formatCurrency(nota.valor_total)} highlight />
        </div>

        <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
          <p className="flex items-center gap-2"><KeyRound className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Chave:</span> <span className="font-mono text-xs break-all">{nota.chave_acesso}</span></p>
          <p className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Protocolo:</span> <span className="font-mono text-xs">{nota.protocolo}</span></p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <Field label="Produtos" value={formatCurrency(nota.valor_produtos)} />
          <Field label="Serviços" value={formatCurrency(nota.valor_servicos)} />
          <Field label="Desconto" value={formatCurrency(nota.valor_desconto)} />
          <Field label="Tributos" value={formatCurrency(nota.valor_tributos)} />
        </div>

        {nota.tributos_detalhe && (
          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <span>ICMS: {formatCurrency(nota.tributos_detalhe.icms)}</span>
            <span>ISS: {formatCurrency(nota.tributos_detalhe.iss)}</span>
            <span>PIS: {formatCurrency(nota.tributos_detalhe.pis)}</span>
            <span>COFINS: {formatCurrency(nota.tributos_detalhe.cofins)}</span>
          </div>
        )}

        <CancelDialog open={cancelOpen} onOpenChange={setCancelOpen} motivo={motivoCancel} setMotivo={setMotivoCancel}
          onConfirm={cancelar} loading={cancelando} error={error} />
      </div>
    );
  }

  // === Sem nota ativa (formulário de emissão) ===
  return (
    <div className="space-y-4">
      {cancelada && (
        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">NF-e {nota.numero} cancelada</p>
            <p className="text-xs mt-0.5">Motivo: {nota.motivo_cancelamento}</p>
            <p className="text-xs">Em: {formatDateTime(nota.data_cancelamento)} — estoque e financeiro estornados.</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">Faturamento</span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700"><span className="w-2 h-2 rounded-full bg-amber-500" /> Aguardando emissão</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div><span className="text-xs text-muted-foreground">Cliente</span><p className="font-medium">{cliente?.nome || '—'}</p></div>
          <div><span className="text-xs text-muted-foreground">CPF/CNPJ</span><p className="font-medium">{cliente?.cnpj || cliente?.cpf || '—'}</p></div>
          <div><span className="text-xs text-muted-foreground">Veículo</span><p className="font-medium">{veiculo ? `${veiculo.placa} · ${veiculo.marca} ${veiculo.modelo}` : '—'}</p></div>
          <div>
            <span className="text-xs text-muted-foreground">Valor</span>
            <p className="font-medium text-primary">{formatCurrency(os.valor_total)}</p>
            {Number(os.valor_desconto) > 0 && (
              <span className="text-[11px] text-destructive">desconto de {formatCurrency(os.valor_desconto)} já aplicado</span>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground border-t border-amber-200 pt-1.5">
          {modoDividido
            ? 'Faturamento dividido: será emitida uma NF-e de produtos e uma NFS-e de serviços, cada uma no seu CNPJ, com desconto rateado.'
            : 'Ao faturar, o Módulo Fiscal gera a NF-e na SEFAZ, o Contas a Receber e faz a baixa das peças automaticamente.'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Forma de Pagamento</Label>
          <Select value={forma} onValueChange={setForma}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {formasPagamento.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {forma === 'parcelado' && (
          <div>
            <Label>Nº de Parcelas</Label>
            <Input type="number" min={2} max={24} value={parcelas} onChange={(e) => setParcelas(parseInt(e.target.value) || 2)} />
          </div>
        )}
      </div>

      {herdouCondicao && (
        <p className="text-[11px] text-muted-foreground -mt-1">
          Forma preenchida a partir da condição de pagamento negociada na OS. Você pode ajustar antes de emitir.
        </p>
      )}

      {validacao && <FiscalValidacao resultado={validacao} />}

      {error && <div className="flex items-center gap-2 text-destructive text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={validar} disabled={validando || !(os.itens || []).length} className="w-full sm:w-auto">
          {validando ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</> : <><Sparkles className="w-4 h-4" /> Validar com IA</>}
        </Button>
        <Button onClick={emitir} disabled={emitindo || !(os.itens || []).length || validacao?.tem_erro} className="w-full sm:w-auto">
          {emitindo ? <><Loader2 className="w-4 h-4 animate-spin" /> Faturando na SEFAZ...</> : <><Receipt className="w-4 h-4" /> {modoDividido ? 'Faturar OS (2 notas)' : 'Faturar OS'}</>}
        </Button>
        <Button variant="outline" onClick={() => setSplitOpen(true)} disabled={!(os.itens || []).length} className="w-full sm:w-auto">
          <SplitSquareHorizontal className="w-4 h-4" /> Cobrar com Split
        </Button>
      </div>

      <CobrarSplitDialog open={splitOpen} onOpenChange={setSplitOpen} os={os} />
      {validacao?.tem_erro && <p className="text-xs text-rose-600">Corrija os erros apontados pelo Assistente Fiscal antes de emitir.</p>}
      {!(os.itens || []).length && <p className="text-xs text-muted-foreground">Adicione itens à OS antes de emitir a nota.</p>}
    </div>
  );
}

function Field({ label, value, highlight }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`font-medium ${highlight ? 'text-primary' : ''}`}>{value || '—'}</p>
    </div>
  );
}

function CancelDialog({ open, onOpenChange, motivo, setMotivo, onConfirm, loading, error }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Cancelar NF-e</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">O cancelamento na SEFAZ irá estornar o estoque e o financeiro. O registro nunca é apagado.</p>
          <div>
            <Label>Motivo do cancelamento (mín. 15 caracteres)</Label>
            <Textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Descreva o motivo do cancelamento..." />
          </div>
          {error && <div className="flex items-center gap-2 text-destructive text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Voltar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading || motivo.trim().length < 15}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelando...</> : <><XCircle className="w-4 h-4" /> Confirmar Cancelamento</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}