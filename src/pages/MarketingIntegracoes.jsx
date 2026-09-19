import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingIntegracaoCard from '@/components/marketing/MarketingIntegracaoCard';
import { Facebook, Chrome, Globe, MessageCircle, Loader2, Info } from 'lucide-react';

const PLATAFORMAS = [
  { key: 'meta', label: 'Meta (Facebook / Instagram)', icon: Facebook, color: '#1877F2' },
  { key: 'google', label: 'Google (Ads / Analytics / GTM)', icon: Chrome, color: '#EA4335' },
  { key: 'site', label: 'Site / Landing Pages', icon: Globe, color: '#6366F1' },
  { key: 'whatsapp', label: 'WhatsApp Business', icon: MessageCircle, color: '#25D366' },
];

export default function MarketingIntegracoes() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await base44.entities.MarketingIntegracao.list('-created_date', 50);
    setConfigs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader title="Marketing & Growth" description="Central de integrações com plataformas de anúncios" />
      <MarketingNav />

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p>Configure as credenciais de cada plataforma para capturar leads automaticamente e enviar conversões offline. As chaves ficam armazenadas de forma segura por integração.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-3">
          {PLATAFORMAS.map((meta) => (
            <MarketingIntegracaoCard
              key={meta.key}
              meta={meta}
              config={configs.find((c) => c.plataforma === meta.key)}
              onSaved={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}