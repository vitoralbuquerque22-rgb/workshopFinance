import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Zap } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '@/components/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import ReguaCard from '@/components/reguas/ReguaCard';
import ReguaEditor from '@/components/reguas/ReguaEditor';

// Agrupa os TemplateMensagem em "réguas" pela chave evento|etapa_os|nome.
function agruparReguas(templates) {
  const mapa = new Map();
  for (const t of templates) {
    const chave = `${t.evento || 'manual'}|${t.etapa_os || ''}|${t.nome || ''}`;
    if (!mapa.has(chave)) {
      mapa.set(chave, {
        chave,
        nome: t.nome || '(sem nome)',
        evento: t.evento || 'manual',
        etapa_os: t.etapa_os || '',
        canal: t.canal || 'auto',
        passos: [],
      });
    }
    mapa.get(chave).passos.push({
      id: t.id,
      atraso_valor: t.atraso_valor || 0,
      atraso_unidade: t.atraso_unidade || 'dias',
      texto: t.texto || '',
      ativo: t.ativo !== false,
      midia_url: t.midia_url || '',
      midia_tipo: t.midia_tipo || '',
    });
  }
  // ordena passos por atraso
  for (const r of mapa.values()) {
    r.passos.sort((a, b) => {
      const mins = (v, u) => (u === 'horas' ? v * 60 : u === 'dias' ? v * 1440 : v);
      return mins(a.atraso_valor, a.atraso_unidade) - mins(b.atraso_valor, b.atraso_unidade);
    });
  }
  return Array.from(mapa.values());
}

export default function AutomacoesMensagem() {
  const { toast } = useToast();
  const [reguas, setReguas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorAberto, setEditorAberto] = useState(false);
  const [reguaEditando, setReguaEditando] = useState(null);
  const [reguaExcluir, setReguaExcluir] = useState(null);

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    setLoading(true);
    try {
      const templates = await base44.entities.TemplateMensagem.list('-updated_date', 300);
      setReguas(agruparReguas(templates));
    } finally {
      setLoading(false);
    }
  };

  const abrirNova = () => { setReguaEditando(null); setEditorAberto(true); };
  const abrirEdicao = (regua) => { setReguaEditando(regua); setEditorAberto(true); };

  // Salva a régua: apaga os passos antigos e recria os atuais.
  const salvar = async (dados) => {
    setSaving(true);
    try {
      // remove passos antigos (se estava editando)
      if (reguaEditando?.passos?.length) {
        for (const p of reguaEditando.passos) {
          if (p.id) await base44.entities.TemplateMensagem.delete(p.id);
        }
      }
      // cria um TemplateMensagem por passo
      for (const passo of dados.passos) {
        await base44.entities.TemplateMensagem.create({
          nome: dados.nome,
          evento: dados.evento,
          etapa_os: dados.etapa_os || '',
          canal: dados.canal || 'auto',
          atraso_valor: Number(passo.atraso_valor) || 0,
          atraso_unidade: passo.atraso_unidade || 'dias',
          texto: passo.texto,
          midia_url: passo.midia_url || '',
          midia_tipo: passo.midia_tipo || undefined,
          ativo: passo.ativo !== false,
        });
      }
      toast({ title: 'Régua salva', description: 'A automação foi atualizada.' });
      setEditorAberto(false);
      await carregar();
    } finally {
      setSaving(false);
    }
  };

  // Ativa/pausa todos os passos da régua de uma vez.
  const toggleAtivo = async (regua, ativo) => {
    for (const p of regua.passos) {
      if (p.id) await base44.entities.TemplateMensagem.update(p.id, { ativo });
    }
    toast({ title: ativo ? 'Régua ativada' : 'Régua pausada' });
    await carregar();
  };

  const confirmarExcluir = async () => {
    if (!reguaExcluir) return;
    for (const p of reguaExcluir.passos) {
      if (p.id) await base44.entities.TemplateMensagem.delete(p.id);
    }
    toast({ title: 'Régua excluída' });
    setReguaExcluir(null);
    await carregar();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Automações de Mensagem" description="Crie e edite as réguas que disparam mensagens automaticamente (1, 7, 30 dias…)">
        <Button onClick={abrirNova}><Plus className="w-4 h-4" /> Nova régua</Button>
      </PageHeader>

      {reguas.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-heading font-semibold">Nenhuma régua criada ainda</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Crie sequências de mensagens que disparam sozinhas quando o cliente pede orçamento, só pergunta, ou o serviço é finalizado.
          </p>
          <Button onClick={abrirNova} className="mt-4"><Plus className="w-4 h-4" /> Criar primeira régua</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {reguas.map((r) => (
            <ReguaCard
              key={r.chave}
              regua={r}
              onEditar={abrirEdicao}
              onExcluir={setReguaExcluir}
              onToggleAtivo={toggleAtivo}
            />
          ))}
        </div>
      )}

      <ReguaEditor open={editorAberto} onOpenChange={setEditorAberto} regua={reguaEditando} onSalvar={salvar} saving={saving} />

      <AlertDialog open={!!reguaExcluir} onOpenChange={(o) => !o && setReguaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir régua?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os passos de "{reguaExcluir?.nome}" serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExcluir} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}