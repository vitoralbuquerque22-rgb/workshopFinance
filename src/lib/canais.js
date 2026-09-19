// Metadados dos canais de atendimento (Meta) e seus estados de conexão.

export const CANAIS_META = {
  whatsapp: {
    label: 'WhatsApp',
    cor: 'text-green-600',
    bg: 'bg-green-50',
    descricao: 'Atendimento via WhatsApp Business',
  },
  instagram: {
    label: 'Instagram',
    cor: 'text-pink-600',
    bg: 'bg-pink-50',
    descricao: 'Direct do Instagram Business',
  },
  messenger: {
    label: 'Messenger',
    cor: 'text-blue-600',
    bg: 'bg-blue-50',
    descricao: 'Mensagens da Página do Facebook',
  },
};

export const STATUS_CANAL = {
  desconectado: { label: 'Desconectado', cor: 'bg-slate-100 text-slate-600' },
  aguardando_qr: { label: 'Aguardando QR', cor: 'bg-amber-100 text-amber-700' },
  conectado: { label: 'Conectado', cor: 'bg-green-100 text-green-700' },
  erro: { label: 'Erro', cor: 'bg-red-100 text-red-700' },
  expirado: { label: 'Expirado', cor: 'bg-orange-100 text-orange-700' },
};

export const CANAIS_LISTA = ['whatsapp', 'instagram', 'messenger'];