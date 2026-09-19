import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, User, Phone, MapPin, AlertTriangle, FileText } from 'lucide-react';

function DadoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="text-xs text-muted-foreground">{label}: </span>
        <span className="text-sm font-medium break-words">{value || '-'}</span>
      </div>
    </div>
  );
}

export default function ResultadoConsulta({ dados }) {
  if (!dados) return null;

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-5 w-5 text-primary" />
            {dados.marca} {dados.modelo}
          </CardTitle>
          <Badge variant="secondary" className="font-mono">{dados.placa}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-x-4">
          <DadoItem icon={Car} label="Ano" value={dados.ano} />
          <DadoItem icon={Car} label="Cor" value={dados.cor} />
          <DadoItem icon={FileText} label="RENAVAM" value={dados.renavam} />
          <DadoItem icon={FileText} label="Chassi" value={dados.chassi} />
          <DadoItem icon={MapPin} label="Município" value={dados.municipio} />
          <DadoItem icon={MapPin} label="UF" value={dados.uf} />
        </div>

        {dados.situacao && (
          <div className="rounded-md bg-slate-50 border px-3 py-2">
            <span className="text-xs text-muted-foreground">Situação: </span>
            <span className="text-sm font-medium">{dados.situacao}</span>
          </div>
        )}

        {dados.restricoes && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-medium text-amber-700">Restrições: </span>
              <span className="text-sm text-amber-800">{dados.restricoes}</span>
            </div>
          </div>
        )}

        <div className="border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Proprietário</p>
          <DadoItem icon={User} label="Nome" value={dados.proprietario_nome} />
          <DadoItem icon={FileText} label="CPF/CNPJ" value={dados.proprietario_cpf_cnpj} />
          <DadoItem icon={Phone} label="Telefone" value={dados.proprietario_telefone} />
        </div>
      </CardContent>
    </Card>
  );
}