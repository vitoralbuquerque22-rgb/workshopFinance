import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import CanalCard from '@/components/canais/CanalCard';
import { CANAIS_LISTA } from '@/lib/canais';

export default function Canais() {
  const [empresaId, setEmpresaId] = useState('');
  const [canais, setCanais] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    try {
      const empresas = await base44.entities.Empresa.list();
      const empId = empresas[0]?.id || '';
      setEmpresaId(empId);
      const conexoes = await base44.entities.CanalConexao.filter(empId ? { empresa_id: empId } : {});
      setCanais(conexoes);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (canalAtualizado) => {
    setCanais((prev) => {
      const idx = prev.findIndex((c) => c.id === canalAtualizado.id);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = canalAtualizado;
        return copia;
      }
      return [...prev, canalAtualizado];
    });
  };

  const canalDe = (tipo) => canais.find((c) => c.canal === tipo);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Canais de Atendimento"
        description="Conecte WhatsApp, Instagram e Messenger da sua empresa via API Oficial da Meta ou QR Code"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
        {CANAIS_LISTA.map((tipo) => (
          <CanalCard
            key={tipo}
            canalTipo={tipo}
            canal={canalDe(tipo)}
            empresaId={empresaId}
            onChange={handleChange}
          />
        ))}
      </div>
    </div>
  );
}