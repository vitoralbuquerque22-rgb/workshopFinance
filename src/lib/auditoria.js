// Fase 6 — Auditorias: metadados compartilhados entre as telas
import { Hammer, Package, Boxes, HardHat, Wrench } from 'lucide-react';

export const TIPOS_AUDITORIA = [
  { value: 'ferramentas', label: 'Ferramentas', icon: Hammer },
  { value: 'pecas', label: 'Peças', icon: Package },
  { value: 'patrimonio', label: 'Patrimônio', icon: Boxes },
  { value: 'epis', label: 'EPIs', icon: HardHat },
  { value: 'equipamentos', label: 'Equipamentos', icon: Wrench },
];

export const STATUS_AUDITORIA = {
  aberta: { label: 'Aberta', cls: 'bg-blue-100 text-blue-700' },
  em_conferencia: { label: 'Em conferência', cls: 'bg-amber-100 text-amber-700' },
  aguardando_aprovacao: { label: 'Aguardando aprovação', cls: 'bg-indigo-100 text-indigo-700' },
  aprovada: { label: 'Aprovada', cls: 'bg-emerald-100 text-emerald-700' },
  reprovada: { label: 'Reprovada', cls: 'bg-red-100 text-red-700' },
};

export const SITUACAO_ITEM = {
  pendente: { label: 'Pendente', cls: 'bg-slate-100 text-slate-600' },
  ok: { label: 'OK', cls: 'bg-emerald-100 text-emerald-700' },
  divergente: { label: 'Divergente', cls: 'bg-amber-100 text-amber-700' },
  faltante: { label: 'Faltante', cls: 'bg-red-100 text-red-700' },
  danificado: { label: 'Danificado', cls: 'bg-orange-100 text-orange-700' },
};

export const tipoInfo = (t) => TIPOS_AUDITORIA.find((x) => x.value === t) || TIPOS_AUDITORIA[0];