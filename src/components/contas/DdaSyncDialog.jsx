import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';

export default function DdaSyncDialog({ open, onOpenChange, contaBancariaId, onSynced }) {
  const [cnabText, setCnabText] = useState('');
  const [boletos, setBoletos] = useState([{ valor: '', vencimento: '', nome: '', cnpj: '' }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCnabText(text);
  };

  const updateBoleto = (idx, field, value) => {
    const updated = [...boletos];
    updated[idx][field] = value;
    setBoletos(updated);
  };

  const addBoleto = () => {
    setBoletos([...boletos, { valor: '', vencimento: '', nome: '', cnpj: '' }]);
  };

  const removeBoleto = (idx) => {
    setBoletos(boletos.filter((_, i) => i !== idx));
  };

  const handleCnabSync = async () => {
    if (!cnabText.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await base44.functions.invoke('syncDda', {
        conta_bancaria_id: contaBancariaId,
        cnab_content: cnabText,
      });
      setResult(res.data);
      if (res.data?.status === 'sucesso') onSynced?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    const valid = boletos.filter(b => b.valor && b.vencimento);
    if (valid.length === 0) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = valid.map(b => ({
        valor: parseFloat(b.valor),
        vencimento: b.vencimento,
        pagador_nome: b.nome,
        pagador_cnpj: b.cnpj.replace(/\D/g, ''),
      }));
      const res = await base44.functions.invoke('syncDda', {
        conta_bancaria_id: contaBancariaId,
        boletos: payload,
      });
      setResult(res.data);
      if (res.data?.status === 'sucesso') onSynced?.();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCnabText('');
    setBoletos([{ valor: '', vencimento: '', nome: '', cnpj: '' }]);
    setResult(null);
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sincronizar DDA</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Sincronização concluída!</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
              <p><strong>Boletos encontrados:</strong> {result.boletos_encontrados}</p>
              <p><strong>Contas a pagar criadas:</strong> {result.boletos_criados}</p>
              <p><strong>Boletos com match:</strong> {result.boletos_match}</p>
            </div>
            <Button onClick={handleClose} className="w-full">Fechar</Button>
          </div>
        ) : (
          <Tabs defaultValue="cnab">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cnab">Arquivo CNAB</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="cnab" className="space-y-3 mt-4">
              <div>
                <Label>Arquivo CNAB 240</Label>
                <Input type="file" accept=".txt,.ret,.cnab" onChange={handleFile} disabled={loading} />
              </div>
              <div>
                <Label>Ou cole o conteúdo do CNAB</Label>
                <Textarea rows={6} value={cnabText} onChange={(e) => setCnabText(e.target.value)} disabled={loading} className="font-mono text-xs" />
              </div>
              {error && <div className="flex items-center gap-2 text-destructive text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
              <Button onClick={handleCnabSync} disabled={loading || !cnabText.trim()} className="w-full">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</> : <><Upload className="w-4 h-4" /> Sincronizar CNAB</>}
              </Button>
            </TabsContent>

            <TabsContent value="manual" className="space-y-3 mt-4">
              {boletos.map((b, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-2 p-3 border border-border rounded-lg relative">
                  {boletos.length > 1 && (
                    <button onClick={() => removeBoleto(idx)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div>
                    <Label className="text-xs">Valor (R$)</Label>
                    <Input type="number" step="0.01" value={b.valor} onChange={(e) => updateBoleto(idx, 'valor', e.target.value)} disabled={loading} />
                  </div>
                  <div>
                    <Label className="text-xs">Vencimento</Label>
                    <Input type="date" value={b.vencimento} onChange={(e) => updateBoleto(idx, 'vencimento', e.target.value)} disabled={loading} />
                  </div>
                  <div>
                    <Label className="text-xs">Beneficiário</Label>
                    <Input value={b.nome} onChange={(e) => updateBoleto(idx, 'nome', e.target.value)} disabled={loading} />
                  </div>
                  <div>
                    <Label className="text-xs">CNPJ</Label>
                    <Input value={b.cnpj} onChange={(e) => updateBoleto(idx, 'cnpj', e.target.value)} disabled={loading} />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addBoleto}><Plus className="w-4 h-4" /> Adicionar boleto</Button>
              {error && <div className="flex items-center gap-2 text-destructive text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
              <Button onClick={handleManualSync} disabled={loading} className="w-full">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</> : <><Upload className="w-4 h-4" /> Sincronizar Boletos</>}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}