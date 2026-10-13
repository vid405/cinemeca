import { useCallback, useMemo, useRef, useState } from 'react';
import { hasToken } from './api/tmdb';
import { Footer } from './components/Footer';
import { GameControls, HintList } from './components/GameControls';
import { GuessList } from './components/GuessList';
import { Header } from './components/Header';
import { HelpModal } from './components/HelpModal';
import { Home } from './components/Home';
import { MenuDrawer, type MenuAction } from './components/MenuDrawer';
import { ResultPanel } from './components/ResultPanel';
import { SearchBox } from './components/SearchBox';
import { EmptyGuesses, ErrorState, GameSkeleton, MissingToken } from './components/States';
import { StatsModal } from './components/StatsModal';
import { Icon } from './components/ui';
import { useGame } from './hooks/useGame';
import { cluesMode } from './modes';

type ModalId = 'stats' | 'help' | 'menu' | null;
type View = 'home' | 'play';

export default function App() {
  const [modal, setModal] = useState<ModalId>(null);
  const [view, setView] = useState<View>('play');
  const newGameRef = useRef<() => void>(() => {});
  const close = useCallback(() => setModal(null), []);
  const configured = hasToken();
  const play = () => setView('play');

  const menu: MenuAction[] = [
    { label: 'Inicio', icon: <Icon.home className="h-5 w-5" />, onClick: () => setView('home') },
    { label: 'Jugar', icon: <Icon.play className="h-5 w-5" />, onClick: play },
    {
      label: 'Nueva película',
      icon: <Icon.search className="h-5 w-5" />,
      onClick: () => {
        play();
        newGameRef.current();
      },
    },
    { label: 'Estadísticas', icon: <Icon.chart className="h-5 w-5" />, onClick: () => setModal('stats') },
    { label: 'Cómo jugar', icon: <Icon.help className="h-5 w-5" />, onClick: () => setModal('help') },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        onMenu={() => setModal('menu')}
        onHome={() => setView('home')}
        onHelp={() => setModal('help')}
        onProfile={() => setModal('stats')}
      />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-3 sm:pt-6">
        {!configured ? (
          <MissingToken />
        ) : (
          <>
            {view === 'home' && <Home onPlay={play} />}
            {/* La partida sigue montada al ir a Inicio para no perder el progreso. */}
            <div hidden={view !== 'play'}>
              <CluesGame registerNewGame={(fn) => (newGameRef.current = fn)} />
            </div>
          </>
        )}
      </main>
      <Footer />
      {modal === 'menu' && <MenuDrawer actions={menu} onClose={close} />}
      {modal === 'stats' && <StatsModal onClose={close} />}
      {modal === 'help' && (
        <HelpModal onClose={close} maxAttempts={cluesMode.maxAttempts} hintSchedule={cluesMode.hintSchedule} />
      )}
    </div>
  );
}

function CluesGame({ registerNewGame }: { registerNewGame: (fn: () => void) => void }) {
  const game = useGame(cluesMode);
  registerNewGame(game.newGame);
  const guessedIds = useMemo(() => new Set(game.guesses.map((g) => g.movie.id)), [game.guesses]);

  if (game.status === 'loading') return <GameSkeleton />;
  if (game.status === 'error') return <ErrorState message={game.error ?? ''} onRetry={game.newGame} />;
  if (!game.secret) return null;

  return (
    <div className="space-y-5 sm:space-y-7">
      {game.isOver && game.summary ? (
        <ResultPanel key={game.secret.id} movie={game.secret} summary={game.summary} onNext={game.newGame} />
      ) : (
        <div className="space-y-4 sm:space-y-5">
          <GameControls
            attempts={game.guesses.length}
            maxAttempts={game.maxAttempts}
            hintsUsed={game.hintsUsed}
            hintsUnlocked={game.hintsUnlocked}
            hintsTotal={game.hints.length}
            nextHintIn={game.nextHintIn}
            onHint={game.revealHint}
            onGiveUp={game.giveUp}
            disabled={game.submitting}
          />
          <SearchBox onSelect={game.submitGuess} busy={game.submitting} excludeIds={guessedIds} />
          {game.guessError && (
            <p role="alert" className="flex items-center justify-between rounded-xl bg-red-950/60 px-4 py-2.5 text-sm text-red-200">
              {game.guessError}
              <button onClick={game.clearGuessError} className="ml-2 text-red-200/60" aria-label="Descartar">
                <Icon.close className="h-4 w-4" />
              </button>
            </p>
          )}
        </div>
      )}

      <HintList hints={game.hints} revealed={game.hintsUsed} />
      {game.guesses.length === 0 && !game.isOver ? <EmptyGuesses /> : <GuessList guesses={game.guesses} />}
    </div>
  );
}
