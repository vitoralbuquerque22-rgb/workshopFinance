// Helpers da cadência de cobrança automática.

export const CANAIS_COBRANCA = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
];

export const FORMAS_COBRANCA = [
  { value: 'boleto', label: 'Boleto' },
  { value: 'promissoria', label: 'Promissória' },
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'dinheiro', label: 'Dinheiro' },
];

export const MOMENTOS = [
  { value: 'antes', label: 'Antes do vencimento' },
  { value: 'no_dia', label: 'No dia do vencimento' },
  { value: 'apos', label: 'Após vencer' },
];

export const VARIAVEIS_COBRANCA = ['{cliente}', '{valor}', '{vencimento}', '{os_numero}', '{oficina}', '{linha_digitavel}', '{pix}'];

// Passos padrão sugeridos ao criar uma régua nova.
export const PASSOS_PADRAO = [
  { ativo: true, momento: 'antes', dias: 1, canal: 'auto', texto: 'Olá {cliente}! Passando para lembrar que seu pagamento de {valor} (OS {os_numero}) vence amanhã, dia {vencimento}. Qualquer dúvida estou à disposição. 🙂' },
  { ativo: true, momento: 'no_dia', dias: 0, canal: 'auto', texto: 'Oi {cliente}! Seu pagamento de {valor} (OS {os_numero}) vence hoje, {vencimento}. Segue para facilitar. Obrigado!' },
  { ativo: true, momento: 'apos', dias: 3, canal: 'auto', texto: 'Olá {cliente}, notamos que o pagamento de {valor} (OS {os_numero}), vencido em {vencimento}, ainda consta em aberto. Pode nos ajudar a regularizar?' },
  { ativo: true, momento: 'apos', dias: 7, canal: 'auto', texto: 'Oi {cliente}! O valor de {valor} (OS {os_numero}) segue em aberto desde {vencimento}. Vamos resolver juntos? Estamos à disposição para negociar.' },
];

// Rótulo legível de um passo (ex: "1 dia antes", "No dia", "3 dias após").
export function rotuloPasso(passo) {
  if (passo.momento === 'no_dia') return 'No dia do vencimento';
  const dias = Number(passo.dias) || 0;
  const plural = dias === 1 ? 'dia' : 'dias';
  return passo.momento === 'antes' ? `${dias} ${plural} antes` : `${dias} ${plural} após`;
}