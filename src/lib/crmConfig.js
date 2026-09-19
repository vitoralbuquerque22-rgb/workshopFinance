import { MessageCircle, Mail, Phone, CheckSquare, StickyNote, CalendarClock } from 'lucide-react';

export const etapas = [
  { key: 'novo', label: 'Novo', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { key: 'em_contato', label: 'Em Contato', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'negociacao', label: 'Negociação', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'ganho', label: 'Ganho', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'perdido', label: 'Perdido', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export const etapaLabel = (key) => etapas.find((e) => e.key === key)?.label || key;

export const origens = {
  gps_vendas: 'GPS de Vendas',
  manual: 'Manual',
  indicacao: 'Indicação',
  whatsapp: 'WhatsApp',
  telefone: 'Telefone',
  site: 'Site',
  passagem: 'Passagem',
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  instagram: 'Instagram',
  formulario: 'Formulário',
  landing_page: 'Landing Page',
};

export const motivosPerda = {
  preco: 'Preço',
  prazo: 'Prazo',
  concorrencia: 'Concorrência',
  desistiu: 'Desistiu',
  sem_retorno: 'Sem retorno',
  outro: 'Outro',
};

export const tiposAtividade = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600' },
  email: { label: 'E-mail', icon: Mail, color: 'text-blue-600' },
  ligacao: { label: 'Ligação', icon: Phone, color: 'text-indigo-600' },
  tarefa: { label: 'Tarefa', icon: CheckSquare, color: 'text-amber-600' },
  nota: { label: 'Nota', icon: StickyNote, color: 'text-slate-600' },
  reuniao: { label: 'Reunião', icon: CalendarClock, color: 'text-purple-600' },
};