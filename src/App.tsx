import { useCallback, useMemo, useState } from 'react';
import { hasToken } from './api/tmdb';
import { GameControls, HintList } from './components/GameControls';
import { GuessList } from './components/GuessList';
import { Header } from './components/Header';
import { HelpModal } from './components/HelpModal';
import { Footer } from './components/Footer';
import { ResultPanel } from './components/ResultPanel';
import { SearchBox } from './components/SearchBox';
import { EmptyGuesses, ErrorState, GameSkeleton, MissingToken } from './components/States';
import { StatsModal } from './components/StatsModal';
import { useGame } from './hooks/useGame';
import { cluesMode } from './modes';

type ModalId = 'stats' | 'help' | null;

export default function App() {
  const [modal, setModal] = useState<ModalId>(null);
  const close = useCallback(() => setModal(null), []);
  const configured = hasToken();

  return (
    <div className="flex min-h-dvh flex-col">
      <Header onStats={() => setModal('stats')} onHelp={() => setModal('help')} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4">{configured ? <CluesGame /> : <MissingToken />}</main>
      <Footer />
      {modal === 'stats' && <StatsModal onClose={close} />}
      {modal === 'help' && <HelpModal onClose={close} maxAttempts={cluesMode.maxAttempts} />}
    </div>
  );
}

function CluesGame() {
  const game = useGame(cluesMode);
  const guessedIds = useMemo(() => new Set(game.guesses.map((g) => g.movie.id)), [game.guesses]);

  if (game.status === 'loading') return <GameSkeleton />;
  if (game.status === 'error') return <ErrorState message={game.error ?? ''} onRetry={game.newGame} />;
  if (!game.secret) return null;

  return (
    <div className="space-y-4">
      {game.isOver && game.summary ? (
        <ResultPanel key={game.secret.id} movie={game.secret} summary={game.summary} onNext={game.newGame} />
      ) : (
        <div className="space-y-3">
          <SearchBox onSelect={game.submitGuess} busy={game.submitting} excludeIds={guessedIds} />
          {game.guessError && (
            <p role="alert" className="flex items-center justify-between rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-200">
              {game.guessError}
              <button onClick={game.clearGuessError} className="ml-2 text-red-200/60" aria-label="Descartar">
                ✕
              </button>
            </p>
          )}
          <GameControls
            attempts={game.guesses.length}
            maxAttempts={game.maxAttempts}
            hintsUsed={game.hintsUsed}
            hintsTotal={game.hints.length}
            onHint={game.revealHint}
            onGiveUp={game.giveUp}
            disabled={game.submitting}
          />
        </div>
      )}

      <HintList hints={game.hints} revealed={game.hintsUsed} />
      {game.guesses.length === 0 && !game.isOver ? <EmptyGuesses /> : <GuessList guesses={game.guesses} />}
    </div>
  );
}
