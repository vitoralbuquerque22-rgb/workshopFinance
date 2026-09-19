import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Car, Wrench, Handshake, ExternalLink, UserCog, Clock, CheckCircle2, Archive, Info, Phone, MessageCircle, FileSignature, UserPlus, ArrowLeftRight, Loader2, CalendarClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IDENTIFICACAO, STATUS_CONVERSA, tempoRelativo } from '@/lib/conversas';
import AgendamentosLista from './AgendamentosLista';

function VinculoCard({ icon: Icon, titulo, valor, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-border text-left ${onClick ? 'hover:bg-accent transition-colors' : ''}`}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{titulo}</p>
        <p className="text-sm font-medium truncate">{valor}</p>
        {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
      </div>
      {onClick && <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
    </button>
  );
}

export default function PainelContexto({ conversa, cliente, veiculo, ordemServico, lead, consultores, timeline, onAtribuir, onStatus, onLigar, onWhatsApp, onAssumir, onTransferir, onEnviarAprovacao, onAbrirOs, aprovacaoCarregando, assumindo, agendamentos, onAgendar, onEditarAgendamento, onCancelarAgendamento }) {
  const navigate = useNavigate();

  if (!conversa) {
    return (
      <div className="flex h-full items-center justify-center text-center text-muted-foreground bg-card border-l border-border p-4">
        <div>
          <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Sem conversa selecionada</p>
        </div>
      </div>
    );
  }

  const ident = IDENTIFICACAO[conversa.identificacao_status] || IDENTIFICACAO.nao_identificado;
  const telefone = conversa.contato_telefone || cliente?.celular || cliente?.telefone;

  return (
    <div className="flex h-full flex-col border-l border-border bg-card overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Identificação */}
        <div>
          <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${ident.color}`}>{ident.label}</span>
        </div>

        {/* Ações de contato (registra o clique na timeline) */}
        <div className="grid grid-cols-2 gap-1.5">
          <Button variant="outline" size="sm" className="h-9 text-xs" disabled={!telefone} onClick={() => onLigar?.(telefone)}>
            <Phone className="w-3.5 h-3.5" /> Ligar
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs text-green-700 hover:text-green-700" disabled={!telefone} onClick={() => onWhatsApp?.(telefone)}>
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </Button>
        </div>

        {/* Aprovação de orçamento pelo canal */}
        {ordemServico?.status === 'orcamento' && (
          <Button size="sm" className="w-full h-9 text-xs bg-emerald-600 hover:bg-emerald-700" disabled={aprovacaoCarregando} onClick={() => onEnviarAprovacao?.()}>
            {aprovacaoCarregando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSignature className="w-3.5 h-3.5" />}
            Enviar orçamento p/ aprovação
          </Button>
        )}

        {/* Agendar mensagem pontual para o contato */}
        <Button variant="outline" size="sm" className="w-full h-9 text-xs" onClick={() => onAgendar?.()}>
          <CalendarClock className="w-3.5 h-3.5" /> Agendar mensagem
        </Button>

        {/* Atribuição / transferência de atendimento */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <UserCog className="w-3.5 h-3.5" /> Consultor responsável
          </label>
          <Select value={conversa.consultor_id || 'nenhum'} onValueChange={onAtribuir}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Atribuir..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nenhum">Sem responsável</SelectItem>
              {consultores.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" disabled={assumindo} onClick={() => onAssumir?.()}>
              {assumindo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />} Assumir
            </Button>
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onTransferir?.()}>
              <ArrowLeftRight className="w-3.5 h-3.5" /> Transferir
            </Button>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Status da conversa</label>
          <Select value={conversa.status} onValueChange={onStatus}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONVERSA).map(([v, s]) => (
                <SelectItem key={v} value={v}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1.5 pt-1">
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onStatus('resolvida')}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolver
            </Button>
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onStatus('arquivada')}>
              <Archive className="w-3.5 h-3.5" /> Arquivar
            </Button>
          </div>
        </div>

        {/* Vínculos */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Vínculos</p>
          {cliente && (
            <VinculoCard icon={User} titulo="Cliente" valor={cliente.nome} sub={cliente.celular || cliente.telefone} onClick={() => navigate('/clientes')} />
          )}
          {veiculo && (
            <VinculoCard icon={Car} titulo="Veículo" valor={`${veiculo.marca || ''} ${veiculo.modelo || ''}`.trim() || veiculo.placa} sub={veiculo.placa} />
          )}
          {ordemServico && (
            <VinculoCard icon={Wrench} titulo="Ordem de Serviço" valor={ordemServico.numero || 'OS'} sub={ordemServico.status} onClick={onAbrirOs || (() => navigate(`/ordens-servico/${ordemServico.id}`))} />
          )}
          {lead && (
            <VinculoCard icon={Handshake} titulo="Lead" valor={lead.nome} sub={lead.etapa} onClick={() => navigate('/marketing/leads')} />
          )}
          {!cliente && !veiculo && !ordemServico && !lead && (
            <p className="text-xs text-muted-foreground py-2">Nenhum vínculo encontrado.</p>
          )}
        </div>

        {/* Mensagens agendadas para o contato */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <CalendarClock className="w-3.5 h-3.5" /> Mensagens agendadas
          </p>
          <AgendamentosLista agendamentos={agendamentos} onEditar={onEditarAgendamento} onCancelar={onCancelarAgendamento} />
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Clock className="w-3.5 h-3.5" /> Linha do tempo
          </p>
          {timeline.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem eventos.</p>
          ) : (
            <div className="space-y-3 pl-1">
              {timeline.map((ev, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="flex-1 pb-1">
                    <p className="text-xs font-medium">{ev.titulo}</p>
                    {ev.descricao && <p className="text-xs text-muted-foreground">{ev.descricao}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{tempoRelativo(ev.data)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}