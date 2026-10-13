import { RUNTIME_TOLERANCE, YEAR_TOLERANCE } from '../game/compare';
import { XP_RULES } from '../game/xp';
import { MATCH_STYLES } from './GuessList';
import { Modal } from './ui';

export function HelpModal({ onClose, maxAttempts }: { onClose: () => void; maxAttempts: number }) {
  return (
    <Modal title="Cómo jugar" onClose={onClose}>
      <div className="space-y-3 text-sm leading-relaxed text-white/80">
        <p>
          Adivina la película secreta en <b>{maxAttempts} intentos</b>. Busca un título y envíalo: cada intento se
          compara con la secreta. Sin límite diario, juega todas las que quieras.
        </p>
        <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-semibold">
          <span className={`rounded-lg py-2 ${MATCH_STYLES.correct}`}>Coincide</span>
          <span className={`rounded-lg py-2 ${MATCH_STYLES.partial}`}>Parcial</span>
          <span className={`rounded-lg py-2 ${MATCH_STYLES.wrong}`}>No coincide</span>
        </div>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>Año</b>: amarillo si está a ±{YEAR_TOLERANCE} años. ↑ la secreta es más reciente, ↓ más antigua.
          </li>
          <li>
            <b>Duración</b>: amarillo a ±{RUNTIME_TOLERANCE} min. ↑ más larga, ↓ más corta.
          </li>
          <li>
            <b>Géneros</b> y <b>País</b>: verde si son idénticos, amarillo si comparten alguno.
          </li>
          <li>
            <b>Reparto</b> (top 5): amarillo si comparte actores; se muestran los que coinciden.
          </li>
          <li>
            <b>Director</b> e <b>Idioma original</b>: verde o rojo.
          </li>
        </ul>
        <p>
          <b>XP</b>: {XP_RULES.winBase} por acertar + {XP_RULES.perUnusedAttempt} por cada intento que sobre, −
          {XP_RULES.hintPenalty} por pista. Perder da {XP_RULES.loss} XP de consolación y rendirse {XP_RULES.giveUp}.
        </p>
      </div>
    </Modal>
  );
}
