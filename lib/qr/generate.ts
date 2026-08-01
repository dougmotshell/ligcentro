import QRCode from 'qrcode';

/**
 * QR code da página pública, gerado **no servidor**, como SVG.
 *
 * SVG em vez de PNG: escala sem perder nitidez na impressão (caso de uso do
 * pequeno negócio — cardápio, balcão, adesivo) e é texto, então vai inline no
 * HTML sem requisição extra. Geração local, sem serviço externo: um gerador de
 * QR hospedado veria a URL de cada perfil.
 */
export async function renderQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    // Nível médio de correção: sobrevive a impressão e adesivo desgastado sem
    // inflar demais o número de módulos.
    errorCorrectionLevel: 'M',
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

/** URL pública canônica de um handle — a mesma que vira QR e compartilhamento. */
export function buildPublicProfileUrl(handle: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

  return `${base}/${handle}`;
}
