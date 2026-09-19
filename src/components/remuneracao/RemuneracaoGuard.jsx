import { useState, useEffect } from 'react';
import { podeVerRemuneracao } from '@/lib/permissoes';
import RemuneracaoNav from './RemuneracaoNav';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function RemuneracaoGuard({ children }) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    podeVerRemuneracao().then((ok) => setStatus(ok ? 'ok' : 'denied'));
  }, []);

  if (status === 'loading') {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (status === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-muted-foreground mb-3" />
        <h2 className="text-lg font-semibold">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          Dados de remuneração, salários e comissões são visíveis apenas para Administrador, Financeiro e Proprietário.
        </p>
      </div>
    );
  }

  return (
    <div>
      <RemuneracaoNav />
      {children}
    </div>
  );
}