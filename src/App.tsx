import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isConfigured } from './api/tmdb';
import { Footer } from './components/Footer';
import { GameControls, HintList } from './components/GameControls';
import { GuessList } from './components/GuessList';
import { Header } from './components/Header';
import { HelpModal } from './components/HelpModal';
import { HintModal } from './components/HintModal';
import { Home } from './components/Home';
import { Library } from './components/Library';
import { MenuDrawer, type MenuAction } from './components/MenuDrawer';
import { ModeBadge } from './components/ModeBadge';
import { ResultPanel } from './components/ResultPanel';
import { SearchBox } from './components/SearchBox';
import { EmptyGuesses, ErrorState, GameSkeleton, MissingToken } from './components/States';
import { StatsModal } from './components/StatsModal';
import { SyncModal } from './components/SyncModal';
import { Icon } from './components/ui';
import type { GuessResult } from './game/compare';
import type { GameMode } from './game/modes';
import { useGame } from './hooks/useGame';
import { cluesMode, hollywoodMode } from './modes';

type ModalId = 'stats' | 'help' | 'menu' | 'sync' | null;
type View = 'home' | 'play' | 'library';
type PlayableMode = 'clues' | 'hollywood';

const PLAYABLE: Record<PlayableMode, GameMode<GuessResult>> = { clues: cluesMode, hollywood: hollywoodMode };

export default function App() {
  const [modal, setModal] = useState<ModalId>(null);
  // La app abre siempre en Inicio; la partida empieza al elegir un modo.
  const [view, setView] = useState<View>('home');
  const [activeMode, setActiveMode] = useState<PlayableMode>('clues');
  // Modos ya abiertos: siguen montados (ocultos) para no perder la partida en curso.
  const [started, setStarted] = useState<PlayableMode[]>([]);
  const newGameRefs = useRef<Partial<Record<PlayableMode, () => void>>>({});
  const close = useCallback(() => setModal(null), []);
  const configured = isConfigured();

  const play = (mode: PlayableMode = activeMode) => {
    setActiveMode(mode);
    setStarted((s) => (s.includes(mode) ? s : [...s, mode]));
    setView('play');
  };

  const menu: MenuAction[] = [
    { label: 'Inicio', icon: <Icon.home className="h-5 w-5" />, onClick: () => setView('home') },
    { label: 'Jugar · Pistas', icon: <Icon.play className="h-5 w-5" />, onClick: () => play('clues') },
    { label: 'Jugar · Hollywood', icon: <Icon.clapper className="h-5 w-5" />, onClick: () => play('hollywood') },
    ...(started.includes(activeMode)
      ? [
          {
            label: 'Nueva película',
            icon: <Icon.search className="h-5 w-5" />,
            onClick: () => {
              play(activeMode);
              newGameRefs.current[activeMode]?.();
            },
          },
        ]
      : []),
    { label: 'Filmoteca', icon: <Icon.tag className="h-5 w-5" />, onClick: () => setView('library') },
    { label: 'Estadísticas', icon: <Icon.chart className="h-5 w-5" />, onClick: () => setModal('stats') },
    { label: 'Sincronizar', icon: <Icon.users className="h-5 w-5" />, onClick: () => setModal('sync') },
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
      <main className={`mx-auto w-full flex-1 px-4 pt-3 ${view === 'library' ? 'max-w-5xl' : 'max-w-[46rem]'}`}>
        {!configured ? (
          <MissingToken />
        ) : (
          <>
            {view === 'home' && <Home onPlay={play} inProgress={started} onLibrary={() => setView('library')} />}
            {view === 'library' && <Library onPlay={() => play()} />}
            {started.map((id) => (
              <div key={id} hidden={view !== 'play' || activeMode !== id}>
                <GameScreen mode={PLAYABLE[id]} registerNewGame={(fn) => (newGameRefs.current[id] = fn)} />
              </div>
            ))}
          </>
        )}
      </main>
      <Footer />
      {modal === 'menu' && <MenuDrawer actions={menu} onClose={close} />}
      {modal === 'stats' && <StatsModal onClose={close} onSync={() => setModal('sync')} />}
      {modal === 'sync' && <SyncModal onClose={close} />}
      {modal === 'help' && <HelpModal onClose={close} />}
    </div>
  );
}

function GameScreen({ mode, registerNewGame }: { mode: GameMode<GuessResult>; registerNewGame: (fn: () => void) => void }) {
  const game = useGame(mode);
  // El selector de pistas solo se abre cuando el jugador pulsa "Pista".
  const [hintOpen, setHintOpen] = useState(false);
  const closeHints = useCallback(() => setHintOpen(false), []);
  registerNewGame(game.newGame);
  const guessedIds = useMemo(() => new Set(game.guesses.map((g) => g.movie.id)), [game.guesses]);

  useEffect(() => {
    if (game.status !== 'playing') setHintOpen(false);
  }, [game.status]);

  const badge = <ModeBadge mode={mode} rules={game.rules} />;

  if (game.status === 'loading') return <div className="space-y-3">{badge}<GameSkeleton /></div>;
  if (game.status === 'error') return <ErrorState message={game.error ?? ''} onRetry={game.newGame} />;
  if (!game.secret) return null;

  return (
    <div className="space-y-4">
      {badge}
      {game.isOver && game.summary ? (
        <ResultPanel key={game.secret.id} movie={game.secret} summary={game.summary} onNext={game.newGame} />
      ) : (
        <div className="space-y-3">
          <GameControls
            attempts={game.guesses.length}
            maxAttempts={game.maxAttempts}
            hintsUsed={game.hintsUsed}
            hintsTotal={game.hintsTotal}
            hintsRemaining={game.hintsRemaining}
            nextHintIn={game.nextHintIn}
            onHint={() => setHintOpen(true)}
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

      <HintList hints={game.hints} />
      {game.guesses.length === 0 && !game.isOver ? <EmptyGuesses /> : <GuessList guesses={game.guesses} />}

      {hintOpen && (
        <HintModal
          options={game.hintOptions}
          used={game.hints}
          remaining={game.hintsRemaining}
          nextHintIn={game.nextHintIn}
          loading={game.hintLoading}
          error={game.hintError}
          onChoose={async (kind) => {
            // Solo se cierra si la pista se reveló; si falla, el error se ve en la ventana.
            if (await game.revealHint(kind)) closeHints();
          }}
          onClose={() => {
            game.clearHintError();
            closeHints();
          }}
        />
      )}
    </div>
  );
}
