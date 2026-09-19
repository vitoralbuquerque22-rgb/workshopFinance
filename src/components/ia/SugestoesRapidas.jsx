import { Stethoscope, FileText, TrendingUp, MessageCircle, Package, Megaphone, Search, Sparkles } from 'lucide-react';

export const SUGESTOES = [
  { icon: Stethoscope, label: 'Criar diagnóstico', prompt: 'Preciso de um diagnóstico técnico. O cliente relata: ' },
  { icon: FileText, label: 'Montar orçamento', prompt: 'Monte um orçamento estimado para o seguinte serviço: ' },
  { icon: Search, label: 'Analisar uma OS', prompt: 'Analise a ordem de serviço número ' },
  { icon: TrendingUp, label: 'Previsão de faturamento', prompt: 'Faça uma previsão de faturamento para os próximos 3 meses com base no histórico da oficina.' },
  { icon: Package, label: 'Previsão de estoque', prompt: 'Analise o estoque atual e sugira quais peças preciso comprar para não faltar.' },
  { icon: MessageCircle, label: 'Mensagem de WhatsApp', prompt: 'Gere uma mensagem de WhatsApp cordial para avisar o cliente que o carro está pronto.' },
  { icon: Megaphone, label: 'Criar campanha', prompt: 'Crie uma campanha de marketing para atrair clientes para revisão de fim de ano.' },
  { icon: Sparkles, label: 'Sugerir vendas', prompt: 'Analise o histórico dos clientes e sugira oportunidades de venda adicional.' },
];

export default function SugestoesRapidas({ onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto">
      {SUGESTOES.map((s) => (
        <button
          key={s.label}
          onClick={() => onSelect(s.prompt)}
          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary hover:bg-accent transition-colors text-left"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
            <s.icon className="w-4.5 h-4.5" />
          </div>
          <span className="text-sm font-medium">{s.label}</span>
        </button>
      ))}
    </div>
  );
}