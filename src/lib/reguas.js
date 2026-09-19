// Metadados dos gatilhos (eventos) das réguas de automação.
// Cada régua agrupa vários TemplateMensagem pelo mesmo `evento`.

export const GATILHOS = [
  {
    evento: 'orcamento_enviado',
    label: 'Orçamento enviado',
    descricao: 'Follow-ups depois que o orçamento é enviado ao cliente.',
    cor: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    evento: 'so_perguntou',
    label: 'Só perguntou (não comprou)',
    descricao: 'Reengaja quem entrou em contato mas não virou OS.',
    cor: 'text-sky-600 bg-sky-50 border-sky-200',
  },
  {
    evento: 'os_finalizada',
    label: 'Serviço finalizado',
    descricao: 'Pós-venda: satisfação e lembrete de retorno.',
    cor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    evento: 'os_etapa',
    label: 'Mudança de etapa da OS',
    descricao: 'Dispara quando a OS chega a uma etapa específica.',
    cor: 'text-violet-600 bg-violet-50 border-violet-200',
  },
  {
    evento: 'lead_novo',
    label: 'Novo lead',
    descricao: 'Mensagens de boas-vindas para leads recém-criados.',
    cor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  {
    evento: 'lembrete_retorno',
    label: 'Lembrete de retorno',
    descricao: 'Convida o cliente a voltar após um período.',
    cor: 'text-rose-600 bg-rose-50 border-rose-200',
  },
];

export const gatilhoInfo = (evento) =>
  GATILHOS.find((g) => g.evento === evento) || { evento, label: evento, descricao: '', cor: 'text-slate-600 bg-slate-50 border-slate-200' };

// Atalhos de atraso oferecidos como botões (+1 dia, +7 dias, +30 dias...).
export const ATALHOS_ATRASO = [
  { valor: 0, unidade: 'minutos', label: 'Imediato' },
  { valor: 1, unidade: 'horas', label: '+1 hora' },
  { valor: 1, unidade: 'dias', label: '+1 dia' },
  { valor: 7, unidade: 'dias', label: '+7 dias' },
  { valor: 30, unidade: 'dias', label: '+30 dias' },
];

// Rótulo humano para o atraso de um passo.
export const atrasoLabel = (valor, unidade) => {
  const v = Number(valor) || 0;
  if (v === 0) return 'Imediato';
  const nomes = { minutos: v === 1 ? 'minuto' : 'minutos', horas: v === 1 ? 'hora' : 'horas', dias: v === 1 ? 'dia' : 'dias' };
  return `+${v} ${nomes[unidade] || unidade}`;
};

// Ordena passos pelo atraso convertido em minutos.
export const atrasoEmMinutos = (valor, unidade) => {
  const v = Number(valor) || 0;
  if (unidade === 'horas') return v * 60;
  if (unidade === 'dias') return v * 60 * 24;
  return v;
};