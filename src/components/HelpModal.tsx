import { BOX_OFFICE_TOLERANCE, SCORE_TOLERANCE, YEAR_TOLERANCE } from '../game/compare';
import { HOLLYWOOD_TIERS } from '../game/difficulty';
import { RANKS, XP_RULES } from '../game/xp';
import { MATCH_BG } from './GuessList';
import { Modal } from './ui';

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Cómo jugar" onClose={onClose}>
      <div className="space-y-3 text-sm leading-relaxed text-navy-200">
        <p>
          Adivina la película secreta. Busca un título y envíalo: cada intento se compara con la secreta. Sin límite diario, juega
          todas las que quieras; ninguna película se repite.
        </p>
        <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-semibold">
          <span className={`rounded-lg py-2 ${MATCH_BG.correct}`}>Coincide</span>
          <span className={`rounded-lg py-2 ${MATCH_BG.partial}`}>Cerca</span>
          <span className={`rounded-lg py-2 ${MATCH_BG.wrong}`}>No coincide</span>
        </div>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b className="text-white">Géneros</b>: cada género compartido se marca en verde.
          </li>
          <li>
            <b className="text-white">Año</b> (±{YEAR_TOLERANCE}), <b className="text-white">Taquilla</b> (±
            {Math.round(BOX_OFFICE_TOLERANCE * 100)} %) y <b className="text-white">Puntuación</b> (±{SCORE_TOLERANCE}): amarillo si está
            cerca. ↑ la secreta tiene un valor mayor, ↓ menor.
          </li>
          <li>
            <b className="text-white">Estudio</b>: verde si comparten productora. <b className="text-white">Clasificación</b>: verde si
            es la misma.
          </li>
          <li>
            <b className="text-white">Director</b>, <b className="text-white">Protagonista</b> y <b className="text-white">Reparto</b>: la
            foto se ilumina en verde si coincide en el mismo papel y en amarillo si aparece en otro papel.
          </li>
          <li>
            <b className="text-white">Pistas</b> (opcionales, −{XP_RULES.hintPenalty} XP cada una): se ganan usos según avanzas. En cada uso
            eliges entre 3 opciones: Frase, Reparto, Temas, Director o Coestrella.
          </li>
        </ul>

        <h3 className="pt-1 font-bold text-white">🌍 Pistas</h3>
        <p>
          Cine de todo el mundo. 10 intentos y 2 pistas. Acertar da {XP_RULES.winBase} XP + {XP_RULES.perUnusedAttempt} por cada intento
          que sobre; perder da {XP_RULES.loss} XP de consolación (rendirse {XP_RULES.giveUp}).
        </p>

        <h3 className="pt-1 font-bold text-white">🎬 Hollywood</h3>
        <p>
          Solo grandes películas de EE. UU. Cada rango que alcanzas lo hace más difícil, acertar da más XP y{' '}
          <b className="text-red-300">fallar o rendirse resta XP</b> (puedes bajar de rango).
        </p>
        <div className="overflow-x-auto rounded-lg border border-navy-600">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-700 text-navy-200">
              <tr>
                <th className="px-2 py-1.5">Rango</th>
                <th className="px-2 py-1.5">Películas</th>
                <th className="px-2 py-1.5">Intentos</th>
                <th className="px-2 py-1.5">Pistas</th>
                <th className="px-2 py-1.5">XP</th>
              </tr>
            </thead>
            <tbody>
              {HOLLYWOOD_TIERS.map((t) => (
                <tr key={t.level} className="border-t border-navy-700">
                  <td className="px-2 py-1.5 font-semibold text-white">
                    {t.rank}
                    <span className="block font-normal text-navy-400">{RANKS[t.level].minXp}+ XP</span>
                  </td>
                  <td className="px-2 py-1.5">
                    Desde {t.fromYear}, ≥{(t.minVotes / 1000).toLocaleString('es')} mil votos
                  </td>
                  <td className="px-2 py-1.5">{t.maxAttempts}</td>
                  <td className="px-2 py-1.5">{t.hintSchedule.length}</td>
                  <td className="px-2 py-1.5">
                    {t.winBonus > 0 && <span className="text-hit">+{t.winBonus}</span>}
                    {t.winBonus > 0 && ' / '}
                    <span className="text-red-300">−{t.lossPenalty}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
