import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/format';
import { ORIGENS_LABEL } from '@/lib/marketing';
import { Megaphone } from 'lucide-react';

export default function OsOrigemCliente({ clienteId }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clienteId) { setLoading(false); return; }
    base44.entities.Lead.filter({ cliente_id: clienteId }, '-created_date', 1)
      .then((r) => setLead(r[0] || null))
      .finally(() => setLoading(false));
  }, [clienteId]);

  if (loading || !lead) return null;

  const tempoConversao = lead.data_captura && lead.data_ganho
    ? `${Math.round((new Date(lead.data_ganho) - new Date(lead.data_captura)) / 36e5)}h`
    : null;

  const campos = [
    ['Plataforma', ORIGENS_LABEL[lead.plataforma] || ORIGENS_LABEL[lead.origem]],
    ['Campanha', lead.campanha_nome],
    ['Conjunto de anúncios', lead.conjunto_anuncios],
    ['Anúncio', lead.anuncio],
    ['UTM Source', lead.utm_source],
    ['UTM Campaign', lead.utm_campaign],
    ['Data da captura', lead.data_captura ? formatDateTime(lead.data_captura) : null],
    ['1º atendimento', lead.primeiro_atendimento_em ? formatDateTime(lead.primeiro_atendimento_em) : null],
    ['Consultor', lead.consultor],
    ['Tempo até conversão', tempoConversao],
  ].filter(([, v]) => v);

  if (campos.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" /> Origem do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
          {campos.map(([label, value]) => (
            <div key={label}>
              <p className="text-[11px] text-muted-foreground">{label}</p>
              <p className="text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}