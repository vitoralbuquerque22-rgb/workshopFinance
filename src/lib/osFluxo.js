import { Inbox, Stethoscope, FileText, ThumbsUp, ShoppingCart, Hammer, ShieldCheck, FileClock, Receipt, CreditCard, PackageCheck, PhoneCall } from 'lucide-react';

export const etapasFluxo = [
  { key: 'recepcao', label: 'Recepção', icon: Inbox },
  { key: 'diagnostico', label: 'Diagnóstico', icon: Stethoscope },
  { key: 'orcamento', label: 'Orçamento', icon: FileText },
  { key: 'aprovacao', label: 'Aprovação', icon: ThumbsUp },
  { key: 'compra', label: 'Compra', icon: ShoppingCart },
  { key: 'execucao', label: 'Execução', icon: Hammer },
  { key: 'qualidade', label: 'Controle Qualidade', icon: ShieldCheck },
  { key: 'aguardando_faturamento', label: 'Aguardando Faturamento', icon: FileClock },
  { key: 'nota_emitida', label: 'Nota Emitida', icon: Receipt },
  { key: 'pagamento', label: 'Pagamento', icon: CreditCard },
  { key: 'entrega', label: 'Entrega', icon: PackageCheck },
  { key: 'pos_venda', label: 'Pós-venda', icon: PhoneCall },
];

export const etapaIndex = (key) => etapasFluxo.findIndex((e) => e.key === key);
export const etapaFluxoLabel = (key) => etapasFluxo.find((e) => e.key === key)?.label || key;