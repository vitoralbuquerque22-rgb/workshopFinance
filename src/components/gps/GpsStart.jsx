import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import PlacaInput from './PlacaInput';
import ResultadoConsulta from './ResultadoConsulta';
import { Loader2, Navigation, Car, UserPlus } from 'lucide-react';

export default function GpsStart({ modelos, onStarted }) {
  const { toast } = useToast();
  const [consulta, setConsulta] = useState(null);
  const [loadingConsulta, setLoadingConsulta] = useState(false);
  const [starting, setStarting] = useState(false);
  const [erro, setErro] = useState(null);
  const [modeloId, setModeloId] = useState('');

  const handleConsulta = async (placa) => {
    setLoadingConsulta(true);
    setErro(null);
    setConsulta(null);
    try {
      const res = await base44.functions.invoke('consultarPlaca', { placa });
      const dados = res.data;
      if (dados.error) {
        setErro(dados.error);
      } else {
        setConsulta(dados);
      }
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao consultar placa.');
    } finally {
      setLoadingConsulta(false);
    }
  };

  const handleStart = async () => {
    if (!consulta) return;
    const modelo = modelos.find(m => m.id === modeloId) || modelos.find(m => m.is_default) || modelos[0];
    if (!modelo) {
      toast({ title: 'Erro', description: 'Nenhum modelo de GPS configurado.', variant: 'destructive' });
      return;
    }
    setStarting(true);
    try {
      const res = await base44.functions.invoke('cadastrarLeadVeiculo', {
        placa: consulta.placa,
        marca: consulta.marca,
        modelo: consulta.modelo,
        ano: consulta.ano,
        cor: consulta.cor,
        chassi: consulta.chassi,
        renavam: consulta.renavam,
        proprietario_nome: consulta.proprietario_nome,
        proprietario_cpf_cnpj: consulta.proprietario_cpf_cnpj,
        proprietario_telefone: consulta.proprietario_telefone,
      });
      const dados = res.data;
      if (dados.error) {
        toast({ title: 'Erro', description: dados.error, variant: 'destructive' });
        return;
      }

      const cliente = dados.cliente;
      const veiculo = dados.veiculo;

      const os = await base44.entities.OrdemServico.create({
        cliente_id: cliente?.id,
        veiculo_id: veiculo?.id,
        descricao_problema: consulta.modelo ? `Atendimento GPS - ${consulta.marca} ${consulta.modelo}` : 'Atendimento GPS',
        status: 'orcamento',
        origem: 'manual',
        data_abertura: new Date().toISOString().slice(0, 10),
        itens: [],
        valor_pecas: 0,
        valor_servicos: 0,
        valor_desconto: 0,
        valor_total: 0,
      });

      const atendimento = await base44.entities.GpsAtendimento.create({
        modelo_id: modelo.id,
        modelo_nome: modelo.nome,
        modelo_versao: modelo.versao || 1,
        os_id: os.id,
        cliente_id: cliente?.id,
        veiculo_id: veiculo?.id,
        lead_id: dados.lead?.id,
        consultor: '',
        placa: consulta.placa,
        status: 'em_andamento',
        data_inicio: new Date().toISOString(),
        respostas: [],
        codigos_falha: [],
      });

      toast({ title: 'Atendimento iniciado!', description: `${cliente?.nome || 'Cliente'} • OS ${os.numero || os.id.slice(0, 6)}` });
      onStarted({ atendimento, os, cliente, veiculo, modelo });
    } catch (err) {
      toast({ title: 'Erro', description: err.response?.data?.error || 'Erro ao iniciar atendimento.', variant: 'destructive' });
    } finally {
      setStarting(false);
    }
  };

  const defaultModelo = modelos.find(m => m.is_default) || modelos[0];

  return (
    <div className="max-w-md mx-auto space-y-4">
      <Card>
        <CardContent className="pt-6">
          <PlacaInput onConsulta={handleConsulta} loading={loadingConsulta} />
          {loadingConsulta && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Consultando provedor...
            </div>
          )}
          {erro && (
            <div className="mt-4 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">{erro}</div>
          )}
        </CardContent>
      </Card>

      {consulta && (
        <>
          <ResultadoConsulta dados={consulta} />
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium">Selecione o modelo de inspeção</p>
              <Select value={modeloId || defaultModelo?.id || ''} onValueChange={setModeloId}>
                <SelectTrigger><SelectValue placeholder="Selecionar modelo..." /></SelectTrigger>
                <SelectContent>
                  {modelos.filter(m => m.status === 'ativo').map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nome} ({m.tipo_oficina})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleStart} disabled={starting} className="w-full" size="lg">
                {starting ? <><Loader2 className="h-5 w-5 animate-spin" /> Iniciando...</> : <><Navigation className="h-5 w-5" /> Iniciar Atendimento</>}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}