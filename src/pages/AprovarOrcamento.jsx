import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, XCircle, ShieldCheck, FileText } from 'lucide-react';

const fmt = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AprovarOrcamento() {
  const token = new URLSearchParams(window.location.search).get('token');
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [modo, setModo] = useState(null); // 'aprovar' | 'reprovar'
  const [assinatura, setAssinatura] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(null); // 'aprovado' | 'reprovado'

  useEffect(() => {
    (async () => {
      if (!token) { setErro('Link inválido.'); setLoading(false); return; }
      try {
        const { data } = await base44.functions.invoke('responderAprovacao', { token });
        if (data?.error) setErro(data.error);
        else setDados(data.aprovacao);
      } catch (e) {
        setErro('Não foi possível carregar o orçamento.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const responder = async () => {
    setEnviando(true);
    setErro('');
    try {
      const { data } = await base44.functions.invoke('responderAprovacao', {
        token, acao: modo,
        assinatura_nome: modo === 'aprovar' ? assinatura.trim() : undefined,
        motivo: modo === 'reprovar' ? motivo.trim() : undefined,
      });
      // Se já foi respondido (409), tratamos como conclusão em vez de erro vermelho.
      if (data?.ja_respondido && data?.status_atual) { setConcluido(data.status_atual); return; }
      if (data?.error) { setErro(data.error); return; }
      setConcluido(data.resultado);
    } catch (e) {
      setErro('Erro ao enviar sua resposta. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  const jaRespondido = dados && dados.status !== 'pendente';

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-primary text-primary-foreground p-5 text-center">
          <FileText className="w-8 h-8 mx-auto mb-1.5" />
          <h1 className="text-lg font-bold font-heading">Aprovação de Orçamento</h1>
          {dados?.os_numero && <p className="text-sm opacity-90">OS {dados.os_numero}</p>}
        </div>

        <div className="p-5 space-y-4">
          {erro && !dados && <p className="text-sm text-destructive text-center py-6">{erro}</p>}

          {dados && (
            <>
              {(dados.cliente_nome || dados.veiculo_placa) && (
                <div className="text-sm text-muted-foreground space-y-0.5">
                  {dados.cliente_nome && <p><span className="font-medium text-foreground">Cliente:</span> {dados.cliente_nome}</p>}
                  {dados.veiculo_placa && <p><span className="font-medium text-foreground">Veículo:</span> {dados.veiculo_placa}</p>}
                </div>
              )}

              {Array.isArray(dados.itens) && dados.itens.length > 0 && (
                <div className="border border-border rounded-lg divide-y divide-border">
                  {dados.itens.map((it, i) => (
                    <div key={i} className="flex justify-between gap-2 px-3 py-2 text-sm">
                      <span className="truncate">{it.descricao || '—'}{it.quantidade > 1 ? ` (${it.quantidade}x)` : ''}</span>
                      <span className="font-medium shrink-0">{fmt(it.valor_total)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center bg-muted/60 rounded-lg px-3 py-2.5">
                <span className="text-sm font-medium">Total</span>
                <span className="text-lg font-bold">{fmt(dados.valor_total)}</span>
              </div>

              {concluido || jaRespondido ? (
                <div className="text-center py-4">
                  {(concluido || dados.status) === 'aprovado' ? (
                    <>
                      <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                      <p className="font-semibold text-emerald-700">Orçamento aprovado!</p>
                      <p className="text-sm text-muted-foreground mt-1">Sua assinatura foi registrada. Já podemos iniciar o serviço.</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
                      <p className="font-semibold text-destructive">Orçamento não aprovado</p>
                      <p className="text-sm text-muted-foreground mt-1">Sua resposta foi registrada. Nossa equipe entrará em contato.</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {!modo && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setModo('aprovar')}>
                        <CheckCircle2 className="w-4 h-4" /> Aprovar
                      </Button>
                      <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setModo('reprovar')}>
                        <XCircle className="w-4 h-4" /> Reprovar
                      </Button>
                    </div>
                  )}

                  {modo === 'aprovar' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Assinatura eletrônica</label>
                        <Input placeholder="Digite seu nome completo" value={assinatura} onChange={(e) => setAssinatura(e.target.value)} />
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <ShieldCheck className="w-3 h-3" /> Ao aprovar, você autoriza a execução deste orçamento.
                        </p>
                      </div>
                      {erro && <p className="text-sm text-destructive">{erro}</p>}
                      <div className="flex gap-2">
                        <Button variant="ghost" className="flex-1" onClick={() => setModo(null)} disabled={enviando}>Voltar</Button>
                        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={responder} disabled={enviando || !assinatura.trim()}>
                          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar aprovação'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {modo === 'reprovar' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Motivo da reprovação</label>
                        <Textarea placeholder="Conte-nos o motivo..." value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} />
                      </div>
                      {erro && <p className="text-sm text-destructive">{erro}</p>}
                      <div className="flex gap-2">
                        <Button variant="ghost" className="flex-1" onClick={() => setModo(null)} disabled={enviando}>Voltar</Button>
                        <Button variant="destructive" className="flex-1" onClick={responder} disabled={enviando || !motivo.trim()}>
                          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar reprovação'}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}