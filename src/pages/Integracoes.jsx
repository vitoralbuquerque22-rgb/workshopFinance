import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, User, Building2, Car, History } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import IntegracaoConfigCard from '@/components/integracoes/IntegracaoConfigCard';
import { formatDateTime } from '@/lib/format';

const STATUS_STYLE = {
  sucesso: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  erro: 'bg-red-50 text-red-700 border-red-200',
  nao_encontrado: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function Integracoes() {
  const [configs, setConfigs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [c, l] = await Promise.all([
      base44.entities.IntegracaoConfig.list().catch(() => []),
      base44.entities.ConsultaLog.list('-created_date', 30).catch(() => []),
    ]);
    setConfigs(c);
    setLogs(l);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getConfig = (servico) => configs.find((c) => c.servico === servico);

  const handleSave = async (servico, data) => {
    const existing = getConfig(servico);
    if (existing) await base44.entities.IntegracaoConfig.update(existing.id, data);
    else await base44.entities.IntegracaoConfig.create(data);
    await load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Serviços de Consulta" description="Integrações → Serviços de Consulta · configure os provedores de cadastro automático por CPF, CNPJ e placa" />

      <div className="grid gap-4 lg:grid-cols-2">
        <IntegracaoConfigCard servico="cnpj" titulo="API de CNPJ" descricao="Consulta de dados cadastrais de Pessoa Jurídica." icon={Building2} config={getConfig('cnpj')} publico onSave={handleSave} />
        <IntegracaoConfigCard servico="cpf" titulo="API de CPF" descricao="Consulta de dados cadastrais de Pessoa Física (requer provedor)." icon={User} config={getConfig('cpf')} onSave={handleSave} />
        <IntegracaoConfigCard servico="veiculo" titulo="API de Veículos" descricao="Consulta de dados do veículo pela placa." icon={Car} config={getConfig('veiculo')} onSave={handleSave} />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="w-5 h-5 text-primary" /> Auditoria de Consultas</CardTitle></CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma consulta registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="py-2 pr-4">Data/Hora</th>
                    <th className="py-2 pr-4">Serviço</th>
                    <th className="py-2 pr-4">Documento</th>
                    <th className="py-2 pr-4">Provedor</th>
                    <th className="py-2 pr-4">Usuário</th>
                    <th className="py-2 pr-4">Tempo</th>
                    <th className="py-2">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50">
                      <td className="py-2 pr-4 whitespace-nowrap">{formatDateTime(log.created_date)}</td>
                      <td className="py-2 pr-4 uppercase text-xs">{log.servico}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{log.documento || '—'}</td>
                      <td className="py-2 pr-4">{log.provedor || '—'}</td>
                      <td className="py-2 pr-4">{log.usuario || '—'}</td>
                      <td className="py-2 pr-4">{log.tempo_resposta_ms ? `${log.tempo_resposta_ms}ms` : '—'}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_STYLE[log.status] || 'bg-muted'}`}>{log.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}