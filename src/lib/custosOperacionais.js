// Fase 8 — Custos Operacionais da operação externa (MissaoOperacional)
import { base44 } from '@/api/base44Client';

// Calcula os custos de uma missão a partir da configuração de custos vigente.
// Puro (sem I/O) — recebe a missão e a config já carregada.
export function calcularCustosMissao(missao, config) {
  const cfg = config || {};
  const km = Number(missao.km_percorrido) || 0;
  const horas = (Number(missao.tempo_atendimento_min) || 0) / 60;
  const pessoas = Math.max(1, (missao.equipe || []).length);

  const custo_km = round2(km * (Number(cfg.valor_km) || 0));
  const custo_horas = round2(horas * (Number(cfg.valor_hora) || 0) * pessoas);
  const custo_pecas = round2((missao.pecas || []).reduce(
    (s, p) => s + (Number(p.custo_unitario) || 0) * (Number(p.quantidade) || 0), 0));
  const pedagio = Number(missao.custos?.pedagio ?? cfg.valor_pedagio) || 0;
  const alimentacao = Number(missao.custos?.alimentacao ?? cfg.valor_alimentacao) || 0;
  const hospedagem = Number(missao.custos?.hospedagem ?? cfg.valor_hospedagem) || 0;

  const custo_total = round2(custo_km + custo_horas + custo_pecas + pedagio + alimentacao + hospedagem);

  const receita_pecas = (missao.pecas || []).reduce(
    (s, p) => s + (Number(p.valor_unitario) || 0) * (Number(p.quantidade) || 0), 0);
  const receita = round2((Number(missao.valor_servico) || 0) + receita_pecas);

  const rentabilidade = round2(receita - custo_total);
  const margem = receita > 0 ? round2((rentabilidade / receita) * 100) : 0;

  return { custo_km, custo_horas, custo_pecas, pedagio, alimentacao, hospedagem, custo_total, receita, rentabilidade, margem };
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

// Carrega a config de custos vigente (filial > global). Retorna null se nenhuma.
export async function carregarConfigCusto(filialId) {
  const todas = await base44.entities.ConfigCustoOperacional.list('-created_date', 50).catch(() => []);
  if (filialId) {
    const daFilial = todas.find((c) => c.filial_id === filialId && c.ativo !== false);
    if (daFilial) return daFilial;
  }
  return todas.find((c) => !c.filial_id && c.ativo !== false) || todas[0] || null;
}

export const corMargem = (m) => {
  const v = Number(m) || 0;
  if (v >= 30) return 'text-emerald-600';
  if (v >= 15) return 'text-amber-600';
  return 'text-red-600';
};

export const bgMargem = (m) => {
  const v = Number(m) || 0;
  if (v >= 30) return 'bg-emerald-100 text-emerald-700';
  if (v >= 15) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};