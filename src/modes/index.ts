import type { GameMode, GameModeId } from '../game/modes';
import { cluesMode } from './cluesMode';

/**
 * Registro de modos. Para añadir uno nuevo: implementar GameMode en este
 * directorio (p. ej. blurredFrameMode.ts, emojiMode.ts, timeAttackMode.ts)
 * y añadirlo aquí; la UI de cada modo puede reutilizar useGame.
 */
export const MODES: Partial<Record<GameModeId, GameMode>> = {
  clues: cluesMode,
};

export { cluesMode };
