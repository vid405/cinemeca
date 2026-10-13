import { normalizeProfile, type Profile } from '../game/progress';

/**
 * Código de transferencia entre dispositivos: el perfil en JSON, comprimido con gzip
 * (si el navegador lo soporta) y en base64url para poder copiarlo y pegarlo.
 */
const PREFIX = 'CINEMECA1:';

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

const canCompress = typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

export async function encodeProfile(profile: Profile): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(profile));
  if (canCompress) return `${PREFIX}g${toBase64Url(await pipe(raw, new CompressionStream('gzip')))}`;
  return `${PREFIX}j${toBase64Url(raw)}`;
}

export class TransferCodeError extends Error {}

export async function decodeProfile(code: string): Promise<Profile> {
  const clean = code.replace(/\s+/g, '');
  if (!clean.startsWith(PREFIX)) throw new TransferCodeError('Ese no parece un código de CineMeca.');
  const kind = clean[PREFIX.length];
  try {
    let bytes = fromBase64Url(clean.slice(PREFIX.length + 1));
    if (kind === 'g') {
      if (!canCompress) throw new TransferCodeError('Este navegador no puede leer códigos comprimidos.');
      bytes = await pipe(bytes, new DecompressionStream('gzip'));
    } else if (kind !== 'j') {
      throw new Error('formato');
    }
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== 'object' || !('history' in parsed)) throw new Error('contenido');
    return normalizeProfile(parsed);
  } catch (err) {
    if (err instanceof TransferCodeError) throw err;
    throw new TransferCodeError('El código está incompleto o dañado. Cópialo de nuevo completo.');
  }
}
