// Utilitários para abrir o WhatsApp com mensagem pronta.

// Normaliza telefone BR para o formato aceito pelo wa.me (somente dígitos, com DDI 55).
export function normalizarTelefone(telefone) {
  if (!telefone) return '';
  let d = String(telefone).replace(/\D/g, '');
  if (!d) return '';
  // remove zeros à esquerda
  d = d.replace(/^0+/, '');
  // se não começar com 55 e tiver DDD+numero (10 ou 11 dígitos), adiciona DDI Brasil
  if (!d.startsWith('55') && (d.length === 10 || d.length === 11)) {
    d = '55' + d;
  }
  return d;
}

export function linkWhatsApp(telefone, mensagem = '') {
  const num = normalizarTelefone(telefone);
  const texto = encodeURIComponent(mensagem);
  if (num) return `https://wa.me/${num}?text=${texto}`;
  // sem número: abre o WhatsApp deixando o usuário escolher o contato
  return `https://wa.me/?text=${texto}`;
}

export function abrirWhatsApp(telefone, mensagem = '') {
  window.open(linkWhatsApp(telefone, mensagem), '_blank');
}

// Modelos de mensagem prontos para a oficina.
export const MODELOS_WHATSAPP = [
  {
    key: 'orcamento_pronto',
    label: 'Orçamento pronto',
    build: ({ clienteNome, osNumero, veiculo, valor }) =>
      `Olá${clienteNome ? ` ${clienteNome}` : ''}! 👋\n\nO orçamento${osNumero ? ` da OS ${osNumero}` : ''}${veiculo ? ` para o seu ${veiculo}` : ''} está pronto${valor ? ` no valor de ${valor}` : ''}.\n\nPodemos seguir com o serviço? Qualquer dúvida, estou à disposição. 🔧`,
  },
  {
    key: 'aprovacao',
    label: 'Pedir aprovação',
    build: ({ clienteNome, osNumero, veiculo, valor }) =>
      `Olá${clienteNome ? ` ${clienteNome}` : ''}! Sobre o seu ${veiculo || 'veículo'}${osNumero ? ` (OS ${osNumero})` : ''}: aguardamos a sua aprovação${valor ? ` do orçamento de ${valor}` : ''} para iniciarmos os reparos. 😊`,
  },
  {
    key: 'em_andamento',
    label: 'Serviço em andamento',
    build: ({ clienteNome, veiculo }) =>
      `Oi${clienteNome ? ` ${clienteNome}` : ''}! Passando para avisar que o serviço no seu ${veiculo || 'veículo'} já está em andamento. Em breve trazemos novidades! 🔧`,
  },
  {
    key: 'pronto_retirada',
    label: 'Pronto para retirada',
    build: ({ clienteNome, veiculo, osNumero }) =>
      `Boa notícia${clienteNome ? `, ${clienteNome}` : ''}! ✅\n\nO seu ${veiculo || 'veículo'}${osNumero ? ` (OS ${osNumero})` : ''} está pronto e pode ser retirado. Estamos te esperando! 🚗`,
  },
  {
    key: 'pos_venda',
    label: 'Pós-venda',
    build: ({ clienteNome, veiculo }) =>
      `Olá${clienteNome ? ` ${clienteNome}` : ''}! Tudo certo com o seu ${veiculo || 'veículo'} após o serviço? A sua opinião é muito importante para nós. Obrigado pela confiança! 🙏`,
  },
];