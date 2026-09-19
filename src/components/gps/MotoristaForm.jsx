import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, UserCheck } from 'lucide-react';

export default function MotoristaForm({ onCadastrar, loading }) {
  const [hasMotorista, setHasMotorista] = useState(false);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const handleSubmit = () => {
    onCadastrar({
      motorista_nome: hasMotorista ? nome : '',
      motorista_cpf: hasMotorista ? cpf : '',
      motorista_telefone: hasMotorista ? telefone : '',
      observacoes,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Registrar Lead</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={hasMotorista ? 'outline' : 'default'}
            size="sm"
            onClick={() => setHasMotorista(false)}
          >
            <UserCheck className="h-4 w-4" />
            Proprietário é o motorista
          </Button>
          <Button
            type="button"
            variant={hasMotorista ? 'default' : 'outline'}
            size="sm"
            onClick={() => setHasMotorista(true)}
          >
            <UserPlus className="h-4 w-4" />
            Outro motorista
          </Button>
        </div>

        {hasMotorista && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 border">
            <div className="space-y-1">
              <Label htmlFor="mnome" className="text-xs">Nome</Label>
              <Input id="mnome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do motorista" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mcpf" className="text-xs">CPF</Label>
              <Input id="mcpf" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mtel" className="text-xs">Telefone</Label>
              <Input id="mtel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="obs" className="text-xs">Observações</Label>
          <Textarea id="obs" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Anotações do consultor..." rows={2} />
        </div>

        <Button onClick={handleSubmit} className="w-full" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar Lead no CRM'}
        </Button>
      </CardContent>
    </Card>
  );
}