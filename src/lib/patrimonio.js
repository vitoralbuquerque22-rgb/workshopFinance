// Lógica compartilhada dos Cadastros Base do Pátio (Patrimônio e Frota)
import { base44 } from '@/api/base44Client';

// Gera o próximo código patrimonial sequencial com prefixo (PAT / FRT)
export async function gerarCodigoPatrimonial(entidade, prefixo) {
  const registros = await entidade.list('-created_date', 500);
  let maior = 0;
  for (const r of registros) {
    const m = String(r.codigo_patrimonial || '').match(/(\d+)\s*$/);
    if (m) maior = Math.max(maior, parseInt(m[1], 10));
  }
  const proximo = String(maior + 1).padStart(6, '0');
  return `${prefixo}-${proximo}`;
}

// Depreciação linear acumulada e valor contábil atual
export function depreciacao(item) {
  const valor = Number(item.valor_compra) || 0;
  const residual = Number(item.valor_residual) || 0;
  const vidaUtil = Number(item.vida_util_meses) || 0;
  if (!valor || !vidaUtil || !item.data_compra) {
    return { mesesDecorridos: 0, depreciado: 0, valorAtual: valor };
  }
  const inicio = new Date(item.data_compra);
  const agora = new Date();
  const meses = Math.max(0, Math.min(vidaUtil,
    (agora.getFullYear() - inicio.getFullYear()) * 12 + (agora.getMonth() - inicio.getMonth())));
  const depreciavel = Math.max(0, valor - residual);
  const depreciado = Math.round((depreciavel / vidaUtil) * meses * 100) / 100;
  return {
    mesesDecorridos: meses,
    depreciado,
    valorAtual: Math.round((valor - depreciado) * 100) / 100,
  };
}

// Calcula a próxima manutenção preventiva a partir da última + intervalo em dias
export function proximaManutencao(mp) {
  if (!mp?.ativa || !mp.intervalo_dias || !mp.ultima_em) return null;
  const d = new Date(mp.ultima_em);
  d.setDate(d.getDate() + Number(mp.intervalo_dias));
  return d.toISOString().slice(0, 10);
}

// Status da manutenção preventiva: vencida, proxima (<=7d) ou em dia
export function statusManutencao(item) {
  const proxima = item?.manutencao_preventiva?.proxima_em;
  if (!proxima) return null;
  const dias = Math.ceil((new Date(proxima) - new Date()) / 86400000);
  if (dias < 0) return { tone: 'danger', label: `Vencida há ${Math.abs(dias)}d`, dias };
  if (dias <= 7) return { tone: 'warning', label: `Vence em ${dias}d`, dias };
  return { tone: 'ok', label: `Em dia (${dias}d)`, dias };
}

export function novoEventoHistorico(tipo, descricao, usuario, extra = {}) {
  return { tipo, descricao, usuario: usuario || 'Sistema', data: new Date().toISOString(), ...extra };
}

export const TIPOS_PATRIMONIO = [
  { value: 'ferramenta', label: 'Ferramenta' },
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'maquina', label: 'Máquina' },
  { value: 'notebook', label: 'Notebook' },
  { value: 'scanner', label: 'Scanner' },
  { value: 'epi', label: 'EPI' },
  { value: 'mobiliario', label: 'Mobiliário' },
  { value: 'outro', label: 'Outro' },
];

export const TIPOS_FROTA = [
  { value: 'veiculo', label: 'Veículo' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'moto', label: 'Moto' },
  { value: 'van', label: 'Van' },
  { value: 'guincho', label: 'Guincho' },
  { value: 'empilhadeira', label: 'Empilhadeira' },
  { value: 'reboque', label: 'Reboque' },
  { value: 'carrinho', label: 'Carrinho' },
  { value: 'outro', label: 'Outro' },
];

export const STATUS_PATRIMONIO = {
  ativo: { label: 'Ativo', cls: 'bg-emerald-100 text-emerald-700' },
  em_manutencao: { label: 'Em manutenção', cls: 'bg-amber-100 text-amber-700' },
  emprestado: { label: 'Emprestado', cls: 'bg-blue-100 text-blue-700' },
  baixado: { label: 'Baixado', cls: 'bg-slate-200 text-slate-600' },
  extraviado: { label: 'Extraviado', cls: 'bg-red-100 text-red-700' },
};

export const STATUS_FROTA = {
  disponivel: { label: 'Disponível', cls: 'bg-emerald-100 text-emerald-700' },
  em_uso: { label: 'Em uso', cls: 'bg-blue-100 text-blue-700' },
  em_manutencao: { label: 'Em manutenção', cls: 'bg-amber-100 text-amber-700' },
  baixado: { label: 'Baixado', cls: 'bg-slate-200 text-slate-600' },
};

// Carrega colaboradores e fornecedores para os selects (usado nos forms)
export async function carregarApoio() {
  const [colaboradores, fornecedores] = await Promise.all([
    base44.entities.Colaborador.filter({ status: 'ativo' }, 'nome', 500).catch(() => []),
    base44.entities.Fornecedor.list('-created_date', 500).catch(() => []),
  ]);
  return { colaboradores, fornecedores };
}