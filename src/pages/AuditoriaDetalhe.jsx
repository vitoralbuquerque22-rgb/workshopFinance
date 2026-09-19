import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Check, X, Loader2, ClipboardCheck, AlertTriangle, Image, History } from 'lucide-react';
import ConferenciaItens from '@/components/auditoria/ConferenciaItens';
import PendenciasPainel from '@/components/auditoria/PendenciasPainel';
import MidiaUpload from '@/components/patrimonio/MidiaUpload';
import MissaoHistorico from '@/components/atendimento/MissaoHistorico';
import { STATUS_AUDITORIA, tipoInfo } from '@/lib/auditoria';
import { formatDateTime } from '@/lib/format';
import { base44 } from '@/api/base44Client';

export default function AuditoriaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auditoria, setAuditoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [aprovando, setAprovando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [showReprovar, setShowReprovar] = useState(false);

  const [itens, setItens] = useState([]);
  const [pendencias, setPendencias] = useState([]);
  const [fotos, setFotos] = useState([]);

  const carregar = async () => {
    const a = await base44.entities.Auditoria.get(id).catch(() => null);
    setAuditoria(a);
    setItens(a?.itens || []);
    setPendencias(a?.pendencias || []);
    setFotos(a?.fotos || []);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [id]);

  if (loading) return <div className="py-20 text-center text-muted-foreground">Carregando...</div>;
  if (!auditoria) return <div className="py-20 text-center text-muted-foreground">Auditoria não encontrada.</div>;

  const st = STATUS_AUDITORIA[auditoria.status] || STATUS_AUDITORIA.aberta;
  const info = tipoInfo(auditoria.tipo);
  const aprovada = auditoria.status === 'aprovada';
  const readOnly = aprovada;
  const mostrarQtd = auditoria.tipo === 'pecas';

  const salvar = async () => {
    setSalvando(true);
    const temPendencia = pendencias.some((p) => !p.resolvida);
    const todosConferidos = itens.length > 0 && itens.every((i) => i.situacao !== 'pendente');
    const novoStatus = todosConferidos && !temPendencia ? 'aguardando_aprovacao' : itens.some((i) => i.situacao !== 'pendente') ? 'em_conferencia' : auditoria.status;
    await base44.entities.Auditoria.update(id, { itens, pendencias, fotos, status: novoStatus });
    setSalvando(false);
    carregar();
  };

  const aprovar = async () => {
    setAprovando(true);
    await base44.entities.Auditoria.update(id, { itens, pendencias, fotos });
    await base44.functions.invoke('manageAuditoria', { action: 'aprovar', auditoria_id: id });
    setAprovando(false);
    carregar();
  };

  const reprovar = async () => {
    setAprovando(true);
    await base44.functions.invoke('manageAuditoria', { action: 'reprovar', auditoria_id: id, motivo });
    setAprovando(false);
    setShowReprovar(false);
    carregar();
  };

  const Icon = info.icon;
  const pendenciasAbertas = pendencias.filter((p) => !p.resolvida).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/auditorias')}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold font-heading">{auditoria.titulo || info.label}</h1>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">
            {auditoria.numero}{auditoria.referencia_numero && ` · Origem: ${auditoria.referencia_numero}`}
          </p>
        </div>
        {!readOnly && (
          <>
            <Button variant="outline" onClick={salvar} disabled={salvando}>
              {salvando ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Salvar
            </Button>
            <Button variant="outline" onClick={() => setShowReprovar(true)}><X className="w-4 h-4 mr-1" /> Reprovar</Button>
            <Button onClick={aprovar} disabled={aprovando || pendenciasAbertas > 0}>
              {aprovando ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />} Aprovar
            </Button>
          </>
        )}
      </div>

      {auditoria.responsavel_nome && (
        <p className="text-sm text-muted-foreground mb-4">Responsável: <span className="text-foreground font-medium">{auditoria.responsavel_nome}</span></p>
      )}
      {aprovada && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
          Aprovada por {auditoria.aprovada_por_nome} em {formatDateTime(auditoria.aprovada_em)}. Estoque e patrimônio atualizados.
        </div>
      )}
      {auditoria.status === 'reprovada' && auditoria.motivo_reprovacao && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">Reprovada: {auditoria.motivo_reprovacao}</div>
      )}

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="conferencia">
            <TabsList>
              <TabsTrigger value="conferencia"><ClipboardCheck className="w-4 h-4 mr-1" /> Conferência</TabsTrigger>
              <TabsTrigger value="pendencias"><AlertTriangle className="w-4 h-4 mr-1" /> Pendências{pendenciasAbertas > 0 ? ` (${pendenciasAbertas})` : ''}</TabsTrigger>
              <TabsTrigger value="fotos"><Image className="w-4 h-4 mr-1" /> Fotos</TabsTrigger>
              <TabsTrigger value="historico"><History className="w-4 h-4 mr-1" /> Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="conferencia" className="pt-4">
              <ConferenciaItens itens={itens} onChange={setItens} readOnly={readOnly} mostrarQuantidade={mostrarQtd} />
            </TabsContent>

            <TabsContent value="pendencias" className="pt-4">
              <PendenciasPainel pendencias={pendencias} onChange={setPendencias} readOnly={readOnly} />
            </TabsContent>

            <TabsContent value="fotos" className="pt-4">
              {readOnly && fotos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma foto.</p>
              ) : (
                <MidiaUpload modo="fotos" valor={fotos} onChange={readOnly ? () => {} : setFotos} label="Fotos da conferência" />
              )}
            </TabsContent>

            <TabsContent value="historico" className="pt-4">
              <MissaoHistorico historico={auditoria.historico} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showReprovar && (
        <Card className="mt-4 border-red-200">
          <CardHeader><CardTitle className="text-base text-red-700">Reprovar auditoria</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo da reprovação..." />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReprovar(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={reprovar} disabled={aprovando}>Confirmar reprovação</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}