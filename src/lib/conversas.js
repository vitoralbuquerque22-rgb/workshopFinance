import { MessageCircle, Instagram, Mail, Globe, Send, Phone, Building2, MessageSquare } from 'lucide-react';

// Metadados de canal (ícone + rótulo + cor)
export const CANAIS = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-100' },
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-100' },
  messenger: { label: 'Messenger', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100' },
  email: { label: 'E-mail', icon: Mail, color: 'text-amber-600', bg: 'bg-amber-100' },
  site: { label: 'Chat do site', icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  telegram: { label: 'Telegram', icon: Send, color: 'text-sky-600', bg: 'bg-sky-100' },
  sms: { label: 'SMS', icon: Phone, color: 'text-slate-600', bg: 'bg-slate-100' },
  google_business: { label: 'Google', icon: Building2, color: 'text-red-600', bg: 'bg-red-100' },
  interno: { label: 'Interno', icon: MessageCircle, color: 'text-slate-600', bg: 'bg-slate-100' },
};

export const canalInfo = (canal) => CANAIS[canal] || CANAIS.interno;

export const STATUS_CONVERSA = {
  aberta: { label: 'Aberta', color: 'text-emerald-700 bg-emerald-100' },
  aguardando_cliente: { label: 'Aguard. cliente', color: 'text-blue-700 bg-blue-100' },
  aguardando_consultor: { label: 'Aguard. você', color: 'text-amber-700 bg-amber-100' },
  resolvida: { label: 'Resolvida', color: 'text-slate-700 bg-slate-100' },
  arquivada: { label: 'Arquivada', color: 'text-slate-500 bg-slate-100' },
};

export const IDENTIFICACAO = {
  identificado: { label: 'Cliente identificado', color: 'text-emerald-700 bg-emerald-100' },
  lead_criado: { label: 'Novo lead', color: 'text-violet-700 bg-violet-100' },
  nao_identificado: { label: 'Não identificado', color: 'text-slate-600 bg-slate-100' },
};

// "há 5 min", "há 2 h", "ontem", data
export function tempoRelativo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias === 1) return 'ontem';
  if (dias < 7) return `há ${dias} d`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function horaCurta(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}