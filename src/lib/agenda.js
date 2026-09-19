// Lógica compartilhada da Agenda Operacional — Fase 7
import { base44 } from '@/api/base44Client';

export const STATUS_TAREFA = {
  pendente: { label: 'Pendente', cls: 'bg-slate-100 text-slate-700' },
  em_andamento: { label: 'Em andamento', cls: 'bg-amber-100 text-amber-700' },
  concluida: { label: 'Concluída', cls: 'bg-emerald-100 text-emerald-700' },
  cancelada: { label: 'Cancelada', cls: 'bg-slate-200 text-slate-500' },
};

export const PRIORIDADE_TAREFA = {
  baixa: { label: 'Baixa', cls: 'bg-slate-100 text-slate-600' },
  media: { label: 'Média', cls: 'bg-blue-100 text-blue-700' },
  alta: { label: 'Alta', cls: 'bg-red-100 text-red-700' },
};

export const TIPO_TAREFA = [
  { value: 'tarefa', label: 'Tarefa' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'inspecao', label: 'Inspeção' },
  { value: 'vencimento', label: 'Vencimento' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'outro', label: 'Outro' },
];

export const TIPO_OCORRENCIA = [
  { value: 'incidente', label: 'Incidente' },
  { value: 'atraso', label: 'Atraso' },
  { value: 'falha_equipamento', label: 'Falha de equipamento' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'qualidade', label: 'Qualidade' },
  { value: 'reclamacao', label: 'Reclamação' },
  { value: 'outro', label: 'Outro' },
];

export const GRAVIDADE_OCORRENCIA = {
  baixa: { label: 'Baixa', cls: 'bg-slate-100 text-slate-600' },
  media: { label: 'Média', cls: 'bg-blue-100 text-blue-700' },
  alta: { label: 'Alta', cls: 'bg-amber-100 text-amber-700' },
  critica: { label: 'Crítica', cls: 'bg-red-100 text-red-700' },
};

export const STATUS_OCORRENCIA = {
  aberta: { label: 'Aberta', cls: 'bg-red-100 text-red-700' },
  em_tratamento: { label: 'Em tratamento', cls: 'bg-amber-100 text-amber-700' },
  resolvida: { label: 'Resolvida', cls: 'bg-emerald-100 text-emerald-700' },
  cancelada: { label: 'Cancelada', cls: 'bg-slate-200 text-slate-500' },
};

export const FREQUENCIAS = [
  { value: 'diaria', label: 'Diária' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
];

export const DIAS_SEMANA = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

// Trabalha datas como YYYY-MM-DD (sem fuso) para evitar deslocamentos
export function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDiasISO(iso, dias) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + dias);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function addMesesISO(iso, meses) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1 + meses, d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

// Calcula a próxima data de geração a partir de uma data base + config de recorrência
export function proximaData(baseISO, rec) {
  const intervalo = Math.max(1, Number(rec?.intervalo) || 1);
  switch (rec?.frequencia) {
    case 'diaria':
      return addDiasISO(baseISO, intervalo);
    case 'semanal':
      return addDiasISO(baseISO, 7 * intervalo);
    case 'quinzenal':
      return addDiasISO(baseISO, 14 * intervalo);
    case 'mensal':
      return addMesesISO(baseISO, intervalo);
    default:
      return addDiasISO(baseISO, 7);
  }
}

// Gera número sequencial OCO-000045
export async function gerarNumeroOcorrencia() {
  const registros = await base44.entities.Ocorrencia.list('-created_date', 500).catch(() => []);
  let maior = 0;
  for (const r of registros) {
    const m = String(r.numero || '').match(/(\d+)\s*$/);
    if (m) maior = Math.max(maior, parseInt(m[1], 10));
  }
  return `OCO-${String(maior + 1).padStart(6, '0')}`;
}

export function labelFrequencia(rec) {
  if (!rec?.ativa) return 'Sem recorrência';
  const f = FREQUENCIAS.find((x) => x.value === rec.frequencia)?.label || rec.frequencia;
  const n = Number(rec.intervalo) || 1;
  return n > 1 ? `${f} (a cada ${n})` : f;
}

// Formata YYYY-MM-DD como dd/mm/aaaa sem deslocamento de fuso
export function formatarDataISO(iso) {
  if (!iso) return '-';
  const [y, m, d] = String(iso).split('-');
  if (!y || !m || !d) return '-';
  return `${d}/${m}/${y}`;
}

export function checklistProgresso(checklist) {
  const itens = checklist || [];
  const feitos = itens.filter((i) => i.concluido).length;
  return { feitos, total: itens.length, pct: itens.length ? Math.round((feitos / itens.length) * 100) : 0 };
}