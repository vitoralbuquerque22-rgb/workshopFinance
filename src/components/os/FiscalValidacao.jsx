import { AlertTriangle, XCircle, CheckCircle2, Sparkles } from 'lucide-react';

const CATEGORIA_LABEL = {
  campo_obrigatorio: 'Campo obrigatório',
  cadastro: 'Cadastro',
  cpf_cnpj: 'CPF/CNPJ',
  cfop: 'CFOP',
  cst: 'CST',
  aliquota: 'Alíquota',
  tributacao: 'Tributação',
};

export default function FiscalValidacao({ resultado }) {
  if (!resultado) return null;
  const { apto, resumo, alertas = [] } = resultado;

  if (apto && alertas.length === 0) {
    return (
      <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Assistente Fiscal: tudo certo</p>
          <p className="text-xs mt-0.5">{resumo || 'Nenhuma inconsistência encontrada. A nota está pronta para emissão.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${apto ? 'bg-amber-50 border border-amber-200 text-amber-800' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
        {apto ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
        <div>
          <p className="font-medium flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Assistente Fiscal encontrou {alertas.length} ponto(s)</p>
          <p className="text-xs mt-0.5">{apto ? 'Há avisos recomendáveis, mas a emissão é permitida.' : 'Há erros que impedem uma emissão segura. Corrija antes de continuar.'}</p>
        </div>
      </div>

      <div className="space-y-2">
        {alertas.map((a, i) => {
          const erro = a.severidade === 'erro';
          return (
            <div key={i} className={`rounded-lg border p-3 text-sm ${erro ? 'border-rose-200 bg-rose-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
              <div className="flex items-center gap-2">
                {erro ? <XCircle className="w-4 h-4 text-rose-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                <span className="font-medium text-foreground">{a.titulo}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${erro ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                  {CATEGORIA_LABEL[a.campo] || a.campo}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{a.descricao}</p>
              {a.sugestao && <p className="text-xs text-primary mt-1"><strong>Sugestão:</strong> {a.sugestao}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}