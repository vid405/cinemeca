import { useEffect, useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { profileStore } from '../store/profileStore';
import { decodeProfile, encodeProfile } from '../store/transfer';
import { Modal, Spinner } from './ui';

type Tab = 'export' | 'import';

function ExportPanel() {
  const profile = useProfile();
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    void encodeProfile(profile).then((c) => alive && setCode(c));
    return () => {
      alive = false;
    };
  }, [profile]);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Sin permiso de portapapeles: seleccionar para que el usuario copie a mano.
      (document.getElementById('export-code') as HTMLTextAreaElement | null)?.select();
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className="space-y-3">
      <p className="text-sm text-navy-300">
        Copia este código y pégalo en <b className="text-white">Importar</b> en tu otro dispositivo (por ejemplo, envíatelo por
        WhatsApp o correo). Incluye {profile.history.length} {profile.history.length === 1 ? 'película' : 'películas'} y{' '}
        {profile.xp} XP.
      </p>
      <textarea
        id="export-code"
        readOnly
        value={code ?? 'Generando…'}
        onFocus={(e) => e.currentTarget.select()}
        className="h-28 w-full resize-none break-all rounded-xl border border-navy-600 bg-navy-900 p-3 font-mono text-[11px] text-navy-200 outline-none"
      />
      <div className="flex gap-2">
        <button
          onClick={copy}
          disabled={!code}
          className="flex-1 rounded-xl bg-near py-3 font-extrabold text-navy-950 transition hover:brightness-110 disabled:opacity-50"
        >
          {copied ? '¡Copiado!' : 'Copiar código'}
        </button>
        {canShare && (
          <button
            onClick={() => code && navigator.share({ title: 'Mi progreso de CineMeca', text: code }).catch(() => {})}
            disabled={!code}
            className="rounded-xl border border-navy-400/70 px-4 py-3 font-bold text-navy-200 hover:bg-white/5 disabled:opacity-50"
          >
            Compartir
          </button>
        )}
      </div>
    </div>
  );
}

function ImportPanel() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const incoming = await decodeProfile(text);
      const { added, profile } = profileStore.importProfile(incoming);
      setDone(
        added
          ? `Listo: se añadieron ${added} ${added === 1 ? 'película' : 'películas'}. Ahora tienes ${profile.history.length} en la Filmoteca y ${profile.xp} XP.`
          : 'Listo: ya tenías todo ese progreso, no había nada nuevo.',
      );
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo importar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-navy-300">
        Pega el código que exportaste en tu otro dispositivo. Se <b className="text-white">combina</b> con lo que tienes aquí: no se
        pierde nada y las películas jugadas en cualquiera de los dos no se repetirán.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="CINEMECA1:…"
        className="h-28 w-full resize-none break-all rounded-xl border border-navy-600 bg-navy-900 p-3 font-mono text-[11px] text-navy-200 outline-none placeholder:text-navy-500 focus:border-navy-300"
      />
      {error && <p className="rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-200">{error}</p>}
      {done && <p className="rounded-lg bg-hit/15 px-3 py-2 text-sm text-hit">{done}</p>}
      <button
        onClick={run}
        disabled={busy || !text.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-near py-3 font-extrabold text-navy-950 transition hover:brightness-110 disabled:opacity-50"
      >
        {busy && <Spinner className="h-4 w-4" />}
        Importar y combinar
      </button>
    </div>
  );
}

export function SyncModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('export');
  return (
    <Modal title="Sincronizar dispositivos" onClose={onClose}>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-navy-900 p-1" role="tablist">
        {(['export', 'import'] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-full py-2 text-sm font-bold transition ${tab === t ? 'bg-near text-navy-950' : 'text-navy-300 hover:text-white'}`}
          >
            {t === 'export' ? 'Exportar' : 'Importar'}
          </button>
        ))}
      </div>
      {tab === 'export' ? <ExportPanel /> : <ImportPanel />}
    </Modal>
  );
}
