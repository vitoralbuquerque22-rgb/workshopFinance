import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Loader2, CheckCircle2, Edit, ShoppingCart, FileBarChart, Workflow, Navigation, RotateCcw, XCircle, Trash2, MoreHorizontal, AlertTriangle, MessageCircle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { calcularRentabilidade } from '@/lib/rentabilidade';

function EquipeItem({ label, nome }) {
  return (
    <div className="flex items-baseline gap-1 leading-tight">
      <span className="text-[10px] uppercase text-muted-foreground/70 w-12 shrink-0">{label}</span>
      <span className="text-xs text-foreground truncate max-w-[130px]">{nome || '—'}</span>
    </div>
  );
}

export default function OsTableRow({
  os, clienteNome, veiculoInfo, actionLoading,
  onOpen, onAprovar, onFinalizar, onReprovar, onExcluir,
  onPedido, onLaudo, onEditar, onRetrabalho, onGps, onWhatsApp,
}) {
  const rent = calcularRentabilidade(os);
  const finalizacao = os.execucao_fim || os.data_fechamento;
  const abertura = os.execucao_inicio || os.created_date;
  const tecnica = [os.tecnico_responsavel, os.qualidade_por_nome].filter(Boolean).join(' / ');
  const finishing = actionLoading[os.id + 'finish'];
  const approving = actionLoading[os.id + 'approve'];

  return (
    <tr onClick={() => onOpen(os)} className="border-b border-border hover:bg-accent/50 cursor-pointer transition-colors">
      {/* OS + status */}
      <td className="px-2 py-1.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm">{os.numero || `OS-${os.id.slice(-6)}`}</span>
          <StatusBadge status={os.status} />
        </div>
      </td>
      {/* Cliente + veículo */}
      <td className="px-2 py-1.5 max-w-[160px]">
        <p className="text-sm font-medium truncate leading-tight">{clienteNome(os.cliente_id)}</p>
        <p className="text-xs text-muted-foreground truncate leading-tight">{veiculoInfo(os.veiculo_id)}</p>
      </td>
      {/* Equipe: vendas / atendimento / técnica */}
      <td className="px-2 py-1.5">
        <div className="flex flex-col gap-0.5">
          <EquipeItem label="Vendas" nome={os.consultor} />
          <EquipeItem label="Atend." nome={os.criado_por_nome} />
          <EquipeItem label="Técnica" nome={tecnica} />
        </div>
      </td>
      {/* Abertura (com horário) */}
      <td className="px-2 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
        {abertura ? formatDateTime(abertura) : formatDate(os.data_abertura)}
      </td>
      {/* Finalização */}
      <td className="px-2 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
        {finalizacao ? formatDateTime(finalizacao) : '—'}
      </td>
      {/* Total */}
      <td className="px-2 py-1.5 text-right whitespace-nowrap">
        <span className="text-sm font-bold text-primary">{formatCurrency(os.valor_total)}</span>
      </td>
      {/* Rentabilidade */}
      <td className="px-2 py-1.5 text-right whitespace-nowrap">
        {rent.percentual === null ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${rent.saudavel ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {!rent.saudavel && <AlertTriangle className="w-3 h-3" />}
            {rent.percentual.toFixed(0)}%
          </span>
        )}
      </td>
      {/* Ações — tudo no menu */}
      <td className="px-2 py-1.5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="outline" className="h-7 w-7">
              {(finishing || approving) ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {os.status === 'orcamento' && (
              <>
                <DropdownMenuItem onClick={() => onAprovar(os)} disabled={approving}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Aprovar
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onReprovar(os)}>
                  <XCircle className="w-4 h-4" /> Não fechou
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {(os.status === 'aprovado' || os.status === 'em_andamento') && (
              <>
                <DropdownMenuItem onClick={() => onFinalizar(os)} disabled={finishing}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Finalizar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => onOpen(os)}>
              <Workflow className="w-4 h-4" /> Ver Fluxo
            </DropdownMenuItem>
            {!os.gps_atendimento_id && (
              <DropdownMenuItem onClick={() => onGps(os)}>
                <Navigation className="w-4 h-4" /> Executar GPS
              </DropdownMenuItem>
            )}
            {(os.status === 'aprovado' || os.status === 'em_andamento') && (
              <DropdownMenuItem onClick={() => onPedido(os)}>
                <ShoppingCart className="w-4 h-4" /> Pedido de Compra
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onWhatsApp(os)}>
              <MessageCircle className="w-4 h-4 text-green-600" /> WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onLaudo(os)}>
              <FileBarChart className="w-4 h-4" /> Laudo Técnico
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditar(os)}>
              <Edit className="w-4 h-4" /> Editar
            </DropdownMenuItem>
            {os.status === 'concluido' && (
              <DropdownMenuItem onClick={() => onRetrabalho(os)}>
                <RotateCcw className="w-4 h-4" /> Abrir Retrabalho
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onExcluir(os)}>
              <Trash2 className="w-4 h-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}