import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import StatusBadge from '@/components/StatusBadge';
import RetrabalhoBadge from '@/components/os/RetrabalhoBadge';
import OsFluxoStepper from '@/components/os/OsFluxoStepper';
import OsTimeline from '@/components/os/OsTimeline';
import OsComentarios from '@/components/os/OsComentarios';
import OsProducao from '@/components/os/OsProducao';
import AprovacaoParcialPanel from '@/components/os/AprovacaoParcialPanel';
import CronometroOs from '@/components/os/CronometroOs';
import ApontamentoHorasPanel from '@/components/os/ApontamentoHorasPanel';
import LinhaTempoUnificada from '@/components/os/LinhaTempoUnificada';
import OsNotaFiscal from '@/components/os/OsNotaFiscal';
import RateioCnpjPanel from '@/components/os/RateioCnpjPanel';
import GpsMediaUpload from '@/components/gps/GpsMediaUpload';
import WhatsAppButton from '@/components/os/WhatsAppButton';
import OsOrigemCliente from '@/components/os/OsOrigemCliente';
import { etapasFluxo, etapaIndex, etapaFluxoLabel } from '@/lib/osFluxo';
import { formatCurrency, formatDate } from '@/lib/format';
import { gerarLaudoTecnico } from '@/lib/laudo';
import { ArrowLeft, Loader2, Car, User, Wrench, ChevronRight, FileText, Navigation, ClipboardCheck } from 'lucide-react';

