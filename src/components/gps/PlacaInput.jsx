import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Camera, Search, X, Upload } from 'lucide-react';

export default function PlacaInput({ onConsulta, loading }) {
  const [placa, setPlaca] = useState('');
  const [foto, setFoto] = useState(null);
  const fileInputRef = useRef(null);

  const formatarPlaca = (valor) => {
    const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    if (limpo.length <= 3) return limpo;
    if (limpo.length === 4) return `${limpo.slice(0, 3)}-${limpo[3]}`;
    if (limpo.length === 5) return `${limpo.slice(0, 3)}-${limpo.slice(3)}`;
    return `${limpo.slice(0, 3)}-${limpo.slice(3, 5)}-${limpo.slice(5)}`;
  };

  const validar = (p) => {
    const limpa = p.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(limpa);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validar(placa)) onConsulta(placa);
  };

  const handleFoto = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(URL.createObjectURL(file));
    }
  };

  const placaValida = validar(placa);

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4">
        {foto && (
          <div className="relative w-full max-w-xs">
            <img src={foto} alt="Foto da placa" className="w-full rounded-lg border" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={() => { setFoto(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFoto}
        />

        <Button
          type="button"
          variant="outline"
          className="w-full max-w-xs"
          onClick={() => fileInputRef.current?.click()}
        >
          {foto ? <><Camera className="h-4 w-4" /> Tirar outra foto</> : <><Camera className="h-4 w-4" /> Capturar placa</>}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="placa">Placa do veículo</Label>
          <Input
            id="placa"
            value={placa}
            onChange={(e) => setPlaca(formatarPlaca(e.target.value))}
            placeholder="ABC-1234"
            className="text-center text-2xl font-mono tracking-widest uppercase"
            maxLength={9}
            autoComplete="off"
          />
          {placa && !placaValida && (
            <p className="text-xs text-destructive">Formato inválido. Use ABC1234 ou ABC1D23.</p>
          )}
          {placaValida && (
            <p className="text-xs text-emerald-600">Placa válida ✓</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={!placaValida || loading}>
          <Search className="h-4 w-4" />
          {loading ? 'Consultando...' : 'Consultar veículo'}
        </Button>
      </form>
    </div>
  );
}