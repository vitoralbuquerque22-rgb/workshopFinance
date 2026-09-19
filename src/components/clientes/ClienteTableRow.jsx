import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import StatusBadge from '@/components/StatusBadge';
import GpsHistoricoCliente from '@/components/gps/GpsHistoricoCliente';
import { formatCurrency } from '@/lib/format';
import {
  User, Car, Phone, Edit, Trash2, MoreHorizontal, Eye, MessageCircle, Wrench, CalendarClock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const fmtData = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : null;
const fmtDataHora = (d) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : null;

export default function ClienteTableRow({
  cliente, stats, veiculos, ordensVeiculo, ultimoServico, proximoContato, isExpanded,
  onToggle, onEditar, onExcluir, onNovoVeiculo, onEditarVeiculo, onExcluirVeiculo, onWhatsApp,
}) {
  const principal = veiculos[0];
  const telefone = cliente.celular || cliente.telefone;

  return (
    <Fragment>
      <tr className="border-b border-border hover:bg-muted/40 transition-colors align-top">
        {/* Cliente + telefone */}
        <td className="px-2 py-2">
          <div className="flex items-start gap-2">
            <button onClick={onToggle} className="mt-0.5 flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary shrink-0" title="Ver veículos">
              <User className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-sm truncate">{cliente.nome}</span>
                <StatusBadge status={cliente.status} />
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{cliente.tipo_pessoa === 'fisica' ? 'PF' : 'PJ'}</span>
              </div>
              {telefone ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Phone className="w-3 h-3" />{telefone}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground/60 mt-0.5 block">Sem telefone</span>
              )}
            </div>
          </div>
        </td>

        {/* Veículo */}
        <td className="px-2 py-2">
          {principal ? (
            <div className="text-xs">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Car className="w-3 h-3 text-primary" />{principal.marca} {principal.modelo}
              </span>
              <span className="text-muted-foreground uppercase">{principal.placa || 'sem placa'}</span>
              {veiculos.length > 1 && <span className="text-muted-foreground"> · +{veiculos.length - 1}</span>}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/60">—</span>
          )}
        </td>

        {/* Ticket médio */}
        <td className="px-2 py-2 text-right">
          {stats.totalOs > 0 ? (
            <div className="text-xs">
              <span className="font-medium text-foreground">{formatCurrency(stats.ticketMedio)}</span>
              <span className="block text-muted-foreground">{stats.totalOs} OS</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/60">0 OS</span>
          )}
        </td>

        {/* Último serviço */}
        <td className="px-2 py-2">
          {ultimoServico ? (
            <div className="text-xs">
              <span className="flex items-center gap-1 text-foreground"><Wrench className="w-3 h-3 text-muted-foreground" />{fmtData(ultimoServico.data)}</span>
              {ultimoServico.numero && <span className="text-muted-foreground">{ultimoServico.numero}</span>}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/60">—</span>
          )}
        </td>

        {/* Próximo contato */}
        <td className="px-2 py-2">
          {proximoContato ? (
            <div className="text-xs">
              <span className="flex items-center gap-1 text-amber-600 font-medium"><CalendarClock className="w-3 h-3" />{fmtDataHora(proximoContato.data_agendada)}</span>
              {proximoContato.titulo && <span className="text-muted-foreground truncate block max-w-[140px]">{proximoContato.titulo}</span>}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/60">—</span>
          )}
        </td>

        {/* Ações */}
        <td className="px-2 py-2 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onToggle}>
                <Eye className="w-4 h-4" /> {isExpanded ? 'Ocultar veículos' : 'Ver mais detalhes'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onWhatsApp(cliente)}>
                <MessageCircle className="w-4 h-4 text-green-600" /> WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNovoVeiculo(cliente)}>
                <Car className="w-4 h-4" /> Adicionar veículo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEditar(cliente)}>
                <Edit className="w-4 h-4" /> Editar cliente
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onExcluir(cliente)}>
                <Trash2 className="w-4 h-4" /> Excluir cliente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>

      {isExpanded && (
        <tr className="border-b border-border bg-muted/30">
          <td colSpan={6} className="px-4 py-3">
            {veiculos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Nenhum veículo cadastrado</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {veiculos.map(v => {
                  const vOrdens = ordensVeiculo(v.id);
                  return (
                    <div key={v.id} className="bg-background border border-border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{v.marca} {v.modelo}</p>
                            <p className="text-xs text-muted-foreground">{v.placa} · {v.ano || 'S/Ano'} · {v.cor || 'S/Cor'}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEditarVeiculo(v)}><Edit className="w-3.5 h-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onExcluirVeiculo(v.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{v.quilometragem?.toLocaleString('pt-BR') || 0} km</span>
                        <span>·</span>
                        <span>{vOrdens.length} OS</span>
                        <Link to={`/ordens-servico?veiculo=${v.id}`} className="text-primary hover:underline ml-auto">Ver OS →</Link>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <GpsHistoricoCliente clienteId={cliente.id} veiculoId={v.id} placa={v.placa} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </td>
        </tr>
      )}
    </Fragment>
  );
}