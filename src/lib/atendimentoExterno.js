// Lógica compartilhada do Atendimento Externo (MissaoOperacional) — Fases 4 e 5
import { base44 } from '@/api/base44Client';

export const STATUS_MISSAO = {
  agendado: { label: 'Agendado', cls: 'bg-blue-100 text-blue-700' },
  em_deslocamento: { label: 'Em deslocamento', cls: 'bg-amber-100 text-amber-700' },
  em_execucao: { label: 'Em execução', cls: 'bg-indigo-100 text-indigo-700' },
  concluido: { label: 'Concluído', cls: 'bg-emerald-100 text-emerald-700' },
  cancelado: { label: 'Cancelado', cls: 'bg-slate-200 text-slate-600' },
};

export const PAPEIS_EQUIPE = [
  { value: 'responsavel', label: 'Responsável' },
  { value: 'auxiliar', label: 'Auxiliar' },
  { value: 'motorista', label: 'Motorista' },
];

// Marcos de presença (Fase 5) — cada botão avança o status e grava geo + timestamp
export const MARCOS = [
  { key: 'saida', campo: 'saida_em', geo: 'saida', label: 'Iniciar deslocamento', status: 'em_deslocamento', requerAnterior: null },
  { key: 'chegada', campo: 'chegada_em', geo: 'chegada', label: 'Chegada ao cliente', status: 'em_deslocamento', requerAnterior: 'saida_em' },
  { key: 'inicio', campo: 'inicio_em', geo: 'inicio', label: 'Iniciar atendimento', status: 'em_execucao', requerAnterior: 'chegada_em' },
  { key: 'fim', campo: 'fim_em', geo: 'fim', label: 'Finalizar atendimento', status: 'em_execucao', requerAnterior: 'inicio_em' },
  { key: 'retorno', campo: 'retorno_em', geo: 'retorno', label: 'Retorno à oficina', status: 'concluido', requerAnterior: 'fim_em' },
];

// Gera número sequencial AE-000045
export async function gerarNumeroMissao() {
  const registros = await base44.entities.MissaoOperacional.list('-created_date', 500);
  let maior = 0;
  for (const r of registros) {
    const m = String(r.numero || '').match(/(\d+)\s*$/);
    if (m) maior = Math.max(maior, parseInt(m[1], 10));
  }
  return `AE-${String(maior + 1).padStart(6, '0')}`;
}

export function novoEvento(tipo, descricao, usuario) {
  return { tipo, descricao, usuario: usuario || 'Sistema', data: new Date().toISOString() };
}

// Captura a posição atual do navegador (Promise). Retorna null se indisponível/negado.
export function capturarPosicao() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, registrado_em: new Date().toISOString() }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}

const diffMin = (a, b) => (a && b ? Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000)) : 0);

// Recalcula os tempos derivados a partir dos marcos
export function calcularTempos(m) {
  return {
    tempo_deslocamento_min: diffMin(m.saida_em, m.chegada_em),
    tempo_atendimento_min: diffMin(m.inicio_em, m.fim_em),
    tempo_total_min: diffMin(m.saida_em, m.retorno_em),
  };
}

export function formatarMinutos(min) {
  const n = Number(min) || 0;
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const r = n % 60;
  return r ? `${h}h ${r}min` : `${h}h`;
}

// Carrega dados de apoio para os selects do formulário
export async function carregarApoioMissao() {
  const [colaboradores, frota, ferramentas, pecas, clientes, veiculos] = await Promise.all([
    base44.entities.Colaborador.filter({ status: 'ativo' }, 'nome', 500).catch(() => []),
    base44.entities.AtivoOperacional.list('-created_date', 500).catch(() => []),
    base44.entities.Patrimonio.filter({ tipo: 'ferramenta' }, 'nome', 500).catch(() => []),
    base44.entities.Peca.list('-created_date', 1000).catch(() => []),
    base44.entities.Cliente.list('-created_date', 1000).catch(() => []),
    base44.entities.Veiculo.list('-created_date', 1000).catch(() => []),
  ]);
  return { colaboradores, frota, ferramentas, pecas, clientes, veiculos };
}