export default function OrdemServicoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [os, setOs] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [veiculo, setVeiculo] = useState(null);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gerandoLaudo, setGerandoLaudo] = useState(false);

  const imprimirLaudo = async () => {
    setGerandoLaudo(true);
    try {
      await gerarLaudoTecnico(os, cliente, veiculo);
    } finally {
      setGerandoLaudo(false);
    }
  };

  const load = async () => {
    const o = await base44.entities.OrdemServico.get(id);
    setOs(o);
    const [c, v] = await Promise.all([
      o.cliente_id ? base44.entities.Cliente.get(o.cliente_id).catch(() => null) : null,
      o.veiculo_id ? base44.entities.Veiculo.get(o.veiculo_id).catch(() => null) : null,
    ]);
    setCliente(c);
    setVeiculo(v);
    const tec = await base44.entities.Colaborador.filter({ status: 'ativo' }).catch(() => []);
    setColaboradores(tec);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const patch = async (data) => {
    const updated = await base44.entities.OrdemServico.update(id, data);
    setOs((prev) => ({ ...prev, ...updated }));
  };

  const moverEtapa = async (novaEtapa) => {
    if (novaEtapa === os.etapa_fluxo) return;
    const evento = { etapa: novaEtapa, descricao: 'Etapa atualizada', usuario: '', data: new Date().toISOString() };
    await patch({ etapa_fluxo: novaEtapa, timeline: [...(os.timeline || []), evento] });
    // Fase 2 — notifica o cliente automaticamente conforme a config de notificações.
    base44.functions.invoke('notificarEtapaOs', { ordem_servico_id: id, etapa: novaEtapa }).catch(() => {});
  };

  const addComentario = async (texto) => {
    const novo = { texto, usuario: '', data: new Date().toISOString() };
    await patch({ comentarios: [...(os.comentarios || []), novo] });
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!os) return <p className="text-muted-foreground">OS não encontrada.</p>;

  const idx = etapaIndex(os.etapa_fluxo || 'recepcao');
  const proxima = etapasFluxo[idx + 1];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/ordens-servico')} className="-ml-2">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>

      <PageHeader title={os.numero || `OS-${os.id.slice(-6)}`} description="Fluxo inteligente de ordem de serviço">
        <div className="flex items-center gap-2">
          {os.gps_atendimento_id ? (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-green-100 text-green-700 font-medium">
              <ClipboardCheck className="w-3.5 h-3.5" /> GPS anexado
            </span>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate(`/gps-vendas?os=${os.id}`)}>
              <Navigation className="w-4 h-4" /> Executar GPS
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={imprimirLaudo} disabled={gerandoLaudo}>
            {gerandoLaudo ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Laudo Técnico
          </Button>
          <WhatsAppButton
            clienteNome={cliente?.nome}
            telefone={cliente?.telefone}
            osNumero={os.numero || `OS-${os.id.slice(-6)}`}
            veiculo={veiculo ? `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})` : ''}
            valor={formatCurrency(os.valor_total)}
          />
          <RetrabalhoBadge os={os} />
          <StatusBadge status={os.status} />
        </div>
      </PageHeader>

      {os.os_origem_id && (
        <div className="flex flex-wrap items-center gap-2 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <span className="text-muted-foreground">Retrabalho da ordem</span>
          <button onClick={() => navigate(`/ordens-servico/${os.os_origem_id}`)} className="font-medium text-red-700 hover:underline">
            {os.os_origem_numero || 'OS original'}
          </button>
          {os.motivo_retrabalho && <span className="text-muted-foreground">· {os.motivo_retrabalho}</span>}
        </div>
      )}

      <Card>
        <CardContent className="py-5">
          <OsFluxoStepper etapaAtual={os.etapa_fluxo} onSelect={moverEtapa} />
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Etapa atual: <strong className="text-foreground">{etapaFluxoLabel(os.etapa_fluxo || 'recepcao')}</strong>
            </p>
            {proxima && (
              <Button size="sm" onClick={() => moverEtapa(proxima.key)}>
                Avançar para {proxima.label} <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-3">
        <Card><CardContent className="py-3 flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /><div><p className="text-[11px] text-muted-foreground">Cliente</p><p className="text-sm font-medium">{cliente?.nome || '—'}</p></div></CardContent></Card>
        <Card><CardContent className="py-3 flex items-center gap-2"><Car className="w-4 h-4 text-muted-foreground" /><div><p className="text-[11px] text-muted-foreground">Veículo</p><p className="text-sm font-medium">{veiculo ? `${veiculo.placa} · ${veiculo.marca} ${veiculo.modelo}` : '—'}</p></div></CardContent></Card>
        <Card><CardContent className="py-3 flex items-center gap-2"><Wrench className="w-4 h-4 text-muted-foreground" /><div><p className="text-[11px] text-muted-foreground">Total</p><p className="text-sm font-medium text-primary">{formatCurrency(os.valor_total)}</p></div></CardContent></Card>
      </div>

      <OsOrigemCliente clienteId={os.cliente_id} />

      <Tabs defaultValue="timeline">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="aprovacao">Aprovação</TabsTrigger>
          <TabsTrigger value="producao">Produção</TabsTrigger>
          <TabsTrigger value="horas">Horas</TabsTrigger>
          <TabsTrigger value="nota">Nota Fiscal</TabsTrigger>
          <TabsTrigger value="midia">Mídia</TabsTrigger>
          <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
          <TabsTrigger value="comentarios">Comentários</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <Card><CardHeader><CardTitle className="text-sm">Histórico do fluxo</CardTitle></CardHeader><CardContent><OsTimeline timeline={os.timeline} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="aprovacao" className="mt-4">
          <Card><CardHeader><CardTitle className="text-sm">Aprovação de itens · o que o cliente aprovou</CardTitle></CardHeader><CardContent><AprovacaoParcialPanel os={os} onUpdate={load} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="producao" className="mt-4 space-y-4">
          <Card><CardHeader><CardTitle className="text-sm">Controle de produção</CardTitle></CardHeader><CardContent><CronometroOs os={os} colaboradores={colaboradores} onUpdate={patch} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Checklist de produção</CardTitle></CardHeader><CardContent><OsProducao os={os} onUpdate={patch} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="horas" className="mt-4 space-y-4">
          <Card><CardHeader><CardTitle className="text-sm">Linha do tempo · etapas + apontamento por etapa</CardTitle></CardHeader><CardContent><LinhaTempoUnificada os={os} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Apontamento de horas · vendidas × executadas</CardTitle></CardHeader><CardContent><ApontamentoHorasPanel os={os} colaboradores={colaboradores} onUpdate={patch} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="nota" className="mt-4 space-y-4">
          <Card><CardHeader><CardTitle className="text-sm">Distribuição por CNPJ · quanto vai pra cada um</CardTitle></CardHeader><CardContent><RateioCnpjPanel os={os} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Nota Fiscal de Saída</CardTitle></CardHeader><CardContent><OsNotaFiscal os={os} cliente={cliente} veiculo={veiculo} onUpdate={load} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="midia" className="mt-4 space-y-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Fotos</CardTitle></CardHeader><CardContent><GpsMediaUpload type="foto" anexos={os.fotos} onChange={(v) => patch({ fotos: v })} /></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Vídeos</CardTitle></CardHeader><CardContent><GpsMediaUpload type="video" anexos={os.videos} onChange={(v) => patch({ videos: v })} /></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Áudios</CardTitle></CardHeader><CardContent><GpsMediaUpload type="audio" anexos={os.audios} onChange={(v) => patch({ audios: v })} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="arquivos" className="mt-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Arquivos anexos</CardTitle></CardHeader>
            <CardContent>
              <GpsMediaUpload type="arquivo" anexos={os.arquivos} onChange={(v) => patch({ arquivos: v })} />
              {(os.arquivos || []).length > 0 && (
                <div className="mt-3 space-y-1">
                  {os.arquivos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="block text-sm text-primary hover:underline truncate">Arquivo {i + 1}</a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comentarios" className="mt-4">
          <Card><CardHeader><CardTitle className="text-sm">Comentários internos</CardTitle></CardHeader><CardContent><OsComentarios comentarios={os.comentarios} onAdd={addComentario} /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}