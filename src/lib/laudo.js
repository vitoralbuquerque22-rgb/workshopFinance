import { jsPDF } from 'jspdf';
import { base44 } from '@/api/base44Client';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';

// Carrega uma imagem (URL) e devolve dataURL para embutir no PDF.
async function carregarImagem(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Gera o Laudo Técnico unificado: OS + cliente/veículo + itens + GPS + fotos.
export async function gerarLaudoTecnico(os, cliente, veiculo) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  const osNumero = os.numero || `OS-${os.id.slice(-6)}`;

  const checkBreak = (needed = 10) => {
    if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
  };

  const sectionTitle = (title) => {
    checkBreak(14);
    doc.setFillColor(37, 99, 235);
    doc.rect(margin, y, pageW - margin * 2, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title, margin + 2, y + 5);
    doc.setTextColor(30, 30, 30);
    y += 11;
  };

  const kv = (label, value, x, width) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(label, x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(String(value || '—'), width - 2);
    doc.text(lines, x, y + 4);
    return lines.length;
  };

  // ===== Cabeçalho =====
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LAUDO TÉCNICO', margin, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(osNumero, margin, 18);
  doc.setFontSize(8);
  doc.text(`Emitido em ${formatDateTime(new Date().toISOString())}`, pageW - margin, 12, { align: 'right' });
  doc.text(`Status: ${(os.status || '').toUpperCase()}`, pageW - margin, 18, { align: 'right' });
  doc.setTextColor(30, 30, 30);
  y = 30;

  // ===== Cliente & Veículo =====
  sectionTitle('CLIENTE E VEÍCULO');
  const col2 = margin + (pageW - margin * 2) / 2;
  const colW = (pageW - margin * 2) / 2;
  kv('Cliente', cliente?.nome, margin, colW);
  kv('Veículo', veiculo ? `${veiculo.marca || ''} ${veiculo.modelo || ''}`.trim() : '—', col2, colW);
  y += 9;
  kv('Telefone', cliente?.telefone || cliente?.celular, margin, colW);
  kv('Placa', veiculo?.placa, col2, colW);
  y += 9;
  kv('Documento', cliente?.cpf || cliente?.cnpj, margin, colW);
  kv('KM Entrada', os.quilometragem_entrada ? `${os.quilometragem_entrada} km` : '—', col2, colW);
  y += 11;

  // ===== Dados da OS =====
  sectionTitle('DADOS DA ORDEM DE SERVIÇO');
  kv('Consultor', os.consultor, margin, colW);
  kv('Técnico Responsável', os.tecnico_responsavel, col2, colW);
  y += 9;
  kv('Data Abertura', formatDate(os.data_abertura || os.created_date), margin, colW);
  kv('Data Prevista', formatDate(os.data_prevista), col2, colW);
  y += 11;

  if (os.descricao_problema) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Problema Relatado', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(os.descricao_problema, pageW - margin * 2);
    checkBreak(lines.length * 4 + 6);
    doc.text(lines, margin, y + 4);
    y += lines.length * 4 + 8;
  }

  // ===== Itens =====
  sectionTitle('SERVIÇOS E PEÇAS');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageW - margin * 2, 6, 'F');
  doc.text('Descrição', margin + 2, y + 4);
  doc.text('Qtd', pageW - 70, y + 4, { align: 'right' });
  doc.text('Unit.', pageW - 45, y + 4, { align: 'right' });
  doc.text('Total', pageW - margin - 1, y + 4, { align: 'right' });
  y += 8;
  doc.setFont('helvetica', 'normal');
  (os.itens || []).forEach((item) => {
    checkBreak(7);
    const tipoLabel = { peca: 'Peça', mao_obra: 'M.O.', servico: 'Serviço', servico_composto: 'Serviço' }[item.tipo] || 'Item';
    const desc = doc.splitTextToSize(`[${tipoLabel}] ${item.descricao || ''}`, pageW - 90);
    doc.text(desc, margin + 2, y + 3);
    doc.text(String(item.quantidade || 0), pageW - 70, y + 3, { align: 'right' });
    doc.text(formatCurrency(item.valor_unitario), pageW - 45, y + 3, { align: 'right' });
    doc.text(formatCurrency(item.valor_total), pageW - margin - 1, y + 3, { align: 'right' });
    y += Math.max(desc.length * 4, 5) + 1;
    // técnicos apontados
    const aps = (item.apontamentos || []).filter((a) => a.colaborador_nome);
    if (aps.length > 0) {
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(`Técnicos: ${aps.map((a) => `${a.colaborador_nome} (${a.percentual || 0}%)`).join(', ')}`, margin + 4, y + 2);
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      y += 5;
    }
  });

  y += 3;
  checkBreak(24);
  doc.setDrawColor(220, 220, 220);
  doc.line(pageW - 80, y, pageW - margin, y);
  y += 5;
  const totalLinha = (label, value, bold) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 9);
    doc.text(label, pageW - 80, y);
    doc.text(formatCurrency(value), pageW - margin - 1, y, { align: 'right' });
    y += bold ? 7 : 5;
  };
  totalLinha('Peças', os.valor_pecas);
  totalLinha('Serviços', os.valor_servicos);
  if (os.valor_desconto) totalLinha('Desconto', -os.valor_desconto);
  totalLinha('TOTAL', os.valor_total, true);
  y += 4;

  // ===== Atendimento GPS =====
  if (os.gps_atendimento_id) {
    try {
      const gps = await base44.entities.GpsAtendimento.get(os.gps_atendimento_id);
      if (gps) {
        sectionTitle('ATENDIMENTO GPS (RECEPÇÃO)');
        const nivelLabel = { reserva: 'Reserva', um_quarto: '1/4', meio: '1/2', tres_quartos: '3/4', cheio: 'Cheio' };
        if (gps.combustivel_nivel || gps.quilometragem) {
          kv('Combustível', nivelLabel[gps.combustivel_nivel] || '—', margin, colW);
          kv('KM (recepção)', gps.quilometragem ? `${gps.quilometragem} km` : '—', col2, colW);
          y += 11;
        }
        const statusLabel = { ok: 'OK', atencao: 'Atenção', necessita_reparo: 'Necessita reparo', nao_aplicavel: 'N/A' };
        (gps.respostas || []).forEach((r) => {
          checkBreak(10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          const perg = doc.splitTextToSize(`${r.pergunta || ''}${r.status ? ` [${statusLabel[r.status] || r.status}]` : ''}`, pageW - margin * 2);
          doc.text(perg, margin, y);
          y += perg.length * 4;
          doc.setFont('helvetica', 'normal');
          const resp = doc.splitTextToSize(String(r.resposta || r.observacao || '—'), pageW - margin * 2);
          doc.text(resp, margin, y + 3);
          y += resp.length * 4 + 4;
        });
        if (gps.observacoes_gerais) {
          checkBreak(10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.text('Observações gerais:', margin, y);
          doc.setFont('helvetica', 'normal');
          const obs = doc.splitTextToSize(gps.observacoes_gerais, pageW - margin * 2);
          doc.text(obs, margin, y + 4);
          y += obs.length * 4 + 6;
        }
      }
    } catch { /* GPS não encontrado */ }
  }

  // ===== Fotos =====
  const fotos = (os.fotos || []).slice(0, 8);
  if (fotos.length > 0) {
    sectionTitle('REGISTRO FOTOGRÁFICO');
    const imgW = (pageW - margin * 2 - 6) / 2;
    const imgH = imgW * 0.7;
    let col = 0;
    for (const url of fotos) {
      checkBreak(imgH + 4);
      const dataUrl = await carregarImagem(url);
      const x = margin + col * (imgW + 6);
      if (dataUrl) {
        try {
          const fmt = dataUrl.includes('image/png') ? 'PNG' : 'JPEG';
          doc.addImage(dataUrl, fmt, x, y, imgW, imgH, undefined, 'FAST');
        } catch { /* imagem inválida */ }
      } else {
        doc.setDrawColor(220, 220, 220);
        doc.rect(x, y, imgW, imgH);
      }
      col += 1;
      if (col === 2) { col = 0; y += imgH + 4; }
    }
    if (col === 1) y += imgH + 4;
  }

  // ===== Assinaturas =====
  checkBreak(30);
  y = Math.max(y, pageH - 40);
  doc.setDrawColor(120, 120, 120);
  doc.line(margin, y, margin + 70, y);
  doc.line(pageW - margin - 70, y, pageW - margin, y);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Responsável Técnico', margin, y + 4);
  doc.text('Cliente', pageW - margin - 70, y + 4);

  // Rodapé com paginação
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`${osNumero} · Página ${p} de ${totalPages}`, pageW / 2, pageH - 6, { align: 'center' });
  }

  doc.save(`Laudo_${osNumero}.pdf`);
}