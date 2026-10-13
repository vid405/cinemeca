import { BOX_OFFICE_TOLERANCE, SCORE_TOLERANCE, YEAR_TOLERANCE } from '../game/compare';
import { XP_RULES } from '../game/xp';
import { MATCH_BG } from './GuessList';
import { Modal } from './ui';

export function HelpModal({ onClose, maxAttempts, hintSchedule }: { onClose: () => void; maxAttempts: number; hintSchedule: number[] }) {
  return (
    <Modal title="Cómo jugar" onClose={onClose}>
      <div className="space-y-3 text-sm leading-relaxed text-navy-200">
        <p>
          Adivina la película secreta en <b className="text-white">{maxAttempts} intentos</b>. Busca un título y envíalo:
          cada intento se compara con la secreta. Sin límite diario, juega todas las que quieras.
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
            <b className="text-white">Pistas</b>: se desbloquean tras {hintSchedule.join(', ')} intentos.
          </li>
        </ul>
        <p>
          <b className="text-white">XP</b>: {XP_RULES.winBase} por acertar + {XP_RULES.perUnusedAttempt} por cada intento que sobre, −
          {XP_RULES.hintPenalty} por pista. Perder da {XP_RULES.loss} XP de consolación y rendirse {XP_RULES.giveUp}.
        </p>
      </div>
    </Modal>
  );
}
