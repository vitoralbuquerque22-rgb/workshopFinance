const statusConfig = {
  pendente: { label: 'Pendente', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  pago: { label: 'Pago', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  recebido: { label: 'Recebido', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelado: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200' },
  aberto: { label: 'Aberto', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  fechado: { label: 'Fechado', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  ativo: { label: 'Ativo', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inativo: { label: 'Inativo', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  suspenso: { label: 'Suspenso', className: 'bg-red-50 text-red-700 border-red-200' },
  processada: { label: 'Processada', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  aguardando_conferencia: { label: 'Aguardando Conferência', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  erro: { label: 'Erro', className: 'bg-red-50 text-red-700 border-red-200' },
  duplicada: { label: 'Duplicada', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  orcamento: { label: 'Orçamento', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  aprovado: { label: 'Aprovado', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  em_andamento: { label: 'Em Andamento', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  concluido: { label: 'Concluído', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  aguardando_faturamento: { label: 'Aguardando Faturamento', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  nota_emitida: { label: 'Nota Emitida', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  autorizada: { label: 'Autorizada', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelada: { label: 'Cancelada', className: 'bg-red-50 text-red-700 border-red-200' },
  rascunho: { label: 'Rascunho', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  enviado: { label: 'Enviado', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  sucesso: { label: 'Sucesso', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  parcial: { label: 'Parcial', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  ativa: { label: 'Ativa', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inativa: { label: 'Inativa', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  solicitada: { label: 'Solicitada', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  em_cotacao: { label: 'Em Cotação', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  cotada: { label: 'Cotada', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  aprovada: { label: 'Aprovada', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  reprovada: { label: 'Reprovada', className: 'bg-red-50 text-red-700 border-red-200' },
  convertida: { label: 'Convertida', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  aberta: { label: 'Aberta', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  respondida: { label: 'Respondida', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  recebido_parcial: { label: 'Recebido Parcial', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  backorder: { label: 'Backorder', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  // Elevadores / boxes (produção)
  livre: { label: 'Livre', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ocupado: { label: 'Ocupado', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  manutencao: { label: 'Manutenção', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  // CRM / Leads
  novo: { label: 'Novo', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  em_contato: { label: 'Em Contato', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  negociacao: { label: 'Negociação', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  ganho: { label: 'Ganho', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  perdido: { label: 'Perdido', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  visitou: { label: 'Visitou', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  convertido: { label: 'Convertido', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  // Inventário
  em_contagem: { label: 'Em Contagem', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  finalizado: { label: 'Finalizado', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  // Lotes
  esgotado: { label: 'Esgotado', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  vencido: { label: 'Vencido', className: 'bg-red-50 text-red-700 border-red-200' },
  bloqueado: { label: 'Bloqueado', className: 'bg-orange-50 text-orange-700 border-orange-200' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}