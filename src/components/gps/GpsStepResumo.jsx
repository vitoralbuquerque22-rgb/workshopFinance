import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function GpsStepResumo({ atendimento, items, respostas, onFinalizar }) {
  const [loading, setLoading] = useState(false);
  const [analise, setAnalise] = useState(atendimento?.ai_analise || '');
  const [done, setDone] = useState(false);

  const gerarAnalise = async () => {
    setLoading(true);
    try {
      const resumoItens = items.map(item => {
        const r = respostas[item.id];
        if (!r) return null;
        let linha = `- [${item.tipo}] ${item.titulo}`;
        if (r.resposta) linha += ` → ${r.resposta}`;
        if (r.status) linha += ` → ${r.status}`;
        if (r.observacao) linha += ` (obs: ${r.observacao})`;
        if (r.valor_estimado) linha += ` (valor: R$ ${r.valor_estimado})`;
        if (r.prioridade) linha += ` (prioridade: ${r.prioridade})`;
        if (r.anexos?.length) linha += ` (${r.anexos.length} fotos/anexos)`;
        return linha;
      }).filter(Boolean).join('\n');

      const prompt = `Você é um consultor técnico e comercial sênior de oficina mecânica. Analise os dados do GPS de Venda (inspeção veicular) abaixo e gere um relatório completo e profissional.

VEÍCULO: placa ${atendimento.placa || 'N/A'}, km ${atendimento.quilometragem || 'N/A'}
COMBUSTÍVEL: ${atendimento.combustivel_nivel || 'N/A'}
CÓDIGOS DE FALHA: ${(atendimento.codigos_falha || []).join(', ') || 'Nenhum'}
OBSERVAÇÕES GERAIS: ${atendimento.observacoes_gerais || 'N/A'}

ITENS INSPECIONADOS:
${resumoItens}

Gere a análise em Markdown com as seguintes seções obrigatórias:
1. **Resumo do Veículo** — condição geral do veículo
2. **Resumo Técnico** — principais achados técnicos
3. **Resumo Comercial** — oportunidades de venda identificadas
4. **Riscos Encontrados** — o que pode piorar se não resolver
5. **Serviços Recomendados** — lista priorizada de serviços
6. **Argumentos de Venda** — como abordar o cliente sobre cada serviço
7. **Possíveis Objeções** — objeções esperadas e como contorná-las
8. **Prioridade de Execução** — ordem sugerida de execução
9. **Impacto caso não faça** — consequências de não realizar os reparos`;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'claude_sonnet_4_6',
      });
      setAnalise(typeof res === 'string' ? res : JSON.stringify(res));
    } catch (err) {
      setAnalise('Erro ao gerar análise: ' + (err.message || 'desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/30">
        <CardContent className="p-5 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">A IA analisará todas as respostas, fotos e observações, gerando um relatório completo com oportunidades, riscos e argumentos de venda.</p>
          <Button onClick={gerarAnalise} disabled={loading} className="w-full" size="lg">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Gerando análise...</> : <><Sparkles className="h-5 w-5" /> Gerar Análise com IA</>}
          </Button>
        </CardContent>
      </Card>

      {analise && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Análise da IA</CardTitle></CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{analise}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={() => { setDone(true); onFinalizar(analise); }} disabled={!analise || done} className="w-full" size="lg">
        <CheckCircle2 className="h-5 w-5" /> {done ? 'Atendimento Finalizado!' : 'Finalizar Atendimento'}
      </Button>
    </div>
  );
}